import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, formatFileSize, formatRelativeTime, hashStringToColor } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('px-2', false && 'hidden', 'py-1')).toBe('px-2 py-1')
  })

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatFileSize', () => {
  it('returns "0 Bytes" for zero', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })

  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 Bytes')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB')
  })

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })
})

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const NOW = 1700000000000

  function timeAgo(ms: number) {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    return formatRelativeTime(NOW - ms)
  }

  it('returns "just now" for recent timestamps', () => {
    expect(timeAgo(5000)).toBe('just now')
  })

  it('returns minutes ago', () => {
    expect(timeAgo(60_000 * 3)).toBe('3 minutes ago')
  })

  it('returns singular minute', () => {
    expect(timeAgo(60_000)).toBe('1 minute ago')
  })

  it('returns hours ago', () => {
    expect(timeAgo(3_600_000 * 2)).toBe('2 hours ago')
  })

  it('returns days ago', () => {
    expect(timeAgo(86_400_000 * 5)).toBe('5 days ago')
  })

  it('returns weeks ago', () => {
    expect(timeAgo(86_400_000 * 14)).toBe('2 weeks ago')
  })

  it('returns months ago', () => {
    expect(timeAgo(86_400_000 * 60)).toBe('2 months ago')
  })

  it('returns years ago', () => {
    expect(timeAgo(86_400_000 * 400)).toBe('1 year ago')
  })
})

describe('hashStringToColor', () => {
  it('returns a consistent color for the same input', () => {
    const color1 = hashStringToColor('test-product')
    const color2 = hashStringToColor('test-product')
    expect(color1).toBe(color2)
  })

  it('returns a hex color string', () => {
    const color = hashStringToColor('hello')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('returns fallback for empty string', () => {
    const color = hashStringToColor('')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('different strings can produce different colors', () => {
    const colors = new Set(
      ['alpha', 'beta', 'gamma', 'delta', 'epsilon'].map(hashStringToColor)
    )
    // At least 2 different colors from 5 distinct inputs
    expect(colors.size).toBeGreaterThanOrEqual(2)
  })
})
