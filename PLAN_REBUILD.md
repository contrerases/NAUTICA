# Plan de reconstrucción — NÁUTICA Jornada

> Reescritura del núcleo (datos + validación + cálculo + servicios + IPC) **correcta por construcción**, reconectando las vistas actuales y reutilizando la biblioteca de componentes. Producto greenfield (sin migración).
> Fecha: 2026-06-30.

## Decisiones de diseño (cerradas con el usuario)

1. **Atraso = una sola sanción.** El atrasado solo deja de cobrar el tiempo ausente (worked menor). **No** hay descuento adicional `delay×valor`. `delay_minutes` se guarda solo como dato informativo.
2. **Sin turnos nocturnos.** Se rechaza `salida ≤ entrada` con error claro (nunca $0 silencioso).
3. **Historial versionado de tarifa y configuración**, con vigencia por fecha.
4. **Config: cambios vigentes desde el DÍA SIGUIENTE por defecto.** Override "aplicar desde hoy" con alerta. Config inicial vigente de inmediato. A lo más un cambio pendiente (uno nuevo reemplaza al anterior). Pantalla muestra "Corriendo hoy" + "Cambio pendiente (diff)".
5. **Adelantos > sueldo:** se muestra la deuda (líquido negativo), sin arrastre automático.
6. **Dinero en enteros CLP** (nada de `REAL`/float).
7. **Correcciones en meses pasados** permitidas con confirmación + traza de auditoría (uniforme editar/crear).
8. **Alcance extra:** incluir exportación a Excel (HU-13). Multi-admin queda fuera.

## Regla de configuración (semántica exacta)

- La config de una jornada se **congela al marcar ENTRADA** (columnas `*_snap`), tomando la config **vigente en la fecha del turno**.
- Un cambio guardado hoy → `effective_from = mañana` (no afecta hoy ni turnos en curso).
- Override "aplicar desde hoy" → `effective_from = hoy` (con alerta; no toca turnos ya abiertos).
- `getConfigForDate(fecha)` = última versión con `effective_from ≤ fecha`. Versiones con `effective_from > hoy` son "pendientes".
- Cada registro es auditable por su snapshot.

## Arquitectura de capas

```
src/shared/
  utils/     time, money, rut (módulo 11), date (America/Santiago)
  domain/    workday (motor de cálculo PURO, testeable, sin IO)
  types/     contratos front/back
  validators/ Zod (fuente única de validación)
src/backend/
  database/     conexión + schema + init idempotente
  repositories/ SOLO SQL
  services/     Config, Worker, Workday, Payroll, Auth, Report (orquestan dominio+repos)
  ipc/          handlers finos (validan con Zod, delegan al service)
src/frontend/   vistas reconectadas + biblioteca UI (reutilizada)
```

## Modelo de datos

- `users` (admin)
- `workers` (estado ACTIVE/INACTIVE, `hourly_rate` actual, auditoría)
- `worker_rate_history` (worker_id, hourly_rate INT, effective_from)
- `app_config` — puntero de conveniencia; la verdad vive en el historial
- `app_config_history` (effective_from, todos los campos, money INT)
- `attendance_records` (money INT, snapshots por fecha, estados, auditoría de edición)
- `worker_advances` (amount INT, ON DELETE RESTRICT)

## Motor de cálculo (contrato)

`computeWorkday({ entry, exit, breakMinutes, snap }) → { workedMinutes, overtimeMinutes, delayMinutes, basePayment, overtimePayment, dailyPayment }`
- Rechaza `exit ≤ entry`.
- Entrada efectiva (temprana/tolerancia → start); salida efectiva (tolerancia → exit_hour).
- worked = efExit − efEntry − break (rechaza break > presencia).
- base = min(worked, baseDailyMin); extra = max(0, worked − baseDailyMin).
- daily = round(base/60·tarifa) + round(extra/60·tarifa·mult). **Sin penalización de atraso.**
- Todo entero CLP.

## Fases de ejecución

- **Fase 0 — Contratos + motor:** utils (time/money/rut/date), `domain/workday`, tipos, validadores Zod. Arnés de verificación numérica (casos de la auditoría) que debe pasar.
- **Fase 1 — Esquema nuevo:** `schema.sql` (money INT, historiales, CHECKs alineados), seeds mínimos, conexión con init idempotente + config inicial + su primera versión de historial. Descartar `nautica.db` dev.
- **Fase 2 — Repositorios:** worker, rateHistory, config, configHistory, attendance, advance, user. Solo SQL.
- **Fase 3 — Servicios:** ConfigService (vigencia por fecha, pendiente/override), WorkerService (CRUD, baja lógica, historial de tarifa, RUT DV, chequeo ACTIVE), WorkdayService (marcaje/edición con motor + snapshot por fecha + estados + traza), PayrollService (liquidación: unión, deuda, provisional), AuthService, ReportService (Excel).
- **Fase 4 — IPC:** handlers finos con Zod; registrar todos (incl. reportes).
- **Fase 5 — Frontend:** reconectar vistas a los nuevos contratos; validación compartida en formularios; Config con "corriendo hoy / pendiente"; Finanzas con deuda/provisional; fecha con helper único. Reutiliza la biblioteca UI.
- **Fase 6 — Verificación + docs:** typecheck, correr app, checks de flujos, reescribir `REGLAS_DE_NEGOCIO.md` y comentarios del schema.

## Cobertura
Los 36 hallazgos confirmados + HU-13 (Excel) quedan resueltos por diseño (ver tabla de causa-raíz en el informe de auditoría).
