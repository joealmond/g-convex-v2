import { type ReactNode, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { VotingSheet, type ThumbsVotePayload } from '@/components/product/VotingSheet'
import { StoreTagInput } from '@/components/dashboard/StoreTagInput'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useHaptics } from '@/hooks/use-haptics'
import { useTranslation } from '@/hooks/use-translation'
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
  const { anonId: anonymousId } = useAnonymousId()
  const { isOnline } = useOnlineStatus()
  const { impact, notification } = useHaptics()
  const castVote = useMutation(api.votes.cast)

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [storeTag, setStoreTag] = useState('')
  const [storeLat, setStoreLat] = useState<number | undefined>()
  const [storeLon, setStoreLon] = useState<number | undefined>()
  const [isVoting, setIsVoting] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen

  const locationPreview = [
    storeTag.trim() || null,
    storeLat !== undefined && storeLon !== undefined ? t('imageUpload.currentLocation') : null,
  ].filter(Boolean).join(' · ')

  const resetDialog = () => {
    setStoreTag('')
    setStoreLat(undefined)
    setStoreLon(undefined)
    setOpen(false)
  }

  const handleLocationCapture = (lat: number, lon: number) => {
    if (lat === 0 && lon === 0) {
      setStoreLat(undefined)
      setStoreLon(undefined)
      return
    }

    setStoreLat(lat)
    setStoreLon(lon)
  }

  const handleVote = async (payload: ThumbsVotePayload) => {
    setIsVoting(true)
    try {
      const votePayload = {
        productId: product._id,
        allergenVotes: payload.allergenVotes,
        tasteVote: payload.tasteVote,
        price: payload.price,
        exactPrice: payload.exactPrice,
        anonymousId: anonymousId ?? undefined,
        storeName: storeTag || undefined,
        latitude: storeLat,
        longitude: storeLon,
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
        const points = calculateVotePoints({
          hasPrice: payload.price !== undefined,
          hasStore: !!storeTag,
          hasGPS: !!storeLat && !!storeLon,
        })
        const parts: string[] = []
        parts.push(t('voting.basePoints', { count: 10 }))
        if (payload.price !== undefined) parts.push(t('voting.priceBonus', { count: 5 }))
        if (storeTag) parts.push(t('voting.storeBonus', { count: 10 }))
        if (storeLat && storeLon) parts.push(t('voting.gpsBonus', { count: 5 }))

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('product.rateThisProduct')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <VotingSheet
            onVote={handleVote}
            disabled={isVoting}
            allergenScores={product.allergenScores as Record<string, { aiBase: 'contains' | 'free-from' | 'unknown'; upVotes: number; downVotes: number }> | undefined}
            tasteUpVotes={product.tasteUpVotes ?? 0}
            tasteDownVotes={product.tasteDownVotes ?? 0}
            avoidedAllergens={avoidedAllergens}
          />

          <CollapsibleSection
            title={t('product.whereDidYouBuy')}
            defaultOpen={Boolean(storeTag || (storeLat !== undefined && storeLon !== undefined))}
            preview={
              <p className="truncate text-xs text-muted-foreground">
                {locationPreview || t('imageUpload.storeHelpText')}
              </p>
            }
          >
            <div className="p-4">
              <StoreTagInput
                value={storeTag}
                onChange={setStoreTag}
                onLocationCapture={handleLocationCapture}
                disabled={isVoting}
              />
            </div>
          </CollapsibleSection>
        </div>
      </DialogContent>
    </Dialog>
  )
}
