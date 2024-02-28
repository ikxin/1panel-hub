import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { internalIpV4 } from 'internal-ip'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import VueRouter from 'unplugin-vue-router/vite'

// process is a nodejs global
const mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM)

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  plugins: [
    VueRouter({
      dts: './src/typings/vue-router.d.ts',
      extensions: ['.vue'],
      routesFolder: './src/views',
    }),
    vue(),
    UnoCSS(),
    AutoImport({
      dts: './src/typings/imports.d.ts',
      imports: ['vue', '@vueuse/core', 'vue-i18n', 'vue-router'],
      resolvers: [ArcoResolver()],
    }),
    Components({
      dts: './src/typings/components.d.ts',
      resolvers: [
        ArcoResolver({
          sideEffect: false,
        }),
      ],
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: mobile ? '0.0.0.0' : false,
    hmr: mobile
      ? {
          protocol: 'ws',
          host: await internalIpV4(),
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}))
