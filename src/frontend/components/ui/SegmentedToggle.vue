<template>
  <div
    class="flex border border-surface-border rounded-lg overflow-hidden bg-body p-1 gap-1"
    :class="disabled ? 'opacity-60 cursor-not-allowed' : ''"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      :disabled="disabled"
      @click="$emit('update:modelValue', opt.value)"
      :class="[
        'flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed',
        modelValue === opt.value
          ? 'bg-surface text-primary shadow-sm'
          : 'text-text-muted hover:text-text-base',
      ]"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Conmutador segmentado (grupo de botones tipo pestaña).
 * Usado para el selector de tipo de documento (RUT/DNI) en PanelMarcaje y Trabajadores.
 */
export interface ToggleOption {
  value: string | number;
  label: string;
}

defineProps<{
  modelValue: string | number;
  options: ToggleOption[];
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();
</script>
