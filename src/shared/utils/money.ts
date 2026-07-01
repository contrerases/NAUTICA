/**
 * Dinero en pesos chilenos (CLP). SIEMPRE enteros: el CLP no tiene decimales.
 * El redondeo se hace en un único lugar para que crear y editar den lo mismo.
 */

/** Redondea a peso entero. Punto único de redondeo de todo el sistema. */
export function roundCLP(value: number): number {
  return Math.round(value);
}

const CLP_FORMAT = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** 42500 → "$42.500" */
export function formatCLP(value: number): string {
  return `$${CLP_FORMAT.format(Math.round(value))}`;
}
