// 이번 식단 조건 화면 (와이어프레임 1-1). 처음 설정 이후에는 이 화면에서 모든 조건을 바로 고친다:
// A12 집에 있는 재료(맨 위, 매주 고친다), A2·A3 먹을 날짜, A1 인원, A8 단백질, A10 탄수화물, A9 양념.
// A4 메뉴 개수는 메뉴 화면에서 추가·삭제로 조절한다. A7 예산은 버전 A일 때만 여기서 받는다.
// I8 두 곳에서 쓴다: 다음 주 탭(날짜와 '메뉴 만들기')과 내 설정 탭(onChange가 있으면 날짜 없이 바로 저장)
import { useState, type ReactNode } from 'react'
import CalendarSheet from '../components/CalendarSheet'
import { BudgetField, CarbField, OwnedField, PantryField, PeopleField, ProteinField } from '../components/fields'
import { budgetVersion } from '../lib/budget'
import { mealCount, type Conditions } from '../conditions'
import { cookDay, formatDay, nextWeek, type ISODate } from '../lib/dates'
import { filterCandidates, hintText, widenHints } from '../lib/menu'
import { ABOVE_NAV, ADVICE, primaryButton } from '../ui'

type Props = {
  header?: ReactNode
  today: ISODate
  initial: Conditions
  onSubmit?: (c: Conditions) => void
  onChange?: (c: Conditions) => void // 내 설정: 고칠 때마다 저장
  onReset: () => void // I6 내 데이터 지우기
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

export default function InputScreen({ header, today, initial, onSubmit, onChange, onReset }: Props) {
  const [c, setC] = useState(initial)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const set = (patch: Partial<Conditions>) => {
    const next = { ...c, ...patch }
    setC(next)
    onChange?.(next)
  }
  const settings = !!onChange
  const { dates } = c
  const candidates = filterCandidates(c).length
  const hints = candidates < c.menuCount ? widenHints(c) : []
  const missing = !c.proteins.length ? '단백질을 1개 이상 골라 주세요' : !c.carbs.length ? '탄수화물을 1개 이상 골라 주세요' : !candidates ? '조건에 맞는 메뉴가 없어요' : ''

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-surface px-5 pt-6">
      {header}
      <h1 className="text-[26px] font-bold">{settings ? '내 설정' : '다음 주 식단 조건'}</h1>

      <Section title="집에 있는 재료">
        <OwnedField c={c} set={set} suggest />
      </Section>

      {!settings && (
        <Section title="먹을 날짜">
          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <div>
              <p className="font-semibold">
                {formatDay(dates[0])} ~ {formatDay(dates[dates.length - 1])}
              </p>
              <p className="text-sm text-sub">
                {dateLabel(dates, today)}, 저녁 {mealCount(c)}끼
              </p>
            </div>
            <button type="button" onClick={() => setCalendarOpen(true)} className="rounded-lg border border-line px-3 py-2 text-sm">
              달력
            </button>
          </div>
          <p className="mt-2 text-sm text-sub">조리일은 {formatDay(cookDay(dates)!)}로 가정해요</p>
        </Section>
      )}

      <Section title="인원">
        <PeopleField c={c} set={set} />
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

      {budgetVersion() === 'A' && (
        <Section title="예산">
          <BudgetField c={c} set={set} />
        </Section>
      )}

      {/* B10 다시 안 보기로 뺀 메뉴 되돌리기 */}
      {c.hidden.length > 0 && (
        <p className="text-center text-sm text-sub">
          다시 안 보기로 뺀 메뉴 {c.hidden.length}개 ·{' '}
          <button type="button" onClick={() => set({ hidden: [] })} className="underline underline-offset-4">
            모두 되돌리기
          </button>
        </p>
      )}

      {/* I6 */}
      {settings && (
        <button
          type="button"
          onClick={() => window.confirm('조건, 메뉴, 구매 체크를 모두 지우고 처음 설정부터 다시 할까요?') && onReset()}
          className="self-center text-sm text-sub underline underline-offset-4"
        >
          내 데이터 지우기
        </button>
      )}

      {settings && <p className="text-center text-xs text-sub">{ADVICE}</p>}

      {onSubmit && (
        <div className={`sticky ${ABOVE_NAV} -mx-5 flex flex-col gap-2 border-t border-line bg-surface px-5 py-3`}>
          <p className="text-center text-sm text-sub">{missing || `조건에 맞는 메뉴 ${candidates}개`}</p>
          {/* A11 원하는 메뉴 수보다 후보가 적으면 무엇을 더 고르면 되는지 */}
          {c.proteins.length > 0 && c.carbs.length > 0 && candidates < c.menuCount && hints.length > 0 && (
            <p className="text-center text-sm font-medium text-ink">{hintText(hints)}</p>
          )}
          <button type="button" onClick={() => onSubmit(c)} disabled={!!missing} className={primaryButton}>
            메뉴 만들기
          </button>
          <p className="text-center text-xs text-sub">{ADVICE}</p>
        </div>
      )}

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
