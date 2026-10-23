// B1~B4 메뉴 자동 구성: 조건으로 후보를 거른 뒤(U09) 재료가 겹치는 조합을 우선 고른다(U10)
import { config } from '../config'
import { mealCount, type Conditions } from '../conditions'
import { ingredients, type IngredientId } from '../data/ingredients'
import { recipes, type Recipe } from '../data/recipes'
import type { ISODate } from './dates'

export type Rng = () => number

// B4 한식은 분류와 칼로리 상한, 고단백은 단백질·칼로리 기준으로 거른다
export function filterCandidates(c: Conditions, pool: Recipe[] = recipes): Recipe[] {
  const { minProteinG, maxKcal } = config.highProtein
  return pool.filter(
    (r) =>
      c.proteins.includes(r.proteinSource) && // A8 먹고 싶은 단백질이 주재료인 메뉴만
      c.carbs.includes(r.carb) && // A10 먹고 싶은 베이스 탄수화물
      (c.diet === 'korean'
        ? r.korean && r.nutrition.kcal <= c.maxKcal
        : r.nutrition.proteinG >= minProteinG && r.nutrition.kcal <= Math.min(maxKcal, c.maxKcal)),
  )
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

// 겹침 점수가 먼저, 같으면 새로 살 양념이 적은 조합. 양념 종류는 100개보다 적으므로 겹침 1점을 넘지 않는다
const menuScore = (menu: Recipe[], pantry: IngredientId[]) => overlapScore(menu) - missingSeasonings(menu, pantry) / 100

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

// 후보마다 첫 메뉴로 두고 점수를 가장 올리는 레시피를 하나씩 더한 뒤, 가장 좋은 조합을 고른다.
// ponytail: 탐욕 선택이라 최적 조합을 놓칠 수 있다. 전수 비교는 레시피 50개·5개 조합이면 약 200만 가지
export function buildMenu(candidates: Recipe[], count: number, pantry: IngredientId[] = [], rng: Rng = Math.random): Recipe[] {
  const combos = candidates.map((seed) => {
    const menu = [seed]
    while (menu.length < count) {
      const next = pickNext(menu, candidates, pantry, rng)
      if (!next) break
      menu.push(next)
    }
    return menu
  })
  return best(combos, (m) => menuScore(m, pantry), rng) ?? []
}

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

// 날짜 순서대로 메뉴를 돌아가며 배정한다(1, 2, 1, 2, 1). 결과는 메뉴별 먹는 날짜
export const assignDays = (menu: Recipe[], dates: ISODate[]): ISODate[][] =>
  menu.map((_, i) => [...dates].sort().filter((_, d) => d % menu.length === i))
