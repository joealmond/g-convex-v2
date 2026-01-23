import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'

interface DeleteProductButtonProps {
  product: Product
  onDeleted?: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * Button with confirmation dialog for deleting a product
 * Admin-only feature - will also delete all votes associated with the product
 */
export function DeleteProductButton({
  product,
  onDeleted,
  variant = 'destructive',
  size = 'sm',
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteProduct = useMutation(api.products.deleteProduct)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProduct({ id: product._id as Id<'products'> })

      toast.success('Product deleted', {
        description: `${product.name} and all its votes have been removed.`,
      })

      setOpen(false)
      onDeleted?.()
    } catch (error: unknown) {
      toast.error('Failed to delete product', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{product.name}</strong>?
              <br />
              <br />
              This will permanently remove the product and all {product.voteCount} votes
              associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
