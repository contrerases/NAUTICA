<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useConfigStore } from './stores/configStore';

/**
 * Componente raíz. Carga la configuración vigente al iniciar y renderiza el router.
 */
const configStore = useConfigStore();

onMounted(async () => {
  console.log('[App] Aplicación iniciada')
  await configStore.loadConfig()
})
</script>

<style>
/* Los estilos globales están en assets/main.css */
</style>
