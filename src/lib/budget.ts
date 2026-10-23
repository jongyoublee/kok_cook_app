// F1~F3 예산. A는 예산 안에서 메뉴를 고르고(U12), B는 구성 후 예산을 넘으면 교체를 제안한다(U25)
import { config } from '../config'
import type { Conditions } from '../conditions'
import { priceOf } from '../data/prices'
import type { Recipe } from '../data/recipes'
import { bestCombo, filterCandidates, greedyCombos, maxMenus, searchCombos, type Rng } from './menu'
import { buildShoppingList, servingsOf } from './shopping'

// F3 설정값으로 고르고, 주소에 ?budget=A 또는 ?budget=B가 있으면 그걸 쓴다(비교 시험용)
export function budgetVersion(search = globalThis.location?.search ?? ''): 'A' | 'B' {
  const v = new URLSearchParams(search).get('budget')
  return v === 'A' || v === 'B' ? v : config.budgetVersion
}

// 메뉴 조합의 예상 금액 = 장보기 목록 합계 (판매 단위, 집에 있는 양념 제외)
export const menuCost = (menu: Recipe[], c: Conditions) => buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf).total

const cheapestOf = (combos: Recipe[][], c: Conditions) =>
  combos.reduce((min, m) => (menuCost(m, c) < menuCost(min, c) ? m : min), combos[0] ?? [])

// F1 예산 안에 드는 조합 중 점수가 가장 높은 것. 없거나 "가장 싸게"면 가장 싼 조합
export function buildMenuInBudget(c: Conditions, rng: Rng = Math.random): { menu: Recipe[]; overBudget: boolean } {
  const candidates = filterCandidates(c)
  const count = Math.min(c.menuCount, maxMenus(c, candidates))
  // 점수 상위 조합에 탐욕 조합을 더해, 점수는 낮아도 싼 조합이 후보에서 빠지지 않게 한다
  const combos = [...searchCombos(candidates, count, c.pantry, rng), ...greedyCombos(candidates, count, c.pantry, rng)]
  if (c.cheapest) return { menu: cheapestOf(combos, c), overBudget: false }
  const fit = combos.filter((m) => menuCost(m, c) <= c.budget)
  if (fit.length) return { menu: bestCombo(fit, c.pantry, rng), overBudget: false }
  return { menu: cheapestOf(combos, c), overBudget: true }
}

export type SwapSuggestion = { menu: Recipe[]; from: Recipe; to: Recipe; saving: number }

// F2 메뉴 하나를 바꿔 예상 금액이 가장 많이 줄어드는 교체. 줄일 수 없으면 null
export function suggestSwap(menu: Recipe[], c: Conditions): SwapSuggestion | null {
  const now = menuCost(menu, c)
  let found: SwapSuggestion | null = null
  for (const [i, from] of menu.entries())
    for (const to of filterCandidates(c)) {
      if (menu.includes(to)) continue
      const next = menu.with(i, to)
      const saving = now - menuCost(next, c)
      if (saving > (found?.saving ?? 0)) found = { menu: next, from, to, saving }
    }
  return found
}
