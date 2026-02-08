'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { type Product, getQuadrant, QUADRANTS } from '@/lib/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link } from '@tanstack/react-router'

// Fix for default marker icon issue in Leaflet with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ProductMapProps {
  products: Product[]
  center?: [number, number]
  zoom?: number
}

/**
 * Map component that displays products at their store locations
 * - Uses OpenStreetMap tiles
 * - Markers colored by product quadrant
 * - Popup shows product info
 */
export function ProductMap({ products, center = [47.497, 19.040], zoom = 12 }: ProductMapProps) {
  // Filter products that have at least one store with GPS coordinates
  const productsWithLocations = products.filter(
    (product) => product.stores && product.stores.some((store) => store.geoPoint)
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Recenter map when center prop changes */}
      <RecenterMap center={center} />

      {/* Render markers for each product's stores */}
      {productsWithLocations.map((product) =>
        product.stores
          ?.filter((store) => store.geoPoint)
          .map((store, index) => (
            <ProductMarker
              key={`${product._id}-${index}`}
              product={product}
              storeName={store.name}
              position={[store.geoPoint!.lat, store.geoPoint!.lng]}
            />
          ))
      )}
    </MapContainer>
  )
}

/**
 * Helper component to recenter map when center changes
 */
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

/**
 * Individual product marker with custom color based on quadrant
 */
function ProductMarker({
  product,
  storeName,
  position,
}: {
  product: Product
  storeName: string
  position: [number, number]
}) {
  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
  const quadrantInfo = QUADRANTS[quadrant]

  // Create custom colored marker icon
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${quadrantInfo?.color || '#7CB342'};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  return (
    <Marker position={position} icon={customIcon}>
      <Popup>
        <div className="min-w-[200px]">
          {/* Product Image */}
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-24 object-cover rounded mb-2"
            />
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-sm mb-2">{product.name}</h3>

          {/* Store Name */}
          <p className="text-xs text-color-text-secondary mb-2">
            📍 {storeName}
          </p>

          {/* Scoring Dots */}
          <div className="flex gap-2 mb-3">
            <div
              className={`w-2 h-2 rounded-full ${
                product.averageSafety >= 60
                  ? 'bg-color-safety-high'
                  : product.averageSafety >= 40
                    ? 'bg-color-safety-mid'
                    : 'bg-color-safety-low'
              }`}
              title={`Safety: ${product.averageSafety.toFixed(0)}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                product.averageTaste >= 60
                  ? 'bg-color-safety-high'
                  : product.averageTaste >= 40
                    ? 'bg-color-safety-mid'
                    : 'bg-color-safety-low'
              }`}
              title={`Taste: ${product.averageTaste.toFixed(0)}`}
            />
          </div>

          {/* View Link */}
          <Link
            to="/product/$name"
            params={{ name: product.name }}
            className="text-xs text-color-primary hover:underline font-semibold"
          >
            View Product →
          </Link>
        </div>
      </Popup>
    </Marker>
  )
}
