<script setup lang="ts">
import { IconPlus } from '@arco-design/web-vue/es/icon'
const { t } = useI18n()

const serverData = useStorage('server-data', [])

const serverDataModal = reactive({
  visible: false,
})

const serverDataForm = ref({
  name: '',
  ip: '',
  port: 10000,
  username: '',
  password: '',
})
</script>

<template>
  <ALayoutHeader class="h-16 sticky top-0 bg-white border-b border-gray-200 shadow-md">
    <div class="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
      <div class="flex-1">
        <div class="h-8 w-32 rounded bg-slate-200 flex justify-center items-center">logo</div>
      </div>
      <div class="flex flex-1 items-center justify-end">
        <AButton size="small" @click="serverDataModal.visible = true">
          <template #icon>
            <IconPlus />
          </template>
        </AButton>
      </div>
      <AModal v-model:visible="serverDataModal.visible">
        <AForm :model="serverDataForm">
          <AFormItem :label="t('common.label.name')">
            <AInput :model-value="serverDataForm.name"></AInput>
          </AFormItem>
          <AFormItem :label="t('common.label.ip')">
            <AInput :model-value="serverDataForm.ip"></AInput>
          </AFormItem>
          <AFormItem :label="t('common.label.port')">
            <AInputNumber :model-value="serverDataForm.port"></AInputNumber>
          </AFormItem>
          <AFormItem :label="t('common.label.username')">
            <AInput :model-value="serverDataForm.username"></AInput>
          </AFormItem>
          <AFormItem :label="t('common.label.password')">
            <AInput :model-value="serverDataForm.password"></AInput>
          </AFormItem>
        </AForm>
      </AModal>
    </div>
  </ALayoutHeader>
  <AScrollbar class="max-h-[calc(100vh-4rem)] overflow-auto">
    <div class="mx-auto flex flex-col gap-4 min-h-full max-w-6xl my-4 px-4">
      <AAlert :title="t('common.alert.notAddedServerTitle')">
        {{ t('common.alert.notAddedServer') }}
      </AAlert>
      <div v-for="i in serverData" :key="i" class="h-32 w-full rounded border border-gray-200"></div>
    </div>
  </AScrollbar>
</template>
