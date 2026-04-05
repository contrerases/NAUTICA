<template>
  <router-view />
  <DatabaseSyncIndicator />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DatabaseSyncIndicator from './components/ui/DatabaseSyncIndicator.vue';

/**
 * Componente raíz de la aplicación
 * Carga la configuración al iniciar y renderiza la vista activa del router
 */

onMounted(async () => {
  console.log('[App] Aplicación iniciada')

  // TODO: Cargar configuración inicial
  // await configStore.loadConfig()

  // TODO: Verificar jornadas pendientes (pasar OPEN → PENDING si cambió el día)
  // await attendanceService.checkPendingShifts()
})
</script>

<style>
/* Los estilos globales están en assets/main.css */
</style>
