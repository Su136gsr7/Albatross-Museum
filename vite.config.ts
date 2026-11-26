import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'models/*.glb'],
      manifest: {
        name: 'Our Little Universe — Munna & Azhagi',
        short_name: 'Our Little Universe',
        description: 'A private 3D virtual memory museum created for Munna & Azhagi.',
        theme_color: '#1b1410',
        background_color: '#140f0c',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp}'],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1800,
  },
});
