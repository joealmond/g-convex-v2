import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id, Doc } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Heart, MessageCircle, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatRelativeTimeI18n } from '@/lib/format-time'
import { CommentInput } from './CommentInput'

export type CommentWithLikes = Doc<'comments'> & {
  likesCount: number
  liked?: boolean
}

interface CommentItemProps {
  comment: CommentWithLikes
  replies: CommentWithLikes[]
  currentUserId?: string
  isAdmin: boolean
  productId: Id<'products'>
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * Single comment with like/reply/edit/delete actions and recursive replies
 */
export function CommentItem({
  comment,
  replies,
  currentUserId,
  isAdmin,
  productId,
  t,
}: CommentItemProps) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  
  const toggleLike = useMutation(api.comments?.toggleLike)
  const removeComment = useMutation(api.comments?.remove)
  const editComment = useMutation(api.comments?.edit)

  const isOwner = currentUserId && comment.userId === currentUserId
  const userLabel = `User #${comment.userId?.slice(-6) || '???'}`
  const initial = comment.userId?.charAt(0)?.toUpperCase() || '?'
  const isDeleted = comment.isDeleted

  const handleLike = async () => {
    if (!currentUserId) return
    try {
      await toggleLike({ commentId: comment._id })
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const handleDelete = async () => {
    try {
      await removeComment({
        commentId: comment._id,
      })
      toast.success(t('community.commentDeleted'))
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const handleEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed || !currentUserId) return
    try {
      await editComment({ commentId: comment._id, text: trimmed })
      setEditing(false)
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const timeAgo = formatRelativeTimeI18n(comment.createdAt, t)

  return (
    <div className="py-2">
      <div className="flex gap-2.5">
        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-foreground">{userLabel}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            {comment.isEdited && !isDeleted && (
              <span className="text-[10px] text-muted-foreground italic">{t('community.edited')}</span>
            )}
          </div>

          {/* Text */}
          {editing ? (
            <div className="flex gap-2 items-end mb-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                maxLength={500}
                className="flex-1 resize-none rounded-lg border border-border bg-card px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button size="sm" onClick={handleEdit} disabled={!editText.trim()}>
                {t('common.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <p className={cn('text-sm leading-relaxed', isDeleted && 'italic text-muted-foreground')}>
              {comment.text}
            </p>
          )}

          {/* Actions row */}
          {!isDeleted && !editing && (
            <div className="flex items-center gap-3 mt-1">
              {/* Like */}
              <button
                onClick={handleLike}
                disabled={!currentUserId}
                aria-label={t('community.like')}
                className={cn(
                  'flex items-center gap-1 text-[11px] transition-colors',
                  comment.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
                  !currentUserId && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Heart className={cn('h-3.5 w-3.5', comment.liked && 'fill-current')} />
                {comment.likesCount > 0 && comment.likesCount}
              </button>

              {/* Reply */}
              {currentUserId && !comment.parentId && (
                <button
                  onClick={() => setReplying(!replying)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {t('community.reply')}
                </button>
              )}

              {/* Edit (owner only) */}
              {isOwner && (
                <button
                  onClick={() => { setEditing(true); setEditText(comment.text) }}
                  aria-label={t('common.edit')}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}

              {/* Delete (owner or admin) */}
              {(isOwner || isAdmin) && (
                <button
                  onClick={handleDelete}
                  aria-label={t('common.delete')}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Reply input */}
          {replying && currentUserId && (
            <div className="mt-2">
              <CommentInput
                productId={productId}
                userId={currentUserId}
                parentId={comment._id}
                replyToName={userLabel}
                onCancel={() => setReplying(false)}
                t={t}
              />
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-2 ml-2 pl-3 border-l-2 border-border space-y-1">
              {replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  replies={[]}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  productId={productId}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
