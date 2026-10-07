import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'react'],
  ignorePatterns: ['dist/**', 'src-tauri/target/**', 'src-tauri/gen/**'],
})
