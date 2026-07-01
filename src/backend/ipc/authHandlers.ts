import { ipcMain } from 'electron';
import { AuthChannels } from '../../shared/types/ipc';
import { loginSchema, changePasswordSchema } from '../../shared/validators';
import { authService } from '../services/authService';
import { ok, fail } from './helpers';

export function registerAuthHandlers(): void {
  ipcMain.handle(AuthChannels.LOGIN, async (_e, payload) => {
    try {
      const { username, password } = loginSchema.parse(payload);
      return ok(await authService.login(username, password));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(AuthChannels.CHANGE_PASSWORD, async (_e, payload) => {
    try {
      const { username, oldPassword, newPassword } = changePasswordSchema.parse(payload);
      await authService.changePassword(username, oldPassword, newPassword);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  });
}
