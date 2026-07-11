/** Tipos de trabajadores, tarifas versionadas y adelantos. */

export type DocumentType = 'RUT' | 'DNI';
export type WorkerStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Modelo de pago del trabajador.
 *  - HOURLY: se paga por hora trabajada (comportamiento original).
 *  - FIXED_SALARY: sueldo fijo mensual; la jornada base va en el sueldo, solo las
 *    horas extra se pagan aparte y los atrasos del mes se descuentan.
 */
export type PayModel = 'HOURLY' | 'FIXED_SALARY';

export interface Worker {
  id: number;
  name: string;
  rut: string | null;
  dni: string | null;
  photo: string | null;
  hourly_rate: number; // CLP entero (tarifa vigente; en sueldo fijo, valor de la hora extra y del descuento por atraso)
  pay_model: PayModel;
  monthly_salary: number; // CLP entero (sueldo mensual vigente; 0 si es por hora)
  start_date: string; // "YYYY-MM-DD"
  status: WorkerStatus;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
}

export interface CreateWorkerDto {
  name: string;
  rut?: string | null;
  dni?: string | null;
  photo?: string | null;
  hourly_rate: number;
  pay_model?: PayModel; // por defecto HOURLY
  monthly_salary?: number; // requerido (>0) si pay_model === FIXED_SALARY
  start_date: string;
}

export interface UpdateWorkerDto {
  name?: string;
  rut?: string | null;
  dni?: string | null;
  photo?: string | null;
  hourly_rate?: number;
  /** Vigencia del nuevo valor hora. Sin "to" = cambio abierto desde "from" (o hoy). */
  rate_effective_from?: string;
  /** Con "to" = corrige SOLO el tramo [from, to]; el resto del historial no cambia. */
  rate_effective_to?: string | null;
  /** Motivo del cambio de tarifa (traza), p. ej. "corrección". */
  rate_note?: string | null;
  pay_model?: PayModel;
  monthly_salary?: number;
  start_date?: string;
  status?: WorkerStatus;
}

export interface WorkerIdentityDto {
  documentType: DocumentType;
  documentValue: string;
}

export interface WorkerIdentityResult {
  found: boolean;
  worker?: Worker;
}

/** Tarifa versionada: valor hora vigente desde una fecha. */
export interface WorkerRate {
  id: number;
  worker_id: number;
  hourly_rate: number;
  effective_from: string; // "YYYY-MM-DD"
  created_at: string;
}

/** Modelo de pago + sueldo versionados: vigentes desde una fecha. */
export interface WorkerSalary {
  id: number;
  worker_id: number;
  pay_model: PayModel;
  monthly_salary: number;
  effective_from: string; // "YYYY-MM-DD"
  created_at: string;
}

export interface WorkerAdvance {
  id: number;
  worker_id: number;
  amount: number; // CLP entero
  date: string; // "YYYY-MM-DD"
  notes: string | null;
  created_at: string;
}

export interface CreateWorkerAdvanceDto {
  worker_id: number;
  amount: number;
  date: string;
  notes?: string | null;
}
