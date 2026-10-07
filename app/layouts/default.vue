<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()

const links = computed<NavigationMenuItem[]>(() => {
  return [
    {
      label: t('label.dashboard'),
      icon: 'i-tabler-dashboard',
      to: '/dashboard',
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
  <UDashboardGroup unit="px">
    <UDashboardSidebar resizable collapsible :min-size="200" :max-size="300" :default-size="200">
      <template #header>
        <Logo class="h-16 p-2" />
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu :items="links" :collapsed="collapsed" orientation="vertical" />
      </template>
    </UDashboardSidebar>
    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #right>
            <div class="flex gap-2">
              <CommonSetLocale />
              <UColorModeButton />
              <CommonGithub />
            </div>
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
