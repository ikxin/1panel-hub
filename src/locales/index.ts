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

export interface LocaleType {
  lable: string
  prop: 'zh' | 'en'
  flag: string
}

export const _locales: LocaleType[] = [
  {
    lable: 'label.zh',
    prop: 'zh',
    flag: 'i-flag:cn-4x3',
  },
  {
    lable: 'label.en',
    prop: 'en',
    flag: 'i-flag:us-4x3',
  },
]
