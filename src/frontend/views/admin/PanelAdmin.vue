<template>
  <div class="h-screen w-full flex overflow-hidden bg-body font-sans text-text-base transition-colors duration-300">
    
    <!-- Sidebar Navbar -->
    <aside class="w-72 bg-surface border-r border-surface-border hidden md:flex flex-col flex-shrink-0 transition-colors duration-300 relative z-20">
      <!-- Branding / Logo -->
      <div class="h-20 flex items-center px-6 border-b border-surface-border">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="font-extrabold tracking-tight text-lg text-text-base leading-tight uppercase relative">
              NÁUTICA
            </span>
            <span class="text-[0.65rem] font-bold text-primary tracking-widest uppercase">Admin Panel</span>
          </div>
        </div>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group"
          :class="isCurrentRoute(item.name) ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text-base'"
        >
          <!-- Contenedor del ícono para forzar el tamaño -->
          <div 
            class="flex items-center justify-center transition-colors"
            :class="isCurrentRoute(item.name) ? 'text-primary' : 'text-text-muted group-hover:text-text-base'"
            v-html="item.icon"
          ></div>
          {{ item.label }}
        </router-link>
      </nav>

      <!-- Info del Usuario Fija Abajo -->
      <div class="p-4 border-t border-surface-border m-4 mt-0 bg-surface-muted rounded-xl shadow-sm">
        <div class="flex items-center gap-3">
          <Avatar :name="username" size="md" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-text-base truncate">{{ username }}</p>
            <p class="text-xs text-success font-medium truncate flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-success"></span> Sesión Activa
            </p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Contenido Principal -->
    <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <!-- Top Header / App Bar -->
      <header class="h-20 px-8 flex items-center justify-between bg-surface/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-10 transition-colors duration-300 shadow-sm">
        
        <div class="flex items-center gap-4">
          <h2 class="text-xl sm:text-2xl font-extrabold text-text-base tracking-tight capitalize">
            {{ currentRouteLabel }}
          </h2>
        </div>

        <div class="flex items-center gap-6">
          
          <!-- Switch Modo Oscuro / Claro -->
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            
            <button 
              @click="toggleTheme" 
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
              :class="isDark ? 'bg-primary' : 'bg-surface-border'"
            >
              <span class="sr-only">Toggle Dark Mode</span>
              <span 
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="isDark ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
            
            <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          </div>

          <!-- Cortina separadora y Salir -->
          <div class="pl-6 border-l border-surface-border flex items-center">
            <button 
              @click="handleLogout" 
              class="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors border-none"
              title="Cerrar Sesión"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span class="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Area de Contenido dinámico (Páginas) -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8 bg-body transition-colors duration-300">
        <div class="max-w-7xl mx-auto h-full">
          <router-view v-slot="{ Component }">
            <transition 
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform translate-y-2 opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="transform translate-y-0 opacity-100"
              leave-to-class="transform translate-y-2 opacity-0"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { Avatar } from '../../components/ui'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()

const username = computed(() => adminStore.username || 'Admin')

const menuItems = [
  { 
    name: 'Dashboard', 
    label: 'Dashboard',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>'
  },
  { 
    name: 'Trabajadores', 
    label: 'Trabajadores',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
  },
  { 
    name: 'Historial', 
    label: 'Registro de Horas',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
  },
  { 
    name: 'Finanzas', 
    label: 'Finanzas y Pagos',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
  },
  { 
    name: 'Configuracion', 
    label: 'Configuración',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
  }
]

const isCurrentRoute = (name: string) => route.name === name

const currentRouteLabel = computed(() => {
  const item = menuItems.find(i => i.name === route.name)
  return item ? item.label : 'Panel'
})

// ================= MODO OSCURO (Core Vue Reactivity) =================
const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
}

// Al montar el componente, recuperar preferencia
onMounted(() => {
  const savedTheme = localStorage.getItem('nautica-theme')
  if (savedTheme === 'dark') {
    isDark.value = true
  } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Tomar del sistema por defecto si no hay nada guardado
    isDark.value = true
  }
})

// Watcher nativo para que los cambios se guarden en localStorage y manipulen el HTML root
watchEffect(() => {
  const root = document.documentElement // <html> tag
  if (isDark.value) {
    root.classList.add('dark')
    localStorage.setItem('nautica-theme', 'dark')
  } else {
    root.classList.remove('dark')
    localStorage.setItem('nautica-theme', 'light')
  }
})

// ================= SALIR =================
function handleLogout() {
  adminStore.logout()
  router.push({ name: 'PanelMarcaje' })
}
</script>
