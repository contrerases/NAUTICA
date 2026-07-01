import { getDatabase } from '../database/connection';
import { workerRepository } from '../repositories/workerRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { advanceRepository } from '../repositories/advanceRepository';
import type {
  Worker,
  CreateWorkerDto,
  UpdateWorkerDto,
  WorkerIdentityDto,
  WorkerIdentityResult,
  WorkerAdvance,
  CreateWorkerAdvanceDto,
} from '../../shared/types/worker';
import { formatRut, isValidRut } from '../../shared/utils/rut';
import { today } from '../../shared/utils/date';

function normalizeRut(rut?: string | null): string | null {
  if (!rut) return null;
  return isValidRut(rut) ? formatRut(rut) : rut.trim();
}

function translateUnique(e: any): Error {
  const msg = String(e?.message ?? '');
  if (msg.includes('UNIQUE') && msg.includes('rut')) return new Error('El RUT ya está asociado a otro trabajador.');
  if (msg.includes('UNIQUE') && msg.includes('dni')) return new Error('El DNI ya está asociado a otro trabajador.');
  if (msg.includes('UNIQUE')) return new Error('El documento ya está registrado.');
  return e instanceof Error ? e : new Error(msg);
}

export const workerService = {
  getAll(): Worker[] {
    return workerRepository.getAll();
  },

  getActive(): Worker[] {
    return workerRepository.getActive();
  },

  getById(id: number): Worker | undefined {
    return workerRepository.findById(id);
  },

  /** Identificación en el kiosco: solo trabajadores ACTIVOS. */
  identify(identity: WorkerIdentityDto): WorkerIdentityResult {
    const worker =
      identity.documentType === 'RUT'
        ? workerRepository.findByRut(normalizeRut(identity.documentValue)!)
        : workerRepository.findByDni(identity.documentValue.trim());
    if (worker && worker.status === 'ACTIVE') return { found: true, worker };
    return { found: false };
  },

  create(data: CreateWorkerDto): Worker {
    const rut = normalizeRut(data.rut);
    const dni = data.dni?.trim() || null;
    const tx = getDatabase().transaction(() => {
      const id = workerRepository.insert({
        name: data.name.trim(),
        rut,
        dni,
        photo: data.photo ?? null,
        hourly_rate: data.hourly_rate,
        start_date: data.start_date,
      });
      // Tarifa versionada: vigente desde la fecha de ingreso.
      workerRepository.insertRate(id, data.hourly_rate, data.start_date);
      return id;
    });
    try {
      const id = tx();
      return workerRepository.findById(id)!;
    } catch (e) {
      throw translateUnique(e);
    }
  },

  update(id: number, data: UpdateWorkerDto, adminId: number | null): Worker {
    const current = workerRepository.findById(id);
    if (!current) throw new Error('Trabajador no encontrado.');

    const fields: Partial<Worker> = { ...data };
    if (data.rut !== undefined) fields.rut = normalizeRut(data.rut);
    if (data.dni !== undefined) fields.dni = data.dni?.trim() || null;

    const tx = getDatabase().transaction(() => {
      workerRepository.update(id, fields, adminId);
      // Cambio de tarifa → nueva versión vigente desde hoy (los turnos ya iniciados
      // conservan su snapshot; los registros pasados usan su tarifa histórica).
      if (data.hourly_rate !== undefined && data.hourly_rate !== current.hourly_rate) {
        workerRepository.insertRate(id, data.hourly_rate, today());
      }
    });
    try {
      tx();
    } catch (e) {
      throw translateUnique(e);
    }
    return workerRepository.findById(id)!;
  },

  /** Baja lógica: conserva TODO el historial. */
  deactivate(id: number, adminId: number | null): Worker {
    if (!workerRepository.findById(id)) throw new Error('Trabajador no encontrado.');
    workerRepository.setStatus(id, 'INACTIVE', adminId);
    return workerRepository.findById(id)!;
  },

  reactivate(id: number, adminId: number | null): Worker {
    if (!workerRepository.findById(id)) throw new Error('Trabajador no encontrado.');
    workerRepository.setStatus(id, 'ACTIVE', adminId);
    return workerRepository.findById(id)!;
  },

  /**
   * Borrado FÍSICO explícito (destruye historial y adelantos). Solo debe llamarse
   * tras una confirmación fuerte en la UI. Se hace en transacción para respetar
   * el RESTRICT de las tablas hijas (se borran a mano, sin cascada silenciosa).
   */
  hardDelete(id: number): void {
    if (!workerRepository.findById(id)) throw new Error('Trabajador no encontrado.');
    const tx = getDatabase().transaction(() => {
      getDatabase().prepare('DELETE FROM attendance_records WHERE worker_id = ?').run(id);
      getDatabase().prepare('DELETE FROM worker_advances WHERE worker_id = ?').run(id);
      workerRepository.deleteWorker(id); // rate_history cae por CASCADE
    });
    tx();
  },

  // ── Adelantos ───────────────────────────────────────────
  addAdvance(data: CreateWorkerAdvanceDto): WorkerAdvance {
    if (!workerRepository.findById(data.worker_id)) throw new Error('Trabajador no encontrado.');
    return advanceRepository.create(data);
  },

  listAdvances(workerId: number, month: string): WorkerAdvance[] {
    return advanceRepository.getByWorkerAndMonth(workerId, month);
  },

  deleteAdvance(id: number): boolean {
    return advanceRepository.delete(id);
  },
};
