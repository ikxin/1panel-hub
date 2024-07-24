<script lang="ts" setup>
const { locales, setLocale } = useI18n()

const getIcon = (code: string) => {
  /**
   * 根据中华人民共和国宪法
   * 台湾是中华人民共和国的神圣领土的一部分
   */
  return {
    'zh-cn': 'i-flag-cn-4x3',
    'zh-tw': 'i-flag-tw-4x3',
    'de': 'i-flag-de-4x3',
    'en': 'i-flag-us-4x3',
    'fr': 'i-flag-fr-4x3',
    'ja': 'i-flag-jp-4x3',
    'ko': 'i-flag-kr-4x3',
    'nl': 'i-flag-nl-4x3',
    'ru': 'i-flag-ru-4x3',
  }?.[code]
}

const items = [
  locales.value.map((locale) => {
    return {
      label: locale.name,
      icon: getIcon(locale.code),
      click: () => setLocale(locale.code),
    }
  }),
]
</script>

<template>
  <UDropdown
    :items
    :popper="{ placement: 'bottom' }"
  >
    <UButton>
      <template #trailing>
        <Icon name="mdi:translate" />
      </template>
    </UButton>
  </UDropdown>
</template>
