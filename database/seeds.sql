-- ============================================================
-- seeds.sql
-- Náutica Botes Inflables SpA — Sistema de Control de Jornada
--
-- Datos iniciales y de prueba.
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
  1         -- Marcamos onboarding como 1 para saltarnos el setup en pruebas
);

-- ------------------------------------------------------------
-- Trabajadores Muestra (Casos Bordes y Normales)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO workers (id, name, rut, dni, hourly_rate, start_date, status, created_at, updated_at) VALUES 
(1, 'Carlos Pérez', '12.345.678-9', NULL, 5000, date('now', '-2 years'), 'ACTIVE', datetime('now', '-30 days'), datetime('now')),
(2, 'María González', '18.765.432-1', NULL, 6000, date('now', '-18 months'), 'ACTIVE', datetime('now', '-20 days'), datetime('now')),
(3, 'José Morales', NULL, 'AB123456', 4800, date('now', '-6 months'), 'ACTIVE', datetime('now', '-10 days'), datetime('now')),
(4, 'Ana Silva', '20.111.222-3', NULL, 5500, date('now', '-3 years'), 'ACTIVE', datetime('now', '-5 days'), datetime('now')),
(5, 'Ricardo Despedido', '14.555.666-7', NULL, 4500, date('now', '-1 year'), 'INACTIVE', datetime('now', '-1 month'), datetime('now', '-5 days')),
(6, 'Luis Extranjero Nuevo', NULL, 'XY987654', 4000, date('now', '-2 days'), 'ACTIVE', datetime('now', '-1 day'), datetime('now'));

-- ------------------------------------------------------------
-- Registros de Asistencia Muestra (Diversos Casos)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO attendance_records (id, worker_id, date, entry_time, exit_time, hourly_rate_snap, start_hour_snap, tolerance_mins_snap, exit_tolerance_mins_snap, overtime_multiplier_snap, base_daily_hours_snap, exit_hour_snap, default_break_minutes_snap, overtime_rate_snap, break_minutes, status, worked_minutes, overtime_minutes, overtime_payment, daily_payment, delay_minutes) VALUES

-- 1. CASO NORMAL: Entrada a la hora, salida a la hora (T1) -> Pago Base: 42.500
(1, 1, date('now', 'start of month', '+1 day'), '08:58', '18:00', 5000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 42500, 0),

-- 2. CASO ENTRADA TEMPRANA (SNAP): Llega muy temprano, se le ajusta a las 09:00 (T1) -> Pago Base: 42.500
(2, 1, date('now', 'start of month', '+2 days'), '08:15', '18:00', 5000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 42500, 0),

-- 3. CASO ATRASO + HORA EXTRA: Llega tarde (Atraso 20m) pero compensa saliendo muy tarde. (T2). Gana 6000/hr. -> Base (490m) + H.Extra (60m) - Penalidad
-- Atraso = 20m. Worked = (12.5 hrs) - 30m break = 720m. Overtime = 720 - 510 = 210m.
-- Overtime Pago: (210/60) * (6000*1.5) = 3.5 * 9000 = 31500
-- Base Pago (limitado a 510): (510/60) * 6000 = 51000
-- Penalidad Atraso: (20/60) * 6000 = 2000.  Total: 51000 + 31500 - 2000 = 80500.
(3, 2, date('now', 'start of month', '+1 day'), '09:20', '21:30', 6000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 720, 210, 31500, 80500, 20),

-- 4. CASO SIN COLACIÓN: No tomó colación, trabajó de largo (T2)
-- Entrada 09:00, Salida 18:00, Break 0. Trabajó 540 minutos.
-- Horas Extras: 540 - 510 = 30m. Pago extra = (30/60)*(6000*1.5) = 4500.
-- Base Pago = 51000. Total = 55500.
(4, 2, date('now', 'start of month', '+2 days'), '09:00', '18:00', 6000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 0, 'CLOSED', 540, 30, 4500, 55500, 0),

-- 5. CASO ANOMALÍA - TURNO MUY CORTO: Trabajador se sintió mal y se fue a las 11:00 (T4). Gana 5500/hr.
-- 120 minutos. Base Pago: (120/60) * 5500 = 11000. Cero extras, cero penalidad.
(5, 4, date('now', 'start of month', '+1 day'), '09:00', '11:00', 5500, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 0, 'CLOSED', 120, 0, 0, 11000, 0),

-- 6. CASO HISTÓRICO - MES PASADO CON TARIFA ANTIGUA: Simulando que el trabajador 1 antes ganaba 4000/hr y no 5000.
-- 510 minutos * 4000/hr = 34000
(6, 1, date('now', 'start of month', '-30 days'), '09:00', '18:00', 4000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 34000, 0),

-- 7. CASO TRABAJADOR INACTIVO: Último trabajo del empleado despedido, mes pasado.
(7, 5, date('now', 'start of month', '-10 days'), '09:00', '18:00', 4500, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 38250, 0),

-- 8. CASO ANOMALÍA PENDIENTE: Olvidó marcar salida ayer (T4). Debe figurar como PENDING en los filtros porque es de un día anterior al de "hoy".
(8, 4, date('now', '-1 day'), '09:05', NULL, 5500, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 0, 'OPEN', 0, 0, 0, 0, 5),

-- 9. CASO TURNO ACTIVO HOY NORMAL: T1 Trabajando ahora.
(9, 1, date('now', 'localtime'), '08:52', NULL, 5000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 0, 'OPEN', 0, 0, 0, 0, 0),

-- 10. CASO TURNO ACTIVO HOY CON ATRASO GROSERO: T6 (Nuevo) llegó muy tarde.
(10, 6, date('now', 'localtime'), '11:45', NULL, 4000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 0, 'OPEN', 0, 0, 0, 0, 165),

-- MAS REGISTROS PARA ESTADÍSTICAS MENSUALES --
-- Trabajador 1 completando semana
(11, 1, date('now', 'start of month', '+3 days'), '08:55', '18:00', 5000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 42500, 0),
(12, 1, date('now', 'start of month', '+4 days'), '09:00', '18:00', 5000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 42500, 0),
(13, 1, date('now', 'start of month', '+5 days'), '09:00', '19:00', 5000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 570, 60, 7500, 50000, 0),

-- Trabajador 3 con distintos turnos
(14, 3, date('now', 'start of month', '+1 day'), '09:04', '18:00', 4800, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 40800, 0),
(15, 3, date('now', 'start of month', '+2 days'), '09:12', '18:00', 4800, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 40800, 12),
(16, 3, date('now', 'start of month', '+3 days'), '09:00', '16:00', 4800, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 390, 0, 0, 31200, 0),

-- Trabajador 6 (Nuevo)
(17, 6, date('now', 'start of month', '+6 days'), '08:50', '18:00', 4000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 510, 0, 0, 34000, 0),
(18, 6, date('now', 'start of month', '+7 days'), '08:55', '20:00', 4000, '09:00', 5, 15, 1.5, 8.5, '18:00', 30, 5000, 30, 'CLOSED', 630, 120, 12000, 46000, 0);

-- ------------------------------------------------------------
-- Adelantos de Dinero Muestra (Para probar descuentos de Líquido)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO worker_advances (id, worker_id, amount, date, notes, created_at) VALUES 
-- Múltiples adelantos para T1 este mes
(1, 1, 20000, date('now', 'start of month', '+5 days'), 'Adelanto pasajes', datetime('now', '-5 days')),
(2, 1, 30000, date('now', 'start of month', '+10 days'), 'Adelanto caja compensación', datetime('now', '-2 days')),
-- Adelanto de T2 este mes
(3, 2, 50000, date('now', 'start of month', '+15 days'), 'Adelanto quincena estándar', datetime('now')),
-- Adelanto de mes anterior para T4
(4, 4, 15000, date('now', 'start of month', '-15 days'), 'Adelanto mes pasado', datetime('now', '-18 days'));

