'use client'

import { useState, useRef, useCallback } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { useAnonymousId } from '../../hooks/use-anonymous-id'
import { useTranslation } from '../../hooks/use-translation'

interface ImageUploadDialogProps {
  trigger?: React.ReactNode
  onSuccess?: (productId: string) => void
}

export function ImageUploadDialog({ trigger, onSuccess }: ImageUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'upload' | 'analyze' | 'review' | 'submitting'>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [storageId, setStorageId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // AI Analysis results
  const [analysis, setAnalysis] = useState<{
    productName: string
    reasoning: string
    safety: number
    taste: number
    tags: string[]
    containsGluten: boolean
    warnings: string[]
  } | null>(null)

  // Form state (can be edited after AI analysis)
  const [productName, setProductName] = useState('')
  const [safety, setSafety] = useState(50)
  const [taste, setTaste] = useState(50)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [storeName, setStoreName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { anonymousId } = useAnonymousId()
  const { t } = useTranslation()

  // Convex mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const analyzeImage = useAction(api.ai.analyzeImage)
  const createProductAndVote = useMutation(api.votes.createProductAndVote)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.byteLength > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }, [])

  const handleUploadAndAnalyze = useCallback(async () => {
    if (!imageFile) return

    setStep('analyze')
    setError(null)

    try {
      // 1. Get upload URL from Convex
      const uploadUrl = await generateUploadUrl()

      // 2. Upload image to Convex storage
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': imageFile.type },
        body: imageFile,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const { storageId: newStorageId } = await response.json()
      setStorageId(newStorageId)

      // 3. Run AI analysis
      const result = await analyzeImage({ storageId: newStorageId })

      if (!result.success) {
        // AI analysis failed, but we can still continue with manual entry
        console.warn('AI analysis failed:', result.error)
        setProductName('')
        setSafety(50)
        setTaste(50)
        setStep('review')
        return
      }

      // 4. Pre-fill form with AI results
      setAnalysis(result.analysis)
      setProductName(result.analysis.productName)
      setSafety(result.analysis.safety)
      setTaste(result.analysis.taste)

      setStep('review')
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      setStep('upload')
    }
  }, [imageFile, generateUploadUrl, analyzeImage])

  const handleSubmit = useCallback(async () => {
    if (!storageId || !productName.trim()) {
      setError('Please provide a product name')
      return
    }

    setStep('submitting')
    setError(null)

    try {
      // Get image URL from storage ID (this is a simplified approach)
      // In production, you'd want to get the actual URL
      const imageUrl = `https://convex.cloud/api/storage/${storageId}`

      const result = await createProductAndVote({
        name: productName.trim(),
        imageUrl,
        anonymousId: anonymousId ?? undefined,
        safety,
        taste,
        price,
        storeName: storeName || undefined,
        ingredients: analysis?.tags,
        aiAnalysis: analysis ?? undefined,
      })

      // Success!
      setOpen(false)
      onSuccess?.(result.productId)

      // Reset form
      setStep('upload')
      setImageFile(null)
      setImagePreview(null)
      setStorageId(null)
      setAnalysis(null)
      setProductName('')
      setSafety(50)
      setTaste(50)
      setPrice(undefined)
      setStoreName('')
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
      setStep('review')
    }
  }, [storageId, productName, anonymousId, safety, taste, price, storeName, analysis, createProductAndVote, onSuccess])

  const resetDialog = useCallback(() => {
    setStep('upload')
    setImageFile(null)
    setImagePreview(null)
    setStorageId(null)
    setAnalysis(null)
    setProductName('')
    setSafety(50)
    setTaste(50)
    setPrice(undefined)
    setStoreName('')
    setError(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { setOpen(newOpen); if (!newOpen) resetDialog() }}>
      <DialogTrigger asChild>
        {trigger ?? <Button>{t('addProduct')}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && t('uploadProductImage')}
            {step === 'analyze' && t('analyzingImage')}
            {step === 'review' && t('reviewProduct')}
            {step === 'submitting' && t('submitting')}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && t('uploadProductDescription')}
            {step === 'analyze' && t('aiAnalyzingDescription')}
            {step === 'review' && t('reviewProductDescription')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-[180px] object-contain"
                />
              ) : (
                <>
                  <div className="text-4xl">📷</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('clickToUpload')}
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              className="w-full"
              disabled={!imageFile}
              onClick={handleUploadAndAnalyze}
            >
              {t('uploadAndAnalyze')}
            </Button>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyze' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t('aiAnalyzing')}...
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Product"
                className="mx-auto max-h-[120px] rounded-md object-contain"
              />
            )}

            {analysis?.containsGluten && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                ⚠️ {t('glutenWarning')}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="productName">{t('productName')}</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t('enterProductName')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('safety')}: {safety}</Label>
              <Slider
                value={[safety]}
                onValueChange={([v]) => setSafety(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('taste')}: {taste}</Label>
              <Slider
                value={[taste]}
                onValueChange={([v]) => setTaste(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeName">{t('storeName')} ({t('optional')})</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t('whereDidYouBuy')}
              />
            </div>

            {analysis?.reasoning && (
              <p className="text-xs text-muted-foreground">
                AI: {analysis.reasoning}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetDialog}>
                {t('cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!productName.trim()}
              >
                {t('submitProduct')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submitting */}
        {step === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t('creatingProduct')}...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
