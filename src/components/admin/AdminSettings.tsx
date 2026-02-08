/**
 * Admin Settings Component
 * Configure time-decay, price snapshots, challenges
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Settings, Zap, DollarSign, Trophy } from 'lucide-react'

export function AdminSettings() {
  const { t } = useTranslation()
  const settings = useQuery(api.settings.getAllSettings)
  const updateSettings = useMutation(api.settings.updateSettings)
  const [isSaving, setIsSaving] = useState(false)
  
  const [timeDecayEnabled, setTimeDecayEnabled] = useState(true)
  const [decayRate, setDecayRate] = useState(0.995)
  const [decayHour, setDecayHour] = useState(0)
  const [priceSnapshotEnabled, setPriceSnapshotEnabled] = useState(true)
  const [challengePointsBase, setChallengePointsBase] = useState(50)

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setTimeDecayEnabled(settings.TIME_DECAY_ENABLED === true)
      const rate = settings.DECAY_RATE
      setDecayRate(typeof rate === 'number' ? rate : 0.995)
      const hour = settings.DECAY_HOUR
      setDecayHour(typeof hour === 'number' ? hour : 0)
      setPriceSnapshotEnabled(settings.PRICE_SNAPSHOT_ENABLED !== false)
      const points = settings.CHALLENGE_POINTS_BASE
      setChallengePointsBase(typeof points === 'number' ? points : 50)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({
        settings: [
          { key: 'TIME_DECAY_ENABLED', value: timeDecayEnabled },
          { key: 'DECAY_RATE', value: decayRate },
          { key: 'DECAY_HOUR', value: decayHour },
          { key: 'PRICE_SNAPSHOT_ENABLED', value: priceSnapshotEnabled },
          { key: 'CHALLENGE_POINTS_BASE', value: challengePointsBase },
        ],
      })
      toast.success(t('admin.settingsSaved'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error(t('admin.settingsFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const decayPercentage = ((1 - decayRate) * 100).toFixed(2)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t('admin.timeDecay')}
          </CardTitle>
          <CardDescription>{t('admin.timeDecayDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="time-decay-enabled">{t('admin.enableTimeDecay')}</Label>
            <Switch
              id="time-decay-enabled"
              checked={timeDecayEnabled}
              onCheckedChange={setTimeDecayEnabled}
            />
          </div>

          {timeDecayEnabled && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="decay-rate">{t('admin.decayRate')}</Label>
                  <span className="text-sm font-medium">{decayPercentage}% / {t('admin.day')}</span>
                </div>
                <Slider
                  id="decay-rate"
                  value={[decayRate * 1000]}
                  onValueChange={([value]) => value !== undefined && setDecayRate(value / 1000)}
                  min={990} // 1.0% per day
                  max={999} // 0.1% per day
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('admin.aggressive')} (1.0%)</span>
                  <span>{t('admin.subtle')} (0.1%)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decay-hour">{t('admin.decayHour')}</Label>
                <Input
                  id="decay-hour"
                  type="number"
                  min={0}
                  max={23}
                  value={decayHour}
                  onChange={(e) => setDecayHour(Number(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">{t('admin.decayHourHint')}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('admin.priceTracking')}
          </CardTitle>
          <CardDescription>{t('admin.priceTrackingDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="price-snapshot-enabled">{t('admin.enablePriceSnapshots')}</Label>
            <Switch
              id="price-snapshot-enabled"
              checked={priceSnapshotEnabled}
              onCheckedChange={setPriceSnapshotEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {t('admin.challenges')}
          </CardTitle>
          <CardDescription>{t('admin.challengesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="challenge-points">{t('admin.challengePointsBase')}</Label>
            <Input
              id="challenge-points"
              type="number"
              min={10}
              max={500}
              step={10}
              value={challengePointsBase}
              onChange={(e) => setChallengePointsBase(Number(e.target.value))}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">{t('admin.challengePointsHint')}</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full">
        <Settings className="w-4 h-4 mr-2" />
        {isSaving ? t('common.saving') : t('admin.saveSettings')}
      </Button>
    </div>
  )
}
