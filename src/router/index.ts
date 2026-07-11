import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/store/auth";
import axios from "axios";

const routes: RouteRecordRaw[] = [
  { path: "/", 
    component: () => import("@/layout/Main.vue"),
    children: [
      { path: "", name: "Home", component: () => import("@/views/Index.vue") },
      { path: "/initial", name: "initial", component: () => import("@/views/Initial.vue") },
      { path: "/upload", name: "upload", component: () => import("@/views/Upload.vue") },
      { path: "/transfer", name: "transfer", component: () => import("@/views/Transfer.vue") },
      { path: "/edit", name: "edit", component: () => import("@/views/Edit.vue") },
      { path: "/scan", name: "scan", component: () => import("@/views/Scan.vue") },
      { path: "/artwork", name: "artwork", component: () => import("@/views/Artwork.vue") },
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
          { path: "", name: "tool-index", component: () => import("@/views/tools/Color.vue")},
          { path: "color", name: "tool-color", component: () => import("@/views/tools/Color.vue") },
          { path: "getplaylist", name: "tool-getplaylist", component: () => import("@/views/tools/GetPlaylist.vue") },
          { path: "test", name: "tool-test", component: () => import("@/views/tools/TestView.vue") },
          { path: "art", name: "tool-art", component: () => import("@/views/tools/ArtistArt.vue") }
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

// Use raw axios to check initialization status without Alova's auth interceptor.
// This avoids 401 → refresh → redirect loops.
async function isSystemInitialized(): Promise<boolean> {
  try {
    const res = await axios.get('/api/system/initialized')
    return res.data?.data?.initialized === true
  } catch {
    return false
  }
}

router.beforeEach(async (to) => { 
  const authStore = useAuthStore()
  if(to.path === '/login' || to.path === '/register') {
    if (to.path === '/login' && authStore.isAuthenticated) {
      return '/'
    }
    return true
  }
  if (!authStore.isAuthenticated) {
    const refreshed = await authStore.refresh()
    if(!refreshed) {
      // Before redirecting to /login, check if the system is initialized.
      // If not, redirect to /register so the first user can be created.
      const initialized = await isSystemInitialized()
      if (!initialized) {
        return { path: '/register' }
      }
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      }
    }
  }
  return true
});

export default router;