<script setup lang="ts">
import axios from 'axios'
import { IconPlus } from '@arco-design/web-vue/es/icon'

const { t } = useI18n()

const serverData = useStorage<any>('server-data', [])

const serverDataModal = reactive({
  visible: false,
})

const serverDataForm = ref({
  name: 'Example Server',
  ip: '192.168.1.100',
  port: '8888',
  username: 'username',
  password: 'password',
})

const handleBeforeOk = async () => {
  const { data } = await axios('/api/v1/auth/login', {
    method: 'POST',
    data: {
      authMethod: 'jwt',
      captcha: '',
      captchaID: '',
      ignoreCaptcha: true,
      language: 'zh',
      name: serverDataForm.value.username,
      password: serverDataForm.value.password,
    },
  })
  if (data.code === 200) {
    serverData.value.push({
      ...serverDataForm.value,
      token: data.data.token,
    })
    return true
  } else {
    return false
  }
}
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
      <AModal v-model:visible="serverDataModal.visible" :title="t('title.serverInfo')" :on-before-ok="handleBeforeOk">
        <AForm :model="serverDataForm">
          <AFormItem :label="t('label.name')">
            <AInput v-model="serverDataForm.name"></AInput>
          </AFormItem>
          <AFormItem :label="t('label.ip')">
            <AInput v-model="serverDataForm.ip"></AInput>
          </AFormItem>
          <AFormItem :label="t('label.port')">
            <AInput v-model="serverDataForm.port"></AInput>
          </AFormItem>
          <AFormItem :label="t('label.username')">
            <AInput v-model="serverDataForm.username"></AInput>
          </AFormItem>
          <AFormItem :label="t('label.password')">
            <AInput v-model="serverDataForm.password"></AInput>
          </AFormItem>
        </AForm>
      </AModal>
    </div>
  </ALayoutHeader>
  <AScrollbar class="max-h-[calc(100vh-4rem)] overflow-auto">
    <div class="mx-auto flex flex-col gap-4 min-h-full max-w-6xl my-4 px-4">
      <AAlert :title="t('title.prompt')">
        {{ t('alert.notAddedServer') }}
      </AAlert>
      <div v-for="i in serverData" :key="i" class="h-32 w-full rounded border border-gray-200"></div>
    </div>
  </AScrollbar>
</template>
