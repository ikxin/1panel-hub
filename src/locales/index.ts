import { createI18n } from 'vue-i18n'
import en from '@/locales/modules/en.json'

const locales = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en,
  },
})

export default locales
