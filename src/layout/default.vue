<script lang="ts" setup>
const router = useRouter()
import { IconDashboard, IconHome } from '@arco-design/web-vue/es/icon'

console.log(router.getRoutes())
</script>

<template>
  <ALayout class="h-full">
    <ALayoutSider>
      <AMenu>
        <AMenuItem>
          Dashboard
          <template #icon>
            <IconDashboard />
          </template>
        </AMenuItem>
        <AMenuItem @click="router.push('/')">
          Back Home
          <template #icon>
            <IconHome />
          </template>
        </AMenuItem>
      </AMenu>
    </ALayoutSider>
    <ALayout>
      <ALayoutHeader class="h-16 shadow-sm"></ALayoutHeader>
      <ALayoutContent class="p-4">
        <RouterView />
      </ALayoutContent>
    </ALayout>
  </ALayout>
</template>
