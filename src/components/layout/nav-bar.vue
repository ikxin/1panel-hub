<script lang="ts" setup>
import { loginApi } from '@/api/modules/auth'
import { IconPlus, IconLanguage } from '@arco-design/web-vue/es/icon'
import { useGlobalStore } from '@/store'
import { languages } from '@/locales'

const { toggleLanguage } = useGlobalStore()

const { t } = useI18n()

const serverData = useStorage<any[]>('serverData', [])

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
</script>

<template>
  <ALayoutHeader class="h-16 sticky top-0 bg-white border-b border-gray-200 shadow-md max-w-full">
    <div class="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
      <div class="flex-1">
        <div class="h-8 w-32 rounded bg-slate-200 flex justify-center items-center">logo</div>
      </div>
      <div class="flex flex-1 items-center justify-end gap-2">
        <AButton size="small" @click="serverDataModal.visible = true">
          <template #icon>
            <IconPlus />
          </template>
        </AButton>
        <ADropdown>
          <AButton size="small" type="secondary">
            <template #icon>
              <IconLanguage />
            </template>
          </AButton>
          <template #content>
            <ADoption v-for="item in languages" :key="item.value" @click="toggleLanguage(item.value)">
              <template #icon>
                <i :class="item.icon" />
              </template>
              <template #default>{{ t(item.lable) }}</template>
            </ADoption>
          </template>
        </ADropdown>
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
</template>
