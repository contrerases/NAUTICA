/**
 * Admin Store - Estado de autenticación del administrador
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Admin, AdminSession } from '@shared/types'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos

export const useAdminStore = defineStore('admin', () => {
  /**
   * Estado
   */
  const session = ref<AdminSession | null>(null)
  const admin = ref<Admin | null>(null)
  let timeoutId: NodeJS.Timeout | null = null

  /**
   * Getters
   */
  const isAuthenticated = computed(() => {
    if (!session.value) return false
    return Date.now() < session.value.expiresAt
  })

  const username = computed(() => admin.value?.username ?? '')

  /**
   * Actions
   */

  /**
   * Inicia sesión del administrador
   */
  function login(adminData: Admin): void {
    const now = Date.now()

    admin.value = adminData
    session.value = {
      userId: adminData.id,
      username: adminData.username,
      loginTime: now,
      expiresAt: now + SESSION_TIMEOUT_MS
    }

    // Iniciar timer de expiración
    resetSessionTimeout()
  }

  /**
   * Cierra sesión del administrador
   */
  function logout(): void {
    admin.value = null
    session.value = null

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  /**
   * Reinicia el timer de expiración de sesión
   * Se llama cada vez que el usuario interactúa con la app
   */
  function resetSessionTimeout(): void {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (session.value) {
      session.value.expiresAt = Date.now() + SESSION_TIMEOUT_MS

      timeoutId = setTimeout(() => {
        console.log('[AdminStore] Sesión expirada')
        logout()
        // Redirigir a login se maneja en el router guard
      }, SESSION_TIMEOUT_MS)
    }
  }

  /**
   * Verifica si la sesión sigue activa
   */
  function checkSession(): boolean {
    if (!session.value) return false

    if (Date.now() >= session.value.expiresAt) {
      logout()
      return false
    }

    return true
  }

  return {
    // State
    session,
    admin,

    // Getters
    isAuthenticated,
    username,

    // Actions
    login,
    logout,
    resetSessionTimeout,
    checkSession
  }
})
