/**
 * Utilidades de tiempo. Todo el sistema trabaja con horas "HH:MM" y minutos enteros.
 */

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return typeof value === 'string' && TIME_RE.test(value);
}

/** "HH:MM" → minutos desde medianoche. Lanza si el formato es inválido. */
export function parseTime(value: string): number {
  const m = TIME_RE.exec(value);
  if (!m) throw new Error(`Hora inválida: "${value}" (se espera HH:MM)`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** minutos desde medianoche → "HH:MM" */
export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** minutos → "7h 45min" / "8h" / "30min" */
export function formatDuration(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
