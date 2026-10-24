import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { addHidden, defaultConditions, loadConditions, mealCount, OWNED_GROUPS, OWNED_OPTIONS, PANTRY_GROUPS, PANTRY_OPTIONS, proteinsFromOwned, saveConditions } from '../conditions'
import { recipes } from '../data/recipes'

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
    const c = { ...defaultConditions(today), people: 3, menuCount: 4, proteins: ['pork' as const], carbs: ['potato' as const], pantry: ['soySauce' as const], budget: 150_000, cheapest: true }
    saveConditions(c, s)
    expect(loadConditions(today, s)).toEqual(c)
  })

  it('예전에 저장된 식단 분류 값은 버린다 (A5 삭제)', () => {
    const c = loadConditions(today, fakeStorage(JSON.stringify({ diet: 'korean', maxKcal: 600 })))
    expect(c).not.toHaveProperty('diet')
    expect(c).not.toHaveProperty('maxKcal')
  })

  it('저장값이 없거나 깨졌으면 null', () => {
    expect(loadConditions(today, fakeStorage())).toBeNull()
    expect(loadConditions(today, fakeStorage('{oops'))).toBeNull()
    expect(loadConditions(today, fakeStorage('null'))).toBeNull()
  })

  it('지난 날짜는 버리고, 모두 지났으면 기본 날짜, 잘못된 값은 기본값', () => {
    const raw = JSON.stringify({ dates: ['2026-10-01', '2026-10-23'], people: 0, menuCount: 9, diet: 'x', proteins: ['pork', 'x'], pantry: ['soySauce', 'tofu', 'x'], budget: 0, cheapest: 'yes' })
    const c = loadConditions(today, fakeStorage(raw))!
    expect(c.dates).toEqual(['2026-10-23'])
    expect(c.people).toBe(1)
    expect(c.menuCount).toBe(config.menuCount.default)
    expect(c.proteins).toEqual(['pork'])
    expect(c.pantry).toEqual(['soySauce']) // 두부는 양념이 아니라 버린다
    expect(c.budget).toBeNull() // 정하지 않은 예산
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

describe('다시 안 보기 (B10)', () => {
  it('상한을 넘으면 오래된 것부터 되돌리고, 같은 메뉴는 한 번만 담는다', () => {
    let hidden: string[] = []
    for (let i = 0; i < config.hiddenMax + 2; i++) hidden = addHidden(hidden, `r${i}`)
    expect(hidden).toHaveLength(config.hiddenMax)
    expect(hidden[0]).toBe('r2')
    expect(addHidden(['a', 'b'], 'a')).toEqual(['b', 'a'])
  })

  it('저장값의 없는 레시피는 버린다', () => {
    const m = new Map([['kokcook.conditions', JSON.stringify({ hidden: ['x', 'spicy-pork'] })]])
    const c = loadConditions('2026-10-22', { getItem: (k) => m.get(k) ?? null, setItem: () => {} })!
    expect(c.hidden).toEqual(['spicy-pork'])
  })
})


describe('집에 있는 재료 (A12)', () => {
  it('양념을 뺀 재료를 코너별로 묻는다', () => {
    expect(OWNED_OPTIONS.some((id) => PANTRY_OPTIONS.includes(id))).toBe(false)
    expect(OWNED_OPTIONS).toContain('porkShoulder')
    expect(OWNED_GROUPS[0].title).toBe('육류·달걀')
    expect(OWNED_GROUPS.flatMap((g) => g.ids)).toHaveLength(OWNED_OPTIONS.length)
  })

  it('저장 후 불러오면 같고, 양념이나 없는 재료는 버린다', () => {
    const s = fakeStorage(JSON.stringify({ owned: ['tofu', 'soySauce', 'x'] }))
    expect(loadConditions(today, s)!.owned).toEqual(['tofu'])
    expect(defaultConditions(today).owned).toEqual([])
  })

  it('고기·생선·두부로 먹고 싶은 단백질을 채운다', () => {
    expect(proteinsFromOwned(['porkShoulder', 'porkTenderloin', 'onion'])).toEqual(['pork'])
    expect(proteinsFromOwned(['softTofu', 'shrimp'])).toEqual(['tofu', 'legume', 'seafood'])
    expect(proteinsFromOwned(['onion'])).toEqual([])
  })
})

describe('재료와 단백질 짝 (A12)', () => {
  it('레시피마다 주재료 단백질을 집에 있는 재료로 고를 수 있다', () => {
    for (const r of recipes) expect(proteinsFromOwned(r.ingredients.map((i) => i.id)), r.name).toContain(r.proteinSource)
  })
})
