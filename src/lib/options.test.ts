import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { ingredients, type Ingredient } from '../data/ingredients'
import type { Recipe } from '../data/recipes'
import { menuCost } from './budget'
import { filterCandidates, fitsSpread, greedyCombos, menuSpread, missingSeasonings } from './menu'
import { buildMenuOptions, suggestAddition } from './options'

const today = '2026-10-22'
const c = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS, pantry: ['soySauce' as const, 'salt' as const] }
const first = () => 0
const ids = (menu: { id: string }[]) => menu.map((r) => r.id).sort().join()
// 추천안과 같은 분산 규칙(B6·조리법)을 지키는 탐욕 조합의 금액
const greedyCosts = () => {
  const spread = menuSpread(c.proteins, c.menuCount)
  return greedyCombos(filterCandidates(c), c.menuCount, c.pantry, first, spread)
    .filter((m) => fitsSpread(m, spread))
    .map((m) => menuCost(m, c))
}

describe('추천안 3개 (B1, A9)', () => {
  const { options, overBudget } = buildMenuOptions(c, undefined, first)

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
    const { options, overBudget } = buildMenuOptions(c, budget, first)
    expect(overBudget).toBe(false)
    for (const o of options) expect(o.cost).toBeLessThanOrEqual(budget)
  })

  it('예산 안에 드는 조합이 없으면 가장 싼 조합 하나와 초과 표시', () => {
    const { options, overBudget } = buildMenuOptions(c, 1, first)
    expect(overBudget).toBe(true)
    expect(options).toHaveLength(1)
    expect(options[0].cost).toBe(buildMenuOptions(c, undefined, first).options.find((o) => o.kind === 'cheap')!.cost)
  })

  it('가장 싸게 구성이면 예산과 상관없이 가장 저렴이 첫 추천안', () => {
    const { options } = buildMenuOptions({ ...c, cheapest: true }, 1, first)
    expect(options[0].kind).toBe('cheap')
    expect(options.length).toBeGreaterThan(1)
  })

  it('예산 버전 B처럼 예산을 쓰지 않으면 예산을 보지 않는다', () => {
    expect(buildMenuOptions(c, undefined, first).overBudget).toBe(false)
  })
})

describe('이 레시피는 어떤가요? (B3, D3)', () => {
  const pool = filterCandidates(c)
  const pork = pool.find((r) => r.id === 'spicy-pork')!

  const porkOnly = { ...c, proteins: ['pork' as const] }

  it('단백질을 1개만 골랐으면 같은 단백질이면서 맛이 다른 메뉴를, 늘어나는 금액이 가장 적은 것으로 제안한다', () => {
    const s = suggestAddition([pork], porkOnly)!
    expect(s.recipe.proteinSource).toBe('pork')
    expect(s.recipe.flavor).not.toBe(pork.flavor)
    expect(s.extraCost).toBe(menuCost([pork, s.recipe], porkOnly) - menuCost([pork], porkOnly))
    // 메뉴 2개면 조리법도 달라야 한다
    expect(s.recipe.method).not.toBe(pork.method)
    const others = filterCandidates(porkOnly).filter((r) => r !== pork && r.flavor !== pork.flavor && r.method !== pork.method)
    for (const r of others) expect(s.extraCost).toBeLessThanOrEqual(menuCost([pork, r], porkOnly) - menuCost([pork], porkOnly))
  })

  it('남는 주재료를 쓰면 알려준다', () => {
    // 4끼면 앞다리살 480g이 필요하고, 판매 단위로 사고 남는 양을 알려준다
    const fourDays = { ...porkOnly, dates: porkOnly.dates.slice(0, 4) }
    const s = suggestAddition([pork], fourDays)!
    const names = s.recipe.ingredients.map((i) => i.id)
    for (const l of s.leftovers) expect(l.amount).toBeGreaterThan(0)
    const pack = ingredients.porkShoulder.saleUnit.amount
    const left = Math.ceil(480 / pack) * pack - 480
    if (names.includes('porkShoulder') && left > 0) expect(s.leftovers).toContainEqual({ name: '돼지고기 앞다리살', amount: left, unit: 'g' })
  })

  it('단백질을 여러 개 골랐으면 분산 규칙 안에서 제안한다 (B6)', () => {
    const s = suggestAddition([pork], c)!
    expect(fitsSpread([pork, s.recipe], menuSpread(c.proteins, 2))).toBe(true)
    expect(s.recipe.proteinSource).not.toBe('pork')
  })

  it('버전 A는 더한 뒤에도 예산 안이어야 하고, 안 되면 제안하지 않는다', () => {
    expect(suggestAddition([pork], c, menuCost([pork], c))).toBeNull()
    expect(suggestAddition([pork], c)).not.toBeNull()
  })

  it('메뉴가 끼니 수나 최대 개수만큼 차 있으면 제안하지 않는다', () => {
    const twoDays = { ...c, dates: c.dates.slice(0, 2) }
    expect(suggestAddition(pool.slice(0, 2), twoDays)).toBeNull()
  })
})

describe('한 주 플렉스 (B1, F1)', () => {
  const budget = 150_000
  const { options } = buildMenuOptions(c, budget, first)
  const flex = options.find((o) => o.kind === 'flex')!
  const premiumMeals = (menu: Recipe[]) => menu.filter((r) => r.ingredients.some((i) => (ingredients[i.id] as Ingredient).premium)).length

  it('예산 버전 A에서 네 번째 추천안으로, 예산 안에서 고급 재료가 들어간다', () => {
    expect(options.map((o) => o.kind)).toEqual(['simple', 'cheap', 'pantry', 'flex'])
    expect(flex.cost).toBeLessThanOrEqual(budget)
    expect(flex.premium.length).toBeGreaterThan(0)
  })

  it('다른 추천안보다 고급 재료 메뉴가 적지 않다', () => {
    for (const o of options) expect(premiumMeals(flex.menu)).toBeGreaterThanOrEqual(premiumMeals(o.menu))
  })

  it('예산을 쓰지 않거나 가장 싸게 구성이면 없다', () => {
    expect(buildMenuOptions(c, undefined, first).options.map((o) => o.kind)).not.toContain('flex')
    expect(buildMenuOptions({ ...c, cheapest: true }, budget, first).options.map((o) => o.kind)).not.toContain('flex')
  })

  it('고급 재료 메뉴를 고를 수 없으면 없다', () => {
    const noPremium = { ...c, proteins: ['pork' as const, 'egg' as const] }
    expect(buildMenuOptions(noPremium, budget, first).options.map((o) => o.kind)).not.toContain('flex')
  })
})
