import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    // 开发时把 /api 转发给后端；后端不在本机 8000 端口时用 API_PROXY 指定，比如 http://localhost:30426/api
    proxy: {
      '/api': {
        target: process.env.API_PROXY || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
