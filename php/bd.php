<?php
declare(strict_types=1);

class BaseDatos
{
    private const HOST     = 'localhost';
    private const DBNAME   = 'turismo_coruna';
    private const USUARIO  = 'DBUSER2026';
    private const PASSWORD = 'DBPWD2026';
    private const CHARSET  = 'utf8mb4';
    private static ?BaseDatos $instancia = null;
    private PDO $pdo;

    /**
     * Constructor privado: crea la conexión PDO.
     * @throws RuntimeException Si no se puede conectar a la BD.
     */
    private function __construct()
    {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            self::HOST,
            self::DBNAME,
            self::CHARSET
        );

        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, self::USUARIO, self::PASSWORD, $opciones);
        } catch (PDOException $e) {
            throw new RuntimeException(
                'Error de conexión a la base de datos: ' . $e->getMessage()
            );
        }
    }

    /**
     * Devuelve la instancia única de BaseDatos.
     * @return BaseDatos
     */
    public static function obtenerInstancia(): BaseDatos
    {
        if (self::$instancia === null) {
            self::$instancia = new BaseDatos();
        }
        return self::$instancia;
    }

    /**
     * Devuelve el objeto PDO para ejecutar consultas.
     * @return PDO
     */
    public function obtenerPDO(): PDO
    {
        return $this->pdo;
    }

    /**
     * Ejecuta una consulta preparada y devuelve el PDOStatement.
     * @param string $sql    Consulta SQL con marcadores de posición
     * @param array  $params Parámetros para la consulta preparada
     * @return PDOStatement
     */
    public function ejecutar(string $sql, array $params = []): PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Devuelve el ID del último registro insertado.
     * @return string
     */
    public function ultimoId(): string
    {
        return $this->pdo->lastInsertId();
    }

    /** Evitar clonación*/
    private function __clone() {}


}
