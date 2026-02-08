import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Id } from '@convex/_generated/dataModel'

interface Vote {
  _id: Id<'votes'>
  _creationTime: number
  productId: Id<'products'>
  userId?: string
  anonymousId?: string
  isAnonymous: boolean
  safety: number
  taste: number
  price?: number
  storeName?: string
  latitude?: number
  longitude?: number
  createdAt: number
}

interface VoterListProps {
  votes: Vote[]
  onImpersonate: (userId: string) => void
}

export function VoterList({ votes, onImpersonate }: VoterListProps) {
  const [deletingVoteId, setDeletingVoteId] = useState<Id<'votes'> | null>(
    null
  )
  const deleteVote = useMutation(api.votes.deleteVote)

  const handleDeleteVote = async (voteId: Id<'votes'>) => {
    try {
      await deleteVote({ voteId })
      toast.success('Vote deleted')
      setDeletingVoteId(null)
    } catch (error: unknown) {
      toast.error('Failed to delete vote', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      })
    }
  }

  if (votes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voter List</CardTitle>
          <CardDescription>No votes yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Count registered vs anonymous
  const registered = votes.filter((v) => !v.isAnonymous).length
  const anonymous = votes.filter((v) => v.isAnonymous).length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voter List</CardTitle>
              <CardDescription>
                {votes.length} votes ({registered} registered, {anonymous}{' '}
                anonymous)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {votes.map((vote) => (
              <div
                key={vote._id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {/* Vote Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {vote.isAnonymous ? (
                      <Badge variant="outline">
                        <User className="h-3 w-3 mr-1" />
                        Anonymous
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <User className="h-3 w-3 mr-1" />
                        Registered
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {vote.userId
                        ? `User ${vote.userId.slice(-6)}`
                        : vote.anonymousId
                          ? `Anon ${vote.anonymousId.slice(-6)}`
                          : 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">
                      Safety: {vote.safety}
                    </span>{' '}
                    ·{' '}
                    <span className="font-medium">Taste: {vote.taste}</span>
                    {vote.price && (
                      <>
                        {' '}
                        · <span>Price: {vote.price}/5</span>
                      </>
                    )}
                  </div>
                  {vote.storeName && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {vote.storeName}
                      {vote.latitude && vote.longitude && ' (GPS)'}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(vote.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-1 ml-2">
                  {/* Impersonate Button (only for registered users) */}
                  {!vote.isAnonymous && vote.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onImpersonate(vote.userId!)}
                      title="Impersonate this user"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingVoteId(vote._id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete this vote"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingVoteId}
        onOpenChange={(open) => !open && setDeletingVoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vote?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this vote and recalculate product
              averages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingVoteId && handleDeleteVote(deletingVoteId)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
