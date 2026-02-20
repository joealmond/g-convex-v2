import { appConfig } from '@/lib/app-config'
import { QuadrantPicker } from '@/components/QuadrantPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { StoreTagInput } from '@/components/dashboard/StoreTagInput'
import { ChevronDown, ChevronUp, Sliders, Bookmark } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ImageAnalysis } from '@/hooks/use-image-upload'

interface ReviewStepProps {
  imagePreview: string | null
  analysis: ImageAnalysis | null
  productName: string
  setProductName: (name: string) => void
  safety: number
  setSafety: (val: number) => void
  taste: number
  setTaste: (val: number) => void
  price: number | undefined
  setPrice: (val: number | undefined) => void
  storeName: string
  setStoreName: (name: string) => void
  fineTuneOpen: boolean
  setFineTuneOpen: (open: boolean) => void
  geoLoading: boolean
  coords: { latitude: number; longitude: number } | null
  geoError: string | null
  isOnline: boolean
  onSaveAsDraft: () => void
  onSubmit: () => void
  onReset: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function ReviewStep({
  imagePreview,
  analysis,
  productName,
  setProductName,
  safety,
  setSafety,
  taste,
  setTaste,
  price,
  setPrice,
  storeName,
  setStoreName,
  fineTuneOpen,
  setFineTuneOpen,
  geoLoading,
  coords,
  geoError,
  isOnline,
  onSaveAsDraft,
  onSubmit,
  onReset,
  t,
}: ReviewStepProps) {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Product"
          className="mx-auto max-h-[100px] rounded-md object-contain"
        />
      )}

      {analysis?.containsGluten && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          ⚠️ {t('imageUpload.riskWarning', { concept: appConfig.riskConcept })}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="productName">{t('imageUpload.productName')}</Label>
        <Input
          id="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder={t('imageUpload.enterProductName')}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={onSaveAsDraft}
          disabled={!productName.trim() || geoLoading || !isOnline}
        >
          <Bookmark className="h-3.5 w-3.5" />
          {t('imageUpload.draft')}
        </Button>
        {!isOnline && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
            ⚠️ {t('offline.banner')}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground text-center">{t('imageUpload.draftHint')}</p>
      </div>

      {/* Quick Vote */}
      <div>
        <Label className="mb-2 block">{t('imageUpload.quickRate')}</Label>
        <QuadrantPicker onSelect={(s, ta) => { setSafety(s); setTaste(ta) }} />
      </div>

      {/* Price Quick Select */}
      <div>
        <Label className="mb-2 block">
          {t('imageUpload.price')}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({t('imageUpload.optional')})
          </span>
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {appConfig.dimensions.axis3.presets.map((preset, index) => {
            const val = (index + 1) * 20
            return (
              <Button
                key={preset.label}
                type="button"
                variant={price === val ? 'default' : 'outline'}
                className={cn(
                  'h-10 text-xs px-1',
                  price === val && 'bg-primary hover:bg-primary/90',
                )}
                onClick={() => setPrice(price === val ? undefined : val)}
                title={preset.description}
              >
                {preset.emoji}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Store */}
      <StoreTagInput
        value={storeName}
        onChange={setStoreName}
        onLocationCapture={() => {}}
        disabled={false}
      />

      {/* Fine Tune — collapsible */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => setFineTuneOpen(!fineTuneOpen)}
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{t('imageUpload.fineTune')}</span>
          </div>
          {fineTuneOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {fineTuneOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-4">
                <div className="space-y-2">
                  <Label>{appConfig.dimensions.axis1.label}: {safety}</Label>
                  <Slider
                    value={[safety]}
                    onValueChange={(v) => v[0] !== undefined && setSafety(v[0])}
                    min={0} max={100} step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{appConfig.dimensions.axis2.label}: {taste}</Label>
                  <Slider
                    value={[taste]}
                    onValueChange={(v) => v[0] !== undefined && setTaste(v[0])}
                    min={0} max={100} step={1}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Location Status */}
      <div className="text-xs flex items-center gap-1">
        {geoLoading && <span className="text-muted-foreground">📍 {t('imageUpload.acquiringLocation')}</span>}
        {coords && <span className="text-green-600">✅ {t('imageUpload.locationAcquired')}</span>}
        {geoError && <span className="text-destructive">❌ {t('imageUpload.locationUnavailable')}</span>}
      </div>

      {analysis?.reasoning && (
        <p className="text-xs text-muted-foreground">AI: {analysis.reasoning}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onReset}>
          {t('imageUpload.cancel')}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={onSubmit}
          disabled={!productName.trim() || geoLoading || !isOnline}
        >
          {geoLoading ? t('imageUpload.locating') : t('imageUpload.submitProduct')}
        </Button>
      </div>
    </div>
  )
}
