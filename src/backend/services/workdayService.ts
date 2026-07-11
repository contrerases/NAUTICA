import { getDatabase } from '../database/connection';
import {
  attendanceRepository,
  type AttendanceSnapshot,
  type CloseFields,
} from '../repositories/attendanceRepository';
import { workerRepository } from '../repositories/workerRepository';
import { configService } from './configService';
import {
  computeWorkday,
  computeDelayFromTime,
  type WorkdaySnapshot,
} from '../../shared/domain/workday';
import type {
  AttendanceRecord,
  CheckAttendanceResult,
  MarkEntryDto,
  MarkExitDto,
  UpdateRecordDto,
  CreateManualRecordDto,
} from '../../shared/types/attendance';
import { today, nowTime } from '../../shared/utils/date';

/** Construye el snapshot congelado a partir de la config y la tarifa vigentes en la fecha. */
function buildSnapshot(workerId: number, date: string): AttendanceSnapshot {
  const cfg = configService.getConfigForDate(date);
  const worker = workerRepository.findById(workerId);
  if (!worker) throw new Error('Trabajador no encontrado.');
  const rate = workerRepository.getRateForDate(workerId, date) ?? worker.hourly_rate;
  const sal = workerRepository.getSalaryForDate(workerId, date);
  const payModel = sal?.pay_model ?? worker.pay_model ?? 'HOURLY';
  return {
    hourly_rate_snap: rate,
    start_hour_snap: cfg.startHour,
    exit_hour_snap: cfg.exitHour,
    tolerance_snap: cfg.toleranceMinutes,
    exit_tolerance_snap: cfg.exitToleranceMinutes,
    base_daily_minutes_snap: cfg.baseDailyMinutes,
    overtime_multiplier_snap: cfg.overtimeMultiplier,
    pay_model_snap: payModel,
  };
}

/** WorkdaySnapshot (para el motor) desde el snapshot congelado del registro. */
function snapOf(r: AttendanceRecord): WorkdaySnapshot {
  return {
    hourlyRate: r.hourly_rate_snap,
    payModel: r.pay_model_snap,
    startHour: r.start_hour_snap,
    exitHour: r.exit_hour_snap,
    toleranceMinutes: r.tolerance_snap,
    exitToleranceMinutes: r.exit_tolerance_snap,
    baseDailyMinutes: r.base_daily_minutes_snap,
    overtimeMultiplier: r.overtime_multiplier_snap,
  };
}

function closeFieldsFrom(record: AttendanceRecord, exitTime: string, breakMinutes: number): CloseFields {
  const res = computeWorkday({
    entryTime: record.entry_time,
    exitTime,
    breakMinutes,
    snapshot: snapOf(record),
  });
  return {
    exit_time: exitTime,
    break_minutes: breakMinutes,
    worked_minutes: res.workedMinutes,
    base_minutes: res.baseMinutes,
    overtime_minutes: res.overtimeMinutes,
    base_payment: res.basePayment,
    overtime_payment: res.overtimePayment,
    daily_payment: res.dailyPayment,
  };
}

export const workdayService = {
  checkToday(workerId: number): CheckAttendanceResult {
    const record = attendanceRepository.findByWorkerAndDate(workerId, today());
    return {
      hasRecord: !!record,
      record,
      canMarkEntry: !record,
      canMarkExit: !!record && record.status === 'OPEN',
    };
  },

  getAll(): AttendanceRecord[] {
    return attendanceRepository.getAllWithNames();
  },

  getByWorker(workerId: number): AttendanceRecord[] {
    return attendanceRepository.getByWorkerWithNames(workerId);
  },

  getMissingExits(): AttendanceRecord[] {
    return attendanceRepository.getMissingExits(today());
  },

  /** Marcaje de entrada (kiosco). Rechaza trabajadores inactivos. */
  markEntry(dto: MarkEntryDto): AttendanceRecord {
    const worker = workerRepository.findById(dto.worker_id);
    if (!worker) throw new Error('Trabajador no encontrado.');
    if (worker.status !== 'ACTIVE') throw new Error('El trabajador no está activo.');

    const date = dto.date ?? today();
    const entry = dto.entry_time ?? nowTime();

    if (attendanceRepository.findByWorkerAndDate(dto.worker_id, date)) {
      throw new Error('Ya existe un registro para ese día.');
    }

    const snap = buildSnapshot(dto.worker_id, date);
    const delay = computeDelayFromTime(entry, {
      hourlyRate: snap.hourly_rate_snap,
      payModel: snap.pay_model_snap,
      startHour: snap.start_hour_snap,
      exitHour: snap.exit_hour_snap,
      toleranceMinutes: snap.tolerance_snap,
      exitToleranceMinutes: snap.exit_tolerance_snap,
      baseDailyMinutes: snap.base_daily_minutes_snap,
      overtimeMultiplier: snap.overtime_multiplier_snap,
    });

    const id = attendanceRepository.insertOpen({
      worker_id: dto.worker_id,
      date,
      entry_time: entry,
      delay_minutes: delay,
      snap,
    });
    return attendanceRepository.findById(id)!;
  },

  /** Marcaje de salida (kiosco). Calcula con el motor único. */
  markExit(dto: MarkExitDto): AttendanceRecord {
    const record = attendanceRepository.findById(dto.id);
    if (!record) throw new Error('Registro no encontrado.');
    if (record.status === 'CLOSED') throw new Error('La jornada ya está cerrada.');

    const exit = dto.exit_time ?? nowTime();
    const breakMinutes = dto.break_minutes ?? 0;
    const fields = closeFieldsFrom(record, exit, breakMinutes);
    attendanceRepository.applyClose(record.id, fields, null);
    return attendanceRepository.findById(record.id)!;
  },

  /** Corrección de un registro por el admin (con traza). Recalcula con el motor único. */
  updateRecord(dto: UpdateRecordDto, adminId: number | null): AttendanceRecord {
    const record = attendanceRepository.findById(dto.id);
    if (!record) throw new Error('Registro no encontrado.');

    const snap = snapOf(record);
    const delay = computeDelayFromTime(dto.entry_time, snap);

    if (dto.exit_time) {
      const withEntry = { ...record, entry_time: dto.entry_time };
      const breakMinutes = dto.break_minutes ?? record.break_minutes ?? 0;
      const fields = closeFieldsFrom(withEntry, dto.exit_time, breakMinutes);
      // el delay se recalcula desde la nueva entrada y se persiste vía applyClose + un update de delay
      const tx = getDatabase().transaction(() => {
        attendanceRepository.applyClose(record.id, { ...fields, exit_time: dto.exit_time! }, adminId);
        getDatabase()
          .prepare('UPDATE attendance_records SET entry_time = ?, delay_minutes = ? WHERE id = ?')
          .run(dto.entry_time, delay, record.id);
      });
      tx();
    } else {
      // Sin salida → queda OPEN limpio (igual que un registro recién marcado).
      attendanceRepository.applyReopen(record.id, dto.entry_time, delay, adminId);
    }
    return attendanceRepository.findById(record.id)!;
  },

  /** Alta manual de un turno (puede ser una fecha pasada). Con traza de auditoría. */
  createManual(dto: CreateManualRecordDto, adminId: number | null): AttendanceRecord {
    const worker = workerRepository.findById(dto.worker_id);
    if (!worker) throw new Error('Trabajador no encontrado.');
    if (attendanceRepository.findByWorkerAndDate(dto.worker_id, dto.date)) {
      throw new Error('Ya existe un registro para ese trabajador en esa fecha.');
    }

    const snap = buildSnapshot(dto.worker_id, dto.date);
    const wsnap: WorkdaySnapshot = {
      hourlyRate: snap.hourly_rate_snap,
      payModel: snap.pay_model_snap,
      startHour: snap.start_hour_snap,
      exitHour: snap.exit_hour_snap,
      toleranceMinutes: snap.tolerance_snap,
      exitToleranceMinutes: snap.exit_tolerance_snap,
      baseDailyMinutes: snap.base_daily_minutes_snap,
      overtimeMultiplier: snap.overtime_multiplier_snap,
    };
    const delay = computeDelayFromTime(dto.entry_time, wsnap);

    let id = 0;
    const tx = getDatabase().transaction(() => {
      id = attendanceRepository.insertOpen({
        worker_id: dto.worker_id,
        date: dto.date,
        entry_time: dto.entry_time,
        delay_minutes: delay,
        snap,
      });
      if (dto.exit_time) {
        const rec = attendanceRepository.findById(id)!;
        const breakMinutes = dto.break_minutes ?? 0;
        attendanceRepository.applyClose(id, closeFieldsFrom(rec, dto.exit_time, breakMinutes), adminId);
      }
    });
    tx();
    return attendanceRepository.findById(id)!;
  },
};
