<template>
  <div class="space-y-1 w-full">
    <label v-if="label" :for="id" class="block text-sm font-semibold text-text-base ml-1">
      {{ label }}
    </label>
    <select
      :id="id"
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      :disabled="disabled"
      :class="[
        'w-full block border rounded-lg bg-surface text-text-base text-sm shadow-sm transition-all outline-none py-2.5 px-4 focus:ring-2 focus:ring-primary/20 disabled:bg-surface-muted disabled:text-text-muted disabled:cursor-not-allowed disabled:opacity-80',
        error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-surface-border focus:border-primary',
      ]"
      v-bind="$attrs"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot>
        <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </slot>
    </select>
    <p v-if="error" class="text-xs text-danger mt-1 ml-1 font-medium">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Select nativo con el mismo estilo que BaseInput.
 * Acepta `options` (array {value,label}) o el slot por defecto con <option>s.
 * Usado en Trabajadores, Historial y Finanzas.
 */
defineOptions({ inheritAttrs: false });

export interface SelectOption {
  value: string | number;
  label: string;
}

defineProps<{
  modelValue: string | number;
  label?: string;
  id?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  options?: SelectOption[];
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
