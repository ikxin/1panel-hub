// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  extends: ['@nuxt/ui-pro'],
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxtjs/i18n', '@vueuse/nuxt', 'dayjs-nuxt'],
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  devServer: { host: '0.0.0.0' },
  future: {
    compatibilityVersion: 4,
  },
  runtimeConfig: {
    public: {
      dev: {
        name: '',
        host: '',
        port: 10000,
        username: '',
        password: '',
        https: false,
        entrance: '',
      },
    },
  },
  vite: {
    // 为 Tauri 命令输出提供更好的支持
    clearScreen: false,
    // 启用环境变量
    // 其他环境变量可以在如下网页中获知：
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      // Tauri 需要一个确定的端口
      strictPort: true,
      hmr: {
        // 使用 WebSocket 以支持移动端热重载
        protocol: 'ws',
        // 确保它在网络上可用
        host: '0.0.0.0',
        // 使用 hmr 的特定端口
        port: 5183,
      },
    },
  },
  eslint: {
    config: {
      stylistic: {
        braceStyle: '1tbs',
        indent: 2,
        quotes: 'single',
      },
    },
  },
  i18n: {
    defaultLocale: 'zh-cn',
    langDir: 'locales',
    locales: [
      { code: 'zh-cn', file: 'zh-cn.json', name: '简体中文' },
      { code: 'zh-tw', file: 'zh-tw.json', name: '繁體中文' },
      { code: 'de', file: 'de.json', name: 'Deutsch' },
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'fr', file: 'fr.json', name: 'Français' },
      { code: 'ja', file: 'ja.json', name: '日本語' },
      { code: 'ko', file: 'ko.json', name: '한국어' },
      { code: 'nl', file: 'nl.json', name: 'Nederlands' },
      { code: 'ru', file: 'ru.json', name: 'Русский' },
    ],
    strategy: 'no_prefix',
  },
})
