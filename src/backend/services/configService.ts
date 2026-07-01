import { configRepository, type ConfigVersionRow } from '../repositories/configRepository';
import type { ConfigVersion, ConfigView, UpdateConfigDto } from '../../shared/types/config';
import { today, tomorrow } from '../../shared/utils/date';

/** Config resuelta para una fecha, lista para construir el snapshot de un turno. */
export interface ResolvedConfig {
  startHour: string;
  exitHour: string;
  baseDailyHours: number;
  baseDailyMinutes: number;
  defaultBreakMinutes: number;
  toleranceMinutes: number;
  exitToleranceMinutes: number;
  overtimeMultiplier: number;
}

const DEFAULTS = {
  start_hour: '09:00',
  exit_hour: '18:00',
  base_daily_hours: 8.5,
  default_break_minutes: 30,
  tolerance_minutes: 5,
  exit_tolerance_minutes: 15,
  overtime_multiplier: 1.5,
};

function rowToVersion(r: ConfigVersionRow): ConfigVersion {
  return {
    startHour: r.start_hour,
    exitHour: r.exit_hour,
    baseDailyHours: r.base_daily_hours,
    defaultBreakMinutes: r.default_break_minutes,
    toleranceMinutes: r.tolerance_minutes,
    exitToleranceMinutes: r.exit_tolerance_minutes,
    overtimeMultiplier: r.overtime_multiplier,
    onboardingDone: configRepository.getOnboardingDone(),
    effectiveFrom: r.effective_from,
  };
}

export const configService = {
  /** Siembra la config inicial (vigente de inmediato) en el primer arranque. */
  ensureInitialConfig(): void {
    configRepository.ensureState();
    if (configRepository.countVersions() === 0) {
      configRepository.insertVersion({ ...DEFAULTS, effective_from: today() });
      console.log('[Config] Configuración inicial sembrada');
    }
  },

  /** Fila de config vigente para una fecha (con fallback a la config actual). */
  rawForDate(date: string): ConfigVersionRow {
    const row = configRepository.getVersionForDate(date) ?? configRepository.getVersionForDate(today());
    if (!row) throw new Error('No hay configuración inicializada.');
    return row;
  },

  /** Config resuelta para una fecha (la usa el motor de cálculo). */
  getConfigForDate(date: string): ResolvedConfig {
    const r = this.rawForDate(date);
    return {
      startHour: r.start_hour,
      exitHour: r.exit_hour,
      baseDailyHours: r.base_daily_hours,
      baseDailyMinutes: Math.round(r.base_daily_hours * 60),
      defaultBreakMinutes: r.default_break_minutes,
      toleranceMinutes: r.tolerance_minutes,
      exitToleranceMinutes: r.exit_tolerance_minutes,
      overtimeMultiplier: r.overtime_multiplier,
    };
  },

  /** Lo que ve la pantalla de Configuración: vigente hoy + cambio pendiente. */
  getConfigView(): ConfigView {
    const current = rowToVersion(this.rawForDate(today()));
    const pending = configRepository.getPending(today());
    // Regla: a lo más un cambio pendiente → tomamos el último guardado.
    const pendingVersion = pending.length ? rowToVersion(pending[pending.length - 1]) : null;
    return { current, pending: pendingVersion };
  },

  /**
   * Guarda un cambio de config. Por defecto entra en vigencia MAÑANA
   * (no afecta el día en curso ni los turnos ya iniciados). El override
   * applyFrom='today' lo aplica desde hoy. Reemplaza cualquier pendiente.
   */
  updateConfig(dto: UpdateConfigDto): ConfigView {
    if (dto.onboardingDone !== undefined) {
      configRepository.setOnboardingDone(dto.onboardingDone);
    }

    const hasFieldChanges =
      dto.startHour !== undefined ||
      dto.exitHour !== undefined ||
      dto.baseDailyHours !== undefined ||
      dto.defaultBreakMinutes !== undefined ||
      dto.toleranceMinutes !== undefined ||
      dto.exitToleranceMinutes !== undefined ||
      dto.overtimeMultiplier !== undefined;

    if (hasFieldChanges) {
      const effectiveFrom = dto.applyFrom === 'today' ? today() : tomorrow();
      // Base = config vigente hoy; se mergean solo los campos enviados.
      const base = this.rawForDate(today());
      const merged = {
        start_hour: dto.startHour ?? base.start_hour,
        exit_hour: dto.exitHour ?? base.exit_hour,
        base_daily_hours: dto.baseDailyHours ?? base.base_daily_hours,
        default_break_minutes: dto.defaultBreakMinutes ?? base.default_break_minutes,
        tolerance_minutes: dto.toleranceMinutes ?? base.tolerance_minutes,
        exit_tolerance_minutes: dto.exitToleranceMinutes ?? base.exit_tolerance_minutes,
        overtime_multiplier: dto.overtimeMultiplier ?? base.overtime_multiplier,
        effective_from: effectiveFrom,
      };
      // Un solo pendiente: se reemplaza cualquier cambio futuro previo.
      configRepository.deletePending(today());
      configRepository.insertVersion(merged);
    }

    return this.getConfigView();
  },

  /** Cancela el cambio programado: hoy sigue vigente también mañana. */
  cancelPending(): ConfigView {
    configRepository.deletePending(today());
    return this.getConfigView();
  },
};
