import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { recipes } from '../data/recipes'
import { config } from '../config'
import { budgetOf, budgetRange, budgetVersion, menuCost, suggestSwap } from './budget'
import { coupangSearchUrl } from './coupang'
import { filterCandidates } from './menu'
import { buildMenuOptions } from './options'

const today = '2026-10-22'
const c = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS }

describe('예상 금액 (D4)', () => {
  it('집에 있는 양념은 예상 금액에서 빠진다', () => {
    const menu = recipes.slice(0, 2)
    expect(menuCost(menu, { ...c, pantry: ['soySauce'] })).toBeLessThan(menuCost(menu, c))
  })
})

describe('예산 버전 B (F2)', () => {
  it('메뉴 하나를 바꿔 가장 많이 줄어드는 교체를 제안한다', () => {
    const pool = filterCandidates(c)
    const menu = [...pool].sort((a, b) => menuCost([b], c) - menuCost([a], c)).slice(0, 2) // 비싼 두 개
    const s = suggestSwap(menu, c)!
    expect(s.saving).toBeGreaterThan(0)
    expect(menuCost(s.menu, c)).toBe(menuCost(menu, c) - s.saving)
    expect(s.menu).toContain(s.to)
    expect(s.menu).not.toContain(s.from)
    expect(new Set(s.menu).size).toBe(2)
  })

  it('더 싸게 바꿀 수 없으면 제안 없음', () => {
    const pool = filterCandidates(c)
    expect(suggestSwap(pool, c)).toBeNull() // 후보를 다 쓰면 바꿀 메뉴가 없다
  })
})

describe('버전 전환과 쿠팡 링크 (F3, G1)', () => {
  it('주소의 budget 값이 설정보다 먼저', () => {
    expect(budgetVersion('?budget=B')).toBe('B')
    expect(budgetVersion('?budget=A')).toBe('A')
    expect(['A', 'B']).toContain(budgetVersion('?budget=x'))
  })

  it('재료 이름으로 쿠팡 검색 링크를 만든다', () => {
    expect(coupangSearchUrl('돼지고기 앞다리살')).toBe('https://www.coupang.com/np/search?q=%EB%8F%BC%EC%A7%80%EA%B3%A0%EA%B8%B0%20%EC%95%9E%EB%8B%A4%EB%A6%AC%EC%82%B4')
  })
})

describe('예산 범위 (A7)', () => {
  const cheapestCost = (cond: typeof c) => buildMenuOptions({ ...cond, cheapest: true }, undefined, () => 0).options[0].cost
  const { step, maxMultiplier } = config.budget

  it('가장 싼 조합 금액(내림)부터 그 배수(올림)까지', () => {
    const r = budgetRange(c)
    const cheapest = cheapestCost(c)
    expect(r.min).toBe(Math.floor(cheapest / step) * step)
    expect(r.max).toBe(Math.ceil((cheapest * maxMultiplier) / step) * step)
    expect(r.min).toBeLessThanOrEqual(cheapest)
    expect(r.min % step).toBe(0)
    expect(r.max % step).toBe(0)
  })

  it('인원이 늘면 범위도 커진다', () => {
    const one = budgetRange(c)
    const two = budgetRange({ ...c, people: 2 })
    expect(two.min).toBeGreaterThan(one.min)
    expect(two.max).toBeGreaterThan(one.max)
  })

  it('정하지 않은 예산은 범위 중간, 정한 예산은 범위 안으로 맞춘다', () => {
    const r = budgetRange(c)
    const mid = budgetOf({ ...c, budget: null })
    expect(mid).toBeGreaterThanOrEqual(r.min)
    expect(mid).toBeLessThanOrEqual(r.max)
    expect(mid % step).toBe(0)
    expect(budgetOf({ ...c, budget: 1 })).toBe(r.min)
    expect(budgetOf({ ...c, budget: 10_000_000 })).toBe(r.max)
    expect(budgetOf({ ...c, budget: r.min + step })).toBe(r.min + step)
  })

  it('후보가 없으면 설정의 기본 범위', () => {
    expect(budgetRange({ ...c, proteins: [] })).toEqual({ min: config.budget.fallbackMin, max: config.budget.fallbackMax, step })
  })
})
