import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendProxyTarget = process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
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
})
