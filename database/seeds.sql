-- ============================================================
-- seeds.sql
-- Náutica Botes Inflables SpA — Sistema de Control de Jornada
--
-- Datos iniciales requeridos para el funcionamiento del sistema.
-- Se ejecuta una sola vez al crear la base de datos.
--
-- OR IGNORE en todos los INSERT para que sea idempotente:
-- ejecutar el archivo más de una vez no genera errores ni
-- duplicados.
-- ============================================================


-- ------------------------------------------------------------
-- Configuración por defecto de la aplicación
-- ------------------------------------------------------------
INSERT OR IGNORE INTO app_config (
  id,
  start_hour,
  exit_hour,
  base_daily_hours,
  default_break_minutes,
  tolerance_minutes,
  overtime_rate,
  onboarding_done
) VALUES (
  1,
  '09:00',  -- Hora de inicio de jornada
  '18:00',  -- Hora oficial de salida
  8.5,      -- Jornada base en horas
  30,       -- Minutos de colación automática
  5,        -- Minutos de tolerancia para atrasos
  5000,     -- Valor por hora extra
  0         -- Onboarding pendiente
);


-- ------------------------------------------------------------
-- NOTA — Administrador por defecto
--
-- El admin inicial NO se inserta aquí porque su contraseña
-- requiere hash bcrypt, que es una operación asíncrona de Node.js
-- y no puede ejecutarse desde SQL puro.
--
-- Se crea automáticamente en AuthService.ensureDefaultAdmin()
-- la primera vez que se inicia la aplicación, si no existe
-- ningún administrador registrado.
--
-- Credenciales iniciales:
--   usuario:    admin
--   contraseña: nautica2024
--
-- El sistema mostrará una alerta en el primer login para
-- solicitar el cambio de contraseña (onboarding_done = 0).
-- ------------------------------------------------------------
