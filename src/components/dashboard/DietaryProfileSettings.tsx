/**
 * Dietary Profile Settings Component
 * Multi-condition dietary restrictions with per-condition severity
 */

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface DietaryCondition {
  type: string
  severity: number
}

export function DietaryProfileSettings() {
  const { t } = useTranslation()
  const profile = useQuery(api.dietaryProfiles.getUserProfile)
  const updateProfile = useMutation(api.dietaryProfiles.updateProfile)
  
  const [selectedConditions, setSelectedConditions] = useState<Map<string, number>>(
    new Map(profile?.conditions?.map(c => [c.type, c.severity]) ?? [])
  )
  const [isSaving, setIsSaving] = useState(false)

  // Sync with server data when it loads
  useEffect(() => {
    if (profile?.conditions) {
      setSelectedConditions(new Map(profile.conditions.map(c => [c.type, c.severity])))
    }
  }, [profile])

  const handleToggleCondition = (conditionId: string) => {
    const newMap = new Map(selectedConditions)
    if (newMap.has(conditionId)) {
      newMap.delete(conditionId)
    } else {
      newMap.set(conditionId, 3) // Default severity: moderate
    }
    setSelectedConditions(newMap)
  }

  const handleSeverityChange = (conditionId: string, severity: number) => {
    const newMap = new Map(selectedConditions)
    newMap.set(conditionId, severity)
    setSelectedConditions(newMap)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const conditions: DietaryCondition[] = Array.from(selectedConditions.entries())
        .map(([type, severity]) => ({ type, severity }))
      
      await updateProfile({ conditions })
      toast.success(t('dietaryProfile.saved'))
    } catch (error) {
      console.error('Failed to save dietary profile:', error)
      toast.error(t('dietaryProfile.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const severityLabels = [
    t('dietaryProfile.severity.mild'), // 1
    t('dietaryProfile.severity.lowModerate'), // 2
    t('dietaryProfile.severity.moderate'), // 3
    t('dietaryProfile.severity.highModerate'), // 4
    t('dietaryProfile.severity.severe'), // 5
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dietaryProfile.title')}</CardTitle>
        <CardDescription>{t('dietaryProfile.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {appConfig.dietaryRestrictions.map((restriction) => {
          const isSelected = selectedConditions.has(restriction.id)
          const severity = selectedConditions.get(restriction.id) ?? 3

          return (
            <div key={restriction.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={restriction.id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleCondition(restriction.id)}
                  />
                  <Label htmlFor={restriction.id} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-2xl">{restriction.emoji}</span>
                    <div>
                      <div className="font-medium">{restriction.label}</div>
                      <div className="text-sm text-muted-foreground">{restriction.description}</div>
                    </div>
                  </Label>
                </div>
              </div>

              {isSelected && (
                <div className="ml-11 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('dietaryProfile.severity.label')}</span>
                    <span className="font-medium">{severityLabels[severity - 1]}</span>
                  </div>
                  <Slider
                    value={[severity]}
                    onValueChange={([value]) => value !== undefined && handleSeverityChange(restriction.id, value)}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{severityLabels[0]}</span>
                    <span>{severityLabels[4]}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('dietaryProfile.threshold')}: {restriction.thresholds[severity - 1]}+
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
