import { ipcMain } from 'electron';
import { ConfigChannels } from '../../shared/types/ipc';
import { configUpdateSchema } from '../../shared/validators';
import { configService } from '../services/configService';
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
}
