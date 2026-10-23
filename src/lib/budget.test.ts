import { describe, expect, it } from 'vitest'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { recipes } from '../data/recipes'
import { budgetVersion, menuCost, suggestSwap } from './budget'
import { coupangSearchUrl } from './coupang'
import { filterCandidates } from './menu'

const today = '2026-10-22'
const c = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS }

describe('예상 금액 (D4)', () => {
  it('집에 있는 양념은 예상 금액에서 빠진다', () => {
    const menu = recipes.slice(0, 2)
    expect(menuCost(menu, { ...c, pantry: ['soySauce'] })).toBeLessThan(menuCost(menu, c))
  })
})

describe('예산 버전 B (F2)', () => {
  it('메뉴 하나를 바꿔 가장 많이 줄어드는 교체를 제안한다', () => {
    const pool = filterCandidates(c)
    const menu = [...pool].sort((a, b) => menuCost([b], c) - menuCost([a], c)).slice(0, 2) // 비싼 두 개
    const s = suggestSwap(menu, c)!
    expect(s.saving).toBeGreaterThan(0)
    expect(menuCost(s.menu, c)).toBe(menuCost(menu, c) - s.saving)
    expect(s.menu).toContain(s.to)
    expect(s.menu).not.toContain(s.from)
    expect(new Set(s.menu).size).toBe(2)
  })

  it('더 싸게 바꿀 수 없으면 제안 없음', () => {
    const pool = filterCandidates(c)
    expect(suggestSwap(pool, c)).toBeNull() // 후보를 다 쓰면 바꿀 메뉴가 없다
  })
})

describe('버전 전환과 쿠팡 링크 (F3, G1)', () => {
  it('주소의 budget 값이 설정보다 먼저', () => {
    expect(budgetVersion('?budget=B')).toBe('B')
    expect(budgetVersion('?budget=A')).toBe('A')
    expect(['A', 'B']).toContain(budgetVersion('?budget=x'))
  })

  it('재료 이름으로 쿠팡 검색 링크를 만든다', () => {
    expect(coupangSearchUrl('돼지고기 앞다리살')).toBe('https://www.coupang.com/np/search?q=%EB%8F%BC%EC%A7%80%EA%B3%A0%EA%B8%B0%20%EC%95%9E%EB%8B%A4%EB%A6%AC%EC%82%B4')
  })
})
