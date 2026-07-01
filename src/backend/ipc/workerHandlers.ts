import { ipcMain } from 'electron';
import { WorkerChannels } from '../../shared/types/ipc';
import {
  createWorkerSchema,
  updateWorkerSchema,
  workerIdentitySchema,
  advanceSchema,
} from '../../shared/validators';
import { isValidRut } from '../../shared/utils/rut';
import { workerService } from '../services/workerService';
import { ok, fail } from './helpers';

export function registerWorkerHandlers(): void {
  ipcMain.handle(WorkerChannels.GET_ALL, () => {
    try {
      return ok(workerService.getAll());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.GET_ACTIVE, () => {
    try {
      return ok(workerService.getActive());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.GET_BY_ID, (_e, id: number) => {
    try {
      return ok(workerService.getById(id));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.IDENTIFY, (_e, payload) => {
    try {
      return ok(workerService.identify(workerIdentitySchema.parse(payload)));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.VALIDATE_RUT, (_e, rut: string) => {
    return ok(isValidRut(rut));
  });

  ipcMain.handle(WorkerChannels.CREATE, (_e, payload) => {
    try {
      const data = createWorkerSchema.parse(payload);
      return ok(workerService.create(data));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.UPDATE, (_e, payload: { id: number; data: unknown; adminId?: number }) => {
    try {
      const data = updateWorkerSchema.parse(payload.data);
      return ok(workerService.update(payload.id, data, payload.adminId ?? null));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.DEACTIVATE, (_e, payload: { id: number; adminId?: number }) => {
    try {
      return ok(workerService.deactivate(payload.id, payload.adminId ?? null));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.REACTIVATE, (_e, payload: { id: number; adminId?: number }) => {
    try {
      return ok(workerService.reactivate(payload.id, payload.adminId ?? null));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.HARD_DELETE, (_e, id: number) => {
    try {
      workerService.hardDelete(id);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.ADVANCE_ADD, (_e, payload) => {
    try {
      return ok(workerService.addAdvance(advanceSchema.parse(payload)));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.ADVANCE_LIST, (_e, payload: { workerId: number; month: string }) => {
    try {
      return ok(workerService.listAdvances(payload.workerId, payload.month));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(WorkerChannels.ADVANCE_DELETE, (_e, id: number) => {
    try {
      return ok(workerService.deleteAdvance(id));
    } catch (e) {
      return fail(e);
    }
  });
}
