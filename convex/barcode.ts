import { v } from 'convex/values'
import { action, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { Doc } from './_generated/dataModel'

type BarcodeResult =
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
      productData: {
        name: string
        brand?: string
        category?: string
        ingredients: string[]
        allergens: string[]
        nutritionScore?: string
        servingSize?: string
        imageUrl?: string
        barcode: string
      }
    }
  | {
      found: false
      source: 'openfoodfacts'
      error: string
    }

/**
 * Look up a product by barcode using the Open Food Facts API.
 * Also checks if the product already exists in our database.
 */
export const lookupBarcode = action({
  args: {
    barcode: v.string(),
  },
  handler: async (ctx, { barcode }): Promise<BarcodeResult> => {
    // 1. Check if product already exists in our DB
    const existing: Doc<'products'> | null = await ctx.runQuery(internal.barcode.findByBarcode, { barcode })

    if (existing) {
      return {
        found: true,
        existingProduct: {
          _id: existing._id,
          name: existing.name,
          barcode: existing.barcode,
          imageUrl: existing.imageUrl,
        },
        source: 'local' as const,
      }
    }

    // 2. Look up on Open Food Facts API
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,categories,ingredients_text,allergens,nutriscore_grade,serving_size,image_front_url,image_url`,
        {
          headers: {
            'User-Agent': 'G-Matrix/1.0 (gmatrix-app)',
          },
        }
      )

      if (!response.ok) {
        return { found: false, source: 'openfoodfacts' as const, error: 'API request failed' }
      }

      const data = await response.json()

      if (data.status !== 1 || !data.product) {
        return { found: false, source: 'openfoodfacts' as const, error: 'Product not found in database' }
      }

      const product = data.product
      const productName = product.product_name || product.brands || 'Unknown Product'
      const allergensList = product.allergens
        ? product.allergens.split(',').map((a: string) => a.replace('en:', '').trim()).filter(Boolean)
        : []

      return {
        found: true,
        source: 'openfoodfacts' as const,
        productData: {
          name: productName,
          brand: product.brands || undefined,
          category: product.categories?.split(',')[0]?.trim() || undefined,
          ingredients: product.ingredients_text
            ? product.ingredients_text.split(',').map((i: string) => i.trim()).filter(Boolean)
            : [],
          allergens: allergensList,
          nutritionScore: product.nutriscore_grade || undefined,
          servingSize: product.serving_size || undefined,
          imageUrl: product.image_front_url || product.image_url || undefined,
          barcode,
        },
      }
    } catch (error: any) {
      console.error('Open Food Facts API error:', error)
      return {
        found: false,
        source: 'openfoodfacts' as const,
        error: error.message || 'Failed to look up barcode',
      }
    }
  },
})

/**
 * Find a product by barcode in our database.
 * Used internally by lookupBarcode action.
 */
export const findByBarcode = internalQuery({
  args: { barcode: v.string() },
  handler: async (ctx, { barcode }) => {
    if (!barcode) return null
    return await ctx.db
      .query('products')
      .withIndex('by_barcode', (q) => q.eq('barcode', barcode))
      .first()
  },
})
