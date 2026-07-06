/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages가 /<repo>/ 서브패스로 서빙하므로 자산 경로에 base를 붙인다.
  base: '/lotto-number-generator/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
