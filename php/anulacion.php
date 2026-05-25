<?php
/**
 * anulacion.php — Anulación de reservas del usuario autenticado
 * Proyecto: Turismo en La Coruña | UO301366
 * Asignatura: Software y Estándares para la Web 2025/2026
 *
 * Paradigma OOP obligatorio.
 * Flujo: lista reservas confirmadas → confirmación de anulación → procesa anulación.
 */

declare(strict_types=1);

require_once __DIR__ . '/bd.php';

/**
 * Clase AnulacionReservas
 * Permite al usuario anular sus reservas confirmadas.
 * Al anular, devuelve las plazas al recurso turístico.
 */
class AnulacionReservas
{
    private BaseDatos $bd;
    private bool      $logueado;
    private int       $idUsuario;
    private string    $nombreUsuario;
    private array     $errores  = [];
    private array     $mensajes = [];

    public function __construct()
    {
        session_start();
        $this->bd            = BaseDatos::obtenerInstancia();
        $this->logueado      = isset($_SESSION['id_usuario']);
        $this->idUsuario     = (int)($_SESSION['id_usuario'] ?? 0);
        $this->nombreUsuario = $_SESSION['nombre'] ?? '';
    }

    public function ejecutar(): void
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->procesarAnulacion();
        }
        $this->renderizarPagina();
    }

    // ── LÓGICA DE NEGOCIO ────────────────────────────────────────

    /** Procesa la anulación de la reserva indicada en POST[id_reserva]. */
    private function procesarAnulacion(): void
    {
        if (!$this->logueado) {
            $this->errores[] = 'Debes iniciar sesión para anular una reserva.';
            return;
        }

        $idReserva = (int)($_POST['id_reserva'] ?? 0);
        if ($idReserva <= 0) {
            $this->errores[] = 'Identificador de reserva no válido.';
            return;
        }

        // Verificar que la reserva pertenece al usuario y está confirmada
        $stmt = $this->bd->ejecutar(
            'SELECT id_reserva, estado FROM reservas
             WHERE id_reserva = :id AND id_usuario = :uid AND estado = "confirmada"',
            [':id' => $idReserva, ':uid' => $this->idUsuario]
        );
        $reserva = $stmt->fetch();

        if (!$reserva) {
            $this->errores[] = 'La reserva no existe, ya está anulada o no te pertenece.';
            return;
        }

        // Devolver plazas: leer las líneas para saber cuántas plazas reponer
        $stmtLineas = $this->bd->ejecutar(
            'SELECT id_recurso, num_personas FROM lineas_reserva WHERE id_reserva = :id',
            [':id' => $idReserva]
        );
        $lineas = $stmtLineas->fetchAll();

        foreach ($lineas as $linea) {
            $this->bd->ejecutar(
                'UPDATE recursos SET plazas_libres = plazas_libres + :n WHERE id_recurso = :id',
                [':n' => (int)$linea['num_personas'], ':id' => (int)$linea['id_recurso']]
            );
        }

        // Marcar la reserva como anulada
        $this->bd->ejecutar(
            'UPDATE reservas SET estado = "anulada" WHERE id_reserva = :id',
            [':id' => $idReserva]
        );

        $this->mensajes[] = "Reserva #{$idReserva} anulada correctamente. Las plazas han sido liberadas.";
    }

    /** Obtiene las reservas confirmadas del usuario para mostrarlas. */
    private function obtenerReservasConfirmadas(): array
    {
        if (!$this->logueado) return [];

        $stmt = $this->bd->ejecutar(
            'SELECT r.id_reserva, r.fecha_reserva, r.total,
                    GROUP_CONCAT(rec.nombre ORDER BY rec.nombre SEPARATOR ", ") AS recursos
             FROM reservas r
             JOIN lineas_reserva lr  ON lr.id_reserva  = r.id_reserva
             JOIN recursos       rec ON rec.id_recurso = lr.id_recurso
             WHERE r.id_usuario = :uid AND r.estado = "confirmada"
             GROUP BY r.id_reserva
             ORDER BY r.fecha_reserva DESC',
            [':uid' => $this->idUsuario]
        );
        return $stmt->fetchAll();
    }

    // ── VISTA ────────────────────────────────────────────────────

    private function renderizarPagina(): void
    {
        $reservas    = $this->obtenerReservasConfirmadas();
        $idPresel    = (int)($_GET['id'] ?? 0);  // ID preseleccionado desde consulta.php
        ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anular Reserva &mdash; Turismo La Coruña</title>
  <link rel="stylesheet" href="../estilo/estilo.css">
  <link rel="stylesheet" href="../estilo/layout.css">
</head>
<body>

  <header>
    <h1><a href="../index.html">Turismo en La Coruña</a></h1>
  </header>

  <nav>
    <ul>
      <li><a href="../index.html">Inicio</a></li>
      <li><a href="../gastronomia.html">Gastronomía</a></li>
      <li><a href="../rutas.html">Rutas</a></li>
      <li><a href="../meteorologia.html">Meteorología</a></li>
      <li><a href="../juego.html">Juego</a></li>
      <li class="activo"><a href="reservas.php">Reservas</a></li>
      <li><a href="../ayuda.html">Ayuda</a></li>
    </ul>
  </nav>

  <nav>
    <ol>
      <li><a href="../index.html">Inicio</a></li>
      <li><a href="reservas.php">Reservas</a></li>
      <li>Anular reserva</li>
    </ol>
  </nav>

  <main>

  <?php if (!$this->logueado): ?>
    <section>
      <h2>Acceso restringido</h2>
      <p>Debes <a href="registro.php">iniciar sesión</a> para anular reservas.</p>
    </section>

  <?php else: ?>

    <?php if (!empty($this->errores)): ?>
    <section>
      <h2>Errores</h2>
      <ul>
        <?php foreach ($this->errores as $e): ?>
        <li><?= htmlspecialchars($e, ENT_QUOTES, 'UTF-8') ?></li>
        <?php endforeach; ?>
      </ul>
    </section>
    <?php endif; ?>

    <?php if (!empty($this->mensajes)): ?>
    <section>
      <h2>Reserva anulada</h2>
      <?php foreach ($this->mensajes as $m): ?>
      <p><?= htmlspecialchars($m, ENT_QUOTES, 'UTF-8') ?></p>
      <?php endforeach; ?>
      <p>
        <a href="consulta.php">Ver mis reservas</a> &mdash;
        <a href="recursos.php">Realizar nueva reserva</a>
      </p>
    </section>
    <?php endif; ?>

    <section>
      <h2>Anular una reserva</h2>

      <?php if (empty($reservas)): ?>
        <p>No tienes reservas confirmadas que puedas anular.</p>
        <p><a href="consulta.php">Ver historial de reservas</a></p>

      <?php else: ?>
        <p>Selecciona la reserva que deseas anular. Esta acción <strong>no se puede deshacer</strong>.</p>

        <form action="anulacion.php" method="post">
          <fieldset>
            <legend>Reservas confirmadas de <?= htmlspecialchars($this->nombreUsuario, ENT_QUOTES, 'UTF-8') ?></legend>

            <table>
              <caption>Selecciona la reserva a anular</caption>
              <thead>
                <tr>
                  <th scope="col">Seleccionar</th>
                  <th scope="col">Nº Reserva</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Recursos</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($reservas as $r): ?>
                <tr>
                  <td>
                    <input type="radio"
                           name="id_reserva"
                           id="reserva_<?= (int)$r['id_reserva'] ?>"
                           value="<?= (int)$r['id_reserva'] ?>"
                           <?= ($idPresel === (int)$r['id_reserva']) ? 'checked' : '' ?>
                           required>
                  </td>
                  <th scope="row">
                    <label for="reserva_<?= (int)$r['id_reserva'] ?>">#<?= (int)$r['id_reserva'] ?></label>
                  </th>
                  <td><?= htmlspecialchars(substr($r['fecha_reserva'], 0, 16), ENT_QUOTES, 'UTF-8') ?></td>
                  <td><?= htmlspecialchars($r['recursos'], ENT_QUOTES, 'UTF-8') ?></td>
                  <td><?= number_format((float)$r['total'], 2) ?> €</td>
                </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </fieldset>

          <p><button type="submit">Anular reserva seleccionada</button></p>
        </form>
      <?php endif; ?>
    </section>

  <?php endif; ?>

  </main>

  <footer>
    <p>Proyecto Universitario &mdash; Software y Estándares para la Web 2025/2026 &mdash; La Coruña</p>
  </footer>

</body>
</html>
        <?php
    }
}

$anulacion = new AnulacionReservas();
$anulacion->ejecutar();