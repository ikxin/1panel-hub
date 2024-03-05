import { createApp } from 'vue'
import App from './App.vue'
import { router } from '@/router'
import locales from '@/locales'

import '@unocss/reset/tailwind.css'
import '@arco-design/web-vue/dist/arco.css'
import 'virtual:uno.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(locales)
app.use(router)
app.mount('#app')
