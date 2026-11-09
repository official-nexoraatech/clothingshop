import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendUrl = (process.env.VITE_API_URL || '').trim()
if (process.env.NODE_ENV === 'production' && backendUrl && !/^https:\/\//i.test(backendUrl)) {
  throw new Error('Set VITE_API_URL to the HTTPS backend origin before building the production frontend.')
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
})

