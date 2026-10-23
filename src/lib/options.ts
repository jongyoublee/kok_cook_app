// B1, A9, F1 추천안 3개. 무엇이 좋은지가 다른 조합을 하나씩 골라 사용자가 고르게 한다.
// 장보기 간단: 장볼 품목이 가장 적은 조합(같으면 겹침 점수) / 가장 저렴: 예상 금액이 가장 낮은 조합 /
// 집 양념으로: 새로 살 양념이 가장 적은 조합 / 한 주 플렉스(예산 버전 A만): 예산 안에서 고급 재료 끼니 비중이 가장 높은 조합.
// 서로 같으면 다음 순위로 채워 서로 다른 조합을 보여준다
import { config } from '../config'
import type { Conditions } from '../conditions'
import { priceOf } from '../data/prices'
import { ingredients, type Ingredient } from '../data/ingredients'
import type { Recipe } from '../data/recipes'
import {
  combinationCount,
  filterCandidates,
  fitsSpread,
  greedyCombos,
  maxMenus,
  missingSeasonings,
  overlapScore,
  menuSpread,
  relaxations,
  scoreOf,
  topCombosBy,
  type Rng,
} from './menu'
import { buildShoppingList, servingsOf } from './shopping'

export type MenuOptionKind = 'simple' | 'cheap' | 'pantry' | 'flex'

export type MenuOption = {
  kind: MenuOptionKind
  menu: Recipe[]
  cost: number // D4 예상 금액
  items: number // 장보기 목록 품목 수 (집에 있는 양념 제외)
  missing: number // A9 새로 살 양념 종류
  premium: string[] // 들어가는 고급 재료의 짧은 이름 (한 주 플렉스 표시용)
}

export const OPTION_LABEL: Record<MenuOptionKind, string> = { simple: '장보기 간단', cheap: '가장 저렴', pantry: '집 양념으로', flex: '한 주 플렉스' }

// 레시피별 고급 재료 이름은 바뀌지 않으므로 한 번만 계산한다
const premiumCache = new WeakMap<Recipe, string[]>()
const premiumOf = (r: Recipe) => {
  let p = premiumCache.get(r)
  if (!p) premiumCache.set(r, (p = [...new Set(r.ingredients.map((i) => (ingredients[i.id] as Ingredient).premium).filter((x) => x !== undefined))]))
  return p
}

const key = (menu: Recipe[]) => menu.map((r) => r.id).sort().join()

function evaluate(menu: Recipe[], c: Conditions) {
  const servings = servingsOf(menu, c)
  const list = buildShoppingList(menu, servings, c.pantry, priceOf)
  const missing = missingSeasonings(menu, c.pantry)
  const score = overlapScore(menu) - missing * config.menuSearch.missingSeasoningPenalty
  // 고급 재료가 들어간 끼니 비중과, 남는 재료를 금액으로 친 값(판매 단위 가격 × 남는 비율)
  const meals = servings.reduce((a, b) => a + b, 0)
  const premiumShare = meals ? menu.reduce((s, r, i) => s + (premiumOf(r).length ? servings[i] : 0), 0) / meals : 0
  const waste = list.items.reduce((s, it) => s + (it.price ? (it.price / it.packs) * (it.leftover / ingredients[it.id].saleUnit.amount) : 0), 0)
  const premium = [...new Set(menu.flatMap(premiumOf))]
  return { menu, cost: list.total, items: list.items.length, missing, score, premiumShare, waste, premium }
}
type Evaluated = ReturnType<typeof evaluate>

const ORDER: Record<MenuOptionKind, (a: Evaluated, b: Evaluated) => number> = {
  // 겹침 점수는 겹치는 재료 수만 세서 전체 품목이 많은 조합도 높게 나온다. 그래서 품목 수를 먼저 본다
  simple: (a, b) => a.items - b.items || b.score - a.score || a.cost - b.cost,
  cheap: (a, b) => a.cost - b.cost || b.score - a.score,
  pantry: (a, b) => a.missing - b.missing || b.score - a.score || a.cost - b.cost,
  // 고급 재료 끼니가 많을수록, 같으면 남는 재료가 적을수록. 예산을 꽉 채우는 것 자체는 목표가 아니다
  flex: (a, b) => b.premiumShare - a.premiumShare || a.waste - b.waste || a.cost - b.cost,
}

// 후보 조합: 겹침 점수 상위, 새로 살 양념이 적은 상위, 탐욕 조합을 합친다
// B6·조리법 분산 규칙에 맞는 조합만 쓰고, 맞는 조합이 없으면 규칙을 차례로 푼다.
// 모두 비교할 수 있으면 한 번 돌면서 겹침 상위, 새로 살 양념이 적은 상위, 고급 재료가 많은 상위를 함께 모으고,
// 조합이 너무 많으면 탐욕 조합을 쓴다
function candidateCombos(candidates: Recipe[], count: number, c: Conditions, rng: Rng): Recipe[][] {
  const { maxCombos, keep } = config.menuSearch
  const exhaustive = combinationCount(candidates.length, count) <= maxCombos
  for (const spread of relaxations(menuSpread(c.proteins, count))) {
    const combos = exhaustive
      ? topCombosBy(candidates, count, c.pantry, keep, [
          scoreOf,
          (overlap, missing) => overlap / 100 - missing,
          // 한 주 플렉스 후보: 고급 재료 메뉴가 많은 조합
          (overlap, _, menu) => menu.filter((r) => premiumOf(r).length).length * 100 + overlap,
        ], spread).flatMap((list) => list.map((x) => x.menu))
      : greedyCombos(candidates, count, c.pantry, rng, spread)
    const fit = combos.filter((m) => m.length === count && fitsSpread(m, spread))
    if (fit.length) return [...new Map(fit.map((m) => [key(m), m])).values()]
  }
  return []
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
    return { options: [{ kind: 'cheap', menu: cheapest.menu, cost: cheapest.cost, items: cheapest.items, missing: cheapest.missing, premium: cheapest.premium }], overBudget: true }
  }

  const kinds: MenuOptionKind[] = c.cheapest ? ['cheap', 'simple', 'pantry'] : ['simple', 'cheap', 'pantry']
  // 한 주 플렉스는 예산을 받은 버전 A에서, '가장 싸게 구성'이 꺼져 있을 때만
  if (useBudget && !c.cheapest) kinds.push('flex')
  const used = new Set<string>()
  const options: MenuOption[] = []
  for (const kind of kinds) {
    const pick = [...fit].sort(ORDER[kind]).find((x) => !used.has(key(x.menu)) && (kind !== 'flex' || x.premiumShare > 0))
    if (!pick) continue
    used.add(key(pick.menu))
    options.push({ kind, menu: pick.menu, cost: pick.cost, items: pick.items, missing: pick.missing, premium: pick.premium })
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
// (단백질을 1개만 골랐으면 같은 단백질, 여러 개면 규칙 안에서 다른 단백질도 나온다). 조리법 분산도 같다.
// useBudget이면(버전 A) 더한 뒤에도 예산 안이어야 한다. 더할 수 없으면 null
export function suggestAddition(menu: Recipe[], c: Conditions, useBudget: boolean): AddSuggestion | null {
  const candidates = filterCandidates(c)
  if (!menu.length || menu.length >= maxMenus(c, candidates)) return null
  const now = buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf)
  const flavors = new Set(menu.map((r) => r.flavor))

  // 더한 뒤에도 분산 규칙 안. 맞는 메뉴가 없으면 규칙을 차례로 푼다
  const fresh = candidates.filter((r) => !menu.includes(r) && !flavors.has(r.flavor))
  const scored = (relaxations(menuSpread(c.proteins, menu.length + 1)).map((rules) => fresh.filter((r) => fitsSpread([...menu, r], rules))).find((x) => x.length) ?? [])
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
