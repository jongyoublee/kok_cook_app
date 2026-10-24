import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { recipeData, type RecipeData } from '../data/recipes'
import { checkRecipe, checkRecipes } from './recipeCheck'

const base = recipeData[0]
const edit = (patch: Partial<RecipeData>) => ({ ...structuredClone(base), ...patch })

describe('레시피 값 검사 (H1)', () => {
  it('정상 레시피는 문제가 없다', () => {
    expect(checkRecipe(base)).toEqual([])
  })

  it('사전에 없는 재료, 0 분량, 같은 재료 두 번을 잡는다', () => {
    expect(checkRecipe(edit({ ingredients: [{ id: 'nope' as never, amount: 10 }] })).join()).toContain('사전에 없는')
    expect(checkRecipe(edit({ ingredients: [{ id: 'onion', amount: 0 }] })).join()).toContain('0보다')
    expect(checkRecipe(edit({ ingredients: [{ id: 'onion', amount: 10 }, { id: 'onion', amount: 5 }] })).join()).toContain('두 번')
  })

  it('빈 단계, 금지 표현, 냉장 일수 초과를 잡는다', () => {
    expect(checkRecipe(edit({ steps: ['볶는다.', ' '] })).join()).toContain('조리 단계')
    expect(checkRecipe(edit({ steps: ['다이어트에 좋다.'] })).join()).toContain('다이어트')
    expect(checkRecipe(edit({ storage: { freezable: true, fridgeDays: config.foodSafety.fridgeDays + 1 } })).join()).toContain('냉장 일수')
  })

  it('한 끼 칼로리 기준을 넘으면 잡는다', () => {
    expect(checkRecipe(edit({ ingredients: [{ id: 'cookingOil', amount: 100 }] })).join()).toContain('kcal')
  })

  it('목록에서 id 중복을 잡는다', () => {
    expect(checkRecipes([base, base]).join()).toContain('id가 겹쳐요')
  })
})
