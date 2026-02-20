import { useState, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommentInputProps {
  productId: Id<'products'>
  userId: string
  parentId?: Id<'comments'>
  replyToName?: string
  onCancel?: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * Comment input box with auto-resize textarea
 */
export function CommentInput({
  productId,
  userId: _userId,
  parentId,
  replyToName,
  onCancel,
  t,
}: CommentInputProps) {
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const postComment = useMutation(api.comments?.post)

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed || posting) return

    setPosting(true)
    try {
      await postComment({
        productId,
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
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10" aria-label={t('common.cancel')}>
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim() || posting}
          className="h-10 w-10 rounded-xl"
          aria-label={t('common.sendComment')}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
