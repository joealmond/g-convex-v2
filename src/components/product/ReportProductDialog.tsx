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

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'duplicate', label: 'Duplicate product' },
  { value: 'wrong-info', label: 'Wrong information' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const

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
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { anonId: anonymousId } = useAnonymousId()

  const createReport = useMutation(api.reports.create)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason')
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

      toast.success('Report submitted', {
        description: 'Thank you for helping keep our community safe',
      })

      // Reset form and close dialog
      setReason('')
      setDetails('')
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error('Failed to submit report', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
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
            Report Product
          </DialogTitle>
          <DialogDescription>
            Report "{productName}" for review by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selector */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Details Textarea */}
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide more context about the issue..."
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
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
