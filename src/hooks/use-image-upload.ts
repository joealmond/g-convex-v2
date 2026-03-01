import { useState, useCallback, useEffect } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useTranslation } from '@/hooks/use-translation'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useHaptics } from '@/hooks/use-haptics'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import type { CaptureResult } from '@/components/product/CameraWizard'

export type ImageUploadStep = 'wizard' | 'processing' | 'review' | 'submitting'

export interface ImageAnalysis {
  productName: string
  reasoning: string
  safety: number
  taste: number
  tags: string[]
  containsGluten: boolean
  warnings: string[]
  suggestedFreeFrom?: string[]
}

export interface BackAnalysis {
  ingredientsText: string
  detectedAllergens: string[]
  suggestedFreeFrom: string[]
  warnings: string[]
  confidence: string
}

interface UseImageUploadOptions {
  onSuccess?: (productId: string) => void
}

export function useImageUpload({ onSuccess }: UseImageUploadOptions = {}) {
  const { isOnline } = useOnlineStatus()
  const { impact } = useHaptics()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImageUploadStep>('wizard')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [realImageUrl, setRealImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Processing progress (shown during 'processing' step)
  const [processingStatus, setProcessingStatus] = useState('')

  // Front image AI analysis
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [productName, setProductName] = useState('')
  const [safety, setSafety] = useState(50)
  const [taste, setTaste] = useState(50)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [storeName, setStoreName] = useState('')
  const [allergens, setAllergens] = useState<string[]>([])

  // Free-from sensitivities (user-reviewed)
  const [freeFrom, setFreeFrom] = useState<Set<string>>(new Set())

  // Back image
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [ingredientsText, setIngredientsText] = useState<string>('')

  // Barcode & OpenFoodFacts metadata
  const [barcode, setBarcode] = useState<string | null>(null)
  const [barcodeSource, setBarcodeSource] = useState<string | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [nutritionScore, setNutritionScore] = useState<string | null>(null)

  const { anonId } = useAnonymousId()
  const { t } = useTranslation()
  const {
    coords,
    requestLocation,
    loading: geoLoading,
    error: geoError,
    permissionStatus,
    requestPermissions,
  } = useGeolocation()

  // Auto-request location when entering review step
  useEffect(() => {
    if (open && step === 'review') {
      requestLocation()
    }
  }, [open, step, requestLocation])

  // Revoke blob URLs on change / unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Convex mutations / actions
  const uploadToR2 = useAction(api.r2.uploadToR2)
  const analyzeImage = useAction(api.ai.analyzeImage)
  const analyzeIngredients = useAction(api.ai.analyzeIngredients)
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

  /** Helper to upload an image file to R2 and return the public URL */
  const uploadFileToR2 = useCallback(async (file: File): Promise<string> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        if (!base64) reject(new Error('Failed to convert to base64'))
        else resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    const { publicUrl } = await uploadToR2({ base64Data, contentType: file.type })
    return publicUrl
  }, [uploadToR2])

  /** Toggle a freeFrom allergen */
  const handleFreeFromToggle = useCallback((id: string) => {
    setFreeFrom((prev) => {
      const updated = new Set(prev)
      if (updated.has(id)) {
        updated.delete(id)
      } else {
        updated.add(id)
      }
      return updated
    })
  }, [])

  const resetDialog = useCallback(() => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    // NOTE: Do NOT setStep('wizard') here — resetDialog is called while
    // the dialog may still be mounted for one frame, and setting step to
    // 'wizard' would briefly remount CameraWizard, restarting the native
    // camera. Step is reset to 'wizard' in handleOpenChange when the
    // dialog actually opens.
    setImagePreview(null)
    setRealImageUrl(null)
    setAnalysis(null)
    setProductName('')
    setSafety(50)
    setTaste(50)
    setPrice(undefined)
    setStoreName('')
    setAllergens([])
    setFreeFrom(new Set())
    setBackImageUrl(null)
    setIngredientsText('')
    setProcessingStatus('')
    setError(null)
    setBarcode(null)
    setBarcodeSource(null)
    setBrand(null)
    setCategory(null)
    setNutritionScore(null)
  }, [imagePreview])

  /**
   * Handle wizard completion — process all captures in parallel.
   * Uploads images, runs AI analysis, looks up barcode, then moves to review.
   */
  const handleWizardComplete = useCallback(async (captures: CaptureResult) => {
    setStep('processing')
    setError(null)

    // Always store the detected barcode (even if OFF lookup fails)
    if (captures.detectedBarcode) {
      setBarcode(captures.detectedBarcode)
      setBarcodeSource('manual') // Will be upgraded to 'openfoodfacts' if found
    }

    try {
      // ── 1. Upload front image (required) ──
      if (!captures.frontImage) {
        setError(t('imageUpload.provideProductName'))
        // Go to review (not wizard) — going back to wizard remounts the
        // camera which was already stopped by finishWizard.
        setStep('review')
        return
      }

      setProcessingStatus(t('cameraWizard.processingFront'))

      const resizedFront = await resizeAndConvertImage(captures.frontImage)
      const frontPreview = URL.createObjectURL(resizedFront)
      setImagePreview(frontPreview)

      // Run tasks in parallel where possible
      const uploadPromise = uploadFileToR2(resizedFront)

      // Also resize + upload back image if provided
      let backUploadPromise: Promise<string | null> = Promise.resolve(null)
      if (captures.backImage) {
        backUploadPromise = resizeAndConvertImage(captures.backImage)
          .then((resized) => uploadFileToR2(resized))
          .catch((err) => {
            logger.error('Back image upload failed:', err)
            return null
          })
      }

      // Wait for front upload, then start AI analysis
      const frontUrl = await uploadPromise
      setRealImageUrl(frontUrl)

      // ── 2. Analyze front image with AI ──
      setProcessingStatus(t('imageUpload.aiAnalyzing'))
      const aiPromise = analyzeImage({ imageUrl: frontUrl }).catch((err) => {
        logger.error('AI analysis failed:', err)
        return { success: false as const, error: 'AI analysis unavailable', imageUrl: frontUrl, analysis: null }
      })

      // ── 3. Analyze back image (if provided) ──
      let ingredientsPromise: Promise<{
        success: boolean
        ingredientsText?: string
        detectedAllergens?: string[]
        suggestedFreeFrom?: string[]
        warnings?: string[]
        confidence?: string
        error?: string
      } | null> = Promise.resolve(null)

      if (captures.backImage) {
        setProcessingStatus(t('cameraWizard.processingBack'))
        ingredientsPromise = backUploadPromise.then(async (backUrl) => {
          if (!backUrl) return null
          setBackImageUrl(backUrl)
          return analyzeIngredients({ imageUrl: backUrl }).catch((err) => {
            logger.error('Ingredient analysis failed:', err)
            return null
          })
        })
      }

      // ── 4. Look up barcode (if detected) ──
      let barcodePromise: Promise<{
        found: boolean
        source?: string
        existingProduct?: { name: string }
        productData?: { name: string; imageUrl?: string; allergens?: string[] }
      } | null> = Promise.resolve(null)

      if (captures.detectedBarcode) {
        setProcessingStatus(t('cameraWizard.processingBarcode'))
        barcodePromise = lookupBarcode({ barcode: captures.detectedBarcode }).catch((err) => {
          logger.error('Barcode lookup failed:', err)
          return null
        })
      }

      // ── Wait for all parallel tasks ──
      const [aiResult, ingredientsResult, barcodeResult] = await Promise.all([
        aiPromise,
        ingredientsPromise,
        barcodePromise,
      ])

      // ── 5. Check if product already exists via barcode ──
      if (barcodeResult?.found && barcodeResult.source === 'local' && barcodeResult.existingProduct) {
        toast.info(t('smartCamera.existingProduct'), {
          description: barcodeResult.existingProduct.name,
          action: {
            label: t('smartCamera.viewProduct'),
            onClick: () => {
              setOpen(false)
              resetDialog()
              window.location.href = `/product/${encodeURIComponent(barcodeResult.existingProduct!.name)}`
            },
          },
        })
        // Close the dialog instead of going back to wizard (which would
        // remount the camera after it was already stopped).
        setOpen(false)
        resetDialog()
        return
      }

      // ── 6. Apply AI front analysis results ──
      if (aiResult && aiResult.success && aiResult.analysis) {
        setAnalysis(aiResult.analysis)
        setProductName(aiResult.analysis.productName)
        setSafety(aiResult.analysis.safety)
        setTaste(aiResult.analysis.taste)
        if (aiResult.analysis.containsGluten) {
          setAllergens((prev) => [...new Set([...prev, 'gluten'])])
        }
        if (aiResult.analysis.suggestedFreeFrom?.length) {
          setFreeFrom(new Set(aiResult.analysis.suggestedFreeFrom))
        }
        if (aiResult.imageUrl) setRealImageUrl(aiResult.imageUrl)
      } else {
        // AI failed — user can fill in manually
        if (aiResult?.error) {
          setError(aiResult.error)
        }
        setProductName('')
        setSafety(50)
        setTaste(50)
      }

      // ── 7. Apply barcode lookup data (OpenFoodFacts) ──
      if (barcodeResult?.found && barcodeResult.source === 'openfoodfacts' && barcodeResult.productData) {
        const pd = barcodeResult.productData as {
          name: string; brand?: string; category?: string;
          ingredients?: string[]; allergens?: string[];
          nutritionScore?: string; servingSize?: string; imageUrl?: string;
          barcode?: string
        }
        // Store barcode metadata
        setBarcodeSource('openfoodfacts')
        if (pd.brand) setBrand(pd.brand)
        if (pd.category) setCategory(pd.category)
        if (pd.nutritionScore) setNutritionScore(pd.nutritionScore.toLowerCase())

        // Use barcode product name if AI didn't produce one
        if (!productName) {
          setProductName(pd.name)
        }

        // Map Nutri-Score → safety (only when AI analysis failed)
        const scoreMap: Record<string, number> = { a: 80, b: 65, c: 50, d: 35, e: 20 }
        const offSafety = scoreMap[pd.nutritionScore?.toLowerCase() ?? '']
        if (offSafety && !(aiResult && aiResult.success && aiResult.analysis)) {
          setSafety(offSafety)
        }

        // Use OFF image as fallback if front upload returned nothing
        if (!frontUrl && pd.imageUrl) {
          setRealImageUrl(pd.imageUrl)
        }

        // Merge OFF ingredients as tags when AI produced none
        if (pd.ingredients?.length && !(aiResult?.analysis?.tags?.length)) {
          setAnalysis((prev) => prev ? { ...prev, tags: pd.ingredients! } : null)
        }

        if (pd.allergens?.length) {
          setAllergens((prev) => [
            ...new Set([...prev, ...pd.allergens!.map((a: string) => a.toLowerCase())]),
          ])
        }
        impact('medium')
        toast.success(t('smartCamera.barcodeFound'))
      }

      // ── 8. Apply back image / ingredients results ──
      if (ingredientsResult && ingredientsResult.success) {
        setIngredientsText(ingredientsResult.ingredientsText ?? '')
        // Merge freeFrom suggestions
        if (ingredientsResult.suggestedFreeFrom?.length) {
          setFreeFrom((prev) => {
            const merged = new Set(prev)
            ingredientsResult.suggestedFreeFrom!.forEach((id) => merged.add(id))
            return merged
          })
        }
        // Merge detected allergens
        if (ingredientsResult.detectedAllergens?.length) {
          setAllergens((prev) => [...new Set([...prev, ...ingredientsResult.detectedAllergens!])])
          // Remove detected allergens from freeFrom (they conflict)
          setFreeFrom((prev) => {
            const updated = new Set(prev)
            ingredientsResult.detectedAllergens!.forEach((id) => updated.delete(id))
            return updated
          })
        }
      }

      impact('medium')
      setProcessingStatus(t('cameraWizard.processingComplete'))

      // Move to review
      setStep('review')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      logger.error('Wizard processing failed:', err)
      setError(errorMessage)
      // Go to review with defaults — going back to wizard would remount
      // the camera after it was already stopped by finishWizard.
      setStep('review')
    }
  }, [
    resizeAndConvertImage, uploadFileToR2, analyzeImage, analyzeIngredients,
    lookupBarcode, impact, t, resetDialog, productName,
  ])

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
        imageStorageId: undefined,
        anonymousId: anonId ?? undefined,
        safety,
        taste,
        price,
        storeName: storeName || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        ingredients: analysis?.tags,
        allergens: allergens.length > 0 ? allergens : undefined,
        freeFrom: freeFrom.size > 0 ? [...freeFrom] : undefined,
        ingredientsText: ingredientsText || undefined,
        backImageUrl2: backImageUrl || undefined,
        aiAnalysis: analysis ?? undefined,
        barcode: barcode || undefined,
        barcodeSource: barcodeSource || undefined,
        brand: brand || undefined,
        category: category || undefined,
        nutritionScore: nutritionScore || undefined,
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
  }, [productName, anonId, safety, taste, price, storeName, allergens, freeFrom, ingredientsText, backImageUrl, analysis, realImageUrl, coords, createProductAndVote, onSuccess, resetDialog, t, barcode, barcodeSource, brand, category, nutritionScore])

  const handleSaveAsDraft = useCallback(() => submitProduct({ isDraft: true }), [submitProduct])
  const handleSubmit = useCallback(() => submitProduct({ isDraft: false }), [submitProduct])

  return {
    // Dialog
    open, setOpen,
    step, setStep,
    // Image
    imagePreview, error,
    // Processing
    processingStatus,
    // AI
    analysis,
    // Form
    productName, setProductName,
    safety, setSafety,
    taste, setTaste,
    price, setPrice,
    storeName, setStoreName,
    // Free-from sensitivities
    freeFrom, handleFreeFromToggle,
    // Ingredients
    ingredientsText,
    // Geo
    geoLoading, coords, geoError, permissionStatus, requestPermissions, requestLocation,
    // Online
    isOnline,
    // Handlers
    handleWizardComplete,
    handleSaveAsDraft,
    handleSubmit,
    resetDialog,
    // i18n
    t,
  }
}
