<script setup lang="ts">
import { loginApi } from '@/api/modules/auth'
import { IconPlus } from '@arco-design/web-vue/es/icon'

const { t } = useI18n()

const serverData = useStorage<any>('server-data', [])

const currentToken = useStorage<string>('current-token', '')

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
  const { data } = await loginApi({
    authMethod: 'jwt',
    captcha: '',
    captchaID: '',
    ignoreCaptcha: true,
    language: 'en',
    name: serverDataForm.value.username,
    password: serverDataForm.value.password,
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

const enterPanel = (token: string) => {
  currentToken.value = token
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
    <div class="mx-auto grid grid-cols-4 gap-4 min-h-full max-w-6xl my-4 px-4">
      <AAlert :title="t('title.prompt')" class="col-span-4">
        {{ t('alert.notAddedServer') }}
      </AAlert>
      <ACard :title="item.name" v-for="item in serverData" :key="item.ip" size="medium">
        <ADescriptions :column="1" :align="{ label: 'right' }">
          <ADescriptionsItem :label="t('label.ip')">{{ item.ip }}</ADescriptionsItem>
          <ADescriptionsItem :label="t('label.port')">{{ item.port }}</ADescriptionsItem>
          <ADescriptionsItem :label="t('label.username')">{{ item.username }}</ADescriptionsItem>
          <ADescriptionsItem :label="t('label.password')">{{ item.password }}</ADescriptionsItem>
        </ADescriptions>
        <AButton class="mt-2" @click="enterPanel(item.token)">{{ t('button.enterPanel') }}</AButton>
      </ACard>
    </div>
  </AScrollbar>
</template>
