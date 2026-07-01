<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="min-w-0">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-text-base tracking-tight truncate">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="text-sm text-text-muted mt-1">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-3 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Encabezado de página estándar: título + subtítulo + acciones opcionales.
 * Usado en Dashboard, Trabajadores, Historial, Finanzas y Configuración.
 */
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>
