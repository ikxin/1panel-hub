<script setup lang="ts">
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
</script>

<template>
  <AConfigProvider :locale="enUS">
    <RouterView />
  </AConfigProvider>
</template>
