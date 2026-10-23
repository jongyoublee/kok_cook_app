// 이번 식단 조건 화면 (와이어프레임 1-1). 처음 설정 이후에는 이 화면에서 모든 조건을 바로 고친다:
// A2·A3 먹을 날짜, A1 인원, A5·A6 식단, A8 단백질, A10 탄수화물, A9 양념.
// A4 메뉴 개수는 메뉴 화면에서 추가·삭제로 조절하고, 예산 입력(A7)은 6단계에서 추가한다
import { useState, type ReactNode } from 'react'
import CalendarSheet from '../components/CalendarSheet'
import { CarbField, DietField, PantryField, PeopleField, ProteinField } from '../components/fields'
import { mealCount, type Conditions } from '../conditions'
import { cookDay, formatDay, nextWeek, type ISODate } from '../lib/dates'
import { filterCandidates } from '../lib/menu'
import { ADVICE, primaryButton } from '../ui'

type Props = {
  today: ISODate
  initial: Conditions
  onSubmit: (c: Conditions) => void
}

const sameDates = (a: ISODate[], b: ISODate[]) => a.join() === b.join()

function dateLabel(dates: ISODate[], today: ISODate) {
  if (sameDates(dates, nextWeek(today, true))) return '다음 주 평일'
  if (sameDates(dates, nextWeek(today, false))) return '다음 주 매일'
  return `${dates.length}일 선택`
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function InputScreen({ today, initial, onSubmit }: Props) {
  const [c, setC] = useState(initial)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const set = (patch: Partial<Conditions>) => setC((cur) => ({ ...cur, ...patch }))
  const { dates } = c
  const candidates = filterCandidates(c).length
  const missing = !c.proteins.length ? '단백질을 1개 이상 골라 주세요' : !c.carbs.length ? '탄수화물을 1개 이상 골라 주세요' : !candidates ? '조건에 맞는 메뉴가 없어요' : ''

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-white px-5 pt-6">
      <h1 className="text-[26px] font-bold">이번 식단 조건</h1>

      <Section title="먹을 날짜">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <div>
            <p className="font-semibold">
              {formatDay(dates[0])} ~ {formatDay(dates[dates.length - 1])}
            </p>
            <p className="text-sm text-gray-500">
              {dateLabel(dates, today)}, 저녁 {mealCount(c)}끼
            </p>
          </div>
          <button type="button" onClick={() => setCalendarOpen(true)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            달력
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">조리일은 {formatDay(cookDay(dates)!)}로 가정해요</p>
      </Section>

      <Section title="인원">
        <PeopleField c={c} set={set} />
      </Section>

      <Section title="식단">
        <DietField c={c} set={set} />
        <p className="mt-2 text-sm text-gray-500">한 끼 {c.maxKcal}kcal 이하 메뉴로 골라요.</p>
      </Section>

      <Section title="먹고 싶은 단백질">
        <ProteinField c={c} set={set} />
      </Section>

      <Section title="함께 먹을 탄수화물">
        <CarbField c={c} set={set} />
      </Section>

      <Section title="집에 있는 양념">
        <PantryField c={c} set={set} />
      </Section>

      <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-gray-100 bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-sm text-gray-500">{missing || `조건에 맞는 메뉴 ${candidates}개`}</p>
        <button type="button" onClick={() => onSubmit(c)} disabled={!!missing} className={primaryButton}>
          메뉴 만들기
        </button>
        <p className="text-center text-xs text-gray-400">{ADVICE}</p>
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
