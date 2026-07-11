import { getDatabase } from '../database/connection';
import type { Worker, WorkerStatus, PayModel } from '../../shared/types/worker';
import { addDays } from '../../shared/utils/date';

/** Acceso a datos de trabajadores y su historial de tarifa. Solo SQL. */
export const workerRepository = {
  getAll(): Worker[] {
    return getDatabase().prepare('SELECT * FROM workers ORDER BY name ASC').all() as Worker[];
  },

  getActive(): Worker[] {
    return getDatabase()
      .prepare("SELECT * FROM workers WHERE status = 'ACTIVE' ORDER BY name ASC")
      .all() as Worker[];
  },

  findById(id: number): Worker | undefined {
    return getDatabase().prepare('SELECT * FROM workers WHERE id = ?').get(id) as Worker | undefined;
  },

  findByRut(rut: string): Worker | undefined {
    return getDatabase().prepare('SELECT * FROM workers WHERE rut = ?').get(rut) as Worker | undefined;
  },

  findByDni(dni: string): Worker | undefined {
    return getDatabase().prepare('SELECT * FROM workers WHERE dni = ?').get(dni) as Worker | undefined;
  },

  insert(data: {
    name: string;
    rut: string | null;
    dni: string | null;
    photo: string | null;
    hourly_rate: number;
    pay_model: PayModel;
    monthly_salary: number;
    start_date: string;
  }): number {
    const info = getDatabase()
      .prepare(
        `INSERT INTO workers (name, rut, dni, photo, hourly_rate, pay_model, monthly_salary, start_date)
         VALUES (@name, @rut, @dni, @photo, @hourly_rate, @pay_model, @monthly_salary, @start_date)`,
      )
      .run(data);
    return info.lastInsertRowid as number;
  },

  /** Actualiza solo los campos presentes. Registra el admin que modificó (traza). */
  update(id: number, fields: Partial<Worker>, adminId: number | null): void {
    const allowed = ['name', 'rut', 'dni', 'photo', 'hourly_rate', 'pay_model', 'monthly_salary', 'start_date', 'status'] as const;
    const sets: string[] = [];
    const params: Record<string, unknown> = { id };
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        params[key] = fields[key];
      }
    }
    sets.push("updated_at = datetime('now', 'localtime')");
    sets.push('updated_by = @adminId');
    params.adminId = adminId;
    getDatabase().prepare(`UPDATE workers SET ${sets.join(', ')} WHERE id = @id`).run(params);
  },

  setStatus(id: number, status: WorkerStatus, adminId: number | null): void {
    getDatabase()
      .prepare(
        `UPDATE workers SET status = ?, updated_at = datetime('now', 'localtime'), updated_by = ? WHERE id = ?`,
      )
      .run(status, adminId, id);
  },

  /** Borrado físico del trabajador (los hijos financieros se borran explícitamente en el servicio). */
  deleteWorker(id: number): void {
    getDatabase().prepare('DELETE FROM workers WHERE id = ?').run(id);
  },

  // ── Historial de tarifa (valor hora por fecha, con tramos) ──────
  insertRate(
    workerId: number,
    hourlyRate: number,
    effectiveFrom: string,
    adminId: number | null = null,
    note: string | null = null,
  ): void {
    getDatabase()
      .prepare(
        `INSERT INTO worker_rate_history (worker_id, hourly_rate, effective_from, note, created_by)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(workerId, hourlyRate, effectiveFrom, note, adminId);
  },

  /** Tarifa vigente en una fecha: la de mayor effective_from <= date. */
  getRateForDate(workerId: number, date: string): number | undefined {
    const row = getDatabase()
      .prepare(
        `SELECT hourly_rate FROM worker_rate_history
         WHERE worker_id = ? AND effective_from <= ?
         ORDER BY effective_from DESC, id DESC LIMIT 1`,
      )
      .get(workerId, date) as { hourly_rate: number } | undefined;
    return row?.hourly_rate;
  },

  /**
   * Fija el valor hora para un rango de fechas.
   *  - Sin `to`: cambio ABIERTO desde `from` (aumento o corrección hacia adelante).
   *  - Con `to`: corrige SOLO el tramo [from, to] al valor dado y restaura, desde
   *    to+1, el valor que venía después (así el resto del historial no cambia).
   */
  setRateRange(
    workerId: number,
    value: number,
    from: string,
    to: string | null,
    adminId: number | null,
    note: string | null,
  ): void {
    if (!to) {
      this.insertRate(workerId, value, from, adminId, note);
      return;
    }
    const after = this.getRateForDate(workerId, addDays(to, 1)); // valor tras el tramo (pre-op)
    // Quita versiones dentro de (from, to] para que el valor sea uniforme en el tramo.
    getDatabase()
      .prepare(
        `DELETE FROM worker_rate_history
         WHERE worker_id = ? AND effective_from > ? AND effective_from <= ?`,
      )
      .run(workerId, from, to);
    this.insertRate(workerId, value, from, adminId, note);
    if (after != null) {
      this.insertRate(workerId, after, addDays(to, 1), adminId, 'restaurar tras corrección');
    }
  },

  // ── Historial de modelo de pago + sueldo ────────────────
  insertSalary(workerId: number, payModel: PayModel, monthlySalary: number, effectiveFrom: string): void {
    getDatabase()
      .prepare(
        `INSERT INTO worker_salary_history (worker_id, pay_model, monthly_salary, effective_from)
         VALUES (?, ?, ?, ?)`,
      )
      .run(workerId, payModel, monthlySalary, effectiveFrom);
  },

  /** Modelo + sueldo vigentes en una fecha: la versión de mayor effective_from <= date. */
  getSalaryForDate(
    workerId: number,
    date: string,
  ): { pay_model: PayModel; monthly_salary: number } | undefined {
    const row = getDatabase()
      .prepare(
        `SELECT pay_model, monthly_salary FROM worker_salary_history
         WHERE worker_id = ? AND effective_from <= ?
         ORDER BY effective_from DESC, id DESC LIMIT 1`,
      )
      .get(workerId, date) as { pay_model: PayModel; monthly_salary: number } | undefined;
    return row;
  },
};
