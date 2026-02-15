import { ImageUploadDialog } from '../product/ImageUploadDialog'

interface AddProductDialogProps {
  trigger?: React.ReactNode
}

/**
 * Dialog for adding a new product
 * Wraps the ImageUploadDialog which provides camera upload and AI analysis
 */
export function AddProductDialog({ trigger }: AddProductDialogProps) {
  return (
    <ImageUploadDialog 
      trigger={trigger}
      onSuccess={(_productId) => {
        // Optional: redirect to product page or refresh list
        // Currently handled by ImageUploadDialog internal state and parent query invalidation
      }}
    />
  )
}
