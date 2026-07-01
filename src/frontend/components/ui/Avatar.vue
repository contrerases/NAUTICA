<template>
  <div
    :class="[
      'rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 border',
      sizeClasses[size],
      colorClasses[color],
    ]"
  >
    <img v-if="photo" :src="photo" :alt="name || ''" class="w-full h-full object-cover" />
    <span v-else>{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Círculo de avatar con foto o inicial del nombre.
 * Usado en PanelMarcaje, Dashboard, Trabajadores y el panel de admin.
 */
const props = withDefaults(defineProps<{
  name?: string;
  photo?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
}>(), {
  size: 'md',
  color: 'primary',
});

const initial = computed(() => (props.name?.trim()?.charAt(0) || '?').toUpperCase());

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-24 h-24 text-4xl',
};

const colorClasses = {
  primary: 'bg-primary/10 border-primary/20 text-primary',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  danger: 'bg-danger/10 border-danger/20 text-danger',
  muted: 'bg-surface-hover border-surface-border text-text-muted',
};
</script>
