import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'depth-stepper': resolve(__dirname, '01-depth-stepper/index.html'),
        'linkedin-analytics': resolve(__dirname, '02-linkedin-analytics/index.html'),
      },
    },
  },
})
