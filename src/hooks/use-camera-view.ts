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
  // Cancellation flag: set to true on unmount so an in-flight startCamera aborts
  const cancelledRef = useRef(false)

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

    // If cancelled (component unmounted), don't start
    if (cancelledRef.current) return false

    // Wait for pending stop to fully complete before re-starting
    if (pendingStopRef.current) {
      await pendingStopRef.current
      pendingStopRef.current = null
    }

    try {
      const { CameraView } = await import('capacitor-camera-view')

      // Check cancellation after each async gap
      if (cancelledRef.current) return false

      // Ensure permissions
      const granted = await requestPermissions()
      if (!granted || cancelledRef.current) return false

      // Listen for barcodes
      listenerRef.current = await CameraView.addListener('barcodeDetected', (data) => {
        setLastBarcode({ value: data.value, type: data.type })
      })

      // Final cancellation check before the expensive native start
      if (cancelledRef.current) {
        // Cleanup the listener we just added
        await listenerRef.current.remove().catch(() => {})
        listenerRef.current = null
        return false
      }

      // Start camera with barcode detection
      await CameraView.start({ enableBarcodeDetection: true })

      // If cancelled during start, immediately stop
      if (cancelledRef.current) {
        await CameraView.stop().catch(() => {})
        if (listenerRef.current) {
          await listenerRef.current.remove().catch(() => {})
          listenerRef.current = null
        }
        return false
      }

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
        // The plugin's stopSession completion fires BEFORE the main-thread
        // UIKit cleanup (removeFromSuperlayer, webView.isOpaque = true).
        // Wait a tick so the native preview layer is fully removed before
        // we proceed with DOM changes.
        await new Promise((r) => setTimeout(r, 120))
        setIsRunning(false)
      } catch (error) {
        logger.error('Failed to stop camera:', error)
        // Even on error, wait for native cleanup attempt
        await new Promise((r) => setTimeout(r, 120))
        setIsRunning(false)
      }
    }

    pendingStopRef.current = doStop()
    await pendingStopRef.current
    pendingStopRef.current = null
  }, [isNative])

  /**
   * Capture a photo from the live camera feed.
   * Uses captureSample() which grabs a frame from the video stream
   * without triggering the hardware photo pipeline — safe to call
   * while preview + barcode detection are active.
   * Returns a File object ready for upload.
   */
  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!isNative || !runningRef.current) return null

    try {
      const { CameraView } = await import('capacitor-camera-view')
      const result = await CameraView.captureSample({ quality: 90 })

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

  // Cleanup on unmount — set cancellation flag so any in-flight startCamera
  // aborts, then stop if running.
  useEffect(() => {
    cancelledRef.current = false // reset on mount
    return () => {
      cancelledRef.current = true // cancel any in-flight startCamera
      if (runningRef.current) {
        runningRef.current = false
        // Fire-and-forget cleanup
        import('capacitor-camera-view').then(({ CameraView }) => {
          document.body.classList.remove('camera-running')
          document.body.classList.remove('camera-starting')
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
