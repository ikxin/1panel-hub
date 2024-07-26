<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { fetch } from '@tauri-apps/plugin-http'
import type { Schema as NodeConfigSchema } from '~/components/common/node-config.vue'

const visible = ref(false)

const nodeConfig = useStorage<NodeConfigSchema[]>('node-config', [])

const nodeStatus = useStorage<any>('node-status', [])

useIntervalFn(async () => {
  for (const item in nodeConfig.value) {
    if (!nodeConfig.value[item]) {
      return
    }
    const { name, host, port, https, token } = nodeConfig.value[item]
    const response = await fetch(
      `${
        https ? 'https' : 'http'
      }://${host}:${port}/api/v1/dashboard/current/all/all`,
      {
        headers: {
          PanelAuthorization: token,
        },
      },
    )
    const result = await response.json()
    if (result.code !== 200) {
      console.log(result.message)
    } else {
      const index = nodeStatus.value.findIndex(
        (item: any) => item.name === name,
      )

      const assignData = Object.assign(result.data, { name })

      if (index === -1) {
        nodeStatus.value.push(assignData)
      } else {
        nodeStatus.value[index] = assignData
      }
    }
  }
}, 1000)

const columns = [
  {
    key: 'id',
    label: '运行状态',
  },
  {
    key: 'name',
    label: '节点名',
  },
  {
    key: 'title',
    label: 'IP',
  },
  {
    key: 'email',
    label: '在线时间',
  },
  {
    key: 'role',
  },
]
</script>

<template>
  <header
    class="flex flex-col gap-4 h-64 justify-center items-center select-none cursor-pointer"
  >
    <div class="bg-black text-4xl font-extrabold p-5 rounded-lg">
      <span class="mr-2">1Panel</span>
      <span class="bg-[#ff9902] text-black py-1 px-2 rounded-md">Hub</span>
    </div>

    <UButton
      :label="$t('label.create-client')"
      @click="visible = true"
    />
    <CommonNodeConfig v-model="visible" />

    <CommonSetLocale />
  </header>
  <main
    class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl gap-16 sm:gap-y-24 flex flex-col"
  >
    <UTable
      :columns
      :rows="nodeStatus"
    />
  </main>
</template>
