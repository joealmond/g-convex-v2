import { publicAction } from './lib/customFunctions'
import { v } from 'convex/values'


const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 2000

/**
 * Helper to call Gemini API with retry logic for 429 errors
 */
async function callGeminiWithRetry(
  url: string,
  body: string,
  retries = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (response.status === 429 && retries > 0) {
    // Parse retry delay from error response if available
    let delayMs = BASE_RETRY_DELAY_MS * (MAX_RETRIES - retries + 1) // exponential backoff
    try {
      const errorText = await response.text()
      const errJson = JSON.parse(errorText)
      const retryDetail = errJson?.error?.details?.find(
        (d: { ['@type']?: string }) => d['@type']?.includes('RetryInfo')
      )
      if (retryDetail?.retryDelay) {
        const parsed = parseInt(retryDetail.retryDelay, 10)
        if (!isNaN(parsed) && parsed > 0) {
          delayMs = parsed * 1000
        }
      }
    } catch {
      // Use default backoff
    }

    console.log(`Gemini 429 rate limit, retrying in ${delayMs}ms (${retries} retries left)`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return callGeminiWithRetry(url, body, retries - 1)
  }

  return response
}

/**
 * Analyze a product image using Google Gemini AI
 * Returns product name, safety/taste scores, and ingredient tags
 */
export const analyzeImage = publicAction({
  args: {
    storageId: v.optional(v.id('_storage')),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) {
      console.warn('GOOGLE_API_KEY not set - AI analysis disabled')
      return {
        success: false,
        error: 'AI analysis not configured. Set GOOGLE_API_KEY in Convex dashboard.',
      }
    }

    if (!args.storageId && !args.imageUrl) {
      return { success: false, error: 'Must provide either storageId or imageUrl' }
    }

    // Get image URL from Convex storage or use provided URL
    let imageUrl = args.imageUrl
    if (!imageUrl && args.storageId) {
       const url = await ctx.storage.getUrl(args.storageId)
       if (url) imageUrl = url
    }
    
    if (!imageUrl) {
      return { success: false, error: 'Image not found in storage', imageUrl: undefined }
    }

    try {
      // Fetch image and convert to base64
      const response = await fetch(imageUrl)
      const buffer = await response.arrayBuffer()

      // Check file size (max 10MB for Gemini)
      if (buffer.byteLength > 10 * 1024 * 1024) {
        return { success: false, error: 'Image too large (max 10MB)' }
      }

      // Convert ArrayBuffer to base64 using web-standard APIs (V8 compatible)
      const uint8Array = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]!)
      }
      const base64Image = btoa(binary)
      const mimeType = response.headers.get('content-type') || 'image/jpeg'

      // Call Gemini API directly (without SDK for smaller bundle)
      // Includes retry logic for 429 rate limit errors
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const geminiBody = JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this food product image. You are helping users with gluten sensitivities evaluate products.

Return a JSON object with:
- productName (string): Name of the product (be specific)
- reasoning (string): Brief analysis of why you gave these scores
- safety (number): 0-100 gluten safety score (100 = definitely gluten-free, 0 = contains gluten)
- taste (number): 0-100 predicted taste quality based on ingredients/brand
- tags (array of strings): Key ingredients or descriptors
- containsGluten (boolean): true if product likely contains gluten
- warnings (array of strings): Any allergen warnings visible
- suggestedFreeFrom (array of strings): Which of these allergens the product appears to be FREE FROM based on packaging claims, ingredient visibility, or certifications: "gluten", "milk", "soy", "nuts", "eggs". Only include allergens you have reasonable confidence the product does NOT contain.

Only return valid JSON, no markdown formatting.`,
              },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      })

      const geminiResponse = await callGeminiWithRetry(geminiUrl, geminiBody)

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('Gemini API error:', geminiResponse.status, errorText)
        return { success: false, error: 'AI analysis is currently unavailable. You can fill in the details manually.', imageUrl }
      }

      const geminiData = await geminiResponse.json()
      const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

      if (!textContent) {
        return { success: false, error: 'AI analysis is currently unavailable. You can fill in the details manually.', imageUrl }
      }

      // Parse JSON from response (handle potential markdown wrapping)
      let analysis
      try {
        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', textContent)
        return { success: false, error: 'AI analysis is currently unavailable. You can fill in the details manually.', imageUrl }
      }

      return {
        success: true,
        analysis: {
          productName: analysis.productName || 'Unknown Product',
          reasoning: analysis.reasoning || '',
          safety: Math.min(100, Math.max(0, analysis.safety || 50)),
          taste: Math.min(100, Math.max(0, analysis.taste || 50)),
          tags: Array.isArray(analysis.tags) ? analysis.tags : [],
          containsGluten: analysis.containsGluten === true,
          warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
          suggestedFreeFrom: Array.isArray(analysis.suggestedFreeFrom) ? analysis.suggestedFreeFrom : [],
        },
        imageUrl,
      }
    } catch (error: unknown) {
      console.error('AI analysis error:', error)
      return {
        success: false,
        error: 'AI analysis is currently unavailable. You can fill in the details manually.',
        imageUrl,
      }
    }
  },
})

/**
 * Analyze a back-of-package ingredients image using Google Gemini AI
 * Performs OCR on the ingredient label and detects allergens
 */
export const analyzeIngredients = publicAction({
  args: {
    imageUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) {
      console.warn('GOOGLE_API_KEY not set - ingredient analysis disabled')
      return {
        success: false as const,
        error: 'AI analysis not configured.',
      }
    }

    try {
      // Fetch image and convert to base64
      const response = await fetch(args.imageUrl)
      const buffer = await response.arrayBuffer()

      if (buffer.byteLength > 10 * 1024 * 1024) {
        return { success: false as const, error: 'Image too large (max 10MB)' }
      }

      const uint8Array = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]!)
      }
      const base64Image = btoa(binary)
      const mimeType = response.headers.get('content-type') || 'image/jpeg'

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const geminiBody = JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are analyzing the back of a food product package. Your task is to:

1. Perform OCR on the ingredients list. Transcribe the full ingredients text exactly as printed on the label.
2. Identify which of these specific allergens are PRESENT in the ingredients: gluten (wheat, rye, barley, oats, spelt, kamut), milk (dairy, lactose, casein, whey), soy (soybean, soya), nuts (tree nuts, peanuts, almonds, cashews, hazelnuts, walnuts, pecans, pistachios, macadamia), eggs (egg, albumin, lysozyme).
3. Determine which of those 5 allergens the product is FREE FROM (not present in ingredients).

Return a JSON object with:
- ingredientsText (string): The full OCR text of the ingredients list, preserving original formatting
- detectedAllergens (array of strings): Allergen IDs found in ingredients. Use exactly these IDs: "gluten", "milk", "soy", "nuts", "eggs"
- suggestedFreeFrom (array of strings): Allergen IDs that are NOT present. Use same IDs.
- warnings (array of strings): Any "may contain", "traces of", cross-contamination warnings
- confidence (string): "high", "medium", or "low" — how confident you are in the OCR quality

Only return valid JSON, no markdown formatting.`,
              },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      })

      const geminiResponse = await callGeminiWithRetry(geminiUrl, geminiBody)

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('Gemini API error (ingredients):', geminiResponse.status, errorText)
        return { success: false as const, error: 'AI ingredient analysis is currently unavailable.' }
      }

      const geminiData = await geminiResponse.json()
      const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

      if (!textContent) {
        return { success: false as const, error: 'AI ingredient analysis returned no result.' }
      }

      let analysis
      try {
        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch {
        console.error('Failed to parse ingredient AI response:', textContent)
        return { success: false as const, error: 'Failed to parse ingredient analysis.' }
      }

      const validAllergenIds = ['gluten', 'milk', 'soy', 'nuts', 'eggs']
      const filterValidIds = (arr: unknown): string[] =>
        Array.isArray(arr) ? arr.filter((id): id is string => typeof id === 'string' && validAllergenIds.includes(id)) : []

      return {
        success: true as const,
        ingredientsText: typeof analysis.ingredientsText === 'string' ? analysis.ingredientsText : '',
        detectedAllergens: filterValidIds(analysis.detectedAllergens),
        suggestedFreeFrom: filterValidIds(analysis.suggestedFreeFrom),
        warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
        confidence: ['high', 'medium', 'low'].includes(analysis.confidence) ? analysis.confidence as string : 'medium',
      }
    } catch (error: unknown) {
      console.error('Ingredient analysis error:', error)
      return {
        success: false as const,
        error: 'AI ingredient analysis failed.',
      }
    }
  },
})
