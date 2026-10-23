// B1, A9, F1 추천안 3개. 무엇이 좋은지가 다른 조합을 하나씩 골라 사용자가 고르게 한다.
// 장보기 간단: 장볼 품목이 가장 적은 조합(같으면 겹침 점수) / 가장 저렴: 예상 금액이 가장 낮은 조합 /
// 집 양념으로: 새로 살 양념이 가장 적은 조합. 셋이 같으면 다음 순위로 채워 서로 다른 조합을 보여준다
import { config } from '../config'
import type { Conditions } from '../conditions'
import { priceOf } from '../data/prices'
import type { Recipe } from '../data/recipes'
import {
  combinationCount,
  filterCandidates,
  fitsSpread,
  greedyCombos,
  maxMenus,
  missingSeasonings,
  overlapScore,
  proteinSpread,
  searchCombos,
  topCombos,
  type Rng,
} from './menu'
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
// B6 분산 규칙에 맞는 조합만 쓰고, 맞는 조합이 하나도 없으면 규칙 없이 만든다
function candidateCombos(candidates: Recipe[], count: number, c: Conditions, rng: Rng): Recipe[][] {
  const { maxCombos, keep } = config.menuSearch
  const spread = proteinSpread(c.proteins, count)
  const combos = [...searchCombos(candidates, count, c.pantry, rng, spread), ...greedyCombos(candidates, count, c.pantry, rng, spread)]
  if (combinationCount(candidates.length, count) <= maxCombos)
    combos.push(...topCombos(candidates, count, c.pantry, keep, (overlap, missing) => overlap / 100 - missing, spread).map((x) => x.menu))
  const fit = combos.filter((m) => fitsSpread(m, spread))
  const unique = new Map((fit.length ? fit : combos).map((m) => [key(m), m]))
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

export type AddSuggestion = {
  recipe: Recipe
  extraCost: number // 메뉴를 더했을 때 예상 금액이 늘어나는 양 (남는 재료를 쓰면 작아진다)
  leftovers: { name: string; amount: number; unit: string }[] // 지금 장보기에서 남는데 이 메뉴가 쓰는 주재료
}

// 주재료 코너. 양념·채소는 남는 재료 안내에서 뺀다
const MAIN_CORNERS = new Set(['육류·달걀', '수산', '두부·콩'])

// B3, D3, F1 "이 레시피는 어떤가요?" 지금 메뉴와 맛 계열이 다른 메뉴 하나를 더해 보자고 제안한다.
// 메뉴를 더했다고 보고 장보기와 먹는 날짜를 다시 계산해 늘어나는 금액이 가장 적은 메뉴를 고른다.
// 남는 재료를 쓰는 메뉴일수록 금액이 덜 늘어 앞에 온다. 단백질은 B6 분산 규칙을 따른다
// (단백질을 1개만 골랐으면 같은 단백질, 여러 개면 규칙 안에서 다른 단백질도 나온다).
// useBudget이면(버전 A) 더한 뒤에도 예산 안이어야 한다. 더할 수 없으면 null
export function suggestAddition(menu: Recipe[], c: Conditions, useBudget: boolean): AddSuggestion | null {
  const candidates = filterCandidates(c)
  if (!menu.length || menu.length >= maxMenus(c, candidates)) return null
  const now = buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf)
  const flavors = new Set(menu.map((r) => r.flavor))

  const spread = proteinSpread(c.proteins, menu.length + 1) // B6 더한 뒤에도 분산 규칙 안
  const scored = candidates
    .filter((r) => !menu.includes(r) && !flavors.has(r.flavor) && fitsSpread([...menu, r], spread))
    .map((r) => {
      const next = [...menu, r]
      const cost = buildShoppingList(next, servingsOf(next, c), c.pantry, priceOf).total
      return { r, cost, extraCost: cost - now.total, overlap: overlapScore(next) }
    })
    .filter((x) => !useBudget || c.cheapest || x.cost <= c.budget)
    .sort((a, b) => a.extraCost - b.extraCost || b.overlap - a.overlap)
  const pick = scored[0]
  if (!pick) return null

  const uses = new Set(pick.r.ingredients.map((i) => i.id))
  const leftovers = now.items
    .filter((it) => uses.has(it.id) && it.leftover > 0 && MAIN_CORNERS.has(it.corner))
    .map((it) => ({ name: it.name, amount: it.leftover, unit: it.unit }))
  return { recipe: pick.r, extraCost: pick.extraCost, leftovers }
}
