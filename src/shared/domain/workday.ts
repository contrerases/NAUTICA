/**
 * MOTOR DE CÁLCULO DE JORNADA — lógica pura, sin base de datos ni Electron.
 *
 * Es la ÚNICA fuente de verdad del cálculo. La usan tanto el marcaje de salida
 * como la edición de un registro, de modo que "crear" y "editar" siempre dan
 * exactamente el mismo resultado.
 *
 * Reglas (decididas con el negocio):
 *  - No hay turnos que crucen medianoche: se rechaza salida <= entrada.
 *  - Entrada temprana o dentro de la tolerancia cuenta como la hora de inicio.
 *  - Salida dentro de la tolerancia de salida cuenta como la hora oficial.
 *  - Atraso = UNA sola sanción: el atrasado simplemente trabaja (y cobra) menos.
 *    NO se aplica ningún descuento adicional. delay_minutes es informativo.
 *  - Hora extra = lo que excede la jornada base, pagada a tarifa × multiplicador.
 *  - Todo el dinero es entero CLP (se redondea en un único punto).
 */

import { parseTime } from '../utils/time';
import { roundCLP } from '../utils/money';

export interface WorkdaySnapshot {
  /** Valor hora en CLP (entero) vigente para la fecha del turno. */
  hourlyRate: number;
  /** Hora oficial de inicio "HH:MM". */
  startHour: string;
  /** Hora oficial de salida "HH:MM". */
  exitHour: string;
  /** Tolerancia de atraso en la entrada (minutos). */
  toleranceMinutes: number;
  /** Tolerancia de salida anticipada (minutos). */
  exitToleranceMinutes: number;
  /** Jornada base en minutos (p. ej. 510 = 8.5 h). Entero para evitar fracciones. */
  baseDailyMinutes: number;
  /** Recargo de la hora extra (p. ej. 1.5). */
  overtimeMultiplier: number;
}

export interface WorkdayInput {
  entryTime: string; // "HH:MM"
  exitTime: string; // "HH:MM"
  breakMinutes: number;
  snapshot: WorkdaySnapshot;
}

export interface WorkdayResult {
  workedMinutes: number;
  baseMinutes: number;
  overtimeMinutes: number;
  delayMinutes: number; // informativo, no afecta el pago
  effectiveEntryMinutes: number;
  effectiveExitMinutes: number;
  basePayment: number;
  overtimePayment: number;
  dailyPayment: number;
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

/** Cálculo completo de la jornada al cerrar/editar. */
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

  const basePayment = roundCLP((baseMinutes / 60) * snap.hourlyRate);
  const overtimePayment = roundCLP(
    (overtimeMinutes / 60) * snap.hourlyRate * snap.overtimeMultiplier,
  );
  const dailyPayment = basePayment + overtimePayment;

  return {
    workedMinutes: worked,
    baseMinutes,
    overtimeMinutes,
    delayMinutes: delay,
    effectiveEntryMinutes: efEntry,
    effectiveExitMinutes: efExit,
    basePayment,
    overtimePayment,
    dailyPayment,
  };
}
