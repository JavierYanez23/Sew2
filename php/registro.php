<?php
/**
 * registro.php — Registro de usuarios e inicio/cierre de sesión
 * Proyecto: Turismo en La Coruña | UO301366
 * Asignatura: Software y Estándares para la Web 2025/2026
 *
 * Paradigma OOP obligatorio.
 * Gestiona 3 acciones: 'registrar', 'login', 'cerrar' (cerrar sesión).
 */

declare(strict_types=1);

require_once __DIR__ . '/bd.php';

/**
 * Clase GestorUsuarios
 * Encapsula el registro, autenticación y cierre de sesión de usuarios.
 */
class GestorUsuarios
{
    private BaseDatos $bd;
    private string    $accion;
    private array     $errores   = [];
    private array     $mensajes  = [];

    public function __construct()
    {
        session_start();
        $this->bd     = BaseDatos::obtenerInstancia();
        $this->accion = $_GET['accion'] ?? ($_POST['accion'] ?? 'formulario');
    }

    /** Punto de entrada: procesa la acción y renderiza la respuesta. */
    public function ejecutar(): void
    {
        // Procesar acción POST
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            match ($this->accion) {
                'registrar' => $this->procesarRegistro(),
                'login'     => $this->procesarLogin(),
                default     => null,
            };
        }

        // Cerrar sesión
        if ($this->accion === 'cerrar') {
            $this->cerrarSesion();
        }

        $this->renderizarPagina();
    }

    // ── LÓGICA DE NEGOCIO ────────────────────────────────────────

    /** Registra un nuevo usuario en la base de datos. */
    private function procesarRegistro(): void
    {
        $nombre    = trim($_POST['nombre']    ?? '');
        $apellidos = trim($_POST['apellidos'] ?? '');
        $email     = trim($_POST['email']     ?? '');
        $password  = $_POST['password']       ?? '';
        $telefono  = trim($_POST['telefono']  ?? '');

        // Validaciones
        if (empty($nombre))    $this->errores[] = 'El nombre es obligatorio.';
        if (empty($apellidos)) $this->errores[] = 'Los apellidos son obligatorios.';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errores[] = 'El correo electrónico no tiene un formato válido.';
        }
        if (strlen($password) < 8) {
            $this->errores[] = 'La contraseña debe tener al menos 8 caracteres.';
        }

        if (!empty($this->errores)) return;

        // Comprobar si el email ya existe
        $stmt = $this->bd->ejecutar(
            'SELECT id_usuario FROM usuarios WHERE email = :email',
            [':email' => $email]
        );
        if ($stmt->fetch()) {
            $this->errores[] = 'Ya existe una cuenta con ese correo electrónico. Puedes <a href="registro.php?accion=formulario">iniciar sesión</a>.';
            return;
        }

        // Insertar usuario
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $this->bd->ejecutar(
            'INSERT INTO usuarios (nombre, apellidos, email, password_hash, telefono)
             VALUES (:nombre, :apellidos, :email, :hash, :telefono)',
            [
                ':nombre'    => $nombre,
                ':apellidos' => $apellidos,
                ':email'     => $email,
                ':hash'      => $hash,
                ':telefono'  => $telefono ?: null,
            ]
        );

        // Iniciar sesión automáticamente
        $idNuevo = (int)$this->bd->ultimoId();
        $_SESSION['id_usuario'] = $idNuevo;
        $_SESSION['nombre']     = $nombre;
        $_SESSION['email']      = $email;

        $this->mensajes[] = "Cuenta creada correctamente. ¡Bienvenido/a, {$nombre}!";
        $this->accion     = 'ok';
    }

    /** Autentica un usuario existente. */
    private function procesarLogin(): void
    {
        $email    = trim($_POST['email']    ?? '');
        $password = $_POST['password']      ?? '';

        if (empty($email) || empty($password)) {
            $this->errores[] = 'Debes introducir tu correo electrónico y contraseña.';
            return;
        }

        $stmt = $this->bd->ejecutar(
            'SELECT id_usuario, nombre, email, password_hash
             FROM usuarios WHERE email = :email AND activo = 1',
            [':email' => $email]
        );
        $usuario = $stmt->fetch();

        if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
            $this->errores[] = 'Correo electrónico o contraseña incorrectos.';
            return;
        }

        $_SESSION['id_usuario'] = (int)$usuario['id_usuario'];
        $_SESSION['nombre']     = $usuario['nombre'];
        $_SESSION['email']      = $usuario['email'];

        $this->mensajes[] = "Sesión iniciada correctamente. ¡Bienvenido/a, {$usuario['nombre']}!";
        $this->accion     = 'ok';
    }

    /** Cierra la sesión activa y redirige al portal de reservas. */
    private function cerrarSesion(): void
    {
        session_destroy();
        header('Location: reservas.php');
        exit;
    }

    // ── VISTA ────────────────────────────────────────────────────

    private function renderizarPagina(): void
    {
        $logueado = isset($_SESSION['id_usuario']);
        ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro &mdash; Turismo La Coruña</title>
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
      <li>Registro e inicio de sesión</li>
    </ol>
  </nav>

  <main>

    <?php if (!empty($this->mensajes)): ?>
    <section>
      <h2>Resultado</h2>
      <?php foreach ($this->mensajes as $msg): ?>
      <p><?= $msg ?></p>
      <?php endforeach; ?>
      <p><a href="recursos.php">Ver recursos turísticos disponibles</a> &mdash;
         <a href="reservas.php">Volver al portal de reservas</a></p>
    </section>
    <?php elseif ($logueado): ?>
    <section>
      <h2>Sesión activa</h2>
      <p>Ya has iniciado sesión como <strong><?= htmlspecialchars($_SESSION['nombre'], ENT_QUOTES, 'UTF-8') ?></strong>.</p>
      <p><a href="reservas.php">Ir al portal de reservas</a> &mdash;
         <a href="registro.php?accion=cerrar">Cerrar sesión</a></p>
    </section>
    <?php else: ?>

    <!-- Mostrar errores si los hay -->
    <?php if (!empty($this->errores)): ?>
    <section>
      <h2>Errores en el formulario</h2>
      <ul>
        <?php foreach ($this->errores as $error): ?>
        <li><?= $error ?></li>
        <?php endforeach; ?>
      </ul>
    </section>
    <?php endif; ?>

    <!-- Formulario de inicio de sesión -->
    <section>
      <h2>Iniciar sesión</h2>
      <p>Si ya tienes una cuenta, introduce tu correo electrónico y contraseña.</p>
      <form action="registro.php" method="post">
        <input type="hidden" name="accion" value="login">
        <fieldset>
          <legend>Datos de acceso</legend>
          <p>
            <label for="email_login">Correo electrónico</label><br>
            <input type="email" name="email" id="email_login"
                   value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                   required autocomplete="email">
          </p>
          <p>
            <label for="password_login">Contraseña</label><br>
            <input type="password" name="password" id="password_login"
                   required autocomplete="current-password">
          </p>
        </fieldset>
        <p><button type="submit">Iniciar sesión</button></p>
      </form>
    </section>

    <!-- Formulario de registro -->
    <section>
      <h2>Crear una cuenta nueva</h2>
      <p>Si es la primera vez que visitas nuestro portal, regístrate para poder realizar reservas.</p>
      <form action="registro.php" method="post">
        <input type="hidden" name="accion" value="registrar">
        <fieldset>
          <legend>Datos personales</legend>
          <p>
            <label for="nombre">Nombre <abbr title="campo obligatorio">*</abbr></label><br>
            <input type="text" name="nombre" id="nombre"
                   value="<?= htmlspecialchars($_POST['nombre'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                   required autocomplete="given-name" maxlength="80">
          </p>
          <p>
            <label for="apellidos">Apellidos <abbr title="campo obligatorio">*</abbr></label><br>
            <input type="text" name="apellidos" id="apellidos"
                   value="<?= htmlspecialchars($_POST['apellidos'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                   required autocomplete="family-name" maxlength="120">
          </p>
          <p>
            <label for="email_reg">Correo electrónico <abbr title="campo obligatorio">*</abbr></label><br>
            <input type="email" name="email" id="email_reg"
                   value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                   required autocomplete="email" maxlength="160">
          </p>
          <p>
            <label for="password_reg">Contraseña <abbr title="campo obligatorio">*</abbr> (mínimo 8 caracteres)</label><br>
            <input type="password" name="password" id="password_reg"
                   required autocomplete="new-password" minlength="8">
          </p>
          <p>
            <label for="telefono">Teléfono (opcional)</label><br>
            <input type="tel" name="telefono" id="telefono"
                   value="<?= htmlspecialchars($_POST['telefono'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                   autocomplete="tel" maxlength="20">
          </p>
          <p><small>Los campos marcados con <abbr title="campo obligatorio">*</abbr> son obligatorios.</small></p>
        </fieldset>
        <p><button type="submit">Crear cuenta</button></p>
      </form>
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

$gestor = new GestorUsuarios();
$gestor->ejecutar();