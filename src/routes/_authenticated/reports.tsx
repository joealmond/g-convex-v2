import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdmin } from '@/hooks/use-admin'
import { Flag, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { type Id } from '@convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/reports')({
  component: ReportsPage,
})

function ReportsLoading() {
  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReportsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent />
    </Suspense>
  )
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Reports' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
] as const

const STATUS_ICONS = {
  pending: <Clock className="h-4 w-4" />,
  reviewed: <Flag className="h-4 w-4" />,
  resolved: <CheckCircle className="h-4 w-4" />,
  dismissed: <XCircle className="h-4 w-4" />,
}

const STATUS_COLORS = {
  pending: 'bg-amber-500',
  reviewed: 'bg-blue-500',
  resolved: 'bg-green-500',
  dismissed: 'bg-gray-500',
}

function ReportsContent() {
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const adminStatus = useAdmin()

  const reports = useQuery(
    api.reports.list,
    statusFilter === 'all' ? {} : { status: statusFilter }
  )
  
  const updateStatus = useMutation(api.reports.updateStatus)

  const handleStatusUpdate = async (
    reportId: Id<'reports'>,
    newStatus: string
  ) => {
    try {
      await updateStatus({ reportId, status: newStatus })
      toast.success('Report status updated')
    } catch (error: unknown) {
      toast.error('Failed to update status', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      })
    }
  }

  if (!adminStatus?.isAdmin) {
    return (
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-color-text-secondary mb-6">
            You need admin privileges to view reports.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (reports === undefined) {
    return <ReportsLoading />
  }

  return (
    <main className="flex-1 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-color-text mb-2">
              Product Reports
            </h1>
            <p className="text-sm text-color-text-secondary">
              {reports.length} {statusFilter === 'all' ? 'total' : statusFilter}{' '}
              {reports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </Button>
        </div>

        {/* Status Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-color-text mb-2">
                No reports found
              </p>
              <p className="text-sm text-color-text-secondary">
                {statusFilter === 'all'
                  ? 'No reports have been submitted yet'
                  : `No ${statusFilter} reports`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <Card key={report._id} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        <Flag className="h-5 w-5 text-destructive" />
                        {report.product?.name || 'Unknown Product'}
                      </CardTitle>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge
                          className={`text-white ${
                            STATUS_COLORS[
                              report.status as keyof typeof STATUS_COLORS
                            ]
                          }`}
                        >
                          {STATUS_ICONS[
                            report.status as keyof typeof STATUS_ICONS
                          ]}{' '}
                          {report.status}
                        </Badge>
                        <Badge variant="outline">{report.reason}</Badge>
                      </div>

                      <p className="text-sm text-color-text-secondary">
                        Reported by:{' '}
                        {report.isAnonymous
                          ? 'Anonymous'
                          : report.reporter?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-color-text-secondary">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(report._id, 'resolved')
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(report._id, 'dismissed')
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {report.details && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">Details:</p>
                      <p className="text-sm text-color-text-secondary">
                        {report.details}
                      </p>
                    </div>

                    {report.product && (
                      <Button
                        variant="link"
                        size="sm"
                        asChild
                        className="mt-2 px-0"
                      >
                        <Link
                          to="/product/$name"
                          params={{ name: report.product.name }}
                        >
                          View Product →
                        </Link>
                      </Button>
                    )}

                    {report.reviewedBy && report.reviewer && (
                      <p className="text-xs text-color-text-secondary mt-2">
                        Reviewed by {report.reviewer.name} on{' '}
                        {report.reviewedAt &&
                          new Date(report.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
