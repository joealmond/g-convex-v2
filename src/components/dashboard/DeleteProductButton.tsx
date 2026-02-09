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
import { useTranslation } from '@/hooks/use-translation'

interface DeleteProductButtonProps {
  product: Product
  onDeleted?: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
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
  className,
  children,
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteProduct = useMutation(api.products.deleteProduct)
  const { t } = useTranslation()

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
        className={`${className || ''}`}
        onClick={() => setOpen(true)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : children ? (
          children
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProduct.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteProduct.confirm', { name: product.name })}
              <br />
              <br />
              {t('deleteProduct.warning', { count: product.voteCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('deleteProduct.deleteProduct')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
