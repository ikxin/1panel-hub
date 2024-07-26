<script lang="ts" setup>
import { fetch } from '@tauri-apps/plugin-http'
import { useStorage } from '@vueuse/core'
import { z } from 'zod'
import type { FormSubmitEvent, Form } from '#ui/types'

const schema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  https: z.boolean(),
  entrance: z.string(),
  token: z.string().min(1),
})

export type Schema = z.output<typeof schema>

const runtimeConfig = useRuntimeConfig()

const state = reactive<Schema>({
  name: runtimeConfig.public.dev.name || '',
  host: runtimeConfig.public.dev.host || '',
  port: runtimeConfig.public.dev.port || 10000,
  username: runtimeConfig.public.dev.username || '',
  password: runtimeConfig.public.dev.password || '',
  https: runtimeConfig.public.dev.https || false,
  entrance: runtimeConfig.public.dev.entrance || '',
  token: '',
})

const form = ref<Form<Schema>>()

const loading = ref(false)

const getToken = async (loginInfo: Schema) => {
  loading.value = true
  const { host, port, username, password, https, entrance } = loginInfo
  try {
    const response = await fetch(
      `${https ? 'https' : 'http'}://${host}:${port}/api/v1/auth/login`,
      {
        method: 'POST',
        headers: {
          EntranceCode: btoa(entrance),
        },
        body: JSON.stringify({
          name: username,
          password: password,
          authMethod: 'jwt',
          language: 'zh',
        }),
      },
    )

    const result = await response.json()

    if (result.code !== 200) {
      console.log(result.message)
    } else {
      state.token = result.data.token
    }

    loading.value = false
  } catch (error) {
    loading.value = false
    console.error(error)
  }
}

const visible = defineModel<boolean>()

const nodeConfig = useStorage<Schema[]>('node-config', [])

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const { name } = event.data
  const index = nodeConfig.value.findIndex(item => item.name === name)

  if (index === -1) {
    nodeConfig.value.push(event.data)
  } else {
    nodeConfig.value[index] = event.data
  }

  visible.value = false
}

watch(visible, (value) => {
  if (!value) {
    state.token = ''
    state.name = ''
    state.host = ''
    state.port = 10000
    state.username = ''
    state.password = ''
    state.https = false
    state.entrance = ''
    state.token = ''
  }
})
</script>

<template>
  <UModal
    v-model="visible"
    prevent-close
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-bold">
            {{ $t('label.create-client') }}
          </h2>
          <UButton
            color="gray"
            variant="ghost"
            size="xs"
            icon="i-heroicons-x-mark-20-solid"
            @click="visible = false"
          />
        </div>
      </template>

      <UForm
        ref="form"
        class="space-y-4"
        :schema
        :state
        @submit="onSubmit"
      >
        <UFormGroup
          name="host"
          :label="$t('label.host')"
          required
        >
          <UInput v-model="state.host" />
        </UFormGroup>
        <UFormGroup
          name="port"
          :label="$t('label.port')"
          required
        >
          <UInput
            v-model="state.port"
            type="number"
          />
        </UFormGroup>
        <UFormGroup
          name="username"
          :label="$t('label.username')"
          required
        >
          <UInput v-model="state.username" />
        </UFormGroup>
        <UFormGroup
          name="password"
          :label="$t('label.password')"
          required
        >
          <UInput v-model="state.password" />
        </UFormGroup>
        <UFormGroup
          name="https"
          :label="$t('label.https')"
          required
        >
          <UToggle v-model="state.https" />
        </UFormGroup>
        <UFormGroup
          name="entrance"
          :label="$t('label.entrance')"
        >
          <UInput v-model="state.entrance" />
        </UFormGroup>
        <UFormGroup
          name="token"
          :label="$t('label.token')"
          required
        >
          <div class="flex items-center gap-2">
            <UInput
              v-model="state.token"
              disabled
              class="w-full"
            />
            <UButton
              :loading
              variant="outline"
              @click="getToken(state)"
            >
              {{ $t('button.get-token') }}
            </UButton>
          </div>
        </UFormGroup>
      </UForm>
      <template #footer>
        <UButton @click="form?.submit()">
          {{ $t('button.submit') }}
        </UButton>
      </template>
    </UCard>
  </UModal>
</template>
