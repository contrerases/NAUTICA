/**
 * Fechas en la zona horaria del negocio. TODA la app calcula "hoy", el mes en
 * curso y los límites de fecha con la MISMA zona, para evitar desfases en el
 * borde de día/mes (bug histórico).
 */

export const APP_TIMEZONE = 'America/Santiago';

function formatInTz(d: Date): string {
  // 'sv-SE' produce el formato ISO "YYYY-MM-DD"
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function formatUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Fecha de hoy "YYYY-MM-DD" en la zona del negocio. */
export function today(): string {
  return formatInTz(new Date());
}

/** Hora actual "HH:MM" en la zona del negocio. */
export function nowTime(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/** Mes en curso "YYYY-MM". */
export function currentMonth(): string {
  return today().slice(0, 7);
}

/** Mes de una fecha "YYYY-MM-DD" → "YYYY-MM". */
export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

/** Suma días a una fecha ISO (aritmética en UTC para no depender de la zona). */
export function addDays(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return formatUTC(dt);
}

/** Mañana "YYYY-MM-DD". */
export function tomorrow(): string {
  return addDays(today(), 1);
}

/** ¿dateISO pertenece al mes en curso? */
export function isCurrentMonth(dateISO: string): boolean {
  return monthOf(dateISO) === currentMonth();
}
