/**
 * Frontend - Entry Point
 *
 * Inicializa Vue 3 con:
 * - Pinia (estado global)
 * - Vue Router (navegación)
 * - Tailwind CSS (estilos)
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Estilos globales (Tailwind CSS)
import './assets/main.css'

// Crear instancia de Vue
const app = createApp(App)

// Plugins
app.use(createPinia())
app.use(router)

// Montar la aplicación
app.mount('#app')
