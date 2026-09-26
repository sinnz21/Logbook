import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // The shareable demo build (`npm run build:demo`) uses relative asset paths so
  // it works wherever it's dropped — a domain root, a GitHub Pages subfolder, or
  // any static host. The normal build keeps absolute paths.
  base: mode === 'demo' ? './' : '/',

  plugins: [react()],
  server: {
    // Backend (isu_infirmary_backend) runs on :8000 — proxy so the frontend
    // can call same-origin `/api/...` in dev without fighting CORS.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
}))
