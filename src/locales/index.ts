import { createI18n } from 'vue-i18n'
import en from '@/locales/modules/en.json'
import zh from '@/locales/modules/zh.json'

const locales = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en,
    zh,
  },
})

export default locales
