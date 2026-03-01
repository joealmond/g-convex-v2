import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ChevronRight, X, Check, RotateCcw, Upload } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useTranslation } from '@/hooks/use-translation'
import { useCameraView } from '@/hooks/use-camera-view'
import { cn } from '@/lib/utils'

/** Result returned to the parent when the wizard completes */
export interface CaptureResult {
  frontImage: File | null
  backImage: File | null
  barcodeImage: File | null
  detectedBarcode: string | null
}

type WizardStep = 1 | 2 | 3

interface CameraWizardProps {
  onComplete: (result: CaptureResult) => void
  onCancel: () => void
}

const STEP_CONFIG = [
  { step: 1 as const, titleKey: 'cameraWizard.step1Title', hintKey: 'cameraWizard.step1Hint', icon: '📦' },
  { step: 2 as const, titleKey: 'cameraWizard.step2Title', hintKey: 'cameraWizard.step2Hint', icon: '📋' },
  { step: 3 as const, titleKey: 'cameraWizard.step3Title', hintKey: 'cameraWizard.step3Hint', icon: '🔖' },
] as const

/**
 * CameraWizard: Guided 3‑step capture flow.
 *
 * Native (Capacitor): full‑screen camera overlay rendered via portal on
 * document.body (escapes Dialog's CSS transform containing block).
 * Camera stays open for all three steps. Barcode auto-detect is active
 * throughout — detecting a barcode auto-completes step 3.
 *
 * Web: sequential file‑upload panels with the same step indicator.
 */
export function CameraWizard({ onComplete, onCancel }: CameraWizardProps) {
  const { t } = useTranslation()
  const { isNative: isNativeCamera, lastBarcode, clearBarcode, startCamera, stopCamera, capturePhoto } = useCameraView()

  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [captures, setCaptures] = useState<{
    frontImage: File | null
    backImage: File | null
    barcodeImage: File | null
  }>({ frontImage: null, backImage: null, barcodeImage: null })
  const [previews, setPreviews] = useState<{
    front: string | null
    back: string | null
    barcode: string | null
  }>({ front: null, back: null, barcode: null })
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null)
  const [flashStep, setFlashStep] = useState<WizardStep | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  /** Finish the wizard — stop camera and deliver results */
  const finishWizard = useCallback(async () => {
    const barcodeValue = detectedBarcode || (manualBarcode.trim() || null)
    await stopCamera()
    document.body.classList.remove('camera-running')
    onComplete({
      ...captures,
      detectedBarcode: barcodeValue,
    })
  }, [captures, detectedBarcode, manualBarcode, stopCamera, onComplete])

  // Track barcode detection from camera across all steps
  useEffect(() => {
    if (lastBarcode && !detectedBarcode) {
      setDetectedBarcode(lastBarcode.value)
      clearBarcode()
    }
  }, [lastBarcode, detectedBarcode, clearBarcode])

  // When a barcode is detected and we're on step 3, auto-finish after brief delay
  useEffect(() => {
    if (!detectedBarcode) return
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        if (mountedRef.current) finishWizard()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [detectedBarcode, currentStep, finishWizard])

  // Start camera on mount (native only).
  // ImageUploadDialog already added camera-running, but we swap through
  // camera-starting (black screen) → camera-running (transparent for feed)
  // to give a smooth black transition instead of a white/cream flash.
  useEffect(() => {
    if (isNativeCamera) {
      // Phase 1: black screen while camera initialises
      document.body.classList.add('camera-starting')
      document.body.classList.remove('camera-running')

      const startAsync = async () => {
        if (!mountedRef.current) return
        const ok = await startCamera()
        if (!mountedRef.current) return
        // Phase 2: camera is running — go transparent so feed shows through
        document.body.classList.remove('camera-starting')
        if (ok) {
          document.body.classList.add('camera-running')
        }
      }

      // Tiny delay so the black screen renders first
      const timer = setTimeout(startAsync, 30)

      return () => {
        clearTimeout(timer)
        stopCamera()
        document.body.classList.remove('camera-running')
        document.body.classList.remove('camera-starting')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track mounted state + cleanup previews on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      Object.values(previews).forEach((url) => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Capture a photo on native and store it for the current step.
   * Uses captureSample() which grabs a video frame without disrupting
   * the running AVFoundation session. Camera stays running the entire
   * time — no stop/restart between captures.
   */
  const handleNativeCapture = useCallback(async () => {
    if (isCapturing) return
    setIsCapturing(true)
    try {
      const file = await capturePhoto()
      if (!file) return

      const previewUrl = URL.createObjectURL(file)

      if (currentStep === 1) {
        setCaptures((prev) => ({ ...prev, frontImage: file }))
        setPreviews((prev) => ({ ...prev, front: previewUrl }))
      } else if (currentStep === 2) {
        setCaptures((prev) => ({ ...prev, backImage: file }))
        setPreviews((prev) => ({ ...prev, back: previewUrl }))
      } else {
        setCaptures((prev) => ({ ...prev, barcodeImage: file }))
        setPreviews((prev) => ({ ...prev, barcode: previewUrl }))
      }

      // Flash effect then auto-advance after brief delay
      setFlashStep(currentStep)
      autoAdvanceTimer.current = setTimeout(() => {
        setFlashStep(null)
        if (currentStep < 3) {
          setCurrentStep((s) => (s + 1) as WizardStep)
        }
      }, 600)
    } finally {
      setIsCapturing(false)
    }
  }, [capturePhoto, currentStep, isCapturing])

  /** Handle file selected on web */
  const handleWebFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const previewUrl = URL.createObjectURL(file)

      if (currentStep === 1) {
        setCaptures((prev) => ({ ...prev, frontImage: file }))
        setPreviews((prev) => ({ ...prev, front: previewUrl }))
      } else if (currentStep === 2) {
        setCaptures((prev) => ({ ...prev, backImage: file }))
        setPreviews((prev) => ({ ...prev, back: previewUrl }))
      } else {
        setCaptures((prev) => ({ ...prev, barcodeImage: file }))
        setPreviews((prev) => ({ ...prev, barcode: previewUrl }))
      }

      // Reset the input so the same file can be re-selected
      e.target.value = ''
    },
    [currentStep],
  )

  /** Retake the current step's photo */
  const handleRetake = useCallback(() => {
    if (currentStep === 1) {
      if (previews.front?.startsWith('blob:')) URL.revokeObjectURL(previews.front)
      setCaptures((prev) => ({ ...prev, frontImage: null }))
      setPreviews((prev) => ({ ...prev, front: null }))
    } else if (currentStep === 2) {
      if (previews.back?.startsWith('blob:')) URL.revokeObjectURL(previews.back)
      setCaptures((prev) => ({ ...prev, backImage: null }))
      setPreviews((prev) => ({ ...prev, back: null }))
    } else {
      if (previews.barcode?.startsWith('blob:')) URL.revokeObjectURL(previews.barcode)
      setCaptures((prev) => ({ ...prev, barcodeImage: null }))
      setPreviews((prev) => ({ ...prev, barcode: null }))
    }
  }, [currentStep, previews])

  /** Skip current step */
  const handleSkip = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((s) => (s + 1) as WizardStep)
    } else {
      // Skip on step 3 → finish wizard
      finishWizard()
    }
  }, [currentStep, finishWizard])

  /** Move to next step or finish */
  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      // If barcode already detected on step 2, skip step 3 and finish
      if (detectedBarcode && currentStep === 2) {
        finishWizard()
        return
      }
      setCurrentStep((s) => (s + 1) as WizardStep)
    } else {
      finishWizard()
    }
  }, [currentStep, detectedBarcode, finishWizard])

  /** Cancel and close the camera — await stop so native preview layer is fully removed */
  const handleCancel = useCallback(async () => {
    await stopCamera()
    document.body.classList.remove('camera-running')
    onCancel()
  }, [stopCamera, onCancel])

  const currentPreview =
    currentStep === 1 ? previews.front : currentStep === 2 ? previews.back : previews.barcode
  const hasCurrentPhoto =
    currentStep === 1 ? !!captures.frontImage : currentStep === 2 ? !!captures.backImage : !!captures.barcodeImage
  // currentStep is always 1|2|3, so index is always valid
  const config = STEP_CONFIG[currentStep - 1] as (typeof STEP_CONFIG)[number]

  // Step 3 is considered done if barcode was auto-detected (regardless of photo)
  const step3Done = !!detectedBarcode

  // ─── Native Camera Overlay (portaled to body) ──────────
  if (isNativeCamera) {
    const overlay = (
      <div className="camera-overlay fixed inset-0 z-[9999] flex flex-col">
        {/* Capture flash */}
        {flashStep && (
          <div className="absolute inset-0 z-50 bg-white/80 animate-[flash_0.4s_ease-out]" />
        )}

        {/* Top bar - step indicator + cancel */}
        <div className="safe-top flex items-center justify-between bg-black/60 px-4 pb-3 pt-2">
          <button onClick={handleCancel} className="p-2 text-white">
            <X className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            {STEP_CONFIG.map((s) => (
              <div
                key={s.step}
                className={cn(
                  'h-2 w-8 rounded-full transition-all',
                  s.step < currentStep && 'bg-primary',
                  s.step === currentStep && !step3Done && 'bg-white',
                  s.step === currentStep && step3Done && s.step === 3 && 'bg-primary',
                  s.step > currentStep && !step3Done && 'bg-white/30',
                  s.step === 3 && step3Done && s.step > currentStep && 'bg-primary',
                )}
              />
            ))}
          </div>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </div>

        {/* Main camera viewfinder area — transparent to show hardware camera */}
        <div className="flex-1 relative">
          {/* Step instructions overlay */}
          <div className="absolute top-6 left-0 right-0 flex flex-col items-center pointer-events-none">
            <span className="text-4xl mb-2">{config.icon}</span>
            <h2 className="text-white text-xl font-bold drop-shadow-lg">
              {t(config.titleKey)}
            </h2>
            <p className="text-white/80 text-sm mt-1 drop-shadow">{t(config.hintKey)}</p>
            <p className="text-white/50 text-xs mt-2">
              {t('cameraWizard.stepOf', { current: currentStep, total: 3 })}
            </p>
          </div>

          {/* Barcode detected badge (appears during any step) */}
          {detectedBarcode && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary/90 text-white px-4 py-2 rounded-full pointer-events-none">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">{t('cameraWizard.barcodeDetected')}</span>
            </div>
          )}

          {/* Thumbnail preview of captured photo */}
          {currentPreview && (
            <div className="absolute bottom-4 left-4 w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <img src={currentPreview} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="safe-bottom bg-black/60 px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className={cn(
                'text-white/70 text-sm font-medium px-3 py-2 min-w-[60px]',
                currentStep === 1 && 'invisible', // Can't skip front image — it's required
              )}
            >
              {t('cameraWizard.skip')}
            </button>

            {/* Shutter / Next */}
            {!hasCurrentPhoto ? (
              <button
                onClick={handleNativeCapture}
                disabled={isCapturing}
                className={cn(
                  'h-[72px] w-[72px] rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform',
                  isCapturing && 'opacity-40',
                )}
              >
                <div className="h-[58px] w-[58px] rounded-full bg-white" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="h-[72px] w-[72px] rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform"
              >
                {currentStep < 3 && !detectedBarcode ? (
                  <ChevronRight className="h-8 w-8 text-white" />
                ) : (
                  <Check className="h-8 w-8 text-white" />
                )}
              </button>
            )}

            {/* Retake button */}
            <button
              onClick={handleRetake}
              className={cn(
                'text-white/70 text-sm font-medium px-3 py-2 min-w-[60px] flex items-center gap-1',
                !hasCurrentPhoto && 'invisible',
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('cameraWizard.retake')}
            </button>
          </div>

          {/* Captured thumbnails row */}
          <div className="flex justify-center gap-3 mt-3 mb-1">
            {[previews.front, previews.back, previews.barcode].map((url, i) => (
              <div
                key={i}
                className={cn(
                  'w-10 h-10 rounded-md overflow-hidden border transition-all',
                  i + 1 === currentStep ? 'border-white scale-110' : 'border-white/30',
                  i === 2 && step3Done && !url && 'border-primary bg-primary/30',
                  !url && !(i === 2 && step3Done) && 'bg-white/10',
                )}
              >
                {url ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : i === 2 && step3Done ? (
                  <span className="flex items-center justify-center w-full h-full text-primary text-xs">
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-white/30 text-xs">
                    {i + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    // Portal to document.body to escape Dialog's CSS transform containing block
    return createPortal(overlay, document.body)
  }

  // ─── Web Upload Flow ───────────────────────────────────
  const webUploadLabel =
    currentStep === 1
      ? t('cameraWizard.uploadFront')
      : currentStep === 2
        ? t('cameraWizard.uploadIngredients')
        : t('cameraWizard.uploadBarcode')

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEP_CONFIG.map((s) => (
          <div key={s.step} className="flex items-center gap-1">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                s.step < currentStep && 'bg-primary text-white',
                s.step === currentStep && !step3Done && 'bg-primary/20 text-primary ring-2 ring-primary',
                s.step === 3 && step3Done && 'bg-primary text-white',
                s.step > currentStep && !(s.step === 3 && step3Done) && 'bg-muted text-muted-foreground',
              )}
            >
              {s.step < currentStep || (s.step === 3 && step3Done) ? <Check className="h-4 w-4" /> : s.step}
            </div>
            {s.step < 3 && (
              <div
                className={cn('h-0.5 w-6', s.step < currentStep ? 'bg-primary' : 'bg-muted')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="text-center">
        <span className="text-3xl">{config.icon}</span>
        <h3 className="font-semibold mt-1">{t(config.titleKey)}</h3>
        <p className="text-sm text-muted-foreground">{t(config.hintKey)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('cameraWizard.stepOf', { current: currentStep, total: 3 })}
        </p>
      </div>

      {/* Preview or upload zone */}
      {currentPreview ? (
        <div className="relative">
          <img
            src={currentPreview}
            alt=""
            className="max-h-[200px] w-full object-contain rounded-lg bg-muted"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-background/80"
            onClick={handleRetake}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t('cameraWizard.retake')}
          </Button>
        </div>
      ) : (
        <div
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 p-6 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">{webUploadLabel}</p>
        </div>
      )}

      {/* Barcode badge (shown on any step if auto-detected) */}
      {detectedBarcode && (
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm">
          <Check className="h-4 w-4" />
          {t('cameraWizard.barcodeDetected')} — {detectedBarcode}
        </div>
      )}

      {/* Step 3: manual barcode entry on web */}
      {currentStep === 3 && !detectedBarcode && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('cameraWizard.enterBarcodeManually')}</p>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="5901234123457"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleWebFile}
      />

      {/* Navigation buttons */}
      <div className="flex gap-2">
        {currentStep > 1 ? (
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setCurrentStep((s) => (s - 1) as WizardStep)}
          >
            {t('nav.back')}
          </Button>
        ) : (
          <Button variant="ghost" className="flex-1" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
        )}

        {currentStep < 3 ? (
          <>
            {!hasCurrentPhoto && currentStep > 1 && (
              <Button variant="outline" className="flex-1" onClick={handleSkip}>
                {t('cameraWizard.skip')}
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={currentStep === 1 && !hasCurrentPhoto}
              onClick={handleNext}
            >
              {detectedBarcode && currentStep === 2
                ? t('cameraWizard.done')
                : t('common.continue')}
              {!(detectedBarcode && currentStep === 2) && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </>
        ) : (
          <Button
            className="flex-1"
            disabled={!captures.frontImage}
            onClick={handleNext}
          >
            <Camera className="h-4 w-4 mr-1" />
            {t('cameraWizard.done')}
          </Button>
        )}
      </div>
    </div>
  )
}
