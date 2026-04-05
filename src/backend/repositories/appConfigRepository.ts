import { getDatabase } from '../database/connection'

export class AppConfigRepository {
  static getConfig(): any {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM app_config WHERE id = 1').get() as any
    
    if (row) {
      return {
        id: row.id,
        startHour: row.start_hour,
        exitHour: row.exit_hour,
        baseDailyHours: row.base_daily_hours,
        defaultBreakMinutes: row.default_break_minutes,
        toleranceMinutes: row.tolerance_minutes,
        exitToleranceMinutes: row.exit_tolerance_minutes,
        overtime_rate: row.overtime_rate,
        overtime_multiplier: row.overtime_multiplier,
        onboardingDone: row.onboarding_done === 1
      }
    }
    return null
  }

  static updateConfig(config: Partial<{ startHour: string, exitHour: string, baseDailyHours: number, defaultBreakMinutes: number, toleranceMinutes: number, exitToleranceMinutes: number, overtime_rate: number, overtime_multiplier: number, onboardingDone: boolean }>): boolean {
    const db = getDatabase()

    const updates: string[] = []
    const values: any[] = []

    if (config.startHour !== undefined) {
      updates.push('start_hour = ?')
      values.push(config.startHour)
    }
    if (config.exitHour !== undefined) {
      updates.push('exit_hour = ?')
      values.push(config.exitHour)
    }
    if (config.baseDailyHours !== undefined) {
      updates.push('base_daily_hours = ?')
      values.push(config.baseDailyHours)
    }
    if (config.defaultBreakMinutes !== undefined) {
      updates.push('default_break_minutes = ?')
      values.push(config.defaultBreakMinutes)
    }
    if (config.toleranceMinutes !== undefined) {
      updates.push('tolerance_minutes = ?')
      values.push(config.toleranceMinutes)
    }
    if (config.exitToleranceMinutes !== undefined) {
      updates.push('exit_tolerance_minutes = ?')
      values.push(config.exitToleranceMinutes)
    }
    if (config.overtime_rate !== undefined) {
      updates.push('overtime_rate = ?')
      values.push(config.overtime_rate)
    }
    if (config.overtime_multiplier !== undefined) {
      updates.push('overtime_multiplier = ?')
      values.push(config.overtime_multiplier)
    }
    if (config.onboardingDone !== undefined) {
      updates.push('onboarding_done = ?')
      values.push(config.onboardingDone ? 1 : 0)
    }

    if (updates.length === 0) return true

    const query = `UPDATE app_config SET ${updates.join(', ')} WHERE id = 1`    

    try {
      db.prepare(query).run(...values)
      return true
    } catch(err) {
      console.error('[AppConfigRepository] Error actualizando config:', err)    
      return false
    }
  }
}
