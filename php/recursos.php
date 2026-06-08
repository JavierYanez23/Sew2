<?php
declare(strict_types=1);

require_once __DIR__ . '/bd.php';

/**
 * Clase GestorRecursos
 * Muestra los recursos disponibles y gestiona el proceso de reserva:
 * selección → presupuesto → confirmación.
 */
class GestorRecursos
{
    private BaseDatos $bd;
    private string    $accion;
    private bool      $logueado;
    private int       $idUsuario;
    private array     $errores  = [];
    private array     $mensajes = [];

    public function __construct()
    {
        session_start();
        $this->bd        = BaseDatos::obtenerInstancia();
        $this->accion    = $_GET['accion'] ?? ($_POST['accion'] ?? 'listado');
        $this->logueado  = isset($_SESSION['id_usuario']);
        $this->idUsuario = (int)($_SESSION['id_usuario'] ?? 0);
    }

    public function ejecutar(): void
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && $this->accion === 'confirmar') {
            $this->procesarReserva();
        }
        $this->renderizarPagina();
    }

    /** Obtiene todos los recursos activos ordenados por tipo. */
    private function obtenerRecursos(): array
    {
        $stmt = $this->bd->ejecutar(
            'SELECT r.id_recurso, r.nombre, r.descripcion, r.plazas_libres,
                    r.precio, r.fecha_inicio, r.fecha_fin, r.imagen,
                    t.nombre AS tipo
             FROM recursos r
             JOIN tipos_recurso t ON r.id_tipo = t.id_tipo
             WHERE r.activo = 1 AND r.fecha_fin >= NOW()
             ORDER BY t.nombre, r.nombre'
        );
        return $stmt->fetchAll();
    }

    /** Obtiene un recurso concreto por su ID. */
    private function obtenerRecurso(int $idRecurso): ?array
    {
        $stmt = $this->bd->ejecutar(
            'SELECT r.id_recurso, r.nombre, r.descripcion, r.plazas_libres,
                    r.precio, r.fecha_inicio, r.fecha_fin, r.imagen,
                    t.nombre AS tipo
             FROM recursos r
             JOIN tipos_recurso t ON r.id_tipo = t.id_tipo
             WHERE r.id_recurso = :id AND r.activo = 1',
            [':id' => $idRecurso]
        );
        $resultado = $stmt->fetch();
        return $resultado ?: null;
    }

    /** Confirma y persiste la reserva en la base de datos. */
    private function procesarReserva(): void
    {
        if (!$this->logueado) {
            $this->errores[] = 'Debes iniciar sesión para realizar una reserva.';
            return;
        }

        $idRecurso   = (int)($_POST['id_recurso']   ?? 0);
        $numPersonas = (int)($_POST['num_personas'] ?? 1);

        if ($idRecurso <= 0 || $numPersonas <= 0) {
            $this->errores[] = 'Datos de reserva no válidos.';
            return;
        }

        $recurso = $this->obtenerRecurso($idRecurso);
        if (!$recurso) {
            $this->errores[] = 'El recurso turístico seleccionado no existe o no está disponible.';
            return;
        }

        if ($numPersonas > $recurso['plazas_libres']) {
            $this->errores[] = "Solo quedan {$recurso['plazas_libres']} plazas disponibles.";
            return;
        }

        $precioUnidad = (float)$recurso['precio'];
        $subtotal     = $precioUnidad * $numPersonas;

        $this->bd->ejecutar(
            'INSERT INTO reservas (id_usuario, total, estado)
             VALUES (:id_usuario, :total, "confirmada")',
            [':id_usuario' => $this->idUsuario, ':total' => $subtotal]
        );
        $idReserva = (int)$this->bd->ultimoId();

        $this->bd->ejecutar(
            'INSERT INTO lineas_reserva (id_reserva, id_recurso, num_personas, precio_unidad, subtotal)
             VALUES (:id_reserva, :id_recurso, :num_personas, :precio_unidad, :subtotal)',
            [
                ':id_reserva'    => $idReserva,
                ':id_recurso'    => $idRecurso,
                ':num_personas'  => $numPersonas,
                ':precio_unidad' => $precioUnidad,
                ':subtotal'      => $subtotal,
            ]
        );

        $this->bd->ejecutar(
            'UPDATE recursos SET plazas_libres = plazas_libres - :n WHERE id_recurso = :id',
            [':n' => $numPersonas, ':id' => $idRecurso]
        );

        $this->mensajes[] = "Reserva #{$idReserva} confirmada correctamente. Total: " . number_format($subtotal, 2) . ' €.';
        $this->accion     = 'ok';
    }


    private function renderizarPagina(): void
    {
        $recursos    = $this->obtenerRecursos();
        $idRecurso   = (int)($_GET['id'] ?? 0);
        $recurso     = ($idRecurso > 0) ? $this->obtenerRecurso($idRecurso) : null;
        $numPersonas = max(1, (int)($_POST['num_personas'] ?? $_GET['personas'] ?? 1));
        ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recursos Turísticos &mdash; Turismo La Coruña</title>
  <meta name="author" content="Javier" />
  <meta name="description" content="Página de recursos turísticos del proyecto Turismo en La Coruña" />
  <meta name="keywords" content="Turismo, La Coruña, recursos, atracciones, lugares" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" type="text/css" href="../estilo/estilo.css" />
  <link rel="stylesheet" type="text/css" href="../estilo/layout.css" />
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
      <li>Recursos turísticos</li>
    </ol>
  </nav>

  <main>

  <?php if (!empty($this->errores)): ?>
    <section>
      <h2>Errores</h2>
      <ul>
        <?php foreach ($this->errores as $e): ?><li><?= htmlspecialchars($e, ENT_QUOTES, 'UTF-8') ?></li><?php endforeach; ?>
      </ul>
    </section>
  <?php endif; ?>

  <?php if (!empty($this->mensajes)): ?>
    <section>
      <h2>Reserva confirmada</h2>
      <?php foreach ($this->mensajes as $m): ?><p><?= htmlspecialchars($m, ENT_QUOTES, 'UTF-8') ?></p><?php endforeach; ?>
      <p>
        <a href="consulta.php">Ver mis reservas</a> &mdash;
        <a href="recursos.php">Reservar otro recurso</a>
      </p>
    </section>

  <?php elseif ($recurso && in_array($this->accion, ['presupuesto', 'confirmar'], true)): ?>
    <!-- PASO 2: Presupuesto y confirmación -->
    <section>
      <h2>Presupuesto de la reserva</h2>
      <table>
        <caption>Detalle del presupuesto para: <?= htmlspecialchars($recurso['nombre'], ENT_QUOTES, 'UTF-8') ?></caption>
        <thead>
          <tr>
            <th scope="col">Concepto</th>
            <th scope="col">Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Recurso</th>
            <td><?= htmlspecialchars($recurso['nombre'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <tr>
            <th scope="row">Tipo</th>
            <td><?= htmlspecialchars($recurso['tipo'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <tr>
            <th scope="row">Fecha de inicio</th>
            <td><?= htmlspecialchars($recurso['fecha_inicio'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <tr>
            <th scope="row">Fecha de fin</th>
            <td><?= htmlspecialchars($recurso['fecha_fin'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <tr>
            <th scope="row">Precio por persona</th>
            <td><?= number_format((float)$recurso['precio'], 2) ?> €</td>
          </tr>
          <tr>
            <th scope="row">Número de personas</th>
            <td><?= $numPersonas ?></td>
          </tr>
          <tr>
            <th scope="row">Total estimado</th>
            <td><strong><?= number_format((float)$recurso['precio'] * $numPersonas, 2) ?> €</strong></td>
          </tr>
        </tbody>
      </table>

      <?php if (!$this->logueado): ?>
      <p><strong>Debes <a href="registro.php">iniciar sesión</a> para confirmar la reserva.</strong></p>
      <?php else: ?>
      <form action="recursos.php" method="post">
        <input type="hidden" name="accion"       value="confirmar">
        <input type="hidden" name="id_recurso"   value="<?= $recurso['id_recurso'] ?>">
        <input type="hidden" name="num_personas" value="<?= $numPersonas ?>">
        <p>
          <button type="submit">Confirmar reserva</button>
          <a href="recursos.php">Cancelar</a>
        </p>
      </form>
      <?php endif; ?>
    </section>

  <?php else: ?>
    <!-- PASO 1: Listado de recursos -->
    <section>
      <h2>Recursos turísticos disponibles</h2>
      <p>Selecciona un recurso para obtener el presupuesto y realizar tu reserva.</p>

      <?php if (empty($recursos)): ?>
        <p>No hay recursos turísticos disponibles en este momento.</p>
      <?php else: ?>
      <table>
        <caption>Recursos turísticos de La Coruña disponibles para reservar</caption>
        <thead>
          <tr>
            <th scope="col">Recurso</th>
            <th scope="col">Tipo</th>
            <th scope="col">Precio/persona</th>
            <th scope="col">Plazas libres</th>
            <th scope="col">Periodo</th>
            <th scope="col">Reservar</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($recursos as $r): ?>
          <tr>
            <th scope="row"><?= htmlspecialchars($r['nombre'], ENT_QUOTES, 'UTF-8') ?></th>
            <td><?= htmlspecialchars($r['tipo'], ENT_QUOTES, 'UTF-8') ?></td>
            <td><?= number_format((float)$r['precio'], 2) ?> €</td>
            <td><?= (int)$r['plazas_libres'] ?></td>
            <td>
              <?= htmlspecialchars(substr($r['fecha_inicio'], 0, 10), ENT_QUOTES, 'UTF-8') ?>
              al
              <?= htmlspecialchars(substr($r['fecha_fin'], 0, 10), ENT_QUOTES, 'UTF-8') ?>
            </td>
            <td>
              <?php if ((int)$r['plazas_libres'] > 0): ?>
              <form action="recursos.php" method="get">
                <input type="hidden" name="accion" value="presupuesto">
                <input type="hidden" name="id"     value="<?= (int)$r['id_recurso'] ?>">
                <label for="personas_<?= (int)$r['id_recurso'] ?>">Personas:</label>
                <input type="number" name="personas"
                       id="personas_<?= (int)$r['id_recurso'] ?>"
                       value="1" min="1"
                       max="<?= (int)$r['plazas_libres'] ?>">
                <button type="submit">Ver presupuesto</button>
              </form>
              <?php else: ?>
              <em>Sin plazas</em>
              <?php endif; ?>
            </td>
          </tr>
          <tr>
            <td colspan="6"><?= htmlspecialchars($r['descripcion'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php endif; ?>
    </section>
  <?php endif; ?>

  </main>

</body>
</html>
        <?php
    }
}

$gestor = new GestorRecursos();
$gestor->ejecutar();
