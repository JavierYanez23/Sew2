
-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS turismo_coruna
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE turismo_coruna;

-- Crear el usuario de la aplicación si no existe y asignarle permisos
CREATE USER IF NOT EXISTS 'DBUSER2026'@'localhost' IDENTIFIED BY 'DBPWD2026';
GRANT ALL PRIVILEGES ON turismo_coruna.* TO 'DBUSER2026'@'localhost';
FLUSH PRIVILEGES;

-- ============================================================
-- TABLA 1: tipos_recurso
-- Catálogo normalizado de tipos de recurso turístico.
-- ============================================================
DROP TABLE IF EXISTS lineas_reserva;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS recursos;
DROP TABLE IF EXISTS tipos_recurso;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE tipos_recurso (
    id_tipo        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(60)     NOT NULL COMMENT 'Nombre del tipo: Museo, Ruta, Restaurante, Hotel, Actividad',
    descripcion    TEXT            NOT NULL,
    PRIMARY KEY (id_tipo),
    UNIQUE KEY uq_tipo_nombre (nombre)
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Catálogo de tipos de recurso turístico';

-- ============================================================
-- TABLA 2: recursos
-- Recursos turísticos disponibles para reservar.
-- ============================================================
CREATE TABLE recursos (
    id_recurso     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_tipo        INT UNSIGNED    NOT NULL COMMENT 'FK → tipos_recurso',
    nombre         VARCHAR(120)    NOT NULL,
    descripcion    TEXT            NOT NULL,
    plazas         SMALLINT UNSIGNED NOT NULL DEFAULT 20 COMMENT 'Capacidad máxima del recurso',
    plazas_libres  SMALLINT UNSIGNED NOT NULL DEFAULT 20 COMMENT 'Plazas disponibles en este momento',
    precio         DECIMAL(8,2)    NOT NULL DEFAULT 0.00 COMMENT 'Precio por persona en euros',
    fecha_inicio   DATETIME        NOT NULL COMMENT 'Fecha y hora de inicio del recurso',
    fecha_fin      DATETIME        NOT NULL COMMENT 'Fecha y hora de finalización del recurso',
    imagen         VARCHAR(200)    DEFAULT NULL COMMENT 'Ruta relativa a la imagen del recurso',
    activo         TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=disponible, 0=suspendido',
    PRIMARY KEY (id_recurso),
    CONSTRAINT fk_recurso_tipo
        FOREIGN KEY (id_tipo) REFERENCES tipos_recurso(id_tipo)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Recursos turísticos reservables de La Coruña';

-- ============================================================
-- TABLA 3: usuarios
-- Usuarios registrados en el sistema de reservas.
-- ============================================================
CREATE TABLE usuarios (
    id_usuario     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(80)     NOT NULL,
    apellidos      VARCHAR(120)    NOT NULL,
    email          VARCHAR(160)    NOT NULL,
    password_hash  VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt de la contraseña',
    telefono       VARCHAR(20)     DEFAULT NULL,
    fecha_registro DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo         TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Usuarios registrados en el sistema de reservas';

-- ============================================================
-- TABLA 4: reservas
-- Cabecera de cada reserva realizada por un usuario.
-- ============================================================
CREATE TABLE reservas (
    id_reserva     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario     INT UNSIGNED    NOT NULL COMMENT 'FK → usuarios',
    fecha_reserva  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado         ENUM('pendiente','confirmada','anulada')
                                   NOT NULL DEFAULT 'confirmada',
    total          DECIMAL(10,2)   NOT NULL DEFAULT 0.00 COMMENT 'Importe total de la reserva en euros',
    observaciones  TEXT            DEFAULT NULL,
    PRIMARY KEY (id_reserva),
    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Cabecera de reservas de recursos turísticos';

-- ============================================================
-- TABLA 5: lineas_reserva
-- Detalle de cada recurso incluido en una reserva.
-- Relación N:M entre reservas y recursos con atributos propios.
-- ============================================================
CREATE TABLE lineas_reserva (
    id_linea       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_reserva     INT UNSIGNED    NOT NULL COMMENT 'FK → reservas',
    id_recurso     INT UNSIGNED    NOT NULL COMMENT 'FK → recursos',
    num_personas   TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Número de personas para este recurso',
    precio_unidad  DECIMAL(8,2)    NOT NULL COMMENT 'Precio por persona en el momento de la reserva',
    subtotal       DECIMAL(10,2)   NOT NULL COMMENT 'num_personas × precio_unidad',
    PRIMARY KEY (id_linea),
    CONSTRAINT fk_linea_reserva
        FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_linea_recurso
        FOREIGN KEY (id_recurso) REFERENCES recursos(id_recurso)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Líneas de detalle de cada reserva';

-- ============================================================
-- ÍNDICES ADICIONALES para mejorar el rendimiento
-- ============================================================
CREATE INDEX idx_reservas_usuario  ON reservas      (id_usuario);
CREATE INDEX idx_reservas_estado   ON reservas      (estado);
CREATE INDEX idx_lineas_reserva    ON lineas_reserva (id_reserva);
CREATE INDEX idx_lineas_recurso    ON lineas_reserva (id_recurso);
CREATE INDEX idx_recursos_tipo     ON recursos       (id_tipo);
CREATE INDEX idx_recursos_fechas   ON recursos       (fecha_inicio, fecha_fin);