import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // 生产环境环境变量定义
  define: {
    'import.meta.env.VITE_API_HOST': JSON.stringify(process.env.VITE_API_HOST || ''),
  },
})