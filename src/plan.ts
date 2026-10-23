// I2 확정한 메뉴, D6 구매 체크, E1 바꾼 조리일을 기기에 저장한다.
// 계획을 짤 때의 날짜·인원·끼니도 함께 저장한다. 지금 조건으로 다시 계산하면, 식사 중간에 지난 날짜가 빠지거나
// 다음 주 날짜로 바뀌었을 때 요일별 메뉴와 냉장·냉동 안내가 달라지기 때문이다
import { storageOrNull, type Conditions, type Meal } from './conditions'
import { ingredients, type IngredientId } from './data/ingredients'
import { recipes, type Recipe } from './data/recipes'
import { cookDay, type ISODate } from './lib/dates'

export type PlanBasis = Pick<Conditions, 'dates' | 'people' | 'meals'>
export type Plan = PlanBasis & { menu: Recipe[]; checked: IngredientId[]; cookDate?: ISODate }

const KEY = 'kokcook.plan'
const isDate = (d: unknown): d is ISODate => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
const MEALS: Meal[] = ['dinner', 'lunch']

// 저장값이 깨졌거나 없어진 레시피·재료가 있으면 걸러낸다. 남는 메뉴가 없으면 null.
// 날짜·인원·끼니가 없는 예전 저장값은 fallback(지금 조건)으로 채운다. 지난 날짜도 버리지 않는다
export function loadPlan(fallback: PlanBasis, storage = storageOrNull()): Plan | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    const menu = (Array.isArray(saved?.recipeIds) ? saved.recipeIds : []).map((id: unknown) => recipes.find((r) => r.id === id)).filter(Boolean)
    const checked = (Array.isArray(saved?.checked) ? saved.checked : []).filter((id: unknown) => typeof id === 'string' && id in ingredients)
    const cookDate = isDate(saved?.cookDate) ? saved.cookDate : undefined
    const dates = Array.isArray(saved?.dates) ? saved.dates.filter(isDate).sort() : []
    const meals = Array.isArray(saved?.meals) ? saved.meals.filter((m: unknown) => MEALS.includes(m as Meal)) : []
    if (!menu.length) return null
    return {
      menu,
      checked,
      cookDate,
      dates: dates.length ? dates : fallback.dates,
      people: Number.isInteger(saved?.people) && saved.people >= 1 ? saved.people : fallback.people,
      meals: meals.length ? meals : fallback.meals,
    }
  } catch {
    return null
  }
}

export function savePlan(plan: Plan, storage = storageOrNull()) {
  try {
    const { menu, checked, cookDate, dates, people, meals } = plan
    storage?.setItem(KEY, JSON.stringify({ recipeIds: menu.map((r) => r.id), checked, cookDate, dates, people, meals }))
  } catch {
    // 저장 공간이 막힌 환경에서는 저장 없이 진행한다
  }
}

const sameList = <T,>(a: T[], b: T[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join()

// U16 메뉴 확정. 메뉴(순서는 상관없음)와 날짜·인원·끼니가 그대로면 구매 체크와 조리일을 이어 쓰고, 바뀌었으면 비운다
export function confirmPlan(prev: Plan | null, menu: Recipe[], c: Conditions): Plan {
  const basis: PlanBasis = { dates: [...c.dates], people: c.people, meals: [...c.meals] }
  const same =
    prev !== null &&
    sameList(prev.menu.map((r) => r.id), menu.map((r) => r.id)) &&
    sameList(prev.dates, basis.dates) &&
    prev.people === basis.people &&
    sameList(prev.meals, basis.meals)
  return { menu, ...basis, checked: same ? prev.checked : [], cookDate: same ? prev.cookDate : undefined }
}

// 확정한 계획을 보여줄 때 쓰는 조건: 날짜·인원·끼니는 계획을 짤 때 값, 양념·예산은 지금 값
export const planConditions = (plan: Plan, c: Conditions): Conditions => ({ ...c, dates: plan.dates, people: plan.people, meals: plan.meals })

// E1 조리일: 바꿔 둔 날이 있으면 그날, 없으면 첫 식사일 전날. 오늘이 지나도 바뀌지 않는다
export const planCookDate = (plan: Plan): ISODate => plan.cookDate ?? cookDay(plan.dates)!
