<script setup lang="ts">
const { t } = useI18n()

const router = useRouter()

const serverData = useStorage<any[]>('serverData', [])

const currentToken = useStorage<string>('currentToken', '')

const enterPanel = (token: string) => {
  currentToken.value = token
  router.push('/dashboard')
}
</script>

<template>
  <AScrollbar class="max-h-[calc(100vh-4rem)] overflow-auto">
    <div class="mx-auto grid grid-cols-1 lg:grid-cols-4 sm:grid-cols-2 gap-4 min-h-full max-w-6xl my-4 px-4">
      <AAlert v-if="serverData.length === 0" :title="t('title.prompt')" class="col-span-4">
        {{ t('alert.notAddedServer') }}
      </AAlert>
      <ACard v-else :title="item.name" v-for="item in serverData" :key="item.ip" size="medium">
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
