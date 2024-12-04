import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    react(),
    mkcert(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'logo512.png'
      ],
      
      manifest: {
        short_name: "ES",
        name: "Extravagant Style",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon"
          },
          {
            src: "/android-chrome-192x192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "maskable any"
          },
          {
            src: "/android-chrome-512x512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any"
          }
        ],
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
        description: "Tu tienda de calzado exclusivo",
        screenshots: [
          {
            src: "/screenshot1.png",
            type: "image/png",
            sizes: "540x720",
            form_factor: "narrow"
          },
          {
            src: "/screenshot2.png",
            type: "image/png",
            sizes: "720x540",
            form_factor: "wide"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,  
        clientsClaim: true, 
        navigationPreload: true,
        disableDevLogs: true,
        runtimeCaching: [

          {
            urlPattern: ({ url }) => {
              return url.pathname.startsWith('/api/connectivity/status');
            },
            handler: 'NetworkOnly', 
            options: {
              backgroundSync: {
                name: 'connectivity-queue'
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              return url.pathname.startsWith('/api/subscribe');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'push-notifications',
              networkTimeoutSeconds: 5,
              backgroundSync: {
                name: 'push-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              
              return url.pathname.startsWith('confirmacion/:orderId') ||
                     url.pathname.startsWith('/store') ||
                     url.pathname.startsWith('/checkout');
                     
            },


            
            handler: 'NetworkFirst',
            options: {
              cacheName: 'critical-routes',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              return url.pathname.startsWith('/carro') ||
                     url.pathname.startsWith('/api') ||
                     url.href.includes('localhost:3000');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              backgroundSync: {
                name: 'apiQueue',
                options: {
                  maxRetentionTime: 24 * 60 
                }
              }
            }
          },
          {
            urlPattern: /\.(js|css|png|jpg|jpeg|svg|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 24 * 60 * 60 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^http:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-font-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 7 * 24 * 60 * 60 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true,
        disableDevLogs: true
      }
    })
  ],
  resolve: { 
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        https: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://extravagant-style.vercel.app/');
          });
        }
      }
    },
    cors: {
      origin: ['https://extravagant-back-1.onrender.com', 'https://extravagant-style.vercel.app/'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-time'],
      credentials: true
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
