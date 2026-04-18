import { describe, it, expect } from 'vitest'
import { canDeleteImage } from './permissions'

describe('canDeleteImage', () => {
  const image = { owner: 'user-a', $id: 'img1' }

  it('allows the owner', () => {
    expect(canDeleteImage(image, 'user-a', false)).toBe(true)
  })

  it('allows an administration team member regardless of owner', () => {
    expect(canDeleteImage(image, 'user-b', true)).toBe(true)
  })

  it('denies a non-owner non-admin', () => {
    expect(canDeleteImage(image, 'user-b', false)).toBe(false)
  })

  it('denies when image is null/undefined', () => {
    expect(canDeleteImage(null, 'user-a', true)).toBe(false)
    expect(canDeleteImage(undefined, 'user-a', true)).toBe(false)
  })

  it('denies when currentUserId is missing', () => {
    expect(canDeleteImage(image, null, false)).toBe(false)
  })
})
