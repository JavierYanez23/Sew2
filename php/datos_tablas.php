<?php
declare(strict_types=1);

require_once __DIR__ . '/bd.php';

/**
 * Clase CargadorDatos
 * Gestiona la inserción de los datos de ejemplo desde archivos CSV
 * a las tablas de la base de datos.
 */
class CargadorDatos
{
    private BaseDatos $bd;

    private string $directorioCSV;

    public function __construct()
    {
        $this->bd            = BaseDatos::obtenerInstancia();
        $this->directorioCSV = __DIR__;
    }

    /**
     * Ejecuta la carga completa de todos los CSV en orden de dependencia.
     */
    public function cargarTodo(): void
    {
        echo "Iniciando carga de datos de ejemplo...\n";

        $this->cargarTiposRecurso();
        $this->cargarRecursos();
        $this->cargarUsuarios();

        echo "\nCarga de datos completada correctamente.\n";
        echo "   Nota: Las tablas 'reservas' y 'lineas_reserva' se rellenan\n";
        echo "   mediante la aplicación web al realizar reservas.\n";
    }

    /**
     * Carga tipos_recurso.csv → tabla tipos_recurso
     */
    private function cargarTiposRecurso(): void
    {
        $datos = $this->leerCSV('tipos_recurso.csv');
        $insertados = 0;

        foreach ($datos as $fila) {
            try {
                $this->bd->ejecutar(
                    'INSERT IGNORE INTO tipos_recurso (id_tipo, nombre, descripcion)
                     VALUES (:id_tipo, :nombre, :descripcion)',
                    [
                        ':id_tipo'      => (int)$fila['id_tipo'],
                        ':nombre'       => $fila['nombre'],
                        ':descripcion'  => $fila['descripcion'],
                    ]
                );
                $insertados++;
            } catch (RuntimeException $e) {
                echo "  Error en tipos_recurso fila {$fila['id_tipo']}: {$e->getMessage()}\n";
            }
        }
        echo "  → tipos_recurso: {$insertados} filas procesadas\n";
    }

    /**
     * Carga recursos.csv → tabla recursos
     */
    private function cargarRecursos(): void
    {
        $datos = $this->leerCSV('recursos.csv');
        $insertados = 0;

        foreach ($datos as $fila) {
            try {
                $this->bd->ejecutar(
                    'INSERT IGNORE INTO recursos
                        (id_recurso, id_tipo, nombre, descripcion, plazas, plazas_libres,
                         precio, fecha_inicio, fecha_fin, imagen, activo)
                     VALUES
                        (:id_recurso, :id_tipo, :nombre, :descripcion, :plazas, :plazas_libres,
                         :precio, :fecha_inicio, :fecha_fin, :imagen, :activo)',
                    [
                        ':id_recurso'   => (int)$fila['id_recurso'],
                        ':id_tipo'      => (int)$fila['id_tipo'],
                        ':nombre'       => $fila['nombre'],
                        ':descripcion'  => $fila['descripcion'],
                        ':plazas'       => (int)$fila['plazas'],
                        ':plazas_libres'=> (int)$fila['plazas_libres'],
                        ':precio'       => (float)$fila['precio'],
                        ':fecha_inicio' => $fila['fecha_inicio'],
                        ':fecha_fin'    => $fila['fecha_fin'],
                        ':imagen'       => $fila['imagen'] ?: null,
                        ':activo'       => (int)$fila['activo'],
                    ]
                );
                $insertados++;
            } catch (RuntimeException $e) {
                echo "  Error en recursos fila {$fila['id_recurso']}: {$e->getMessage()}\n";
            }
        }
        echo "  → recursos: {$insertados} filas procesadas\n";
    }

    /**
     * Carga usuarios.csv → tabla usuarios
     * Las contraseñas del CSV ya están en formato hash bcrypt.
     */
    private function cargarUsuarios(): void
    {
        $datos = $this->leerCSV('usuarios.csv');
        $insertados = 0;

        foreach ($datos as $fila) {
            try {
                $this->bd->ejecutar(
                    'INSERT IGNORE INTO usuarios
                        (id_usuario, nombre, apellidos, email, password_hash,
                         telefono, fecha_registro, activo)
                     VALUES
                        (:id_usuario, :nombre, :apellidos, :email, :password_hash,
                         :telefono, :fecha_registro, :activo)',
                    [
                        ':id_usuario'     => (int)$fila['id_usuario'],
                        ':nombre'         => $fila['nombre'],
                        ':apellidos'      => $fila['apellidos'],
                        ':email'          => $fila['email'],
                        ':password_hash'  => $fila['password_hash'],
                        ':telefono'       => $fila['telefono'] ?: null,
                        ':fecha_registro' => $fila['fecha_registro'],
                        ':activo'         => (int)$fila['activo'],
                    ]
                );
                $insertados++;
            } catch (RuntimeException $e) {
                echo "  Error en usuarios fila {$fila['id_usuario']}: {$e->getMessage()}\n";
            }
        }
        echo "  → usuarios: {$insertados} filas procesadas\n";
    }

    /**
     * Lee un archivo CSV con cabecera y devuelve un array asociativo.
     * @param  string  $nombreArchivo  Nombre del archivo CSV (sin ruta)
     * @return array<int, array<string, string>>
     * @throws RuntimeException Si el archivo no existe o no se puede leer
     */
    private function leerCSV(string $nombreArchivo): array
    {
        $ruta = $this->directorioCSV . DIRECTORY_SEPARATOR . $nombreArchivo;

        if (!file_exists($ruta)) {
            throw new RuntimeException("Archivo CSV no encontrado: {$ruta}");
        }

        $handle = fopen($ruta, 'r');
        if ($handle === false) {
            throw new RuntimeException("No se pudo abrir el archivo CSV: {$ruta}");
        }

        $filas    = [];
        $cabecera = null;

        while (($linea = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
            if ($cabecera === null) {
                $cabecera = $linea;
                continue;
            }
            if (count($linea) === count($cabecera)) {
                $filas[] = array_combine($cabecera, $linea);
            }
        }

        fclose($handle);
        return $filas;
    }
}

$cargador = new CargadorDatos();
$cargador->cargarTodo();
