import { useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Product } from '@/lib/types'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  ingredients: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ProductFormData = z.infer<typeof productSchema>

interface EditProductDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog for editing an existing product
 * Admin-only feature
 */
export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
  const updateProduct = useMutation(api.products.update)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '',
      imageUrl: product.imageUrl || '',
    },
  })

  // Reset form when product changes
  useEffect(() => {
    reset({
      name: product.name,
      ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '',
      imageUrl: product.imageUrl || '',
    })
  }, [product, reset])

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Split ingredients by comma if provided
      const ingredientsArray = data.ingredients
        ? data.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : undefined

      await updateProduct({
        id: product._id as Id<'products'>,
        name: data.name,
        ingredients: ingredientsArray,
        imageUrl: data.imageUrl || undefined,
      })

      toast.success('Product updated!', {
        description: `${data.name} has been updated.`,
      })

      onOpenChange(false)
    } catch (error: unknown) {
      toast.error('Failed to update product', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information. This will not affect existing votes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="e.g., Schär Gluten-Free Bread"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="edit-ingredients">Ingredients (comma-separated)</Label>
            <Input
              id="edit-ingredients"
              placeholder="e.g., rice flour, water, salt"
              {...register('ingredients')}
              disabled={isSubmitting}
            />
            {errors.ingredients && (
              <p className="text-sm text-destructive">{errors.ingredients.message}</p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="edit-imageUrl">Image URL</Label>
            <Input
              id="edit-imageUrl"
              type="url"
              placeholder="https://example.com/product.jpg"
              {...register('imageUrl')}
              disabled={isSubmitting}
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
