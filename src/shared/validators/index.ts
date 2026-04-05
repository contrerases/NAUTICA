import { z } from 'zod';
import { DocumentType, WorkerStatus } from '../types/worker';

export const configUpdateSchema = z.object({
  start_hour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  exit_hour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  base_daily_hours: z.number().min(1).max(24).optional(),
  default_break_minutes: z.number().min(0).max(120).optional(),
  tolerance_minutes: z.number().min(0).max(60).optional(),
  exit_tolerance_minutes: z.number().min(0).max(60).optional(),
  overtime_rate: z.number().min(0).optional(),
  overtime_multiplier: z.number().min(0).optional(),
  onboarding_done: z.number().min(0).max(1).optional()
});

export const workerIdentitySchema = z.object({
  documentType: z.enum(['RUT', 'DNI']),
  documentValue: z.string().min(1)
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const changePasswordSchema = z.object({
  username: z.string().min(1),
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export const markEntrySchema = z.object({
  worker_id: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  entry_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
});

export const markExitSchema = z.object({
  id: z.number().positive(),
  break_minutes: z.number().min(0).optional()
});
