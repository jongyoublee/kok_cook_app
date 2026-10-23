// 이번 주 조건 화면 (와이어프레임 1-1): A2 식사 날짜, A3 끼니 수, A4 메뉴 개수.
// 인원·식단·안 먹는 단백질·집에 있는 양념은 내 설정(SetupScreen)에서 받고 여기서는 요약만 보여준다.
// 예산 입력(A7)은 6단계에서 추가한다
import { useState } from 'react'
import CalendarSheet from '../components/CalendarSheet'
import { config } from '../config'
import { mealCount, PROTEIN_OPTIONS, type Conditions } from '../conditions'
import { cookDay, formatDay, nextWeek, type ISODate } from '../lib/dates'
import { ADVICE, chip, primaryButton } from '../ui'

type Props = {
  today: ISODate
  initial: Conditions
  onEditProfile: (c: Conditions) => void
  onSubmit: (c: Conditions) => void
}

const sameDates = (a: ISODate[], b: ISODate[]) => a.join() === b.join()

function dateLabel(dates: ISODate[], today: ISODate) {
  if (sameDates(dates, nextWeek(today, true))) return '다음 주 평일'
  if (sameDates(dates, nextWeek(today, false))) return '다음 주 매일'
  return `${dates.length}일 선택`
}

function profileSummary(c: Conditions) {
  const excluded = PROTEIN_OPTIONS.filter((o) => o.sources.every((s) => c.excludeProteins.includes(s))).map((o) => o.label)
  return [
    `${c.people}명`,
    `${c.diet === 'korean' ? '한식' : '고단백'} · 한 끼 ${c.maxKcal}kcal 이하`,
    excluded.length ? `${excluded.join('·')} 빼고` : '단백질 다 먹어요',
    `집에 있는 양념 ${c.pantry.length}개`,
  ]
}

export default function InputScreen({ today, initial, onEditProfile, onSubmit }: Props) {
  const [c, setC] = useState(initial)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const set = (patch: Partial<Conditions>) => setC((cur) => ({ ...cur, ...patch }))
  const { dates } = c
  const cook = cookDay(dates)!

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-xl font-bold">이번 식단 조건</h1>

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

      <section>
        <h2 className="mb-2 font-semibold">메뉴 개수</h2>
        <div className="flex gap-2">
          {Array.from({ length: config.menuCount.max - config.menuCount.min + 1 }, (_, i) => config.menuCount.min + i).map((n) => (
            <button key={n} type="button" aria-pressed={c.menuCount === n} onClick={() => set({ menuCount: n })} className={`${chip(c.menuCount === n)} flex-1`}>
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">내 설정</h2>
          <button type="button" onClick={() => onEditProfile(c)} className="text-sm text-emerald-700 underline">변경</button>
        </div>
        <ul className="mt-1 text-sm text-gray-600">
          {profileSummary(c).map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <p className="text-xs text-gray-500">{ADVICE}</p>
        <button type="button" onClick={() => onSubmit(c)} className={primaryButton}>
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
