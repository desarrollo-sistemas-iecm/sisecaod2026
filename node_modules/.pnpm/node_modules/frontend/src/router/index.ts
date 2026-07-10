import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const LoginView       = () => import('@/views/LoginView.vue')
const DashboardView   = () => import('@/views/DashboardView.vue')
const CatalogoView    = () => import('@/views/CatalogoView.vue')
const SeguimientoView = () => import('@/views/SeguimientoView.vue')
const ReportesView    = () => import('@/views/ReportesView.vue')
const ImportarView    = () => import('@/views/ImportarView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, roles: [1, 2, 3, 4, 5] },
  },
  {
    path: '/catalogo',
    name: 'catalogo',
    component: CatalogoView,
    meta: { requiresAuth: true, roles: [1, 2, 3, 4] },
  },
  {
    path: '/catalogo/importar',
    name: 'importar',
    component: ImportarView,
    meta: { requiresAuth: true, roles: [1, 5] },
  },
  {
    path: '/seguimiento',
    name: 'seguimiento',
    component: SeguimientoView,
    meta: { requiresAuth: true, roles: [3, 5] },
  },
  {
    path: '/reportes',
    name: 'reportes',
    component: ReportesView,
    meta: { requiresAuth: true, roles: [1, 2, 3, 4] },
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('@/views/UsuariosView.vue'),
    meta: { requiresAuth: true, roles: [5] },
  },
  {
    path: '/configuracion',
    redirect: '/catalogo/importar'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }


  const roles = to.meta.roles as number[] | undefined
  if (roles && !roles.includes(authStore.perfil)) {
    return { name: 'dashboard' }
  }
})

export default router
