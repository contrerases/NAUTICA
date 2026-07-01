<template>
  <div :class="['rounded-xl border p-4 flex flex-col', colorClasses[color]]">
    <div class="flex items-start justify-between gap-2">
      <p class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ label }}</p>
      <div v-if="$slots.icon" class="shrink-0 opacity-90">
        <slot name="icon" />
      </div>
    </div>
    <p class="text-2xl font-black mt-1 leading-tight" :class="valueClasses[color]">
      {{ value }}
    </p>
    <p v-if="subtitle" class="text-xs mt-1 text-text-muted">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Tarjeta de KPI / métrica con color temático.
 * Usado en Dashboard y Finanzas.
 */
withDefaults(defineProps<{
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
}>(), {
  color: 'neutral',
});

const colorClasses = {
  neutral: 'bg-surface border-surface-border',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-emerald-500/10 border-emerald-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  danger: 'bg-danger/10 border-danger/20',
};

const valueClasses = {
  neutral: 'text-text-base',
  primary: 'text-primary',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-danger',
};
</script>
