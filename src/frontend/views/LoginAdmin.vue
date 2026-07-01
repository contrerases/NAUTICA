<template>
  <div class="min-h-screen bg-body flex flex-col items-center justify-center p-8 relative overflow-hidden">
    
    <!-- Elementos decorativos de fondo (ondas/ondas abstractas para "Náutica") -->
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-light/10 rounded-full blur-3xl shadow-2xl"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl shadow-2xl"></div>

    <BaseCard class="max-w-md w-full relative z-10 border-t-4 border-t-primary shadow-lg border-surface-border">
      
      <!-- Encabezado con Icono -->
      <template #header>
        <div class="w-full text-center pt-4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 ring-8 ring-primary/5">
            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-extrabold text-text-base tracking-tight mb-1">
            Acceso Restringido
          </h2>
          <p class="text-text-muted text-sm font-medium">
            Panel de Administración Náutica
          </p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Input Usuario -->
        <BaseInput
          id="username"
          v-model="username"
          label="Usuario"
          placeholder="admin"
          :disabled="isLoading"
          required
          autocomplete="off"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </template>
        </BaseInput>

        <!-- Input Contraseña -->
        <BaseInput
          id="password"
          v-model="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          :disabled="isLoading"
          required
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </template>
        </BaseInput>

        <!-- Mensaje de Error -->
        <div v-if="errorMessage" class="p-3 bg-danger/10 border border-danger/20 rounded-lg animate-pulse-short">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm font-medium text-danger">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Botón Submit -->
        <BaseButton
          type="submit"
          class="w-full"
          size="lg"
          :isLoading="isLoading"
          :disabled="isLoading || !username || !password"
        >
          {{ isLoading ? 'Iniciando sesión...' : 'Entrar al Sistema' }}
        </BaseButton>
      </form>

      <!-- Footer / Regresar -->
      <template #footer>
        <div class="text-center">
          <BaseButton
            variant="ghost"
            size="sm"
            class="text-sm font-bold text-text-muted hover:text-primary"
            :disabled="isLoading"
            @click="goBack"
          >
            <template #icon-left>
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </template>
            Volver al panel de marcaje
          </BaseButton>
        </div>
      </template>
      
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useAdminStore } from '../stores/adminStore'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseButton from '../components/ui/BaseButton.vue'

const router = useRouter()
const adminStore = useAdminStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!username.value || !password.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. Autenticar mediante el cliente tipado (devuelve el Admin o lanza)
    const admin = await api.auth.login({
      username: username.value,
      password: password.value
    })

    // 2. Guardar en el store de Pinia
    adminStore.login(admin)

    // 3. Redirigir al dashboard
    router.push({ name: 'Dashboard' })
  } catch (error: any) {
    errorMessage.value = error?.message || 'Credenciales inválidas'
    password.value = '' // Limpiar contraseña en caso de error
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'PanelMarcaje' })
}
</script>
