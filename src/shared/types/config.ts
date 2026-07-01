/** Configuración global de jornada. Versionada por fecha de vigencia. */

export interface AppConfig {
  startHour: string; // "HH:MM"
  exitHour: string; // "HH:MM"
  baseDailyHours: number; // horas (para la UI). En minutos internamente.
  defaultBreakMinutes: number;
  toleranceMinutes: number;
  exitToleranceMinutes: number;
  overtimeMultiplier: number;
  onboardingDone: boolean;
}

/** Una versión de la config, con su fecha de entrada en vigencia. */
export interface ConfigVersion extends AppConfig {
  effectiveFrom: string; // "YYYY-MM-DD"
}

/** Lo que ve la pantalla de Configuración: lo vigente hoy y el cambio pendiente. */
export interface ConfigView {
  current: ConfigVersion; // corriendo hoy
  pending: ConfigVersion | null; // programado a futuro (mañana), o null
}

export interface UpdateConfigDto {
  startHour?: string;
  exitHour?: string;
  baseDailyHours?: number;
  defaultBreakMinutes?: number;
  toleranceMinutes?: number;
  exitToleranceMinutes?: number;
  overtimeMultiplier?: number;
  onboardingDone?: boolean;
  /** Cuándo aplica el cambio. 'tomorrow' (por defecto) o 'today' (override con alerta). */
  applyFrom?: 'today' | 'tomorrow';
}
