import { describe, expect, it } from 'vitest'

import {
  getOpenFoodFactsSafetyScore,
  getPreferredProductName,
  isLocalBarcodeMatch,
  isOpenFoodFactsBarcodeMatch,
  mergeNormalizedIds,
  resolveImageUploadDataSource,
  type BarcodeLookupResult,
} from './image-upload'

describe('image-upload helpers', () => {
  it('prefers the AI product name over barcode metadata', () => {
    expect(getPreferredProductName('AI Name', 'Barcode Name')).toBe('AI Name')
  })

  it('falls back to barcode metadata when AI product name is empty', () => {
    expect(getPreferredProductName('   ', 'Barcode Name')).toBe('Barcode Name')
  })

  it('normalizes and deduplicates allergen ids', () => {
    expect(mergeNormalizedIds([' Gluten ', 'milk'], ['gluten', 'SOY'])).toEqual([
      'gluten',
      'milk',
      'soy',
    ])
  })

  it('maps known Open Food Facts nutrition grades to safety scores', () => {
    expect(getOpenFoodFactsSafetyScore('A')).toBe(80)
    expect(getOpenFoodFactsSafetyScore('e')).toBe(20)
    expect(getOpenFoodFactsSafetyScore('unknown')).toBeUndefined()
  })

  it('narrows local barcode matches', () => {
    const result: BarcodeLookupResult = {
      found: true,
      source: 'local',
      existingProduct: { _id: 'p1', name: 'Existing Product' },
    }

    expect(isLocalBarcodeMatch(result)).toBe(true)
    expect(isOpenFoodFactsBarcodeMatch(result)).toBe(false)
  })

  it('narrows Open Food Facts barcode matches', () => {
    const result: BarcodeLookupResult = {
      found: true,
      source: 'openfoodfacts',
      productData: {
        name: 'OFF Product',
        ingredients: [],
        allergens: [],
        hasAllergenData: true,
        barcode: '123',
      },
    }

    expect(isOpenFoodFactsBarcodeMatch(result)).toBe(true)
    expect(isLocalBarcodeMatch(result)).toBe(false)
  })

  it('prioritizes Open Food Facts when allergen data is present', () => {
    const result: BarcodeLookupResult = {
      found: true,
      source: 'openfoodfacts',
      productData: {
        name: 'OFF Product',
        ingredients: [],
        allergens: ['gluten'],
        hasAllergenData: true,
        barcode: '123',
      },
    }

    expect(resolveImageUploadDataSource({
      barcodeResult: result,
      ingredientsResult: { success: true },
      aiResult: { success: true, analysis: { productName: 'AI', safety: 50, taste: 50, tags: [], containsGluten: false } },
    })).toBe('openfoodfacts')
  })

  it('falls back from OCR to AI to community when richer sources are unavailable', () => {
    expect(resolveImageUploadDataSource({
      ingredientsResult: { success: true },
      aiResult: { success: true, analysis: { productName: 'AI', safety: 50, taste: 50, tags: [], containsGluten: false } },
    })).toBe('ai-ingredients')

    expect(resolveImageUploadDataSource({
      aiResult: { success: true, analysis: { productName: 'AI', safety: 50, taste: 50, tags: [], containsGluten: false } },
    })).toBe('ai-estimate')

    expect(resolveImageUploadDataSource({})).toBe('community')
  })
})