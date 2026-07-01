/** Tipos de liquidación mensual y reportes. Dinero en enteros CLP. */

import type { WorkerStatus } from './worker';

export interface PeriodFilter {
  year: number;
  month: number; // 1-12
}

/** Liquidación de un trabajador en el período. net_payment puede ser negativo (deuda). */
export interface WorkerLiquidation {
  worker_id: number;
  worker_name: string;
  status: WorkerStatus;
  days_worked: number;
  total_minutes: number;
  overtime_minutes: number;
  base_payment: number;
  overtime_payment: number;
  gross_payment: number; // base + extra
  advances_amount: number; // adelantos del mes
  net_payment: number; // gross - advances (puede ser < 0 → deuda)
  has_debt: boolean; // net_payment < 0
}

export interface PayrollSummary {
  period: string; // "YYYY-MM"
  provisional: boolean; // true si hay turnos OPEN/PENDING que aún no suman
  total_gross: number;
  total_advances: number;
  total_net: number;
  workers: WorkerLiquidation[];
}

export interface DashboardStats {
  today_active_shifts: number; // OPEN de hoy
  today_closed_shifts: number;
  missing_exits: number; // OPEN de días anteriores
  month_gross: number;
}
