<template>
  <button
    :class="[
      'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
      roundedClass,
      sizeClasses[size],
      variantClasses[variant]
    ]"
    :disabled="disabled || isLoading"
  >
    <!-- Spinner para Loading -->
    <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot name="icon-left" v-else></slot>
    <slot></slot>
    <slot name="icon-right" v-if="!isLoading"></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  rounded?: boolean;
}>(), {
  variant: 'primary',
  size: 'md',
  isLoading: false,
  disabled: false,
  rounded: true
});

const roundedClass = computed(() => props.rounded ? 'rounded-lg' : 'rounded-md');

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base'
};

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-light shadow-sm',
  secondary: 'bg-surface border border-surface-border text-text-base hover:bg-surface-hover shadow-sm',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  ghost: 'bg-transparent text-text-muted hover:text-text-base hover:bg-surface',
  outline: 'bg-transparent border border-primary text-primary hover:bg-primary/5'
};
</script>