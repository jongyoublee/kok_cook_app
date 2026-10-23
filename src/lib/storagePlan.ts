// E1~E3 날짜별 냉장·냉동 분배와 해동 할 일, 조리일 변경
import { config } from '../config'
import type { Recipe } from '../data/recipes'
import { addDays, cookDay, daysBetween, type ISODate } from './dates'
import { assignDays } from './menu'

export type Slot = {
  date: ISODate
  recipe: Recipe
  place: 'fridge' | 'freezer'
  tooLong: boolean // E2 냉동이 맞지 않는데 냉장 보관 기간을 넘는 끼니 (메뉴나 날짜를 바꾸도록 안내)
}

// 레시피별 냉장 보관 일수가 설정보다 짧으면 짧은 쪽
export const fridgeLimit = (r: Recipe) => Math.min(config.foodSafety.fridgeDays, r.storage.fridgeDays)

// E1 두 안을 모두 두고 설정(config.storageSplit)으로 고른다.
// byDate: 조리일부터 냉장 일수 안이면 냉장, 넘으면 냉동.
// byMealCount: 7끼 미만은 전부 냉장, 이상이면 앞 절반 냉장 뒤 절반 냉동
export function schedule(menu: Recipe[], dates: ISODate[], cook: ISODate, mode = config.storageSplit): Slot[] {
  const days = assignDays(menu, dates)
  const meals = menu.flatMap((recipe, i) => days[i].map((date) => ({ date, recipe }))).sort((a, b) => a.date.localeCompare(b.date))
  return meals.map(({ date, recipe }, k) => {
    const fridge = mode === 'byDate' ? daysBetween(cook, date) <= fridgeLimit(recipe) : meals.length < 7 || k < Math.ceil(meals.length / 2)
    if (fridge) return { date, recipe, place: 'fridge', tooLong: false }
    return recipe.storage.freezable ? { date, recipe, place: 'freezer', tooLong: false } : { date, recipe, place: 'fridge', tooLong: true }
  })
}

// E3 냉동 끼니는 먹기 전날 밤 냉장실로 옮겨 해동한다
export const thawDate = (slot: Slot) => addDays(slot.date, -1)

// 조리일로 고를 수 있는 날: 오늘부터 첫 식사일 전날까지, 최대 7일 전까지
export function cookDateOptions(today: ISODate, dates: ISODate[]): ISODate[] {
  const first = [...dates].sort()[0]
  const start = [today, addDays(first, -7)].sort()[1]
  const options: ISODate[] = []
  for (let d = start; d < first; d = addDays(d, 1)) options.push(d)
  return options
}

// 저장한 조리일이 지금 날짜 조건에서 고를 수 없으면 기본값(첫 식사일 전날)
export const effectiveCookDate = (saved: ISODate | undefined, today: ISODate, dates: ISODate[]): ISODate =>
  saved && cookDateOptions(today, dates).includes(saved) ? saved : cookDay(dates)!
