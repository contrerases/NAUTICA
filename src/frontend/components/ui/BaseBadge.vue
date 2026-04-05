<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
      variantClasses[variant]
    ]"
  >
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
}>(), {
  variant: 'default'
});

const variantClasses = {
  default: 'bg-surface-hover text-text-muted border-surface-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
};
</script>