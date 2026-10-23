// B1, A9, F1 추천안 3개. 무엇이 좋은지가 다른 조합을 하나씩 골라 사용자가 고르게 한다.
// 장보기 간단: 장볼 품목이 가장 적은 조합(같으면 겹침 점수) / 가장 저렴: 예상 금액이 가장 낮은 조합 /
// 집 양념으로: 새로 살 양념이 가장 적은 조합. 셋이 같으면 다음 순위로 채워 서로 다른 조합을 보여준다
import { config } from '../config'
import type { Conditions } from '../conditions'
import { priceOf } from '../data/prices'
import type { Recipe } from '../data/recipes'
import { combinationCount, filterCandidates, greedyCombos, maxMenus, missingSeasonings, overlapScore, searchCombos, topCombos, type Rng } from './menu'
import { buildShoppingList, servingsOf } from './shopping'

export type MenuOptionKind = 'simple' | 'cheap' | 'pantry'

export type MenuOption = {
  kind: MenuOptionKind
  menu: Recipe[]
  cost: number // D4 예상 금액
  items: number // 장보기 목록 품목 수 (집에 있는 양념 제외)
  missing: number // A9 새로 살 양념 종류
}

export const OPTION_LABEL: Record<MenuOptionKind, string> = { simple: '장보기 간단', cheap: '가장 저렴', pantry: '집 양념으로' }

const key = (menu: Recipe[]) => menu.map((r) => r.id).sort().join()

function evaluate(menu: Recipe[], c: Conditions) {
  const list = buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf)
  const missing = missingSeasonings(menu, c.pantry)
  const score = overlapScore(menu) - missing * config.menuSearch.missingSeasoningPenalty
  return { menu, cost: list.total, items: list.items.length, missing, score }
}
type Evaluated = ReturnType<typeof evaluate>

const ORDER: Record<MenuOptionKind, (a: Evaluated, b: Evaluated) => number> = {
  // 겹침 점수는 겹치는 재료 수만 세서 전체 품목이 많은 조합도 높게 나온다. 그래서 품목 수를 먼저 본다
  simple: (a, b) => a.items - b.items || b.score - a.score || a.cost - b.cost,
  cheap: (a, b) => a.cost - b.cost || b.score - a.score,
  pantry: (a, b) => a.missing - b.missing || b.score - a.score || a.cost - b.cost,
}

// 후보 조합: 겹침 점수 상위, 새로 살 양념이 적은 상위, 탐욕 조합을 합친다
function candidateCombos(candidates: Recipe[], count: number, c: Conditions, rng: Rng): Recipe[][] {
  const { maxCombos, keep } = config.menuSearch
  const combos = [...searchCombos(candidates, count, c.pantry, rng), ...greedyCombos(candidates, count, c.pantry, rng)]
  if (combinationCount(candidates.length, count) <= maxCombos)
    combos.push(...topCombos(candidates, count, c.pantry, keep, (overlap, missing) => overlap / 100 - missing).map((x) => x.menu))
  const unique = new Map(combos.map((m) => [key(m), m]))
  return [...unique.values()]
}

// useBudget이면 예산 안 조합만 쓰고(F1), 하나도 없으면 가장 싼 조합 하나와 초과 표시를 돌려준다
export function buildMenuOptions(c: Conditions, useBudget: boolean, rng: Rng = Math.random): { options: MenuOption[]; overBudget: boolean } {
  const candidates = filterCandidates(c)
  const count = Math.min(c.menuCount, maxMenus(c, candidates))
  if (!count) return { options: [], overBudget: false }
  // 같은 순위끼리는 무작위 순서가 되도록 먼저 섞는다 (매번 같은 메뉴만 나오지 않게)
  const pool = candidateCombos(candidates, count, c, rng)
    .map((m) => ({ m, r: rng() }))
    .sort((a, b) => a.r - b.r)
    .map(({ m }) => evaluate(m, c))
  const fit = useBudget && !c.cheapest ? pool.filter((x) => x.cost <= c.budget) : pool
  if (!fit.length) {
    const cheapest = [...pool].sort(ORDER.cheap)[0]
    return { options: [{ kind: 'cheap', ...cheapest }], overBudget: true }
  }

  const kinds: MenuOptionKind[] = c.cheapest ? ['cheap', 'simple', 'pantry'] : ['simple', 'cheap', 'pantry']
  const used = new Set<string>()
  const options: MenuOption[] = []
  for (const kind of kinds) {
    const pick = [...fit].sort(ORDER[kind]).find((x) => !used.has(key(x.menu)))
    if (!pick) continue
    used.add(key(pick.menu))
    options.push({ kind, menu: pick.menu, cost: pick.cost, items: pick.items, missing: pick.missing })
  }
  return { options, overBudget: false }
}
