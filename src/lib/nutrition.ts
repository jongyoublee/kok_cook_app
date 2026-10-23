// H3, C2 재료 분량으로 1인분 영양정보를 계산한다. 조리용 물은 0, 기름은 전부 먹는다고 본다
import { config } from '../config'
import { ingredients, type IngredientId } from '../data/ingredients'
import { NUTRITION_PER, RICE_PER_100G, type NutritionFacts } from '../data/nutrition'
import type { CarbBase } from '../data/recipes'

const KEYS = ['kcal', 'carbsG', 'proteinG', 'fatG', 'saturatedFatG', 'sugarG', 'sodiumMg'] as const

// g·ml 재료는 100 기준값, 개 재료는 1개 기준값
const basis = (id: IngredientId) => (ingredients[id].unit === '개' ? 1 : 100)

export function computeNutrition(r: { ingredients: { id: IngredientId; amount: number }[]; carb: CarbBase }): NutritionFacts {
  const parts: [NutritionFacts, number][] = r.ingredients.map(({ id, amount }) => [NUTRITION_PER[id], amount / basis(id)])
  // 밥과 함께 먹는 메뉴는 밥을 재료·장보기에 넣지 않고 영양정보에만 더한다(C1, C2)
  if (r.carb === 'rice') parts.push([RICE_PER_100G, config.riceWithMeal.grams / 100])

  const total = Object.fromEntries(KEYS.map((k) => [k, parts.reduce((sum, [facts, times]) => sum + facts[k] * times, 0)])) as NutritionFacts
  return {
    ...total,
    kcal: Math.round(total.kcal),
    carbsG: Math.round(total.carbsG),
    proteinG: Math.round(total.proteinG),
    fatG: Math.round(total.fatG),
    saturatedFatG: Math.round(total.saturatedFatG),
    sugarG: Math.round(total.sugarG),
    sodiumMg: Math.round(total.sodiumMg / 10) * 10,
  }
}
