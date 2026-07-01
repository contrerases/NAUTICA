# Náutica Jornada — Lógica de Negocio

> Documento de especificación técnica de las reglas de negocio del sistema.
> Sincronizado con la implementación real (repositorios en `src/backend/repositories/`).
> Última actualización: 2026-06-29

---

## 📋 Índice

1. [Configuración Global](#configuración-global)
2. [Gestión de Trabajadores](#gestión-de-trabajadores)
3. [Marcaje de Asistencia](#marcaje-de-asistencia)
4. [Cálculo de Jornada](#cálculo-de-jornada)
5. [Colación](#colación)
6. [Atrasos](#atrasos)
7. [Horas Extras](#horas-extras)
8. [Estados de Jornada](#estados-de-jornada)
9. [Jornadas Pendientes](#jornadas-pendientes)
10. [Validaciones](#validaciones)
11. [Auditoría](#auditoría)

---

## Configuración Global

### Valores por defecto (tabla `app_config`)

```javascript
{
  start_hour: '09:00',           // Hora de inicio de jornada
  exit_hour: '18:00',            // Hora oficial de salida
  base_daily_hours: 8.5,         // Jornada base en horas (extras después de esto)
  default_break_minutes: 30,     // Colación sugerida
  tolerance_minutes: 5,          // Tolerancia de atraso (entrada)
  exit_tolerance_minutes: 15,    // Tolerancia de salida anticipada
  overtime_multiplier: 1.5,      // Recargo de hora extra (×)
  overtime_rate: 5000,           // Tarifa de referencia de hora extra (CLP)
  onboarding_done: 0             // 0 = primer inicio, 1 = configurado
}
```

### Reglas

- **Hora de entrada:** por defecto **09:00** (configurable)
- **Tolerancia de entrada:** **5 minutos**
  - Si marca entrada entre 09:00 y 09:05 → NO es atraso
  - Si marca entrada a las 09:06 o después → SÍ es atraso
- **Tolerancia de salida:** **15 minutos** antes de `exit_hour`
  - Si sale entre 17:45 y 18:00 → se le cuenta como si saliera a las 18:00
- **Jornada base:** **8.5 horas** (510 min)
  - Todo lo que pase de 8.5 horas trabajadas = horas extras
- **Entrada temprana:** si marca antes de `start_hour`, el cálculo de horas
  arranca desde `start_hour` (no se paga el tiempo previo a la jornada).

---

## Gestión de Trabajadores

### Identificación

Cada trabajador debe tener **al menos uno** de estos documentos:

- **RUT** (trabajadores chilenos): formato `12.345.678-9`
- **DNI/Pasaporte** (trabajadores extranjeros): cualquier string no vacío

### Validación de RUT

**Formato válido:** `XX.XXX.XXX-X`

Ejemplos:
- ✅ `12.345.678-9`
- ✅ `9.876.543-K`
- ❌ `12345678-9` (falta puntos)
- ❌ `12.345.678` (falta guión y dígito verificador)

**Implementación:**
1. Validar formato con REGEX en el frontend
2. Validar dígito verificador con algoritmo módulo 11
3. Volver a validar en el backend antes de INSERT

### Soft Delete

- **No se permite borrado físico** de trabajadores con historial
- Usar `status = 'INACTIVE'` para desactivar
- La base de datos tiene `ON DELETE RESTRICT` en attendance_records

### Cambios de valor hora

**Regla:** Los cambios aplican **desde el día siguiente**, no inmediatamente.

**Razón:** El snapshot `hourly_rate_snap` preserva el valor vigente al momento de marcar entrada.

**Ejemplo:**
- Lunes 09:00: Trabajador marca entrada → se guarda `hourly_rate_snap = 5000`
- Lunes 14:00: Admin cambia valor hora a 6000
- Lunes 18:00: Trabajador marca salida → el pago se calcula con 5000 (snapshot)
- Martes 09:00: Trabajador marca entrada → se guarda `hourly_rate_snap = 6000` ✅

### Auditoría

Cada registro de trabajador tiene:
- `created_at`: cuándo se registró
- `updated_at`: última modificación
- `updated_by`: ID del admin que modificó (FK → users.id)

---

## Marcaje de Asistencia

### Formato de horas

**Siempre HH:MM (sin segundos)**

- ✅ `09:00`
- ✅ `18:30`
- ❌ `09:00:00` (no usar segundos)

### Flujo de marcaje

**El sistema detecta automáticamente qué acción corresponde:**

1. **Sin registro hoy** → Botón "MARCAR ENTRADA"
2. **Con entrada, sin salida** → Botón "MARCAR SALIDA"
3. **Con entrada y salida completas** → Mostrar resumen del día

**El trabajador NO elige manualmente** si marca entrada o salida.

### Restricción por día

**Un solo registro por trabajador por día** garantizado por:
```sql
UNIQUE (worker_id, date)
```

Si intenta marcar dos veces, SQLite arrojará error `SQLITE_CONSTRAINT`.

### Protección contra doble clic

**En el frontend (composable):**
- Deshabilitar botón inmediatamente al hacer clic
- Usar un flag `isProcessing` para prevenir llamadas concurrentes
- Mostrar feedback visual (loading spinner)

---

## Cálculo de Jornada

### Fórmula base

```
minutos_totales = exit_time - entry_time
worked_minutes  = minutos_totales - break_minutes
```

### Ejemplo

**Sin colación:**
- Entrada: 09:00
- Salida: 18:00
- Break: 0 min
- Trabajado: 540 min = **9h 0min**

**Con colación:**
- Entrada: 09:00
- Salida: 18:00
- Break: 30 min
- Trabajado: 510 min = **8h 30min**

### Casos límite: Jornada corta

**¿Qué pasa si trabaja menos de 30 minutos?**

Depende de si tomó colación:
- Si NO tomó colación → `break_minutes = 0` → cálculo normal
- Si SÍ tomó colación → `break_minutes = 30` → puede dar resultado negativo ❌

**Validación necesaria:**
```javascript
if (break_minutes === 30 && minutosTotales < 30) {
  throw new Error('Jornada muy corta para haber tomado colación')
}
```

---

## Colación

### Regla actual

**Al cerrar jornada, se pregunta:**
> ¿Tomaste colación de 30 minutos?

- **NO** → `break_minutes = 0`
- **SÍ** → `break_minutes = 30`

### Horario recomendado

- Normalmente: **13:00** (1 PM)
- Si llegó tarde: **14:00** (2 PM)

### Jornadas cortas

**La colación solo aplica en jornadas largas.**

**Recomendación:** Solo permitir marcar "Sí tomé colación" si trabajó más de 4 horas.

```javascript
const minutosTotales = calcularMinutos(exit_time, entry_time)

if (minutosTotales < 240) {
  // Jornada menor a 4 horas
  break_minutes = 0  // No permitir descuento
}
```

### No hay registro de inicio/fin de colación

El sistema **no** marca cuándo empezó y terminó la colación. Solo guarda:
- `break_minutes` = 0 o 30

---

## Atrasos

### Cálculo

```
hora_límite = start_hour_snap + tolerance_mins_snap
delay_minutes = MAX(0, entry_time - hora_límite)
```

### Ejemplos

**Con tolerancia de 5 min (start_hour = 09:00):**

| Hora de entrada | Límite | Atraso |
|----------------|--------|--------|
| 08:55 | 09:05 | 0 min (llegó antes) |
| 09:00 | 09:05 | 0 min (a tiempo) |
| 09:05 | 09:05 | 0 min (en el límite) |
| 09:06 | 09:05 | 1 min ⚠️ |
| 09:15 | 09:05 | 10 min ⚠️ |
| 09:30 | 09:05 | 25 min ⚠️ |

### ¿Se descuenta del pago?

**SÍ.** La implementación actual descuenta los minutos de atraso del pago del día
(penalización), a tarifa hora normal:

```
penalty_pay = (delay_minutes / 60) * hourly_rate_snap
```

`delay_minutes` queda registrado siempre en el historial. El monto se resta del
pago total (`daily_payment`), que nunca baja de 0.

---

## Horas Extras

### Definición

**Horas extras = todo lo que pase de 8.5 horas trabajadas** (`base_daily_hours_snap`).

### Cálculo

```
worked_minutes   = (exit_time - entry_time_efectiva) - break_minutes
base_limit       = base_daily_hours_snap * 60            // 510 min por defecto
overtime_minutes = MAX(0, worked_minutes - base_limit)
base_minutes     = MIN(worked_minutes, base_limit)
```

> `entry_time_efectiva` ajusta la entrada temprana (cuenta desde `start_hour`) y
> la salida anticipada dentro de la tolerancia (cuenta hasta `exit_hour`).

### Valor de la hora extra

**La hora extra tiene recargo `overtime_multiplier` (1.5 por defecto).**

```
base_payment     = (base_minutes / 60) * hourly_rate_snap
overtime_payment = (overtime_minutes / 60) * (hourly_rate_snap * overtime_multiplier_snap)
penalty_pay      = (delay_minutes / 60) * hourly_rate_snap
daily_payment    = MAX(0, base_payment + overtime_payment - penalty_pay)
```

### Ejemplos (hourly_rate = 5000, base 8.5h = 510 min)

**Jornada sin extras:**
- Trabajado: 8.5h = 510 min · sin atraso
- Pago: `(510 / 60) * 5000 = $42.500`

**Jornada con extras:**
- Trabajado: 9.5h = 570 min · extras: 60 min · sin atraso
- Base: `(510/60) * 5000 = 42.500`
- Extra: `(60/60) * (5000 * 1.5) = 7.500`
- Pago: **$50.000**

**Jornada con atraso:**
- Trabajado: 510 min · atraso: 20 min
- Base: `42.500` − Penalización: `(20/60)*5000 ≈ 1.667`
- Pago: **≈ $40.833**

**Jornada corta:**
- Trabajado: 6h = 360 min · sin extras
- Pago: `(360 / 60) * 5000 = $30.000` (proporcional)

---

## Adelantos de Dinero

Los trabajadores pueden recibir adelantos, registrados en la tabla `worker_advances`
(`amount`, `date`, `notes`). No afectan el `daily_payment` de cada jornada: se
**descuentan del líquido a pagar** al consolidar el período en la vista de Finanzas.

```
líquido_período = SUM(daily_payment del período) - SUM(adelantos del período)
```

---

## Estados de Jornada

### Estados posibles

```javascript
type Status = 'OPEN' | 'CLOSED' | 'PENDING'
```

### Ciclo de vida

```
┌──────────────────────────────────────────────────────┐
│                 MARCAR ENTRADA                       │
│  • Crea registro con status = 'OPEN'                │
│  • Guarda snapshots (hourly_rate, start_hour, etc)  │
│  • Calcula delay_minutes                            │
│  • exit_time = NULL                                 │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│              Estado: OPEN                            │
│  • Jornada activa                                   │
│  • Puede marcar salida en cualquier momento         │
└──────────────────────────────────────────────────────┘
                        │
                        ├─────────────────┬──────────────────┐
                        ▼                 ▼                  ▼
            ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐
            │ MARCAR SALIDA   │  │ Medianoche   │  │ Admin cierra   │
            │   (mismo día)   │  │   pasó       │  │  manualmente   │
            └─────────────────┘  └──────────────┘  └────────────────┘
                        │                 │                  │
                        ▼                 ▼                  ▼
            ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐
            │ status=CLOSED   │  │status=PENDING│  │ status=CLOSED  │
            │ (normal)        │  │ (olvidó)     │  │ (manual)       │
            └─────────────────┘  └──────────────┘  └────────────────┘
```

### OPEN (Jornada activa)

- Tiene `entry_time`
- `exit_time = NULL`
- Es del día actual
- Puede marcar salida

### CLOSED (Jornada completada)

- Tiene `entry_time` y `exit_time`
- Todos los cálculos están completos:
  - `worked_minutes`
  - `overtime_minutes`
  - `daily_payment`
  - `break_minutes` (0 o 30)
- No se puede modificar (solo admin)

### PENDING (Requiere atención)

- Tiene `entry_time`
- `exit_time = NULL`
- **Pasó de día** sin marcar salida
- Requiere cierre manual por admin
- El sistema NO cierra automáticamente

---

## Jornadas Pendientes

### ¿Cuándo se marca como PENDING?

**Proceso automático que se ejecuta al iniciar la app cada día:**

```javascript
// Al arrancar la aplicación
async function checkPendingShifts() {
  const today = getCurrentDate() // "YYYY-MM-DD"

  const openShifts = await db.query(`
    SELECT * FROM attendance_records
    WHERE status = 'OPEN'
    AND date < ?
  `, [today])

  for (const shift of openShifts) {
    await db.update(`
      UPDATE attendance_records
      SET status = 'PENDING'
      WHERE id = ?
    `, [shift.id])
  }
}
```

### ¿Cómo se cierra manualmente?

**El admin debe:**
1. Ir a la vista de **Historial** o **Dashboard**
2. Ver la lista de jornadas PENDING
3. Hacer clic en "Completar jornada"
4. Ingresar:
   - Hora de salida (HH:MM)
   - ¿Tomó colación? (Sí/No)
5. El sistema calcula automáticamente:
   - `worked_minutes`
   - `overtime_minutes`
   - `daily_payment`
6. Cambia el estado a `CLOSED`

### Visualización

**Panel de Admin debe mostrar:**
```
⚠️ Jornadas pendientes (3)

Juan Pérez     2026-03-20  09:00  -      PENDIENTE  [Completar]
María López    2026-03-21  08:45  -      PENDIENTE  [Completar]
Carlos Ruiz    2026-03-21  09:10  -      PENDIENTE  [Completar]
```

---

## Validaciones

### Antes de INSERT en workers

```javascript
validateWorker(data) {
  // Al menos un documento
  if (!data.rut && !data.dni) {
    throw new Error('Debe proporcionar RUT o DNI')
  }

  // Validar RUT si está presente
  if (data.rut) {
    if (!validateRutFormat(data.rut)) {
      throw new Error('Formato de RUT inválido (XX.XXX.XXX-X)')
    }
    if (!validateRutCheckDigit(data.rut)) {
      throw new Error('Dígito verificador de RUT inválido')
    }
  }

  // Validar DNI si está presente
  if (data.dni && data.dni.trim().length === 0) {
    throw new Error('DNI no puede estar vacío')
  }

  // Valor hora positivo
  if (data.hourly_rate <= 0) {
    throw new Error('El valor hora debe ser mayor a cero')
  }

  // Fecha válida
  if (!isValidDate(data.start_date)) {
    throw new Error('Fecha de ingreso inválida')
  }
}
```

### Validación de RUT (módulo 11)

```javascript
function validateRutCheckDigit(rut: string): boolean {
  // Remover puntos y guión
  const cleaned = rut.replace(/\./g, '').replace('-', '')
  const body = cleaned.slice(0, -1)
  const digit = cleaned.slice(-1).toUpperCase()

  // Algoritmo módulo 11
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const calculatedDigit = 11 - remainder

  let expectedDigit: string
  if (calculatedDigit === 11) expectedDigit = '0'
  else if (calculatedDigit === 10) expectedDigit = 'K'
  else expectedDigit = calculatedDigit.toString()

  return digit === expectedDigit
}
```

### Antes de INSERT en attendance_records

```javascript
validateEntry(data) {
  // Formato de hora válido
  if (!isValidTimeFormat(data.entry_time)) {
    throw new Error('Formato de hora inválido (HH:MM)')
  }

  // No puede marcar entrada si ya tiene registro del día
  const existing = await db.query(`
    SELECT * FROM attendance_records
    WHERE worker_id = ? AND date = ?
  `, [data.worker_id, data.date])

  if (existing) {
    throw new Error('Ya existe un registro de entrada para hoy')
  }
}
```

### Antes de UPDATE en attendance_records (marcar salida)

```javascript
validateExit(data) {
  // Formato de hora válido
  if (!isValidTimeFormat(data.exit_time)) {
    throw new Error('Formato de hora inválido (HH:MM)')
  }

  // Hora de salida debe ser posterior a entrada
  if (data.exit_time <= data.entry_time) {
    throw new Error('La hora de salida debe ser posterior a la entrada')
  }

  // Si tomó colación, validar que la jornada sea suficientemente larga
  if (data.break_minutes === 30) {
    const totalMinutes = calcularMinutos(data.exit_time, data.entry_time)
    if (totalMinutes < 30) {
      throw new Error('Jornada muy corta para haber tomado colación')
    }
  }
}
```

---

## Auditoría

### Workers

Cada modificación de un trabajador guarda:

```javascript
{
  updated_at: datetime('now', 'localtime'),  // Cuándo se modificó
  updated_by: adminSession.userId            // Qué admin lo modificó
}
```

### Consulta de auditoría

```sql
SELECT
  w.name AS trabajador,
  w.updated_at,
  u.username AS modificado_por
FROM workers w
LEFT JOIN users u ON w.updated_by = u.id
WHERE w.id = ?
```

### Attendance Records

La auditoría es implícita:
- `created_at`: cuándo se marcó entrada
- `status`: refleja el estado actual (OPEN/CLOSED/PENDING)

---

## Resumen de Reglas Críticas

1. ✅ **Formato de horas:** HH:MM (sin segundos)
2. ✅ **Colación:** Se pregunta al cerrar (0 = no tomó, 30 = sí)
3. ✅ **Tolerancia de entrada:** 5 minutos desde las 09:00
4. ✅ **Tolerancia de salida:** 15 minutos antes de las 18:00
5. ✅ **Jornada base:** 8.5 horas (extras después de eso)
6. ✅ **Hora extra con recargo:** ×1.5 (`overtime_multiplier`)
7. ✅ **Atraso descuenta pago:** penalización a tarifa normal
8. ✅ **Adelantos:** se descuentan del líquido del período
9. ✅ **Snapshots:** Preservan valores históricos por registro
10. ✅ **Soft delete:** No borrar físicamente trabajadores con historial
11. ✅ **Validación de RUT:** Formato + dígito verificador (en la app, no en la BD)
12. ✅ **Un registro por día:** UNIQUE (worker_id, date)
13. ✅ **Jornadas pendientes:** Pasan a PENDING / cierre manual por admin

---

*Documento técnico para el equipo de desarrollo — Última revisión: 2026-06-29*
