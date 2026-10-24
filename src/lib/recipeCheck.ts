// H1 레시피 값 검사. 테스트, 관리 화면, 개발 서버 저장이 같은 검사를 쓴다
import { config } from '../config'
import { ingredients } from '../data/ingredients'
import { FLAVOR_LABEL, METHOD_LABEL, type CarbBase, type ProteinSource, type RecipeData } from '../data/recipes'
import { computeNutrition } from './nutrition'

// I3 서비스 문구에 쓰지 않는 표현
export const FORBIDDEN = ['다이어트', '당뇨', '치료', '효능']

const PROTEINS: Record<ProteinSource, true> = { pork: true, beef: true, chicken: true, fish: true, seafood: true, tofu: true, egg: true, legume: true }
const CARBS: Record<CarbBase, true> = { rice: true, noodle: true, potato: true, sweetPotato: true }

const positive = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0

// 문제가 없으면 빈 배열. 저장은 빈 배열일 때만 한다
export function checkRecipe(r: RecipeData): string[] {
  const errors: string[] = []
  if (!/^[a-z0-9-]+$/.test(r.id ?? '')) errors.push('id는 영문 소문자, 숫자, -만 써요')
  if (!r.name?.trim()) errors.push('이름이 비어 있어요')
  if (!(r.proteinSource in PROTEINS)) errors.push('단백질 값이 없거나 잘못됐어요')
  if (!(r.carb in CARBS)) errors.push('탄수화물 값이 없거나 잘못됐어요')
  if (!(r.flavor in FLAVOR_LABEL)) errors.push('맛 계열 값이 없거나 잘못됐어요')
  if (!(r.method in METHOD_LABEL)) errors.push('조리법 값이 없거나 잘못됐어요')

  const ids = (r.ingredients ?? []).map((i) => i.id)
  if (!ids.length) errors.push('재료가 없어요')
  for (const { id, amount } of r.ingredients ?? []) {
    if (!(id in ingredients)) errors.push(`재료 사전에 없는 재료예요: ${id}`)
    else if (!positive(amount)) errors.push(`${ingredients[id].name} 분량은 0보다 커야 해요`)
  }
  if (new Set(ids).size !== ids.length) errors.push('같은 재료가 두 번 들어 있어요')

  const steps = (r.steps ?? []).filter((s) => s.trim())
  if (!steps.length || steps.length !== (r.steps ?? []).length) errors.push('빈 조리 단계가 있거나 단계가 없어요')
  if (!positive(r.cookMinutes)) errors.push('조리 시간은 0보다 커야 해요')
  if (!positive(r.portionG)) errors.push('1인분 무게는 0보다 커야 해요')
  if (!positive(r.storage?.fridgeDays) || r.storage.fridgeDays > config.foodSafety.fridgeDays)
    errors.push(`냉장 일수는 1~${config.foodSafety.fridgeDays}일이에요`)

  const text = [r.name ?? '', ...(r.steps ?? [])].join(' ')
  for (const word of FORBIDDEN) if (text.includes(word)) errors.push(`쓰지 않는 표현이 있어요: ${word}`)

  // A6 모든 레시피는 밥 포함 한 끼 기준 이하
  if (!errors.length && computeNutrition(r).kcal > config.maxKcalPerMeal) errors.push(`한 끼 ${config.maxKcalPerMeal}kcal를 넘어요`)
  return errors
}

// 목록 전체 검사: 각 레시피 검사에 id 중복을 더한다
export function checkRecipes(list: RecipeData[]): string[] {
  const errors = list.flatMap((r) => checkRecipe(r).map((e) => `${r.name || r.id}: ${e}`))
  const seen = new Set<string>()
  for (const r of list) {
    if (seen.has(r.id)) errors.push(`id가 겹쳐요: ${r.id}`)
    seen.add(r.id)
  }
  return errors
}
