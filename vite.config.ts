import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

// Read APP_VERSION from appTitles.ts so PWA manifest version stays in sync with builds
const appTitlesContent = readFileSync(path.resolve(__dirname, 'src/constants/appTitles.ts'), 'utf8');
const versionMatch = appTitlesContent.match(/export const APP_VERSION = '(.*?)';/);
const appVersion = versionMatch ? versionMatch[1] : '0.0.0';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'DORPTS - Department of Roads Performance Tracking',
          short_name: 'DORPTS',
          description: 'Department of Roads - Performance Tracking System',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0099DA',
          orientation: 'any',
          categories: ['business', 'government'],
          version: appVersion,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 10000000, // 10MB
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                }
              }
            },
            {
              // Critical API Endpoints for Indicator & Overall Weight Progress Stats
              urlPattern: /\/api\/(sheets|sheets-meta|indicators|stats|overall-progress|overview).*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'critical-api-stats-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Google Sheets published CSV feeds (Overall Weight Progress & Indicator stats)
              urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'indicator-overall-weight-csv-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            },
            {
              urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'map-tiles',
                expiration: {
                  maxEntries: 2000,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react'],
            'vendor-motion': ['motion/react'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
