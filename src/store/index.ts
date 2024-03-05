import { RemovableRef } from '@vueuse/core'

export const useGlobalStore = defineStore('global', () => {
  const { locale } = useI18n()

  const language: RemovableRef<string> = useStorage('language', 'zh')

  locale.value = language.value

  const toggleLanguage = (lang: string) => {
    language.value = locale.value = lang
  }

  return {
    language,
    toggleLanguage,
  }
})
