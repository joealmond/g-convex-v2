import { ImageUploadDialog } from '../product/ImageUploadDialog'

interface AddProductDialogProps {
  trigger?: React.ReactNode
  initiallyOpen?: boolean
}

/**
 * Dialog for adding a new product
 * Wraps the ImageUploadDialog which provides camera upload and AI analysis
 */
export function AddProductDialog({ trigger, initiallyOpen }: AddProductDialogProps) {
  return (
    <ImageUploadDialog 
      trigger={trigger}
      initiallyOpen={initiallyOpen}
      onSuccess={(_productId) => {
        // Optional: redirect to product page or refresh list
        // Currently handled by ImageUploadDialog internal state and parent query invalidation
      }}
    />
  )
}
