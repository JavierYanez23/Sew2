<?php
declare(strict_types=1);

/**
 * Clase ControladorReservas
 * Gestiona la sesión del usuario y la vista del portal de reservas.
 */
class ControladorReservas
{
    private bool $usuarioLogueado;
    private string $nombreUsuario;

    public function __construct()
    {
        session_start();
        $this->usuarioLogueado = isset($_SESSION['id_usuario']);
        $this->nombreUsuario   = $_SESSION['nombre'] ?? '';
    }

    /** Renderiza la página completa del portal de reservas. */
    public function renderizar(): void
    {
        $this->renderizarCabecera();
        $this->renderizarMain();
        $this->renderizarPie();
    }

    private function renderizarCabecera(): void
    {
        ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservas &mdash; Turismo La Coruña</title>
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
      <li>Reservas</li>
    </ol>
  </nav>
        <?php
    }

    private function renderizarMain(): void
    {
        ?>
  <main>
    <section>
      <h2>Central de Reservas Turísticas</h2>
      <p>
        Bienvenido al sistema de reservas de recursos turísticos de La Coruña.
        Desde aquí puedes gestionar todos los aspectos de tu visita a la provincia.
      </p>

      <?php if ($this->usuarioLogueado): ?>
      <p>Sesión iniciada como <strong><?= htmlspecialchars($this->nombreUsuario, ENT_QUOTES, 'UTF-8') ?></strong>.
         <a href="registro.php?accion=cerrar">Cerrar sesión</a></p>
      <?php else: ?>
      <p>Para realizar reservas debes estar registrado e iniciar sesión.</p>
      <?php endif; ?>
    </section>

    <section>
      <h2>¿Qué deseas hacer?</h2>
      <nav aria-label="Opciones de reservas">
        <ul>
          <?php if (!$this->usuarioLogueado): ?>
          <li>
            <a href="registro.php">Registrarse / Iniciar sesión</a>
            <h5>&mdash; Crea tu cuenta o accede con tu usuario y contraseña.</h5>
          </li>
          <?php endif; ?>
          <li>
            <a href="recursos.php">Ver recursos turísticos disponibles</a>
            <h5>&mdash; Consulta museos, rutas, restaurantes, hoteles y actividades con precios y disponibilidad.</h5>
          </li>
          <?php if ($this->usuarioLogueado): ?>
          <li>
            <a href="consulta.php">Mis reservas</a>
            <h5>&mdash; Consulta el listado de tus reservas activas.</h5>
          </li>
          <li>
            <a href="anulacion.php">Anular una reserva</a>
            <h5>&mdash; Cancela cualquier reserva que hayas realizado.</h5>
          </li>
          <?php else: ?>
          <li>
            <a href="registro.php">Mis reservas</a>
            <h5>&mdash; Inicia sesión para consultar tus reservas.</h5>
          </li>
          <?php endif; ?>
        </ul>
      </nav>
    </section>

    <section>
      <h2>Información importante</h2>
      <ul>
        <li>El precio indicado en cada recurso es <strong>por persona</strong>.</li>
        <li>Puedes reservar varios recursos en una misma sesión.</li>
        <li>Las reservas pueden anularse en cualquier momento desde "Mis reservas".</li>
        <li>Para más información sobre cómo usar el sistema de reservas, consulta la <a href="../ayuda.html">página de ayuda</a>.</li>
      </ul>
    </section>
  </main>
        <?php
    }

    private function renderizarPie(): void
    {
        ?>
  <footer>
    <p>Proyecto Universitario &mdash; Software y Estándares para la Web 2025/2026 &mdash; La Coruña</p>
  </footer>

</body>
</html>
        <?php
    }
}

$controlador = new ControladorReservas();
$controlador->renderizar();
