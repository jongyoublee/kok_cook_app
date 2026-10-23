import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { RICE_PER_100G } from '../data/nutrition'
import { recipes } from '../data/recipes'
import { computeNutrition, proteinEnergyShare, summarizeMenu } from './nutrition'

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

describe('추천 메뉴 칼로리 요약 (A6)', () => {
  const facts = (kcal: number, proteinG: number) => ({ nutrition: { kcal, proteinG, carbsG: 0, fatG: 0, saturatedFatG: 0, sugarG: 0, sodiumMg: 0 } })

  it('먹는 끼니 수로 가중 평균하고 합계를 낸다', () => {
    const s = summarizeMenu([facts(500, 30), facts(600, 40)], [3, 2])
    expect(s).toEqual({ meals: 5, avgKcal: 540, avgProteinG: 34, totalKcal: 2700 })
  })

  it('끼니가 없으면 0', () => {
    expect(summarizeMenu([], [])).toEqual({ meals: 0, avgKcal: 0, avgProteinG: 0, totalKcal: 0 })
  })
})

describe('단백질 열량 비중 (B5)', () => {
  const n = { kcal: 400, proteinG: 30, carbsG: 0, fatG: 0, saturatedFatG: 0, sugarG: 0, sodiumMg: 0 }
  it('단백질 g × 4 ÷ 열량', () => {
    expect(proteinEnergyShare(n)).toBe(30)
    expect(proteinEnergyShare({ ...n, kcal: 0 })).toBe(0)
  })
})
