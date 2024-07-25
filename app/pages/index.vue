<script lang="ts" setup>
const visible = ref(false)
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
    <CommonClientModal v-model="visible" />

    <CommonSetLocale />
  </header>
  <main
    class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl gap-16 sm:gap-y-24 flex flex-col"
  >
    <UTable />
  </main>
</template>
