import { v } from 'convex/values'
import { action } from './_generated/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * Upload a file to Cloudflare R2 (server-side, Node.js runtime)
 * 
 * The client sends base64-encoded image data, and the server uploads to R2.
 * This bypasses CORS issues with Capacitor iOS WKWebView (capacitor:// scheme).
 * 
 * Uses "use node" directive because @aws-sdk/client-s3 requires Node.js runtime.
 */
export const uploadToR2 = action({
  args: {
    base64Data: v.string(),
    contentType: v.string(),
  },
  handler: async (_ctx, args) => {

    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
    const R2_ENDPOINT = process.env.R2_ENDPOINT

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      throw new Error("Missing Cloudflare R2 configuration")
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT ?? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    // Generate a unique filename
    const fileExtension = args.contentType.split('/')[1] || 'bin'
    const fileName = `${crypto.randomUUID()}.${fileExtension}`

    // Decode base64 to binary (using web APIs, not Node.js Buffer)
    const binaryString = atob(args.base64Data)
    const binaryData = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i)
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      ContentType: args.contentType,
      Body: binaryData,
    })

    await s3.send(command)

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`
    return { publicUrl }
  },
})
