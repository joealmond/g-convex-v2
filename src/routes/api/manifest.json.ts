import { createFileRoute } from '@tanstack/react-router'

/**
 * Dynamic manifest endpoint
 *
 * Serves a Web App Manifest with `display: "standalone"` for mobile/tablet
 * User-Agents and `display: "browser"` for desktop User-Agents.
 *
 * This lets mobile users get the full app-like PWA experience (no browser
 * chrome) while desktop users keep the standard browser view.
 */

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i

function buildManifest(isMobile: boolean) {
  return {
    name: 'G-Matrix',
    short_name: 'G-Matrix',
    description: 'Community-rated celiac-safe products',
    start_url: '/',
    display: isMobile ? 'standalone' : 'browser',
    background_color: '#FAF8F5',
    theme_color: '#7CB342',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile.png',
        type: 'image/png',
        sizes: '390x844',
        form_factor: 'narrow',
      },
      {
        src: '/screenshots/wide.png',
        type: 'image/png',
        sizes: '1280x800',
        form_factor: 'wide',
      },
    ],
    categories: ['food', 'health', 'lifestyle'],
    shortcuts: [
      {
        name: 'Add Product',
        short_name: 'Add',
        description: 'Add a new product',
        url: '/admin',
        icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
      },
    ],
  }
}

export const Route = createFileRoute('/api/manifest/json')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const ua = request.headers.get('user-agent') || ''
        const isMobile = MOBILE_UA.test(ua)
        const manifest = buildManifest(isMobile)

        return new Response(JSON.stringify(manifest, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=86400', // 24h cache
          },
        })
      },
    },
  },
})
