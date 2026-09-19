import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const apiBase = env.VITE_API_BASE || 'http://127.0.0.1:8000'
  const isLocalBackend = /127\.0\.0\.1|localhost/.test(apiBase)

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],
    base: '/admin/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5175,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          ...(isLocalBackend && {
            rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
          })
        },
        '/media': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'happy-dom',
      globals: true,
    },
  }
})
