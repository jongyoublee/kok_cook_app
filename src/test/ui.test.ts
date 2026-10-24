import { describe, expect, it } from 'vitest'
import { hatStroke } from '../ui'

describe('로고 선 굵기 (I9)', () => {
  it('design.md 9절 크기별 굵기를 따른다', () => {
    expect(hatStroke(64)).toEqual([1.6, 2.1])
    expect(hatStroke(40)).toEqual([1.7, 2.1])
    expect(hatStroke(28)).toEqual([1.9, 2.4])
    expect(hatStroke(24)).toEqual([2.2, 2.8])
    expect(hatStroke(18)).toEqual([2.2, 2.8])
  })
})
