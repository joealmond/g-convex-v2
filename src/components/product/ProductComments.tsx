'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, MessageCircle, Trash2, Pencil, Send, X } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { useAdmin } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductCommentsProps {
  productId: Id<'products'>
}

export function ProductComments({ productId }: ProductCommentsProps) {
  const { t } = useTranslation()
  const user = useQuery(api.users.current)
  const adminStatus = useAdmin()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated API may not reflect new tables yet
  const comments = useQuery((api as any).comments?.getByProduct, {
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
              .filter((c: any) => !c.parentId)
              .map((comment: any) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  replies={comments.filter((c: any) => c.parentId === comment._id)}
                  currentUserId={user?._id}
                  isAdmin={!!adminStatus?.isAdmin}
                  productId={productId}
                  t={t}
                />
              ))}
            {/* Orphan replies (parentId set but parent filtered out) — shouldn't happen normally */}
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

/**
 * Comment input box
 */
function CommentInput({
  productId,
  userId,
  parentId,
  replyToName,
  onCancel,
  t,
}: {
  productId: Id<'products'>
  userId: string
  parentId?: Id<'comments'>
  replyToName?: string
  onCancel?: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postComment = useMutation((api as any).comments?.post)

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed || posting) return

    setPosting(true)
    try {
      await postComment({
        productId,
        userId,
        text: trimmed,
        parentId,
      })
      setText('')
      onCancel?.()
      toast.success(t('community.commentPosted'))
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes('too long')
          ? t('community.commentTooLong')
          : t('errors.generic')
      )
    } finally {
      setPosting(false)
    }
  }

  const placeholder = replyToName
    ? t('community.replyTo', { name: replyToName })
    : t('community.writeReview')

  return (
    <div className="flex gap-2 items-end">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={1}
        maxLength={500}
        className={cn(
          'flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
          'min-h-[40px] max-h-[120px]'
        )}
        onInput={(e) => {
          // Auto-resize textarea
          const el = e.currentTarget
          el.style.height = 'auto'
          el.style.height = Math.min(el.scrollHeight, 120) + 'px'
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />
      <div className="flex gap-1 flex-shrink-0">
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10">
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim() || posting}
          className="h-10 w-10 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Single comment + its replies
 */
function CommentItem({
  comment,
  replies,
  currentUserId,
  isAdmin,
  productId,
  t,
}: {
  comment: any
  replies: any[]
  currentUserId?: string
  isAdmin: boolean
  productId: Id<'products'>
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleLike = useMutation((api as any).comments?.toggleLike)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeComment = useMutation((api as any).comments?.remove)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editComment = useMutation((api as any).comments?.edit)

  const isOwner = currentUserId && comment.userId === currentUserId
  const userLabel = `User #${comment.userId?.slice(-6) || '???'}`
  const initial = comment.userId?.charAt(0)?.toUpperCase() || '?'
  const isDeleted = comment.isDeleted

  const handleLike = async () => {
    if (!currentUserId) return
    try {
      await toggleLike({ commentId: comment._id, userId: currentUserId })
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const handleDelete = async () => {
    try {
      await removeComment({
        commentId: comment._id,
        userId: currentUserId || '',
        isAdmin,
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
      await editComment({ commentId: comment._id, userId: currentUserId, text: trimmed })
      setEditing(false)
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const timeAgo = formatRelativeTime(comment.createdAt, t)

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
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}

              {/* Delete (owner or admin) */}
              {(isOwner || isAdmin) && (
                <button
                  onClick={handleDelete}
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
              {replies.map((reply: any) => (
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

function formatRelativeTime(timestamp: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('community.justNow')
  if (minutes < 60) return t('community.minutesAgo', { count: minutes })
  if (hours < 24) return t('community.hoursAgo', { count: hours })
  return t('community.daysAgo', { count: days })
}
