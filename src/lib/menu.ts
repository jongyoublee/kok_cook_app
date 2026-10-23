// B1~B4 메뉴 자동 구성: 조건으로 후보를 거른 뒤(U09) 재료가 겹치는 조합을 우선 고른다(U10)
import { config } from '../config'
import { mealCount, type Conditions } from '../conditions'
import { ingredients, type IngredientId } from '../data/ingredients'
import { recipes, type Recipe } from '../data/recipes'
import type { ISODate } from './dates'

export type Rng = () => number

// A8 먹고 싶은 단백질이 주재료이고 A10 먹고 싶은 베이스 탄수화물인 메뉴만 남긴다.
// 식단 분류(A5)는 2026-10-23 삭제. 한 끼 칼로리 기준은 레시피 데이터가 지킨다(recipes.test)
export function filterCandidates(c: Conditions, pool: Recipe[] = recipes): Recipe[] {
  return pool.filter((r) => c.proteins.includes(r.proteinSource) && c.carbs.includes(r.carb))
}

// 메뉴 수는 설정 최대값, 후보 수, 끼니 수를 넘지 않는다
export const maxMenus = (c: Conditions, candidates: Recipe[]) =>
  Math.min(config.menuCount.max, candidates.length, mealCount(c))

// 2개 이상의 메뉴에 들어가는 재료 (화면 표시용, 양념 포함)
export function sharedIngredients(menu: Recipe[]): IngredientId[] {
  const count = new Map<IngredientId, number>()
  for (const r of menu) for (const { id } of r.ingredients) count.set(id, (count.get(id) ?? 0) + 1)
  return [...count].filter(([, n]) => n >= 2).map(([id]) => id)
}

// 양념은 한 번 사면 여러 주를 쓰므로 점수에서 뺀다
export const overlapScore = (menu: Recipe[]) =>
  sharedIngredients(menu).filter((id) => ingredients[id].corner !== '양념').length

// A9 집에 없는 양념(새로 사야 하는 양념) 종류
export const missingSeasonings = (menu: Recipe[], pantry: IngredientId[]) =>
  new Set(
    menu.flatMap((r) => r.ingredients.map((i) => i.id)).filter((id) => ingredients[id].corner === '양념' && !pantry.includes(id)),
  ).size

// 겹침 점수에서 새로 살 양념 1종마다 설정한 만큼 뺀다(A9)
const scoreOf = (overlap: number, missing: number) => overlap - missing * config.menuSearch.missingSeasoningPenalty
const menuScore = (menu: Recipe[], pantry: IngredientId[]) => scoreOf(overlapScore(menu), missingSeasonings(menu, pantry))

// 점수가 가장 높은 것 중 하나를 무작위로 (동점일 때 매번 같은 메뉴가 나오지 않게)
function best<T>(options: T[], score: (x: T) => number, rng: Rng): T | undefined {
  let top: T[] = []
  let max = -Infinity
  for (const o of options) {
    const s = score(o)
    if (s > max) [max, top] = [s, [o]]
    else if (s === max) top.push(o)
  }
  return top[Math.floor(rng() * top.length)]
}

const pickNext = (menu: Recipe[], pool: Recipe[], pantry: IngredientId[], rng: Rng) =>
  best(pool.filter((r) => !menu.includes(r)), (r) => menuScore([...menu, r], pantry), rng)

// 후보마다 첫 메뉴로 두고 점수를 가장 올리는 레시피를 하나씩 더한 조합들.
// 탐욕 선택이라 최적 조합을 놓칠 수 있어, 조합 수가 너무 많을 때만 쓴다(searchCombos)
export function greedyCombos(candidates: Recipe[], count: number, pantry: IngredientId[] = [], rng: Rng = Math.random): Recipe[][] {
  return candidates.map((seed) => {
    const menu = [seed]
    while (menu.length < count) {
      const next = pickNext(menu, candidates, pantry, rng)
      if (!next) break
      menu.push(next)
    }
    return menu
  })
}

export function combinationCount(n: number, k: number) {
  let c = 1
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1)
  return Math.round(c)
}

// k개 조합을 모두 돌며 visit(조합, 겹침 점수, 새로 살 양념 수)를 부른다.
// 메뉴를 하나 넣고 뺄 때마다 재료별 개수를 더하고 빼서 점수를 다시 세지 않는다.
// 조합 배열은 계속 바뀌므로 남겨 둘 때는 visit 안에서 복사한다
export function forEachCombo(
  candidates: Recipe[],
  k: number,
  pantry: IngredientId[],
  visit: (menu: readonly Recipe[], overlap: number, missing: number) => void,
) {
  // 재료 id를 0부터 번호로 바꿔 배열로 센다(Map보다 빠르다)
  const index = new Map<IngredientId, number>()
  const num = (id: IngredientId) => index.get(id) ?? index.set(id, index.size).get(id)!
  const ids = (r: Recipe, seasoning: boolean) =>
    r.ingredients.map((i) => i.id).filter((id) => (ingredients[id].corner === '양념') === seasoning && !(seasoning && pantry.includes(id)))
  const foods = candidates.map((r) => ids(r, false).map(num))
  const seasonings = candidates.map((r) => ids(r, true).map(num))
  const foodCount = new Int32Array(index.size)
  const seasoningCount = new Int32Array(index.size)
  const picked: Recipe[] = []
  let overlap = 0
  let missing = 0

  const step = (i: number, d: 1 | -1) => {
    for (const id of foods[i]) {
      foodCount[id] += d
      if (d === 1 && foodCount[id] === 2) overlap++
      if (d === -1 && foodCount[id] === 1) overlap--
    }
    for (const id of seasonings[i]) {
      seasoningCount[id] += d
      if (d === 1 && seasoningCount[id] === 1) missing++
      if (d === -1 && seasoningCount[id] === 0) missing--
    }
  }

  const walk = (from: number) => {
    if (picked.length === k) return visit(picked, overlap, missing)
    for (let i = from; i <= candidates.length - (k - picked.length); i++) {
      step(i, 1)
      picked.push(candidates[i])
      walk(i + 1)
      picked.pop()
      step(i, -1)
    }
  }
  if (k > 0 && k <= candidates.length) walk(0)
}

export type ScoredCombo = { menu: Recipe[]; score: number }

// 점수가 높은 조합 limit개 (높은 순)
export function topCombos(
  candidates: Recipe[],
  k: number,
  pantry: IngredientId[],
  limit: number,
  score: (overlap: number, missing: number) => number = scoreOf,
): ScoredCombo[] {
  let top: ScoredCombo[] = []
  let floor = -Infinity // top이 limit개 찼을 때 가장 낮은 점수
  const trim = () => {
    top.sort((a, b) => b.score - a.score)
    top = top.slice(0, limit)
    floor = top.length >= limit ? top[top.length - 1].score : -Infinity
  }
  forEachCombo(candidates, k, pantry, (menu, o, m) => {
    const s = score(o, m)
    if (s < floor) return
    top.push({ menu: [...menu], score: s })
    if (top.length >= limit * 2) trim()
  })
  trim()
  return top
}

// 조합 수가 설정 상한 이하면 모두 비교한 상위 조합, 넘으면 탐욕 선택 조합
export function searchCombos(candidates: Recipe[], count: number, pantry: IngredientId[] = [], rng: Rng = Math.random): Recipe[][] {
  const { maxCombos, keep } = config.menuSearch
  if (combinationCount(candidates.length, count) > maxCombos) return greedyCombos(candidates, count, pantry, rng)
  return topCombos(candidates, count, pantry, keep).map((c) => c.menu)
}

// 조합 중 점수가 가장 높은 것
export const bestCombo = (combos: Recipe[][], pantry: IngredientId[] = [], rng: Rng = Math.random): Recipe[] =>
  best(combos, (m) => menuScore(m, pantry), rng) ?? []

export const buildMenu = (candidates: Recipe[], count: number, pantry: IngredientId[] = [], rng: Rng = Math.random): Recipe[] =>
  bestCombo(searchCombos(candidates, count, pantry, rng), pantry, rng)

// B2 i번째 메뉴를 나머지와 가장 잘 겹치는 후보로 바꾼다. shown은 그 칸에서 이미 보여준 레시피 id로,
// 다시 나오지 않게 하고 후보를 다 보면 비운다
export function swapMenu(
  menu: Recipe[],
  i: number,
  candidates: Recipe[],
  shown: string[],
  pantry: IngredientId[] = [],
  rng: Rng = Math.random,
) {
  const rest = menu.filter((_, j) => j !== i)
  const free = candidates.filter((r) => !menu.includes(r))
  let options = free.filter((r) => !shown.includes(r.id))
  if (!options.length) [shown, options] = [[], free]
  const next = best(options, (r) => menuScore([...rest, r], pantry), rng)
  if (!next) return { menu, shown }
  return { menu: menu.with(i, next), shown: [...shown, menu[i].id] }
}

// B3 메뉴 하나 추가. 더할 후보가 없으면 그대로
export function addMenu(menu: Recipe[], candidates: Recipe[], pantry: IngredientId[] = [], rng: Rng = Math.random): Recipe[] {
  const next = pickNext(menu, candidates, pantry, rng)
  return next ? [...menu, next] : menu
}

// 날짜 순서대로 메뉴를 돌아가며 배정한다(1, 2, 1, 2, 1). 결과는 메뉴별 먹는 날짜.
// E2 냉동이 맞지 않는 메뉴는 냉장 기간 안에 먹도록 앞 날짜로 모은다(끼니 수는 그대로)
export function assignDays(menu: Recipe[], dates: ISODate[]): ISODate[][] {
  const sorted = [...dates].sort()
  const turns = sorted.map((_, d) => d % menu.length)
  const order = [...turns.filter((i) => !menu[i].storage.freezable), ...turns.filter((i) => menu[i].storage.freezable)]
  return menu.map((_, i) => sorted.filter((_, d) => order[d] === i))
}

