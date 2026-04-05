# Náutica Jornada — Estructura del Proyecto

```
nautica-jornada/
│
├── database/
│   ├── nautica_jornada.sql          ← BD completa (schema + constraints + seeds)
│   ├── schema.sql                   ← Solo tablas y columnas
│   ├── constraints.sql              ← Solo restricciones e índices
│   └── seeds.sql                    ← Solo datos iniciales
│
├── resources/
│   └── icon.ico                     ← Ícono del instalador
│
├── scripts/
│   ├── db-init.ts                   ← Crea la BD desde los .sql
│   └── db-reset.ts                  ← Elimina y recrea la BD
│
├── src/
│   │
│   ├── shared/
│   │   └── types/
│   │       ├── index.ts             ← Barrel export
│   │       ├── worker.ts            ← Worker, CreateWorkerDto, UpdateWorkerDto, DocumentType
│   │       ├── attendance.ts        ← AttendanceRecord, DaySummary, AttendanceStatus, DTOs
│   │       ├── admin.ts             ← Admin, LoginDto, LoginResult, AdminSession
│   │       ├── config.ts            ← AppConfig, UpdateConfigDto
│   │       ├── reports.ts           ← WorkerPeriodSummary, ReportRow, ReportFilter, Trend
│   │       └── ipc.ts               ← IpcChannels tipados — contrato Main ↔ Renderer
│   │
│   ├── backend/
│   │   ├── index.ts                 ← Entry point: ventana + DI + registro IPC
│   │   │
│   │   ├── database/
│   │   │   └── connection.ts        ← Singleton SQLite, lee y ejecuta los .sql
│   │   │
│   │   ├── repositories/
│   │   │   ├── WorkerRepository.ts
│   │   │   ├── AttendanceRepository.ts
│   │   │   ├── AdminRepository.ts
│   │   │   └── ConfigRepository.ts
│   │   │
│   │   ├── services/
│   │   │   ├── WorkdayService.ts    ← Cálculos: horas, pagos, atrasos, validación RUT
│   │   │   ├── AttendanceService.ts ← Orquesta el flujo de marcaje
│   │   │   ├── AuthService.ts       ← Login y gestión de administradores
│   │   │   └── ReportService.ts     ← Estadísticas, tendencias y exportación Excel
│   │   │
│   │   └── ipc/
│   │       ├── attendance.ipc.ts
│   │       ├── workers.ipc.ts
│   │       ├── auth.ipc.ts
│   │       ├── reports.ipc.ts
│   │       └── config.ipc.ts
│   │
│   ├── preload/
│   │   └── index.ts                 ← Expone window.electron.invoke() al frontend
│   │
│   └── frontend/
│       ├── index.html
│       ├── main.ts                  ← Entry point Vue: app + router + pinia
│       ├── App.vue
│       │
│       ├── assets/
│       │   └── main.css             ← Tailwind entry
│       │
│       ├── router/
│       │   └── index.ts             ← Rutas + guards de autenticación
│       │
│       ├── stores/
│       │   ├── adminStore.ts        ← Sesión admin + timeout de expiración
│       │   └── configStore.ts       ← Configuración de la app
│       │
│       ├── composables/
│       │   ├── useAttendance.ts
│       │   ├── useWorkers.ts
│       │   ├── useAuth.ts
│       │   └── useReports.ts
│       │
│       ├── views/
│       │   ├── PanelMarcaje.vue     ← Pantalla principal de marcaje
│       │   ├── LoginAdmin.vue
│       │   └── admin/
│       │       ├── PanelAdmin.vue   ← Shell con navegación lateral
│       │       ├── Dashboard.vue
│       │       ├── Trabajadores.vue
│       │       ├── Historial.vue
│       │       ├── Estadisticas.vue
│       │       └── Configuracion.vue
│       │
│       └── components/
│           ├── ui/
│           │   ├── BaseButton.vue
│           │   ├── BaseInput.vue
│           │   └── BaseModal.vue
│           └── domain/
│               ├── DocumentInput.vue   ← Input RUT/DNI con validación
│               ├── ResumenDia.vue      ← Tarjeta resumen de jornada
│               └── WorkerCard.vue
│
├── electron.vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json               ← src/backend + src/preload + src/shared
├── tsconfig.web.json                ← src/frontend + src/shared
├── package.json
├── .gitignore
└── README.md
```
