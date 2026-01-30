import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { checkInitialized } from "@/apis/methods/manage";

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
      { path: "/log", name: "settings", component: () => import("@/views/Settings.vue") },
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
  { path: "/login", name: "Login", component: () => import("@/views/Login.vue") },
  { path: "/register", name: "Register", component: () => import("@/views/Register.vue") },
  { path: "/:catchAll(.*)", name: "404", component: () => import("@/views/NotFound.vue") }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let initializedChecked = false;

router.beforeEach(async (to, _, next) => { 
  if(to.path === '/login' || to.path === '/register') {
    return next()
  }
  if (!initializedChecked) {
    try {
      const res = await checkInitialized()
      const initialized = res.initialized
      if (!initialized) {
        if(to.path !== '/register') {
          return next('/register')
        }
      } else {
        initializedChecked = true
      }
    } catch (error) {
      console.log(error)
      alert('检查初始化状态时发生错误，请稍后再试')
    } finally {
      initializedChecked = true
    }
  }
  const token = localStorage.getItem("token");
  const refresh_token = localStorage.getItem("refresh_token");
  if(!token && !refresh_token) {
    return next('/login')
  }
  // if(token) {
  //   try {
  //     await getCurrentUser()
  //     return next()
  //   } catch (error) {
  //     localStorage.removeItem("token")
  //     return next('/login')
  //   }
  // }
  return next()
});

export default router;