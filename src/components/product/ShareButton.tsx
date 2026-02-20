import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'
import { isNative } from '@/lib/platform'
import { logger } from '@/lib/logger'

interface ShareButtonProps {
  productName: string
  url?: string
  title?: string
  text?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ShareButton({
  productName,
  url,
  title,
  text,
  className,
  variant = 'ghost',
  size = 'sm',
}: ShareButtonProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title || t('share.title', { name: productName })
  const shareText = text || t('share.text', { name: productName })

  const handleShare = async () => {
    // On native, use @capacitor/share for the system share sheet
    if (isNative()) {
      try {
        const { Share } = await import('@capacitor/share')
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: shareTitle,
        })
        return
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes('cancel')) return
        logger.error('Native share error:', error)
      }
    }

    // On web, use Web Share API if available
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        toast.success(t('share.success'))
        return
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        logger.error('Web share error:', error)
      }
    }

    // Fallback: copy to clipboard
    await handleCopyLink()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success(t('share.linkCopied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('share.copyFailed'))
    }
  }

  const canShare = isNative() || (typeof navigator !== 'undefined' && navigator.share)

  if (canShare) {
    return (
      <Button variant={variant} size={size} onClick={handleShare} className={className}>
        <Share2 className="h-4 w-4 mr-2" />
        {t('share.share')}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          {t('share.share')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <><Check className="h-4 w-4 mr-2 text-green-500" />{t('share.copied')}</>
          ) : (
            <><Copy className="h-4 w-4 mr-2" />{t('share.copyLink')}</>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
