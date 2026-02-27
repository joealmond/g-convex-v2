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

    // 1. Initialize S3 client just for signing the URL
    // We do NOT use s3.send(PutObjectCommand) because the AWS SDK's XML parser 
    // crashes in Convex Edge runtime (missing DOMParser).
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const s3 = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT ?? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
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

    // 2. Generate a Pre-signed URL
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      ContentType: args.contentType,
    })
    
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

    // 3. Perform the actual PUT request from the Convex Server using native fetch.
    // Ensure the signedUrl is strictly Path-Style (R2 requires this, and AWS SDK sometimes
    // ignores forcePathStyle depending on the endpoint format).
    let finalFetchUrl = signedUrl;
    const urlObj = new URL(signedUrl);
    
    // If AWS SDK generated a Virtual Hosted-Style URL (e.g. bucket.account.r2.cloudflarestorage.com)
    // we need to rewrite it to Path-Style (account.r2.cloudflarestorage.com/bucket)
    if (urlObj.hostname.startsWith(`${R2_BUCKET_NAME}.`)) {
        urlObj.hostname = urlObj.hostname.replace(`${R2_BUCKET_NAME}.`, '');
        urlObj.pathname = `/${R2_BUCKET_NAME}${urlObj.pathname}`;
        finalFetchUrl = urlObj.toString();
    }

    const response = await fetch(finalFetchUrl, {
      method: "PUT",
      headers: {
        "Content-Type": args.contentType,
      },
      body: binaryData,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to upload to R2 via fetch: ${response.status} ${response.statusText}. Details: ${errorText}. URL: ${signedUrl}`)
    }

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`
    return { publicUrl }
  },
})
