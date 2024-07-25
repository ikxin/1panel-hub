// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt().override('nuxt/rules', {
  rules: {
    'vue/no-multiple-template-root': 'off',
  },
})
