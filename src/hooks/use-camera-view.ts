import { useState, useCallback, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { logger } from '@/lib/logger'

/**
 * Hook wrapping `capacitor-camera-view` for the Unified Smart Camera.
 * Provides camera start/stop, photo capture, and barcode detection.
 * Falls back gracefully on web (no camera feed, but barcode detection may work via Barcode Detection API).
 *
 * Camera lifecycle guards prevent concurrent start/stop calls and double-stop,
 * which cause iOS `FigCaptureSourceRemote` errors on re-open.
 */
export function useCameraView() {
  const [isRunning, setIsRunning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastBarcode, setLastBarcode] = useState<{ value: string; type: string } | null>(null)
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null)

  // Guards against concurrent start/stop and double-stop
  const runningRef = useRef(false)
  const pendingStopRef = useRef<Promise<void> | null>(null)

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
   * Start the camera with barcode detection enabled.
   * Waits for any pending stop to complete before starting.
   */
  const startCamera = useCallback(async () => {
    if (!isNative) {
      setIsRunning(false)
      return false
    }

    // Already running
    if (runningRef.current) return true

    // Wait for pending stop to fully complete before re-starting
    if (pendingStopRef.current) {
      await pendingStopRef.current
      pendingStopRef.current = null
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
      runningRef.current = true
      setIsRunning(true)

      // Make webview transparent so camera shows behind
      document.body.classList.add('camera-running')

      return true
    } catch (error) {
      logger.error('Failed to start camera:', error)
      runningRef.current = false
      setIsRunning(false)
      return false
    }
  }, [isNative, requestPermissions])

  /**
   * Stop the camera. Guarded against double-stop (no-ops if not running).
   * Stores a pending promise so startCamera can wait for it.
   */
  const stopCamera = useCallback(async () => {
    if (!isNative) return

    // Already stopped or stopping — no-op
    if (!runningRef.current) {
      // If there's a pending stop, wait for it
      if (pendingStopRef.current) await pendingStopRef.current
      return
    }

    // Mark as not running immediately to prevent double-stop
    runningRef.current = false

    const doStop = async () => {
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
        setIsRunning(false)
      }
    }

    pendingStopRef.current = doStop()
    await pendingStopRef.current
    pendingStopRef.current = null
  }, [isNative])

  /**
   * Capture a photo from the live camera feed.
   * Returns a File object ready for upload.
   */
  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!isNative || !runningRef.current) return null

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
  }, [isNative])

  /**
   * Clear the last detected barcode
   */
  const clearBarcode = useCallback(() => {
    setLastBarcode(null)
  }, [])

  // Cleanup on unmount — uses refs so closure is always fresh
  useEffect(() => {
    return () => {
      if (runningRef.current) {
        runningRef.current = false
        // Fire-and-forget cleanup
        import('capacitor-camera-view').then(({ CameraView }) => {
          document.body.classList.remove('camera-running')
          CameraView.stop().catch(() => {})
        }).catch(() => {})
      }
      if (listenerRef.current) {
        listenerRef.current.remove().catch(() => {})
        listenerRef.current = null
      }
    }
  }, []) // Empty deps — refs don't need re-subscription

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
