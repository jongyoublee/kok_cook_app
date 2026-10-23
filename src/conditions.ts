// A1~A6, A8, A9 입력 조건과 I2 기기 저장.
// 내 설정(인원, 식단, 안 먹는 단백질, 집에 있는 양념)은 처음 한 번 묻고, 날짜·메뉴 개수는 매주 묻는다
import { config } from './config'
import { ingredients, type IngredientId } from './data/ingredients'
import type { ProteinSource } from './data/recipes'
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
  excludeProteins: ProteinSource[] // A8 안 먹는 단백질
  pantry: IngredientId[] // A9 집에 있는 양념
}

// A8 선택지. 두부·콩은 두 공급원을 함께 뺀다
export const PROTEIN_OPTIONS: { label: string; sources: ProteinSource[] }[] = [
  { label: '돼지고기', sources: ['pork'] },
  { label: '소고기', sources: ['beef'] },
  { label: '닭고기', sources: ['chicken'] },
  { label: '생선', sources: ['fish'] },
  { label: '해산물', sources: ['seafood'] },
  { label: '두부·콩', sources: ['tofu', 'legume'] },
  { label: '달걀', sources: ['egg'] },
]

// A9 집에 있는지 묻는 재료: 양념 코너
export const PANTRY_OPTIONS = (Object.keys(ingredients) as IngredientId[]).filter((id) => ingredients[id].corner === '양념')

// A3 끼니 수는 선택한 날짜로 자동 계산
export const mealCount = (c: Conditions) => c.dates.length * c.meals.length

export const defaultConditions = (today: ISODate): Conditions => ({
  dates: nextWeek(today, true),
  meals: ['dinner'],
  people: 1,
  menuCount: config.menuCount.default,
  diet: 'korean',
  maxKcal: config.maxKcalPerMeal,
  excludeProteins: [],
  pantry: [],
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
  const proteins = PROTEIN_OPTIONS.flatMap((o) => o.sources)
  if (Array.isArray(saved.excludeProteins)) c.excludeProteins = saved.excludeProteins.filter((p) => proteins.includes(p))
  if (Array.isArray(saved.pantry)) c.pantry = saved.pantry.filter((id) => PANTRY_OPTIONS.includes(id))
  return c
}

export function saveConditions(c: Conditions, storage = storageOrNull()) {
  try {
    storage?.setItem(KEY, JSON.stringify(c))
  } catch {
    // 저장 공간이 막힌 환경(사생활 보호 모드 등)에서는 저장 없이 진행한다
  }
}
