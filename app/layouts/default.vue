<script setup lang="ts">
const { t } = useI18n()

const links = computed(() => {
  return [
    {
      label: t('label.dashboard'),
      icon: 'i-tabler-dashboard',
      to: '/dashboard',
      draggable: true,
    },
    {
      label: t('label.website'),
      icon: 'tabler:world-www',
    },
    {
      label: t('label.database'),
      icon: 'tabler:database',
    },
    {
      label: t('label.docker'),
      icon: 'tabler:brand-docker',
    },
    {
      label: t('label.monitor'),
      icon: 'material-symbols:monitoring',
    },
    {
      label: t('label.firewall'),
      icon: 'hugeicons:firewall',
    },
    {
      label: t('label.waf'),
      icon: 'tabler:shield-bolt',
    },
    {
      label: t('label.files'),
      icon: 'tabler:folder',
    },
    {
      label: t('label.logs'),
      icon: 'material-symbols:analytics-outline',
    },
    {
      label: t('label.terminal'),
      icon: 'material-symbols:terminal',
    },
    {
      label: t('label.cronjob'),
      icon: 'material-symbols:alarm-on-outline',
    },
    {
      label: t('label.appstore'),
      icon: 'tabler:apps',
    },
    {
      label: t('label.settings'),
      icon: 'tabler:settings',
    },
  ]
})
</script>

<template>
  <UDashboardLayout>
    <UDashboardPanel
      :width="200"
      :resizable="{ min: 200, max: 300 }"
      collapsible
    >
      <UDashboardNavbar :ui="{ left: 'items-center' }">
        <template #left>
          <Logo class="h-16 p-2" />
        </template>
      </UDashboardNavbar>
      <UDashboardSidebar>
        <UDashboardSidebarLinks
          :ui="{
            base: 'py-2 before:inset-0 mt-2',
          }"
          :links="links"
        />
      </UDashboardSidebar>
    </UDashboardPanel>
    <UDashboardPage>
      <UDashboardPanel grow>
        <UDashboardNavbar>
          <template #right>
            <div class="flex gap-2">
              <CommonSetLocale />
              <UColorModeButton />
              <CommonGithub />
            </div>
          </template>
        </UDashboardNavbar>
        <UDashboardPanelContent>
          <slot />
        </UDashboardPanelContent>
      </UDashboardPanel>
    </UDashboardPage>
  </UDashboardLayout>
</template>
