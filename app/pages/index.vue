<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { fetch } from '@tauri-apps/plugin-http'
import type { Schema as NodeConfigSchema } from '~/components/common/node-config.vue'
import type { BaseInfo } from '~/types/dashboard'
import { computeSize, computeSizeFromByte } from '#imports'

interface StatusInfo extends BaseInfo {
  netBytesSentSpeed?: number
  netBytesRecvSpeed?: number
}

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
      const data = result.data as BaseInfo
      if (!data) return
      if (nodeStatus.value[index]) {
        const netBytesSentSpeed =
          data.currentInfo.netBytesSent -
          nodeStatus.value[index].currentInfo.netBytesSent
        const netBytesRecvSpeed =
          data.currentInfo.netBytesRecv -
          nodeStatus.value[index].currentInfo.netBytesRecv
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

const columns = computed(() => {
  return [
    {
      key: 'status',
      label: t('label.status'),
    },
    {
      key: 'name',
      label: t('label.node-name'),
    },
    {
      key: 'host',
      label: t('label.ip-addr'),
    },
    {
      key: 'currentInfo.uptime',
      label: t('label.uptime'),
    },
    {
      key: 'load',
      label: t('label.load'),
    },
    {
      key: 'network',
      label: t('label.network'),
    },
    {
      key: 'traffic',
      label: t('label.traffic'),
    },
    {
      key: 'cpu',
      label: t('label.cpu'),
    },
    {
      key: 'memory',
      label: t('label.memory'),
    },
    {
      key: 'disk',
      label: t('label.disk'),
    },
    {
      key: 'action',
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
  <header
    class="flex flex-col gap-4 h-64 justify-center items-center select-none cursor-pointer"
  >
    <Logo />

    <UButton
      :label="$t('label.create-node')"
      @click="visible = true"
    />

    <div class="flex gap-2">
      <CommonSetLocale />
      <UColorModeButton />
      <CommonGithub />
    </div>

    <CommonNodeConfig v-model="visible" />
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
      <template #status-data="{ row }: { row: StatusInfo }">
        <template
          v-if="dayjs(row.currentInfo?.shotTime).diff(now, 'second') < 0"
        >
          <UBadge
            color="red"
            :label="$t('label.offline')"
          />
        </template>
        <template v-else>
          <UBadge
            color="primary"
            :label="$t('label.online')"
          />
        </template>
      </template>

      <template #load-data="{ row }: { row: StatusInfo }">
        {{
          `${row.currentInfo?.load1} | ${row.currentInfo?.load5} | ${row.currentInfo?.load15}`
        }}
      </template>

      <template #network-data="{ row }: { row: StatusInfo }">
        <div class="flex items-center gap-1 mb-1">
          <UIcon name="i-mdi-download" />
          <span>{{ computeSizeFromByte(row.netBytesRecvSpeed!) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <UIcon name="i-mdi-upload" />
          <span>{{ computeSizeFromByte(row.netBytesSentSpeed!) }}</span>
        </div>
      </template>

      <template #traffic-data="{ row }: { row: StatusInfo }">
        <div class="flex items-center gap-1 mb-1">
          <UIcon name="i-mdi-download" />
          <span>{{ computeSize(row.currentInfo?.netBytesRecv) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <UIcon name="i-mdi-upload" />
          <span>{{ computeSize(row.currentInfo?.netBytesSent) }}</span>
        </div>
      </template>

      <template #cpu-data="{ row }: { row: StatusInfo }">
        <UProgress
          size="2xl"
          :indicator="true"
          :value="row.currentInfo?.cpuUsedPercent"
        />
      </template>

      <template #memory-data="{ row }: { row: StatusInfo }">
        <UProgress
          size="2xl"
          :indicator="true"
          :value="row.currentInfo?.memoryUsedPercent"
        />
      </template>

      <template #disk-data="{ row }: { row: StatusInfo }">
        <UProgress
          size="2xl"
          :indicator="true"
          :value="row.currentInfo?.diskData?.[0]?.usedPercent"
        />
      </template>

      <template #action-data>
        <div class="flex gap-2">
          <UButton :label="$t('button.enter-panel')" />
          <UButton :label="$t('button.edit')" />
          <UButton :label="$t('button.delete')" />
        </div>
      </template>
    </UTable>
  </main>
</template>
