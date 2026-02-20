import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode: _mode }) => {
  const cloudflareEnv = process.env.CLOUDFLARE_ENV || 'preview'
  const isProduction = cloudflareEnv === 'production'

  return {
    define: {
      __APP_ENV__: JSON.stringify(cloudflareEnv),
    },
    plugins: [
      // Cloudflare plugin MUST be first
      cloudflare({
        viteEnvironment: { name: 'ssr' },
        configPath: './wrangler.jsonc',
      }),
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tanstackStart({
        srcDirectory: 'src',
        start: { entry: './start.tsx' },
        server: { entry: './server.ts' },
        // SPA Mode: generates a static /index.html shell for Capacitor (iOS/Android)
        // The SSR build for Cloudflare Workers is unaffected
        spa: {
          enabled: true,
          prerender: {
            outputPath: '/index.html',
          },
        },
      }),
      tailwindcss(),
      viteReact(),
    ],
    // SSR config for @convex-dev/better-auth
    ssr: {
      noExternal: ['@convex-dev/better-auth'],
    },
    server: {
      port: 3000,
    },
    build: {
      // Hidden source maps: generated for Sentry error reporting but not served to users.
      // When @sentry/vite-plugin is added, it will automatically upload these during build.
      sourcemap: 'hidden',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'tanstack-vendor': ['@tanstack/react-router', '@tanstack/react-query'],
            'convex-vendor': ['convex/react'],
            'recharts-vendor': ['recharts'],
            'leaflet-vendor': ['leaflet', 'react-leaflet'],
            'motion-vendor': ['framer-motion'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
