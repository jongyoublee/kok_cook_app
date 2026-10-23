// A1~A6 입력 조건과 I2 기기 저장
import { config } from './config'
import { nextWeek, type ISODate } from './lib/dates'

export type Diet = 'korean' | 'highProtein'
// MVP는 저녁만. 점심을 더해 하루 2끼까지 담을 수 있게 배열로 둔다
export type Meal = 'dinner' | 'lunch'

export type Conditions = {
  dates: ISODate[]
  meals: Meal[]
  people: number
  menuCount: number
  diet: Diet
  maxKcal: number
}

// A3 끼니 수는 선택한 날짜로 자동 계산
export const mealCount = (c: Conditions) => c.dates.length * c.meals.length

export const defaultConditions = (today: ISODate): Conditions => ({
  dates: nextWeek(today, true),
  meals: ['dinner'],
  people: 1,
  menuCount: config.menuCount.default,
  diet: 'korean',
  maxKcal: config.maxKcalPerMeal,
})

const KEY = 'kokcook.conditions'
type KV = Pick<Storage, 'getItem' | 'setItem'>

const storageOrNull = (): KV | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

// 저장값은 손상됐거나 예전 형식일 수 있으므로 항목별로 검사하고, 지난 날짜는 버린다.
// 남은 날짜가 없으면 기본 날짜를 쓴다. 저장값이 없으면 null.
export function loadConditions(today: ISODate, storage = storageOrNull()): Conditions | null {
  let saved: Partial<Conditions>
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    saved = JSON.parse(raw)
    if (typeof saved !== 'object' || saved === null) return null
  } catch {
    return null
  }
  const c = defaultConditions(today)
  const { min, max } = config.menuCount
  const dates = Array.isArray(saved.dates)
    ? saved.dates.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today).sort()
    : []
  if (dates.length) c.dates = dates
  if (Number.isInteger(saved.people) && saved.people! >= 1) c.people = saved.people!
  if (Number.isInteger(saved.menuCount) && saved.menuCount! >= min && saved.menuCount! <= max) c.menuCount = saved.menuCount!
  if (saved.diet === 'korean' || saved.diet === 'highProtein') c.diet = saved.diet
  return c
}

export function saveConditions(c: Conditions, storage = storageOrNull()) {
  try {
    storage?.setItem(KEY, JSON.stringify(c))
  } catch {
    // 저장 공간이 막힌 환경(사생활 보호 모드 등)에서는 저장 없이 진행한다
  }
}
