import { describe, it, expect } from 'vitest'
import { computeResizeDimensions } from './imagePreprocess'

describe('computeResizeDimensions', () => {
  it('returns input dimensions when both sides are within maxEdge', () => {
    expect(computeResizeDimensions(800, 600, 2048)).toEqual({ width: 800, height: 600 })
  })

  it('scales down landscape so the long edge equals maxEdge', () => {
    expect(computeResizeDimensions(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 })
  })

  it('scales down portrait so the long edge equals maxEdge', () => {
    expect(computeResizeDimensions(3000, 4000, 2048)).toEqual({ width: 1536, height: 2048 })
  })

  it('handles a square image', () => {
    expect(computeResizeDimensions(3000, 3000, 2048)).toEqual({ width: 2048, height: 2048 })
  })

  it('rounds to integer pixels', () => {
    const { width, height } = computeResizeDimensions(3333, 2222, 2048)
    expect(Number.isInteger(width)).toBe(true)
    expect(Number.isInteger(height)).toBe(true)
  })
})
