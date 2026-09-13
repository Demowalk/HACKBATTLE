import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/tasks': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
