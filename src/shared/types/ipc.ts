/** Canales IPC tipados (contrato Main ↔ Renderer). */

/** Respuesta estándar de todos los handlers. */
export interface IpcResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export enum AuthChannels {
  LOGIN = 'auth:login',
  CHANGE_PASSWORD = 'auth:change-password',
}

export enum WorkerChannels {
  CREATE = 'worker:create',
  UPDATE = 'worker:update',
  DEACTIVATE = 'worker:deactivate', // baja lógica
  REACTIVATE = 'worker:reactivate',
  HARD_DELETE = 'worker:hard-delete', // borrado físico explícito
  GET_BY_ID = 'worker:get-by-id',
  GET_ALL = 'worker:get-all',
  GET_ACTIVE = 'worker:get-active',
  IDENTIFY = 'worker:identify',
  VALIDATE_RUT = 'worker:validate-rut',
  ADVANCE_ADD = 'worker:advance-add',
  ADVANCE_LIST = 'worker:advance-list',
  ADVANCE_HISTORY = 'worker:advance-history',
  ADVANCE_UPDATE = 'worker:advance-update',
  ADVANCE_DELETE = 'worker:advance-delete',
}

export enum AttendanceChannels {
  GET_ALL = 'attendance:get-all',
  GET_BY_WORKER = 'attendance:get-by-worker',
  CHECK_TODAY = 'attendance:check-today',
  MARK_ENTRY = 'attendance:mark-entry',
  MARK_EXIT = 'attendance:mark-exit',
  UPDATE_RECORD = 'attendance:update-record',
  CREATE_MANUAL = 'attendance:create-manual',
  GET_MISSING = 'attendance:get-missing', // OPEN de días anteriores
}

export enum ConfigChannels {
  GET = 'config:get', // devuelve ConfigView (current + pending)
  UPDATE = 'config:update',
  CANCEL_PENDING = 'config:cancel-pending',
  BACKUP = 'config:backup', // exporta una copia de la base de datos
}

export enum ReportChannels {
  PAYROLL = 'report:payroll', // liquidación del mes
  DASHBOARD = 'report:dashboard',
  EXPORT_EXCEL = 'report:export-excel',
}

export type AllChannels =
  | AuthChannels
  | WorkerChannels
  | AttendanceChannels
  | ConfigChannels
  | ReportChannels;
