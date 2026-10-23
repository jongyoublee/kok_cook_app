import { describe, expect, it } from 'vitest'
import { recipes } from './data/recipes'
import { loadPlan, savePlan } from './plan'

const fakeStorage = (init?: string) => {
  const m = new Map<string, string>(init ? [['kokcook.plan', init]] : [])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('확정 메뉴와 구매 체크 저장 (I2, D6)', () => {
  it('저장 후 불러오면 같다', () => {
    const s = fakeStorage()
    const plan = { menu: recipes.slice(0, 2), checked: ['onion' as const] }
    savePlan(plan, s)
    expect(loadPlan(s)).toEqual(plan)
  })

  it('없어진 레시피·재료는 거르고, 메뉴가 없거나 깨졌으면 null', () => {
    const plan = loadPlan(fakeStorage(JSON.stringify({ recipeIds: ['x', recipes[0].id], checked: ['onion', 'x', 3] })))!
    expect(plan.menu).toEqual([recipes[0]])
    expect(plan.checked).toEqual(['onion'])
    expect(loadPlan(fakeStorage(JSON.stringify({ recipeIds: ['x'] })))).toBeNull()
    expect(loadPlan(fakeStorage('{oops'))).toBeNull()
    expect(loadPlan(fakeStorage())).toBeNull()
  })
})
