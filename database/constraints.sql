-- ============================================================
-- constraints.sql
-- Náutica Botes Inflables SpA — Sistema de Control de Jornada
--
-- Restricciones de integridad e índices de rendimiento.
--
-- NOTA SQLite: las restricciones CHECK de tabla (CHECK de nivel
-- tabla, no de columna) no se pueden agregar con ALTER TABLE.
-- Este archivo documenta todas las restricciones que se aplican
-- inline en nautica_jornada.sql al momento de CREATE TABLE.
-- Los CREATE INDEX sí son statements independientes y se pueden
-- ejecutar en cualquier momento.
-- ============================================================


-- ============================================================
-- RESTRICCIONES POR TABLA
-- (documentadas aquí, aplicadas inline en nautica_jornada.sql)
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
-- UNIQUE (username)
--   No pueden existir dos administradores con el mismo username.


-- ------------------------------------------------------------
-- workers
-- ------------------------------------------------------------
-- FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
--   Registro de auditoría: qué admin modificó por última vez el trabajador.
--   SET NULL si el admin es eliminado.

-- CHECK (rut IS NOT NULL OR dni IS NOT NULL)
--   Todo trabajador debe tener al menos un documento de identidad.
--   Un trabajador chileno puede tener solo rut.
--   Un trabajador extranjero puede tener solo dni.
--   Ambos pueden coexistir.

-- CHECK (rut IS NULL OR rut REGEXP '^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$')
--   Si el RUT está presente, debe tener formato válido chileno.
--   Ejemplos válidos: "12.345.678-9", "9.876.543-K"

-- CHECK (hourly_rate > 0)
--   El valor hora debe ser un número positivo.

-- CHECK (status IN ('ACTIVE', 'INACTIVE'))
--   El estado del trabajador solo acepta estos dos valores.


-- ------------------------------------------------------------
-- attendance_records
-- ------------------------------------------------------------
-- FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE RESTRICT
--   Solo se pueden registrar jornadas de trabajadores existentes.
--   RESTRICT previene borrar trabajadores con historial.

-- UNIQUE (worker_id, date)
--   Un trabajador no puede tener más de un registro por día.

-- CHECK (hourly_rate_snap > 0)
--   El snapshot del valor hora debe ser positivo.

-- CHECK (base_daily_hours_snap > 0)
--   El snapshot de horas base debe ser positivo.

-- CHECK (tolerance_mins_snap >= 0)
--   La tolerancia no puede ser negativa.

-- CHECK (break_minutes IN (0, 30))
--   Solo dos valores válidos: 0 = no tomó colación, 30 = sí tomó colación.

-- CHECK (worked_minutes IS NULL OR worked_minutes >= 0)
--   NULL mientras no se marca salida; positivo o cero después.

-- CHECK (overtime_minutes >= 0)
--   Las horas extra no pueden ser negativas.

-- CHECK (daily_payment IS NULL OR daily_payment >= 0)
--   NULL mientras no se marca salida; positivo o cero después.

-- CHECK (delay_minutes >= 0)
--   Los minutos de atraso no pueden ser negativos.

-- CHECK (status IN ('OPEN', 'CLOSED', 'PENDING'))
--   Estado de la jornada:
--     OPEN = tiene entrada, sin salida (jornada activa)
--     CLOSED = tiene entrada y salida (jornada completada)
--     PENDING = pasó de día sin salida (requiere cierre manual por admin)


-- ------------------------------------------------------------
-- app_config
-- ------------------------------------------------------------
-- CHECK (id = 1)
--   Solo puede existir una fila de configuración.

-- CHECK (base_daily_hours > 0)
--   La jornada base debe ser mayor a cero.

-- CHECK (tolerance_minutes >= 0)
--   La tolerancia de atraso no puede ser negativa.

-- CHECK (onboarding_done IN (0, 1))
--   Booleano SQLite: 0 = onboarding pendiente, 1 = completado.


-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- (estos sí son statements independientes y se ejecutan solos)
-- ============================================================

-- Búsqueda de trabajador por RUT en el panel de marcaje.
-- Índice parcial: solo indexa filas donde rut no es NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_rut
  ON workers (rut)
  WHERE rut IS NOT NULL;

-- Búsqueda de trabajador por DNI en el panel de marcaje.
-- Índice parcial: solo indexa filas donde dni no es NULL.
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
