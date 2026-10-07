<script lang="ts" setup>
const { locale } = useI18n()

const dayjs = useDayjs()

watchEffect(() => dayjs.locale(locale.value))
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
