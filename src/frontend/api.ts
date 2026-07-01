/**
 * Cliente API tipado del renderer. Único punto de integración con el backend:
 * envuelve window.electron.invoke, desempaqueta la respuesta { ok, data, error }
 * y lanza un Error con el mensaje del backend cuando ok === false.
 */
import {
  AuthChannels,
  WorkerChannels,
  AttendanceChannels,
  ConfigChannels,
  ReportChannels,
  type IpcResponse,
} from '@shared/types';
import type {
  Admin,
  LoginDto,
  ChangePasswordDto,
  Worker,
  CreateWorkerDto,
  UpdateWorkerDto,
  WorkerIdentityDto,
  WorkerIdentityResult,
  WorkerAdvance,
  CreateWorkerAdvanceDto,
} from '@shared/types';
import type {
  AttendanceRecord,
  CheckAttendanceResult,
  MarkEntryDto,
  MarkExitDto,
  UpdateRecordDto,
  CreateManualRecordDto,
} from '@shared/types';
import type { ConfigView, UpdateConfigDto } from '@shared/types';
import type { PayrollSummary, DashboardStats } from '@shared/types';

async function call<T>(channel: string, payload?: unknown): Promise<T> {
  const res = (await window.electron.invoke(channel, payload)) as IpcResponse<T>;
  if (!res || res.ok !== true) {
    throw new Error(res?.error || 'Ocurrió un error inesperado.');
  }
  return res.data as T;
}

export const api = {
  auth: {
    login: (dto: LoginDto) => call<Admin>(AuthChannels.LOGIN, dto),
    changePassword: (dto: ChangePasswordDto) => call<boolean>(AuthChannels.CHANGE_PASSWORD, dto),
  },

  workers: {
    getAll: () => call<Worker[]>(WorkerChannels.GET_ALL),
    getActive: () => call<Worker[]>(WorkerChannels.GET_ACTIVE),
    getById: (id: number) => call<Worker | undefined>(WorkerChannels.GET_BY_ID, id),
    identify: (dto: WorkerIdentityDto) => call<WorkerIdentityResult>(WorkerChannels.IDENTIFY, dto),
    validateRut: (rut: string) => call<boolean>(WorkerChannels.VALIDATE_RUT, rut),
    create: (dto: CreateWorkerDto) => call<Worker>(WorkerChannels.CREATE, dto),
    update: (id: number, data: UpdateWorkerDto, adminId?: number | null) =>
      call<Worker>(WorkerChannels.UPDATE, { id, data, adminId }),
    deactivate: (id: number, adminId?: number | null) =>
      call<Worker>(WorkerChannels.DEACTIVATE, { id, adminId }),
    reactivate: (id: number, adminId?: number | null) =>
      call<Worker>(WorkerChannels.REACTIVATE, { id, adminId }),
    hardDelete: (id: number) => call<boolean>(WorkerChannels.HARD_DELETE, id),
    addAdvance: (dto: CreateWorkerAdvanceDto) =>
      call<WorkerAdvance>(WorkerChannels.ADVANCE_ADD, dto),
    listAdvances: (workerId: number, month: string) =>
      call<WorkerAdvance[]>(WorkerChannels.ADVANCE_LIST, { workerId, month }),
    deleteAdvance: (id: number) => call<boolean>(WorkerChannels.ADVANCE_DELETE, id),
  },

  attendance: {
    getAll: () => call<AttendanceRecord[]>(AttendanceChannels.GET_ALL),
    getByWorker: (workerId: number) =>
      call<AttendanceRecord[]>(AttendanceChannels.GET_BY_WORKER, workerId),
    getMissing: () => call<AttendanceRecord[]>(AttendanceChannels.GET_MISSING),
    checkToday: (workerId: number) =>
      call<CheckAttendanceResult>(AttendanceChannels.CHECK_TODAY, workerId),
    markEntry: (dto: MarkEntryDto) => call<AttendanceRecord>(AttendanceChannels.MARK_ENTRY, dto),
    markExit: (dto: MarkExitDto) => call<AttendanceRecord>(AttendanceChannels.MARK_EXIT, dto),
    updateRecord: (dto: UpdateRecordDto & { adminId?: number | null }) =>
      call<AttendanceRecord>(AttendanceChannels.UPDATE_RECORD, dto),
    createManual: (dto: CreateManualRecordDto & { adminId?: number | null }) =>
      call<AttendanceRecord>(AttendanceChannels.CREATE_MANUAL, dto),
  },

  config: {
    get: () => call<ConfigView>(ConfigChannels.GET),
    update: (dto: UpdateConfigDto) => call<ConfigView>(ConfigChannels.UPDATE, dto),
    cancelPending: () => call<ConfigView>(ConfigChannels.CANCEL_PENDING),
  },

  report: {
    payroll: (year: number, month: number) =>
      call<PayrollSummary>(ReportChannels.PAYROLL, { year, month }),
    dashboard: () => call<DashboardStats>(ReportChannels.DASHBOARD),
    exportExcel: (year: number, month: number) =>
      call<{ canceled: boolean; path?: string }>(ReportChannels.EXPORT_EXCEL, { year, month }),
  },
};
