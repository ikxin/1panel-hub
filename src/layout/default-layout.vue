<script lang="ts" setup>
import NavBar from '@/layout/nav-bar.vue'
import SideBar from '@/layout/side-bar.vue'
</script>

<template>
  <ALayout class="h-full">
    <NavBar />
    <ALayout>
      <SideBar />
      <ALayoutContent class="p-4">
        <RouterView />
      </ALayoutContent>
    </ALayout>
  </ALayout>
</template>
