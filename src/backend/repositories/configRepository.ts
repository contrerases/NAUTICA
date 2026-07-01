import { getDatabase } from '../database/connection';

/** Fila cruda de una versión de configuración. */
export interface ConfigVersionRow {
  id: number;
  start_hour: string;
  exit_hour: string;
  base_daily_hours: number;
  default_break_minutes: number;
  tolerance_minutes: number;
  exit_tolerance_minutes: number;
  overtime_multiplier: number;
  effective_from: string;
  created_at: string;
}

export type ConfigVersionInput = Omit<ConfigVersionRow, 'id' | 'created_at'>;

/** Acceso a datos de configuración versionada y estado global. Solo SQL. */
export const configRepository = {
  insertVersion(v: ConfigVersionInput): void {
    getDatabase()
      .prepare(
        `INSERT INTO config_versions (
           start_hour, exit_hour, base_daily_hours, default_break_minutes,
           tolerance_minutes, exit_tolerance_minutes, overtime_multiplier, effective_from
         ) VALUES (
           @start_hour, @exit_hour, @base_daily_hours, @default_break_minutes,
           @tolerance_minutes, @exit_tolerance_minutes, @overtime_multiplier, @effective_from
         )`,
      )
      .run(v);
  },

  /** Config vigente en una fecha: la de mayor effective_from <= date. */
  getVersionForDate(date: string): ConfigVersionRow | undefined {
    return getDatabase()
      .prepare(
        `SELECT * FROM config_versions WHERE effective_from <= ?
         ORDER BY effective_from DESC, id DESC LIMIT 1`,
      )
      .get(date) as ConfigVersionRow | undefined;
  },

  /** Cambios programados a futuro (effective_from > today). */
  getPending(today: string): ConfigVersionRow[] {
    return getDatabase()
      .prepare(
        `SELECT * FROM config_versions WHERE effective_from > ?
         ORDER BY effective_from ASC, id ASC`,
      )
      .all(today) as ConfigVersionRow[];
  },

  /** Elimina los cambios pendientes (para reemplazarlos o cancelarlos). */
  deletePending(today: string): number {
    return getDatabase()
      .prepare('DELETE FROM config_versions WHERE effective_from > ?')
      .run(today).changes;
  },

  countVersions(): number {
    const row = getDatabase().prepare('SELECT COUNT(*) AS c FROM config_versions').get() as {
      c: number;
    };
    return row.c;
  },

  // ── Estado global ───────────────────────────────────────
  ensureState(): void {
    getDatabase()
      .prepare('INSERT OR IGNORE INTO app_state (id, onboarding_done) VALUES (1, 0)')
      .run();
  },

  getOnboardingDone(): boolean {
    const row = getDatabase()
      .prepare('SELECT onboarding_done FROM app_state WHERE id = 1')
      .get() as { onboarding_done: number } | undefined;
    return row?.onboarding_done === 1;
  },

  setOnboardingDone(done: boolean): void {
    getDatabase()
      .prepare('UPDATE app_state SET onboarding_done = ? WHERE id = 1')
      .run(done ? 1 : 0);
  },
};
