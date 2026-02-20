import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { useAdmin } from '@/hooks/use-admin'
import { CommentInput } from './CommentInput'
import { CommentItem } from './CommentItem'

interface ProductCommentsProps {
  productId: Id<'products'>
}

export function ProductComments({ productId }: ProductCommentsProps) {
  const { t } = useTranslation()
  const user = useQuery(api.users.current)
  const adminStatus = useAdmin()

  const comments = useQuery(api.comments?.getByProduct, {
    productId,
    userId: user?._id,
  })

  const isLoading = comments === undefined

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t('community.comments')}
          {comments && comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment input */}
        {user ? (
          <CommentInput productId={productId} userId={user._id} t={t} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('community.signInToComment')}
          </p>
        )}

        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-1">
            {/* Top-level comments */}
            {comments
              .filter((c) => !c.parentId)
              .map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  replies={comments.filter((c) => c.parentId === comment._id)}
                  currentUserId={user?._id}
                  isAdmin={!!adminStatus?.isAdmin}
                  productId={productId}
                  t={t}
                />
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('community.noComments')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
