import { useState, useRef, useCallback, useEffect } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useTranslation } from '@/hooks/use-translation'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useHaptics } from '@/hooks/use-haptics'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

export type ImageUploadStep =
  | 'upload'
  | 'scan'
  | 'barcode-lookup'
  | 'analyze'
  | 'review'
  | 'submitting'

export interface ImageAnalysis {
  productName: string
  reasoning: string
  safety: number
  taste: number
  tags: string[]
  containsGluten: boolean
  warnings: string[]
}

interface UseImageUploadOptions {
  onSuccess?: (productId: string) => void
}

export function useImageUpload({ onSuccess }: UseImageUploadOptions = {}) {
  const { isOnline } = useOnlineStatus()
  const { impact } = useHaptics()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImageUploadStep>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [storageId, setStorageId] = useState<string | null>(null)
  const [realImageUrl, setRealImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [productName, setProductName] = useState('')
  const [safety, setSafety] = useState(50)
  const [taste, setTaste] = useState(50)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [storeName, setStoreName] = useState('')
  const [fineTuneOpen, setFineTuneOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { anonId } = useAnonymousId()
  const { t } = useTranslation()
  const { coords, requestLocation, loading: geoLoading, error: geoError } = useGeolocation()

  // Request location when dialog opens
  useEffect(() => {
    if (open) requestLocation()
  }, [open, requestLocation])

  // Revoke blob URLs on change / unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Convex mutations / actions
  const generateR2UploadUrl = useAction(api.files.generateR2UploadUrl)
  const analyzeImage = useAction(api.ai.analyzeImage)
  const createProductAndVote = useMutation(api.votes.createProductAndVote)
  const lookupBarcode = useAction(api.barcode.lookupBarcode)

  /**
   * Resize image and convert to WebP.
   * Rejects < 200×200, downscales > 1200×1200, outputs WebP at 80 %.
   */
  const resizeAndConvertImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      img.onload = () => {
        URL.revokeObjectURL(img.src)

        if (img.width < 200 || img.height < 200) {
          reject(new Error(`Image too small (${img.width}×${img.height}). Minimum size is 200×200 pixels.`))
          return
        }

        let width = img.width
        let height = img.height
        const maxSize = 1200

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.webp'),
                { type: 'image/webp' },
              )
              resolve(resizedFile)
            } else {
              reject(new Error('Failed to create WebP image'))
            }
          },
          'image/webp',
          0.8,
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image'))
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  /** Handle photo capture from SmartCamera */
  const handleSmartCameraPhoto = useCallback(async (file: File) => {
    try {
      const resizedFile = await resizeAndConvertImage(file)
      setImageFile(resizedFile)
      setImagePreview(URL.createObjectURL(resizedFile))
      setError(null)
      setStep('upload')
    } catch (err) {
      logger.error('Image processing error:', err)
      setError(
        err instanceof Error && err.message.includes('too small')
          ? t('imageUpload.imageTooSmall')
          : t('imageUpload.processingFailed'),
      )
      setStep('upload')
    }
  }, [resizeAndConvertImage, t])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(t('imageUpload.invalidType'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('imageUpload.fileTooLarge'))
      return
    }

    try {
      const resizedFile = await resizeAndConvertImage(file)
      setImageFile(resizedFile)
      setImagePreview(URL.createObjectURL(resizedFile))
      setError(null)
    } catch (err) {
      logger.error('Image processing error:', err)
      setError(
        err instanceof Error && err.message.includes('too small')
          ? t('imageUpload.imageTooSmall')
          : t('imageUpload.processingFailed'),
      )
    }
  }, [resizeAndConvertImage, t])

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

    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    try {
      const resizedFile = await resizeAndConvertImage(file)
      setImageFile(resizedFile)
      setImagePreview(URL.createObjectURL(resizedFile))
      setError(null)
    } catch (err) {
      logger.error('Image processing error:', err)
      setError('Failed to process image. Please try another file.')
    }
  }, [resizeAndConvertImage])

  const handleUploadAndAnalyze = useCallback(async () => {
    if (!imageFile) return

    setStep('analyze')
    setError(null)

    try {
      // Step 1: Get signed upload URL from Convex
      let uploadUrl: string
      let publicUrl: string
      try {
        const result = await generateR2UploadUrl({
          contentType: imageFile.type,
        })
        uploadUrl = result.uploadUrl
        publicUrl = result.publicUrl
      } catch (err) {
        logger.error('Step 1 failed — generateR2UploadUrl:', err)
        throw new Error('Failed to generate upload URL. Check R2 configuration.')
      }

      // Step 2: Upload file directly to R2 via signed URL
      try {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        })
        if (!response.ok) throw new Error(`R2 PUT failed: ${response.status} ${response.statusText}`)
      } catch (err) {
        logger.error('Step 2 failed — PUT to R2:', err)
        throw new Error('Failed to upload image. Check R2 CORS settings.')
      }

      setRealImageUrl(publicUrl)
      setStorageId('r2_upload')

      const result = await analyzeImage({ imageUrl: publicUrl })

      if (!result.success) {
        console.warn('AI analysis failed:', result.error)
        setError(result.error || 'AI analysis is currently unavailable. You can fill in the details manually.')
        if (result.imageUrl) setRealImageUrl(result.imageUrl)
        setProductName('')
        setSafety(50)
        setTaste(50)
        setStep('review')
        return
      }

      if (result.analysis) {
        setAnalysis(result.analysis)
        setProductName(result.analysis.productName)
        setSafety(result.analysis.safety)
        setTaste(result.analysis.taste)
      }
      setRealImageUrl(result.imageUrl || null)
      setStep('review')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      setError(errorMessage)
      setStep('upload')
    }
  }, [imageFile, generateR2UploadUrl, analyzeImage])

  const resetDialog = useCallback(() => {
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
    setFineTuneOpen(false)
    setError(null)
  }, [imagePreview])

  /** Handle barcode scan result from SmartCamera */
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setStep('barcode-lookup')
    try {
      const result = await lookupBarcode({ barcode })

      if (result.found && result.source === 'local') {
        toast.info(t('smartCamera.existingProduct'), {
          description: result.existingProduct.name,
          action: {
            label: t('smartCamera.viewProduct'),
            onClick: () => {
              setOpen(false)
              resetDialog()
              window.location.href = `/product/${encodeURIComponent(result.existingProduct.name)}`
            },
          },
        })
        setStep('upload')
        return
      }

      if (result.found && result.source === 'openfoodfacts') {
        impact('medium')
        toast.success(t('smartCamera.barcodeFound'))
        setProductName(result.productData.name)
        if (result.productData.imageUrl) {
          setRealImageUrl(result.productData.imageUrl)
          setImagePreview(result.productData.imageUrl)
        }
        setStep('review')
        return
      }

      toast.warning(t('smartCamera.barcodeNotFound'))
      setStep('upload')
    } catch (error) {
      logger.error('Barcode lookup failed', error)
      toast.error(t('smartCamera.scanError'))
      setStep('upload')
    }
  }, [lookupBarcode, impact, t, resetDialog])

  /** Shared product creation logic for both draft save and full submit */
  const submitProduct = useCallback(async (options: { isDraft: boolean }) => {
    if (!realImageUrl || !productName.trim()) {
      setError(t('imageUpload.provideProductName'))
      return
    }

    setStep('submitting')
    setError(null)

    try {
      const result = await createProductAndVote({
        name: productName.trim(),
        imageUrl: realImageUrl || '',
        imageStorageId: storageId === 'r2_upload' ? undefined : (storageId as Id<'_storage'> ?? undefined),
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

      setOpen(false)
      onSuccess?.(result.productId)

      if (options.isDraft) {
        toast.success(`📋 ${t('imageUpload.draftSaved')}`, {
          description: t('imageUpload.draftHint'),
        })
      }

      resetDialog()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : ''
      const msg = errorMessage.includes('already exists')
        ? t('imageUpload.productAlreadyExists')
        : (errorMessage || (options.isDraft ? t('imageUpload.failedToDraft') : t('imageUpload.failedToCreate')))
      setError(msg)
      setStep('review')
    }
  }, [storageId, productName, anonId, safety, taste, price, storeName, analysis, realImageUrl, coords, createProductAndVote, onSuccess, resetDialog, t])

  const handleSaveAsDraft = useCallback(() => submitProduct({ isDraft: true }), [submitProduct])
  const handleSubmit = useCallback(() => submitProduct({ isDraft: false }), [submitProduct])

  return {
    // Dialog
    open, setOpen,
    step, setStep,
    // Image
    imageFile, imagePreview, error, isDragging,
    // AI
    analysis,
    // Form
    productName, setProductName,
    safety, setSafety,
    taste, setTaste,
    price, setPrice,
    storeName, setStoreName,
    fineTuneOpen, setFineTuneOpen,
    // Geo
    geoLoading, coords, geoError,
    // Online
    isOnline,
    // Handlers
    handleFileSelect,
    handleSmartCameraPhoto,
    handleBarcodeScan,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUploadAndAnalyze,
    handleSaveAsDraft,
    handleSubmit,
    resetDialog,
    // Refs
    fileInputRef,
    // i18n
    t,
  }
}
