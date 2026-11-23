import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' lets the build work on GitHub Pages (any sub-path) and as a static file.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
