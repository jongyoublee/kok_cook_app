import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { recipes } from '../data/recipes'
import { nextWeek } from './dates'
import { cookDateOptions, effectiveCookDate, fridgeLimit, schedule, thawDate } from './storagePlan'

const today = '2026-10-22'
const weekdays = nextWeek(today, true) // 10/26(월)~10/30(금)
const everyday = nextWeek(today, false) // 10/26~11/1
const cook = '2026-10-25'
const byId = (id: string) => recipes.find((r) => r.id === id)!
const pork = byId('spicy-pork') // 냉동 가능, 냉장 3일
const bulgogi = byId('beef-bulgogi') // 냉동 가능, 냉장 3일
const mackerel = byId('mackerel-kimchi') // 냉동 가능, 냉장 2일
const stew = byId('braised-tofu') // 냉동 비추천, 냉장 3일

describe('냉장·냉동 분배, 날짜 기준안 (E1)', () => {
  it('조리일부터 냉장 일수 안은 냉장, 넘으면 냉동', () => {
    const slots = schedule([pork, bulgogi], weekdays, cook, 'byDate')
    expect(slots.map((s) => s.place)).toEqual(['fridge', 'fridge', 'fridge', 'freezer', 'freezer'])
    expect(slots.map((s) => s.date)).toEqual(weekdays)
  })

  it('레시피 냉장 일수가 설정보다 짧으면 짧은 쪽을 따른다', () => {
    expect(fridgeLimit(mackerel)).toBe(Math.min(2, config.foodSafety.fridgeDays))
    const slots = schedule([mackerel], weekdays, cook, 'byDate')
    expect(slots.map((s) => s.place)).toEqual(['fridge', 'fridge', 'freezer', 'freezer', 'freezer'])
  })

  it('조리일을 앞당기면 냉장 끼니가 줄어든다', () => {
    const slots = schedule([pork, bulgogi], weekdays, '2026-10-24', 'byDate')
    expect(slots.filter((s) => s.place === 'fridge')).toHaveLength(2)
  })
})

describe('냉장·냉동 분배, 끼니 수 기준 초안 (E1)', () => {
  it('7끼 미만은 전부 냉장, 이상은 앞 절반 냉장', () => {
    expect(schedule([pork, bulgogi], weekdays, cook, 'byMealCount').every((s) => s.place === 'fridge')).toBe(true)
    const seven = schedule([pork, bulgogi], everyday, cook, 'byMealCount')
    expect(seven.map((s) => s.place)).toEqual(['fridge', 'fridge', 'fridge', 'fridge', 'freezer', 'freezer', 'freezer'])
  })
})

describe('냉동이 안 맞는 메뉴 (E2)', () => {
  it('앞 날짜 냉장 칸에 먼저 놓는다', () => {
    const slots = schedule([pork, stew], weekdays, cook, 'byDate')
    for (const s of slots.filter((x) => x.recipe === stew)) expect(s.place).toBe('fridge')
    expect(slots.some((s) => s.tooLong)).toBe(false)
  })

  it('냉장 기간 안에 다 못 들어가면 냉장에 두되 경고 표시', () => {
    const slots = schedule([stew], weekdays, cook, 'byDate')
    expect(slots.every((s) => s.place === 'fridge')).toBe(true)
    expect(slots.filter((s) => s.tooLong).map((s) => s.date)).toEqual(['2026-10-29', '2026-10-30'])
  })
})

describe('해동과 조리일 (E1, E3)', () => {
  it('냉동 끼니는 전날 냉장실로 옮긴다', () => {
    const frozen = schedule([pork, bulgogi], weekdays, cook, 'byDate').find((s) => s.place === 'freezer')!
    expect(thawDate(frozen)).toBe('2026-10-28')
  })

  it('조리일은 오늘부터 첫 식사일 전날까지, 최대 7일 전까지', () => {
    expect(cookDateOptions(today, weekdays)).toEqual(['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'])
    expect(cookDateOptions('2026-10-01', weekdays)).toHaveLength(7)
    expect(cookDateOptions('2026-10-26', weekdays)).toEqual([])
  })

  it('저장한 조리일을 고를 수 없게 되면 첫 식사일 전날', () => {
    expect(effectiveCookDate('2026-10-23', today, weekdays)).toBe('2026-10-23')
    expect(effectiveCookDate('2026-10-27', today, weekdays)).toBe(cook)
    expect(effectiveCookDate(undefined, today, weekdays)).toBe(cook)
  })
})
