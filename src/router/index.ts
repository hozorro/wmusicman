import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "Home", component: () => import("@/views/Home.vue") },
  { path: "/upload", name: "upload", component: () => import("@/views/Upload.vue") },
  { path: "/transfer", name: "transfer", component: () => import("@/views/Transfer.vue") },
  { path: "/edit", name: "edit", component: () => import("@/views/Edit.vue") },
  { path: "/scan", name: "scan", component: () => import("@/views/Scan.vue") },
  { path: "/playlist", name: "playlist", component: () => import("@/views/Playlist.vue") },
  { path: "/log", name: "log", component: () => import("@/views/Log.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;