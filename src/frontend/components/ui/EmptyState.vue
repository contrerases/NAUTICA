<template>
  <div class="flex flex-col items-center justify-center text-center text-text-muted py-12 px-6 gap-3">
    <div v-if="$slots.icon" class="text-surface-border">
      <slot name="icon" />
    </div>
    <p class="text-sm font-medium">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Estado vacío centrado para listas y paneles sin datos.
 * Usado en Dashboard (las listas de marcaje propias, no la BaseTable).
 */
defineProps<{
  message: string;
}>();
</script>
