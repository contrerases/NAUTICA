import { attendanceRepository } from '../repositories/attendanceRepository';
import { advanceRepository } from '../repositories/advanceRepository';
import { workerRepository } from '../repositories/workerRepository';
import type { PayrollSummary, WorkerLiquidation, DashboardStats } from '../../shared/types/reports';
import type { WorkerStatus } from '../../shared/types/worker';
import { today, currentMonth } from '../../shared/utils/date';
import { roundCLP } from '../../shared/utils/money';

function monthStr(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Último día del mes "YYYY-MM-DD" (para resolver la versión de sueldo del período). */
function lastDayOfMonth(year: number, month: number): string {
  const day = new Date(year, month, 0).getDate();
  return `${monthStr(year, month)}-${String(day).padStart(2, '0')}`;
}

export const payrollService = {
  /**
   * Liquidación del mes. Itera sobre la UNIÓN de trabajadores con turnos cerrados
   * y con adelantos, de modo que un adelanto nunca desaparece. El líquido puede
   * ser negativo (deuda del trabajador), y se muestra tal cual.
   */
  getPayroll(year: number, month: number): PayrollSummary {
    const period = monthStr(year, month);
    const periodRef = lastDayOfMonth(year, month); // versión de sueldo vigente al cierre del período
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
          pay_model: 'HOURLY',
          days_worked: 0,
          total_minutes: 0,
          overtime_minutes: 0,
          delay_minutes: 0,
          base_payment: 0,
          overtime_payment: 0,
          fixed_salary: 0,
          delay_deduction: 0,
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
      const row = ensure(r.worker_id, r.worker_name ?? '—', 'ACTIVE');
      // El atraso se conoce desde la entrada (incluye turnos aún abiertos).
      row.delay_minutes += r.delay_minutes ?? 0;
      if (r.status !== 'CLOSED') continue;
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

    // Sueldo fijo: se inyecta UNA vez por período, resuelto por fecha. Iteramos también
    // el padrón de ACTIVOS para incluir a un asalariado sin turnos ni adelantos.
    const candidateIds = new Set<number>([
      ...map.keys(),
      ...workerRepository.getActive().map((w) => w.id),
    ]);
    for (const id of candidateIds) {
      const sal = workerRepository.getSalaryForDate(id, periodRef);
      if (!sal || sal.pay_model !== 'FIXED_SALARY') continue;
      const worker = workerRepository.findById(id);
      if (!worker) continue;
      // Solo se agrega proactivamente si está activo; si está inactivo, solo si ya
      // tiene actividad en el mes (turnos/adelantos) para no pagar bajas antiguas.
      if (!map.has(id) && worker.status !== 'ACTIVE') continue;
      const row = ensure(id, worker.name, worker.status);
      row.pay_model = 'FIXED_SALARY';
      row.fixed_salary = sal.monthly_salary;
    }

    const workers = [...map.values()].map((w) => {
      if (w.pay_model === 'FIXED_SALARY') {
        // La jornada base va en el sueldo (no se paga por hora); el atraso del mes se
        // descuenta (min→hora × valor hora del trabajador) con tope en 0.
        const rate =
          workerRepository.getRateForDate(w.worker_id, periodRef) ??
          workerRepository.findById(w.worker_id)?.hourly_rate ??
          0;
        w.delay_deduction = roundCLP((w.delay_minutes / 60) * rate);
        w.base_payment = 0;
        const salaryAfterDelay = Math.max(0, w.fixed_salary - w.delay_deduction);
        w.gross_payment = salaryAfterDelay + w.overtime_payment;
      } else {
        w.gross_payment = w.base_payment + w.overtime_payment;
      }
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
    const [y, m] = currentMonth().split('-').map(Number);
    return {
      today_active_shifts: todays.filter((r) => r.status === 'OPEN').length,
      today_closed_shifts: todays.filter((r) => r.status === 'CLOSED').length,
      missing_exits: attendanceRepository.getMissingExits(t).length,
      // Bruto del mes = liquidación del período (incluye sueldos fijos, no solo horas).
      month_gross: this.getPayroll(y, m).total_gross,
    };
  },
};
