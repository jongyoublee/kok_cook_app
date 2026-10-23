import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { ALL_CARBS, ALL_PROTEINS, defaultConditions, PROTEIN_OPTIONS } from '../conditions'
import { ingredients } from '../data/ingredients'
import { recipes, type Recipe } from '../data/recipes'
import { addMenu, assignDays, buildMenu, combinationCount, filterCandidates, fitsSpread, forEachCombo, greedyCombos, maxMenus, missingSeasonings, overlapScore, menuSpread, methodRule, proteinRule, relaxations, searchCombos, sharedIngredients, swapMenu } from './menu'

const today = '2026-10-22'
const all = { ...defaultConditions(today), proteins: ALL_PROTEINS, carbs: ALL_CARBS }
const someProteins = { ...all, proteins: ['chicken', 'fish', 'seafood'] as typeof all.proteins }
const first = () => 0
const byId = (id: string) => recipes.find((r) => r.id === id)!

function combos(pool: Recipe[], k: number): Recipe[][] {
  if (k === 0) return [[]]
  return pool.flatMap((r, i) => combos(pool.slice(i + 1), k - 1).map((c) => [r, ...c]))
}

describe('먹고 싶은 단백질 (A8)', () => {
  // 레시피를 추가해도 깨지지 않도록 기대값은 데이터에서 직접 고른다
  const ids = (rs: Recipe[]) => rs.map((r) => r.id).sort()

  it('고른 단백질이 주재료인 메뉴만 남는다', () => {
    const c = filterCandidates({ ...all, proteins: ['pork', 'chicken'] })
    expect(c.length).toBeGreaterThan(0)
    expect(ids(c)).toEqual(ids(recipes.filter((r) => ['pork', 'chicken'].includes(r.proteinSource))))
  })

  it('베이스 탄수화물로도 거른다 (A10)', () => {
    const c = filterCandidates({ ...all, carbs: ['noodle', 'sweetPotato'] })
    expect(c.length).toBeGreaterThan(0)
    expect(ids(c)).toEqual(ids(recipes.filter((r) => ['noodle', 'sweetPotato'].includes(r.carb))))
  })

  it('전부 고르면 단백질·탄수화물로 거르지 않는다', () => {
    expect(filterCandidates(all)).toEqual(recipes)
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
    for (const cond of [all, someProteins]) {
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
    const pool = filterCandidates(all)
    const pantry = ['soySauce', 'allulose', 'sesameOil'] as const
    const menu = buildMenu(pool, 2, [...pantry], first)
    const top = Math.max(...combos(pool, 2).map(overlapScore))
    const fewest = Math.min(...combos(pool, 2).filter((c) => overlapScore(c) === top).map((c) => missingSeasonings(c, [...pantry])))
    expect(overlapScore(menu)).toBe(top)
    expect(missingSeasonings(menu, [...pantry])).toBe(fewest)
  })
})

describe('교체와 추가 (B2, B3)', () => {
  const pool = filterCandidates(all)

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
    expect(maxMenus(all, pool)).toBe(Math.min(config.menuCount.max, pool.length, 5))
    expect(maxMenus({ ...all, dates: ['2026-10-26', '2026-10-27'] }, pool)).toBe(2)
  })
})

describe('먹는 날짜 배정', () => {
  it('냉동이 안 맞는 메뉴는 앞 날짜로 모은다 (E2)', () => {
    const stew = recipes.find((r) => !r.storage.freezable)!
    const pork = byId('spicy-pork')
    const [porkDays, stewDays] = assignDays([pork, stew], all.dates)
    expect(stewDays).toEqual(['2026-10-26', '2026-10-27'])
    expect(porkDays).toEqual(['2026-10-28', '2026-10-29', '2026-10-30'])
  })

  it('날짜 순서대로 돌아가며 배정', () => {
    const menu = filterCandidates(all).slice(0, 2)
    expect(assignDays(menu, all.dates)).toEqual([
      ['2026-10-26', '2026-10-28', '2026-10-30'],
      ['2026-10-27', '2026-10-29'],
    ])
  })
})

describe('모든 조합 비교 (B1)', () => {
  const pool = filterCandidates(all)

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

describe('단백질 분산 (B6)', () => {
  const pool = filterCandidates(all)
  const groupCounts = (menu: Recipe[]) => {
    const n = new Map<number, number>()
    for (const r of menu) {
      const g = PROTEIN_OPTIONS.findIndex((o) => o.sources.includes(r.proteinSource))
      n.set(g, (n.get(g) ?? 0) + 1)
    }
    return [...n.values()]
  }

  it('단백질을 1개만 골랐으면 제한이 없다', () => {
    expect(proteinRule(['pork'], 3)).toBeUndefined()
    expect(proteinRule(['tofu', 'legume'], 3)).toBeUndefined() // 두부·콩은 한 칸
  })

  it('한 단백질은 메뉴 수 ÷ 고른 단백질 수(올림)까지', () => {
    expect(proteinRule(['pork', 'chicken'], 2)!.cap).toBe(1)
    expect(proteinRule(['pork', 'chicken'], 3)!.cap).toBe(2)
    expect(proteinRule(ALL_PROTEINS, 5)!.cap).toBe(1)
  })

  it.each([2, 3, 4])('전부 골랐으면 메뉴 %i개가 모두 다른 단백질', (k) => {
    const menu = buildMenu(pool, k, [], first, menuSpread(ALL_PROTEINS, k))
    expect(menu).toHaveLength(k)
    expect(Math.max(...groupCounts(menu))).toBe(1)
  })

  it('두 개를 골랐고 메뉴가 3개면 한 단백질은 2개까지', () => {
    const two = filterCandidates({ ...all, proteins: ['pork', 'chicken'] })
    const menu = buildMenu(two, 3, [], first, menuSpread(['pork', 'chicken'], 3))
    expect(groupCounts(menu).sort()).toEqual([1, 2])
  })

  it('규칙으로 조합을 만들 수 없으면 규칙 없이 만든다', () => {
    // 닭고기와 두부·콩 중 콩(병아리콩)만 고르면 콩 메뉴가 1개라, 메뉴 4개에 단백질당 2개 제한을 지킬 수 없다
    const proteins: Recipe['proteinSource'][] = ['chicken', 'legume']
    const pool2 = filterCandidates({ ...all, proteins })
    expect(pool2.filter((r) => r.proteinSource === 'legume')).toHaveLength(1)
    const spread = [proteinRule(proteins, 4)!]
    expect(spread[0].cap).toBe(2)
    expect(buildMenu(pool2, 4, [], first, spread)).toHaveLength(4)
  })

  it('교체와 추가도 규칙을 지킨다', () => {
    const spread = menuSpread(ALL_PROTEINS, 3)
    let menu = buildMenu(pool, 3, [], first, spread)
    for (let i = 0; i < 5; i++) menu = swapMenu(menu, 0, pool, [], [], first, spread).menu
    expect(fitsSpread(menu, spread)).toBe(true)
    const added = addMenu(menu, pool, [], first, menuSpread(ALL_PROTEINS, 4))
    expect(fitsSpread(added, menuSpread(ALL_PROTEINS, 4))).toBe(true)
  })
})

describe('조리법 분산', () => {
  const pool = filterCandidates(all)
  const maxSameMethod = (menu: Recipe[]) => Math.max(...menu.map((r) => menu.filter((x) => x.method === r.method).length))

  it('같은 조리법은 메뉴 수의 절반(올림)까지', () => {
    expect(methodRule(1)).toBeUndefined()
    expect([2, 3, 4, 5].map((k) => methodRule(k)!.cap)).toEqual([1, 2, 2, 3])
  })

  it.each([2, 3, 4, 5])('메뉴 %i개도 조리법 규칙을 지킨다', (k) => {
    const menu = buildMenu(pool, k, [], first, menuSpread(ALL_PROTEINS, k))
    expect(menu).toHaveLength(k)
    expect(maxSameMethod(menu)).toBeLessThanOrEqual(methodRule(k)!.cap)
  })

  it('규칙은 조리법 제한부터 1씩 풀고, 다음에 단백질만, 마지막에 규칙 없이', () => {
    const steps = relaxations(menuSpread(ALL_PROTEINS, 3))
    expect(steps.map((s) => s.map((r) => `${r.kind}${r.cap}`).join())).toEqual(['protein1,method2', 'protein1,method3', 'protein1,method4', 'protein1', ''])
  })
})
