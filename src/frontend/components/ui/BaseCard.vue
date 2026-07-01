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
    
    <div :class="['flex-1 min-h-0', paddingClass]">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 border-t border-surface-border bg-surface/50 rounded-b-xl">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  title?: string;
  subtitle?: string;
  /** Nivel de padding del cuerpo. 'none' lo usan las tarjetas que contienen tablas. */
  padding?: 'none' | 'sm' | 'base' | 'lg';
  /** @deprecated usar padding="none" */
  noPadding?: boolean;
}>(), {
  padding: 'base',
});

const paddingMap = {
  none: '',
  sm: 'p-4',
  base: 'p-6',
  lg: 'p-8',
};

const paddingClass = computed(() => (props.noPadding ? '' : paddingMap[props.padding]));
</script>