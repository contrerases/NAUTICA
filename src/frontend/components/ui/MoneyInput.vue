<template>
  <div class="space-y-1 w-full">
    <label v-if="label" :for="id" class="block text-sm font-semibold text-text-base ml-1">
      {{ label }}
    </label>
    <div class="relative">
      <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted pointer-events-none">$</span>
      <input
        :id="id"
        type="text"
        inputmode="numeric"
        :value="display"
        @input="onInput"
        :disabled="disabled"
        :placeholder="placeholder"
        :class="[
          'w-full block border rounded-lg bg-surface text-text-base text-sm shadow-sm transition-all outline-none py-2.5 pl-8 pr-4 tabular-nums placeholder:text-text-muted/60 focus:ring-2 focus:ring-primary/20 disabled:bg-surface-muted disabled:text-text-muted disabled:cursor-not-allowed disabled:opacity-80',
          error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-surface-border focus:border-primary',
        ]"
      />
    </div>
    <p v-if="error" class="text-xs text-danger mt-1 ml-1 font-medium">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-muted mt-1 ml-1">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Campo de dinero (CLP). Muestra el valor con separador de miles (1.234.567)
 * pero el v-model SIEMPRE entrega/recibe el ENTERO. El formato es solo visual.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number;
    label?: string;
    id?: string;
    placeholder?: string;
    error?: string;
    hint?: string;
    disabled?: boolean;
  }>(),
  { modelValue: 0 },
);

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>();

const formatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

const display = computed(() =>
  props.modelValue && props.modelValue > 0 ? formatter.format(props.modelValue) : '',
);

function onInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '');
  emit('update:modelValue', digits ? Number(digits) : 0);
}
</script>
