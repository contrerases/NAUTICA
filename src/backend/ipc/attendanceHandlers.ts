import { ipcMain } from 'electron';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { AttendanceChannels } from '../../shared/types/ipc';
import { markEntrySchema, markExitSchema } from '../../shared/validators';
import { format } from 'date-fns';

export function setupAttendanceHandlers() {
  ipcMain.handle(AttendanceChannels.CHECK_TODAY, (_, workerId: number) => {
    return attendanceRepository.checkToday(workerId);
  });

  ipcMain.handle(AttendanceChannels.GET_ALL, () => {
    return attendanceRepository.getAll();
  });

  ipcMain.handle('attendance:get-missing', () => {
    return attendanceRepository.getMissingExits();
  });

  ipcMain.handle(AttendanceChannels.GET_BY_WORKER, (_, workerId: number) => {
    return attendanceRepository.getByWorker(workerId);
  });

  ipcMain.handle(AttendanceChannels.MARK_ENTRY, (_, data: { worker_id: number; date?: string; entry_time?: string }) => {
    try {
      const parsedData = markEntrySchema.parse(data);
      const entryTime = parsedData.entry_time || format(new Date(), 'HH:mm');
      const date = parsedData.date || format(new Date(), 'yyyy-MM-dd');
      
      return attendanceRepository.markEntry({ worker_id: parsedData.worker_id, entry_time: entryTime, date: date });
    } catch (error: any) {
      console.error('Error marcando entrada:', error);
      throw new Error(error.issues ? error.issues[0].message : error.message || 'Error al registrar la entrada');
    }
  });

  ipcMain.handle(AttendanceChannels.MARK_EXIT, (_, data: { id: number; break_minutes?: number; exit_time?: string }) => {
    try {
      const parsedData = markExitSchema.parse(data);
      const breakMinutes = parsedData.break_minutes ?? 0;
      const exitTime = data.exit_time || format(new Date(), 'HH:mm');
      
      return attendanceRepository.markExit(parsedData.id, { break_minutes: breakMinutes, exit_time: exitTime });
    } catch (error: any) {
      console.error('Error marcando salida:', error);
      throw new Error(error.issues ? error.issues[0].message : error.message || 'Error al registrar la salida');
    }
  });

  ipcMain.handle(AttendanceChannels.UPDATE_RECORD, (_, data: { id: number; entry_time: string; exit_time?: string | null; break_minutes?: number }) => {
    try {
      if (!data.id || !data.entry_time) {
        throw new Error('Faltan datos requeridos (id, hora de entrada)');
      }
      return { ok: true, data: attendanceRepository.updateRecord(data.id, data) };
    } catch (error: any) {
       console.error('Error actualizando registro:', error);
       return { ok: false, error: error.message || 'Error al actualizar el registro' };
    }
  });
}

