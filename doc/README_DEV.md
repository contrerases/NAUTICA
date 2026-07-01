# Nautica Jornada - Guía del Desarrollador

> **Estado actual:** v0.1 funcional — marcaje, CRUD, login, historial, finanzas y
> configuración implementados. Última revisión: 2026-06-29.

---

## 📦 Instalación

### Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Windows** 10/11 (target de distribución)

### Pasos de instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar que todo compiló correctamente
npm run typecheck

# 3. Levantar en modo desarrollo
npm run dev
```

El comando `dev` levanta Electron con hot-reload tanto en el Main Process como en el Renderer (Vue).

---

## 🏗️ Estructura del Proyecto

```
nautica-jornada/
├── database/                   ← Archivos SQL (esquema, seeds)
│   ├── nautica_jornada.sql    ← BD completa (se ejecuta al primer inicio)
│   ├── schema.sql              ← Solo tablas
│   ├── constraints.sql         ← Solo restricciones e índices
│   └── seeds.sql               ← Solo datos iniciales
│
├── src/
│   ├── shared/types/           ← Tipos TypeScript compartidos (Main ↔ Renderer)
│   │   ├── worker.ts
│   │   ├── attendance.ts
│   │   ├── admin.ts
│   │   ├── config.ts
│   │   ├── reports.ts
│   │   ├── ipc.ts
│   │   └── index.ts            ← Barrel export
│   │
│   ├── backend/                ← Main Process (Node.js)
│   │   ├── index.ts            ← Entry point
│   │   ├── database/
│   │   │   └── connection.ts   ← Conexión SQLite singleton (better-sqlite3)
│   │   ├── repositories/       ← Acceso a datos + cálculo de jornada
│   │   │                         (worker, attendance, user, appConfig, advance)
│   │   ├── services/           ← authService (login, bcrypt)
│   │   └── ipc/                ← Handlers IPC (auth, worker, attendance, config)
│   │
│   ├── preload/                ← Preload script (bridge seguro)
│   │   └── index.ts            ← Expone window.electron.invoke()/on()
│   │
│   └── frontend/               ← Renderer Process (Vue 3)
│       ├── main.ts             ← Entry point Vue
│       ├── App.vue             ← Componente raíz
│       ├── assets/
│       │   └── main.css        ← Tailwind CSS
│       ├── router/
│       │   └── index.ts        ← Rutas (PanelMarcaje, LoginAdmin, /admin/*)
│       ├── stores/             ← Estado global (Pinia)
│       │   ├── adminStore.ts   ← Sesión del admin
│       │   └── configStore.ts  ← Configuración de la app
│       ├── views/              ← Vistas (PanelMarcaje, LoginAdmin, admin/*)
│       └── components/ui/      ← Base* + DatabaseSyncIndicator
│
├── resources/
│   └── icon.ico                ← TODO: Ícono de la app
│
├── package.json
├── tsconfig.json               ← Raíz (referencias)
├── tsconfig.node.json          ← Backend + Preload + Shared
├── tsconfig.web.json           ← Frontend + Shared
├── tailwind.config.js
├── postcss.config.js
├── electron.vite.config.ts
├── .gitignore
├── README.md                   ← Documentación funcional
├── LOGICA_NEGOCIO.md          ← Especificación técnica completa ⭐
└── DIRECTORIO_PROYECTO.md     ← Estructura planeada
```

---

## 🚀 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Modo desarrollo con hot-reload (Main + Renderer) |
| `npm run build` | Compila TypeScript y empaqueta la app |
| `npm run preview` | Preview del build sin empaquetar |
| `npm run typecheck` | Valida tipos TypeScript sin compilar |
| `npm run typecheck:node` | Solo backend |
| `npm run typecheck:web` | Solo frontend |
| `npm run package` | Genera instalador `.exe` en `/release` |

---

## 📂 Base de Datos

### Ubicación

- **Desarrollo:** `./nautica.db` (raíz del proyecto)
- **Producción:** `C:\Users\<usuario>\AppData\Roaming\nautica-jornada\nautica.db`

### Migraciones

Al primer inicio, `src/backend/database/connection.ts` ejecuta automáticamente `database/nautica_jornada.sql`.

### Schema

La base de datos tiene 5 tablas:

- `users` - Administradores (username, password_hash)
- `workers` - Trabajadores (RUT/DNI, valor hora, auditoría)
- `attendance_records` - Registros de asistencia (snapshots históricos, estados)
- `app_config` - Configuración global (fila única)
- `worker_advances` - Adelantos de dinero (se descuentan del líquido del período)

Ver **LOGICA_NEGOCIO.md** para reglas detalladas.

---

## 🔧 Configuración de TypeScript

El proyecto usa **dos tsconfig** separados:

- **tsconfig.node.json** → Backend, Preload, Shared (Target: Node.js)
- **tsconfig.web.json** → Frontend, Shared (Target: Browser)

Los tipos compartidos en `src/shared/types/` se compilan por ambos, lo que permite compartir interfaces entre Main y Renderer sin duplicación.

### Alias de importación

```typescript
// Backend
import { Worker } from '@shared/types'
import { getDatabase } from '@backend/database/connection'

// Frontend
import { Worker } from '@shared/types'
import { useAdminStore } from '@/stores/adminStore'
import MyComponent from '@/components/MyComponent.vue'
```

---

## 🎨 Tailwind CSS

El proyecto usa Tailwind CSS con configuración personalizada en `tailwind.config.js`.

Clases de utilidad predefinidas (ver `src/frontend/assets/main.css`):

```html
<!-- Inputs -->
<input class="input-base" />

<!-- Botones -->
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-success">Success</button>
<button class="btn-danger">Danger</button>

<!-- Cards -->
<div class="card">...</div>

<!-- Badges -->
<span class="badge-success">Activo</span>
<span class="badge-warning">Pendiente</span>
<span class="badge-danger">Cerrado</span>
```

---

## 🔌 Comunicación IPC

La comunicación entre Main Process (backend) y Renderer (frontend) se hace vía IPC (Inter-Process Communication).

### Desde el Frontend

```typescript
import { WorkerChannels } from '@shared/types'

const response = await window.electron.invoke<Worker>(
  WorkerChannels.GET_BY_ID,
  { id: 1 }
)

if (response.ok) {
  console.log(response.data) // Worker
} else {
  console.error(response.error)
}
```

### En el Backend

Los handlers se registran en `backend/index.ts` (`registerAuthHandlers`,
`setupWorkerHandlers`, `setupAttendanceHandlers`, `registerConfigHandlers`) y
validan el payload con Zod (`src/shared/validators`). Ejemplo real:

```typescript
import { ipcMain } from 'electron'
import { attendanceRepository } from '../repositories/attendanceRepository'
import { AttendanceChannels } from '../../shared/types/ipc'

ipcMain.handle(AttendanceChannels.CHECK_TODAY, (_, workerId: number) => {
  return attendanceRepository.checkToday(workerId)
})
```

---

## 📋 Estado Actual del Proyecto

### ✅ Implementado

**Backend:**
- [x] Repositorios (worker, attendance, user, appConfig, advance)
- [x] Cálculo de jornada/pago (en `attendanceRepository`: horas, extras ×1.5, atraso, colación)
- [x] `authService` (login, bcrypt, admin por defecto)
- [x] Handlers IPC: auth, workers, attendance, config

**Frontend:**
- [x] PanelMarcaje (identificación + marcaje inteligente)
- [x] LoginAdmin + sesión Pinia con timeout
- [x] Trabajadores (CRUD), Historial (+ cierre de pendientes), Finanzas (adelantos), Configuracion, Dashboard
- [x] Componentes base (`components/ui/Base*`)

**Validaciones:**
- [x] Esquemas Zod en `src/shared/validators` (RUT, marcaje, etc.)

### ⏳ Pendiente

- [ ] Handlers IPC de reportes/exportación (`ReportChannels`) — ExcelJS ya está en deps
- [ ] `resources/icon.ico` e instalador NSIS (Fase 4)
- [ ] Modo kiosk y manual de usuario (Fase 4)
- [ ] Pruebas end-to-end del flujo de marcaje

---

## 🔍 Próximos Pasos

1. **Registrar handlers de reportes** → conectar `ReportChannels` + exportación Excel
2. **Agregar el ícono** → `resources/icon.ico` para poder empaquetar
3. **Empaquetar** → `npm run package` (instalador NSIS)
4. **Pruebas** → verificar flujo completo de marcaje y cálculos de pago

---

## 📚 Documentación Adicional

- **README.md** → Funcionalidades, épicas, historias de usuario, roadmap
- **LOGICA_NEGOCIO.md** → Reglas de negocio técnicas (⭐ **LEER ANTES DE CODIFICAR**)
- **DIRECTORIO_PROYECTO.md** → Estructura planeada del proyecto

---

## 🐛 Debugging

### Ver logs de la app

```bash
# Desarrollo
npm run dev
# Los logs aparecen en la consola de VS Code y en DevTools
```

### Inspeccionar la base de datos

```bash
# Abrir el archivo .db con SQLite CLI
sqlite3 nautica.db

# Ver tablas
.tables

# Ver schema
.schema workers

# Query de ejemplo
SELECT * FROM workers;
```

### DevTools

En modo desarrollo, presiona **F12** o **Ctrl+Shift+I** para abrir DevTools de Electron.

---

## ❗ Problemas Conocidos

- **Falta el ícono:** `resources/icon.ico` no existe aún. `npm run package` fallará hasta agregarlo.
- **Reportes/Excel sin conectar:** `ReportChannels` está definido en los tipos pero no hay handler registrado en `backend/index.ts`.
- **Seeds de demo en producción:** `database/seeds.sql` inserta trabajadores y registros de muestra que también se cargan en una instalación nueva. Vaciarlo (o dejar solo el `app_config`) antes de distribuir si no se quieren datos de ejemplo.
- **Admin por defecto:** se crea automáticamente al primer inicio vía `AuthService.ensureDefaultAdmin()`. Conviene cambiar la contraseña tras instalar.

---

## 📞 Contacto

Para preguntas o problemas, revisar:
1. Este archivo (README_DEV.md)
2. LOGICA_NEGOCIO.md (especificación técnica)
3. README.md (funcionalidades y roadmap)

---

**¡Buen código! 🚀**
