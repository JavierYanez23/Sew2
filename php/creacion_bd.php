<?php
declare(strict_types=1);

/**
 * Clase InstaladorBD
 * Se conecta a MySQL como root y ejecuta el script SQL de creación.
 */
class InstaladorBD
{
    private const HOST_ADMIN     = 'localhost';
    private const USUARIO_ADMIN  = 'root';
    private const PASSWORD_ADMIN = '';
    private const CHARSET        = 'utf8mb4';
    private const ARCHIVO_SQL    = __DIR__ . '/creacion_bd.sql';

    private PDO $pdo;

    public function __construct()
    {
        $dsn = sprintf('mysql:host=%s;charset=%s', self::HOST_ADMIN, self::CHARSET);

        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        try {
            $this->pdo = new PDO($dsn, self::USUARIO_ADMIN, self::PASSWORD_ADMIN, $opciones);
            echo "Conexión a MySQL establecida correctamente.\n";
        } catch (PDOException $e) {
            die("Error al conectar a MySQL: " . $e->getMessage() . "\n");
        }
    }

    /**
     * Lee y ejecuta el script SQL sentencia a sentencia.
     * Se omiten las líneas de comentarios y vacías.
     */
    public function instalar(): void
    {
        if (!file_exists(self::ARCHIVO_SQL)) {
            die("Archivo SQL no encontrado: " . self::ARCHIVO_SQL . "\n");
        }

        $sql       = file_get_contents(self::ARCHIVO_SQL);
        $sentencias = $this->parsearSQL($sql);

        echo "Ejecutando " . count($sentencias) . " sentencias SQL...\n";

        foreach ($sentencias as $i => $sentencia) {
            $sentencia = trim($sentencia);
            if (empty($sentencia)) {
                continue;
            }
            try {
                $this->pdo->exec($sentencia);
                echo "  [" . ($i + 1) . "] OK: " . substr($sentencia, 0, 60) . "...\n";
            } catch (PDOException $e) {
                echo "  [" . ($i + 1) . "] ⚠ Aviso: " . $e->getMessage() . "\n";
            }
        }

        echo "\nBase de datos 'turismo_coruna' instalada correctamente.\n";
        echo "   Usuario: DBUSER2026 | Password: DBPWD2026\n";
        echo "\nAhora ejecuta 'php datos_tablas.php' para cargar los datos de ejemplo.\n";
    }

    /**
     * Divide el contenido SQL en sentencias individuales,
     * ignorando comentarios de bloque y de línea.
     * @return string[]
     */
    private function parsearSQL(string $sql): array
    {
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);

        $partes     = explode(';', $sql);
        $sentencias = [];

        foreach ($partes as $parte) {
            $lineas = explode("\n", $parte);
            $lineasLimpias = array_filter($lineas, static function (string $l): bool {
                return !str_starts_with(trim($l), '--');
            });
            $sentencia = trim(implode("\n", $lineasLimpias));
            if (!empty($sentencia)) {
                $sentencias[] = $sentencia;
            }
        }

        return $sentencias;
    }
}

$instalador = new InstaladorBD();
$instalador->instalar();
