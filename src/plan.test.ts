import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions, loadConditions, saveConditions } from './conditions'
import { recipes } from './data/recipes'
import { nextWeek } from './lib/dates'
import { schedule } from './lib/storagePlan'
import { clearSavedData, confirmPlan, loadPlan, planConditions, planCookDate, savePlan } from './plan'

const fakeStorage = (init?: string) => {
  const m = new Map<string, string>(init ? [['kokcook.plan', init]] : [])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

const sunday = '2026-10-25'
const weekdays = nextWeek('2026-10-22', true) // 10/26(월)~10/30(금)
const c = { ...defaultConditions('2026-10-22'), dates: weekdays, proteins: ALL_PROTEINS, carbs: ALL_CARBS }
const basis = { dates: weekdays, people: 1, meals: c.meals }
const [a, b] = recipes

describe('확정 메뉴와 구매 체크 저장 (I2, D6)', () => {
  it('저장 후 불러오면 같다', () => {
    const s = fakeStorage()
    const plan = { ...basis, menu: [a, b], checked: ['onion' as const], cookDate: '2026-10-24' }
    savePlan(plan, s)
    expect(loadPlan(basis, s)).toEqual(plan)
  })

  it('없어진 레시피·재료는 거르고, 메뉴가 없거나 깨졌으면 null', () => {
    const plan = loadPlan(basis, fakeStorage(JSON.stringify({ recipeIds: ['x', a.id], checked: ['onion', 'x', 3] })))!
    expect(plan.menu).toEqual([a])
    expect(plan.checked).toEqual(['onion'])
    expect(plan.cookDate).toBeUndefined()
    expect(loadPlan(basis, fakeStorage(JSON.stringify({ recipeIds: ['x'] })))).toBeNull()
    expect(loadPlan(basis, fakeStorage('{oops'))).toBeNull()
    expect(loadPlan(basis, fakeStorage())).toBeNull()
  })

  it('날짜·인원이 없는 예전 저장값은 지금 조건으로 채운다', () => {
    const plan = loadPlan({ dates: ['2026-11-02'], people: 3, meals: ['dinner'] }, fakeStorage(JSON.stringify({ recipeIds: [a.id] })))!
    expect(plan.dates).toEqual(['2026-11-02'])
    expect(plan.people).toBe(3)
  })
})

describe('식사 중간에 다시 열어도 계획이 그대로 (E1, I2)', () => {
  it('수요일에 다시 열어도 날짜, 조리일, 냉장·냉동 배치가 확정할 때와 같다', () => {
    const s = fakeStorage()
    const condStore = new Map<string, string>()
    const condStorage = { getItem: (k: string) => condStore.get(k) ?? null, setItem: (k: string, v: string) => void condStore.set(k, v) }
    saveConditions(c, condStorage)
    const plan = confirmPlan(null, [a, b], c)
    savePlan(plan, s)
    const before = schedule(plan.menu, plan.dates, planCookDate(plan))

    // 수요일: 조건을 불러오면 지난 월·화가 빠지지만, 계획은 저장한 날짜를 쓴다
    const wednesday = '2026-10-28'
    const reopened = loadConditions(wednesday, condStorage)!
    expect(reopened.dates).toEqual(['2026-10-28', '2026-10-29', '2026-10-30'])
    const again = loadPlan(reopened, s)!
    const pc = planConditions(again, reopened)
    expect(pc.dates).toEqual(weekdays)
    expect(planCookDate(again)).toBe(sunday)
    expect(schedule(again.menu, pc.dates, planCookDate(again))).toEqual(before)
  })
})

describe('메뉴 확정 (U16)', () => {
  const prev = { ...confirmPlan(null, [a, b], c), checked: ['onion' as const], cookDate: '2026-10-24' }

  it('같은 메뉴를 순서만 바꿔 다시 확정하면 구매 체크와 조리일을 이어 쓴다', () => {
    const next = confirmPlan(prev, [b, a], c)
    expect(next.checked).toEqual(['onion'])
    expect(next.cookDate).toBe('2026-10-24')
  })

  it('메뉴나 날짜·인원이 바뀌면 구매 체크와 조리일을 비운다', () => {
    expect(confirmPlan(prev, [a], c).checked).toEqual([])
    const nextWeekPlan = confirmPlan(prev, [a, b], { ...c, dates: nextWeek('2026-10-29', true) })
    expect(nextWeekPlan.checked).toEqual([])
    expect(nextWeekPlan.cookDate).toBeUndefined()
    expect(confirmPlan(prev, [a, b], { ...c, people: 2 }).checked).toEqual([])
  })

  it('확정할 때의 날짜·인원·끼니를 계획에 담는다', () => {
    const plan = confirmPlan(null, [a], { ...c, people: 2 })
    expect(plan.dates).toEqual(weekdays)
    expect(plan.people).toBe(2)
    expect(plan.meals).toEqual(c.meals)
  })
})

describe('내 데이터 지우기 (I6)', () => {
  it('조건과 계획을 모두 지운다', () => {
    const m = new Map([
      ['kokcook.conditions', '{}'],
      ['kokcook.plan', '{}'],
      ['other', 'x'],
    ])
    clearSavedData({ removeItem: (k: string) => void m.delete(k) })
    expect([...m.keys()]).toEqual(['other'])
  })
})
