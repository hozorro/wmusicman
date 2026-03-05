import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/store/auth";

const appType = import.meta.env.VITE_APP_TYPE || null
const basePath = appType === 'admin' ? '/admin/' : ''

const routes: RouteRecordRaw[] = [
  { path: "/", 
    component: () => import("@/layout/Main.vue"),
    children: [
      { path: "", name: "Home", component: () => import("@/views/Index.vue") },
      { path: "/upload", name: "upload", component: () => import("@/views/Upload.vue") },
      { path: "/transfer", name: "transfer", component: () => import("@/views/Transfer.vue") },
      { path: "/edit", name: "edit", component: () => import("@/views/Edit.vue") },
      { path: "/scan", name: "scan", component: () => import("@/views/Scan.vue") },
      { path: "/playlist", name: "playlist", component: () => import("@/views/Playlist.vue") },
      { path: "/backup", name: "backup", component: () => import("@/views/Backup.vue") },
      { path: "/log", name: "log", component: () => import("@/views/Log.vue") },
      { path: "/settings", name: "settings", component: () => import("@/views/Settings.vue") },
      { path: "/help", name: "help", component: () => import("@/views/Help.vue")},
      { 
        path: "/tool", 
        name: "tool",
        component: () => import("@/views/Tool.vue"),
        children: [
          { path: "", name: "tool-index", component: () => import("@/views/tools/TestView.vue")},
          { path: "color", name: "tool-color", component: () => import("@/views/tools/Color.vue") },
          { path: "test", name: "tool-test", component: () => import("@/views/tools/GetPlaylist.vue") }
        ]
      },
    ]
  },
  { path: "/login", name: "login", component: () => import("@/views/Login.vue") },
  { path: "/register", name: "register", component: () => import("@/views/Register.vue") },
  { path: "/:catchAll(.*)", name: "404", component: () => import("@/views/NotFound.vue") }
];

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
});

router.beforeEach(async (to, _, next) => { 
  const authStore = useAuthStore()
  if(to.path === basePath + '/login' || to.path === basePath + '/register') {
    if (to.path === basePath + '/login' && authStore.isAuthenticated) {
      return next(basePath + '/')
    }
    return next()
  }
  if (!authStore.isAuthenticated) {
    const refreshed = await authStore.refresh()
    if(!refreshed) {
      return next({
        path: basePath + '/login',
        query: { redirect: to.fullPath }
      })
    }
  }
  return next()
});

export default router;