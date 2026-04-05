/**
 * Tipos relacionados con registros de asistencia
 */

export type AttendanceStatus = 'OPEN' | 'CLOSED' | 'PENDING'

export interface AttendanceRecord {
  id: number
  worker_id: number
  date: string // "YYYY-MM-DD"
  entry_time: string // "HH:MM"
  exit_time: string | null // "HH:MM" o NULL

  // Snapshots (valores históricos al marcar entrada)
  hourly_rate_snap: number
  start_hour_snap: string // "HH:MM"
  exit_hour_snap: string // "HH:MM"
  tolerance_mins_snap: number
  exit_tolerance_mins_snap?: number
  base_daily_hours_snap: number
  default_break_minutes_snap: number
  overtime_rate_snap: number
  overtime_multiplier_snap?: number

  // Colación
  break_minutes: number // 0 o 30

  // Calculados al marcar salida
  worked_minutes: number | null
  overtime_minutes: number
  overtime_payment: number
  daily_payment: number | null
  delay_minutes: number

  // Estado
  status: AttendanceStatus
  created_at: string
}

export interface CreateEntryDto {
  worker_id: number
  date: string // "YYYY-MM-DD"
  entry_time: string // "HH:MM"
}

export interface UpdateExitDto {
  exit_time: string // "HH:MM"
  break_minutes: number // 0 o 30 — usuario responde si tomó colación
}

export interface DaySummary {
  worker_name: string
  date: string
  entry_time: string
  exit_time: string | null
  worked_hours: string // "8h 30min"
  overtime_hours: string // "1h 30min"
  daily_payment: number
  delay_minutes: number
  status: AttendanceStatus
}

export interface AttendanceFilter {
  worker_id?: number
  date_from?: string
  date_to?: string
  status?: AttendanceStatus
}

export interface CheckAttendanceResult {
  hasRecord: boolean
  record?: AttendanceRecord
  canMarkEntry: boolean
  canMarkExit: boolean
}
