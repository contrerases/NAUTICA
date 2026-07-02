<template>
  <BaseModal
    :is-open="s.open"
    :title="s.title"
    :type="s.danger ? 'warning' : 'info'"
    :show-close-button="false"
    max-width="md"
    elevated
    @close="cancel"
  >
    <p class="text-text-base whitespace-pre-line">{{ s.message }}</p>

    <div v-if="s.requireText" class="mt-4">
      <p class="text-sm text-text-muted mb-1">
        Escribe <strong class="text-danger">{{ s.requireText }}</strong> para confirmar:
      </p>
      <BaseInput v-model="typed" :placeholder="s.requireText" />
    </div>

    <template #footer>
      <BaseButton variant="outline" @click="cancel">{{ s.cancelText }}</BaseButton>
      <BaseButton :variant="s.danger ? 'danger' : 'primary'" :disabled="!canConfirm" @click="ok">
        {{ s.confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { confirmState, resolveConfirm } from '../../composables/useConfirm';
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';

const s = confirmState;
const typed = ref('');

watch(() => s.open, (open) => { if (open) typed.value = ''; });

const canConfirm = computed(
  () => !s.requireText || typed.value.trim().toUpperCase() === s.requireText.toUpperCase(),
);

function ok() {
  if (canConfirm.value) resolveConfirm(true);
}
function cancel() {
  resolveConfirm(false);
}
</script>
