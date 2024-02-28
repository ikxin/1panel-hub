<script setup lang="ts">
import { IconPlus } from '@arco-design/web-vue/es/icon'
</script>

<template>
  <ALayoutHeader class="h-16 sticky top-0 bg-white border-b border-gray-200 shadow-md">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
      <div class="flex-1">
        <div class="h-8 w-32 rounded bg-slate-200 flex justify-center items-center">logo</div>
      </div>
      <div class="flex flex-1 items-center justify-end">
        <AButton size="small">
          <template #icon>
            <IconPlus />
          </template>
        </AButton>
      </div>
    </div>
  </ALayoutHeader>
  <div class="mx-auto flex min-h-full max-w-6xl my-4">
    <div class="h-400 w-full rounded mx-4 bg-slate-200"></div>
  </div>
</template>
