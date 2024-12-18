import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      exclude: ['fs', 'stream']
    }),
    vue(),
    vuetify(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      devOptions: {
        enabled: true, // Enables SW in development for testing
        type: 'module'
      },
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,html,wasm,data}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/command-os\.vercel\.app\/.*$/, // Match all routes
            handler: 'StaleWhileRevalidate', // Cache first, but revalidate in the background
            options: {
              cacheName: 'all-dynamic-routes', // Cache name for all dynamic routes
              expiration: {
                maxEntries: 100, // Cache up to 100 dynamic routes
                maxAgeSeconds: 24 * 60 * 60 // Cache for 1 day
              }
            }
          },

          {
            urlPattern: /\.wasm$/, // Cache WebAssembly files, e.g., pgLite
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 24 * 60 * 60 // Cache wasm for 1 day
              }
            }
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10000000
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'CommandOS',
        short_name: 'COS',
        description: 'CommandOS description',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '640x320',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Wonder Widgets'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  },
  worker: {
    format: 'es'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
