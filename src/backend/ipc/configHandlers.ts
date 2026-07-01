import { ipcMain, dialog, BrowserWindow } from 'electron';
import { ConfigChannels } from '../../shared/types/ipc';
import { configUpdateSchema } from '../../shared/validators';
import { configService } from '../services/configService';
import { backupDatabase } from '../database/connection';
import { today } from '../../shared/utils/date';
import { ok, fail } from './helpers';

export function registerConfigHandlers(): void {
  ipcMain.handle(ConfigChannels.GET, () => {
    try {
      return ok(configService.getConfigView());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(ConfigChannels.UPDATE, (_e, payload) => {
    try {
      const dto = configUpdateSchema.parse(payload);
      return ok(configService.updateConfig(dto));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(ConfigChannels.CANCEL_PENDING, () => {
    try {
      return ok(configService.cancelPending());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(ConfigChannels.BACKUP, async () => {
    try {
      const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      const result = await dialog.showSaveDialog(win!, {
        title: 'Guardar respaldo de la base de datos',
        defaultPath: `nautica_backup_${today()}.db`,
        filters: [{ name: 'Base de datos SQLite', extensions: ['db'] }],
      });
      if (result.canceled || !result.filePath) return ok({ canceled: true });
      backupDatabase(result.filePath);
      return ok({ canceled: false, path: result.filePath });
    } catch (e) {
      return fail(e);
    }
  });
}
