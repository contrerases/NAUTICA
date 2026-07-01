<template>
  <span
    v-if="time"
    :class="[
      'inline-flex items-center font-mono px-2 py-1 rounded-md border text-xs',
      variantClasses[variant],
    ]"
  >
    {{ time }}
  </span>
  <span v-else class="inline-flex items-center text-text-muted text-xs font-mono px-2 py-1">
    <slot name="empty">—</slot>
  </span>
</template>

<script setup lang="ts">
/**
 * Píldora monoespaciada para mostrar horas de entrada/salida.
 * Usado en Dashboard e Historial.
 */
withDefaults(defineProps<{
  time?: string | null;
  variant?: 'entry' | 'exit' | 'neutral';
}>(), {
  variant: 'neutral',
});

const variantClasses = {
  entry: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  exit: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  neutral: 'bg-surface-hover text-text-base border-surface-border',
};
</script>
