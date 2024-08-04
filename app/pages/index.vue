<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { fetch } from '@tauri-apps/plugin-http'
import type { Schema as NodeConfigSchema } from '~/components/common/node-config.vue'
import type { BaseInfo, CurrentInfo } from '~/types/dashboard'

const dayjs = useDayjs()

const now = ref(Date.now())

const visible = ref(false)

const nodeConfig = useStorage<NodeConfigSchema[]>('node-config', [])

const nodeStatus = useStorage<BaseInfo[]>('node-status', [])

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
      nodeStatus.value[index] = result.data?.currentInfo
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
      key: 'uptime',
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
      <template #status-data="{ row }: { row: CurrentInfo }">
        <template v-if="dayjs(row.shotTime).diff(now, 'second') < 0">
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

      <template #load-data="{ row }: { row: CurrentInfo }">
        {{ `${row.load1} | ${row.load5} | ${row.load15}` }}
      </template>

      <template #network-data="{ row }: { row: CurrentInfo }">
        {{
          `${computeSize(row.netBytesSent)} | ${computeSize(row.netBytesRecv)}`
        }}
      </template>

      <template #cpu-data="{ row }: { row: CurrentInfo }">
        <UProgress
          size="2xl"
          :indicator="true"
          :value="row.cpuUsedPercent"
        />
      </template>

      <template #memory-data="{ row }: { row: CurrentInfo }">
        <UProgress
          size="2xl"
          :indicator="true"
          :value="row.memoryUsedPercent"
        />
      </template>

      <template #disk-data="{ row }: { row: CurrentInfo }">
        <UProgress
          size="2xl"
          :indicator="true"
          :value="row.diskData?.[0]?.usedPercent"
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
