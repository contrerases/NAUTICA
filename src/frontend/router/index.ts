/**
 * Vue Router - Configuración de rutas
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas de la aplicación
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'PanelMarcaje',
    component: () => import('@/views/PanelMarcaje.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'LoginAdmin',
    component: () => import('@/views/LoginAdmin.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'PanelAdmin',
    component: () => import('@/views/admin/PanelAdmin.vue'),
    meta: { requiresAuth: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'trabajadores',
        name: 'Trabajadores',
        component: () => import('@/views/admin/Trabajadores.vue')
      },
      {
        path: 'historial',
        name: 'Historial',
        component: () => import('@/views/admin/Historial.vue')
      },
      {
        path: 'finanzas',
        name: 'Finanzas',
        component: () => import('@/views/admin/Finanzas.vue')
      },
      {
        path: 'configuracion',
        name: 'Configuracion',
        component: () => import('@/views/admin/Configuracion.vue')
      }
    ]
  }
]

/**
 * Instancia del router
 * Usa hash mode (#/) para compatibilidad con Electron
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/**
 * Guard global: protege rutas del admin
 */
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    // Verificar sesión usando un dynamic import para evitar problemas de hoisting en Pinia
    const { useAdminStore } = await import('@/stores/adminStore')
    const adminStore = useAdminStore()
    
    // resetSessionTimeout is called initially, checkSession() also ensures validity
    if (!adminStore.session) {
      return next({ name: 'LoginAdmin' })
    }
  }

  next()
})

export default router
