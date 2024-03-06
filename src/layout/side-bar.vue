<script lang="ts" setup>
const router = useRouter()
import { IconDashboard, IconHome } from '@arco-design/web-vue/es/icon'
</script>

<template>
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
</template>
