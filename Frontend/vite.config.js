import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Backend (isu_infirmary_backend) runs on :8000 — proxy so the frontend
    // can call same-origin `/api/...` in dev without fighting CORS.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
