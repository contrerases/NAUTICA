/**
 * Tipos relacionados con IPC (Inter-Process Communication)
 * Define los canales de comunicación entre Main Process y Renderer
 */

/**
 * Respuesta estándar de todos los handlers IPC
 */
export interface IpcResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

/**
 * Canales de autenticación
 */
export enum AuthChannels {
  LOGIN = 'auth:login',
  LOGOUT = 'auth:logout',
  CHANGE_PASSWORD = 'auth:change-password',
  CHECK_SESSION = 'auth:check-session',
  CREATE_ADMIN = 'auth:create-admin',
  DELETE_ADMIN = 'auth:delete-admin',
  LIST_ADMINS = 'auth:list-admins',
}

/**
 * Canales de trabajadores
 */
export enum WorkerChannels {
  CREATE = 'worker:create',
  UPDATE = 'worker:update',
  DELETE = 'worker:delete',
  HARD_DELETE = 'worker:hard-delete',
  GET_BY_ID = 'worker:get-by-id',
  GET_ALL = 'worker:get-all',
  GET_ACTIVE = 'worker:get-active',
  IDENTIFY = 'worker:identify',
  VALIDATE_RUT = 'worker:validate-rut',
  ADVANCE_ADD = 'worker:advance-add',
  ADVANCE_LIST = 'worker:advance-list',
  ADVANCE_DELETE = 'worker:advance-delete',
}

/**
 * Canales de asistencia
 */
export enum AttendanceChannels {
  GET_ALL = 'attendance:get-all',
  MARK_ENTRY = 'attendance:mark-entry',
  MARK_EXIT = 'attendance:mark-exit',
  CHECK_TODAY = 'attendance:check-today',
  GET_BY_WORKER = 'attendance:get-by-worker',
  GET_BY_PERIOD = 'attendance:get-by-period',
  GET_PENDING = 'attendance:get-pending',
  COMPLETE_PENDING = 'attendance:complete-pending',
  UPDATE_RECORD = 'attendance:update-record',
}

/**
 * Canales de configuración
 */
export enum ConfigChannels {
  GET = 'config:get',
  UPDATE = 'config:update',
  COMPLETE_ONBOARDING = 'config:complete-onboarding',
}

/**
 * Canales de reportes
 */
export enum ReportChannels {
  GET_WORKER_SUMMARY = 'report:worker-summary',
  GET_PERIOD_REPORT = 'report:period-report',
  GET_DASHBOARD_STATS = 'report:dashboard-stats',
  EXPORT_EXCEL = 'report:export-excel',
}

/**
 * Todos los canales IPC disponibles
 */
export type AllChannels =
  | AuthChannels
  | WorkerChannels
  | AttendanceChannels
  | ConfigChannels
  | ReportChannels
