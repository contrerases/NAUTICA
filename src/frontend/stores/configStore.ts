/**
 * Config Store — configuración global (vigente hoy) y cambio pendiente.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ConfigVersion, UpdateConfigDto } from '@shared/types';
import { api } from '../api';

export const useConfigStore = defineStore('config', () => {
  /** Config vigente hoy. */
  const current = ref<ConfigVersion | null>(null);
  /** Cambio programado a futuro (o null). */
  const pending = ref<ConfigVersion | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** Alias de conveniencia: la config que corre hoy. */
  const config = computed(() => current.value);

  async function loadConfig(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const view = await api.config.get();
      current.value = view.current;
      pending.value = view.pending;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar configuración';
      console.error('[ConfigStore] loadConfig:', err);
    } finally {
      loading.value = false;
    }
  }

  async function updateConfig(updates: UpdateConfigDto): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const view = await api.config.update(updates);
      current.value = view.current;
      pending.value = view.pending;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar configuración';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function cancelPending(): Promise<void> {
    const view = await api.config.cancelPending();
    current.value = view.current;
    pending.value = view.pending;
  }

  async function completeOnboarding(): Promise<boolean> {
    return updateConfig({ onboardingDone: true, applyFrom: 'today' });
  }

  return { current, pending, config, loading, error, loadConfig, updateConfig, cancelPending, completeOnboarding };
});
