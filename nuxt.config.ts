// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  devServer: { host: '0.0.0.0' },
  future: {
    compatibilityVersion: 4
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
})
