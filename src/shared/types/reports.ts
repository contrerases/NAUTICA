/**
 * Tipos relacionados con reportes y estadísticas
 */

export type ReportPeriod = 'day' | 'week' | 'month' | 'custom'

export interface ReportFilter {
  period: ReportPeriod
  date_from: string // "YYYY-MM-DD"
  date_to: string // "YYYY-MM-DD"
  worker_id?: number
}

export interface ReportRow {
  worker_name: string
  date: string
  entry_time: string
  exit_time: string | null
  worked_minutes: number
  overtime_minutes: number
  delay_minutes: number
  daily_payment: number
  status: string
}

export interface WorkerPeriodSummary {
  worker_id: number
  worker_name: string
  total_days_worked: number
  total_hours: number
  total_overtime: number
  total_delays: number
  total_payment: number
}

export interface Trend {
  current: number
  previous: number
  change: number // Porcentaje de cambio
  direction: 'up' | 'down' | 'stable'
}

export interface WorkerTrends {
  hours_worked: Trend
  delays: Trend
  overtime: Trend
}

export interface DashboardStats {
  today_active_workers: number
  today_pending_exits: number
  week_total_hours: number
  week_total_payments: number
  pending_shifts_count: number
}
