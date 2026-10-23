import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { addDays, canSelect, cookDay, followingPeriod, formatDay, nextWeek } from './dates'

// 와이어프레임 기준: 오늘 2026-10-22(목)
const today = '2026-10-22'

describe('식사 날짜 (A2)', () => {
  it('다음 주 평일은 월~금, 매일은 월~일', () => {
    expect(nextWeek(today, true)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'])
    expect(nextWeek(today, false).at(-1)).toBe('2026-11-01')
  })

  it('일요일에도 다음 주는 바로 다음 날 월요일부터', () => {
    expect(nextWeek('2026-10-25', true)[0]).toBe('2026-10-26')
  })

  it('조리일은 첫 식사일 전날, 월을 넘어가도 맞다', () => {
    expect(cookDay(['2026-10-28', '2026-10-26'])).toBe('2026-10-25')
    expect(cookDay(['2026-11-01'])).toBe('2026-10-31')
    expect(cookDay([])).toBeNull()
  })

  it('표시 형식', () => {
    expect(formatDay('2026-10-26')).toBe('10/26(월)')
  })

  it('지난 날짜는 선택 불가, 오늘은 가능, 선택 해제는 항상 가능', () => {
    expect(canSelect('2026-10-21', [], today)).toBe(false)
    expect(canSelect(today, [], today)).toBe(true)
    expect(canSelect('2026-10-21', ['2026-10-21'], today)).toBe(true)
  })

  it('첫날~마지막 날 기간이 최대 일수를 넘지 않는다 (span)', () => {
    const first = '2026-10-26'
    const max = config.maxSelectDays
    expect(canSelect(addDays(first, max - 1), [first], today)).toBe(true)
    expect(canSelect(addDays(first, max), [first], today)).toBe(false)
  })
})

describe('다음 주 계획 (U33)', () => {
  const today = '2026-10-22'

  it('평일 5일은 다음 주 평일로', () => {
    expect(followingPeriod(nextWeek(today, true), today)).toEqual(nextWeek('2026-10-29', true))
  })

  it('고른 요일 구성을 유지한다', () => {
    expect(followingPeriod(['2026-10-26', '2026-10-28', '2026-10-30'], today)).toEqual(['2026-11-02', '2026-11-04', '2026-11-06'])
  })

  it('2주에 걸친 날짜는 2주 뒤로', () => {
    const twoWeeks = ['2026-10-26', '2026-11-06']
    expect(followingPeriod(twoWeeks, today)).toEqual(['2026-11-09', '2026-11-20'])
  })

  it('날짜가 없거나 옮겨도 지난 날짜면 오늘 기준 다음 주 평일', () => {
    expect(followingPeriod([], today)).toEqual(nextWeek(today, true))
    expect(followingPeriod(['2026-09-01'], today)).toEqual(nextWeek(today, true))
  })
})
