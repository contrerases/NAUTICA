/**
 * Tipos relacionados con la configuración de la aplicación
 */

export interface AppConfig {
  id: number // Siempre 1
  start_hour: string // "HH:MM"
  exit_hour: string // "HH:MM"
  base_daily_hours: number
  default_break_minutes: number
  tolerance_minutes: number
  exit_tolerance_minutes: number
  overtime_rate: number
  overtime_multiplier: number
  onboarding_done: number // 0 o 1
}

export interface UpdateConfigDto {
  start_hour?: string
  exit_hour?: string
  base_daily_hours?: number
  default_break_minutes?: number
  tolerance_minutes?: number
  exit_tolerance_minutes?: number
  overtime_rate?: number
  overtime_multiplier?: number
  onboarding_done?: number
}
