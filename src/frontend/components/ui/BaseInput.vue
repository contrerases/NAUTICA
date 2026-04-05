<template>
  <div class="space-y-1 w-full">
    <label v-if="label" :for="id" class="block text-sm font-semibold text-text-base ml-1">
      {{ label }}
    </label>
    <div class="relative">
      <div v-if="$slots.icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
        <slot name="icon"></slot>
      </div>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :class="[
          'w-full block border border-surface-border rounded-lg bg-surface text-text-base text-sm shadow-sm transition-all outline-none py-2.5 px-4 placeholder:text-text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-muted disabled:text-text-muted disabled:cursor-not-allowed disabled:opacity-80',
          $slots.icon ? 'pl-10' : '',
          error ? 'border-danger focus:ring-danger focus:border-danger' : ''
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        v-bind="$attrs"
      />
    </div>
    <p v-if="error" class="text-xs text-danger mt-1 ml-1 font-medium">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
// Desactiva la herencia automática para poner los attrs (como required, min, max) directamente en el input
defineOptions({ inheritAttrs: false });

defineProps<{
  modelValue: string | number;
  label?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>