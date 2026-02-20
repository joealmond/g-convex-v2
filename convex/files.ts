import { publicQuery, publicMutation, publicAction } from './lib/customFunctions'

import { v } from 'convex/values'

// Generate an upload URL for file uploads
// Allows both authenticated and anonymous users (for product image uploads)
export const generateUploadUrl = publicMutation({
  args: {},
  handler: async (ctx) => {
    // Generate a secure, pre-signed upload URL for Convex Storage
    return await ctx.storage.generateUploadUrl()
  },
})

// Generate an upload URL for Cloudflare R2
export const generateR2UploadUrl = publicAction({
  args: {
    contentType: v.string(),
  },
  handler: async (_ctx, args) => {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      throw new Error("Missing Cloudflare R2 configuration")
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    // Generate a unique filename using crypto.randomUUID()
    const fileExtension = args.contentType.split('/')[1] || 'bin'
    const fileName = `${crypto.randomUUID()}.${fileExtension}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      ContentType: args.contentType,
    })

    // URL expires in 1 hour
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
    
    // The public URL the file will have once uploaded
    // Use the custom domain if configured (R2_PUBLIC_URL), otherwise default
    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`

    return { uploadUrl, publicUrl }
  },
})

// Save file metadata after upload
export const saveFile = publicMutation({
  args: {
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Must be authenticated to save files')
    }

    return await ctx.db.insert('files', {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      size: args.size,
      uploadedBy: identity.subject,
      createdAt: Date.now(),
    })
  },
})

// List user's files
export const listMyFiles = publicQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const files = await ctx.db
      .query('files')
      .withIndex('by_uploader', (q) => q.eq('uploadedBy', identity.subject))
      .collect()

    // Add download URLs
    return await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    )
  },
})

// Delete a file
export const deleteFile = publicMutation({
  args: {
    id: v.id('files'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Must be authenticated')
    }

    const file = await ctx.db.get(args.id)
    if (!file) {
      throw new Error('File not found')
    }

    if (file.uploadedBy !== identity.subject) {
      throw new Error('Not authorized')
    }

    // Delete from storage and database
    await ctx.storage.delete(file.storageId)
    await ctx.db.delete(args.id)
  },
})
