/** Tipos de registros de asistencia (jornada). Dinero en enteros CLP. */

import type { PayModel } from './worker';

export type AttendanceStatus = 'OPEN' | 'CLOSED';

export interface AttendanceRecord {
  id: number;
  worker_id: number;
  worker_name?: string; // presente cuando la consulta hace JOIN
  date: string; // "YYYY-MM-DD"
  entry_time: string; // "HH:MM"
  exit_time: string | null; // "HH:MM" o NULL hasta cerrar

  break_minutes: number;

  // Calculados (NULL/0 mientras está OPEN)
  worked_minutes: number | null;
  base_minutes: number | null;
  overtime_minutes: number;
  base_payment: number;
  overtime_payment: number;
  daily_payment: number | null;
  delay_minutes: number; // informativo

  status: AttendanceStatus;

  // Snapshots congelados al marcar entrada, según la fecha del turno
  hourly_rate_snap: number;
  start_hour_snap: string;
  exit_hour_snap: string;
  tolerance_snap: number;
  exit_tolerance_snap: number;
  base_daily_minutes_snap: number;
  overtime_multiplier_snap: number;
  pay_model_snap: PayModel; // modelo de pago congelado del turno

  created_at: string;
  updated_at: string | null;
  updated_by: number | null; // admin que corrigió (traza de auditoría)
}

/** Marcaje de entrada (kiosco o alta manual). date/entry_time por defecto = hoy/ahora. */
export interface MarkEntryDto {
  worker_id: number;
  date?: string;
  entry_time?: string;
}

/** Marcaje de salida. exit_time por defecto = ahora. */
export interface MarkExitDto {
  id: number;
  break_minutes?: number;
  exit_time?: string;
}

/** Corrección de un registro por el admin (con traza). */
export interface UpdateRecordDto {
  id: number;
  entry_time: string;
  exit_time?: string | null;
  break_minutes?: number;
}

/** Alta manual de un turno completo (puede ser una fecha pasada). */
export interface CreateManualRecordDto {
  worker_id: number;
  date: string;
  entry_time: string;
  exit_time?: string | null;
  break_minutes?: number;
}

export interface CheckAttendanceResult {
  hasRecord: boolean;
  record?: AttendanceRecord;
  canMarkEntry: boolean;
  canMarkExit: boolean;
}

export interface AttendanceFilter {
  worker_id?: number;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
}
