import { z } from 'zod';
import { isValidRut } from '../utils/rut';

/** Fuente ÚNICA de validación. La usan el frontend (formularios) y el backend (IPC). */

const HHMM = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)');
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)');
const BREAK = z.number().int().min(0).max(120);

// ── Config ────────────────────────────────────────────────
// Rangos alineados con los CHECK de la BD y con topes razonables.
export const configUpdateSchema = z
  .object({
    startHour: HHMM.optional(),
    exitHour: HHMM.optional(),
    baseDailyHours: z.number().min(1).max(24).optional(),
    defaultBreakMinutes: BREAK.optional(),
    toleranceMinutes: z.number().int().min(0).max(60).optional(),
    exitToleranceMinutes: z.number().int().min(0).max(60).optional(),
    overtimeMultiplier: z.number().min(1).max(5).optional(), // tope: evita errores de tipeo (150 en vez de 1.5)
    onboardingDone: z.boolean().optional(),
    applyFrom: z.enum(['today', 'tomorrow']).optional(),
  })
  .refine(
    (c) => c.startHour === undefined || c.exitHour === undefined || c.exitHour > c.startHour,
    { message: 'La hora de salida debe ser posterior a la de inicio.', path: ['exitHour'] },
  );

// ── Worker ────────────────────────────────────────────────
const rutField = z
  .string()
  .trim()
  .refine((v) => isValidRut(v), 'RUT inválido (revisa el dígito verificador).');

const workerBase = {
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  rut: rutField.nullish(),
  dni: z.string().trim().min(1).nullish(),
  photo: z.string().nullish(),
  hourly_rate: z.number().int().positive('El valor hora debe ser mayor a cero.'),
  start_date: ISO_DATE,
};

export const createWorkerSchema = z
  .object(workerBase)
  .refine((w) => !!w.rut || !!w.dni, {
    message: 'Debe indicar al menos un documento (RUT o DNI).',
    path: ['rut'],
  });

export const updateWorkerSchema = z.object({
  name: workerBase.name.optional(),
  rut: rutField.nullish(),
  dni: z.string().trim().min(1).nullish(),
  photo: z.string().nullish(),
  hourly_rate: z.number().int().positive().optional(),
  start_date: ISO_DATE.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const workerIdentitySchema = z.object({
  documentType: z.enum(['RUT', 'DNI']),
  documentValue: z.string().trim().min(1),
});

export const advanceSchema = z.object({
  worker_id: z.number().int().positive(),
  amount: z.number().int().positive('El monto debe ser mayor a cero.'),
  date: ISO_DATE,
  notes: z.string().nullish(),
});

// ── Auth ──────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  username: z.string().min(1),
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
});

// ── Attendance ────────────────────────────────────────────
export const markEntrySchema = z.object({
  worker_id: z.number().int().positive(),
  date: ISO_DATE.optional(),
  entry_time: HHMM.optional(),
});

export const markExitSchema = z.object({
  id: z.number().int().positive(),
  break_minutes: BREAK.optional(),
  exit_time: HHMM.optional(),
});

// Corrección: mismo blindaje que el marcaje (antes el camino de edición no validaba).
export const updateRecordSchema = z
  .object({
    id: z.number().int().positive(),
    entry_time: HHMM,
    exit_time: HHMM.nullish(),
    break_minutes: BREAK.optional(),
  })
  .refine((r) => !r.exit_time || r.exit_time > r.entry_time, {
    message: 'La hora de salida debe ser posterior a la de entrada.',
    path: ['exit_time'],
  });

export const createManualSchema = z
  .object({
    worker_id: z.number().int().positive(),
    date: ISO_DATE,
    entry_time: HHMM,
    exit_time: HHMM.nullish(),
    break_minutes: BREAK.optional(),
  })
  .refine((r) => !r.exit_time || r.exit_time > r.entry_time, {
    message: 'La hora de salida debe ser posterior a la de entrada.',
    path: ['exit_time'],
  });

export const periodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
