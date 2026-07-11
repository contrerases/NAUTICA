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
import { today, monthOf, currentMonth } from '../../shared/utils/date';

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
    const payModel = data.pay_model ?? 'HOURLY';
    const monthlySalary = payModel === 'FIXED_SALARY' ? (data.monthly_salary ?? 0) : 0;
    const tx = getDatabase().transaction(() => {
      const id = workerRepository.insert({
        name: data.name.trim(),
        rut,
        dni,
        photo: data.photo ?? null,
        hourly_rate: data.hourly_rate,
        pay_model: payModel,
        monthly_salary: monthlySalary,
        start_date: data.start_date,
      });
      // Tarifa versionada: vigente desde la fecha de ingreso.
      workerRepository.insertRate(id, data.hourly_rate, data.start_date, null, 'alta');
      // Modelo de pago + sueldo versionados: vigentes desde la fecha de ingreso.
      workerRepository.insertSalary(id, payModel, monthlySalary, data.start_date);
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

    // No escribimos hourly_rate directo: se maneja como versión con vigencia y el
    // valor "actual" del trabajador se recalcula como el vigente hoy.
    const { hourly_rate, rate_effective_from, rate_effective_to, rate_note, ...rest } = data;
    const fields: Partial<Worker> = { ...rest };
    if (data.rut !== undefined) fields.rut = normalizeRut(data.rut);
    if (data.dni !== undefined) fields.dni = data.dni?.trim() || null;

    // Si cambia el modelo a sueldo fijo, normalizamos el sueldo (por hora → 0).
    const newModel = data.pay_model ?? current.pay_model;
    const newSalary =
      newModel === 'FIXED_SALARY' ? (data.monthly_salary ?? current.monthly_salary) : 0;
    if (data.pay_model !== undefined) fields.pay_model = newModel;
    if (data.pay_model !== undefined || data.monthly_salary !== undefined) fields.monthly_salary = newSalary;

    const tx = getDatabase().transaction(() => {
      workerRepository.update(id, fields, adminId);

      // Valor hora: versión con vigencia.
      //  - Con rate_effective_to → corrige SOLO ese tramo (el resto no cambia).
      //  - Sin "to" → cambio abierto desde la fecha indicada (o hoy).
      const wantsRateOp =
        hourly_rate !== undefined &&
        (rate_effective_to != null || hourly_rate !== current.hourly_rate);
      if (wantsRateOp) {
        const from = rate_effective_from ?? today();
        workerRepository.setRateRange(id, hourly_rate!, from, rate_effective_to ?? null, adminId, rate_note ?? null);
      }
      // El "valor hora actual" del trabajador = el vigente HOY (tras cualquier tramo/corrección).
      const currentRate = workerRepository.getRateForDate(id, today()) ?? current.hourly_rate;
      getDatabase().prepare('UPDATE workers SET hourly_rate = ? WHERE id = ?').run(currentRate, id);

      // Modelo/sueldo → nueva versión vigente desde hoy (meses cerrados conservan su versión).
      const modelChanged = data.pay_model !== undefined && data.pay_model !== current.pay_model;
      const salaryChanged = data.monthly_salary !== undefined && newSalary !== current.monthly_salary;
      if (modelChanged || salaryChanged) {
        workerRepository.insertSalary(id, newModel, newSalary, today());
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

  /** Historial completo de adelantos de un trabajador (todos los meses). */
  listAllAdvances(workerId: number): WorkerAdvance[] {
    return advanceRepository.getByWorker(workerId);
  },

  /** Corrige un adelanto. Solo se permiten los del MES EN CURSO (meses pasados = solo lectura). */
  updateAdvance(id: number, data: { amount: number; date: string; notes?: string | null }): WorkerAdvance {
    const adv = advanceRepository.getById(id);
    if (!adv) throw new Error('Adelanto no encontrado.');
    if (monthOf(adv.date) !== currentMonth()) {
      throw new Error('Solo se pueden editar adelantos del mes en curso.');
    }
    if (monthOf(data.date) !== currentMonth()) {
      throw new Error('La fecha del adelanto debe pertenecer al mes en curso.');
    }
    return advanceRepository.update(id, { amount: data.amount, date: data.date, notes: data.notes ?? null });
  },

  deleteAdvance(id: number): boolean {
    const adv = advanceRepository.getById(id);
    if (!adv) throw new Error('Adelanto no encontrado.');
    if (monthOf(adv.date) !== currentMonth()) {
      throw new Error('Solo se pueden eliminar adelantos del mes en curso.');
    }
    return advanceRepository.delete(id);
  },
};
