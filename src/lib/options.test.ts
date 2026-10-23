import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { menuCost } from './budget'
import { filterCandidates, greedyCombos, missingSeasonings } from './menu'
import { buildMenuOptions, suggestAddition } from './options'

const today = '2026-10-22'
const c = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS, pantry: ['soySauce' as const, 'salt' as const] }
const first = () => 0
const ids = (menu: { id: string }[]) => menu.map((r) => r.id).sort().join()
const greedyCosts = () => greedyCombos(filterCandidates(c), c.menuCount, c.pantry, first).map((m) => menuCost(m, c))

describe('추천안 3개 (B1, A9)', () => {
  const { options, overBudget } = buildMenuOptions(c, false, first)

  it('장보기 간단, 가장 저렴, 집 양념으로 순서로 서로 다른 조합 3개', () => {
    expect(overBudget).toBe(false)
    expect(options.map((o) => o.kind)).toEqual(['simple', 'cheap', 'pantry'])
    expect(new Set(options.map((o) => ids(o.menu))).size).toBe(3)
    for (const o of options) expect(o.menu).toHaveLength(c.menuCount)
  })

  it('각 추천안의 숫자는 그 조합을 직접 계산한 값과 같다', () => {
    for (const o of options) {
      expect(o.cost).toBe(menuCost(o.menu, c))
      expect(o.missing).toBe(missingSeasonings(o.menu, c.pantry))
    }
  })

  it('장보기 간단은 품목이 가장 적고, 가장 저렴은 탐욕 조합보다 비싸지 않다', () => {
    const [simple, cheap, pantry] = options
    expect(simple.items).toBeLessThanOrEqual(Math.min(cheap.items, pantry.items))
    expect(cheap.cost).toBeLessThanOrEqual(Math.min(...greedyCosts()))
  })

  it('집 양념으로는 새로 살 양념이 가장 적다', () => {
    const [simple, cheap, pantry] = options
    expect(pantry.missing).toBeLessThanOrEqual(Math.min(simple.missing, cheap.missing))
  })
})

describe('예산 버전 A (F1)', () => {
  it('예산 안에 드는 조합만 추천한다', () => {
    const budget = Math.max(...greedyCosts())
    const { options, overBudget } = buildMenuOptions({ ...c, budget }, true, first)
    expect(overBudget).toBe(false)
    for (const o of options) expect(o.cost).toBeLessThanOrEqual(budget)
  })

  it('예산 안에 드는 조합이 없으면 가장 싼 조합 하나와 초과 표시', () => {
    const { options, overBudget } = buildMenuOptions({ ...c, budget: 1 }, true, first)
    expect(overBudget).toBe(true)
    expect(options).toHaveLength(1)
    expect(options[0].cost).toBe(buildMenuOptions(c, false, first).options.find((o) => o.kind === 'cheap')!.cost)
  })

  it('가장 싸게 구성이면 예산과 상관없이 가장 저렴이 첫 추천안', () => {
    const { options } = buildMenuOptions({ ...c, cheapest: true, budget: 1 }, true, first)
    expect(options[0].kind).toBe('cheap')
    expect(options.length).toBeGreaterThan(1)
  })

  it('예산 버전 B처럼 예산을 쓰지 않으면 예산을 보지 않는다', () => {
    expect(buildMenuOptions({ ...c, budget: 1 }, false, first).overBudget).toBe(false)
  })
})

describe('이 레시피는 어떤가요? (B3, D3)', () => {
  const pool = filterCandidates(c)
  const pork = pool.find((r) => r.id === 'spicy-pork')!

  it('같은 단백질이면서 맛 계열이 다른 메뉴를, 늘어나는 금액이 가장 적은 것으로 제안한다', () => {
    const s = suggestAddition([pork], c, false)!
    expect(s.recipe.proteinSource).toBe('pork')
    expect(s.recipe.flavor).not.toBe(pork.flavor)
    expect(s.extraCost).toBe(menuCost([pork, s.recipe], c) - menuCost([pork], c))
    const others = pool.filter((r) => r !== pork && r.proteinSource === 'pork' && r.flavor !== pork.flavor)
    for (const r of others) expect(s.extraCost).toBeLessThanOrEqual(menuCost([pork, r], c) - menuCost([pork], c))
  })

  it('남는 주재료를 쓰면 알려준다', () => {
    const s = suggestAddition([pork], c, false)!
    for (const l of s.leftovers) expect(l.amount).toBeGreaterThan(0)
  })

  it('버전 A는 더한 뒤에도 예산 안이어야 하고, 안 되면 제안하지 않는다', () => {
    expect(suggestAddition([pork], { ...c, budget: menuCost([pork], c) }, true)).toBeNull()
    expect(suggestAddition([pork], { ...c, budget: menuCost([pork], c) }, false)).not.toBeNull()
  })

  it('메뉴가 끼니 수나 최대 개수만큼 차 있으면 제안하지 않는다', () => {
    const twoDays = { ...c, dates: c.dates.slice(0, 2) }
    expect(suggestAddition(pool.slice(0, 2), twoDays, false)).toBeNull()
  })
})
