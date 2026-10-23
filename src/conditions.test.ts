import { describe, expect, it } from 'vitest'
import { config } from './config'
import { defaultConditions, loadConditions, mealCount, PANTRY_GROUPS, PANTRY_OPTIONS, saveConditions } from './conditions'

const today = '2026-10-22'
const fakeStorage = (init?: string) => {
  const m = new Map<string, string>(init ? [['kokcook.conditions', init]] : [])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('입력 조건 (A1~A6, I2)', () => {
  it('기본값: 다음 주 평일, 1인, 저녁 5끼, 메뉴 기본 개수', () => {
    const c = defaultConditions(today)
    expect(c.people).toBe(1)
    expect(mealCount(c)).toBe(5)
    expect(c.menuCount).toBe(config.menuCount.default)
  })

  it('점심을 더하면 끼니 수가 두 배가 된다', () => {
    expect(mealCount({ ...defaultConditions(today), meals: ['lunch', 'dinner'] })).toBe(10)
  })

  it('저장 후 불러오면 같은 조건', () => {
    const s = fakeStorage()
    const c = { ...defaultConditions(today), people: 3, menuCount: 4, diet: 'light' as const, proteins: ['pork' as const], carbs: ['potato' as const], pantry: ['soySauce' as const], budget: 150_000, cheapest: true }
    saveConditions(c, s)
    expect(loadConditions(today, s)).toEqual(c)
  })

  it('예전 분류(한식·고단백)로 저장된 값은 새 분류로 옮긴다 (A5)', () => {
    expect(loadConditions(today, fakeStorage(JSON.stringify({ diet: 'korean' })))!.diet).toBe('hearty')
    expect(loadConditions(today, fakeStorage(JSON.stringify({ diet: 'highProtein' })))!.diet).toBe('light')
  })

  it('저장값이 없거나 깨졌으면 null', () => {
    expect(loadConditions(today, fakeStorage())).toBeNull()
    expect(loadConditions(today, fakeStorage('{oops'))).toBeNull()
    expect(loadConditions(today, fakeStorage('null'))).toBeNull()
  })

  it('지난 날짜는 버리고, 모두 지났으면 기본 날짜, 잘못된 값은 기본값', () => {
    const raw = JSON.stringify({ dates: ['2026-10-01', '2026-10-23'], people: 0, menuCount: 9, diet: 'x', proteins: ['pork', 'x'], pantry: ['soySauce', 'tofu', 'x'], budget: 10, cheapest: 'yes' })
    const c = loadConditions(today, fakeStorage(raw))!
    expect(c.dates).toEqual(['2026-10-23'])
    expect(c.people).toBe(1)
    expect(c.menuCount).toBe(config.menuCount.default)
    expect(c.diet).toBe('hearty')
    expect(c.proteins).toEqual(['pork'])
    expect(c.pantry).toEqual(['soySauce']) // 두부는 양념이 아니라 버린다
    expect(c.budget).toBe(config.budget.default)
    expect(c.cheapest).toBe(false)
    const old = loadConditions(today, fakeStorage(JSON.stringify({ dates: ['2026-10-01'], proteins: ['x'] })))!
    expect(old.dates).toEqual(defaultConditions(today).dates)
    expect(old.proteins).toEqual([]) // 잘못된 값만 있으면 빈칸
  })

  it('양념 묶음(기본·한식·양식)이 양념 코너 재료를 빠짐없이 한 번씩 담는다', () => {
    const all = PANTRY_GROUPS.flatMap((g) => g.ids)
    expect(new Set(all).size).toBe(all.length)
    expect([...all].sort()).toEqual([...PANTRY_OPTIONS].sort())
    expect(PANTRY_GROUPS[0].ids).toHaveLength(10)
  })
})
