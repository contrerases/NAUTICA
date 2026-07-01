/**
 * Biblioteca de componentes UI reutilizables de NÁUTICA.
 *
 * Importar desde un solo punto, p. ej.:
 *   import { PageHeader, BaseTable, Avatar } from '@/components/ui'
 * o con ruta relativa desde una vista admin:
 *   import { PageHeader, BaseTable } from '../../components/ui'
 */

// Primitivos
export { default as BaseAlert } from './BaseAlert.vue';
export { default as BaseBadge } from './BaseBadge.vue';
export { default as BaseButton } from './BaseButton.vue';
export { default as BaseCard } from './BaseCard.vue';
export { default as BaseInput } from './BaseInput.vue';
export { default as BaseModal } from './BaseModal.vue';
export { default as BaseSelect } from './BaseSelect.vue';
export { default as BaseTable } from './BaseTable.vue';

// Compuestos / de dominio
export { default as Avatar } from './Avatar.vue';
export { default as EmptyState } from './EmptyState.vue';
export { default as IconButton } from './IconButton.vue';
export { default as MoneyInput } from './MoneyInput.vue';
export { default as PageHeader } from './PageHeader.vue';
export { default as SegmentedToggle } from './SegmentedToggle.vue';
export { default as StatCard } from './StatCard.vue';
export { default as TimeBadge } from './TimeBadge.vue';

// Tipos
export type { TableColumn } from './BaseTable.vue';
export type { SelectOption } from './BaseSelect.vue';
export type { ToggleOption } from './SegmentedToggle.vue';
