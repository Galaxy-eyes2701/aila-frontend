import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@routing': path.resolve(__dirname, './src/routing'),
      '@state': path.resolve(__dirname, './src/state'),
      '@services': path.resolve(__dirname, './src/services'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
    },
  },
})
