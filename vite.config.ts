import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  optimizeDeps: {
    include: ['@douyinfe/semi-ui/lib/es/form', '@douyinfe/semi-ui/lib/es/modal'],
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  build: {
    target: ['es2022', 'chrome111', 'safari16.4'],
  },
})
