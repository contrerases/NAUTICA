-- ============================================================
-- nautica_jornada.sql
-- Náutica Botes Inflables SpA — Sistema de Control de Jornada
--
-- Base de datos completa: schema + constraints inline + índices + seeds.
-- Archivo único listo para ejecutar.
--
-- Uso:
--   sqlite3 nautica.db < nautica_jornada.sql
--
-- O desde Node.js:
--   const sql = fs.readFileSync('database/nautica_jornada.sql', 'utf-8')
--   db.exec(sql)
-- ============================================================


-- ============================================================
-- 1. PRAGMAS DE CONFIGURACIÓN
-- ============================================================

PRAGMA journal_mode = WAL;       -- Escrituras más rápidas y seguras
PRAGMA foreign_keys = ON;        -- Activar integridad referencial
PRAGMA synchronous = NORMAL;     -- Balance entre seguridad y velocidad


-- ============================================================
-- 2. TABLAS
-- ============================================================


-- ------------------------------------------------------------
-- users
-- Administradores del sistema con acceso al panel de gestión.
-- La contraseña se almacena como hash bcrypt, nunca en texto plano.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  username      TEXT     NOT NULL UNIQUE,
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

  -- RUT formato "12.345.678-9" — trabajadores chilenos
  -- DNI puede ser pasaporte u otro documento — trabajadores extranjeros
  rut          TEXT     DEFAULT NULL
                        CHECK (rut IS NULL OR length(rut) > 0),
  dni          TEXT     DEFAULT NULL
                        CHECK (dni IS NULL OR length(dni) > 0),

  hourly_rate  REAL     NOT NULL
                        CHECK (hourly_rate > 0),
  start_date   TEXT     NOT NULL,                        -- "YYYY-MM-DD"
  status       TEXT     NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'INACTIVE')),

  -- Auditoría
  created_at   TEXT     NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at   TEXT     NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_by   INTEGER  DEFAULT NULL
                        REFERENCES users(id) ON DELETE SET NULL,

  -- Al menos un documento debe estar presente
  CHECK (rut IS NOT NULL OR dni IS NOT NULL)
);


-- ------------------------------------------------------------
-- attendance_records
-- Registro de asistencia diaria por trabajador.
-- Ciclo de vida:
--   OPEN → marcó entrada, sin salida (jornada activa del día)
--   CLOSED → marcó entrada y salida (jornada completada)
--   PENDING → pasó de día sin marcar salida (requiere cierre manual)
--
-- Un solo registro por trabajador por día (UNIQUE).
--
-- INTEGRIDAD HISTÓRICA — campos *_snap:
--   Copian los valores vigentes de workers y app_config en el
--   momento de marcar entrada. Si el valor hora o la configuración
--   cambian en el futuro, los registros pasados no se ven afectados
--   porque todos los cálculos de salida usan los _snap, no los
--   valores actuales de workers o app_config.
--   Una vez escritos, los _snap nunca se modifican.
--
-- Fórmulas de cálculo (al marcar salida):
--   worked_minutes   = (exit_time - entry_time) - break_minutes
--   overtime_minutes = MAX(0, worked_minutes - base_daily_hours_snap * 60)
--   daily_payment    = (worked_minutes / 60) * hourly_rate_snap
--   delay_minutes    = MAX(0, entry_time - (start_hour_snap + tolerance_mins_snap))
--
-- COLACIÓN:
--   Al cerrar jornada se pregunta: ¿Tomaste colación?
--     NO → break_minutes = 0
--     SÍ → break_minutes = 30
--   Horario recomendado: 13:00 o 14:00 (si llegó tarde)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
  id                    INTEGER  PRIMARY KEY AUTOINCREMENT,
  worker_id             INTEGER  NOT NULL
                                 REFERENCES workers(id) ON DELETE RESTRICT,

  -- Fecha y horarios (formato HH:MM sin segundos)
  date                  TEXT     NOT NULL,               -- "YYYY-MM-DD"
  entry_time            TEXT     NOT NULL,               -- "HH:MM"
  exit_time             TEXT     DEFAULT NULL,           -- "HH:MM" — NULL hasta marcar salida

  -- ── Snapshots ─────────────────────────────────────────
  -- Copiados desde workers y app_config al marcar entrada.
  -- Usados en todos los cálculos. Nunca se modifican.
  hourly_rate_snap      REAL     NOT NULL
                                 CHECK (hourly_rate_snap > 0),
  start_hour_snap       TEXT     NOT NULL,               -- "HH:MM"
  tolerance_mins_snap   INTEGER  NOT NULL,
  exit_tolerance_mins_snap INTEGER NOT NULL DEFAULT 15,
  overtime_multiplier_snap REAL NOT NULL DEFAULT 1.5
                                 CHECK (tolerance_mins_snap >= 0),
  base_daily_hours_snap REAL     NOT NULL
                                 CHECK (base_daily_hours_snap > 0),
  exit_hour_snap        TEXT     NOT NULL DEFAULT '18:00',
  default_break_minutes_snap INTEGER NOT NULL DEFAULT 30
                                 CHECK (default_break_minutes_snap >= 0),
  overtime_rate_snap REAL NOT NULL DEFAULT 5000
                                 CHECK (overtime_rate_snap >= 1.0),
  -- ────────────────────────────────────────────────────────

  -- Colación
  break_minutes         INTEGER  NOT NULL DEFAULT 0
                                 CHECK (break_minutes >= 0),

  -- Calculados al marcar salida usando los _snap
  worked_minutes        INTEGER  DEFAULT NULL
                                 CHECK (worked_minutes IS NULL OR worked_minutes >= 0),
  overtime_minutes      INTEGER  NOT NULL DEFAULT 0
                                 CHECK (overtime_minutes >= 0),
  overtime_payment      REAL     NOT NULL DEFAULT 0
                                 CHECK (overtime_payment >= 0),
  daily_payment         REAL     DEFAULT NULL
                                 CHECK (daily_payment IS NULL OR daily_payment >= 0),

  -- Atraso respecto a start_hour_snap + tolerance_mins_snap — 0 si llegó a tiempo
  delay_minutes         INTEGER  NOT NULL DEFAULT 0
                                 CHECK (delay_minutes >= 0),

  -- Estado de la jornada
  status                TEXT     NOT NULL DEFAULT 'OPEN'
                                 CHECK (status IN ('OPEN', 'CLOSED', 'PENDING')),

  created_at            TEXT     NOT NULL DEFAULT (datetime('now', 'localtime')),

  -- Un solo registro por trabajador por día
  UNIQUE (worker_id, date)
);


-- ------------------------------------------------------------
-- app_config
-- Configuración global de la aplicación.
-- Fila única garantizada por CHECK (id = 1).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_config (
  id                INTEGER  PRIMARY KEY DEFAULT 1
                             CHECK (id = 1),

  -- Jornada
  start_hour        TEXT     NOT NULL DEFAULT '09:00',   -- "HH:MM"
  exit_hour         TEXT     NOT NULL DEFAULT '18:00',   -- "HH:MM"
  base_daily_hours  REAL     NOT NULL DEFAULT 8.5
                             CHECK (base_daily_hours > 0),
  default_break_minutes INTEGER NOT NULL DEFAULT 30
                             CHECK (default_break_minutes >= 0),

  -- Atrasos
  tolerance_minutes INTEGER  NOT NULL DEFAULT 5,
  exit_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  overtime_multiplier REAL NOT NULL DEFAULT 1.5
                             CHECK (tolerance_minutes >= 0),
  overtime_rate REAL   NOT NULL DEFAULT 5000
                             CHECK (overtime_rate >= 1.0),

  -- Onboarding
  -- 0 = primer inicio, mostrar pantalla de configuración inicial
  -- 1 = onboarding completado
  onboarding_done   INTEGER  NOT NULL DEFAULT 0
                             CHECK (onboarding_done IN (0, 1))
);


-- ============================================================
-- 3. ÍNDICES
-- ============================================================

-- Búsqueda de trabajador por RUT en el panel de marcaje.
-- Parcial: solo indexa filas donde rut no es NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_rut
  ON workers (rut)
  WHERE rut IS NOT NULL;

-- Búsqueda de trabajador por DNI en el panel de marcaje.
-- Parcial: solo indexa filas donde dni no es NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_dni
  ON workers (dni)
  WHERE dni IS NOT NULL;

-- Login de administrador por username.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
  ON users (username);

-- Registro del día actual por trabajador.
-- Operación más frecuente de la app (panel de marcaje).
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_worker_date
  ON attendance_records (worker_id, date);

-- Consultas de historial y reportes por rango de fechas.
CREATE INDEX IF NOT EXISTS idx_attendance_date
  ON attendance_records (date);

-- Consultas de historial filtradas por trabajador.
CREATE INDEX IF NOT EXISTS idx_attendance_worker
  ON attendance_records (worker_id);


-- ============================================================
-- 4. DATOS INICIALES (SEEDS)
-- ============================================================

-- Configuración por defecto de la aplicación.
-- OR IGNORE: idempotente, se puede ejecutar más de una vez sin error.
INSERT OR IGNORE INTO app_config (
  id,
  start_hour,
  exit_hour,
  base_daily_hours,
  default_break_minutes,
  tolerance_minutes,
  exit_tolerance_minutes,
  overtime_multiplier,
  overtime_rate,
  onboarding_done
) VALUES (
  1,
  '09:00',
  '18:00',
  8.5,
  30,
  5,
  15,
  1.5,
  5000,
  0
);

-- ============================================================

-- FIN — nautica_jornada.sql

-- ------------------------------------------------------------
-- worker_advances
-- Adelantos de dinero para trabajadores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_advances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount REAL NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_worker_advances_date ON worker_advances (date);
CREATE INDEX IF NOT EXISTS idx_worker_advances_worker ON worker_advances (worker_id);
