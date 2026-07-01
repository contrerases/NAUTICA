-- ============================================================
-- NÁUTICA Jornada — Esquema de base de datos (reconstrucción)
-- Idempotente: se ejecuta en cada arranque (CREATE ... IF NOT EXISTS).
--
-- Principios:
--  * Dinero SIEMPRE en enteros CLP (sin REAL/float).
--  * Configuración y tarifa VERSIONADAS por fecha de vigencia.
--  * Cada jornada congela su config en columnas *_snap.
--  * Hijos financieros (asistencia, adelantos) con ON DELETE RESTRICT:
--    nunca se borran en cascada silenciosa.
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ── Administradores ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ── Trabajadores ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  photo       TEXT DEFAULT NULL,
  rut         TEXT DEFAULT NULL CHECK (rut IS NULL OR length(rut) > 0),
  dni         TEXT DEFAULT NULL CHECK (dni IS NULL OR length(dni) > 0),
  hourly_rate INTEGER NOT NULL CHECK (hourly_rate > 0),   -- tarifa vigente (CLP entero)
  start_date  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_by  INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  CHECK (rut IS NOT NULL OR dni IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_rut ON workers (rut) WHERE rut IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_dni ON workers (dni) WHERE dni IS NOT NULL;

-- ── Historial de tarifa (valor hora por fecha de vigencia) ─
CREATE TABLE IF NOT EXISTS worker_rate_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id      INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  hourly_rate    INTEGER NOT NULL CHECK (hourly_rate > 0),
  effective_from TEXT NOT NULL,   -- "YYYY-MM-DD"
  created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_rate_worker_date ON worker_rate_history (worker_id, effective_from);

-- ── Configuración versionada ──────────────────────────────
-- La "config vigente para la fecha D" = la versión con mayor effective_from <= D.
-- Versiones con effective_from > hoy son "pendientes".
CREATE TABLE IF NOT EXISTS config_versions (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  start_hour             TEXT NOT NULL,
  exit_hour              TEXT NOT NULL,
  base_daily_hours       REAL NOT NULL CHECK (base_daily_hours > 0),
  default_break_minutes  INTEGER NOT NULL CHECK (default_break_minutes >= 0),
  tolerance_minutes      INTEGER NOT NULL CHECK (tolerance_minutes >= 0),
  exit_tolerance_minutes INTEGER NOT NULL CHECK (exit_tolerance_minutes >= 0),
  overtime_multiplier    REAL NOT NULL CHECK (overtime_multiplier > 0),
  effective_from         TEXT NOT NULL,   -- "YYYY-MM-DD"
  created_at             TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  CHECK (exit_hour > start_hour)
);
CREATE INDEX IF NOT EXISTS idx_config_effective ON config_versions (effective_from);

-- ── Estado global de la app (no versionado) ───────────────
CREATE TABLE IF NOT EXISTS app_state (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  onboarding_done INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_done IN (0, 1))
);

-- ── Registros de asistencia ───────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id     INTEGER NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  date          TEXT NOT NULL,          -- "YYYY-MM-DD"
  entry_time    TEXT NOT NULL,          -- "HH:MM"
  exit_time     TEXT DEFAULT NULL,      -- "HH:MM" o NULL hasta cerrar

  break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),

  -- Calculados al cerrar (NULL/0 mientras está OPEN). Dinero entero.
  worked_minutes   INTEGER DEFAULT NULL CHECK (worked_minutes IS NULL OR worked_minutes >= 0),
  base_minutes     INTEGER DEFAULT NULL CHECK (base_minutes IS NULL OR base_minutes >= 0),
  overtime_minutes INTEGER NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
  base_payment     INTEGER NOT NULL DEFAULT 0 CHECK (base_payment >= 0),
  overtime_payment INTEGER NOT NULL DEFAULT 0 CHECK (overtime_payment >= 0),
  daily_payment    INTEGER DEFAULT NULL CHECK (daily_payment IS NULL OR daily_payment >= 0),
  delay_minutes    INTEGER NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),  -- informativo

  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'PENDING')),

  -- Snapshots congelados al marcar entrada, según la fecha del turno
  hourly_rate_snap         INTEGER NOT NULL CHECK (hourly_rate_snap > 0),
  start_hour_snap          TEXT NOT NULL,
  exit_hour_snap           TEXT NOT NULL,
  tolerance_snap           INTEGER NOT NULL CHECK (tolerance_snap >= 0),
  exit_tolerance_snap      INTEGER NOT NULL CHECK (exit_tolerance_snap >= 0),
  base_daily_minutes_snap  INTEGER NOT NULL CHECK (base_daily_minutes_snap > 0),
  overtime_multiplier_snap REAL NOT NULL CHECK (overtime_multiplier_snap > 0),

  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT NULL,
  updated_by INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records (date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance_records (worker_id);

-- ── Adelantos de dinero ───────────────────────────────────
CREATE TABLE IF NOT EXISTS worker_advances (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id  INTEGER NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  amount     INTEGER NOT NULL CHECK (amount > 0),   -- CLP entero
  date       TEXT NOT NULL,
  notes      TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_advances_date ON worker_advances (date);
CREATE INDEX IF NOT EXISTS idx_advances_worker ON worker_advances (worker_id);
