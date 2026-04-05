# Náutica Jornada — Lógica de Negocio

> Documento de especificación técnica de las reglas de negocio del sistema.
> Última actualización: 2026-03-23

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

### Valores por defecto

```javascript
{
  start_hour: '09:00',          // Hora de inicio de jornada
  base_daily_hours: 8,          // Jornada base (extras después de esto)
  tolerance_minutes: 5,         // Tolerancia para atrasos
  onboarding_done: 0            // Primer inicio
}
```

### Reglas

- **Hora de entrada:** Siempre a las **09:00**
- **Tolerancia:** **5 minutos**
  - Si marca entrada entre 09:00 y 09:05 → NO es atraso
  - Si marca entrada a las 09:06 o después → SÍ es atraso
- **Jornada base:** **8 horas**
  - Todo lo que pase de 8 horas trabajadas = horas extras

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

**NO automáticamente.**

El sistema solo **registra** el atraso. El administrador decide si aplicar descuentos o sanciones.

---

## Horas Extras

### Definición

**Horas extras = todo lo que pase de 8 horas trabajadas**

### Cálculo

```
worked_minutes   = (exit_time - entry_time) - break_minutes
overtime_minutes = MAX(0, worked_minutes - base_daily_hours_snap * 60)
normal_minutes   = worked_minutes - overtime_minutes
```

### Valor de la hora extra

**Mismo valor que la hora normal** (sin recargo).

```
pago_total = (worked_minutes / 60) * hourly_rate_snap
```

No se calcula por separado horas normales vs extras.

### Ejemplos

**Jornada sin extras:**
- Trabajado: 8h = 480 min
- Extras: 0 min
- Pago: `(480 / 60) * 5000 = $40.000`

**Jornada con extras:**
- Trabajado: 9h 30min = 570 min
- Extras: 90 min (1h 30min)
- Pago: `(570 / 60) * 5000 = $47.500`

**Jornada corta:**
- Trabajado: 6h = 360 min
- Extras: 0 min
- Pago: `(360 / 60) * 5000 = $30.000` (pago proporcional)

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
2. ✅ **Colación:** Se pregunta al cerrar (0 o 30 min)
3. ✅ **Tolerancia:** 5 minutos desde las 09:00
4. ✅ **Jornada base:** 8 horas (extras después de eso)
5. ✅ **Snapshots:** Preservan valores históricos
6. ✅ **Soft delete:** No borrar físicamente trabajadores
7. ✅ **Validación de RUT:** Formato + dígito verificador
8. ✅ **Un registro por día:** UNIQUE (worker_id, date)
9. ✅ **Jornadas pendientes:** Pasan a PENDING automáticamente
10. ✅ **Solo admin cierra pendientes:** Ingreso manual de salida

---

*Documento técnico para el equipo de desarrollo — Última revisión: 2026-03-23*
