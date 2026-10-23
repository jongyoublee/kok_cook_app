// A1~A6 조건 입력 화면 (와이어프레임 1-1). 예산 입력(A7)은 6단계에서 추가한다
import { useState } from 'react'
import CalendarSheet from '../components/CalendarSheet'
import { config } from '../config'
import { mealCount, type Conditions, type Diet } from '../conditions'
import { cookDay, formatDay, nextWeek, type ISODate } from '../lib/dates'

type Props = {
  today: ISODate
  initial: Conditions
  restored: boolean
  onSubmit: (c: Conditions) => void
}

const sameDates = (a: ISODate[], b: ISODate[]) => a.join() === b.join()

function dateLabel(dates: ISODate[], today: ISODate) {
  if (sameDates(dates, nextWeek(today, true))) return '다음 주 평일'
  if (sameDates(dates, nextWeek(today, false))) return '다음 주 매일'
  return `${dates.length}일 선택`
}

const chip = (on: boolean) =>
  `flex-1 rounded-xl border py-2 ${on ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-700' : 'border-gray-300'}`

export default function InputScreen({ today, initial, restored, onSubmit }: Props) {
  const [c, setC] = useState(initial)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const set = (patch: Partial<Conditions>) => setC((cur) => ({ ...cur, ...patch }))
  const { dates } = c
  const cook = cookDay(dates)!

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-xl font-bold">이번 식단 조건</h1>
      {restored && <p className="-mt-4 text-sm text-gray-500">지난번 조건을 불러왔어요</p>}

      <section>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="font-semibold">
              {formatDay(dates[0])} ~ {formatDay(dates[dates.length - 1])}
            </p>
            <p className="text-sm text-gray-600">
              {dateLabel(dates, today)}, 저녁 {mealCount(c)}끼
            </p>
          </div>
          <button type="button" onClick={() => setCalendarOpen(true)} className="rounded-lg border px-3 py-2 text-sm">
            달력
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">조리일은 {formatDay(cook)}로 가정해요</p>
      </section>

      <section className="flex items-center justify-between">
        <h2 className="font-semibold">인원</h2>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="인원 줄이기" disabled={c.people <= 1} onClick={() => set({ people: c.people - 1 })} className="h-10 w-10 rounded-full border disabled:opacity-30">−</button>
          <span className="w-10 text-center">{c.people}명</span>
          <button type="button" aria-label="인원 늘리기" onClick={() => set({ people: c.people + 1 })} className="h-10 w-10 rounded-full border">+</button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">메뉴 개수</h2>
        <div className="flex gap-2">
          {Array.from({ length: config.menuCount.max - config.menuCount.min + 1 }, (_, i) => config.menuCount.min + i).map((n) => (
            <button key={n} type="button" aria-pressed={c.menuCount === n} onClick={() => set({ menuCount: n })} className={chip(c.menuCount === n)}>
              {n}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">식단</h2>
        <div className="flex gap-2">
          {([['korean', '한식'], ['highProtein', '고단백']] as [Diet, string][]).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={c.diet === v} onClick={() => set({ diet: v })} className={chip(c.diet === v)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* A6 선택 구간 값은 미결이라 고정값만 표시한다 */}
      <section className="flex items-center justify-between">
        <h2 className="font-semibold">칼로리</h2>
        <span>한 끼 {c.maxKcal}kcal 이하</span>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        {/* I3 */}
        <p className="text-xs text-gray-500">질환이 있거나 식사 제한이 필요하면 전문가와 상담하세요.</p>
        <button type="button" onClick={() => onSubmit(c)} className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white">
          메뉴 만들기
        </button>
      </div>

      <CalendarSheet
        open={calendarOpen}
        today={today}
        selected={dates}
        onClose={() => setCalendarOpen(false)}
        onDone={(d) => {
          set({ dates: d })
          setCalendarOpen(false)
        }}
      />
    </main>
  )
}
