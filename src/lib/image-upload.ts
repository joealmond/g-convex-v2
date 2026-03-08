export type DataSource = 'openfoodfacts' | 'ai-ingredients' | 'ai-estimate' | 'community'

export interface OpenFoodFactsProductData {
  name: string
  brand?: string
  category?: string
  ingredients: string[]
  allergens: string[]
  hasAllergenData: boolean
  nutritionScore?: string
  servingSize?: string
  imageUrl?: string
  barcode: string
}

export type BarcodeLookupResult =
  | {
      found: true
      existingProduct: {
        _id: string
        name: string
        barcode?: string
        imageUrl?: string
      }
      source: 'local'
    }
  | {
      found: true
      source: 'openfoodfacts'
      productData: OpenFoodFactsProductData
    }
  | {
      found: false
      source: 'openfoodfacts'
      error: string
    }

export interface UploadImageAnalysisLike {
  productName: string
  safety: number
  taste: number
  tags: string[]
  containsGluten: boolean
  suggestedFreeFrom?: string[]
}

export interface UploadAiResultLike {
  success: boolean
  analysis?: UploadImageAnalysisLike | null
}

export interface UploadIngredientsResultLike {
  success: boolean
}

export function isLocalBarcodeMatch(
  result: BarcodeLookupResult | null | undefined,
): result is Extract<BarcodeLookupResult, { found: true; source: 'local' }> {
  return result?.found === true && result.source === 'local'
}

export function isOpenFoodFactsBarcodeMatch(
  result: BarcodeLookupResult | null | undefined,
): result is Extract<BarcodeLookupResult, { found: true; source: 'openfoodfacts' }> {
  return result?.found === true && result.source === 'openfoodfacts'
}

export function getPreferredProductName(
  aiProductName?: string | null,
  barcodeProductName?: string | null,
): string {
  const normalizedAi = aiProductName?.trim()
  if (normalizedAi) return normalizedAi

  const normalizedBarcode = barcodeProductName?.trim()
  if (normalizedBarcode) return normalizedBarcode

  return ''
}

export function mergeNormalizedIds(...lists: Array<Iterable<string> | null | undefined>): string[] {
  const merged = new Set<string>()

  for (const list of lists) {
    if (!list) continue

    for (const value of list) {
      const normalized = value.trim().toLowerCase()
      if (normalized) {
        merged.add(normalized)
      }
    }
  }

  return [...merged]
}

export function getOpenFoodFactsSafetyScore(nutritionScore?: string | null): number | undefined {
  const scoreMap: Record<string, number> = {
    a: 80,
    b: 65,
    c: 50,
    d: 35,
    e: 20,
  }

  if (!nutritionScore) return undefined
  return scoreMap[nutritionScore.trim().toLowerCase()]
}

export function resolveImageUploadDataSource(options: {
  barcodeResult?: BarcodeLookupResult | null
  ingredientsResult?: UploadIngredientsResultLike | null
  aiResult?: UploadAiResultLike | null
}): DataSource {
  if (
    isOpenFoodFactsBarcodeMatch(options.barcodeResult)
    && options.barcodeResult.productData.hasAllergenData
  ) {
    return 'openfoodfacts'
  }

  if (options.ingredientsResult?.success) {
    return 'ai-ingredients'
  }

  if (options.aiResult?.success && options.aiResult.analysis) {
    return 'ai-estimate'
  }

  return 'community'
}