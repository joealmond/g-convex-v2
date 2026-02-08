import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAdmin } from '@/hooks/use-admin'
import { Suspense, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddProductDialog } from '@/components/dashboard/AddProductDialog'
import { EditProductDialog } from '@/components/dashboard/EditProductDialog'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { AdminSettings } from '@/components/admin/AdminSettings'
import { Shield, ArrowLeft, Search, Users, TrendingUp, Package, Edit, Flag, Settings } from 'lucide-react'
import { getQuadrant, QUADRANTS } from '@/lib/types'
import type { Product } from '@/lib/types'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminLoading() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="h-32 bg-card animate-pulse rounded-2xl" />
      </div>
    </div>
  )
}

/**
 * SSR-safe wrapper — hooks are only called inside AdminPageContent
 * which is wrapped in a Suspense boundary.
 */
function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminPageContent />
    </Suspense>
  )
}

function AdminPageContent() {
  const navigate = useNavigate()
  const adminStatus = useAdmin()
  const user = useQuery(api.users.current)
  const products = useQuery(api.products.list)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Redirect if not admin
  if (adminStatus && !adminStatus.isAdmin || user === null) {
    navigate({ to: '/' })
    return null
  }

  if (!adminStatus || adminStatus.isLoading || user === undefined || products === undefined) {
    return <AdminLoading />
  }

  // Filter products by search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const totalProducts = products.length
  const totalVotes = products.reduce((sum, p) => sum + p.voteCount, 0)
  const avgVotesPerProduct = totalProducts > 0 ? (totalVotes / totalProducts).toFixed(1) : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Manage products and monitor community activity
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/reports">
                <Flag className="mr-2 h-4 w-4" />
                Reports
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Votes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalVotes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Votes/Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgVotesPerProduct}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Products and Settings */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
        {/* Products Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>
                  Add, edit, or remove products from the database
                </CardDescription>
              </div>
              <AddProductDialog />
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="space-y-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
                  const quadrantInfo = QUADRANTS[quadrant]

                  return (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          <Badge
                            variant="secondary"
                            style={{ backgroundColor: quadrantInfo?.color || '#cccccc', opacity: 0.7 }}
                          >
                            {quadrantInfo?.name || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Safety: {product.averageSafety.toFixed(0)} • Taste:{' '}
                            {product.averageTaste.toFixed(0)}
                          </span>
                          <span>•</span>
                          <span>{product.voteCount} votes</span>
                          <span>•</span>
                          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                        {product.ingredients && Array.isArray(product.ingredients) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Ingredients: {product.ingredients.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <DeleteProductButton product={product} />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {searchQuery
                      ? `No products found matching "${searchQuery}"`
                      : 'No products yet'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
    </div>
  )
}
