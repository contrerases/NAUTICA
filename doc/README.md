# Náutica Botes Inflables SpA
## Sistema de Control de Jornada Laboral

> Aplicación de escritorio para registro de asistencia, cálculo de jornada y gestión de pagos del personal de taller.

---

## Índice

1. [Funcionalidades](#1-funcionalidades)
2. [DevOps](#2-devops)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Modelos de Datos](#4-modelos-de-datos)
5. [Roadmap de Desarrollo](#5-roadmap-de-desarrollo)

---

## 1. Funcionalidades

Las funcionalidades están organizadas en **Épicas** que agrupan historias de usuario relacionadas. Cada historia describe qué hace el sistema, desde la perspectiva de quién lo usa y con qué criterios se considera completa.

---

### ÉPICA 1 — Gestión de Trabajadores

#### HU-01 · Registrar un trabajador
> **Como** administrador, **quiero** registrar trabajadores en el sistema, **para** gestionar su asistencia y pagos individualmente.

| # | Criterio de Aceptación |
|---|---|
| 1 | El formulario requiere nombre completo, valor hora (CLP), fecha de ingreso y estado |
| 2 | Debe tener al menos un documento: RUT **o** DNI/Pasaporte (ambos opcionales, pero al menos uno requerido) |
| 3 | Si se ingresa RUT, el sistema valida formato chileno y dígito verificador |
| 4 | Si se ingresa DNI/Pasaporte, solo se valida que no esté vacío |
| 5 | El valor hora debe ser un número positivo mayor a cero |
| 6 | El sistema confirma visualmente cuando el trabajador es guardado con éxito |
| 7 | Se puede crear más de un trabajador sin límite fijo |

---

#### HU-02 · Editar o desactivar un trabajador
> **Como** administrador, **quiero** editar los datos o desactivar un trabajador, **para** mantener el registro actualizado sin perder historial.

| # | Criterio de Aceptación |
|---|---|
| 1 | Se puede modificar nombre, RUT, DNI, valor hora y fecha de ingreso |
| 2 | Al desactivar, el trabajador deja de aparecer en el panel de marcaje |
| 3 | El historial del trabajador desactivado se conserva íntegro |
| 4 | El cálculo histórico usa el valor hora vigente al momento de cada registro (no el actual) |

---

### ÉPICA 2 — Roles y Acceso

#### HU-03 · Acceso de administrador
> **Como** administrador, **quiero** iniciar sesión con usuario y contraseña, **para** acceder al panel de gestión de forma segura.

| # | Criterio de Aceptación |
|---|---|
| 1 | Existe un botón discreto en la pantalla principal para acceder al panel de administración |
| 2 | El acceso requiere usuario y contraseña válidos |
| 3 | Puede existir más de un administrador en el sistema |
| 4 | Un administrador puede crear, editar y eliminar otros administradores |
| 5 | Las contraseñas se almacenan hasheadas con bcrypt (nunca en texto plano) |
| 6 | La sesión expira automáticamente tras 30 minutos de inactividad |

**Permisos exclusivos del rol Admin:**
- Ver historial y estadísticas de todos los trabajadores
- Editar o corregir registros de asistencia
- Gestionar trabajadores (crear, editar, desactivar)
- Configurar tolerancia de atraso y hora de inicio de jornada
- Exportar reportes a Excel

---

#### HU-04 · Identificación del trabajador en el panel de marcaje
> **Como** trabajador, **quiero** identificarme con mi documento sin contraseña, **para** marcar asistencia de forma rápida.

| # | Criterio de Aceptación |
|---|---|
| 1 | La pantalla muestra selector de tipo de documento (RUT / DNI-Pasaporte) y campo de ingreso |
| 2 | Al ingresar el documento, el sistema muestra el nombre del trabajador como confirmación |
| 3 | Si el documento no corresponde a ningún trabajador activo, se muestra error claro |
| 4 | El trabajador solo puede ver su propio resumen del día |

---

### ÉPICA 3 — Registro de Asistencia

#### HU-05 · Flujo de marcaje inteligente
> **Como** trabajador, **quiero** que el sistema detecte automáticamente si debo marcar entrada o salida, **para** no cometer errores.

| # | Criterio de Aceptación |
|---|---|
| 1 | Sin entrada registrada hoy → muestra botón **MARCAR ENTRADA** |
| 2 | Con entrada pero sin salida → muestra botón **MARCAR SALIDA** |
| 3 | Con entrada y salida → muestra resumen del día, sin opciones de marcaje |
| 4 | El trabajador no elige la acción manualmente; el sistema la determina |
| 5 | Se registra la hora exacta del equipo local al momento del marcaje |

---

#### HU-06 · Control de colación
> **Como** administrador, **quiero** que el sistema descuente automáticamente 30 minutos de colación, **para** que el cálculo de horas sea preciso.

| # | Criterio de Aceptación |
|---|---|
| 1 | El descuento de 30 minutos se aplica automáticamente a jornadas de más de 4 horas |
| 2 | Opcionalmente, el trabajador puede marcar inicio y fin de colación |
| 3 | Si se usan los botones de colación, el descuento es el tiempo real marcado |
| 4 | Si no se usan los botones, se aplica el descuento fijo de 30 minutos |

---

### ÉPICA 4 — Cálculo de Jornada y Pagos

#### HU-07 · Calcular horas trabajadas
> **Como** sistema, **quiero** calcular automáticamente horas y minutos trabajados al registrar la salida.

| # | Criterio de Aceptación |
|---|---|
| 1 | Horas trabajadas = hora salida − hora entrada − colación |
| 2 | El resultado se expresa en horas y minutos (ej: `7h 45min`) |
| 3 | Si el total es menor a 8 horas, se registran solo horas normales |
| 4 | Si el total supera 8 horas, las horas adicionales se registran como horas extras |

---

#### HU-08 · Calcular pago diario
> **Como** administrador, **quiero** que el sistema calcule automáticamente el pago del día por trabajador.

| # | Criterio de Aceptación |
|---|---|
| 1 | Pago = (horas normales × valor hora) + (horas extras × valor hora) |
| 2 | La hora extra tiene el mismo valor que la hora normal (sin recargo) |
| 3 | Jornada incompleta → pago proporcional al tiempo trabajado |
| 4 | El pago se muestra en CLP con separador de miles |

---

#### HU-09 · Resumen del día al marcar salida
> **Como** trabajador, **quiero** ver un resumen completo de mi jornada al marcar salida, **para** conocer cuánto gané en el día.

| # | Criterio de Aceptación |
|---|---|
| 1 | El resumen muestra: entrada, salida, horas trabajadas, horas normales, horas extras, valor por tipo y total |
| 2 | El resumen aparece automáticamente al completar el marcaje de salida |
| 3 | Es legible en pantalla sin necesidad de scroll |

---

### ÉPICA 5 — Control de Atrasos

#### HU-10 · Detectar y registrar atrasos
> **Como** administrador, **quiero** que el sistema detecte cuando un trabajador llega tarde, **para** tener un registro objetivo de puntualidad.

| # | Criterio de Aceptación |
|---|---|
| 1 | La hora de inicio de jornada es configurable (por defecto 09:00) |
| 2 | Si la entrada se marca después de inicio + tolerancia → se registra como atraso |
| 3 | La tolerancia es configurable (recomendado: 5 o 10 minutos) |
| 4 | El atraso queda en el historial con hora exacta y minutos de diferencia |
| 5 | El sistema no penaliza el pago automáticamente; la decisión es del administrador |

---

### ÉPICA 6 — Historial y Estadísticas

#### HU-11 · Consultar historial de un trabajador
> **Como** administrador, **quiero** revisar el historial completo de asistencia, **para** tener trazabilidad del desempeño.

| # | Criterio de Aceptación |
|---|---|
| 1 | Filtrable por día, semana o mes |
| 2 | Cada registro muestra: fecha, entrada, salida, horas, extras, atrasos y total pagado |
| 3 | Ordenable cronológicamente (ascendente / descendente) |
| 4 | Un trabajador solo puede ver su propio historial |

---

#### HU-12 · Estadísticas comparativas del equipo
> **Como** administrador, **quiero** ver estadísticas comparativas entre trabajadores, **para** identificar quién trabaja más y quién acumula más atrasos.

| # | Criterio de Aceptación |
|---|---|
| 1 | Ranking de horas trabajadas por trabajador en el período seleccionado |
| 2 | Ranking de atrasos por trabajador en el período seleccionado |
| 3 | Datos visualizables por semana o mes |
| 4 | Incluye tendencias comparativas con el período anterior |

---

### ÉPICA 7 — Reportes y Exportación

#### HU-13 · Exportar reportes a Excel
> **Como** administrador, **quiero** exportar registros a Excel, **para** compartirlos con contabilidad.

| # | Criterio de Aceptación |
|---|---|
| 1 | Exportable por día, semana o mes |
| 2 | El archivo incluye: nombre, fecha, entrada, salida, horas normales, extras, atrasos y total |
| 3 | El archivo se guarda en el sistema de archivos local mediante diálogo nativo del sistema |
| 4 | El nombre incluye el período (ej: `reporte_2025-01-01_2025-01-31.xlsx`) |

---

## 2. DevOps

### Stack completo

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript | ^5.3 |
| Shell de escritorio | Electron | ^28 |
| Build tool | electron-vite | ^2.0 |
| UI Framework | Vue 3 | ^3.4 |
| Estilos | Tailwind CSS | ^3.4 |
| Estado global | Pinia | ^2.1 |
| Base de datos | better-sqlite3 | ^9.4 |
| Hash de contraseñas | bcrypt | ^5.1 |
| Exportación Excel | ExcelJS | ^4.4 |
| Empaquetado | electron-builder | ^24 |

---

### Requisitos de desarrollo

```
Node.js   >= 18.0.0
npm       >= 9.0.0
Sistema   Windows 10/11 (target de distribución)
```

---

### Instalación del entorno

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd nautica-jornada

# 2. Instalar dependencias
npm install

# 3. Levantar en modo desarrollo
npm run dev
```

El comando `dev` levanta Electron con hot-reload tanto en el Main Process como en el Renderer (Vue).

---

### Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript y empaqueta la app |
| `npm run preview` | Preview del build sin empaquetar |
| `npm run package` | Genera el instalador `.exe` en `/release` |
| `npm run typecheck` | Valida tipos TypeScript sin compilar |

---

### Generación del instalador

```bash
npm run package
```

Genera un instalador NSIS en `/release/`. El instalador permite al usuario elegir la carpeta de destino y crea un acceso directo en el escritorio.

El archivo `.exe` incluye:
- El runtime de Node.js
- La app Vue compilada
- Electron (Chromium embebido)
- **No requiere instalación previa de ninguna dependencia en el PC destino**

---

### Base de datos

La base de datos SQLite se crea automáticamente en la primera ejecución:

```
Windows: C:\Users\<usuario>\AppData\Roaming\nautica-jornada\nautica.db
```

**Backup:** copiar el archivo `nautica.db` es suficiente para tener un respaldo completo.

No requiere servidor, no requiere conexión a internet, no requiere configuración adicional.

---

### Variables de entorno (solo desarrollo)

| Variable | Descripción |
|---|---|
| `ELECTRON_RENDERER_URL` | URL del dev server de Vite (seteada automáticamente por electron-vite) |

No hay variables de entorno en producción. Toda la configuración vive en la tabla `app_config` de SQLite.

---

### Configuración de TypeScript

El proyecto usa **dos tsconfig** separados:

| Config | Aplica a | Target |
|---|---|---|
| `tsconfig.node.json` | `src/main/`, `src/preload/`, `src/shared/` | Node.js (CommonJS) |
| `tsconfig.web.json` | `src/renderer/`, `src/shared/` | Browser (ESNext) |

`src/shared/types/` es compilado por ambos, lo que permite compartir interfaces entre los dos procesos de Electron sin duplicación.

---

## 3. Estructura del Proyecto

```
nautica-jornada/
│
├── electron.vite.config.ts     ← Configuración de electron-vite (Main + Renderer)
├── tsconfig.json               ← Raíz (referencias a node y web)
├── tsconfig.node.json          ← TypeScript para Main Process y Preload
├── tsconfig.web.json           ← TypeScript para Renderer (Vue)
├── tailwind.config.js
├── package.json
├── index.html                  ← Entry point del Renderer
│
├── resources/
│   └── icon.ico                ← Ícono de la app (para el instalador)
│
└── src/
    │
    ├── shared/                 ── COMPARTIDO entre Main y Renderer
    │   └── types/
    │       ├── index.ts        ← Barrel export (importar desde '@shared/types')
    │       ├── worker.ts       ← Worker, CreateWorkerDto, UpdateWorkerDto, DocumentType
    │       ├── attendance.ts   ← AttendanceRecord, DaySummary, AttendanceStatus, filtros
    │       ├── admin.ts        ← Admin, AdminRecord, LoginDto, LoginResult, AdminSession
    │       ├── config.ts       ← AppConfig, UpdateConfigDto
    │       ├── reports.ts      ← WorkerPeriodSummary, ReportRow, ReportFilter, Trend
    │       └── ipc.ts          ← IpcChannels tipados (contrato Main ↔ Renderer)
    │
    ├── main/                   ── MAIN PROCESS (Node.js)
    │   ├── index.ts            ← Entry point: inicializa DB, servicios, handlers IPC y ventana
    │   │
    │   ├── database/
    │   │   └── connection.ts   ← Conexión SQLite + migraciones automáticas al primer inicio
    │   │
    │   ├── repositories/       ← Solo hablan con SQLite. Sin lógica de negocio.
    │   │   ├── WorkerRepository.ts
    │   │   ├── AttendanceRepository.ts
    │   │   ├── AdminRepository.ts
    │   │   └── ConfigRepository.ts
    │   │
    │   ├── services/           ← Toda la lógica de negocio. No conocen ni la UI ni SQLite.
    │   │   ├── WorkdayService.ts       → Cálculos: horas, pagos, atrasos, validación RUT
    │   │   ├── AttendanceService.ts    → Orquesta el flujo de marcaje
    │   │   ├── AuthService.ts          → Login, creación y eliminación de admins
    │   │   └── ReportService.ts        → Estadísticas, tendencias y exportación Excel
    │   │
    │   └── ipc/                ← Handlers IPC. Equivalen a controllers. Sin lógica de negocio.
    │       ├── attendance.ipc.ts
    │       ├── workers.ipc.ts
    │       ├── auth.ipc.ts     ← También contiene handlers de reports y config
    │       └── (reports.ipc.ts, config.ipc.ts en auth.ipc.ts por ahora)
    │
    ├── preload/
    │   └── index.ts            ← Expone window.electron.invoke() al Renderer de forma segura
    │
    └── renderer/               ── RENDERER PROCESS (Vue 3)
        ├── main.ts             ← Entry point Vue: router, Pinia, App.vue
        ├── App.vue             ← Componente raíz. Carga config al iniciar.
        │
        ├── assets/
        │   └── main.css        ← Tailwind CSS
        │
        ├── stores/             ← Estado verdaderamente global (Pinia)
        │   ├── adminStore.ts   → Sesión del admin + timeout de expiración automático
        │   └── configStore.ts  → Configuración de la app (startHour, tolerancia, etc.)
        │
        ├── composables/        ← Lógica de UI reutilizable. Llaman IPC, nunca componentes.
        │   ├── useAttendance.ts → Identificación, marcaje de entrada/salida, resumen
        │   ├── useAuth.ts       → Login y logout del administrador
        │   ├── useWorkers.ts    → (por implementar) CRUD de trabajadores
        │   └── useReports.ts    → (por implementar) Historial y exportación
        │
        └── views/              ← Páginas completas del router
            ├── PanelMarcaje.vue          ← Pantalla principal (kiosk de marcaje)
            ├── PanelAdmin.vue            ← Shell del panel admin con nav lateral
            └── admin/
                ├── Dashboard.vue         ← Resumen del día / semana
                ├── Trabajadores.vue      ← CRUD de trabajadores
                ├── Historial.vue         ← Historial filtrable por período
                ├── Estadisticas.vue      ← Rankings y tendencias
                └── Configuracion.vue     ← Ajustes de jornada y tolerancia
```

---

### Flujo de datos entre capas

```
[Vista Vue]
    │  llama a composable
    ▼
[Composable]
    │  window.electron.invoke('canal:accion', payload)
    ▼  ── cruce IPC ──────────────────────────────────
[IPC Handler]
    │  llama a Service
    ▼
[Service]
    │  llama a Repository
    ▼
[Repository]
    │  query SQL
    ▼
[SQLite]
    │  resultado
    ▼
[Repository] → [Service] → [IPC Handler]
    │  retorna { ok: true, data: ... }
    ▼  ── cruce IPC ──────────────────────────────────
[Composable]
    │  actualiza ref reactivo
    ▼
[Vista Vue] → UI se actualiza reactivamente
```

**Regla fundamental:** Vue no toca SQLite jamás. Todo cruce de datos pasa por IPC.

---

## 4. Modelos de Datos

### Diagrama de relaciones

```
┌──────────────┐        ┌───────────────────────┐
│    users     │        │   attendance_records   │
│ (admins)     │        │                       │
├──────────────┤        ├───────────────────────┤
│ id           │        │ id                    │
│ username     │        │ worker_id  ───────────┼──┐
│ password_hash│        │ date                  │  │
│ created_at   │        │ entry_time            │  │
└──────────────┘        │ exit_time             │  │
                        │ break_minutes         │  │
┌──────────────┐        │ break_start_time      │  │
│  app_config  │        │ worked_minutes        │  │
│ (fila única) │        │ overtime_minutes      │  │
├──────────────┤        │ daily_payment         │  │
│ id = 1       │        │ delay_minutes         │  │
│ start_hour   │        │ created_at            │  │
│ tolerance_min│        └───────────────────────┘  │
│ manual_break │                                    │
│ base_daily_h │        ┌───────────────────────┐  │
└──────────────┘        │       workers         │  │
                        ├───────────────────────┤  │
                        │ id  ◄─────────────────┼──┘
                        │ name                  │
                        │ rut          nullable │
                        │ dni          nullable │
                        │ hourly_rate           │
                        │ start_date            │
                        │ status                │
                        └───────────────────────┘
```

---

### Tabla `workers`

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | Identificador interno |
| `name` | TEXT | NOT NULL | Nombre completo |
| `rut` | TEXT | NULL | Formato `12.345.678-9` — trabajadores chilenos |
| `dni` | TEXT | NULL | Pasaporte u otro documento — trabajadores extranjeros |
| `hourly_rate` | REAL | NOT NULL | Valor hora en CLP |
| `start_date` | TEXT | NOT NULL | Fecha de ingreso `YYYY-MM-DD` |
| `status` | TEXT | NOT NULL DEFAULT `ACTIVE` | `ACTIVE` \| `INACTIVE` |

**Restricciones:**
```sql
CHECK (rut IS NOT NULL OR dni IS NOT NULL)   -- Al menos un documento obligatorio
CHECK (status IN ('ACTIVE', 'INACTIVE'))
```

---

### Tabla `attendance_records`

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `worker_id` | INTEGER | FK → workers(id) | Trabajador al que pertenece |
| `date` | TEXT | NOT NULL | `YYYY-MM-DD` |
| `entry_time` | TEXT | NOT NULL | `HH:MM:SS` — hora de entrada |
| `exit_time` | TEXT | NULL | `HH:MM:SS` — null hasta marcar salida |
| `break_minutes` | INTEGER | DEFAULT 30 | Minutos de colación descontados |
| `break_start_time` | TEXT | NULL | `HH:MM:SS` — usado si `manual_break = true` |
| `worked_minutes` | INTEGER | NULL | Total trabajado (ya descontada colación) |
| `overtime_minutes` | INTEGER | DEFAULT 0 | Minutos sobre la jornada base |
| `daily_payment` | REAL | NULL | Pago del día en CLP |
| `delay_minutes` | INTEGER | DEFAULT 0 | 0 si llegó a tiempo |
| `created_at` | TEXT | NOT NULL | Timestamp del registro |

**Restricción:**
```sql
UNIQUE(worker_id, date)  -- Un solo registro por trabajador por día
```

---

### Tabla `users`

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `username` | TEXT | NOT NULL UNIQUE | Nombre de usuario del admin |
| `password_hash` | TEXT | NOT NULL | Hash bcrypt de la contraseña |
| `created_at` | TEXT | NOT NULL | Fecha de creación |

> El `password_hash` nunca sale del Main Process. Las interfaces de tipo `Admin` expuestas al Renderer no lo incluyen.

---

### Tabla `app_config`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | INTEGER | 1 | Siempre 1 — fila única |
| `start_hour` | TEXT | `09:00` | Hora de inicio de jornada (`HH:MM`) |
| `tolerance_minutes` | INTEGER | `10` | Minutos de tolerancia para atrasos |
| `manual_break` | INTEGER | `0` | `0` = descuento automático, `1` = botones de colación |
| `base_daily_hours` | INTEGER | `8` | Horas de jornada base para cálculo de extras |

**Restricción:**
```sql
CHECK (id = 1)  -- Solo puede existir una fila de configuración
```

---

### Interfaces TypeScript (`src/shared/types/`)

Las interfaces son el **contrato** entre el Main Process y el Renderer. Cualquier cambio en la estructura de datos se refleja automáticamente en ambos lados gracias a TypeScript.

```
shared/types/
├── worker.ts      → Worker, CreateWorkerDto, UpdateWorkerDto, DocumentType, WorkerIdentityResult
├── attendance.ts  → AttendanceRecord, AttendanceStatus, DaySummary, CreateEntryDto, UpdateExitDto, AttendanceFilter
├── admin.ts       → Admin, AdminRecord, LoginDto, LoginResult, AdminSession
├── config.ts      → AppConfig, UpdateConfigDto
├── reports.ts     → WorkerPeriodSummary, ReportRow, ReportFilter, ReportPeriod, Trend, WorkerTrends
├── ipc.ts         → IpcResponse<T>, AuthChannels, WorkerChannels, AttendanceChannels, ReportChannels, ConfigChannels, AllChannels
└── index.ts       → Barrel export
```

---

### Fórmulas de cálculo

```
Minutos trabajados  = (exit_time - entry_time) - break_minutes
Minutos extra       = MAX(0, worked_minutes - base_daily_hours * 60)
Minutos normales    = worked_minutes - overtime_minutes
Pago del día        = (worked_minutes / 60) × hourly_rate
Atraso (min)        = MAX(0, entry_time - (start_hour + tolerance_minutes))
```

---

## 5. Roadmap de Desarrollo

El desarrollo está organizado en **4 fases** que priorizan funcionalidad crítica primero y mejoras progresivas después. Cada fase produce una versión usable del sistema.

---

### Fase 1 — Base funcional `v0.1`
> **Objetivo:** El sistema puede registrar asistencia y calcular pagos. Es usable en el taller.

| ID | Tarea | HU relacionada |
|---|---|---|
| F1-01 | ✅ Configuración del proyecto (Electron + Vue 3 + TypeScript + Tailwind) | — |
| F1-02 | ✅ Base de datos SQLite con migraciones automáticas | — |
| F1-03 | ✅ Repositorios: Worker, Attendance, Admin, Config | — |
| F1-04 | ✅ Servicios: WorkdayService, AttendanceService, AuthService | — |
| F1-05 | ✅ IPC handlers para attendance, workers, auth y config | — |
| F1-06 | ✅ Panel de marcaje (identificación por RUT/DNI + flujo inteligente) | HU-04, HU-05 |
| F1-07 | ✅ Resumen del día al marcar salida | HU-09 |
| F1-08 | ✅ Detección automática de atrasos | HU-10 |
| F1-09 | ✅ Descuento automático de colación (30 min fijos) | HU-06 |
| F1-10 | Validación de RUT con dígito verificador en el frontend | HU-01 |
| F1-11 | Admin login / logout con sesión en Pinia + timeout | HU-03 |
| F1-12 | CRUD completo de trabajadores (vista `Trabajadores.vue`) | HU-01, HU-02 |
| F1-13 | Configuración de jornada (hora inicio + tolerancia) | HU-10 |

---

### Fase 2 — Historial y reportes `v0.2`
> **Objetivo:** El administrador puede revisar el historial completo y exportar datos.

| ID | Tarea | HU relacionada |
|---|---|---|
| F2-01 | Vista de historial con filtros por período | HU-11 |
| F2-02 | Edición/corrección de registros de asistencia por el admin | HU-11 |
| F2-03 | Resumen semanal y mensual por trabajador | HU-08 |
| F2-04 | Exportación a Excel con diálogo nativo de guardado | HU-13 |
| F2-05 | Reportes con nombre de archivo que incluye el período | HU-13 |
| F2-06 | Vista de historial propio para el trabajador | HU-11 |

---

### Fase 3 — Estadísticas y mejoras UX `v0.3`
> **Objetivo:** El administrador tiene visibilidad total del desempeño del equipo.

| ID | Tarea | HU relacionada |
|---|---|---|
| F3-01 | Dashboard con resumen del día en curso | HU-12 |
| F3-02 | Ranking de horas trabajadas por período | HU-12 |
| F3-03 | Ranking de atrasos por trabajador | HU-12 |
| F3-04 | Tendencias semana actual vs semana anterior | HU-12 |
| F3-05 | Botones de colación manual (feature flag `manual_break`) | HU-06 |
| F3-06 | Gestión de múltiples administradores | HU-03 |
| F3-07 | Animaciones y feedback visual en el panel de marcaje | — |

---

### Fase 4 — Distribución y producción `v1.0`
> **Objetivo:** El sistema está listo para instalar en el taller y usarse de forma autónoma.

| ID | Tarea | HU relacionada |
|---|---|---|
| F4-01 | Generación del instalador `.exe` con electron-builder | — |
| F4-02 | Ícono de la app y acceso directo en el escritorio | — |
| F4-03 | Admin por defecto en primer inicio (`admin` / `nautica2024`) con alerta para cambiar contraseña | HU-03 |
| F4-04 | Pantalla de backup / exportación manual de la base de datos | — |
| F4-05 | Modo pantalla completa optativo para el panel de marcaje (modo kiosk) | — |
| F4-06 | Pruebas end-to-end del flujo de marcaje completo | — |
| F4-07 | Documentación de uso para el administrador (manual de usuario) | — |

---

### Estado actual del proyecto

```
v0.1 ░░░░░░░░░░░░░░░░░░░░  En progreso

✅ Completado   F1-01 → F1-09  (base del proyecto scaffoldeada)
🔲 Pendiente    F1-10 → F1-13  (vistas del admin y validaciones)
🔲 Pendiente    Fase 2, 3, 4
```

---

*Documento generado para Náutica Botes Inflables SpA — versión interna de desarrollo.*
