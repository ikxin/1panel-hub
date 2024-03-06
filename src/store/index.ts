import { LocaleType } from '@/locales'
import { RemovableRef } from '@vueuse/core'

export const useGlobalStore = defineStore('global', () => {
  const { locale } = useI18n()

  const _locale: RemovableRef<LocaleType['prop']> = useStorage<LocaleType['prop']>('locale', 'zh')

  watchEffect(() => {
    locale.value = _locale.value
  })

  return {
    locale: _locale,
  }
})
