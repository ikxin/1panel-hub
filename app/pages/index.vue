<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { fetch } from '@tauri-apps/plugin-http'
import type { Schema as NodeConfigSchema } from '~/components/common/node-config.vue'
import type { BaseInfo, CurrentInfo } from '~/types/dashboard'

const visible = ref(false)

const nodeConfig = useStorage<NodeConfigSchema[]>('node-config', [])

const nodeStatus = useStorage<BaseInfo[]>('node-status', [])

useIntervalFn(() => {
  nodeConfig.value.forEach(async (item, index) => {
    const { host, port, https, token } = item
    const response = await fetch(
      `${
        https ? 'https' : 'http'
      }://${host}:${port}/api/v1/dashboard/base/all/all`,
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
      nodeStatus.value[index] = result.data?.currentInfo
    }
  })
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
    key: 'host',
    label: 'IP',
  },
  {
    key: 'uptime',
    label: '在线时间',
  },
  {
    key: 'cpu',
    label: 'CPU',
  },
  {
    key: 'ram',
    label: 'RAM',
  },
  {
    key: 'rom',
    label: 'ROM',
  },
]

const nodeStatusData = computed(() =>
  nodeConfig.value.map((item, index) => ({
    ...item,
    ...nodeStatus.value[index],
  })),
)
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
      :rows="nodeStatusData"
      :ui="{
        th: {
          base: 'whitespace-nowrap',
        },
      }"
    >
      <template #cpu-data="{ row }: { row: CurrentInfo }">
        <UProgress
          size="2xl"
          :indicator="false"
          :value="row.cpuUsedPercent"
        />
      </template>

      <template #ram-data="{ row }: { row: CurrentInfo }">
        <UProgress
          size="2xl"
          :indicator="false"
          :value="row.memoryUsedPercent"
        />
      </template>

      <template #rom-data="{ row }: { row: CurrentInfo }">
        <UProgress
          size="2xl"
          :indicator="false"
          :value="row.diskData?.[0]?.usedPercent"
        />
      </template>
    </UTable>
  </main>
</template>
