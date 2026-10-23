// F1~F3 예산. A는 예산 안에서 메뉴를 고르고(U12, lib/options), B는 구성 후 예산을 넘으면 교체를 제안한다(U25)
import { config } from '../config'
import type { Conditions } from '../conditions'
import { priceOf } from '../data/prices'
import type { Recipe } from '../data/recipes'
import { filterCandidates } from './menu'
import { buildMenuOptions } from './options'
import { buildShoppingList, servingsOf } from './shopping'

// F3 설정값으로 고르고, 주소에 ?budget=A 또는 ?budget=B가 있으면 그걸 쓴다(비교 시험용)
export function budgetVersion(search = globalThis.location?.search ?? ''): 'A' | 'B' {
  const v = new URLSearchParams(search).get('budget')
  return v === 'A' || v === 'B' ? v : config.budgetVersion
}

// 메뉴 조합의 예상 금액 = 장보기 목록 합계 (판매 단위, 집에 있는 양념 제외)
export const menuCost = (menu: Recipe[], c: Conditions) => buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf).total

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

export type BudgetRange = { min: number; max: number; step: number }

// 범위는 예산·'가장 싸게 구성'과 상관없는 조건으로만 정해진다. 화면이 다시 그려질 때마다 계산하지 않도록 기억해 둔다
const rangeCache = new Map<string, BudgetRange>()
const rangeKey = (c: Conditions) => JSON.stringify([c.dates, c.meals, c.people, c.menuCount, c.proteins, c.carbs, c.pantry])

// A7 슬라이더 범위: 지금 조건에서 가장 싼 조합 금액부터 그 maxMultiplier배까지
export function budgetRange(c: Conditions): BudgetRange {
  const key = rangeKey(c)
  const hit = rangeCache.get(key)
  if (hit) return hit
  const { step, maxMultiplier, fallbackMin, fallbackMax } = config.budget
  const cheapest = buildMenuOptions({ ...c, cheapest: true }, undefined, () => 0).options[0]?.cost
  const range = cheapest
    ? { min: Math.max(step, Math.floor(cheapest / step) * step), max: Math.ceil((cheapest * maxMultiplier) / step) * step, step }
    : { min: fallbackMin, max: fallbackMax, step }
  if (rangeCache.size > 50) rangeCache.clear()
  rangeCache.set(key, range)
  return range
}

// 실제로 쓰는 예산: 정하지 않았으면 범위 중간, 정했으면 범위 안으로 맞춘 값
export function budgetOf(c: Conditions, range: BudgetRange = budgetRange(c)): number {
  if (c.budget === null) return Math.round((range.min + range.max) / 2 / range.step) * range.step
  return Math.min(range.max, Math.max(range.min, c.budget))
}
