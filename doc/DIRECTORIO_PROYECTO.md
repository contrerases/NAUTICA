# Náutica Jornada — Estructura del Proyecto

> Árbol real del repositorio (sincronizado con el código). Última revisión: 2026-06-29.

```
nautica-jornada/
│
├── database/                          ← Archivos SQL
│   ├── nautica_jornada.sql            ← BD completa (schema + constraints + seed config). Se ejecuta al primer inicio.
│   ├── schema.sql                     ← Referencia: solo tablas y columnas
│   ├── constraints.sql                ← Referencia: restricciones e índices documentados
│   └── seeds.sql                      ← Datos de muestra (trabajadores, asistencia, adelantos)
│
├── doc/                               ← Documentación
│   ├── INDEX.md                       ← Índice de la documentación
│   ├── README.md                      ← Funcional: épicas, HU, roadmap, stack
│   ├── README_DEV.md                  ← Guía del desarrollador (setup, IPC, debugging)
│   ├── LOGICA_NEGOCIO.md              ← Reglas de negocio y fórmulas de cálculo
│   └── DIRECTORIO_PROYECTO.md         ← Este archivo
│
├── src/
│   │
│   ├── shared/                        ── COMPARTIDO entre backend y frontend
│   │   ├── types/
│   │   │   ├── index.ts               ← Barrel export
│   │   │   ├── worker.ts              ← Worker, CreateWorkerDto, UpdateWorkerDto, DocumentType
│   │   │   ├── attendance.ts          ← AttendanceRecord, CheckAttendanceResult, DTOs
│   │   │   ├── admin.ts               ← Admin, LoginDto, LoginResult, AdminSession
│   │   │   ├── config.ts              ← AppConfig, UpdateConfigDto
│   │   │   ├── reports.ts             ← WorkerPeriodSummary, ReportRow, ReportFilter, Trend
│   │   │   └── ipc.ts                 ← Enums de canales IPC tipados (contrato backend ↔ frontend)
│   │   └── validators/
│   │       └── index.ts               ← Esquemas Zod (markEntry, markExit, RUT, etc.)
│   │
│   ├── backend/                       ── MAIN PROCESS (Node.js)
│   │   ├── index.ts                   ← Entry point: DB, AuthService.ensureDefaultAdmin, handlers IPC, ventana
│   │   │
│   │   ├── database/
│   │   │   └── connection.ts          ← Singleton better-sqlite3 + migraciones al primer inicio
│   │   │
│   │   ├── repositories/              ← Acceso a datos. Contienen también el cálculo de jornada.
│   │   │   ├── workerRepository.ts
│   │   │   ├── attendanceRepository.ts ← markEntry / markExit / updateRecord (cálculo de horas y pago)
│   │   │   ├── userRepository.ts
│   │   │   ├── appConfigRepository.ts
│   │   │   └── advanceRepository.ts   ← Adelantos de dinero (worker_advances)
│   │   │
│   │   ├── services/
│   │   │   └── authService.ts         ← Login, hash bcrypt, admin por defecto
│   │   │
│   │   └── ipc/                       ← Handlers IPC (equivalen a controllers)
│   │       ├── authHandlers.ts
│   │       ├── workerHandlers.ts
│   │       ├── attendanceHandlers.ts
│   │       └── configHandlers.ts
│   │
│   ├── preload/
│   │   └── index.ts                   ← Expone window.electron.invoke()/on() vía contextBridge
│   │
│   └── frontend/                      ── RENDERER PROCESS (Vue 3)
│       ├── main.ts                    ← Entry point Vue: app + router + Pinia
│       ├── App.vue
│       ├── env.d.ts
│       │
│       ├── assets/
│       │   └── main.css               ← Tailwind entry
│       │
│       ├── router/
│       │   └── index.ts               ← Rutas + guards de autenticación
│       │
│       ├── stores/
│       │   ├── adminStore.ts          ← Sesión admin + timeout de expiración
│       │   └── configStore.ts         ← Configuración de la app
│       │
│       ├── components/
│       │   └── ui/                    ← Componentes base reutilizables
│       │       ├── BaseAlert.vue
│       │       ├── BaseBadge.vue
│       │       ├── BaseButton.vue
│       │       ├── BaseCard.vue
│       │       ├── BaseInput.vue
│       │       ├── BaseModal.vue
│       │       ├── BaseTable.vue
│       │       └── DatabaseSyncIndicator.vue
│       │
│       └── views/                     ← Páginas del router
│           ├── PanelMarcaje.vue       ← Pantalla principal de marcaje (kiosk)
│           ├── LoginAdmin.vue
│           └── admin/
│               ├── PanelAdmin.vue     ← Shell con navegación lateral
│               ├── Dashboard.vue
│               ├── Trabajadores.vue   ← CRUD de trabajadores
│               ├── Historial.vue      ← Historial + cierre de pendientes
│               ├── Finanzas.vue       ← Liquidaciones del período + adelantos
│               └── Configuracion.vue  ← Ajustes de jornada
│
├── index.html                         ← Entry point del Renderer
├── electron.vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json                      ← Raíz (referencias)
├── tsconfig.node.json                 ← src/backend + src/preload + src/shared
├── tsconfig.web.json                  ← src/frontend + src/shared
├── package.json
└── .gitignore
```

> **Nota:** la lógica de cálculo de jornada vive en `attendanceRepository.ts`
> (no hay servicios `WorkdayService` / `ReportService` separados). Tampoco
> existen `composables/`: las vistas llaman a `window.electron.invoke()`
> directamente o a través de los stores de Pinia.
