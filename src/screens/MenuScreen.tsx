// B1~B3 추천 메뉴 화면 (와이어프레임 2). 메뉴는 App이 들고 있어 레시피 상세에 다녀와도 유지된다.
// 예상 금액 막대는 버전 A면 예산과 비교한다
import { useMemo, useState, type ReactNode } from 'react'
import { config } from '../config'
import { homeOf, mealCount, type Conditions } from '../conditions'
import { ingredients } from '../data/ingredients'
import { cookDay, dayLabel, formatDay } from '../lib/dates'
import { FLAVOR_LABEL, METHOD_LABEL, type Recipe } from '../data/recipes'
import { addMenu, assignDays, filterCandidates, maxMenus, menuSpread, sharedIngredients, swapMenu } from '../lib/menu'
import { BudgetMeter } from '../components/fields'
import { budgetOf, budgetVersion, menuCost } from '../lib/budget'
import { summarizeMenu } from '../lib/nutrition'
import { OPTION_LABEL, suggestAddition, type MenuOption } from '../lib/options'
import { perServingCost, servingsOf } from '../lib/shopping'
import { priceOf } from '../data/prices'
import { ABOVE_NAV, EYEBROW, num, primaryButton, won } from '../ui'

type Props = {
  header?: ReactNode
  conditions: Conditions
  menu: Recipe[]
  options: MenuOption[] // B1 추천안. 고른 뒤에도 교체·추가·삭제로 고칠 수 있다
  onChange: (menu: Recipe[]) => void
  onHide: (id: string) => void // B10 다시 안 보기
  onOpenRecipe: (r: Recipe) => void
  onConfirm: () => void
  onBack: () => void
}

const sameMenu = (a: Recipe[], b: Recipe[]) => a.map((r) => r.id).sort().join() === b.map((r) => r.id).sort().join()
const optionDesc = (o: MenuOption) =>
  o.kind === 'owned'
    ? `집 재료 ${o.owned}가지`
    : o.kind === 'cheap'
    ? `약 ${won(o.cost)}`
    : o.kind === 'pantry'
      ? o.missing
        ? `새 양념 ${o.missing}가지`
        : '새 양념 없음'
      : o.kind === 'flex'
        ? `${o.premium.join('·')} · 약 ${won(o.cost)}`
        : `재료 ${o.items}가지`

export default function MenuScreen({ header, conditions: c, menu, options, onChange: setMenu, onHide, onOpenRecipe, onConfirm, onBack }: Props) {
  const candidates = useMemo(() => filterCandidates(c), [c])
  const limit = maxMenus(c, candidates)
  const [shown, setShown] = useState<string[][]>([])
  const [dismissed, setDismissed] = useState<string[]>([]) // '괜찮아요'를 누른 추가 제안 (메뉴 조합별)
  const [moreOpen, setMoreOpen] = useState<number | null>(null) // B14 … 메뉴를 연 행

  if (!menu.length)
    return (
      <main className="mx-auto max-w-md p-4">
        {header}
        <p className="mt-6">조건에 맞는 메뉴가 없어요. 조건을 바꿔 보세요.</p>
        <button type="button" className="mt-4 underline" onClick={onBack}>조건으로 돌아가기</button>
      </main>
    )

  const days = assignDays(menu, c.dates)
  const visibleOptions = options.filter((o) => o.menu.every((r) => !c.hidden.includes(r.id)))
  const shared = sharedIngredients(menu)
  // A6 1인 기준 칼로리 요약. 메뉴별 1인 끼니 수 = 만들 인분 ÷ 인원
  // B3, D3 확정 전 추가 제안. 버전 A면 예산 안에서만
  const budget = budgetVersion() === 'A' ? budgetOf(c) : undefined
  const suggestion = suggestAddition(menu, c, budget)
  const suggestionKey = suggestion ? `${menu.map((r) => r.id).join()}+${suggestion.recipe.id}` : ''
  const kcal = summarizeMenu(menu, servingsOf(menu, c).map((n) => n / c.people))

  const swap = (i: number) => {
    const r = swapMenu(menu, i, candidates, shown[i] ?? [], homeOf(c), Math.random, menuSpread(c.proteins, menu.length))
    setMenu(r.menu)
    setShown((s) => Object.assign([...s], { [i]: r.shown }))
  }

  // B10 다시 안 보기: 그 칸을 다른 메뉴로 바꾸고(없으면 빼고) 다음부터 추천하지 않는다
  const hide = (i: number) => {
    const r = menu[i]
    const rest = candidates.filter((x) => x !== r)
    const next = swapMenu(menu, i, rest, shown[i] ?? [], homeOf(c), Math.random, menuSpread(c.proteins, menu.length))
    if (next.menu !== menu) setMenu(next.menu)
    else if (menu.length > config.menuCount.min) remove(i)
    onHide(r.id)
  }

  // B3 메뉴 삭제. 최소 개수 아래로는 줄이지 않는다
  const remove = (i: number) => {
    setMenu(menu.filter((_, j) => j !== i))
    setShown((s) => s.filter((_, j) => j !== i))
  }

  const cost = menuCost(menu, c)
  const meterBudget = c.cheapest ? undefined : budget

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
      {header}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="p-1 text-xl" aria-label="조건으로 돌아가기">‹</button>
        <h1 className="text-2xl font-bold">다음 주 메뉴</h1>
      </div>
      {limit < c.menuCount && (
        <p className="text-sm font-medium text-ink">조건에 맞게 만들 수 있는 메뉴가 {limit}개라 {limit}개로 구성했어요.</p>
      )}

      {/* B13 요약 카드: D4·F1 예상 금액과 예산, 끼니·인원·장보기 날짜, A6 칼로리 요약(추정치) */}
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className={EYEBROW}>
          {formatDay(c.dates[0])} ~ {formatDay(c.dates[c.dates.length - 1])}
        </p>
        <p className="mt-1 text-[28px] font-bold tabular-nums">약 {won(cost)}</p>
        {meterBudget !== undefined && <BudgetMeter cost={cost} budget={meterBudget} />}
        <p className="mt-2 text-sm text-sub">
          저녁 {mealCount(c)}끼 · {c.people}명 · <span className="font-semibold text-accent-text">{formatDay(cookDay(c.dates)!)} 장보기</span>
        </p>
        <p className="text-sm text-sub">
          한 끼 평균 약 {num(kcal.avgKcal)}kcal · 단백질 {kcal.avgProteinG}g · {kcal.meals}끼 합계 약 {num(kcal.totalKcal)}kcal
        </p>
      </section>

      {/* B1 추천안 칩 */}
      {visibleOptions.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {visibleOptions.map((o) => {
            const on = sameMenu(o.menu, menu)
            return (
              <button
                key={o.kind}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setMenu(o.menu)
                  setShown([])
                }}
                className={`shrink-0 rounded-full bg-surface px-4 py-2 text-left text-sm ${on ? 'border-2 border-ink font-bold' : 'border border-line'}`}
              >
                {OPTION_LABEL[o.kind]}
                <span className="ml-1.5 font-normal text-sub">{optionDesc(o)}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* B14 메뉴 행 */}
      <section>
        <h2 className={`${EYEBROW} border-b-2 border-ink pb-1.5 text-ink`}>다음 주 저녁</h2>
        <ul className="divide-y divide-line">
          {menu.map((r, i) => (
            <li key={r.id} className="relative flex items-center gap-3 py-3">
              <button type="button" onClick={() => onOpenRecipe(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-bg text-accent-mark" aria-hidden>
                  <DishIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-accent-text">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-mark" aria-hidden />
                    {dayLabel(days[i], c.dates)}
                  </p>
                  <p className="line-clamp-2 text-[15px] font-bold">{r.name}</p>
                  <p className="text-xs text-sub">
                    1인분 약 {won(perServingCost(r, homeOf(c), priceOf))} · 단백질 {r.nutrition.proteinG}g · {r.nutrition.kcal}kcal
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-sub">
                      {FLAVOR_LABEL[r.flavor]} · {METHOD_LABEL[r.method]}
                    </span>
                    {r.storage.freezable && <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-semibold text-accent-text">냉동 가능</span>}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => swap(i)}
                disabled={candidates.length <= menu.length}
                className="mt-4 shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold disabled:opacity-30"
              >
                교체
              </button>
              {/* B10 다시 안 보기, B3 삭제는 … 메뉴로 */}
              <button
                type="button"
                onClick={() => setMoreOpen(moreOpen === i ? null : i)}
                aria-label={`${r.name} 더 보기`}
                aria-expanded={moreOpen === i}
                className="absolute top-1 right-0 flex h-8 w-8 items-center justify-center text-sub"
              >
                …
              </button>
              {moreOpen === i && (
                <div className="absolute top-9 right-0 z-10 flex flex-col rounded-xl border border-line bg-surface py-1 text-sm shadow-float">
                  {/* 바꿀 후보도 없고 뺄 수도 없으면 다시 안 볼 메뉴가 남으므로 숨긴다 */}
                  {(candidates.length > menu.length || menu.length > config.menuCount.min) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(null)
                        hide(i)
                      }}
                      className="px-4 py-2 text-left"
                    >
                      다시 안 보기
                    </button>
                  )}
                  {menu.length > config.menuCount.min && (
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(null)
                        remove(i)
                      }}
                      className="px-4 py-2 text-left"
                    >
                      메뉴에서 빼기
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => setMenu(addMenu(menu, candidates, homeOf(c), Math.random, menuSpread(c.proteins, menu.length + 1)))}
        disabled={menu.length >= limit}
        className="rounded-xl border border-dashed border-line py-3 text-sm disabled:opacity-40"
      >
        메뉴 추가 ({menu.length}/{config.menuCount.max})
      </button>

      {shared.length > 0 && (
        <p className="text-sm text-sub">겹치는 재료: {shared.map((id) => ingredients[id].name).join(', ')}</p>
      )}
      <p className="text-xs text-sub">메뉴를 누르면 레시피를 볼 수 있어요. 모든 메뉴는 밥을 포함해 한 끼 {config.maxKcalPerMeal}kcal 이하 기준이고, 칼로리는 1인 기준 추정치예요.</p>

      {suggestion && !dismissed.includes(suggestionKey) && (
        <section className="rounded-xl border border-ink p-4">
          <p className="text-sm font-semibold">이 레시피는 어떤가요?</p>
          <button type="button" onClick={() => onOpenRecipe(suggestion.recipe)} className="mt-2 text-left">
            <p className="font-semibold underline underline-offset-4">{suggestion.recipe.name}</p>
            <p className="text-xs text-sub">
              {FLAVOR_LABEL[suggestion.recipe.flavor]} · {METHOD_LABEL[suggestion.recipe.method]}
            </p>
          </button>
          {suggestion.leftovers.length > 0 && (
            <p className="mt-1 text-sm text-sub">
              남는 {suggestion.leftovers.map((l) => `${l.name} ${l.amount.toLocaleString('ko-KR')}${l.unit}`).join(', ')}을 써요
            </p>
          )}
          <p className="text-sm text-sub">
            {suggestion.extraCost > 0 ? `추가 예상 금액 약 ${won(suggestion.extraCost)}` : '예상 금액이 늘지 않아요'}
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setMenu([...menu, suggestion.recipe])} className="flex-1 rounded-lg bg-ink py-2 text-sm font-semibold text-white">
              메뉴에 추가
            </button>
            <button type="button" onClick={() => setDismissed([...dismissed, suggestionKey])} className="rounded-lg border border-line px-4 py-2 text-sm">
              괜찮아요
            </button>
          </div>
        </section>
      )}

      <div className={`sticky ${ABOVE_NAV} mt-auto`}>
        <button type="button" onClick={onConfirm} className={`${primaryButton} shadow-float`}>
          메뉴 확정하고 장보기 목록 보기
        </button>
      </div>
    </main>
  )
}

// B14 사진 자리의 단색 접시 아이콘(사진이 생기기 전까지)
function DishIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 13h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M9 9.5c0-1.2 1-1.5 1-2.7M13 9.5c0-1.2 1-1.5 1-2.7" />
    </svg>
  )
}
