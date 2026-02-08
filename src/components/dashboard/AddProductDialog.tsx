import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { appConfig } from '@/lib/app-config'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  ingredients: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ProductFormData = z.infer<typeof productSchema>

interface AddProductDialogProps {
  trigger?: React.ReactNode
}

/**
 * Dialog for adding a new product to the database
 * Initializes with default averageSafety=50, averageTaste=50, voteCount=0
 */
export function AddProductDialog({ trigger }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const createProduct = useMutation(api.products.create)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      ingredients: '',
      imageUrl: '',
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Split ingredients by comma if provided
      const ingredientsArray = data.ingredients
        ? data.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : undefined

      await createProduct({
        name: data.name,
        ingredients: ingredientsArray,
        imageUrl: data.imageUrl || undefined,
      })

      toast.success('Product added!', {
        description: `${data.name} has been added to the database.`,
      })

      reset()
      setOpen(false)
    } catch (error: unknown) {
      toast.error('Failed to add product', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new {appConfig.categoryTerm} to {appConfig.appName}. Others can then rate it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Awesome Bread Brand"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
            <Input
              id="ingredients"
              placeholder="e.g., rice flour, water, salt"
              {...register('ingredients')}
              disabled={isSubmitting}
            />
            {errors.ingredients && (
              <p className="text-sm text-destructive">{errors.ingredients.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional. Separate multiple ingredients with commas.
            </p>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/product.jpg"
              {...register('imageUrl')}
              disabled={isSubmitting}
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional. Must be a valid URL.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
