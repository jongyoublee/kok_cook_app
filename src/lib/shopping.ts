// C3 인분 계산과 D1~D4 장보기 목록
import { mealCount, type Conditions } from '../conditions'
import { CORNERS, ingredients, type Corner, type IngredientId } from '../data/ingredients'
import type { PriceSource } from '../data/prices'
import type { Recipe } from '../data/recipes'
import { assignDays } from './menu'

// C3 메뉴별 만들 인분 = 그 메뉴를 먹는 끼니 수 × 인원. B9 안 먹는 날은 요일 배정은 그대로 두고 그 끼니만 뺀다
export const servingsOf = (menu: Recipe[], c: Conditions): number[] =>
  assignDays(menu, c.dates).map((days) => days.filter((d) => !c.skipped?.includes(d)).length * (mealCount(c) / c.dates.length) * c.people)

export type ShoppingItem = {
  id: IngredientId
  name: string
  corner: Corner
  unit: string
  need: number // 필요한 양 (재료 단위)
  packs: number // D2 사야 할 판매 단위 수
  saleLabel: string
  leftover: number // D2 남는 양
  usedBy: string[] // D3 이 재료를 쓰는 메뉴 이름
  price?: number // D4 예상 금액 (가격을 모르면 없음)
}

export type ShoppingList = {
  items: ShoppingItem[] // 코너 순서, 같은 코너는 이름 순
  inPantry: IngredientId[] // A9 집에 있어서 뺀 재료
  total: number // 가격을 아는 항목의 예상 금액 합계
}

export function buildShoppingList(menu: Recipe[], servings: number[], pantry: IngredientId[], priceOf: PriceSource): ShoppingList {
  const need = new Map<IngredientId, { amount: number; usedBy: string[] }>()
  menu.forEach((r, i) => {
    for (const { id, amount } of r.ingredients) {
      const cur = need.get(id) ?? { amount: 0, usedBy: [] }
      need.set(id, { amount: cur.amount + amount * servings[i], usedBy: [...cur.usedBy, r.name] })
    }
  })

  const items: ShoppingItem[] = []
  const inPantry: IngredientId[] = []
  for (const [id, { amount, usedBy }] of need) {
    if (pantry.includes(id)) {
      inPantry.push(id)
      continue
    }
    const ing = ingredients[id]
    const packs = Math.ceil(amount / ing.saleUnit.amount)
    const unitPrice = priceOf(id)
    items.push({
      id,
      name: ing.name,
      corner: ing.corner,
      unit: ing.unit,
      need: amount,
      packs,
      saleLabel: ing.saleUnit.label,
      leftover: packs * ing.saleUnit.amount - amount,
      usedBy,
      price: unitPrice === undefined ? undefined : unitPrice * packs,
    })
  }
  items.sort((a, b) => CORNERS.indexOf(a.corner) - CORNERS.indexOf(b.corner) || a.name.localeCompare(b.name, 'ko'))
  return { items, inPantry, total: items.reduce((sum, it) => sum + (it.price ?? 0), 0) }
}

// B7 1인분 예상 재료비: 판매 단위 가격을 쓰는 양만큼 나눠 더한다(남는 양은 넣지 않는다). 집에 있는 양념은 빼고, 100원 단위로 반올림
export function perServingCost(r: Recipe, pantry: IngredientId[], priceOf: PriceSource): number {
  const sum = r.ingredients.reduce((s, { id, amount }) => {
    const price = pantry.includes(id) ? undefined : priceOf(id)
    return price === undefined ? s : s + (price * amount) / ingredients[id].saleUnit.amount
  }, 0)
  return Math.round(sum / 100) * 100
}
