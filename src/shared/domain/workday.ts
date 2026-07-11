/**
 * MOTOR DE CÁLCULO DE JORNADA — lógica pura, sin base de datos ni Electron.
 *
 * Separación clave:
 *  - computeWorkday: calcula los HECHOS del turno (minutos trabajados, base,
 *    extra y atraso). NO conoce el valor hora ni el modelo de pago.
 *  - priceDay / priceDelay: convierten esos minutos en DINERO, aplicando el
 *    valor hora y el modelo. Esto se hace al LIQUIDAR, resolviendo el valor hora
 *    vigente por fecha. Así, corregir el valor hora o cambiar el modelo se
 *    refleja sin tener que tocar los turnos (nada de dinero queda congelado).
 *
 * Reglas de negocio:
 *  - No hay turnos que crucen medianoche: se rechaza salida <= entrada.
 *  - Entrada temprana o dentro de la tolerancia cuenta como la hora de inicio.
 *  - Salida dentro de la tolerancia de salida cuenta como la hora oficial.
 *  - Atraso: en modelo por hora es informativo (el atrasado trabaja/cobra menos);
 *    en modelo sueldo fijo se descuenta a fin de mes en la nómina.
 *  - Hora extra = lo que excede la jornada base, a valor hora × multiplicador.
 *  - Todo el dinero es entero CLP (se redondea en un único punto).
 */

import { parseTime } from '../utils/time';
import { roundCLP } from '../utils/money';

export type PayModel = 'HOURLY' | 'FIXED_SALARY';

/** Horario vigente del turno (para calcular los minutos). Sin precio ni modelo. */
export interface WorkdaySnapshot {
  /** Hora oficial de inicio "HH:MM". */
  startHour: string;
  /** Hora oficial de salida "HH:MM". */
  exitHour: string;
  /** Tolerancia de atraso en la entrada (minutos). */
  toleranceMinutes: number;
  /** Tolerancia de salida anticipada (minutos). */
  exitToleranceMinutes: number;
  /** Jornada base en minutos (p. ej. 510 = 8.5 h). */
  baseDailyMinutes: number;
}

export interface WorkdayInput {
  entryTime: string; // "HH:MM"
  exitTime: string; // "HH:MM"
  breakMinutes: number;
  snapshot: WorkdaySnapshot;
}

/** Resultado del motor: solo HECHOS (minutos). El dinero se calcula aparte. */
export interface WorkdayResult {
  workedMinutes: number;
  baseMinutes: number;
  overtimeMinutes: number;
  delayMinutes: number; // informativo aquí
  effectiveEntryMinutes: number;
  effectiveExitMinutes: number;
}

/** Dinero de un día, ya aplicado el valor hora y el modelo. */
export interface DayPrice {
  basePayment: number; // 0 en sueldo fijo (la jornada base va en el sueldo)
  overtimePayment: number;
  dailyPayment: number; // base + extra
}

/** Error de negocio del cálculo (input incoherente). Mensaje apto para el usuario. */
export class WorkdayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkdayError';
  }
}

/** Entrada efectiva: temprana o dentro de tolerancia → hora de inicio. */
export function effectiveEntryMinutes(entryMinutes: number, snap: WorkdaySnapshot): number {
  const start = parseTime(snap.startHour);
  return entryMinutes <= start + snap.toleranceMinutes ? start : entryMinutes;
}

/** Minutos de atraso (informativo). */
export function computeDelayMinutes(entryMinutes: number, snap: WorkdaySnapshot): number {
  const limit = parseTime(snap.startHour) + snap.toleranceMinutes;
  return entryMinutes > limit ? entryMinutes - limit : 0;
}

/** Atraso a partir de "HH:MM" (usado al marcar entrada). */
export function computeDelayFromTime(entryTime: string, snap: WorkdaySnapshot): number {
  return computeDelayMinutes(parseTime(entryTime), snap);
}

/** Cálculo de los MINUTOS de la jornada al cerrar/editar (sin dinero). */
export function computeWorkday(input: WorkdayInput): WorkdayResult {
  const { entryTime, exitTime, breakMinutes, snapshot: snap } = input;

  const entry = parseTime(entryTime);
  const exit = parseTime(exitTime);

  if (exit <= entry) {
    throw new WorkdayError(
      'La hora de salida debe ser posterior a la de entrada. No se admiten turnos que cruzan la medianoche.',
    );
  }
  if (breakMinutes < 0) {
    throw new WorkdayError('La colación no puede ser negativa.');
  }

  const start = parseTime(snap.startHour);
  const exitHour = parseTime(snap.exitHour);

  const efEntry = entry <= start + snap.toleranceMinutes ? start : entry;
  const efExit =
    exit >= exitHour - snap.exitToleranceMinutes && exit <= exitHour ? exitHour : exit;

  if (efExit <= efEntry) {
    throw new WorkdayError(
      'El turno no tiene tiempo pagable dentro de la jornada (revisa las horas y la hora de inicio configurada).',
    );
  }

  const presence = efExit - efEntry;
  if (breakMinutes > presence) {
    throw new WorkdayError('La colación no puede superar el tiempo trabajado.');
  }

  const worked = presence - breakMinutes;
  const delay = computeDelayMinutes(entry, snap);

  const baseMinutes = Math.min(worked, snap.baseDailyMinutes);
  const overtimeMinutes = Math.max(0, worked - snap.baseDailyMinutes);

  return {
    workedMinutes: worked,
    baseMinutes,
    overtimeMinutes,
    delayMinutes: delay,
    effectiveEntryMinutes: efEntry,
    effectiveExitMinutes: efExit,
  };
}

/**
 * Convierte los minutos de un día en dinero, según el valor hora, el
 * multiplicador de extra y el modelo de pago.
 *  - HOURLY: se paga la base + la extra.
 *  - FIXED_SALARY: la base NO se paga por hora (va en el sueldo); solo la extra.
 */
export function priceDay(
  baseMinutes: number,
  overtimeMinutes: number,
  hourlyRate: number,
  overtimeMultiplier: number,
  payModel: PayModel,
): DayPrice {
  const overtimePayment = roundCLP((overtimeMinutes / 60) * hourlyRate * overtimeMultiplier);
  const basePayment =
    payModel === 'FIXED_SALARY' ? 0 : roundCLP((baseMinutes / 60) * hourlyRate);
  return { basePayment, overtimePayment, dailyPayment: basePayment + overtimePayment };
}

/** Valor en CLP del atraso (para el descuento del modelo sueldo fijo). */
export function priceDelay(delayMinutes: number, hourlyRate: number): number {
  return roundCLP((delayMinutes / 60) * hourlyRate);
}
