<script lang="ts" setup></script>

<template>
  <ALayout class="h-full">
    <LayoutNavBar />
    <ALayout>
      <LayoutSideBar />
      <ALayoutContent class="p-4">
        <RouterView />
      </ALayoutContent>
    </ALayout>
  </ALayout>
</template>
