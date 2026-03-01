import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { ScanBarcode, Loader2 } from 'lucide-react'
import { useImageUpload } from '@/hooks/use-image-upload'
import { ReviewStep } from './ReviewStep'
import { BackScanStep } from './BackScanStep'
import { SmartCamera } from './SmartCamera'

interface ImageUploadDialogProps {
  trigger?: React.ReactNode
  onSuccess?: (productId: string) => void
}

export function ImageUploadDialog({ trigger, onSuccess }: ImageUploadDialogProps) {
  const h = useImageUpload({ onSuccess })

  return (
    <Dialog open={h.open} onOpenChange={(newOpen) => { h.setOpen(newOpen); if (!newOpen) h.resetDialog() }}>
      <DialogTrigger asChild>
        {trigger ?? <Button>{h.t('imageUpload.addProduct')}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader>
          <DialogTitle>
            {h.step === 'upload' && h.t('imageUpload.uploadProductImage')}
            {h.step === 'scan' && h.t('smartCamera.scanTitle')}
            {h.step === 'barcode-lookup' && h.t('smartCamera.lookingUp')}
            {h.step === 'analyze' && h.t('imageUpload.analyzingImage')}
            {h.step === 'back-scan' && h.t('imageUpload.scanBackTitle')}
            {h.step === 'review' && h.t('imageUpload.reviewProduct')}
            {h.step === 'submitting' && h.t('imageUpload.submitting')}
          </DialogTitle>
          <DialogDescription>
            {h.step === 'upload' && h.t('imageUpload.uploadProductDescription')}
            {h.step === 'scan' && h.t('smartCamera.scanDescription')}
            {h.step === 'barcode-lookup' && h.t('smartCamera.lookingUpDescription')}
            {h.step === 'analyze' && h.t('imageUpload.aiAnalyzingDescription')}
            {h.step === 'back-scan' && h.t('imageUpload.scanBackDescription')}
            {h.step === 'review' && h.t('imageUpload.reviewProductDescription')}
          </DialogDescription>
        </DialogHeader>

        {h.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {h.error}
          </div>
        )}

        {/* Step 1: Upload */}
        {h.step === 'upload' && (
          <div className="space-y-4">
            <div
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                h.isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={() => h.fileInputRef.current?.click()}
              onDragOver={h.handleDragOver}
              onDragLeave={h.handleDragLeave}
              onDrop={h.handleDrop}
            >
              {h.imagePreview ? (
                <img src={h.imagePreview} alt="Preview" className="max-h-[180px] object-contain" />
              ) : (
                <>
                  <div className="text-4xl">📷</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {h.isDragging ? h.t('imageUpload.dropImageHere') : h.t('imageUpload.clickToUpload')}
                  </p>
                  {!h.isDragging && (
                    <p className="mt-1 text-xs text-muted-foreground">{h.t('imageUpload.orDragAndDrop')}</p>
                  )}
                </>
              )}
            </div>
            <input
              ref={h.fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={h.handleFileSelect}
            />
            <Button className="w-full" disabled={!h.imageFile} onClick={h.handleUploadAndAnalyze}>
              {h.t('imageUpload.uploadAndAnalyze')}
            </Button>

            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">{h.t('common.or')}</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={() => h.setStep('scan')}>
              <ScanBarcode className="h-4 w-4" />
              {h.t('smartCamera.scanBarcode')}
            </Button>
          </div>
        )}

        {/* Step: Scan */}
        {h.step === 'scan' && (
          <div className="space-y-4">
            <SmartCamera
              onBarcodeScan={h.handleBarcodeScan}
              onPhotoCapture={h.handleSmartCameraPhoto}
              onCancel={() => h.setStep('upload')}
            />
          </div>
        )}

        {/* Step: Barcode Lookup */}
        {h.step === 'barcode-lookup' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{h.t('smartCamera.lookingUp')}</p>
            <p className="text-xs text-muted-foreground">{h.t('smartCamera.lookingUpDescription')}</p>
          </div>
        )}

        {/* Step: Analyzing */}
        {h.step === 'analyze' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-sm">{h.t('imageUpload.aiAnalyzing')}...</p>
              <p className="text-xs text-muted-foreground">{h.t('imageUpload.aiAnalyzingHint')}</p>
            </div>
            <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Step: Back Scan — NEW */}
        {h.step === 'back-scan' && (
          <BackScanStep
            onPhotoCapture={h.handleBackPhotoCapture}
            onSkip={h.handleSkipBackScan}
            isAnalyzing={h.backAnalyzing}
            analysisResult={h.backAnalysis}
            analysisError={h.backError}
            onProceed={h.handleBackScanProceed}
          />
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">{h.t('imageUpload.creatingProduct')}...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
