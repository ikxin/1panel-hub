import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    {
      name: 'nuxt',
      specifier: '@nuxt/eslint-plugin',
    },
  ],
  overrides: [
    {
      files: ['nuxt.config.ts'],
      rules: {
        'nuxt/nuxt-config-keys-order': 'error',
      },
    },
  ],
})
