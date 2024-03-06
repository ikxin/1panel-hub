<script lang="ts" setup>
import { IconLanguage } from '@arco-design/web-vue/es/icon'
import { useGlobalStore } from '@/store'
import { _locales as locales } from '@/locales'

const { locale: _locale } = storeToRefs(useGlobalStore())

const { t } = useI18n()
</script>

<template>
  <ADropdown>
    <AButton size="small" type="secondary">
      <template #icon>
        <IconLanguage />
      </template>
    </AButton>
    <template #content>
      <ADoption v-for="locale in locales" :key="locale.prop" @click="_locale = locale.prop">
        <template #icon>
          <i :class="locale.flag" />
        </template>
        <template #default>{{ t(locale.lable) }}</template>
      </ADoption>
    </template>
  </ADropdown>
</template>
