<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isSyncing"
      class="fixed inset-0 bg-body/70 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] select-none"
    >
      <div class="w-16 h-16 border-4 border-surface-border border-t-primary rounded-full animate-spin mb-6 shadow-lg"></div>
      <h2 class="text-2xl font-black text-text-base tracking-wide">Sincronizando Sistema</h2>
      <p class="text-sm font-medium text-text-muted mt-2">Guardando en la base de datos segura...</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isSyncing = ref(false);
let removeListener: (() => void) | null = null;

onMounted(() => {
  if (window.electron && window.electron.on) {
    removeListener = window.electron.on('db:sync:status', (status: string) => {
      isSyncing.value = status === 'saving';
    });
  }
});

onUnmounted(() => {
  if (removeListener) {
    removeListener();
  }
});
</script>