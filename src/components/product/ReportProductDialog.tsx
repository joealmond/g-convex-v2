import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { type Id } from '@convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Flag } from 'lucide-react'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useTranslation } from '@/hooks/use-translation'

interface ReportProductDialogProps {
  productId: Id<'products'>
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportProductDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: ReportProductDialogProps) {
  type ReportReason = 'inappropriate' | 'duplicate' | 'wrong-info' | 'spam' | 'other'
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { anonId: anonymousId } = useAnonymousId()
  const { t } = useTranslation()

  const reportReasons = [
    { value: 'inappropriate' as const, label: t('report.inappropriate') },
    { value: 'duplicate' as const, label: t('report.duplicate') },
    { value: 'wrong-info' as const, label: t('report.wrongInfo') },
    { value: 'spam' as const, label: t('report.spam') },
    { value: 'other' as const, label: t('report.other') },
  ]

  const createReport = useMutation(api.reports.create)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t('report.selectReasonError'))
      return
    }

    setIsSubmitting(true)
    try {
      await createReport({
        productId,
        reason,
        details: details || undefined,
        anonymousId: anonymousId ?? undefined,
      })

      toast.success(t('report.submitted'), {
        description: t('report.submittedDesc'),
      })

      // Reset form and close dialog
      setReason('')
      setDetails('')
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(t('report.failed'), {
        description:
          error instanceof Error ? error.message : t('report.tryAgainLater'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            {t('report.title')}
          </DialogTitle>
          <DialogDescription>
            {t('report.description', { name: productName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selector */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('report.reasonLabel')}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger id="reason">
                <SelectValue placeholder={t('report.selectReason')} />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Details Textarea */}
          <div className="space-y-2">
            <Label htmlFor="details">{t('report.detailsLabel')}</Label>
            <Textarea
              id="details"
              placeholder={t('report.detailsPlaceholder')}
              value={details}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDetails(e.target.value)
              }
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
          >
            {isSubmitting ? t('report.submitting') : t('report.submitReport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
