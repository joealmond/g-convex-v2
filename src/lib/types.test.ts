import { describe, it, expect } from 'vitest'
import { getQuadrant, getQuadrantColor, getPriceLabel, QUADRANTS } from './types'

describe('getQuadrant', () => {
  it('returns topRight for high safety + high taste', () => {
    expect(getQuadrant(80, 70)).toBe('topRight')
  })

  it('returns topLeft for high safety + low taste', () => {
    expect(getQuadrant(80, 30)).toBe('topLeft')
  })

  it('returns bottomRight for low safety + high taste', () => {
    expect(getQuadrant(30, 70)).toBe('bottomRight')
  })

  it('returns bottomLeft for low safety + low taste', () => {
    expect(getQuadrant(20, 20)).toBe('bottomLeft')
  })

  it('handles exact threshold (50, 50) as topRight', () => {
    expect(getQuadrant(50, 50)).toBe('topRight')
  })

  it('handles boundary: safety=50, taste=49 as topLeft', () => {
    expect(getQuadrant(50, 49)).toBe('topLeft')
  })

  it('handles boundary: safety=49, taste=50 as bottomRight', () => {
    expect(getQuadrant(49, 50)).toBe('bottomRight')
  })

  it('handles zero values as bottomLeft', () => {
    expect(getQuadrant(0, 0)).toBe('bottomLeft')
  })

  it('handles max values as topRight', () => {
    expect(getQuadrant(100, 100)).toBe('topRight')
  })
})

describe('getQuadrantColor', () => {
  it('returns a color string for each quadrant', () => {
    for (const key of Object.keys(QUADRANTS)) {
      const color = getQuadrantColor(key as any)
      expect(color).toBeTruthy()
      expect(typeof color).toBe('string')
    }
  })
})

describe('QUADRANTS', () => {
  it('has all four quadrants defined', () => {
    expect(QUADRANTS).toHaveProperty('topRight')
    expect(QUADRANTS).toHaveProperty('topLeft')
    expect(QUADRANTS).toHaveProperty('bottomRight')
    expect(QUADRANTS).toHaveProperty('bottomLeft')
  })

  it('each quadrant has required fields', () => {
    for (const quadrant of Object.values(QUADRANTS)) {
      expect(quadrant).toHaveProperty('id')
      expect(quadrant).toHaveProperty('name')
      expect(quadrant).toHaveProperty('color')
      expect(quadrant).toHaveProperty('description')
      expect(quadrant).toHaveProperty('emoji')
    }
  })
})

describe('getPriceLabel', () => {
  it('returns a label for price values 20-100 (step 20)', () => {
    for (const price of [20, 40, 60, 80, 100]) {
      const label = getPriceLabel(price)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('returns fallback for out-of-range price', () => {
    const label = getPriceLabel(0)
    expect(typeof label).toBe('string')
  })
})
