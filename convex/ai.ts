import { v } from 'convex/values'
import { action } from './_generated/server'

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
        (d: any) => d['@type']?.includes('RetryInfo')
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
export const analyzeImage = action({
  args: {
    storageId: v.id('_storage'),
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

    // Get image URL from Convex storage
    const imageUrl = await ctx.storage.getUrl(args.storageId)
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
        },
        imageUrl,
      }
    } catch (error: any) {
      console.error('AI analysis error:', error)
      return {
        success: false,
        error: 'AI analysis is currently unavailable. You can fill in the details manually.',
        imageUrl,
      }
    }
  },
})
