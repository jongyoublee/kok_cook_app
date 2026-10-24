// I2 확정한 메뉴, D6 구매 체크, E1 바꾼 조리일을 기기에 저장한다.
// 계획을 짤 때의 날짜·인원·끼니도 함께 저장한다. 지금 조건으로 다시 계산하면, 식사 중간에 지난 날짜가 빠지거나
// 다음 주 날짜로 바뀌었을 때 요일별 메뉴와 냉장·냉동 안내가 달라지기 때문이다
import { CONDITIONS_KEY, OWNED_OPTIONS, storageOrNull, type Conditions, type Meal } from './conditions'
import { ingredients, type IngredientId } from './data/ingredients'
import { recipes, type Recipe } from './data/recipes'
import { cookDay, type ISODate } from './lib/dates'

export type PlanBasis = Pick<Conditions, 'dates' | 'people' | 'meals'>
// skipped: B9 안 먹는 날, extras: D9 메뉴와 관계없이 직접 추가한 장보기 항목, owned: A12 계획을 짤 때 집에 있던 재료
export type Extra = { name: string; done: boolean }
export type Plan = PlanBasis & { menu: Recipe[]; checked: IngredientId[]; cookDate?: ISODate; skipped: ISODate[]; extras: Extra[]; owned: IngredientId[] }

const KEY = 'kokcook.plan' // 예전 저장 키(계획 하나). 불러오기만 한다
const isDate = (d: unknown): d is ISODate => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
const MEALS: Meal[] = ['dinner', 'lunch']

// B13 확정한 계획은 지금 먹는 계획과 다음 계획, 2개까지 둔다(예전 저장값은 계획 하나)
const PLANS_KEY = 'kokcook.plans'

// 저장값이 깨졌거나 없어진 레시피·재료가 있으면 걸러낸다. 남는 메뉴가 없으면 null.
// 날짜·인원·끼니가 없는 예전 저장값은 fallback(지금 조건)으로 채운다. 지난 날짜도 버리지 않는다
function parsePlan(saved: any, fallback: PlanBasis): Plan | null {
  const menu = (Array.isArray(saved?.recipeIds) ? saved.recipeIds : []).map((id: unknown) => recipes.find((r) => r.id === id)).filter(Boolean)
  const checked = (Array.isArray(saved?.checked) ? saved.checked : []).filter((id: unknown) => typeof id === 'string' && id in ingredients)
  const owned = (Array.isArray(saved?.owned) ? saved.owned : []).filter((id: unknown) => OWNED_OPTIONS.includes(id as IngredientId))
  const cookDate = isDate(saved?.cookDate) ? saved.cookDate : undefined
  const dates = Array.isArray(saved?.dates) ? saved.dates.filter(isDate).sort() : []
  const meals = Array.isArray(saved?.meals) ? saved.meals.filter((m: unknown) => MEALS.includes(m as Meal)) : []
  const skipped = Array.isArray(saved?.skipped) ? saved.skipped.filter(isDate) : []
  const extras: Extra[] = (Array.isArray(saved?.extras) ? saved.extras : [])
    .filter((e: unknown): e is Extra => typeof (e as Extra)?.name === 'string' && (e as Extra).name.trim() !== '')
    .map((e: Extra) => ({ name: e.name, done: e.done === true }))
  if (!menu.length) return null
  return {
    menu,
    checked,
    cookDate,
    skipped,
    extras,
    owned,
    dates: dates.length ? dates : fallback.dates,
    people: Number.isInteger(saved?.people) && saved.people >= 1 ? saved.people : fallback.people,
    meals: meals.length ? meals : fallback.meals,
  }
}

export function loadPlans(fallback: PlanBasis, storage = storageOrNull()): Plan[] {
  try {
    const raw = storage?.getItem(PLANS_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      return (Array.isArray(list) ? list : []).map((p) => parsePlan(p, fallback)).filter((p): p is Plan => !!p)
    }
    const old = storage?.getItem(KEY)
    const plan = old ? parsePlan(JSON.parse(old), fallback) : null
    return plan ? [plan] : []
  } catch {
    return []
  }
}

export function savePlans(plans: Plan[], storage = storageOrNull()) {
  try {
    const raw = plans.map(({ menu, checked, cookDate, dates, people, meals, skipped, extras, owned }) => ({ recipeIds: menu.map((r) => r.id), checked, cookDate, dates, people, meals, skipped, extras, owned }))
    storage?.setItem(PLANS_KEY, JSON.stringify(raw))
  } catch {
    // 저장 공간이 막힌 환경에서는 저장 없이 진행한다
  }
}

const start = (p: PlanBasis) => p.dates[0]
const end = (p: PlanBasis) => p.dates[p.dates.length - 1]
const started = (p: PlanBasis, today: ISODate) => start(p) <= today
const overlaps = (a: PlanBasis, b: PlanBasis) => start(a) <= end(b) && start(b) <= end(a)

// B13 이번 주: 먹는 기간에 오늘이 들어 있는 계획. 다음 주: 아직 먹기 시작하지 않은 계획
export const currentPlan = (plans: Plan[], today: ISODate) => plans.find((p) => started(p, today) && today <= end(p)) ?? null
export const upcomingPlan = (plans: Plan[], today: ISODate) => plans.find((p) => !started(p, today)) ?? null
// 이 날짜로 확정하면 바뀌는(기간이 겹치는) 계획. B8 경고와 구매 체크 이어 쓰기에 쓴다
export const planOverlapping = (plans: Plan[], basis: PlanBasis) => (basis.dates.length ? (plans.find((p) => overlaps(p, basis)) ?? null) : null)

// 확정한 계획을 넣는다. 기간이 겹치는 계획과 끝난 계획은 빼고, 지금 먹는 계획과 다음 계획을 하나씩만 남긴다
export function storePlan(plans: Plan[], plan: Plan, today: ISODate): Plan[] {
  const other = plans.filter((p) => today <= end(p) && !overlaps(p, plan) && started(p, today) !== started(plan, today)).slice(0, 1)
  return [...other, plan].sort((a, b) => (start(a) < start(b) ? -1 : 1))
}

// 날짜가 지나 끝난 계획을 뺀다
export const livePlans = (plans: Plan[], today: ISODate) => plans.filter((p) => today <= end(p))

const sameList = <T,>(a: T[], b: T[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join()

const sameBasis = (prev: Plan, b: PlanBasis) => sameList(prev.dates, b.dates) && prev.people === b.people && sameList(prev.meals, b.meals)
const usedBy = (menu: Recipe[]) => new Set(menu.flatMap((r) => r.ingredients.map((i) => i.id)))

// U16 메뉴 확정. 날짜·인원·끼니가 그대로면 조리일, 안 먹는 날, 직접 추가한 항목을 이어 쓰고, 구매 체크는 새 메뉴가 쓰는 재료만 남긴다(B8).
// 날짜·인원이 바뀌었으면(다음 주 계획 등) 모두 비운다
export function confirmPlan(prev: Plan | null, menu: Recipe[], c: Conditions): Plan {
  const basis: PlanBasis = { dates: [...c.dates], people: c.people, meals: [...c.meals] }
  const owned = [...c.owned]
  if (!prev || !sameBasis(prev, basis)) return { menu, ...basis, checked: [], skipped: [], extras: [], owned }
  const used = usedBy(menu)
  return { menu, ...basis, checked: prev.checked.filter((id) => used.has(id)), cookDate: prev.cookDate, skipped: prev.skipped, extras: prev.extras, owned }
}

// B8 메뉴를 이렇게 바꾸면 쓸 곳이 없어지는 이미 산(구매 체크한) 재료
export function droppedChecks(prev: Plan | null, menu: Recipe[], c: Conditions): IngredientId[] {
  if (!prev || !sameBasis(prev, { dates: c.dates, people: c.people, meals: c.meals })) return []
  const used = usedBy(menu)
  return prev.checked.filter((id) => !used.has(id))
}

// 확정한 계획을 보여줄 때 쓰는 조건: 날짜·인원·끼니와 집에 있던 재료(A12)는 계획을 짤 때 값, 양념·예산은 지금 값
export const planConditions = (plan: Plan, c: Conditions): Conditions => ({
  ...c,
  dates: plan.dates,
  people: plan.people,
  meals: plan.meals,
  skipped: plan.skipped,
  owned: plan.owned,
})

// E1 조리일: 바꿔 둔 날이 있으면 그날, 없으면 첫 식사일 전날. 오늘이 지나도 바뀌지 않는다
export const planCookDate = (plan: Plan): ISODate => plan.cookDate ?? cookDay(plan.dates)!

// I6 내 데이터 지우기: 기기에 저장한 조건과 계획(메뉴, 구매 체크, 조리일)을 지운다
export function clearSavedData(storage = storageOrNull() as Pick<Storage, 'removeItem'> | null) {
  try {
    storage?.removeItem(CONDITIONS_KEY)
    storage?.removeItem(KEY)
    storage?.removeItem(PLANS_KEY)
  } catch {
    // 저장 공간이 막힌 환경에서는 지울 것도 없다
  }
}
