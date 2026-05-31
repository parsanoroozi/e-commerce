import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendProxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8080'
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : ['localhost', '127.0.0.1']

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts,
      proxy: {
        '/api': {
          target: backendProxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
              return 'react'
            }
            if (id.includes('/@mui/') || id.includes('/@emotion/')) {
              return 'mui'
            }
            if (id.includes('/@stripe/')) {
              return 'stripe'
            }
            if (id.includes('/leaflet/')) {
              return 'maps'
            }
            return 'vendor'
          },
        },
      },
    },
  }
})
