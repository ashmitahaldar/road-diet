import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The lazy 3D chunk (three.js) is ~560 kB; it loads only after the first run, never on the start screen.
  build: { chunkSizeWarningLimit: 600 },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
})
