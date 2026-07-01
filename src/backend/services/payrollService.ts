import { attendanceRepository } from '../repositories/attendanceRepository';
import { advanceRepository } from '../repositories/advanceRepository';
import type { PayrollSummary, WorkerLiquidation, DashboardStats } from '../../shared/types/reports';
import type { WorkerStatus } from '../../shared/types/worker';
import { today, currentMonth } from '../../shared/utils/date';

function monthStr(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export const payrollService = {
  /**
   * Liquidación del mes. Itera sobre la UNIÓN de trabajadores con turnos cerrados
   * y con adelantos, de modo que un adelanto nunca desaparece. El líquido puede
   * ser negativo (deuda del trabajador), y se muestra tal cual.
   */
  getPayroll(year: number, month: number): PayrollSummary {
    const period = monthStr(year, month);
    const records = attendanceRepository.getByMonthWithNames(period);
    const advances = advanceRepository.getByMonthWithNames(period);

    const map = new Map<number, WorkerLiquidation>();
    const ensure = (id: number, name: string, status: string): WorkerLiquidation => {
      let row = map.get(id);
      if (!row) {
        row = {
          worker_id: id,
          worker_name: name,
          status: status as WorkerStatus,
          days_worked: 0,
          total_minutes: 0,
          overtime_minutes: 0,
          base_payment: 0,
          overtime_payment: 0,
          gross_payment: 0,
          advances_amount: 0,
          net_payment: 0,
          has_debt: false,
        };
        map.set(id, row);
      }
      return row;
    };

    for (const r of records) {
      if (r.status !== 'CLOSED') continue;
      const row = ensure(r.worker_id, r.worker_name ?? '—', 'ACTIVE');
      row.days_worked += 1;
      row.total_minutes += r.worked_minutes ?? 0;
      row.overtime_minutes += r.overtime_minutes;
      row.base_payment += r.base_payment;
      row.overtime_payment += r.overtime_payment;
    }

    for (const a of advances) {
      const row = ensure(a.worker_id, a.worker_name, a.worker_status);
      row.advances_amount += a.amount;
    }

    const workers = [...map.values()].map((w) => {
      w.gross_payment = w.base_payment + w.overtime_payment;
      w.net_payment = w.gross_payment - w.advances_amount;
      w.has_debt = w.net_payment < 0;
      return w;
    });
    workers.sort((a, b) => a.worker_name.localeCompare(b.worker_name, 'es'));

    // Provisional si hay turnos del mes sin cerrar (aún no suman su pago).
    const provisional = records.some((r) => r.status !== 'CLOSED');

    return {
      period,
      provisional,
      total_gross: workers.reduce((s, w) => s + w.gross_payment, 0),
      total_advances: workers.reduce((s, w) => s + w.advances_amount, 0),
      total_net: workers.reduce((s, w) => s + w.net_payment, 0),
      workers,
    };
  },

  getDashboard(): DashboardStats {
    const t = today();
    const monthRecords = attendanceRepository.getByMonthWithNames(currentMonth());
    const todays = monthRecords.filter((r) => r.date === t);
    return {
      today_active_shifts: todays.filter((r) => r.status === 'OPEN').length,
      today_closed_shifts: todays.filter((r) => r.status === 'CLOSED').length,
      missing_exits: attendanceRepository.getMissingExits(t).length,
      month_gross: monthRecords
        .filter((r) => r.status === 'CLOSED')
        .reduce((s, r) => s + (r.daily_payment ?? 0), 0),
    };
  },
};
