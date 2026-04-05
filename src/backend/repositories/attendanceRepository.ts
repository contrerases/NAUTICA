import { getDatabase } from '../database/connection';
import type { AttendanceRecord, CreateEntryDto, UpdateExitDto, CheckAttendanceResult } from '../../shared/types/attendance';
import { AppConfigRepository } from './appConfigRepository';
import { workerRepository } from './workerRepository';
import { format } from 'date-fns';

export class AttendanceRepository {
  private execAndMap(sql: string, params: any = []): AttendanceRecord[] {
    const db = getDatabase();
    return db.prepare(sql).all(...params) as AttendanceRecord[];
  }

  private getOne(sql: string, params: any = []): AttendanceRecord | undefined {
    const db = getDatabase();
    return db.prepare(sql).get(...params) as AttendanceRecord | undefined;
  }

  getAll(): AttendanceRecord[] {
    return this.execAndMap(`
      SELECT a.*, w.name as worker_name
      FROM attendance_records a
      JOIN workers w ON a.worker_id = w.id
      ORDER BY a.date DESC, a.entry_time DESC
    `);
  }

  getByWorker(workerId: number): AttendanceRecord[] {
    return this.execAndMap(`
      SELECT a.*, w.name as worker_name
      FROM attendance_records a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.worker_id = ?
      ORDER BY a.date DESC, a.entry_time DESC
    `, [workerId]);
  }

  checkToday(workerId: number): CheckAttendanceResult {
    const today = format(new Date(), 'yyyy-MM-dd');
    const record = this.getOne('SELECT * FROM attendance_records WHERE worker_id = ? AND date = ?', [workerId, today]);
    
    return {
      hasRecord: !!record,
      record: record,
      canMarkEntry: !record,
      canMarkExit: !!record && record.status === 'OPEN'
    };
  }

  getMissingExits(): AttendanceRecord[] {
    return this.execAndMap(`
      SELECT a.*, w.name as worker_name
      FROM attendance_records a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.status = 'OPEN' AND w.status = 'ACTIVE'
      ORDER BY a.date ASC, a.entry_time ASC
    `);
  }

  markEntry(data: CreateEntryDto): AttendanceRecord {
    const config = AppConfigRepository.getConfig();
    const worker = workerRepository.findById(data.worker_id);

    if (!worker) {
      throw new Error('Trabajador no encontrado');
    }

    const startParts = config.startHour.split(':').map(Number);
    const startMins = startParts[0] * 60 + startParts[1];

    const entryParts = data.entry_time.split(':').map(Number);
    const entryMins = entryParts[0] * 60 + entryParts[1];

    let effEntryMins = entryMins;
    if (entryMins > startMins && entryMins <= (startMins + config.toleranceMinutes)) {
      effEntryMins = startMins;
    }

    let delayMins = effEntryMins > startMins ? effEntryMins - startMins : 0;
    if (delayMins > 0) {
      delayMins = effEntryMins - (startMins + config.toleranceMinutes);
      if (delayMins < 0) delayMins = 0;
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO attendance_records (
        worker_id, date, entry_time,
        hourly_rate_snap, start_hour_snap, tolerance_mins_snap, exit_tolerance_mins_snap,
        base_daily_hours_snap, exit_hour_snap, default_break_minutes_snap, overtime_rate_snap, overtime_multiplier_snap,
        delay_minutes, status, break_minutes, overtime_minutes, overtime_payment
      ) VALUES (
        @worker_id, @date, @entry_time,
        @hourly_rate_snap, @start_hour_snap, @tolerance_mins_snap, @exit_tolerance_mins_snap,
        @base_daily_hours_snap, @exit_hour_snap, @default_break_minutes_snap, @overtime_rate_snap, @overtime_multiplier_snap,
        @delay_minutes, 'OPEN', 0, 0, 0
      )
    `);

    const info = stmt.run({
      worker_id: data.worker_id,
      date: data.date,
      entry_time: data.entry_time,
      hourly_rate_snap: worker.hourly_rate,
      start_hour_snap: config.startHour,
      tolerance_mins_snap: config.toleranceMinutes,
      exit_tolerance_mins_snap: config.exitToleranceMinutes || 15,
      base_daily_hours_snap: config.baseDailyHours,
      exit_hour_snap: config.exitHour,
      default_break_minutes_snap: config.defaultBreakMinutes,
      overtime_rate_snap: config.overtime_rate,
      overtime_multiplier_snap: config.overtime_multiplier || 1.5,
      delay_minutes: delayMins
    });

    return this.getOne('SELECT * FROM attendance_records WHERE id = ?', [info.lastInsertRowid])!;
  }

  markExit(id: number, data: UpdateExitDto): AttendanceRecord {
    const record = this.getOne('SELECT * FROM attendance_records WHERE id = ?', [id]);
    
    if (!record) {
      throw new Error('Registro de asistencia no encontrado');
    }
    if (record.status === 'CLOSED') {
      throw new Error('La jornada ya está cerrada');
    }

    const entryParts = record.entry_time.split(':').map(Number);
    let entryMins = entryParts[0] * 60 + entryParts[1];

    const startParts = record.start_hour_snap.split(':').map(Number);
    const startMins = startParts[0] * 60 + startParts[1];
    if (entryMins > startMins && entryMins <= (startMins + record.tolerance_mins_snap)) {
      entryMins = startMins;
    }
    if (entryMins < startMins) {
      entryMins = startMins;
    }

    const exitParts = data.exit_time.split(':').map(Number);
    let exitMins = exitParts[0] * 60 + exitParts[1];

    const exitTolerance = record.exit_tolerance_mins_snap || 15;
    if (record.exit_hour_snap) {
        const officialExitParts = record.exit_hour_snap.split(':').map(Number);
        const officialExitMins = officialExitParts[0] * 60 + officialExitParts[1];
        
        if (exitMins < officialExitMins && exitMins >= (officialExitMins - exitTolerance)) {
          exitMins = officialExitMins;
        }
    }

    const breakMins = data.break_minutes;
    let workedMins = exitMins - entryMins - breakMins;
    if (workedMins < 0) workedMins = 0;

    const baseDailyLimitMins = record.base_daily_hours_snap * 60;

    let overtimeMins = 0;
    if (workedMins > baseDailyLimitMins) {
      overtimeMins = workedMins - baseDailyLimitMins;
    }

    // Priorize overtime_multiplier if exists, backwards compatible to fixed rate if multiplier doesn't exist on old snaps
    const multiplier = record.overtime_multiplier_snap ?? 1.5;
    const overtimePayment = (overtimeMins / 60) * (record.hourly_rate_snap * multiplier);    
    const baseWorkedMinsForPay = Math.min(workedMins, baseDailyLimitMins);
    const basePayment = (baseWorkedMinsForPay / 60) * record.hourly_rate_snap;

    let penaltyPay = 0;
    if (record.delay_minutes > 0) {
      penaltyPay = (record.delay_minutes / 60) * record.hourly_rate_snap;
    }

    let dailyPayment = basePayment + overtimePayment - penaltyPay;
    if (dailyPayment < 0) dailyPayment = 0;

    const db = getDatabase();
    const sql = `
      UPDATE attendance_records
      SET exit_time = @exit_time,
          break_minutes = @break_minutes,
          worked_minutes = @worked_minutes,
          overtime_minutes = @overtime_minutes,
          overtime_payment = @overtime_payment,
          daily_payment = @daily_payment,
          status = 'CLOSED'
      WHERE id = @id
    `;

    db.prepare(sql).run({
      exit_time: data.exit_time,
      break_minutes: breakMins,
      worked_minutes: workedMins,
      overtime_minutes: overtimeMins,
      overtime_payment: overtimePayment,
      daily_payment: dailyPayment,
      id: id
    });

    return this.getOne('SELECT * FROM attendance_records WHERE id = ?', [id])!;
  }
}

export const attendanceRepository = new AttendanceRepository();
