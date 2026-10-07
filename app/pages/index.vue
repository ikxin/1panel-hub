<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { fetch } from '@tauri-apps/plugin-http'
import type { TableColumn } from '@nuxt/ui'
import type { Schema as NodeConfigSchema } from '~/components/common/node-config.vue'
import type { BaseInfo } from '~/types/dashboard'
import { computeSize, computeSizeFromByte } from '#imports'

definePageMeta({
  layout: false,
})

interface StatusInfo extends BaseInfo {
  netBytesSentSpeed?: number
  netBytesRecvSpeed?: number
}

type NodeStatusRow = NodeConfigSchema & Partial<StatusInfo>

const dayjs = useDayjs()

const now = ref(Date.now())

const visible = ref(false)

const nodeConfig = useStorage<NodeConfigSchema[]>('node-config', [])

const nodeStatus = useStorage<StatusInfo[]>('node-status', [])

useIntervalFn(() => {
  now.value = Date.now()
  nodeConfig.value.forEach(async (item, index) => {
    const { host, port, https, token } = item
    const response = await fetch(
      `${https ? 'https' : 'http'}://${host}:${port}/api/v1/dashboard/base/all/all`,
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
      const data = result.data as BaseInfo
      if (!data) return
      if (nodeStatus.value[index]) {
        const netBytesSentSpeed =
          data.currentInfo.netBytesSent - nodeStatus.value[index].currentInfo.netBytesSent
        const netBytesRecvSpeed =
          data.currentInfo.netBytesRecv - nodeStatus.value[index].currentInfo.netBytesRecv
        nodeStatus.value[index] = {
          netBytesSentSpeed,
          netBytesRecvSpeed,
          ...data,
        }
      } else {
        nodeStatus.value[index] = { ...data }
      }
    }
  })
}, 1000)

const { t } = useI18n()

const columns = computed<TableColumn<NodeStatusRow>[]>(() => {
  return [
    {
      id: 'status',
      header: t('label.status'),
    },
    {
      accessorKey: 'name',
      header: t('label.node-name'),
    },
    {
      accessorKey: 'host',
      header: t('label.ip-addr'),
    },
    {
      id: 'uptime',
      header: t('label.uptime'),
      accessorFn: (row) => row.currentInfo?.uptime,
    },
    {
      id: 'load',
      header: t('label.load'),
      accessorFn: (row) => row.currentInfo?.load1,
    },
    {
      id: 'network',
      header: t('label.network'),
    },
    {
      id: 'traffic',
      header: t('label.traffic'),
    },
    {
      id: 'cpu',
      header: t('label.cpu'),
    },
    {
      id: 'memory',
      header: t('label.memory'),
    },
    {
      id: 'disk',
      header: t('label.disk'),
    },
    {
      id: 'action',
      header: '',
    },
  ]
})

const nodeStatusData = computed(() =>
  nodeConfig.value.map((item, index) => ({
    ...item,
    ...nodeStatus.value[index],
  })),
)
</script>

<template>
  <header class="flex flex-col gap-4 h-64 justify-center items-center select-none cursor-pointer">
    <Logo class="w-64" />

    <UButton :label="$t('label.create-node')" @click="visible = true" />

    <div class="flex gap-2">
      <CommonSetLocale />
      <UColorModeButton />
      <CommonGithub />
    </div>

    <CommonNodeConfig v-model="visible" />
  </header>
  <main class="mx-auto px-4 sm:px-6 lg:px-8 max-w-fit gap-16 sm:gap-y-24 flex flex-col">
    <UTable
      :columns="columns"
      :data="nodeStatusData"
      :ui="{
        th: 'whitespace-nowrap',
      }"
    >
      <template #status-cell="{ row }">
        <template v-if="dayjs(now).diff(row.original.currentInfo?.shotTime, 'second') > 10">
          <UBadge color="error" variant="subtle" :label="$t('label.offline')" />
        </template>
        <template v-else>
          <UBadge color="primary" variant="subtle" :label="$t('label.online')" />
        </template>
      </template>

      <template #uptime-cell="{ row }">
        {{ dayjs.duration(row.original.currentInfo?.uptime ?? 0, 'second').humanize() }}
      </template>

      <template #load-cell="{ row }">
        {{
          `${row.original.currentInfo?.load1} | ${row.original.currentInfo?.load5} | ${row.original.currentInfo?.load15}`
        }}
      </template>

      <template #network-cell="{ row }">
        <div class="flex items-center gap-1 mb-1">
          <UIcon name="i-mdi-download" />
          <span>{{ computeSizeFromByte(row.original.netBytesRecvSpeed ?? 0) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <UIcon name="i-mdi-upload" />
          <span>{{ computeSizeFromByte(row.original.netBytesSentSpeed ?? 0) }}</span>
        </div>
      </template>

      <template #traffic-cell="{ row }">
        <div class="flex items-center gap-1 mb-1">
          <UIcon name="i-mdi-download" />
          <span>{{ computeSize(row.original.currentInfo?.netBytesRecv ?? 0) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <UIcon name="i-mdi-upload" />
          <span>{{ computeSize(row.original.currentInfo?.netBytesSent ?? 0) }}</span>
        </div>
      </template>

      <template #cpu-cell="{ row }">
        <UProgress size="2xl" :model-value="row.original.currentInfo?.cpuUsedPercent" />
      </template>

      <template #memory-cell="{ row }">
        <UProgress size="2xl" :model-value="row.original.currentInfo?.memoryUsedPercent" />
      </template>

      <template #disk-cell="{ row }">
        <UProgress size="2xl" :model-value="row.original.currentInfo?.diskData?.[0]?.usedPercent" />
      </template>

      <template #action-cell>
        <div class="flex gap-2">
          <UButton :label="$t('button.enter-panel')" />
          <UButton :label="$t('button.edit')" />
          <UButton :label="$t('button.delete')" />
        </div>
      </template>
    </UTable>
  </main>
</template>
