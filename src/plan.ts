// I2 확정한 메뉴와 D6 구매 체크를 기기에 저장한다
import { storageOrNull } from './conditions'
import { ingredients, type IngredientId } from './data/ingredients'
import { recipes, type Recipe } from './data/recipes'

export type Plan = { menu: Recipe[]; checked: IngredientId[] }

const KEY = 'kokcook.plan'

// 저장값이 깨졌거나 없어진 레시피·재료가 있으면 걸러낸다. 남는 메뉴가 없으면 null
export function loadPlan(storage = storageOrNull()): Plan | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    const menu = (Array.isArray(saved?.recipeIds) ? saved.recipeIds : []).map((id: unknown) => recipes.find((r) => r.id === id)).filter(Boolean)
    const checked = (Array.isArray(saved?.checked) ? saved.checked : []).filter((id: unknown) => typeof id === 'string' && id in ingredients)
    return menu.length ? { menu, checked } : null
  } catch {
    return null
  }
}

export function savePlan(plan: Plan, storage = storageOrNull()) {
  try {
    storage?.setItem(KEY, JSON.stringify({ recipeIds: plan.menu.map((r) => r.id), checked: plan.checked }))
  } catch {
    // 저장 공간이 막힌 환경에서는 저장 없이 진행한다
  }
}
