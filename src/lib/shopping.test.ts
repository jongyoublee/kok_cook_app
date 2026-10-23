import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { CORNERS } from '../data/ingredients'
import { recipes } from '../data/recipes'
import { buildShoppingList, servingsOf } from './shopping'

const today = '2026-10-22'
const c = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS } // 다음 주 평일 5끼, 1인
const byId = (id: string) => recipes.find((r) => r.id === id)!
const pork = byId('spicy-pork') // 돼지고기 150, 양파 50, 대파 30, 간장 10 ...
const bulgogi = byId('beef-bulgogi')
const price = () => 1000

describe('인분 계산 (C3)', () => {
  it('메뉴별 인분 = 먹는 끼니 수 × 인원', () => {
    expect(servingsOf([pork, bulgogi], c)).toEqual([3, 2])
    expect(servingsOf([pork, bulgogi], { ...c, people: 2 })).toEqual([6, 4])
  })
})

describe('장보기 목록 (D1~D4)', () => {
  const list = buildShoppingList([pork, bulgogi], [3, 2], [], price)
  const item = (id: string) => list.items.find((it) => it.id === id)!

  it('같은 재료는 합치고 쓰는 메뉴를 모두 적는다 (D1, D3)', () => {
    const onionNeed = 50 * 3 + bulgogi.ingredients.find((i) => i.id === 'onion')!.amount * 2
    expect(item('onion').need).toBe(onionNeed)
    expect(item('onion').usedBy).toEqual([pork.name, bulgogi.name])
    expect(new Set(list.items.map((it) => it.id)).size).toBe(list.items.length)
  })

  it('판매 단위로 올림하고 남는 양을 계산한다 (D2)', () => {
    const it = item('porkShoulder') // 150g × 3 = 450g, 1팩 600g
    expect(it.need).toBe(450)
    expect(it.packs).toBe(1)
    expect(it.leftover).toBe(150)
    const big = buildShoppingList([pork], [5], [], price).items.find((x) => x.id === 'porkShoulder')! // 750g
    expect(big.packs).toBe(2)
    expect(big.leftover).toBe(450)
  })

  it('예상 금액은 판매 단위 가격 × 개수, 합계는 항목 합 (D4)', () => {
    for (const it of list.items) expect(it.price).toBe(1000 * it.packs)
    expect(list.total).toBe(list.items.reduce((s, it) => s + it.packs * 1000, 0))
    const noPrice = buildShoppingList([pork], [1], [], () => undefined)
    expect(noPrice.total).toBe(0)
    expect(noPrice.items[0].price).toBeUndefined()
  })

  it('집에 있는 양념은 목록에서 빼고 따로 알려준다 (A9)', () => {
    const l = buildShoppingList([pork, bulgogi], [3, 2], ['soySauce', 'sugar'], price)
    expect(l.items.map((it) => it.id)).not.toContain('soySauce')
    expect(l.inPantry.sort()).toEqual(['soySauce', 'sugar'])
  })

  it('코너 순서대로 정렬한다 (D5)', () => {
    const order = list.items.map((it) => CORNERS.indexOf(it.corner))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })
})
