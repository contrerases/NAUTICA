import { ipcMain } from 'electron';
import { ConfigChannels } from '../../shared/types/ipc';
import { configUpdateSchema } from '../../shared/validators';
import { AppConfigRepository } from '../repositories/appConfigRepository';
import type { UpdateConfigDto } from '../../shared/types/config';

export function registerConfigHandlers() {
  ipcMain.handle(ConfigChannels.GET, () => {
    try {
      let config = AppConfigRepository.getConfig();

      if (!config) {
        // Inicializar si no existe
        AppConfigRepository.updateConfig({
            startHour: '09:00',
            exitHour: '18:00',
            baseDailyHours: 8,
            toleranceMinutes: 5,
            exitToleranceMinutes: 15,
            defaultBreakMinutes: 30,
            overtime_rate: 5000,
            overtime_multiplier: 1.5,
            onboardingDone: false
        });
        
        config = AppConfigRepository.getConfig();
      }
      return { ok: true, data: config };
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle(ConfigChannels.UPDATE, (_, updates: UpdateConfigDto) => {
    try {
      // Usar Zod para validar la entrada
      const parsedUpdates = configUpdateSchema.parse(updates);

      const success = AppConfigRepository.updateConfig({
        startHour: parsedUpdates.start_hour,
        exitHour: parsedUpdates.exit_hour,
        baseDailyHours: parsedUpdates.base_daily_hours,
        defaultBreakMinutes: parsedUpdates.default_break_minutes,
        toleranceMinutes: parsedUpdates.tolerance_minutes,
        exitToleranceMinutes: parsedUpdates.exit_tolerance_minutes,
        overtime_rate: parsedUpdates.overtime_rate,
        overtime_multiplier: parsedUpdates.overtime_multiplier,
        onboardingDone: parsedUpdates.onboarding_done !== undefined ? parsedUpdates.onboarding_done === 1 : undefined
      });

      if (!success) {
        throw new Error('Error guardando la configuracion en BD');
      }

      return { ok: true, data: AppConfigRepository.getConfig() };
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      return { ok: false, error: error.issues ? error.issues[0].message : error.message };
    }
  });
}
