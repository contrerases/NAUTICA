import { reactive } from 'vue';

/**
 * Diálogo de confirmación basado en promesa, con un único <ConfirmModal/> montado
 * en App.vue. Reemplaza window.confirm() por un modal consistente con la app.
 *
 * Uso:  if (!(await askConfirm({ message: '¿Seguro?', danger: true }))) return;
 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  /** Si se define, exige escribir ese texto para habilitar el botón (acciones irreversibles). */
  requireText?: string | null;
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'requireText'>> {
  open: boolean;
  requireText: string | null;
  resolver: ((v: boolean) => void) | null;
}

export const confirmState = reactive<ConfirmState>({
  open: false,
  title: 'Confirmar',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false,
  requireText: null,
  resolver: null,
});

export function askConfirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.title = opts.title ?? 'Confirmar';
    confirmState.message = opts.message;
    confirmState.confirmText = opts.confirmText ?? 'Confirmar';
    confirmState.cancelText = opts.cancelText ?? 'Cancelar';
    confirmState.danger = opts.danger ?? false;
    confirmState.requireText = opts.requireText ?? null;
    confirmState.resolver = resolve;
    confirmState.open = true;
  });
}

export function resolveConfirm(value: boolean): void {
  confirmState.open = false;
  const r = confirmState.resolver;
  confirmState.resolver = null;
  if (r) r(value);
}
