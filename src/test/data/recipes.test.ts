import { describe, expect, it } from 'vitest'
import { CARB_OPTIONS, PROTEIN_OPTIONS } from '../../conditions'
import { checkRecipes } from '../../lib/recipeCheck'
import { recipeData, recipes } from '../../data/recipes'

describe('레시피 데이터 (H1, H2, C1, C2, C4)', () => {
  // 재료·분량·조리 단계·보관 정보·금지 표현·600kcal·id 중복 (lib/recipeCheck)
  it('모든 레시피가 값 검사를 통과한다', () => {
    expect(checkRecipes(recipeData)).toEqual([])
  })

  it.each(recipes)('$name: 영양정보가 음수가 아니다', (r) => {
    for (const v of Object.values(r.nutrition)) expect(v).toBeGreaterThanOrEqual(0)
  })

  // A8, A10 어떤 선택지 하나만 골라도 후보가 0개가 되지 않는다
  it.each(PROTEIN_OPTIONS)('단백질 $label: 후보 레시피가 2개 이상 있다', ({ sources }) => {
    expect(recipes.filter((r) => sources.includes(r.proteinSource)).length).toBeGreaterThanOrEqual(2)
  })

  it.each(CARB_OPTIONS)('탄수화물 $label: 후보 레시피가 2개 이상 있다', ({ value }) => {
    expect(recipes.filter((r) => r.carb === value).length).toBeGreaterThanOrEqual(2)
  })
})
