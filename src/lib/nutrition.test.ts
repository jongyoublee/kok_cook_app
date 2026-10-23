import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { RICE_PER_100G } from '../data/nutrition'
import { recipes } from '../data/recipes'
import { computeNutrition } from './nutrition'

describe('영양정보 계산 (H3, C2)', () => {
  it('g 재료는 100g 기준값에 분량 비율을 곱한다', () => {
    const n = computeNutrition({ ingredients: [{ id: 'chickenBreast', amount: 200 }], carb: 'noodle' })
    expect(n.kcal).toBe(218)
    expect(n.proteinG).toBe(46)
  })

  it('개 재료는 1개 기준값에 개수를 곱한다', () => {
    const n = computeNutrition({ ingredients: [{ id: 'egg', amount: 2 }], carb: 'potato' })
    expect(n.kcal).toBe(144)
  })

  it('밥과 함께 먹는 메뉴는 설정한 양의 밥을 더한다', () => {
    const base = { ingredients: [{ id: 'tofu' as const, amount: 100 }] }
    const withRice = computeNutrition({ ...base, carb: 'rice' })
    const without = computeNutrition({ ...base, carb: 'sweetPotato' })
    expect(withRice.kcal - without.kcal).toBe(Math.round((RICE_PER_100G.kcal * config.riceWithMeal.grams) / 100))
  })

  it.each(recipes)('$name: 열량이 탄수화물·단백질·지방으로 계산한 값과 10% 안에서 맞다', (r) => {
    const { kcal, carbsG, proteinG, fatG } = r.nutrition
    expect(Math.abs(carbsG * 4 + proteinG * 4 + fatG * 9 - kcal) / kcal).toBeLessThan(0.1)
  })
})
