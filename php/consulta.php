<?php
/**
 * consulta.php — Listado de reservas del usuario autenticado
 * Proyecto: Turismo en La Coruña | UO301366
 * Asignatura: Software y Estándares para la Web 2025/2026
 *
 * Paradigma OOP obligatorio.
 */

declare(strict_types=1);

require_once __DIR__ . '/bd.php';

/**
 * Clase ConsultaReservas
 * Obtiene y muestra el listado completo de reservas del usuario en sesión,
 * con el detalle de cada línea de reserva.
 */
class ConsultaReservas
{
    private BaseDatos $bd;
    private bool      $logueado;
    private int       $idUsuario;
    private string    $nombreUsuario;

    public function __construct()
    {
        session_start();
        $this->bd            = BaseDatos::obtenerInstancia();
        $this->logueado      = isset($_SESSION['id_usuario']);
        $this->idUsuario     = (int)($_SESSION['id_usuario'] ?? 0);
        $this->nombreUsuario = $_SESSION['nombre'] ?? '';
    }

    /** Obtiene todas las reservas del usuario con sus líneas de detalle. */
    private function obtenerReservas(): array
    {
        if (!$this->logueado) {
            return [];
        }

        $stmt = $this->bd->ejecutar(
            'SELECT r.id_reserva, r.fecha_reserva, r.estado, r.total, r.observaciones,
                    lr.id_linea, lr.num_personas, lr.precio_unidad, lr.subtotal,
                    rec.nombre AS recurso_nombre, rec.fecha_inicio, rec.fecha_fin,
                    t.nombre   AS tipo_nombre
             FROM reservas r
             JOIN lineas_reserva lr ON lr.id_reserva = r.id_reserva
             JOIN recursos       rec ON rec.id_recurso = lr.id_recurso
             JOIN tipos_recurso  t   ON t.id_tipo = rec.id_tipo
             WHERE r.id_usuario = :id_usuario
             ORDER BY r.fecha_reserva DESC, r.id_reserva DESC',
            [':id_usuario' => $this->idUsuario]
        );
        $filas = $stmt->fetchAll();

        // Agrupar líneas por reserva
        $reservas = [];
        foreach ($filas as $fila) {
            $idReserva = (int)$fila['id_reserva'];
            if (!isset($reservas[$idReserva])) {
                $reservas[$idReserva] = [
                    'id_reserva'    => $idReserva,
                    'fecha_reserva' => $fila['fecha_reserva'],
                    'estado'        => $fila['estado'],
                    'total'         => (float)$fila['total'],
                    'observaciones' => $fila['observaciones'],
                    'lineas'        => [],
                ];
            }
            $reservas[$idReserva]['lineas'][] = [
                'recurso_nombre' => $fila['recurso_nombre'],
                'tipo_nombre'    => $fila['tipo_nombre'],
                'fecha_inicio'   => $fila['fecha_inicio'],
                'fecha_fin'      => $fila['fecha_fin'],
                'num_personas'   => (int)$fila['num_personas'],
                'precio_unidad'  => (float)$fila['precio_unidad'],
                'subtotal'       => (float)$fila['subtotal'],
            ];
        }
        return array_values($reservas);
    }

    /** Formatea el estado de la reserva para mostrarlo en la tabla. */
    private function etiquetaEstado(string $estado): string
    {
        return match($estado) {
            'confirmada' => 'Confirmada ',
            'anulada'    => 'Anulada ',
            default      => ucfirst($estado),
        };
    }

    public function renderizar(): void
    {
        $reservas = $this->obtenerReservas();
        ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mis Reservas &mdash; Turismo La Coruña</title>
  <link rel="stylesheet" href="../estilo/estilo.css">
  <link rel="stylesheet" href="../estilo/layout.css">
</head>
<body>

  <header>
    <h1><a href="../index.html">Turismo en La Coruña</a></h1>
  </header>

  <nav aria-label="Menú principal">
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

  <nav aria-label="Ruta de navegación">
    <ol>
      <li><a href="../index.html">Inicio</a></li>
      <li><a href="reservas.php">Reservas</a></li>
      <li>Mis reservas</li>
    </ol>
  </nav>

  <main>

  <?php if (!$this->logueado): ?>
    <section>
      <h2>Acceso restringido</h2>
      <p>Debes <a href="registro.php">iniciar sesión</a> para consultar tus reservas.</p>
    </section>

  <?php elseif (empty($reservas)): ?>
    <section>
      <h2>Mis reservas</h2>
      <p>Hola, <strong><?= htmlspecialchars($this->nombreUsuario, ENT_QUOTES, 'UTF-8') ?></strong>.
         Todavía no tienes ninguna reserva realizada.</p>
      <p><a href="recursos.php">Ver recursos turísticos disponibles</a></p>
    </section>

  <?php else: ?>
    <section>
      <h2>Mis reservas</h2>
      <p>Hola, <strong><?= htmlspecialchars($this->nombreUsuario, ENT_QUOTES, 'UTF-8') ?></strong>.
         Tienes <strong><?= count($reservas) ?></strong> reserva(s) en total.</p>
      <p>
        <a href="recursos.php">Realizar nueva reserva</a> &mdash;
        <a href="anulacion.php">Anular una reserva</a>
      </p>

      <?php foreach ($reservas as $reserva): ?>
      <article>
        <h3>Reserva #<?= $reserva['id_reserva'] ?> &mdash; <?= $this->etiquetaEstado($reserva['estado']) ?></h3>
        <p>Fecha de reserva: <?= htmlspecialchars($reserva['fecha_reserva'], ENT_QUOTES, 'UTF-8') ?></p>

        <table>
          <caption>Detalle de la reserva #<?= $reserva['id_reserva'] ?></caption>
          <thead>
            <tr>
              <th scope="col">Recurso</th>
              <th scope="col">Tipo</th>
              <th scope="col">Periodo</th>
              <th scope="col">Personas</th>
              <th scope="col">Precio/ud.</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($reserva['lineas'] as $linea): ?>
            <tr>
              <th scope="row"><?= htmlspecialchars($linea['recurso_nombre'], ENT_QUOTES, 'UTF-8') ?></th>
              <td><?= htmlspecialchars($linea['tipo_nombre'], ENT_QUOTES, 'UTF-8') ?></td>
              <td><?= htmlspecialchars(substr($linea['fecha_inicio'],0,10), ENT_QUOTES,'UTF-8') ?>
                  al <?= htmlspecialchars(substr($linea['fecha_fin'],0,10), ENT_QUOTES,'UTF-8') ?></td>
              <td><?= $linea['num_personas'] ?></td>
              <td><?= number_format($linea['precio_unidad'], 2) ?> €</td>
              <td><?= number_format($linea['subtotal'], 2) ?> €</td>
            </tr>
            <?php endforeach; ?>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="5">Total reserva</th>
              <td><strong><?= number_format($reserva['total'], 2) ?> €</strong></td>
            </tr>
          </tfoot>
        </table>

        <?php if ($reserva['estado'] === 'confirmada'): ?>
        <p><a href="anulacion.php?id=<?= $reserva['id_reserva'] ?>">Anular esta reserva</a></p>
        <?php endif; ?>
      </article>
      <?php endforeach; ?>
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

$consulta = new ConsultaReservas();
$consulta->renderizar();
