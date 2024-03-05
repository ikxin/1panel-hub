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

export const languages = [
  {
    lable: 'label.zh',
    value: 'zh',
    icon: 'i-flag:cn-4x3',
  },
  {
    lable: 'label.en',
    value: 'en',
    icon: 'i-flag:us-4x3',
  },
]
