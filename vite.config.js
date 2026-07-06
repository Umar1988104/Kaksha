import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor needs assets to resolve with relative paths, hence base: './'
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173
  }
})
