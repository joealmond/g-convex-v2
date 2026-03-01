import { useRef, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/hooks/use-translation'
import { isNative } from '@/lib/platform'
import { SmartCamera } from './SmartCamera'

interface BackScanStepProps {
  /** Called when user captures a back photo */
  onPhotoCapture: (file: File) => void
  /** Called when user skips */
  onSkip: () => void
  /** Whether AI is currently analyzing */
  isAnalyzing: boolean
  /** Analysis result or null */
  analysisResult: {
    ingredientsText: string
    confidence: string
  } | null
  /** Error message from analysis */
  analysisError: string | null
  /** Called to proceed after analysis completes (or on error, to continue anyway) */
  onProceed: () => void
}

/**
 * Wizard step for scanning the back of a product package.
 * Captures the ingredients label photo for AI OCR analysis.
 */
export function BackScanStep({
  onPhotoCapture,
  onSkip,
  isAnalyzing,
  analysisResult,
  analysisError,
  onProceed,
}: BackScanStepProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCamera, setShowCamera] = useState(false)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onPhotoCapture(file)
    }
  }, [onPhotoCapture])

  // If analysis is done (success or error), show result
  if (analysisResult || analysisError) {
    return (
      <div className="space-y-4 py-4">
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-safety-high">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-sm">{t('imageUpload.ingredientsFound')}</span>
              {analysisResult.confidence && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {t('imageUpload.confidence')}: {analysisResult.confidence}
                </span>
              )}
            </div>
            <div className="bg-muted rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {analysisResult.ingredientsText}
              </p>
            </div>
          </motion.div>
        )}

        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('imageUpload.couldNotReadIngredients')}</p>
              <p className="text-xs opacity-80">{analysisError}</p>
            </div>
          </motion.div>
        )}

        <Button className="w-full" onClick={onProceed}>
          {t('common.continue')}
        </Button>
      </div>
    )
  }

  // If analyzing, show loading
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">📋</span>
        </div>
        <div className="text-center space-y-1">
          <p className="font-medium text-sm">{t('imageUpload.analyzingIngredients')}</p>
          <p className="text-xs text-muted-foreground">{t('imageUpload.ocrHint')}</p>
        </div>
      </div>
    )
  }

  // Native: show SmartCamera
  if (showCamera && isNative()) {
    return (
      <SmartCamera
        mode="photo-only"
        onBarcodeScan={() => {}}
        onPhotoCapture={(file) => {
          setShowCamera(false)
          onPhotoCapture(file)
        }}
        onCancel={() => setShowCamera(false)}
      />
    )
  }

  // Default: capture options
  return (
    <div className="space-y-4 py-2">
      <div className="text-center space-y-2">
        <div className="text-4xl">📋</div>
        <p className="text-sm text-muted-foreground">
          {t('imageUpload.scanBackDescription')}
        </p>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {isNative() ? (
            <Button
              className="w-full gap-2"
              onClick={() => setShowCamera(true)}
            >
              <Camera className="h-4 w-4" />
              {t('imageUpload.takeBackPhoto')}
            </Button>
          ) : (
            <>
              <Button
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {t('imageUpload.uploadBackPhoto')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </>
          )}

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
            {t('imageUpload.skipBackScan')}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
