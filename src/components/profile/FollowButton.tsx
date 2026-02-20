import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'

interface FollowButtonProps {
  userId: string
  userName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showIcon?: boolean
}

export function FollowButton({
  userId,
  userName,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()

  const isFollowing = useQuery(api.follows.isFollowing, { followingId: userId })
  const follow = useMutation(api.follows.follow)
  const unfollow = useMutation(api.follows.unfollow)

  const handleToggleFollow = async () => {
    setIsLoading(true)
    try {
      if (isFollowing) {
        await unfollow({ followingId: userId })
        toast.success(t('community.unfollowed', { name: userName || t('community.defaultUser') }))
      } else {
        await follow({ followingId: userId })
        toast.success(t('community.nowFollowing', { name: userName || t('community.defaultUser') }))
      }
    } catch (error: unknown) {
      toast.error(t('community.followFailed'), {
        description:
          error instanceof Error ? error.message : t('community.followFailedRetry'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFollowing === undefined) {
    return null // Loading state
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={className}
    >
      {showIcon &&
        (isFollowing ? (
          <UserMinus className="h-4 w-4 mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        ))}
      {isFollowing ? t('community.followingBtn') : t('community.follow')}
    </Button>
  )
}
