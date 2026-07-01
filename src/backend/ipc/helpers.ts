import type { IpcResponse } from '../../shared/types/ipc';

export function ok<T>(data: T): IpcResponse<T> {
  return { ok: true, data };
}

/** Normaliza cualquier error (incluido ZodError) a un mensaje claro para el usuario. */
export function fail(e: unknown): IpcResponse {
  const anyE = e as { issues?: Array<{ message: string }>; message?: string };
  if (anyE?.issues?.length) return { ok: false, error: anyE.issues[0].message };
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}
