// H1 레시피 후보(data/recipe-candidates.json)를 관리 화면에서 레시피 초안으로 올린다.
// 후보에는 재료 이름만 있고 분량·조리 단계가 없다. 분량은 0, 조리 단계는 빈칸으로 두어 직접 채우기 전에는 검사를 통과하지 못한다
import { config } from '../config'
import candidateFile from '../../data/recipe-candidates.json'
import { ingredients, type IngredientId } from '../data/ingredients'
import type { CarbBase, ProteinSource, RecipeData } from '../data/recipes'

export type Candidate = {
  id: string
  name: string
  source: string
  korean: boolean
  protein: ProteinSource | 'other'
  carb: CarbBase | 'other'
  ingredients: { name: string }[]
  mealPrep: string
  note: string
}

export const candidates = candidateFile.candidates as Candidate[]

// 띄어쓰기와 괄호 설명을 뺀 이름이 사전 이름과 같을 때만 같은 재료로 본다(예: '다진 마늘(냉동)' → 다진 마늘).
// '땅콩버터'와 '버터'처럼 이름 일부만 겹치는 것은 다른 재료라 잇지 않는다
const norm = (s: string) => s.replace(/\(.*?\)/g, '').replace(/\s/g, '')
const byName = new Map((Object.keys(ingredients) as IngredientId[]).flatMap((id) => [[norm(ingredients[id].name), id] as const, [ingredients[id].name.replace(/\s/g, ''), id] as const]))
const matchIngredient = (name: string) => byName.get(name.replace(/\s/g, '')) ?? byName.get(norm(name))

export function draftFromCandidate(c: Candidate): { draft: RecipeData; unmatched: string[] } {
  const ids: IngredientId[] = []
  const unmatched: string[] = []
  for (const { name } of c.ingredients) {
    const id = matchIngredient(name)
    if (!id) unmatched.push(name)
    else if (!ids.includes(id)) ids.push(id)
  }
  return {
    draft: {
      id: '',
      name: c.name,
      korean: c.korean,
      proteinSource: c.protein === 'other' ? 'pork' : c.protein,
      carb: c.carb === 'other' ? 'rice' : c.carb,
      flavor: 'soy',
      method: 'stirFry',
      ingredients: ids.map((id) => ({ id, amount: 0 })),
      steps: [''],
      cookMinutes: 20,
      portionG: 200,
      storage: { freezable: true, fridgeDays: config.foodSafety.fridgeDays },
      verified: false,
      candidateId: c.id,
    },
    unmatched,
  }
}
