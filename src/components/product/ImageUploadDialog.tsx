import { useEffect } from 'react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Loader2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useImageUpload } from '@/hooks/use-image-upload'
import { ReviewStep } from './ReviewStep'
import { CameraWizard } from './CameraWizard'

interface ImageUploadDialogProps {
  trigger?: React.ReactNode
  onSuccess?: (productId: string) => void
}

export function ImageUploadDialog({ trigger, onSuccess }: ImageUploadDialogProps) {
  const h = useImageUpload({ onSuccess })
  const isNative = Capacitor.isNativePlatform()
  const isNativeCameraWizard = isNative && h.step === 'wizard'

  // On native, show a black screen BEFORE the dialog mounts so there's no
  // white/cream flash. CameraWizard will swap to camera-running (transparent)
  // once the native AVFoundation session is actually producing frames.
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset step to wizard when actually opening (not during close).
      // This avoids briefly remounting CameraWizard during close.
      h.setStep('wizard')
      if (isNative) {
        document.body.classList.add('camera-starting')
      }
    }
    h.setOpen(newOpen)
    if (!newOpen) {
      h.resetDialog()
      document.body.classList.remove('camera-running')
      document.body.classList.remove('camera-starting')
    }
  }

  // Lock body scroll on native when dialog is open in non-wizard steps.
  // modal={false} disables Radix's built-in scroll lock, so we do it manually.
  useEffect(() => {
    if (isNative && h.open && h.step !== 'wizard') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isNative, h.open, h.step])

  return (
    <Dialog
      open={h.open}
      onOpenChange={handleOpenChange}
      // Keep modal={false} for the entire native session — Radix doesn't
      // support switching modal while open (causes re-mount + ghost camera).
      // On web, always modal.
      modal={!isNative}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button>{h.t('imageUpload.addProduct')}</Button>}
      </DialogTrigger>
      {/* On native during wizard step, hide DialogContent — the camera overlay is portaled to body.
          modal={false} prevents Radix from adding `inert` to other body children (which would
          block all interaction with our portaled camera overlay). The onInteractOutside etc.
          handlers prevent the dialog from auto-closing when tapping the camera UI. */}
      <DialogContent
        className={isNativeCameraWizard ? 'opacity-0 pointer-events-none !p-0 !gap-0 !border-0 !shadow-none !bg-transparent' : 'sm:max-w-md bg-background border border-border'}
        showCloseButton={!isNativeCameraWizard}
        onInteractOutside={isNativeCameraWizard ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={isNativeCameraWizard ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isNativeCameraWizard ? (e) => e.preventDefault() : undefined}
      >
        {!isNativeCameraWizard && (
          <DialogHeader>
            <DialogTitle>
              {h.step === 'wizard' && h.t('cameraWizard.title')}
              {h.step === 'processing' && h.t('cameraWizard.processing')}
              {h.step === 'review' && h.t('imageUpload.reviewProduct')}
              {h.step === 'submitting' && h.t('imageUpload.submitting')}
            </DialogTitle>
            <DialogDescription>
              {h.step === 'wizard' && h.t('imageUpload.uploadProductDescription')}
              {h.step === 'processing' && h.processingStatus}
              {h.step === 'review' && h.t('imageUpload.reviewProductDescription')}
            </DialogDescription>
          </DialogHeader>
        )}

        {h.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {h.error}
          </div>
        )}

        {/* Step: Camera Wizard (capture front, ingredients, barcode) */}
        {h.step === 'wizard' && (
          <CameraWizard
            onComplete={h.handleWizardComplete}
            onCancel={() => { h.setOpen(false); h.resetDialog() }}
          />
        )}

        {/* Step: Processing captures */}
        {h.step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-sm">{h.processingStatus || h.t('cameraWizard.processing')}</p>
              <p className="text-xs text-muted-foreground">{h.t('imageUpload.aiAnalyzingHint')}</p>
            </div>
            <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Step: Review */}
        {h.step === 'review' && (
          <ReviewStep
            imagePreview={h.imagePreview}
            analysis={h.analysis}
            productName={h.productName}
            setProductName={h.setProductName}
            safety={h.safety}
            setSafety={h.setSafety}
            taste={h.taste}
            setTaste={h.setTaste}
            price={h.price}
            setPrice={h.setPrice}
            storeName={h.storeName}
            setStoreName={h.setStoreName}
            freeFrom={h.freeFrom}
            onFreeFromToggle={h.handleFreeFromToggle}
            ingredientsText={h.ingredientsText}
            geoLoading={h.geoLoading}
            coords={h.coords}
            geoError={h.geoError}
            permissionStatus={h.permissionStatus}
            requestLocation={h.requestLocation}
            isOnline={h.isOnline}
            onSaveAsDraft={h.handleSaveAsDraft}
            onSubmit={h.handleSubmit}
            onReset={h.resetDialog}
            t={h.t}
          />
        )}

        {/* Step: Submitting */}
        {h.step === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">{h.t('imageUpload.creatingProduct')}...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
