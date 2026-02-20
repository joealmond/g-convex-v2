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
import { useTranslation } from '@/hooks/use-translation'

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
  { value: 'all', labelKey: 'reports.allReports' },
  { value: 'pending', labelKey: 'reports.pending' },
  { value: 'reviewed', labelKey: 'reports.reviewed' },
  { value: 'resolved', labelKey: 'reports.resolved' },
  { value: 'dismissed', labelKey: 'reports.dismissed' },
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

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

function ReportsContent() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending')
  const adminStatus = useAdmin()
  const { t, locale } = useTranslation()

  const reports = useQuery(
    api.reports.list,
    statusFilter === 'all' ? {} : { status: statusFilter }
  )
  
  const updateStatus = useMutation(api.reports.updateStatus)

  const handleStatusUpdate = async (
    reportId: Id<'reports'>,
    newStatus: ReportStatus
  ) => {
    try {
      await updateStatus({ reportId, status: newStatus })
      toast.success(t('reports.statusUpdated'))
    } catch (error: unknown) {
      toast.error(t('reports.statusUpdateFailed'), {
        description:
          error instanceof Error ? error.message : 'Please try again',
      })
    }
  }

  if (!adminStatus?.isAdmin) {
    return (
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('reports.accessDenied')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('reports.accessDeniedDesc')}
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('nav.backToHome')}
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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('reports.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {reports.length} {statusFilter === 'all' ? t('reports.allReports').toLowerCase() : t(`reports.${statusFilter}` as const).toLowerCase()}{' '}
              {reports.length === 1 ? t('reports.totalReport') : t('reports.totalReports')}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('nav.adminPanel')}
            </Link>
          </Button>
        </div>

        {/* Status Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">{t('reports.filterByStatus')}</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus | 'all')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
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
              <p className="text-lg font-medium text-foreground mb-2">
                {t('reports.noReports')}
              </p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'all'
                  ? t('reports.noReportsYet')
                  : t('reports.noStatusReports', { status: t(`reports.${statusFilter}` as const).toLowerCase() })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report._id} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        <Flag className="h-5 w-5 text-destructive" />
                        {report.product?.name || t('reports.unknownProduct')}
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

                      <p className="text-sm text-muted-foreground">
                        Reported by:{' '}
                        {report.isAnonymous
                          ? t('reports.anonymous')
                          : (report.reporter?.id ?? t('reports.unknown'))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleString(locale)}
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
                          {t('reports.resolve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(report._id, 'dismissed')
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('reports.dismiss')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {report.details && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">{t('reports.details')}</p>
                      <p className="text-sm text-muted-foreground">
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
                          {t('reports.viewProduct')}
                        </Link>
                      </Button>
                    )}

                    {report.reviewedBy && report.reviewer && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed by {report.reviewer?.id ?? t('reports.adminFallback')} on{' '}
                        {report.reviewedAt &&
                          new Date(report.reviewedAt).toLocaleString(locale)}
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
