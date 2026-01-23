import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'
import { ProductCard } from './ProductCard'
import type { Product } from '@/lib/types'

interface ProductListProps {
  products: Product[]
  onProductSelect?: (product: Product) => void
  selectedProduct?: Product | null
  onAddProduct?: () => void
  renderAddButton?: () => React.ReactNode
}

/**
 * Product list with search functionality
 */
export function ProductList({
  products,
  onProductSelect,
  selectedProduct,
  onAddProduct,
  renderAddButton,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter products by search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort by total votes (descending)
  const sortedProducts = [...filteredProducts].sort(
    (a, b) => b.voteCount - a.voteCount
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Products</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredProducts.length})
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Add Product Button */}
        {(onAddProduct || renderAddButton) && (
          <div className="mt-3">
            {renderAddButton ? (
              renderAddButton()
            ) : (
              <Button onClick={onAddProduct} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'No products found' : 'No products yet'}
          </div>
        ) : (
          sortedProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onClick={() => onProductSelect?.(product)}
              isSelected={selectedProduct?._id === product._id}
            />
          ))
        )}
      </div>
    </div>
  )
}
