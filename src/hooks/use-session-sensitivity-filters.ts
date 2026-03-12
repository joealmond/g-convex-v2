import { useCallback, useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/lib/app-config'

export const SENSITIVITY_FILTERS_SESSION_KEY = 'g-matrix-sensitivity-filters'

function normalizeFilters(values: Iterable<string>): Set<string> {
  const validIds = new Set<string>(appConfig.allergens.map((allergen) => allergen.id))
  return new Set(Array.from(values).filter((value) => validIds.has(value)))
}

function readSessionFilters(): Set<string> | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(SENSITIVITY_FILTERS_SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return normalizeFilters(parsed)
  } catch {
    return null
  }
}

function writeSessionFilters(filters: Set<string>) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(
    SENSITIVITY_FILTERS_SESSION_KEY,
    JSON.stringify(Array.from(filters))
  )
}

export function useSessionSensitivityFilters(defaultFilters: Set<string>) {
  const normalizedDefaultFilters = useMemo(
    () => normalizeFilters(defaultFilters),
    [defaultFilters]
  )
  const [activeFilters, setActiveFilters] = useState<Set<string>>(normalizedDefaultFilters)
  const [hasSessionOverride, setHasSessionOverride] = useState(false)

  useEffect(() => {
    const storedFilters = readSessionFilters()
    if (storedFilters) {
      setActiveFilters(storedFilters)
      setHasSessionOverride(true)
      return
    }

    setActiveFilters(normalizedDefaultFilters)
  }, [normalizedDefaultFilters])

  useEffect(() => {
    if (!hasSessionOverride) {
      setActiveFilters(normalizedDefaultFilters)
    }
  }, [hasSessionOverride, normalizedDefaultFilters])

  const toggleFilter = useCallback((id: string) => {
    setActiveFilters((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      writeSessionFilters(next)
      return next
    })
    setHasSessionOverride(true)
  }, [])

  const resetToDefaults = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SENSITIVITY_FILTERS_SESSION_KEY)
    }
    setHasSessionOverride(false)
    setActiveFilters(normalizedDefaultFilters)
  }, [normalizedDefaultFilters])

  return {
    activeFilters,
    toggleFilter,
    resetToDefaults,
  }
}