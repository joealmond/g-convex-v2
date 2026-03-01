import { useState } from 'react'
import { appConfig } from '@/lib/app-config'
import { TouchQuadrant } from '@/components/product/TouchQuadrant'
import { SensitivityPicker } from '@/components/product/SensitivityPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StoreTagInput } from '@/components/dashboard/StoreTagInput'
import { Bookmark, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
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
  // NEW: free-from sensitivities
  freeFrom: Set<string>
  onFreeFromToggle: (id: string) => void
  // NEW: ingredients text from back scan
  ingredientsText: string
  // Geo — enhanced
  geoLoading: boolean
  coords: { latitude: number; longitude: number } | null
  geoError: string | null
  permissionStatus: string | null
  requestLocation: () => void
  // Online
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
  freeFrom,
  onFreeFromToggle,
  ingredientsText,
  geoLoading,
  coords,
  geoError,
  permissionStatus,
  requestLocation,
  isOnline,
  onSaveAsDraft,
  onSubmit,
  onReset,
  t,
}: ReviewStepProps) {
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false)

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Image Preview */}
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Product"
          className="mx-auto max-h-[80px] rounded-md object-contain"
        />
      )}

      {/* Allergen Warning */}
      {analysis?.containsGluten && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          ⚠️ {t('imageUpload.riskWarning', { concept: appConfig.riskConcept })}
        </div>
      )}

      {/* Product Name + Draft */}
      <div className="space-y-2">
        <Label htmlFor="productName">{t('imageUpload.productName')}</Label>
        <Input
          id="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder={t('imageUpload.enterProductName')}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={onSaveAsDraft}
            disabled={!productName.trim() || geoLoading || !isOnline}
          >
            <Bookmark className="h-3.5 w-3.5" />
            {t('imageUpload.draft')}
          </Button>
        </div>
        {!isOnline && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
            ⚠️ {t('offline.banner')}
          </p>
        )}
      </div>

      {/* Touch Quadrant Rating — replaces QuadrantPicker + Fine Tune */}
      <div>
        <Label className="mb-2 block">{t('imageUpload.rateProduct')}</Label>
        <TouchQuadrant
          initialSafety={safety}
          initialTaste={taste}
          onValueChange={(s, ta) => { setSafety(s); setTaste(ta) }}
        />
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

      {/* Free-From Sensitivity Picker — NEW */}
      <div>
        <Label className="mb-2 block">
          {t('imageUpload.freeFrom')}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({t('imageUpload.freeFromHint')})
          </span>
        </Label>
        <SensitivityPicker
          selected={freeFrom}
          onToggle={onFreeFromToggle}
        />
      </div>

      {/* Ingredients Preview — NEW (from back scan) */}
      {ingredientsText && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between p-2.5 bg-muted/50 hover:bg-muted/80 transition-colors"
            onClick={() => setIngredientsExpanded(!ingredientsExpanded)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="font-medium text-xs">{t('imageUpload.ingredientsFromScan')}</span>
            </div>
            {ingredientsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <AnimatePresence>
            {ingredientsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2.5 max-h-[100px] overflow-y-auto">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {ingredientsText}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Store */}
      <StoreTagInput
        value={storeName}
        onChange={setStoreName}
        onLocationCapture={() => {}}
        disabled={false}
      />

      {/* Location Status — Enhanced with enforcement prompts */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="text-xs flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span className="font-medium">{t('imageUpload.locationTitle')}</span>
        </div>

        {geoLoading && (
          <p className="text-xs text-muted-foreground animate-pulse">
            📍 {t('imageUpload.acquiringLocation')}
          </p>
        )}

        {coords && (
          <p className="text-xs text-safety-high">
            ✅ {t('imageUpload.locationAcquired')}
          </p>
        )}

        {!coords && !geoLoading && (permissionStatus === 'prompt' || !permissionStatus) && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {t('imageUpload.locationHelps')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={requestLocation}
            >
              <MapPin className="h-3 w-3" />
              {t('imageUpload.enableLocation')}
            </Button>
          </div>
        )}

        {!coords && !geoLoading && permissionStatus === 'denied' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ {t('imageUpload.locationDenied')}
          </p>
        )}

        {geoError && !coords && permissionStatus !== 'denied' && (
          <p className="text-xs text-destructive">
            ❌ {t('imageUpload.locationUnavailable')}
          </p>
        )}
      </div>

      {/* AI Reasoning */}
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
