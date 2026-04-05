-- ============================================================
-- schema.sql
-- Náutica Botes Inflables SpA — Sistema de Control de Jornada
--
-- Definición de tablas: columnas y tipos únicamente.
-- Las restricciones CHECK, UNIQUE e índices están en constraints.sql
--
-- NOTA SQLite: las restricciones CHECK de tabla no se pueden
-- agregar con ALTER TABLE después de crear la tabla. Por eso
-- en producción se usa nautica_jornada.sql (schema + constraints
-- combinados inline). Este archivo sirve como referencia clara
-- de la estructura pura sin ruido de validaciones.
-- ============================================================


-- ------------------------------------------------------------
-- users
-- Administradores del sistema con acceso al panel de gestión.
-- La contraseña se almacena como hash bcrypt, nunca en texto plano.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  username      TEXT     NOT NULL,
  password_hash TEXT     NOT NULL,
  created_at    TEXT     NOT NULL DEFAULT (datetime('now', 'localtime'))
);


-- ------------------------------------------------------------
-- workers
-- Trabajadores del taller.
-- Identificación: RUT (chilenos) o DNI/Pasaporte (extranjeros).
-- Al menos uno de los dos campos de documento debe estar presente.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workers (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  name         TEXT     NOT NULL,
  photo        TEXT     DEFAULT NULL,
  rut          TEXT     DEFAULT NULL,   -- "12.345.678-9"
  dni          TEXT     DEFAULT NULL,   -- Pasaporte u otro documento
  hourly_rate  REAL     NOT NULL,       -- Valor hora en CLP
  start_date   TEXT     NOT NULL,       -- "YYYY-MM-DD"
  status       TEXT     NOT NULL DEFAULT 'ACTIVE',

  -- Auditoría
  created_at   TEXT     NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at   TEXT     NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_by   INTEGER  DEFAULT NULL    -- FK → users(id), NULL para registros iniciales
);


-- ------------------------------------------------------------
-- attendance_records
-- Registro de asistencia diaria por trabajador.
-- Ciclo de vida:
--   OPEN → marcó entrada, sin salida (jornada activa del día)
--   CLOSED → marcó entrada y salida (jornada completada)
--   PENDING → pasó de día sin marcar salida (requiere cierre manual)
--
-- INTEGRIDAD HISTÓRICA — campos *_snap:
--   Copian los valores vigentes de workers y app_config en el
--   momento de marcar entrada. Si el valor hora o la configuración
--   cambian en el futuro, los registros pasados no se ven afectados
--   porque los cálculos de salida usan los _snap, no los valores actuales.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
  id                    INTEGER  PRIMARY KEY AUTOINCREMENT,
  worker_id             INTEGER  NOT NULL,

  -- Fecha y horarios (formato HH:MM sin segundos)
  date                  TEXT     NOT NULL,          -- "YYYY-MM-DD"
  entry_time            TEXT     NOT NULL,          -- "HH:MM"
  exit_time             TEXT     DEFAULT NULL,      -- "HH:MM" — NULL hasta marcar salida

  -- Snapshots: copiados al marcar entrada, nunca modificados después
  hourly_rate_snap      REAL     NOT NULL,          -- ← workers.hourly_rate
  start_hour_snap       TEXT     NOT NULL,          -- ← app_config.start_hour "HH:MM"
  tolerance_mins_snap   INTEGER  NOT NULL,
  exit_tolerance_mins_snap INTEGER NOT NULL DEFAULT 15,          -- ← app_config.tolerance_minutes
  base_daily_hours_snap INTEGER  NOT NULL,          -- ← app_config.base_daily_hours
  exit_hour_snap        TEXT     NOT NULL DEFAULT '18:00', -- ← app_config.exit_hour "HH:MM"
  default_break_minutes_snap INTEGER NOT NULL DEFAULT 30, -- ← app_config.default_break_minutes
  overtime_rate_snap REAL  NOT NULL DEFAULT 5000, -- ← app_config.overtime_rate

  -- Colación: se pregunta al cerrar jornada (0 = no tomó, X = sí tomó)
  break_minutes         INTEGER  NOT NULL DEFAULT 0,

  -- Calculados al marcar salida (usando los _snap)
  worked_minutes        INTEGER  DEFAULT NULL,
  overtime_minutes      INTEGER  NOT NULL DEFAULT 0,
  overtime_payment      REAL     NOT NULL DEFAULT 0,
  daily_payment         REAL     DEFAULT NULL,

  -- Atraso respecto a start_hour_snap + tolerance_mins_snap
  delay_minutes         INTEGER  NOT NULL DEFAULT 0,

  -- Estado de la jornada
  status                TEXT     NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'CLOSED' | 'PENDING'

  created_at            TEXT     NOT NULL DEFAULT (datetime('now', 'localtime'))
);


-- ------------------------------------------------------------
-- app_config
-- Configuración global de la aplicación.
-- Fila única — garantizada por restricción en constraints.sql.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_config (
  id                INTEGER  PRIMARY KEY DEFAULT 1,
  start_hour        TEXT     NOT NULL DEFAULT '09:00',  -- "HH:MM"
  exit_hour         TEXT     NOT NULL DEFAULT '18:00',  -- "HH:MM"
  base_daily_hours  REAL     NOT NULL DEFAULT 8.5,
  default_break_minutes INTEGER NOT NULL DEFAULT 30,
  tolerance_minutes INTEGER  NOT NULL DEFAULT 5,
  exit_tolerance_minutes INTEGER NOT NULL DEFAULT 15,        -- 5 minutos de tolerancia
  overtime_rate REAL   NOT NULL DEFAULT 5000,
  onboarding_done   INTEGER  NOT NULL DEFAULT 0         -- 0 = pendiente, 1 = completado
);
