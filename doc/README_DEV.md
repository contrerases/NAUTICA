# Nautica Jornada - Guía del Desarrollador

> **Estado actual:** v0.1 en progreso - Estructura base inicializada ✅

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
│   │   │   └── connection.ts   ← Conexión SQLite singleton
│   │   ├── repositories/       ← TODO: Acceso a datos (SQL)
│   │   ├── services/           ← TODO: Lógica de negocio
│   │   └── ipc/                ← TODO: Handlers IPC (controllers)
│   │
│   ├── preload/                ← Preload script (bridge seguro)
│   │   └── index.ts            ← Expone window.electron.invoke()
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
│       ├── composables/        ← TODO: Lógica de UI reutilizable
│       ├── views/              ← Vistas completas (placeholders creados)
│       └── components/         ← TODO: Componentes reutilizables
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

La base de datos tiene 4 tablas:

- `users` - Administradores (username, password_hash)
- `workers` - Trabajadores (RUT/DNI, valor hora, auditoría)
- `attendance_records` - Registros de asistencia (snapshots históricos, estados)
- `app_config` - Configuración global (fila única)

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

### En el Backend (TODO)

```typescript
import { ipcMain } from 'electron'
import { WorkerChannels, type IpcResponse, type Worker } from '@shared/types'

ipcMain.handle(
  WorkerChannels.GET_BY_ID,
  async (_event, { id }): Promise<IpcResponse<Worker>> => {
    try {
      const worker = await WorkerRepository.findById(id)
      return { ok: true, data: worker }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }
)
```

---

## 📋 Estado Actual del Proyecto

### ✅ Completado (Fase 0 - Inicialización)

- [x] Estructura de directorios creada
- [x] Configuración completa (package.json, tsconfig, tailwind, electron-vite)
- [x] Archivos SQL movidos a `database/`
- [x] Tipos compartidos (shared/types) completos
- [x] Conexión a base de datos (SQLite singleton)
- [x] Entry points (backend, preload, frontend)
- [x] Stores de Pinia (adminStore, configStore)
- [x] Router de Vue configurado
- [x] Vistas placeholder creadas
- [x] Documentación técnica (LOGICA_NEGOCIO.md)

### ⏳ Pendiente (Fase 1 - v0.1)

**Backend:**
- [ ] Repositorios (WorkerRepository, AttendanceRepository, AdminRepository, ConfigRepository)
- [ ] Servicios (WorkdayService, AttendanceService, AuthService, ReportService)
- [ ] Handlers IPC (attendance, workers, auth, config, reports)

**Frontend:**
- [ ] Composables (useAttendance, useWorkers, useAuth, useReports)
- [ ] Vista PanelMarcaje completa (identificación + marcaje)
- [ ] Vista LoginAdmin completa
- [ ] Vista Trabajadores (CRUD)
- [ ] Vista Historial (+ cierre manual de jornadas pendientes)
- [ ] Vista Configuracion (edición de start_hour, tolerance, etc.)
- [ ] Componentes reutilizables (DocumentInput, ResumenDia, etc.)

**Validaciones:**
- [ ] Función validateRut (frontend + backend)
- [ ] Validaciones de horarios (exit > entry, etc.)
- [ ] Validación de colación en jornadas cortas

**Utilerías:**
- [ ] Función de cálculo de minutos trabajados
- [ ] Función de cálculo de atrasos
- [ ] Formateo de horas (HH:MM)
- [ ] Formateo de moneda (CLP)

---

## 🔍 Próximos Pasos

1. **Implementar repositorios** → Acceso a datos con better-sqlite3
2. **Implementar servicios** → Lógica de negocio (usar LOGICA_NEGOCIO.md como referencia)
3. **Registrar handlers IPC** → Conectar backend con frontend
4. **Implementar composables** → Lógica de UI que llama a IPC
5. **Completar vistas** → Panel de marcaje, login, CRUD de trabajadores
6. **Pruebas** → Verificar flujo completo de marcaje

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

- **Falta el ícono:** `resources/icon.ico` no existe aún. El build fallará si intentas empaquetar.
- **Handlers IPC no registrados:** El backend tiene un TODO para registrar los handlers.
- **Administrador por defecto:** No se crea automáticamente (requiere hash bcrypt, se hará en AuthService).

---

## 📞 Contacto

Para preguntas o problemas, revisar:
1. Este archivo (README_DEV.md)
2. LOGICA_NEGOCIO.md (especificación técnica)
3. README.md (funcionalidades y roadmap)

---

**¡Buen código! 🚀**
