# NÁUTICA Jornada — Reglas de Negocio y Manual de Uso

> Documento de referencia. Refleja la **implementación reconstruida** (núcleo correcto por diseño).
> Náutica Botes Inflables SpA — control de jornada, horas y sueldos.
> Última actualización: **2026-07-01**.

Verificación automatizada del comportamiento aquí descrito:
- `npm run verify:workday` — motor de cálculo puro (casos numéricos).
- `npm run verify:integration` — servicios + BD real (marcaje, config, liquidación, borrados).

---

## Índice
**Parte 1 — Reglas de Negocio**
1. [Conceptos base](#1-conceptos-base)
2. [Configuración global](#2-configuración-global)
3. [Cómo funciona el cambio de configuración](#3-cómo-funciona-el-cambio-de-configuración)
4. [Integridad histórica: snapshots y versionado](#4-integridad-histórica-snapshots-y-versionado)
5. [Flujo de marcaje y estados](#5-flujo-de-marcaje-y-estados)
6. [Cálculo de horas y del pago diario](#6-cálculo-de-horas-y-del-pago-diario)
7. [Colación](#7-colación)
8. [Atrasos](#8-atrasos)
9. [Adelantos y liquidación](#9-adelantos-y-liquidación)
10. [Casos límite](#10-casos-límite)
11. [Alcance de la versión actual](#11-alcance-de-la-versión-actual)

**Parte 2 — Manual por módulo** → [sección 12](#12-manual-de-uso-por-módulo)

---

# Parte 1 — Reglas de Negocio

## 1. Conceptos base
- **Trabajador:** se identifica con **RUT** (validado con dígito verificador módulo 11) o **DNI/Pasaporte**. Al menos uno.
- **Jornada:** un único registro por trabajador por día (`UNIQUE(worker_id, date)`).
- **Dinero:** enteros CLP en todo el sistema (sin decimales flotantes). El redondeo ocurre en un único punto.
- **Horas:** formato `HH:MM`. Fechas `YYYY-MM-DD`. "Hoy" y el mes en curso se calculan siempre en zona **America/Santiago**.

## 2. Configuración global

| Parámetro | Por defecto | Rango | Qué controla |
|---|---|---|---|
| Hora de inicio | `09:00` | HH:MM | Hora oficial de entrada; base del atraso |
| Hora de salida | `18:00` | HH:MM (> inicio) | Hora oficial de salida; base de la tolerancia de salida |
| Jornada base | `8.5` h | 1–24 | Horas normales; lo que excede es hora extra |
| Colación sugerida | `30` min | 0–120 | Colación propuesta al cerrar |
| Tolerancia de entrada | `5` min | 0–60 | Margen tras el inicio sin atraso |
| Tolerancia de salida | `15` min | 0–60 | Margen antes de la salida que cuenta como jornada completa |
| Recargo hora extra | `1.5` | 1–5 | Multiplicador del valor hora para la hora extra |

> Se eliminó `overtime_rate` (no se usaba). Los rangos de la app (Zod) y de la base de datos (CHECK) están **alineados**, y el multiplicador tiene tope (evita errores de tipeo tipo `150` en vez de `1.5`).

## 3. Cómo funciona el cambio de configuración
- Un cambio guardado hoy entra en vigencia **al día siguiente** por defecto (`applyFrom: 'tomorrow'`). Así **ningún turno del día en curso cambia a mitad de camino** y todo el día usa una sola configuración.
- Override **"aplicar desde hoy"** (`applyFrom: 'today'`) para correcciones o el primer setup, con alerta de que afecta los marcajes de hoy.
- La **config inicial** queda vigente de inmediato el primer día.
- **A lo más un cambio pendiente:** guardar otro lo reemplaza. Se puede **cancelar** el pendiente.
- La pantalla muestra **"Vigente hoy"** y, si existe, el **"Cambio pendiente"** con su fecha de entrada.

## 4. Integridad histórica: snapshots y versionado
- La configuración y la tarifa (valor hora) están **versionadas por fecha** (`config_versions`, `worker_rate_history`).
- Al **marcar entrada**, la jornada **congela** en columnas `*_snap` la config y la tarifa **vigentes en la fecha del turno**. Todos los cálculos usan esos snapshots.
- Consecuencia: los turnos ya iniciados o cerrados **no cambian** ante cambios posteriores; y un **registro retroactivo** (alta manual de una fecha pasada) usa la config y tarifa **de esa fecha**, no las de hoy.

## 5. Flujo de marcaje y estados
El sistema detecta la acción; el trabajador no la elige:
1. Sin registro hoy → **MARCAR ENTRADA**.
2. Con entrada sin salida (`OPEN`) → **MARCAR SALIDA**.
3. Con entrada y salida (`CLOSED`) → resumen del día.

Estados: **OPEN** (activa), **CLOSED** (completa), **PENDING** (reservado). Los turnos `OPEN` de días anteriores se listan como **salidas faltantes** para cierre manual del admin. Marcar entrada exige trabajador **ACTIVO** (validado en el backend, no solo en la UI).

## 6. Cálculo de horas y del pago diario
Todo se calcula con el **motor único** (`src/shared/domain/workday.ts`), usado tanto al marcar salida como al editar → **crear y editar dan el mismo resultado**.

1. Se rechaza `salida ≤ entrada` (no se admiten turnos que cruzan medianoche).
2. **Entrada efectiva:** temprana o dentro de la tolerancia → cuenta desde `start_hour`.
3. **Salida efectiva:** dentro de `[exit_hour − tol_salida, exit_hour]` → cuenta hasta `exit_hour`.
4. `worked = salida_ef − entrada_ef − colación` (se rechaza colación > presencia).
5. `base = min(worked, jornada_base)` ; `extra = max(0, worked − jornada_base)`.
6. **Pago:**
```
pago_base  = redondeo(base/60 × valor_hora)
pago_extra = redondeo(extra/60 × valor_hora × recargo)
pago_día   = pago_base + pago_extra
```
> **El atraso NO se descuenta del pago.** Es una sola sanción: el atrasado ya cobra menos porque trabajó menos. `delay_minutes` se registra solo como información.

### Ejemplos (valor hora $5.000, jornada 8.5 h)
| Caso | Entrada | Salida | Colación | Pago |
|---|---|---|---|---|
| Normal | 08:58 | 18:00 | 30 | **$42.500** |
| Con extra | 09:00 | 19:00 | 30 | 42.500 + 7.500 = **$50.000** |
| Atraso 30 min | 09:30 | 18:00 | 30 | worked 480 → **$40.000** (delay 25 registrado) |
| Salida 17:50 (tolerancia) | 09:00 | 17:50 | 30 | como 18:00 → **$42.500** |
| Corta | 09:00 | 11:00 | 0 | **$10.000** |

## 7. Colación
Al cerrar se pregunta si tomó colación (No = 0, Sí = 30 min por defecto). Se resta del tiempo trabajado. No puede superar la presencia (se rechaza).

## 8. Atrasos
```
delay = max(0, entrada − (inicio + tolerancia))    // solo informativo
```
Queda en el historial pero **no** genera descuento adicional (ver sección 6).

## 9. Adelantos y liquidación
- Adelantos: monto entero (> 0), fecha, nota. No afectan el `daily_payment` de cada jornada.
- La **liquidación mensual** recorre la **unión** de trabajadores con turnos cerrados **y** con adelantos del mes (un adelanto nunca desaparece, aunque el trabajador no tenga turnos cerrados o esté inactivo).
```
líquido = Σ pago_día del mes − Σ adelantos del mes
```
- El líquido **puede ser negativo** (deuda del trabajador) y se muestra como tal, resaltado.
- Si hay turnos del mes sin cerrar, el total se marca **provisional**.

## 10. Casos límite
| Situación | Comportamiento |
|---|---|
| Salida ≤ entrada / turno nocturno | **Rechazado** con error claro (nunca pago $0 silencioso) |
| Colación > presencia | Rechazada con error |
| Turno íntegramente antes del inicio | Rechazado |
| Editar un registro | Recalcula con el **mismo motor** que el cierre → idéntico monto; deja **traza** (quién y cuándo) |
| Corregir/crear en meses pasados | Permitido, con **confirmación y traza de auditoría** |
| Desactivar trabajador | Baja **lógica**: conserva todo el historial |
| Eliminar trabajador | Borrado **físico explícito** (separado, con confirmación): borra sus registros y adelantos en una transacción |
| Adelanto > sueldo del mes | Se muestra la **deuda** (líquido negativo) |
| Cambio de config/tarifa | Afecta marcajes futuros; lo pasado usa su snapshot |
| Marcar entrada de inactivo | Rechazado en el backend |

## 11. Alcance de la versión actual
- ✅ **Exportación a Excel** de la liquidación (HU-13) implementada.
- 🔲 **Turnos nocturnos** (cruce de medianoche): no soportados por diseño (se rechazan).
- 🔲 **Gestión de múltiples administradores:** fuera de alcance (existe login + cambio de contraseña; admin por defecto `admin` / `nautica2024`, cambiar tras instalar).

---

## 12. Manual de uso por módulo

**Roles:** *Trabajador* (kiosco, sin login, solo su día) · *Administrador* (usuario+contraseña, sesión con expiración por inactividad).

| Módulo | Qué puede hacer el admin | Reglas / cuándo |
|---|---|---|
| **Marcaje** (trabajador) | Identificarse (RUT/DNI), marcar entrada/salida, ver su resumen del día | Solo activos; una acción por estado |
| **Acceso** | Login, cambiar contraseña (mín. 6) | — |
| **Dashboard** | Ver KPIs del día y mes, salidas faltantes | Consulta |
| **Trabajadores** | Crear/editar; **Desactivar** (lógica) / **Reactivar**; **Eliminar** (físico, con confirmación); adelantos (agregar/listar/eliminar) | RUT con dígito verificador; valor hora > 0; documento único |
| **Historial** | Consultar, **corregir** un registro, cerrar pendientes, alta manual | Correcciones dejan traza; permitidas en cualquier mes con confirmación |
| **Finanzas** | Liquidación del mes (con deuda y provisional), registrar/eliminar adelantos, **exportar a Excel** | Líquido = sueldos − adelantos |
| **Configuración** | Editar jornada/tolerancias/recargo; elegir "desde hoy/mañana"; cancelar pendiente; cambiar contraseña | Cambios vigentes al día siguiente por defecto |

---

*Documento de referencia interno — Náutica Botes Inflables SpA. Refleja el código a la fecha indicada.*
