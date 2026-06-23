import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Expense Tracker',
        short_name: 'ExpenseTracker',
        description: 'Personal expense and bill tracker',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/ExpenseTracker/',
        icons: [
          { src: '/ExpenseTracker/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/ExpenseTracker/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  base: '/ExpenseTracker/',
})
