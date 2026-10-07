<script lang="ts" setup>
const { locales, setLocale } = useI18n()

const getIcon = (code: string) => {
  return {
    'zh-cn': 'i-flag-cn-4x3',
    'zh-tw': 'i-flag-tw-4x3',
    de: 'i-flag-de-4x3',
    en: 'i-flag-us-4x3',
    fr: 'i-flag-fr-4x3',
    ja: 'i-flag-jp-4x3',
    ko: 'i-flag-kr-4x3',
    nl: 'i-flag-nl-4x3',
    ru: 'i-flag-ru-4x3',
  }?.[code]
}

const items = computed(() => [
  locales.value.map((locale) => ({
    label: locale.name,
    icon: getIcon(locale.code),
    onSelect: () => setLocale(locale.code),
  })),
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ side: 'bottom' }">
    <UButton variant="ghost" color="neutral" icon="i-mdi-translate" />
  </UDropdownMenu>
</template>
