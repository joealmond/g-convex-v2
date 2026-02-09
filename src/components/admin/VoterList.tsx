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
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {votes.map((vote) => (
              <div
                key={vote._id}
                className="flex items-center gap-2 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {/* Vote Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {vote.isAnonymous ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <User className="h-3 w-3 mr-0.5" />
                        Anon
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
                        <User className="h-3 w-3 mr-0.5" />
                        Reg
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {vote.userId
                        ? `#${vote.userId.slice(-6)}`
                        : vote.anonymousId
                          ? `#${vote.anonymousId.slice(-6)}`
                          : '?'}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(vote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-safety-high">{vote.safety}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-primary">{vote.taste}</span>
                    {vote.price && (
                      <>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium text-gold">{vote.price}</span>
                      </>
                    )}
                    {vote.storeName && (
                      <span className="text-muted-foreground truncate ml-1">@ {vote.storeName}</span>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {!vote.isAnonymous && vote.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onImpersonate(vote.userId!)}
                      title="Impersonate this user"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingVoteId(vote._id)}
                    title="Delete this vote"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
