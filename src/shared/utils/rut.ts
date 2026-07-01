/**
 * Validación de RUT chileno: formato + dígito verificador (módulo 11).
 * Fuente única, usada por el frontend (formularios) y el backend (antes de guardar).
 */

/** Quita puntos, guiones y espacios; normaliza la K a mayúscula. */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

/** Formato con puntuación, p. ej. "12.345.678-9" o "9.876.543-K". */
const RUT_FORMAT_RE = /^\d{1,3}(\.\d{3})*-[\dkK]$/;

export function isValidRutFormat(rut: string): boolean {
  return typeof rut === 'string' && RUT_FORMAT_RE.test(rut.trim());
}

/** Calcula el dígito verificador (módulo 11) para un cuerpo numérico. */
export function computeDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

/** Valida cuerpo + dígito verificador. Acepta RUT con o sin puntos/guion. */
export function isValidRut(rut: string): boolean {
  if (!rut) return false;
  const cleaned = cleanRut(rut);
  if (!/^\d{7,8}[\dK]$/.test(cleaned)) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return computeDv(body) === dv;
}

/** Normaliza a "12.345.678-9" para almacenamiento consistente. */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return `${Number(body).toLocaleString('es-CL')}-${dv}`;
}
