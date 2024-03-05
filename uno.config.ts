import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]s||[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/],
    },
  },
  presets: [presetAttributify(), presetUno(), presetIcons()],
  transformers: [transformerDirectives()],
})
