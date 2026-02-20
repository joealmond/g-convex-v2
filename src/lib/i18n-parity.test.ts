import { describe, it, expect } from 'vitest'
import en from '@/locales/en.json'
import hu from '@/locales/hu.json'

/**
 * Recursively collect all keys from a nested object in dot-notation
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys.sort()
}

describe('i18n key parity', () => {
  const enKeys = collectKeys(en)
  const huKeys = collectKeys(hu)

  it('en.json and hu.json have the same number of keys', () => {
    expect(enKeys.length).toBe(huKeys.length)
  })

  it('every en.json key exists in hu.json', () => {
    const huSet = new Set(huKeys)
    const missing = enKeys.filter((k) => !huSet.has(k))
    expect(missing).toEqual([])
  })

  it('every hu.json key exists in en.json', () => {
    const enSet = new Set(enKeys)
    const extra = huKeys.filter((k) => !enSet.has(k))
    expect(extra).toEqual([])
  })

  it('all leaf values are non-empty strings', () => {
    function checkNonEmpty(obj: Record<string, unknown>, locale: string, prefix = '') {
      const empty: string[] = []
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          empty.push(...checkNonEmpty(value as Record<string, unknown>, locale, fullKey))
        } else if (typeof value !== 'string' || value.trim() === '') {
          empty.push(`${locale}:${fullKey}`)
        }
      }
      return empty
    }

    const emptyEn = checkNonEmpty(en, 'en')
    const emptyHu = checkNonEmpty(hu, 'hu')
    expect([...emptyEn, ...emptyHu]).toEqual([])
  })
})
