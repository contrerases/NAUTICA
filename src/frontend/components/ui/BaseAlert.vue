<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
  >
    <div
      v-if="visible && (message || $slots.default)"
      role="alert"
      :class="['flex items-start gap-3 p-3 rounded-lg border text-sm', variantClasses[type]]"
    >
      <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path v-if="type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        <path v-else-if="type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path v-else-if="type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <div class="flex-1 min-w-0">
        <p v-if="title" class="font-bold">{{ title }}</p>
        <p class="whitespace-pre-line break-words"><slot>{{ message }}</slot></p>
      </div>

      <button
        v-if="dismissible"
        type="button"
        @click="visible = false"
        class="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar aviso"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

/**
 * Aviso INLINE (banner), no modal. Se muestra mientras haya mensaje.
 * Al ser inline y regido por la presencia del mensaje, un mismo error
 * (p. ej. "RUT inválido") se ve siempre que la condición persiste — no
 * queda "atascado" tras cerrarse como pasaba con el modal anterior.
 */
const props = withDefaults(defineProps<{
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message?: string;
  dismissible?: boolean;
}>(), {
  type: 'info',
  dismissible: false,
});

const visible = ref(true);

// Si el mensaje cambia (incluye reaparecer), se vuelve a mostrar aunque
// el usuario lo haya cerrado antes.
watch(() => props.message, () => { visible.value = true; });

const variantClasses = {
  info: 'bg-primary/10 border-primary/20 text-primary',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
  error: 'bg-danger/10 border-danger/20 text-danger',
};
</script>
