/**
 * Config Store - Configuración global de la aplicación
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppConfig, UpdateConfigDto } from '@shared/types'
import { ConfigChannels } from '@shared/types'

export const useConfigStore = defineStore('config', () => {
  /**
   * Estado
   */
  const config = ref<AppConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Actions
   */

  /**
   * Carga la configuración desde el backend
   */
  async function loadConfig(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await window.electron.invoke<AppConfig>(ConfigChannels.GET)

      if (response.ok && response.data) {
        config.value = response.data
      } else {
        error.value = response.error || 'Error al cargar configuración'
      }
    } catch (err) {
      error.value = 'Error de conexión con el backend'
      console.error('[ConfigStore] Error al cargar config:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza la configuración
   */
  async function updateConfig(updates: UpdateConfigDto): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await window.electron.invoke<AppConfig>(
        ConfigChannels.UPDATE,
        updates
      )

      if (response.ok && response.data) {
        config.value = response.data
        return true
      } else {
        error.value = response.error || 'Error al actualizar configuración'
        return false
      }
    } catch (err) {
      error.value = 'Error de conexión con el backend'
      console.error('[ConfigStore] Error al actualizar config:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Marca el onboarding como completado
   */
  async function completeOnboarding(): Promise<boolean> {
    return updateConfig({ onboarding_done: 1 })
  }

  return {
    // State
    config,
    loading,
    error,

    // Actions
    loadConfig,
    updateConfig,
    completeOnboarding
  }
})
