<template>
  <div class="logo">
    <span>1Panel</span>
    <span>Hub</span>
  </div>
</template>

<style scoped>
.logo {
  @apply text-4xl font-extrabold p-5 rounded-lg;
}

.logo span:first-child {
  @apply text-gray-700 dark:text-white mr-2;
}

.logo span:last-child {
  @apply text-white dark:text-gray-900 bg-[#ff9902] py-1 px-2 rounded-md;
}
</style>
