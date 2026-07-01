<template>
  <button
    type="button"
    :title="title"
    :aria-label="title"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
      colorClasses[color],
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * Botón de solo ícono para columnas de acciones y barras de herramientas.
 * Usado en Trabajadores, Historial y Dashboard.
 */
withDefaults(defineProps<{
  color?: 'muted' | 'primary' | 'danger' | 'success' | 'warning';
  title?: string;
  disabled?: boolean;
}>(), {
  color: 'muted',
});

const colorClasses = {
  muted: 'text-text-muted hover:text-text-base hover:bg-surface-hover',
  primary: 'text-text-muted hover:text-primary hover:bg-primary/10',
  danger: 'text-text-muted hover:text-danger hover:bg-danger/10',
  success: 'text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10',
  warning: 'text-text-muted hover:text-amber-500 hover:bg-amber-500/10',
};
</script>
