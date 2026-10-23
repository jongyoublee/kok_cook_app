import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { CARB_OPTIONS, PROTEIN_OPTIONS } from '../conditions'
import { ingredients } from './ingredients'
import { recipes } from './recipes'

// I3 서비스 문구에 쓰지 않는 표현
const FORBIDDEN = ['다이어트', '당뇨', '치료', '효능']

describe('레시피 데이터 (H1, H2, C1, C2, C4)', () => {
  it('레시피 id가 겹치지 않는다', () => {
    expect(new Set(recipes.map((r) => r.id)).size).toBe(recipes.length)
  })

  it.each(recipes)('$name: 재료는 사전에 있고 분량이 양수다', (r) => {
    expect(r.ingredients.length).toBeGreaterThan(0)
    for (const { id, amount } of r.ingredients) {
      expect(ingredients).toHaveProperty(id)
      expect(amount).toBeGreaterThan(0)
    }
    expect(new Set(r.ingredients.map((i) => i.id)).size).toBe(r.ingredients.length)
  })

  it.each(recipes)('$name: 조리 단계, 영양정보, 보관 정보가 채워져 있다', (r) => {
    expect(r.steps.length).toBeGreaterThan(0)
    expect(r.cookMinutes).toBeGreaterThan(0)
    expect(r.portionG).toBeGreaterThan(0)
    for (const v of Object.values(r.nutrition)) expect(v).toBeGreaterThanOrEqual(0)
    expect(r.storage.fridgeDays).toBeGreaterThan(0)
    expect(r.storage.fridgeDays).toBeLessThanOrEqual(config.foodSafety.fridgeDays)
  })

  it.each(recipes)('$name: 금지 표현이 없다', (r) => {
    const text = [r.name, ...r.steps].join(' ')
    for (const word of FORBIDDEN) expect(text).not.toContain(word)
  })

  // A6 화면에 '모든 메뉴는 한 끼 600kcal 이하 기준'이라고 안내하고, 후보 필터는 칼로리를 보지 않는다
  it.each(recipes)('$name: 한 끼 칼로리 기준 이하다', (r) => {
    expect(r.nutrition.kcal).toBeLessThanOrEqual(config.maxKcalPerMeal)
  })

  // A8, A10 어떤 선택지 하나만 골라도 후보가 0개가 되지 않는다
  it.each(PROTEIN_OPTIONS)('단백질 $label: 후보 레시피가 2개 이상 있다', ({ sources }) => {
    expect(recipes.filter((r) => sources.includes(r.proteinSource)).length).toBeGreaterThanOrEqual(2)
  })

  it.each(CARB_OPTIONS)('탄수화물 $label: 후보 레시피가 2개 이상 있다', ({ value }) => {
    expect(recipes.filter((r) => r.carb === value).length).toBeGreaterThanOrEqual(2)
  })
})
