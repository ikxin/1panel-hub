<script setup lang="ts">
import defaultLayout from '@/layout/default.vue'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
</script>

<template>
  <AConfigProvider :locale="enUS">
    <defaultLayout />
  </AConfigProvider>
</template>
