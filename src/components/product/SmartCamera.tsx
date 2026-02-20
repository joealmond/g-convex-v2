import { useState, useCallback, useEffect, useRef } from 'react'
import { useCameraView } from '@/hooks/use-camera-view'
import { useHaptics } from '@/hooks/use-haptics'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, X, ScanBarcode, Upload, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface SmartCameraProps {
  onBarcodeScan: (barcode: string) => void
  onPhotoCapture: (file: File) => void
  onCancel: () => void
}

/**
 * Unified Smart Camera component.
 * 
 * **Native**: Full-screen camera overlay with:
 * - Live barcode auto-detection in background (green flash + haptic on detect)
 * - Shutter button for manual photo capture (for AI analysis)
 * 
 * **Web**: File picker + manual barcode text input
 */
export function SmartCamera({ onBarcodeScan, onPhotoCapture, onCancel }: SmartCameraProps) {
  const { isNative, isRunning, startCamera, stopCamera, capturePhoto, lastBarcode, clearBarcode } = useCameraView()
  const { notification: hapticNotification } = useHaptics()
  const { t } = useTranslation()

  const [isCapturing, setIsCapturing] = useState(false)
  const [barcodeFlash, setBarcodeFlash] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-start camera on native
  useEffect(() => {
    if (isNative) {
      startCamera()
    }
    return () => {
      if (isNative) {
        stopCamera()
      }
    }
  }, [isNative, startCamera, stopCamera])

  // Handle barcode detection (native auto-scan)
  useEffect(() => {
    if (lastBarcode && lastBarcode.value) {
      // Visual feedback: green flash
      setBarcodeFlash(true)
      setTimeout(() => setBarcodeFlash(false), 600)

      // Haptic feedback
      hapticNotification('success')

      // Stop camera and emit barcode
      stopCamera().then(() => {
        onBarcodeScan(lastBarcode.value)
      })

      clearBarcode()
    }
  }, [lastBarcode, hapticNotification, stopCamera, onBarcodeScan, clearBarcode])

  /**
   * Handle shutter button press — capture photo for AI analysis
   */
  const handleShutterPress = useCallback(async () => {
    setIsCapturing(true)
    try {
      const file = await capturePhoto()
      if (file) {
        await stopCamera()
        onPhotoCapture(file)
      }
    } catch (error) {
      logger.error('Capture failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [capturePhoto, stopCamera, onPhotoCapture])

  /**
   * Handle file picker selection (web)
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onPhotoCapture(file)
    }
  }, [onPhotoCapture])

  /**
   * Handle manual barcode submission (web)
   */
  const handleManualBarcodeSubmit = useCallback(() => {
    const trimmed = manualBarcode.trim()
    if (trimmed.length >= 4) {
      onBarcodeScan(trimmed)
    }
  }, [manualBarcode, onBarcodeScan])

  // ─── Native Camera Overlay ───
  if (isNative) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Barcode flash overlay */}
        <AnimatePresence>
          {barcodeFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 bg-green-400"
            />
          )}
        </AnimatePresence>

        {/* Camera overlay UI (transparent background — camera shows behind WebView) */}
        <div className="absolute inset-0 z-20 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-safe-top pb-2 bg-black/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { stopCamera(); onCancel() }}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <ScanBarcode className="h-5 w-5 text-green-400" />
              <span className="text-white text-sm font-medium">
                {t('smartCamera.scanning')}
              </span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Viewfinder area */}
          <div className="flex-1 relative">
            {/* Viewfinder border */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-2xl border-2 border-white/50">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="px-4 pb-safe-bottom pt-4 bg-black/60">
            <p className="text-center text-white/70 text-xs mb-4">
              {t('smartCamera.hint')}
            </p>

            <div className="flex items-center justify-center gap-8 pb-4">
              {/* Shutter button */}
              <button
                onClick={handleShutterPress}
                disabled={isCapturing || !isRunning}
                className={cn(
                  'w-20 h-20 rounded-full border-4 border-white flex items-center justify-center',
                  'transition-all active:scale-90',
                  isCapturing ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                )}
              >
                {isCapturing ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Web Fallback ───
  return (
    <div className="space-y-6">
      {/* Photo upload */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          {t('smartCamera.takePhoto')}
        </h3>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer',
            'hover:border-primary/50 hover:bg-primary/5 transition-colors'
          )}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('smartCamera.clickOrDrag')}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">
            {t('smartCamera.orBarcode')}
          </span>
        </div>
      </div>

      {/* Manual barcode entry */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <ScanBarcode className="h-4 w-4" />
          {t('smartCamera.enterBarcode')}
        </h3>
        <div className="flex gap-2">
          <Input
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="e.g. 3017624010701"
            inputMode="numeric"
            onKeyDown={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
          />
          <Button
            onClick={handleManualBarcodeSubmit}
            disabled={manualBarcode.trim().length < 4}
          >
            {t('smartCamera.lookup')}
          </Button>
        </div>
      </div>
    </div>
  )
}
