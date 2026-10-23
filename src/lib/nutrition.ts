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

export type MenuNutritionSummary = { meals: number; avgKcal: number; avgProteinG: number; totalKcal: number }

// A6 추천 메뉴 화면의 칼로리 요약. mealsPerMenu는 메뉴별로 1인이 먹는 끼니 수라서 끼니 수로 가중 평균한다.
// 평균·합계 칼로리는 10kcal 단위로 반올림한다(추정치)
export function summarizeMenu(menu: { nutrition: NutritionFacts }[], mealsPerMenu: number[]): MenuNutritionSummary {
  const meals = mealsPerMenu.reduce((a, b) => a + b, 0)
  const sum = (k: 'kcal' | 'proteinG') => menu.reduce((s, r, i) => s + r.nutrition[k] * mealsPerMenu[i], 0)
  if (!meals) return { meals: 0, avgKcal: 0, avgProteinG: 0, totalKcal: 0 }
  return {
    meals,
    avgKcal: Math.round(sum('kcal') / meals / 10) * 10,
    avgProteinG: Math.round(sum('proteinG') / meals),
    totalKcal: Math.round(sum('kcal') / 10) * 10,
  }
}

// B5 단백질 열량 비중(%): 단백질 1g = 4kcal로 본 단백질 열량 ÷ 전체 열량
export const proteinEnergyShare = (n: NutritionFacts) => (n.kcal ? Math.round(((n.proteinG * 4) / n.kcal) * 100) : 0)
