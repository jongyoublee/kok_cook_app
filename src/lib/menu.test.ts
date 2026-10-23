import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions } from '../conditions'
import { ingredients } from '../data/ingredients'
import { recipes, type Recipe } from '../data/recipes'
import { addMenu, assignDays, buildMenu, combinationCount, filterCandidates, forEachCombo, greedyCombos, maxMenus, missingSeasonings, overlapScore, searchCombos, sharedIngredients, swapMenu } from './menu'

const today = '2026-10-22'
const hearty = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS }
const light = { ...hearty, diet: 'light' as const }
const first = () => 0
const byId = (id: string) => recipes.find((r) => r.id === id)!

function combos(pool: Recipe[], k: number): Recipe[][] {
  if (k === 0) return [[]]
  return pool.flatMap((r, i) => combos(pool.slice(i + 1), k - 1).map((c) => [r, ...c]))
}

describe('후보 필터 (B4)', () => {
  it('든든한 한 끼는 칼로리 상한 이하', () => {
    const c = filterCandidates(hearty)
    expect(c.length).toBeGreaterThan(0)
    for (const r of c) expect(r.nutrition.kcal).toBeLessThanOrEqual(hearty.maxKcal)
  })

  it('가벼운 한 끼는 단백질 기준 이상, 칼로리 기준 이하', () => {
    const c = filterCandidates(light)
    expect(c.length).toBeGreaterThan(0)
    for (const r of c) {
      expect(r.nutrition.proteinG).toBeGreaterThanOrEqual(config.highProtein.minProteinG)
      expect(r.nutrition.kcal).toBeLessThanOrEqual(config.highProtein.maxKcal)
    }
  })
})

describe('먹고 싶은 단백질 (A8)', () => {
  // 레시피를 추가해도 깨지지 않도록 기대값은 데이터에서 직접 고른다
  const ids = (rs: Recipe[]) => rs.map((r) => r.id).sort()

  it('고른 단백질이 주재료인 메뉴만 남는다', () => {
    // 단백질 필터만 보려고 칼로리 상한은 푼다
    const c = filterCandidates({ ...hearty, maxKcal: Infinity, proteins: ['pork', 'chicken'] })
    expect(c.length).toBeGreaterThan(0)
    expect(ids(c)).toEqual(ids(recipes.filter((r) => ['pork', 'chicken'].includes(r.proteinSource))))
  })

  it('베이스 탄수화물로도 거른다 (A10)', () => {
    const c = filterCandidates({ ...light, carbs: ['noodle', 'sweetPotato'] })
    const { minProteinG, maxKcal } = config.highProtein
    expect(c.length).toBeGreaterThan(0)
    expect(ids(c)).toEqual(
      ids(recipes.filter((r) => ['noodle', 'sweetPotato'].includes(r.carb) && r.nutrition.proteinG >= minProteinG && r.nutrition.kcal <= maxKcal)),
    )
  })

  it('전부 고르면 단백질·탄수화물로 거르지 않는다', () => {
    expect(filterCandidates(hearty)).toEqual(recipes.filter((r) => r.nutrition.kcal <= hearty.maxKcal))
  })
})

describe('재료 겹침 점수 (B1)', () => {
  const pork = byId('spicy-pork')
  const bulgogi = byId('beef-bulgogi')

  it('겹치는 재료에는 양념도 보이지만 점수에서는 뺀다', () => {
    const shared = sharedIngredients([pork, bulgogi])
    expect(shared).toContain('soySauce')
    expect(overlapScore([pork, bulgogi])).toBe(shared.filter((id) => ingredients[id].corner !== '양념').length)
    expect(overlapScore([pork, bulgogi])).toBeLessThan(shared.length)
  })

  it.each([2, 3, 4])('메뉴 %i개: 고른 조합은 모든 조합 중 최고점', (k) => {
    for (const cond of [hearty, light]) {
      const pool = filterCandidates(cond)
      const top = Math.max(...combos(pool, k).map(overlapScore))
      const menu = buildMenu(pool, k, [], first)
      expect(menu).toHaveLength(k)
      expect(new Set(menu).size).toBe(k)
      expect(overlapScore(menu)).toBe(top)
    }
  })
})

describe('집에 있는 양념 (A9)', () => {
  it('겹침 점수가 같으면 새로 살 양념이 적은 조합을 고른다', () => {
    const pool = filterCandidates(hearty)
    const pantry = ['soySauce', 'allulose', 'sesameOil'] as const
    const menu = buildMenu(pool, 2, [...pantry], first)
    const top = Math.max(...combos(pool, 2).map(overlapScore))
    const fewest = Math.min(...combos(pool, 2).filter((c) => overlapScore(c) === top).map((c) => missingSeasonings(c, [...pantry])))
    expect(overlapScore(menu)).toBe(top)
    expect(missingSeasonings(menu, [...pantry])).toBe(fewest)
  })
})

describe('교체와 추가 (B2, B3)', () => {
  const pool = filterCandidates(hearty)

  it('교체하면 중복 없이 바뀌고, 그 칸에서 본 메뉴는 후보를 다 볼 때까지 다시 안 나온다', () => {
    let menu = buildMenu(pool, 2, [], first)
    let shown: string[] = []
    const seen = [menu[0].id]
    for (let n = 0; n < pool.length - 2; n++) {
      ;({ menu, shown } = swapMenu(menu, 0, pool, shown, [], first))
      expect(new Set(menu).size).toBe(2)
      expect(seen).not.toContain(menu[0].id)
      seen.push(menu[0].id)
    }
    // 다 보면 다시 처음부터
    ;({ menu, shown } = swapMenu(menu, 0, pool, shown, [], first))
    expect(menu[0].id).not.toBe(seen.at(-1))
    expect(menu[0].id).not.toBe(menu[1].id)
  })

  it('추가는 후보가 남아 있을 때만', () => {
    const all = pool.reduce<Recipe[]>((m) => addMenu(m, pool, [], first), [])
    expect(all).toHaveLength(pool.length)
    expect(addMenu(all, pool, [], first)).toBe(all)
  })

  it('메뉴 수 상한은 설정, 후보 수, 끼니 수 중 가장 작은 값', () => {
    expect(maxMenus(hearty, pool)).toBe(Math.min(config.menuCount.max, pool.length, 5))
    expect(maxMenus({ ...hearty, dates: ['2026-10-26', '2026-10-27'] }, pool)).toBe(2)
  })
})

describe('먹는 날짜 배정', () => {
  it('냉동이 안 맞는 메뉴는 앞 날짜로 모은다 (E2)', () => {
    const stew = recipes.find((r) => !r.storage.freezable)!
    const pork = byId('spicy-pork')
    const [porkDays, stewDays] = assignDays([pork, stew], hearty.dates)
    expect(stewDays).toEqual(['2026-10-26', '2026-10-27'])
    expect(porkDays).toEqual(['2026-10-28', '2026-10-29', '2026-10-30'])
  })

  it('날짜 순서대로 돌아가며 배정', () => {
    const menu = filterCandidates(hearty).slice(0, 2)
    expect(assignDays(menu, hearty.dates)).toEqual([
      ['2026-10-26', '2026-10-28', '2026-10-30'],
      ['2026-10-27', '2026-10-29'],
    ])
  })
})

describe('모든 조합 비교 (B1)', () => {
  const pool = filterCandidates(hearty)

  it('조합 수를 계산한다', () => {
    expect(combinationCount(38, 3)).toBe(8436)
    expect(combinationCount(5, 0)).toBe(1)
  })

  it('모든 조합을 한 번씩 돌고, 점수는 직접 센 값과 같다', () => {
    const small = pool.slice(0, 8)
    let n = 0
    forEachCombo(small, 3, ['soySauce'], (menu, overlap, missing) => {
      n++
      expect(overlap).toBe(overlapScore([...menu]))
      expect(missing).toBe(missingSeasonings([...menu], ['soySauce']))
    })
    expect(n).toBe(combinationCount(8, 3))
  })

  it('조합 수가 상한을 넘으면 탐욕 선택으로 돌아간다', () => {
    const { maxCombos } = config.menuSearch
    config.menuSearch.maxCombos = 0
    try {
      expect(searchCombos(pool, 2, [], first)).toEqual(greedyCombos(pool, 2, [], first))
    } finally {
      config.menuSearch.maxCombos = maxCombos
    }
  })
})
