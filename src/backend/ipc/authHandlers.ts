import { ipcMain } from 'electron';
import { AuthService } from '../services/authService';
import { AuthChannels } from '../../shared/types/ipc';
import { loginSchema, changePasswordSchema } from '../../shared/validators';

export function registerAuthHandlers() {
  ipcMain.handle(AuthChannels.LOGIN, async (event, args) => {
    try {
      const parsedData = loginSchema.parse(args);

      const user = await AuthService.login(parsedData.username, parsedData.password);
      return { success: true, user };
    } catch (error: any) {
      console.error('[IPC auth:login]', error);
      return { success: false, error: error.issues ? error.issues[0].message : error.message || 'Error de autenticación' };
    }
  });

  ipcMain.handle(AuthChannels.CHANGE_PASSWORD, async (event, args) => {
    try {
      const parsedData = changePasswordSchema.parse(args);

      await AuthService.changePassword(parsedData.username, parsedData.oldPassword, parsedData.newPassword);
      return { success: true };
    } catch (error: any) {
      console.error('[IPC auth:change-password]', error);
      return { success: false, error: error.issues ? error.issues[0].message : error.message || 'Error al cambiar la contraseña' };
    }
  });
}
