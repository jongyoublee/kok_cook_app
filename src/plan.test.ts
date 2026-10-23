import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions, loadConditions, saveConditions } from './conditions'
import { recipes } from './data/recipes'
import { nextWeek } from './lib/dates'
import { servingsOf } from './lib/shopping'
import { schedule } from './lib/storagePlan'
import { clearSavedData, confirmPlan, droppedChecks, loadPlan, planConditions, planCookDate, savePlan } from './plan'

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
    const plan = { ...basis, menu: [a, b], checked: ['onion' as const], cookDate: '2026-10-24', skipped: ['2026-10-27'], extras: [{ name: '휴지', done: true }] }
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

  it('메뉴만 바뀌면 새 메뉴가 쓰는 재료의 구매 체크만 남기고, 쓸 곳이 없어지는 재료를 알려준다 (B8)', () => {
    const noOnion = recipes.find((r) => !r.ingredients.some((i) => i.id === 'onion'))!
    const withOnion = recipes.find((r) => r !== noOnion && r.ingredients.some((i) => i.id === 'onion'))!
    expect(confirmPlan(prev, [withOnion], c).checked).toEqual(['onion'])
    expect(confirmPlan(prev, [noOnion], c).checked).toEqual([])
    expect(droppedChecks(prev, [noOnion], c)).toEqual(['onion'])
    expect(droppedChecks(prev, [withOnion], c)).toEqual([])
    expect(confirmPlan(prev, [noOnion], c).cookDate).toBe('2026-10-24')
  })

  it('날짜·인원이 바뀌면 구매 체크, 조리일, 안 먹는 날을 비우고 경고하지 않는다', () => {
    const withSkip = { ...prev, skipped: ['2026-10-27'] }
    const nextWeekPlan = confirmPlan(withSkip, [a, b], { ...c, dates: nextWeek('2026-10-29', true) })
    expect(nextWeekPlan.checked).toEqual([])
    expect(nextWeekPlan.cookDate).toBeUndefined()
    expect(nextWeekPlan.skipped).toEqual([])
    expect(confirmPlan(prev, [a, b], { ...c, people: 2 }).checked).toEqual([])
    expect(droppedChecks(prev, [a], { ...c, people: 2 })).toEqual([])
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

describe('안 먹는 날 (B9)', () => {
  it('요일 배정은 그대로 두고 그 끼니만 장보기와 보관에서 뺀다', () => {
    const plan = { ...confirmPlan(null, [a, b], c), skipped: ['2026-10-28'] }
    const pc = planConditions(plan, c)
    const full = servingsOf(plan.menu, c)
    const less = servingsOf(plan.menu, pc)
    expect(less.reduce((x, y) => x + y)).toBe(full.reduce((x, y) => x + y) - 1)
    const slots = schedule(plan.menu, pc.dates, planCookDate(plan), 'byDate', plan.skipped)
    expect(slots.map((s) => s.date)).toEqual(weekdays.filter((d) => d !== '2026-10-28'))
    // 다른 날의 메뉴는 바뀌지 않는다
    const before = schedule(plan.menu, pc.dates, planCookDate(plan))
    for (const s of slots) expect(s.recipe).toBe(before.find((x) => x.date === s.date)!.recipe)
  })
})

describe('직접 추가한 항목 (D9)', () => {
  it('같은 주에 메뉴를 바꾸면 이어 쓰고, 다음 주 계획에서는 비운다', () => {
    const prev = { ...confirmPlan(null, [a, b], c), extras: [{ name: '휴지', done: false }] }
    expect(confirmPlan(prev, [a], c).extras).toEqual(prev.extras)
    expect(confirmPlan(prev, [a], { ...c, dates: nextWeek('2026-10-29', true) }).extras).toEqual([])
  })

  it('이름이 빈 저장값은 버린다', () => {
    const plan = loadPlan(basis, fakeStorage(JSON.stringify({ recipeIds: [a.id], extras: [{ name: ' ' }, { name: '우유', done: 'x' }, 3] })))!
    expect(plan.extras).toEqual([{ name: '우유', done: false }])
  })
})
