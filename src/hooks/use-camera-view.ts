import { useState, useCallback, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { logger } from '@/lib/logger'

/**
 * Hook wrapping `capacitor-camera-view` for the Unified Smart Camera.
 * Provides camera start/stop, photo capture, and barcode detection.
 * Falls back gracefully on web (no camera feed, but barcode detection may work via Barcode Detection API).
 */
export function useCameraView() {
  const [isRunning, setIsRunning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastBarcode, setLastBarcode] = useState<{ value: string; type: string } | null>(null)
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null)

  const isNative = Capacitor.isNativePlatform()

  /**
   * Check camera permissions
   */
  const checkPermissions = useCallback(async () => {
    if (!isNative) {
      setHasPermission(true) // Web doesn't need native permission
      return true
    }

    try {
      const { CameraView } = await import('capacitor-camera-view')
      const result = await CameraView.checkPermissions()
      const granted = result.camera === 'granted'
      setHasPermission(granted)
      return granted
    } catch {
      setHasPermission(false)
      return false
    }
  }, [isNative])

  /**
   * Request camera permissions
   */
  const requestPermissions = useCallback(async () => {
    if (!isNative) {
      setHasPermission(true)
      return true
    }

    try {
      const { CameraView } = await import('capacitor-camera-view')
      const result = await CameraView.requestPermissions()
      const granted = result.camera === 'granted'
      setHasPermission(granted)
      return granted
    } catch {
      setHasPermission(false)
      return false
    }
  }, [isNative])

  /**
   * Start the camera with barcode detection enabled
   */
  const startCamera = useCallback(async () => {
    if (!isNative) {
      setIsRunning(false)
      return false
    }

    try {
      const { CameraView } = await import('capacitor-camera-view')

      // Ensure permissions
      const granted = await requestPermissions()
      if (!granted) return false

      // Listen for barcodes
      listenerRef.current = await CameraView.addListener('barcodeDetected', (data) => {
        setLastBarcode({ value: data.value, type: data.type })
      })

      // Start camera with barcode detection
      await CameraView.start({ enableBarcodeDetection: true })
      setIsRunning(true)

      // Make webview transparent so camera shows behind
      document.body.classList.add('camera-running')

      return true
    } catch (error) {
      logger.error('Failed to start camera:', error)
      setIsRunning(false)
      return false
    }
  }, [isNative, requestPermissions])

  /**
   * Stop the camera
   */
  const stopCamera = useCallback(async () => {
    if (!isNative) return

    try {
      const { CameraView } = await import('capacitor-camera-view')

      // Remove webview transparency
      document.body.classList.remove('camera-running')

      // Remove barcode listener
      if (listenerRef.current) {
        await listenerRef.current.remove()
        listenerRef.current = null
      }

      await CameraView.stop()
      setIsRunning(false)
    } catch (error) {
      logger.error('Failed to stop camera:', error)
    }
  }, [isNative])

  /**
   * Capture a photo from the live camera feed.
   * Returns a File object ready for upload.
   */
  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!isNative || !isRunning) return null

    try {
      const { CameraView } = await import('capacitor-camera-view')
      const result = await CameraView.capture({ quality: 90 })

      if (!result.photo) return null

      // Convert base64 to File
      const base64 = result.photo
      const byteString = atob(base64)
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: 'image/jpeg' })
      return new File([blob], 'capture.jpg', { type: 'image/jpeg' })
    } catch (error) {
      logger.error('Failed to capture photo:', error)
      return null
    }
  }, [isNative, isRunning])

  /**
   * Clear the last detected barcode
   */
  const clearBarcode = useCallback(() => {
    setLastBarcode(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRunning) {
        // Fire-and-forget cleanup
        import('capacitor-camera-view').then(({ CameraView }) => {
          document.body.classList.remove('camera-running')
          CameraView.stop().catch(() => {})
        }).catch(() => {})
      }
      if (listenerRef.current) {
        listenerRef.current.remove().catch(() => {})
      }
    }
  }, [isRunning])

  return {
    isNative,
    isRunning,
    hasPermission,
    lastBarcode,
    checkPermissions,
    requestPermissions,
    startCamera,
    stopCamera,
    capturePhoto,
    clearBarcode,
  }
}
