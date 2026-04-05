<template>
  <div class="card-base flex flex-col">
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-surface-border flex items-center justify-between">
      <slot name="header">
        <div>
          <h3 class="text-lg font-bold text-text-base">{{ title }}</h3>
          <p v-if="subtitle" class="text-sm text-text-muted mt-1">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions">
          <slot name="actions"></slot>
        </div>
      </slot>
    </div>
    
    <div :class="['flex-1', noPadding ? '' : 'p-6']">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 border-t border-surface-border bg-surface/50 rounded-b-xl">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
  noPadding?: boolean;
}>();
</script>