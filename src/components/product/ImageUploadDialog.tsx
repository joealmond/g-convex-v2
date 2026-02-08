'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { appConfig } from '@/lib/app-config'
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
import { useGeolocation } from '../../hooks/use-geolocation'

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
  const [realImageUrl, setRealImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
  const { anonId } = useAnonymousId()
  const { t } = useTranslation()
  const { coords, requestLocation, loading: geoLoading, error: geoError } = useGeolocation()

  // Request location when dialog opens
  useEffect(() => {
    if (open) {
      requestLocation()
    }
  }, [open, requestLocation])

  // Convex mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  // Note: api.ai.analyzeImage is an action - will be available after convex push
  const analyzeImage = useAction(api.ai.analyzeImage as any)
  const createProductAndVote = useMutation(api.votes.createProductAndVote)

  /**
   * Resize image and convert to WebP
   * Reduces file size significantly for mobile uploads
   */
  const resizeAndConvertImage = useCallback(
    (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }

        img.onload = () => {
          // Calculate new dimensions (max 1024×1024, maintain aspect ratio)
          let width = img.width
          let height = img.height
          const maxSize = 1024

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize
              width = maxSize
            } else {
              width = (width / height) * maxSize
              height = maxSize
            }
          }

          // Set canvas size
          canvas.width = width
          canvas.height = height

          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to WebP blob at 80% quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create new File from blob
                const resizedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '.webp'),
                  { type: 'image/webp' }
                )
                resolve(resizedFile)
              } else {
                reject(new Error('Failed to create WebP image'))
              }
            },
            'image/webp',
            0.8
          )
        }

        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }

        // Load the image
        img.src = URL.createObjectURL(file)
      })
    },
    []
  )

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB before processing)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    try {
      // Resize and convert to WebP
      const resizedFile = await resizeAndConvertImage(file)
      
      setImageFile(resizedFile)
      setImagePreview(URL.createObjectURL(resizedFile))
      setError(null)
    } catch (err) {
      console.error('Image processing error:', err)
      setError('Failed to process image. Please try another file.')
    }
  }, [resizeAndConvertImage])

  /**
   * Drag-and-drop handlers
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    if (!file) return

    // Same validation as file input
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Process the dropped file (same as handleFileSelect)
    try {
      const resizedFile = await resizeAndConvertImage(file)
      setImageFile(resizedFile)
      setImagePreview(URL.createObjectURL(resizedFile))
      setError(null)
    } catch (err) {
      console.error('Image processing error:', err)
      setError('Failed to process image. Please try another file.')
    }
  }, [resizeAndConvertImage])

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
        setError(result.error || 'AI analysis is currently unavailable. You can fill in the details manually.')
        // Still set the real image URL so the product image loads after creation
        if (result.imageUrl) {
          setRealImageUrl(result.imageUrl)
        }
        setProductName('')
        setSafety(50)
        setTaste(50)
        setStep('review')
        return
      }

      // 4. Pre-fill form with AI results and store real image URL
      setAnalysis(result.analysis)
      setProductName(result.analysis.productName)
      setSafety(result.analysis.safety)
      setTaste(result.analysis.taste)
      setRealImageUrl(result.imageUrl)

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
      // Use the real Convex storage URL — never save blob: URLs to the database
      // (blob URLs are session-local and become ERR_FILE_NOT_FOUND after reload)
      const imageUrl = realImageUrl || ''

      const result = await createProductAndVote({
        name: productName.trim(),
        imageUrl,
        imageStorageId: (storageId as any) ?? undefined,
        anonymousId: anonId ?? undefined,
        safety,
        taste,
        price,
        storeName: storeName || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
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
  }, [storageId, productName, anonId, safety, taste, price, storeName, analysis, realImageUrl, imagePreview, createProductAndVote, onSuccess])

  const resetDialog = useCallback(() => {
    // Revoke blob URL to free memory
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setStep('upload')
    setImageFile(null)
    setImagePreview(null)
    setStorageId(null)
    setRealImageUrl(null)
    setAnalysis(null)
    setProductName('')
    setSafety(50)
    setTaste(50)
    setPrice(undefined)
    setStoreName('')
    setError(null)
  }, [imagePreview])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { setOpen(newOpen); if (!newOpen) resetDialog() }}>
      <DialogTrigger asChild>
        {trigger ?? <Button>{t('imageUpload.addProduct')}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && t('imageUpload.uploadProductImage')}
            {step === 'analyze' && t('imageUpload.analyzingImage')}
            {step === 'review' && t('imageUpload.reviewProduct')}
            {step === 'submitting' && t('imageUpload.submitting')}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && t('imageUpload.uploadProductDescription')}
            {step === 'analyze' && t('imageUpload.aiAnalyzingDescription')}
            {step === 'review' && t('imageUpload.reviewProductDescription')}
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
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? 'border-color-primary bg-color-primary/10'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
                    {isDragging ? 'Drop image here' : t('imageUpload.clickToUpload')}
                  </p>
                  {!isDragging && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      or drag and drop
                    </p>
                  )}
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
              {t('imageUpload.uploadAndAnalyze')}
            </Button>
          </div>
        )}

        {/* Step 2: Analyzing — multi-step progress indicator */}
        {step === 'analyze' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-sm">
                {t('imageUpload.aiAnalyzing')}...
              </p>
              <p className="text-xs text-muted-foreground">
                {t('imageUpload.aiAnalyzingHint')}
              </p>
            </div>
            <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_infinite]" />
            </div>
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
                ⚠️ Warning: This product may contain {appConfig.riskConcept}!
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
            </div>

            <div className="space-y-2">
              <Label>{t('imageUpload.safety')}: {safety}</Label>
              <Slider
                value={[safety]}
                onValueChange={(values) => values[0] !== undefined && setSafety(values[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('imageUpload.taste')}: {taste}</Label>
              <Slider
                value={[taste]}
                onValueChange={(values) => values[0] !== undefined && setTaste(values[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeName">{t('imageUpload.storeName')} ({t('imageUpload.optional')})</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t('imageUpload.whereDidYouBuy')}
              />
              {/* Location Status */}
              <div className="text-xs flex items-center gap-1 mt-1">
                {geoLoading && <span className="text-muted-foreground">📍 Acquiring location...</span>}
                {coords && <span className="text-green-600">✅ Location acquired</span>}
                {geoError && <span className="text-red-500">❌ Location unavailable type store manually</span>}
              </div>
            </div>

            {analysis?.reasoning && (
              <p className="text-xs text-muted-foreground">
                AI: {analysis.reasoning}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetDialog}>
                {t('imageUpload.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!productName.trim() || geoLoading}
              >
                {geoLoading ? 'Locating...' : t('imageUpload.submitProduct')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submitting */}
        {step === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t('imageUpload.creatingProduct')}...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
