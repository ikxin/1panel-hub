<script lang="ts" setup>
const { locale } = useI18n()

const dayjs = useDayjs()

watchEffect(() => dayjs.locale(locale.value))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
body {
  @apply select-none;
}
</style>
