import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'

// Mock API methods
vi.mock('@/apis/methods/manage', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn()
}))

// Create stub components
const StubComponent = { template: '<div>stub</div>' }

// Helper to create a test router with the same guard logic as router/index.ts
function createTestRouter(
  authStore: { isAuthenticated: boolean; refresh: () => Promise<boolean> },
  systemInitialized: boolean = true
) {
  const routes: RouteRecordRaw[] = [
    { path: '/', component: StubComponent },
    { path: '/login', name: 'login', component: StubComponent },
    { path: '/register', name: 'register', component: StubComponent },
    { path: '/protected', name: 'protected', component: StubComponent },
  ]

  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  // Mirror the guard logic from router/index.ts
  router.beforeEach(async (to) => {
    if (to.path === '/login' || to.path === '/register') {
      if (to.path === '/login' && authStore.isAuthenticated) {
        return '/'
      }
      return true
    }
    if (!authStore.isAuthenticated) {
      const refreshed = await authStore.refresh()
      if (!refreshed) {
        // Check initialization status before redirecting
        if (!systemInitialized) {
          return { path: '/register' }
        }
        return {
          path: '/login',
          query: { redirect: to.fullPath }
        }
      }
    }
    return true
  })

  return router
}

describe('Router Guard', () => {
  let authStore: { isAuthenticated: boolean; refresh: () => Promise<boolean> }

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = {
      isAuthenticated: false,
      refresh: vi.fn()
    }
    vi.clearAllMocks()
  })

  it('should allow authenticated user to access protected page', async () => {
    authStore.isAuthenticated = true
    const router = createTestRouter(authStore)

    await router.push('/protected')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/protected')
  })

  it('should allow unauthenticated user to access login page', async () => {
    authStore.isAuthenticated = false
    const router = createTestRouter(authStore)

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('should allow unauthenticated user to access register page', async () => {
    authStore.isAuthenticated = false
    const router = createTestRouter(authStore)

    await router.push('/register')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/register')
  })

  it('should redirect authenticated user from login to home', async () => {
    authStore.isAuthenticated = true
    const router = createTestRouter(authStore)

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('should redirect to login when refresh fails and system is initialized', async () => {
    authStore.isAuthenticated = false
    vi.mocked(authStore.refresh).mockResolvedValueOnce(false)
    const router = createTestRouter(authStore, true) // system IS initialized

    await router.push('/protected')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/protected')
  })

  it('should redirect to register when refresh fails and system is NOT initialized', async () => {
    authStore.isAuthenticated = false
    vi.mocked(authStore.refresh).mockResolvedValueOnce(false)
    const router = createTestRouter(authStore, false) // system NOT initialized

    await router.push('/protected')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/register')
  })

  it('should allow access when refresh succeeds', async () => {
    authStore.isAuthenticated = false
    vi.mocked(authStore.refresh).mockResolvedValueOnce(true)
    const router = createTestRouter(authStore)

    await router.push('/protected')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/protected')
  })

  it('should preserve redirect query with full path', async () => {
    authStore.isAuthenticated = false
    vi.mocked(authStore.refresh).mockResolvedValueOnce(false)
    const router = createTestRouter(authStore, true) // system IS initialized

    await router.push('/protected?foo=bar')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/protected?foo=bar')
  })
})
