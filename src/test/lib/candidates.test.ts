import { describe, expect, it } from 'vitest'
import { candidates, draftFromCandidate } from '../../lib/candidates'
import { checkRecipe } from '../../lib/recipeCheck'

const cand = candidates.find((c) => c.id === 'cand-01')! // 닭가슴살 카레 우동

describe('레시피 후보 올리기 (H1)', () => {
  it('사전 이름과 같은 재료만 잇고, 나머지는 사전에 없는 재료로 돌려준다', () => {
    const { draft, unmatched } = draftFromCandidate(cand)
    expect(draft.ingredients.map((i) => i.id)).toEqual(expect.arrayContaining(['butter', 'salt', 'zucchini', 'onion', 'potato', 'greenOnion']))
    expect(unmatched).toEqual(expect.arrayContaining(['고형 카레', '홍피망']))
    expect(draft.candidateId).toBe('cand-01')
  })

  it("이름 일부만 겹치는 재료는 잇지 않는다('땅콩버터'는 버터가 아님)", () => {
    const { draft, unmatched } = draftFromCandidate({ ...cand, ingredients: [{ name: '땅콩버터' }, { name: '다진 마늘(냉동)' }] })
    expect(draft.ingredients.map((i) => i.id)).toEqual(['garlic'])
    expect(unmatched).toEqual(['땅콩버터'])
  })

  it('분량과 조리 단계를 채우기 전에는 검사를 통과하지 못한다', () => {
    expect(checkRecipe(draftFromCandidate(cand).draft).length).toBeGreaterThan(0)
  })
})
