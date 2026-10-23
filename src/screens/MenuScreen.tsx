// B1~B3 추천 메뉴 화면 (와이어프레임 2). 예상 금액 막대는 4단계, 예산 안 조합(F1)은 6단계에서 추가한다
import { useMemo, useState } from 'react'
import { config } from '../config'
import { mealCount, type Conditions } from '../conditions'
import { ingredients } from '../data/ingredients'
import { formatDay, fromISO, type ISODate } from '../lib/dates'
import { addMenu, assignDays, buildMenu, filterCandidates, maxMenus, sharedIngredients, swapMenu } from '../lib/menu'

type Props = {
  conditions: Conditions
  onBack: () => void
}

// 한 주 안이면 요일만, 넘어가면 날짜까지 표시
function dayLabel(days: ISODate[], all: ISODate[]) {
  const oneWeek = fromISO(all[all.length - 1]).getTime() - fromISO(all[0]).getTime() < 7 * 86_400_000
  return days.map((d) => (oneWeek ? '일월화수목금토'[fromISO(d).getDay()] : formatDay(d))).join(', ')
}

export default function MenuScreen({ conditions: c, onBack }: Props) {
  const candidates = useMemo(() => filterCandidates(c), [c])
  const limit = maxMenus(c, candidates)
  const [menu, setMenu] = useState(() => buildMenu(candidates, Math.min(c.menuCount, limit)))
  const [shown, setShown] = useState<string[][]>([])
  const [confirmed, setConfirmed] = useState(false)

  if (!menu.length)
    return (
      <main className="mx-auto max-w-md p-4">
        <p>조건에 맞는 메뉴가 없어요. 조건을 바꿔 보세요.</p>
        <button type="button" className="mt-4 underline" onClick={onBack}>조건으로 돌아가기</button>
      </main>
    )

  const days = assignDays(menu, c.dates)
  const shared = sharedIngredients(menu)

  const swap = (i: number) => {
    const r = swapMenu(menu, i, candidates, shown[i] ?? [])
    setMenu(r.menu)
    setShown((s) => Object.assign([...s], { [i]: r.shown }))
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

      <ul className="flex flex-col gap-3">
        {menu.map((r, i) => (
          <li key={r.id} className="flex gap-3 rounded-xl border p-3">
            <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-gray-600">
                단백질 {r.nutrition.proteinG}g, {r.nutrition.kcal}kcal
              </p>
              <p className="text-sm text-gray-600">
                {dayLabel(days[i], c.dates)} {days[i].length}끼
              </p>
            </div>
            <button
              type="button"
              onClick={() => swap(i)}
              disabled={candidates.length <= menu.length}
              className="self-center rounded-lg border px-3 py-2 text-sm disabled:opacity-30"
            >
              교체
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setMenu(addMenu(menu, candidates))}
        disabled={menu.length >= limit}
        className="rounded-xl border border-dashed py-3 text-sm disabled:opacity-40"
      >
        메뉴 추가 ({menu.length}/{config.menuCount.max})
      </button>

      {shared.length > 0 && (
        <p className="text-sm text-gray-600">겹치는 재료: {shared.map((id) => ingredients[id].name).join(', ')}</p>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {confirmed && <p className="text-center text-sm text-gray-500">레시피와 장보기 목록은 다음 단계에서 준비 중이에요.</p>}
        <button type="button" onClick={() => setConfirmed(true)} className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white">
          메뉴 확정
        </button>
      </div>
    </main>
  )
}
