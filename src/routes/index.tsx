import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useState } from 'react'
import { MatrixChart } from '@/components/dashboard/MatrixChart'
import { ProductList } from '@/components/dashboard/ProductList'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { AddProductDialog } from '@/components/dashboard/AddProductDialog'
import { Navigation } from '@/components/Navigation'
import { Loader2, Trophy, Flame, TrendingUp } from 'lucide-react'
import type { Product } from '@/lib/types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const products = useQuery(api.products.list)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const isLoading = products === undefined

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Gamification Widgets for Logged-in Users */}
        {user && profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="Your Points"
              value={profile.points}
              subtitle={`${profile.totalVotes} votes cast`}
              icon={Trophy}
              iconColor="text-yellow-500"
            />
            <StatsCard
              title="Current Streak"
              value={`${profile.streak} days`}
              subtitle="Keep voting daily!"
              icon={Flame}
              iconColor="text-orange-500"
            />
            <StatsCard
              title="Badges Earned"
              value={profile.badges?.length || 0}
              subtitle={`Keep contributing!`}
              icon={TrendingUp}
              iconColor="text-purple-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product List */}
          <div className="lg:col-span-2 space-y-6">
            {/* G-Matrix Chart */}
            <div className="border border-border rounded-lg bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">G-Matrix Visualization</h2>

              {isLoading ? (
                <div className="flex items-center justify-center h-[500px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : products && products.length > 0 ? (
                <div className="h-[500px]">
                  <MatrixChart
                    products={products}
                    onProductClick={setSelectedProduct}
                    selectedProduct={selectedProduct}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <p className="text-lg mb-2">No products yet</p>
                  <p className="text-sm">Add your first product to get started!</p>
                </div>
              )}
            </div>

            {/* Product List */}
            <div className="border border-border rounded-lg bg-card">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ProductList
                  products={products || []}
                  onProductSelect={setSelectedProduct}
                  selectedProduct={selectedProduct}
                  onAddProduct={() => {}}
                  renderAddButton={() => <AddProductDialog />}
                />
              )}
            </div>
          </div>

          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard limit={10} />
          </div>
        </div>
      </main>
    </div>
  )
}
