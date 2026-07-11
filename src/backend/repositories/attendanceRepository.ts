import { getDatabase } from '../database/connection';
import type { AttendanceRecord } from '../../shared/types/attendance';
import type { PayModel } from '../../shared/types/worker';

/** Acceso a datos de asistencia. Solo SQL: el cálculo vive en WorkdayService. */

export interface AttendanceSnapshot {
  hourly_rate_snap: number;
  start_hour_snap: string;
  exit_hour_snap: string;
  tolerance_snap: number;
  exit_tolerance_snap: number;
  base_daily_minutes_snap: number;
  overtime_multiplier_snap: number;
  pay_model_snap: PayModel;
}

export interface CloseFields {
  exit_time: string;
  break_minutes: number;
  worked_minutes: number;
  base_minutes: number;
  overtime_minutes: number;
  base_payment: number;
  overtime_payment: number;
  daily_payment: number;
}

const WITH_NAME = `
  SELECT a.*, w.name AS worker_name
  FROM attendance_records a
  JOIN workers w ON w.id = a.worker_id
`;

export const attendanceRepository = {
  findById(id: number): AttendanceRecord | undefined {
    return getDatabase()
      .prepare('SELECT * FROM attendance_records WHERE id = ?')
      .get(id) as AttendanceRecord | undefined;
  },

  findByWorkerAndDate(workerId: number, date: string): AttendanceRecord | undefined {
    return getDatabase()
      .prepare('SELECT * FROM attendance_records WHERE worker_id = ? AND date = ?')
      .get(workerId, date) as AttendanceRecord | undefined;
  },

  getAllWithNames(): AttendanceRecord[] {
    return getDatabase()
      .prepare(`${WITH_NAME} ORDER BY a.date DESC, a.entry_time DESC`)
      .all() as AttendanceRecord[];
  },

  getByWorkerWithNames(workerId: number): AttendanceRecord[] {
    return getDatabase()
      .prepare(`${WITH_NAME} WHERE a.worker_id = ? ORDER BY a.date DESC, a.entry_time DESC`)
      .all(workerId) as AttendanceRecord[];
  },

  /** Turnos OPEN de días anteriores a `today` (salidas olvidadas), de trabajadores activos. */
  getMissingExits(today: string): AttendanceRecord[] {
    return getDatabase()
      .prepare(
        `${WITH_NAME} WHERE a.status = 'OPEN' AND a.date < ? AND w.status = 'ACTIVE'
         ORDER BY a.date ASC, a.entry_time ASC`,
      )
      .all(today) as AttendanceRecord[];
  },

  /** Todos los registros de un mes "YYYY-MM" (cualquier estado). */
  getByMonthWithNames(month: string): AttendanceRecord[] {
    return getDatabase()
      .prepare(`${WITH_NAME} WHERE a.date LIKE ? ORDER BY a.date ASC`)
      .all(`${month}-%`) as AttendanceRecord[];
  },

  insertOpen(data: {
    worker_id: number;
    date: string;
    entry_time: string;
    delay_minutes: number;
    snap: AttendanceSnapshot;
  }): number {
    const info = getDatabase()
      .prepare(
        `INSERT INTO attendance_records (
           worker_id, date, entry_time, status, delay_minutes,
           hourly_rate_snap, start_hour_snap, exit_hour_snap, tolerance_snap,
           exit_tolerance_snap, base_daily_minutes_snap, overtime_multiplier_snap, pay_model_snap
         ) VALUES (
           @worker_id, @date, @entry_time, 'OPEN', @delay_minutes,
           @hourly_rate_snap, @start_hour_snap, @exit_hour_snap, @tolerance_snap,
           @exit_tolerance_snap, @base_daily_minutes_snap, @overtime_multiplier_snap, @pay_model_snap
         )`,
      )
      .run({
        worker_id: data.worker_id,
        date: data.date,
        entry_time: data.entry_time,
        delay_minutes: data.delay_minutes,
        ...data.snap,
      });
    return info.lastInsertRowid as number;
  },

  /** Cierra (o recierra) un registro con los valores ya calculados. */
  applyClose(id: number, fields: CloseFields, updatedBy: number | null): void {
    getDatabase()
      .prepare(
        `UPDATE attendance_records SET
           exit_time = @exit_time, break_minutes = @break_minutes,
           worked_minutes = @worked_minutes, base_minutes = @base_minutes,
           overtime_minutes = @overtime_minutes, base_payment = @base_payment,
           overtime_payment = @overtime_payment, daily_payment = @daily_payment,
           status = 'CLOSED',
           updated_at = datetime('now', 'localtime'), updated_by = @updatedBy
         WHERE id = @id`,
      )
      .run({ id, updatedBy, ...fields });
  },

  /** Deja el registro OPEN (sin salida), con la entrada/atraso indicados y montos en 0. */
  applyReopen(id: number, entryTime: string, delayMinutes: number, updatedBy: number | null): void {
    getDatabase()
      .prepare(
        `UPDATE attendance_records SET
           entry_time = @entry_time, exit_time = NULL, break_minutes = 0,
           worked_minutes = NULL, base_minutes = NULL, overtime_minutes = 0,
           base_payment = 0, overtime_payment = 0, daily_payment = NULL,
           delay_minutes = @delay_minutes, status = 'OPEN',
           updated_at = datetime('now', 'localtime'), updated_by = @updatedBy
         WHERE id = @id`,
      )
      .run({ id, entry_time: entryTime, delay_minutes: delayMinutes, updatedBy });
  },

  hasAny(): boolean {
    const row = getDatabase().prepare('SELECT COUNT(*) AS c FROM attendance_records').get() as {
      c: number;
    };
    return row.c > 0;
  },
};
