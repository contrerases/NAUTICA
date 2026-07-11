/** Tipos de liquidación mensual y reportes. Dinero en enteros CLP. */

import type { WorkerStatus, PayModel } from './worker';

export interface PeriodFilter {
  year: number;
  month: number; // 1-12
}

/** Liquidación de un trabajador en el período. net_payment puede ser negativo (deuda). */
export interface WorkerLiquidation {
  worker_id: number;
  worker_name: string;
  status: WorkerStatus;
  pay_model: PayModel;
  days_worked: number;
  total_minutes: number;
  overtime_minutes: number;
  delay_minutes: number; // total de minutos de atraso del mes
  base_payment: number; // pago por horas base (solo modelo HOURLY; 0 en sueldo fijo)
  overtime_payment: number; // pago de horas extra (ambos modelos)
  fixed_salary: number; // sueldo fijo del período (0 en modelo HOURLY)
  delay_deduction: number; // descuento por atrasos (0 en modelo HOURLY)
  gross_payment: number; // HOURLY: base+extra · FIXED_SALARY: max(0, sueldo-descuento)+extra
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
