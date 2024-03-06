<script setup lang="ts">
import DefaultLayout from '@/layout/default-layout.vue'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
</script>

<template>
  <AConfigProvider :locale="enUS">
    <DefaultLayout />
  </AConfigProvider>
</template>
