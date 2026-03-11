import { type ReactNode, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { VotingSheet, type ThumbsVotePayload } from '@/components/product/VotingSheet'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useHaptics } from '@/hooks/use-haptics'
import { useTranslation } from '@/hooks/use-translation'
import { useSession } from '@/lib/auth-client'
import { enqueue } from '@/lib/offline-queue'
import { calculateVotePoints } from '@/lib/gamification'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

interface VoteProductDialogProps {
  product: Product
  trigger: ReactNode
  avoidedAllergens?: string[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function VoteProductDialog({
  product,
  trigger,
  avoidedAllergens = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: VoteProductDialogProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { anonId: anonymousId } = useAnonymousId()
  const { isOnline } = useOnlineStatus()
  const { impact, notification } = useHaptics()
  const castVote = useMutation(api.votes.cast)

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen
  const currentUserId = session?.user?.id
  const isOwnProduct = Boolean(currentUserId && product.createdBy && currentUserId === product.createdBy)

  const resetDialog = () => {
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && isOwnProduct) {
      toast.error(t('voting.cannotVoteOwnProduct'))
      return
    }
    setOpen(nextOpen)
  }

  const handleVote = async (payload: ThumbsVotePayload) => {
    setIsVoting(true)
    try {
      const votePayload = {
        productId: product._id,
        allergenVotes: payload.allergenVotes,
        tasteVote: payload.tasteVote,
        anonymousId: anonymousId ?? undefined,
      }

      if (!isOnline) {
        await enqueue('vote', votePayload as Record<string, unknown>)
        impact('light')
        toast.success('📋 ' + t('offline.voteSavedOffline'), {
          duration: 4000,
        })
      } else {
        await castVote(votePayload)
        impact('medium')
        const points = calculateVotePoints({})
        const parts: string[] = []
        parts.push(t('voting.basePoints', { count: 10 }))

        toast.success(`🎉 ${t('voting.voteSubmitted')}`, {
          description: `+${points} ${t('gamification.points')}! ${parts.join(' + ')}`,
          duration: 4000,
        })
      }

      resetDialog()
    } catch (error: unknown) {
      notification('error')
      toast.error(t('voting.voteFailed'), {
        description: error instanceof Error ? error.message : t('errors.generic'),
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] border-border bg-card p-0 shadow-2xl sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
          <DialogTitle>{t('product.rateThisProduct')}</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <VotingSheet
              onVote={handleVote}
              disabled={isVoting}
              allergenScores={product.allergenScores as Record<string, { aiBase: 'contains' | 'free-from' | 'unknown'; upVotes: number; downVotes: number }> | undefined}
              tasteUpVotes={product.tasteUpVotes ?? 0}
              tasteDownVotes={product.tasteDownVotes ?? 0}
              avoidedAllergens={avoidedAllergens}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
