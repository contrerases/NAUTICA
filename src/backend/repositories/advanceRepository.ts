import { getDatabase } from '../database/connection';
import type { WorkerAdvance, CreateWorkerAdvanceDto } from '../../shared/types/worker';

/** Adelantos de dinero. Solo SQL. */
export const advanceRepository = {
  create(data: CreateWorkerAdvanceDto): WorkerAdvance {
    const info = getDatabase()
      .prepare(
        `INSERT INTO worker_advances (worker_id, amount, date, notes) VALUES (?, ?, ?, ?)`,
      )
      .run(data.worker_id, data.amount, data.date, data.notes ?? null);
    return this.getById(info.lastInsertRowid as number)!;
  },

  getById(id: number): WorkerAdvance | undefined {
    return getDatabase()
      .prepare('SELECT * FROM worker_advances WHERE id = ?')
      .get(id) as WorkerAdvance | undefined;
  },

  update(id: number, data: { amount: number; date: string; notes: string | null }): WorkerAdvance {
    getDatabase()
      .prepare('UPDATE worker_advances SET amount = @amount, date = @date, notes = @notes WHERE id = @id')
      .run({ id, amount: data.amount, date: data.date, notes: data.notes });
    return this.getById(id)!;
  },

  delete(id: number): boolean {
    return getDatabase().prepare('DELETE FROM worker_advances WHERE id = ?').run(id).changes > 0;
  },

  /** Historial completo de un trabajador (todos los meses). */
  getByWorker(workerId: number): WorkerAdvance[] {
    return getDatabase()
      .prepare('SELECT * FROM worker_advances WHERE worker_id = ? ORDER BY date DESC, created_at DESC')
      .all(workerId) as WorkerAdvance[];
  },

  getByWorkerAndMonth(workerId: number, month: string): WorkerAdvance[] {
    return getDatabase()
      .prepare(
        `SELECT * FROM worker_advances WHERE worker_id = ? AND date LIKE ?
         ORDER BY date DESC, created_at DESC`,
      )
      .all(workerId, `${month}-%`) as WorkerAdvance[];
  },

  /** Adelantos del mes con nombre y estado del trabajador (para la liquidación). */
  getByMonthWithNames(
    month: string,
  ): Array<WorkerAdvance & { worker_name: string; worker_status: string }> {
    return getDatabase()
      .prepare(
        `SELECT adv.*, w.name AS worker_name, w.status AS worker_status
         FROM worker_advances adv
         JOIN workers w ON w.id = adv.worker_id
         WHERE adv.date LIKE ?
         ORDER BY adv.date DESC, adv.created_at DESC`,
      )
      .all(`${month}-%`) as Array<WorkerAdvance & { worker_name: string; worker_status: string }>;
  },

  countByWorker(workerId: number): number {
    const row = getDatabase()
      .prepare('SELECT COUNT(*) AS c FROM worker_advances WHERE worker_id = ?')
      .get(workerId) as { c: number };
    return row.c;
  },
};
