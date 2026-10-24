// B13 이번 주: 먹기 시작한 계획을 읽기 전용으로 보여 준다. 메뉴는 바꾸지 않고, 외식하는 날은 보관 탭의 '안 먹어요'(B9)로 뺀다
import type { ReactNode } from 'react'
import type { Recipe } from '../data/recipes'
import { dayLabel } from '../lib/dates'
import { assignDays } from '../lib/menu'
import type { Plan } from '../plan'

type Props = {
  header: ReactNode
  plan: Plan | null
  onOpenRecipe: (r: Recipe) => void
  onPlanNext: () => void
}

export default function ThisWeekScreen({ header, plan, onOpenRecipe, onPlanNext }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-surface px-5 pt-4">
      {header}
      {!plan ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="font-semibold">이번 주에 먹는 계획이 없어요</p>
          <p className="text-sm text-sub">다음 주 메뉴를 만들면 먹는 날부터 여기에 보여요.</p>
          <button type="button" onClick={onPlanNext} className="rounded-xl bg-ink px-5 py-3 font-semibold text-white">
            다음 주 메뉴 만들기
          </button>
        </section>
      ) : (
        <>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {plan.menu.map((r, i) => {
              const days = assignDays(plan.menu, plan.dates)[i].filter((d) => !plan.skipped.includes(d))
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => onOpenRecipe(r)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <div className="h-14 w-14 shrink-0 rounded-xl bg-bg" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-sub">{days.length ? dayLabel(days, plan.dates) : '안 먹어요'}</p>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-sub">
                        단백질 {r.nutrition.proteinG}g · {r.nutrition.kcal}kcal
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="text-sm text-sub">먹기 시작한 계획은 메뉴를 바꾸지 않아요. 외식하는 날은 보관 탭에서 '안 먹어요'를 눌러 주세요.</p>
        </>
      )}
    </main>
  )
}
