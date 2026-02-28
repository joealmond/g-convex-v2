import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '@convex/_generated/api'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface DietaryProfileSettingsProps {
  /** Hide the Card wrapper and header (when embedded in a CollapsibleSection) */
  hideHeader?: boolean
}

export function DietaryProfileSettings({ hideHeader = false }: DietaryProfileSettingsProps) {
  const { t } = useTranslation()
  const { isAuthenticated } = useConvexAuth()
  const profile = useQuery(api.dietaryProfiles.getUserProfile, isAuthenticated ? {} : 'skip')
  const updateProfile = useMutation(api.dietaryProfiles.updateProfile)
  
  const [avoidedAllergens, setAvoidedAllergens] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // Sync with server data when it loads
  useEffect(() => {
    if (profile?.avoidedAllergens) {
      setAvoidedAllergens(new Set(profile.avoidedAllergens))
    }
  }, [profile])

  const handleToggleAllergen = (allergenId: string) => {
    setAvoidedAllergens(prev => {
      const next = new Set(prev)
      if (next.has(allergenId)) {
        next.delete(allergenId)
      } else {
        next.add(allergenId)
      }
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile({ avoidedAllergens: [...avoidedAllergens] })
      toast.success(t('dietaryProfile.saved'))
    } catch (error) {
      logger.error('Failed to save dietary profile:', error)
      toast.error(t('dietaryProfile.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const content = (
    <div className="space-y-4">
      {!hideHeader && (
        <p className="text-sm text-muted-foreground">{t('dietaryProfile.description')}</p>
      )}
      {appConfig.allergens.map((allergen) => {
        const isSelected = avoidedAllergens.has(allergen.id)

        return (
          <div key={allergen.id} className="flex items-center space-x-3">
            <Checkbox
              id={`allergen-${allergen.id}`}
              checked={isSelected}
              onCheckedChange={() => handleToggleAllergen(allergen.id)}
            />
            <Label
              htmlFor={`allergen-${allergen.id}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-2xl">{allergen.emoji}</span>
              <div>
                <div className="font-medium">{t(`dietary.${allergen.id}.label`)}</div>
                <div className="text-sm text-muted-foreground">{t(`dietary.${allergen.id}.description`)}</div>
              </div>
            </Label>
          </div>
        )
      })}

      <div className="pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  )

  if (hideHeader) {
    return content
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dietaryProfile.title')}</CardTitle>
        <CardDescription>{t('dietaryProfile.description')}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
