import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { recipes } from '../data/recipes'
import { config } from '../config'
import { budgetOf, budgetRange, budgetVersion, menuCost, menuOptionsFor, suggestSwap } from './budget'
import { coupangLink, coupangSearchUrl } from './coupang'
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
    expect(budgetVersion('?budget=off')).toBe('off')
    expect(budgetVersion('?budget=x')).toBe(config.budgetVersion)
  })

  it('기본은 예산을 묻지 않는다 (2026-10-24)', () => {
    expect(config.budgetVersion).toBe('off')
  })

  it('예산을 끄면 저장된 가장 싸게 구성을 무시하고 한 주 플렉스도 없다', () => {
    const on = { ...c, cheapest: true }
    const kinds = (v: 'A' | 'B' | 'off') => menuOptionsFor(on, v, () => 0).options.map((o) => o.kind)
    expect(kinds('A')[0]).toBe('cheap')
    expect(kinds('off')[0]).not.toBe('cheap')
    expect(menuOptionsFor(c, 'off', () => 0).options.map((o) => o.kind)).not.toContain('flex')
  })

  it('재료마다 판매 단위를 넣은 검색어로 연결한다 (G1)', () => {
    expect(coupangLink('onion')).toBe(coupangSearchUrl('국내산 양파 1kg'))
  })

  it('재료 이름으로 쿠팡 검색 링크를 만든다', () => {
    expect(coupangSearchUrl('돼지고기 앞다리살')).toBe('https://www.coupang.com/np/search?q=%EB%8F%BC%EC%A7%80%EA%B3%A0%EA%B8%B0%20%EC%95%9E%EB%8B%A4%EB%A6%AC%EC%82%B4')
  })
})

describe('예산 범위 (A7)', () => {
  const { step } = config.budget

  // 메뉴 5개는 싼 레시피만으로 분산 규칙을 못 지켜 느린 길(추천안 전체 계산)로 간다
  it.each([2, 3, 5])('메뉴 %i개: 최소는 가장 싼 조합 금액(올림) 이하이고, 최소 예산으로도 예산 안 추천안이 나온다', (menuCount) => {
    const cond = { ...c, menuCount }
    const r = budgetRange(cond)
    const cheapest = buildMenuOptions({ ...cond, cheapest: true }, undefined, () => 0).options[0].cost
    // 싼 조합 후보가 추천안 전체보다 더 싼 조합을 찾으면 최소가 더 낮을 수는 있다
    expect(r.min).toBeLessThanOrEqual(Math.ceil(cheapest / step) * step)
    expect(r.min % step).toBe(0)
    expect(r.max % step).toBe(0)
    expect(r.max).toBeGreaterThan(r.min)
    expect(buildMenuOptions(cond, r.min, () => 0).overBudget).toBe(false)
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
