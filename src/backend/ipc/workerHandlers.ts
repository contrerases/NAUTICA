import { ipcMain } from 'electron';
import { workerRepository } from '../repositories/workerRepository';
import { advanceRepository } from '../repositories/advanceRepository';
import { WorkerChannels } from '../../shared/types/ipc';
import { workerIdentitySchema } from '../../shared/validators';
import type { CreateWorkerDto, UpdateWorkerDto, WorkerIdentityDto, CreateWorkerAdvanceDto } from '../../shared/types/worker';

export function setupWorkerHandlers() {
  ipcMain.handle(WorkerChannels.ADVANCE_ADD, (_, data: CreateWorkerAdvanceDto) => {
    try {
      const result = advanceRepository.createAdvance(data);
      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle(WorkerChannels.ADVANCE_LIST, (_, { workerId, year, month }: { workerId: number, year: number, month: number }) => {
    try {
      const result = advanceRepository.getAdvancesByWorkerAndMonth(workerId, year, month);
      return { ok: true, data: result };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle(WorkerChannels.ADVANCE_DELETE, (_, id: number) => {
    try {
      const result = advanceRepository.deleteAdvance(id);
      return { ok: !!result };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });
  ipcMain.handle(WorkerChannels.GET_ALL, () => {
    return workerRepository.getAll();
  });

  ipcMain.handle(WorkerChannels.GET_ACTIVE, () => {
    return workerRepository.getActive();
  });

  ipcMain.handle(WorkerChannels.GET_BY_ID, (_, id: number) => {
    return workerRepository.findById(id);
  });

  ipcMain.handle(WorkerChannels.IDENTIFY, (_, identity: WorkerIdentityDto) => {
    try {
      const parsedIdentity = workerIdentitySchema.parse(identity);
      const worker = workerRepository.findByIdentity(parsedIdentity);
      if (worker) {
        return { found: true, worker };
      }
      return { found: false };
    } catch (error: any) {
      console.error('Error buscando trabajador por identidad:', error);
      throw new Error(error.issues ? error.issues[0].message : error.message);
    }
  });

  ipcMain.handle(WorkerChannels.CREATE, (_, data: CreateWorkerDto) => {
    try {
      // Falta validación Zod completa para CreateWorkerDto aquí, la agregaremos en un futuro si se pide, por ahora validamos básico o dejamos
      return workerRepository.create(data);
    } catch (error: any) {
      console.error('Error creando trabajador:', error);
      throw new Error(error.message);
    }
  });

  ipcMain.handle(WorkerChannels.UPDATE, (_, data: { id: number; data: UpdateWorkerDto }) => {
    try {
      return workerRepository.update(data.id, data.data);
    } catch (error: any) {
      console.error('Error actualizando trabajador:', error);
      throw new Error(error.message);
    }
  });

  ipcMain.handle(WorkerChannels.DELETE, (_, id: number) => {
    try {
      workerRepository.hardDelete(id);
      return { success: true };
    } catch (error: any) {
      console.error('Error eliminando trabajador:', error);
      throw new Error(error.message);
    }
  });
}
