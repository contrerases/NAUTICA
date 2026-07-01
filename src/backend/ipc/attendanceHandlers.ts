import { ipcMain } from 'electron';
import { AttendanceChannels } from '../../shared/types/ipc';
import {
  markEntrySchema,
  markExitSchema,
  updateRecordSchema,
  createManualSchema,
} from '../../shared/validators';
import { workdayService } from '../services/workdayService';
import { ok, fail } from './helpers';

export function registerAttendanceHandlers(): void {
  ipcMain.handle(AttendanceChannels.GET_ALL, () => {
    try {
      return ok(workdayService.getAll());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.GET_BY_WORKER, (_e, workerId: number) => {
    try {
      return ok(workdayService.getByWorker(workerId));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.GET_MISSING, () => {
    try {
      return ok(workdayService.getMissingExits());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.CHECK_TODAY, (_e, workerId: number) => {
    try {
      return ok(workdayService.checkToday(workerId));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.MARK_ENTRY, (_e, payload) => {
    try {
      return ok(workdayService.markEntry(markEntrySchema.parse(payload)));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.MARK_EXIT, (_e, payload) => {
    try {
      return ok(workdayService.markExit(markExitSchema.parse(payload)));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.UPDATE_RECORD, (_e, payload: { adminId?: number } & Record<string, unknown>) => {
    try {
      const dto = updateRecordSchema.parse(payload);
      return ok(workdayService.updateRecord(dto, payload.adminId ?? null));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AttendanceChannels.CREATE_MANUAL, (_e, payload: { adminId?: number } & Record<string, unknown>) => {
    try {
      const dto = createManualSchema.parse(payload);
      return ok(workdayService.createManual(dto, payload.adminId ?? null));
    } catch (e) {
      return fail(e);
    }
  });
}
