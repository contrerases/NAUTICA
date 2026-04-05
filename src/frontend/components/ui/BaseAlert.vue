<template>
  <BaseModal
    :isOpen="show"
    :title="title || modalTitle"
    :type="type === 'success' ? 'info' : type === 'warning' ? 'warning' : type === 'error' ? 'error' : 'info'"
    @close="show = false"
  >
    <div class="text-center p-4">
      <p class="text-lg font-medium text-text-base mb-2">
        <slot>{{ message }}</slot>
      </p>
    </div>
    <template #footer>
      <div class="flex w-full justify-center">
        <BaseButton variant="primary" @click="show = false" class="w-full sm:w-auto px-8">
          Entendido
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';

const props = withDefaults(defineProps<{
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message?: string;
  dismissible?: boolean;
}>(), {
  type: 'info',
  dismissible: false
});

const show = ref(true);

// If the alert's props change (like when setting an error message globally), we should re-show it
watch(() => props.message, (newMsg) => {
  if (newMsg) {
    show.value = true;
  }
});

const modalTitle = computed(() => {
  switch (props.type) {
    case 'error': return 'Error';
    case 'success': return 'Éxito';
    case 'warning': return 'Advertencia';
    default: return 'Información';
  }
});
</script>
