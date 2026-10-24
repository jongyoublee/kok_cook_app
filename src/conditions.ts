// A1~A6, A8~A10, A12 입력 조건과 I2 기기 저장.
// 내 설정(인원, 먹고 싶은 단백질·탄수화물, 집에 있는 양념)은 처음 한 번 묻고, 날짜와 집에 있는 재료(A12)는 매주 묻는다
import { config } from './config'
import { CORNERS, ingredients, type IngredientId } from './data/ingredients'
import { recipes, type CarbBase, type ProteinSource } from './data/recipes'
import { nextWeek, type ISODate } from './lib/dates'

// MVP는 저녁만. 점심을 더해 하루 2끼까지 담을 수 있게 배열로 둔다
export type Meal = 'dinner' | 'lunch'

export type Conditions = {
  dates: ISODate[]
  meals: Meal[]
  people: number
  menuCount: number
  proteins: ProteinSource[] // A8 먹고 싶은 단백질 (1개 이상)
  carbs: CarbBase[] // A10 먹고 싶은 베이스 탄수화물 (1개 이상)
  pantry: IngredientId[] // A9 집에 있는 양념
  owned: IngredientId[] // A12 집에 있는 재료(양념 제외). 매주 바뀌어 확정한 계획에도 저장한다(plan.ts)
  budget: number | null // A7 예산(원). 사용자가 슬라이더를 움직이기 전에는 null(범위 중간을 쓴다, lib/budget.budgetOf)
  cheapest: boolean // F1 예산과 상관없이 가장 싸게 구성
  hidden: string[] // B10 '다시 안 보기'로 뺀 레시피 id (오래된 것부터)
  skipped?: ISODate[] // B9 안 먹는 날. 확정한 계획을 보여줄 때만 채운다(plan.planConditions)
}

// A8 선택지. 두부·콩은 두 공급원을 함께 고른다
export const PROTEIN_OPTIONS: { label: string; sources: ProteinSource[] }[] = [
  { label: '돼지고기', sources: ['pork'] },
  { label: '소고기', sources: ['beef'] },
  { label: '닭고기', sources: ['chicken'] },
  { label: '생선', sources: ['fish'] },
  { label: '해산물', sources: ['seafood'] },
  { label: '두부·콩', sources: ['tofu', 'legume'] },
  { label: '달걀', sources: ['egg'] },
]

export const ALL_PROTEINS = PROTEIN_OPTIONS.flatMap((o) => o.sources)

// A10 선택지
export const CARB_OPTIONS: { label: string; value: CarbBase }[] = [
  { label: '밥', value: 'rice' },
  { label: '면·파스타', value: 'noodle' },
  { label: '감자', value: 'potato' },
  { label: '고구마', value: 'sweetPotato' },
]

export const ALL_CARBS = CARB_OPTIONS.map((o) => o.value)

// A9 집에 있는지 묻는 재료: 양념 코너. 기본 10개를 먼저 보여주고 나머지는 더보기로
export const PANTRY_OPTIONS = (Object.keys(ingredients) as IngredientId[]).filter((id) => ingredients[id].corner === '양념')
export const PANTRY_GROUPS: { title: string; ids: IngredientId[] }[] = [
  { title: '기본 양념', ids: ['soySauce', 'gochujang', 'doenjang', 'chiliPowder', 'allulose', 'salt', 'blackPepper', 'cookingOil', 'sesameOil', 'vinegar'] },
  { title: '한식 양념', ids: ['perillaOil', 'sesameSeeds', 'mirin', 'oligosaccharide', 'fishSauce', 'tunaSauce', 'plumSyrup', 'oysterSauce'] },
  { title: '양식 양념', ids: ['oliveOil', 'butter', 'ketchup', 'mayonnaise', 'mustard', 'balsamic', 'honey', 'basil', 'oregano', 'paprikaPowder', 'chickenStock'] },
]

// A12 집에 있는지 묻는 재료: 양념을 뺀 모든 코너. 코너별로 묶어 보여준다
export const OWNED_GROUPS: { title: string; ids: IngredientId[] }[] = CORNERS.filter((corner) => corner !== '양념').map((corner) => ({
  title: corner,
  ids: (Object.keys(ingredients) as IngredientId[]).filter((id) => ingredients[id].corner === corner),
}))
export const OWNED_OPTIONS = OWNED_GROUPS.flatMap((g) => g.ids)

// A12 집에 있는 고기·생선·두부로 먹고 싶은 단백질(A8)을 미리 채울 때 쓰는 짝
const OWNED_PROTEIN: Partial<Record<IngredientId, ProteinSource[]>> = {
  porkShoulder: ['pork'],
  porkTenderloin: ['pork'],
  beefBulgogi: ['beef'],
  beefRound: ['beef'],
  chickenBreast: ['chicken'],
  egg: ['egg'],
  mackerel: ['fish'],
  pollock: ['fish'],
  salmon: ['fish'],
  tunaCan: ['fish'],
  squid: ['seafood'],
  shrimp: ['seafood'],
  tofu: ['tofu', 'legume'],
  softTofu: ['tofu', 'legume'],
  chickpeas: ['tofu', 'legume'],
}
export const proteinsFromOwned = (owned: IngredientId[]): ProteinSource[] => [...new Set(owned.flatMap((id) => OWNED_PROTEIN[id] ?? []))]

// 장보기·금액·메뉴 점수에서 '집에 있는 것'으로 보는 재료: 양념(A9)과 재료(A12)
export const homeOf = (c: Conditions): IngredientId[] => [...c.pantry, ...c.owned]

// A3 끼니 수는 선택한 날짜로 자동 계산
export const mealCount = (c: Conditions) => c.dates.length * c.meals.length

export const defaultConditions = (today: ISODate): Conditions => ({
  dates: nextWeek(today, true),
  meals: ['dinner'],
  people: 1,
  menuCount: config.menuCount.default,
  // 재료 선택 칸은 빈칸으로 시작한다
  proteins: [],
  carbs: [],
  pantry: [],
  owned: [],
  budget: null,
  cheapest: false,
  hidden: [],
})

export const CONDITIONS_KEY = 'kokcook.conditions'
const KEY = CONDITIONS_KEY
export type KV = Pick<Storage, 'getItem' | 'setItem'>

export const storageOrNull = (): KV | null => {
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
  // A5 식단 분류는 2026-10-23 삭제. 예전에 저장된 diet·maxKcal 값은 읽지 않는다
  const proteins = Array.isArray(saved.proteins) ? saved.proteins.filter((p) => ALL_PROTEINS.includes(p)) : []
  c.proteins = proteins
  const carbs = Array.isArray(saved.carbs) ? saved.carbs.filter((v) => ALL_CARBS.includes(v)) : []
  c.carbs = carbs
  // 범위는 조건마다 달라서 저장값은 양수인지만 보고, 쓸 때 범위 안으로 맞춘다
  if (Number.isInteger(saved.budget) && saved.budget! > 0) c.budget = saved.budget!
  if (typeof saved.cheapest === 'boolean') c.cheapest = saved.cheapest
  if (Array.isArray(saved.hidden)) c.hidden = saved.hidden.filter((id) => recipes.some((r) => r.id === id)).slice(-config.hiddenMax)
  if (Array.isArray(saved.pantry)) c.pantry = saved.pantry.filter((id) => PANTRY_OPTIONS.includes(id))
  if (Array.isArray(saved.owned)) c.owned = saved.owned.filter((id) => OWNED_OPTIONS.includes(id))
  return c
}

export function saveConditions(c: Conditions, storage = storageOrNull()) {
  try {
    // 안 먹는 날은 계획에 저장한다
    const { skipped: _skipped, ...rest } = c
    storage?.setItem(KEY, JSON.stringify(rest))
  } catch {
    // 저장 공간이 막힌 환경(사생활 보호 모드 등)에서는 저장 없이 진행한다
  }
}

// B10 다시 안 보기에 더한다. 상한을 넘으면 가장 오래된 것부터 되돌린다
export const addHidden = (hidden: string[], id: string) => [...hidden.filter((x) => x !== id), id].slice(-config.hiddenMax)
