<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center p-4 sm:p-6" :class="elevated ? 'z-[100]' : 'z-50'">
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-body/80 backdrop-blur-sm transition-opacity" 
          @click="closeOnBackdrop ? $emit('close') : null"
        ></div>

        <!-- Modal Panel -->
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            v-if="isOpen"
            class="relative bg-surface rounded-2xl shadow-2xl border border-surface-border w-full overflow-hidden flex flex-col max-h-[90vh]"
            :class="[maxWidthClasses[maxWidth]]"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <h3 class="text-xl font-extrabold text-text-base flex items-center gap-2">
                <slot name="icon">
                  <!-- Iconos por defecto basados en el tipo -->
                  <svg v-if="type === 'error'" class="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg v-else-if="type === 'warning'" class="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else-if="type === 'success'" class="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </slot>
                {{ title }}
              </h3>
              <button 
                v-if="showCloseButton"
                @click="$emit('close')" 
                class="text-text-muted hover:text-text-base transition-colors rounded-full p-1 hover:bg-surface-hover"
              >
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body (scrollea si el contenido excede el alto de la ventana) -->
            <div class="px-6 py-6 text-text-base overflow-y-auto flex-1 min-h-0 scrollbar-thin">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 bg-body border-t border-surface-border flex justify-end gap-3 rounded-b-2xl">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean;
  title: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  /** Eleva el z-index para quedar por ENCIMA de otros modales (p. ej. confirmaciones). */
  elevated?: boolean;
}>(), {
  type: 'info',
  maxWidth: 'md',
  showCloseButton: true,
  closeOnBackdrop: false,
  elevated: false
});

defineEmits(['close']);

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl'
};
</script>