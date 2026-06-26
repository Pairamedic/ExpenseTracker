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
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Finance Manager',
        short_name: 'Finance',
        description: 'Track bills, income, debts and savings',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/ExpenseTracker/',
        icons: [
          { src: '/ExpenseTracker/app-icon.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  base: '/ExpenseTracker/',
})
