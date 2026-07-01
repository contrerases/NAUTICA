/**
 * Admin Store — sesión del administrador.
 * La sesión permanece activa hasta que el usuario cierra sesión manualmente
 * (no hay expiración automática por tiempo).
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Admin, AdminSession } from '@shared/types';

export const useAdminStore = defineStore('admin', () => {
  const session = ref<AdminSession | null>(null);
  const admin = ref<Admin | null>(null);

  const isAuthenticated = computed(() => !!session.value);
  const username = computed(() => admin.value?.username ?? '');

  function login(adminData: Admin): void {
    const now = Date.now();
    admin.value = adminData;
    session.value = {
      userId: adminData.id,
      username: adminData.username,
      loginTime: now,
      // Sin expiración automática: la sesión solo termina con logout().
      expiresAt: Number.MAX_SAFE_INTEGER,
    };
  }

  function logout(): void {
    admin.value = null;
    session.value = null;
  }

  return { session, admin, isAuthenticated, username, login, logout };
});
