// B1~B3 추천 메뉴 화면 (와이어프레임 2). 메뉴는 App이 들고 있어 레시피 상세에 다녀와도 유지된다.
// 예상 금액 막대는 버전 A면 예산과 비교한다
import { useMemo, useState } from 'react'
import { config } from '../config'
import { mealCount, type Conditions } from '../conditions'
import { ingredients } from '../data/ingredients'
import { formatDay, fromISO, type ISODate } from '../lib/dates'
import { FLAVOR_LABEL, METHOD_LABEL, type Recipe } from '../data/recipes'
import { addMenu, assignDays, filterCandidates, maxMenus, sharedIngredients, swapMenu } from '../lib/menu'
import { CostBar } from '../components/fields'
import { budgetVersion, menuCost } from '../lib/budget'
import { summarizeMenu } from '../lib/nutrition'
import { servingsOf } from '../lib/shopping'
import { primaryButton } from '../ui'

type Props = {
  conditions: Conditions
  menu: Recipe[]
  onChange: (menu: Recipe[]) => void
  onOpenRecipe: (r: Recipe) => void
  onConfirm: () => void
  onBack: () => void
}

// 한 주 안이면 요일만, 넘어가면 날짜까지 표시
function dayLabel(days: ISODate[], all: ISODate[]) {
  const oneWeek = fromISO(all[all.length - 1]).getTime() - fromISO(all[0]).getTime() < 7 * 86_400_000
  return days.map((d) => (oneWeek ? '일월화수목금토'[fromISO(d).getDay()] : formatDay(d))).join(', ')
}

export default function MenuScreen({ conditions: c, menu, onChange: setMenu, onOpenRecipe, onConfirm, onBack }: Props) {
  const candidates = useMemo(() => filterCandidates(c), [c])
  const limit = maxMenus(c, candidates)
  const [shown, setShown] = useState<string[][]>([])

  if (!menu.length)
    return (
      <main className="mx-auto max-w-md p-4">
        <p>조건에 맞는 메뉴가 없어요. 조건을 바꿔 보세요.</p>
        <button type="button" className="mt-4 underline" onClick={onBack}>조건으로 돌아가기</button>
      </main>
    )

  const days = assignDays(menu, c.dates)
  const shared = sharedIngredients(menu)
  // A6 1인 기준 칼로리 요약. 메뉴별 1인 끼니 수 = 만들 인분 ÷ 인원
  const kcal = summarizeMenu(menu, servingsOf(menu, c).map((n) => n / c.people))

  const swap = (i: number) => {
    const r = swapMenu(menu, i, candidates, shown[i] ?? [], c.pantry)
    setMenu(r.menu)
    setShown((s) => Object.assign([...s], { [i]: r.shown }))
  }

  // B3 메뉴 삭제. 최소 개수 아래로는 줄이지 않는다
  const remove = (i: number) => {
    setMenu(menu.filter((_, j) => j !== i))
    setShown((s) => s.filter((_, j) => j !== i))
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="p-1 text-xl" aria-label="조건으로 돌아가기">‹</button>
        <h1 className="text-xl font-bold">다음 주 메뉴</h1>
      </div>
      <p className="-mt-2 text-sm text-gray-500">
        저녁 {mealCount(c)}끼, {c.people}명
      </p>
      {limit < c.menuCount && (
        <p className="text-sm font-medium text-black">조건에 맞게 만들 수 있는 메뉴가 {limit}개라 {limit}개로 구성했어요.</p>
      )}

      <ul className="flex flex-col gap-3">
        {menu.map((r, i) => (
          <li key={r.id} className="relative flex gap-3 rounded-xl border border-gray-200 p-3 pr-9">
            <button type="button" onClick={() => onOpenRecipe(r)} className="flex min-w-0 flex-1 gap-3 text-left">
              <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-semibold underline-offset-4 hover:underline">{r.name}</p>
                <p className="text-xs text-gray-400">
                  {FLAVOR_LABEL[r.flavor]} · {METHOD_LABEL[r.method]}
                </p>
                <p className="text-sm text-gray-600">
                  단백질 {r.nutrition.proteinG}g, {r.nutrition.kcal}kcal
                </p>
                <p className="text-sm text-gray-600">
                  {dayLabel(days[i], c.dates)} {days[i].length}끼
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => swap(i)}
              disabled={candidates.length <= menu.length}
              className="self-center rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-30"
            >
              교체
            </button>
            {menu.length > config.menuCount.min && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`${r.name} 삭제`}
                className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center text-gray-400"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setMenu(addMenu(menu, candidates, c.pantry))}
        disabled={menu.length >= limit}
        className="rounded-xl border border-dashed border-gray-300 py-3 text-sm disabled:opacity-40"
      >
        메뉴 추가 ({menu.length}/{config.menuCount.max})
      </button>

      {/* D4, F1 예상 금액 */}
      <CostBar cost={menuCost(menu, c)} budget={budgetVersion() === 'A' && !c.cheapest ? c.budget : undefined} />

      {/* A6 칼로리 요약 (추정치) */}
      <section className="rounded-xl border border-gray-200 px-4 py-3">
        <p className="font-semibold">
          저녁 {kcal.meals}끼 · 한 끼 평균 약 {kcal.avgKcal.toLocaleString('ko-KR')}kcal · 단백질 {kcal.avgProteinG}g
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {kcal.meals}끼 합계 약 {kcal.totalKcal.toLocaleString('ko-KR')}kcal · 1인 기준 추정치
        </p>
        <p className="mt-1 text-xs text-gray-400">모든 메뉴는 밥을 포함해 한 끼 {config.maxKcalPerMeal}kcal 이하 기준으로 만들었어요.</p>
      </section>

      {shared.length > 0 && (
        <p className="text-sm text-gray-600">겹치는 재료: {shared.map((id) => ingredients[id].name).join(', ')}</p>
      )}

      <p className="text-sm text-gray-500">메뉴를 누르면 레시피를 볼 수 있어요.</p>

      <div className="mt-auto">
        <button type="button" onClick={onConfirm} className={primaryButton}>
          메뉴 확정하고 장보기 목록 보기
        </button>
      </div>
    </main>
  )
}
