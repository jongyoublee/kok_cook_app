// A2 식사 날짜 달력. 처음 설정에서는 그대로, 조건 화면에서는 시트(CalendarSheet) 안에서 쓴다
import { useState } from 'react'
import { config } from '../config'
import { addDays, canSelect, cookDay, mondayIndex, nextWeek, toISO, type ISODate } from '../lib/dates'

type Props = {
  today: ISODate
  selected: ISODate[]
  onChange: (dates: ISODate[]) => void
}

const monthStart = (s: ISODate) => s.slice(0, 8) + '01'
const shiftMonth = (s: ISODate, n: number) => {
  const [y, m] = s.split('-').map(Number)
  return toISO(new Date(y, m - 1 + n, 1))
}

export default function Calendar({ today, selected, onChange }: Props) {
  const [month, setMonth] = useState(monthStart(selected[0] ?? today))
  const toggle = (d: ISODate) => onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d].sort())

  // 월요일 시작 달력. 앞쪽 빈칸 + 그 달 날짜
  const days: (ISODate | null)[] = Array(mondayIndex(month)).fill(null)
  for (let d = month; d.slice(0, 7) === month.slice(0, 7); d = addDays(d, 1)) days.push(d)
  const cook = cookDay(selected)
  const [year, mon] = month.split('-').map(Number)
  const quick: [string, ISODate[]][] = [
    ['다음 주 평일', nextWeek(today, true)],
    ['다음 주 매일', nextWeek(today, false)],
    ['선택 해제', []],
  ]

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        {quick.map(([label, dates]) => (
          <button key={label} type="button" className="rounded-lg border border-line bg-surface py-2 text-ink" onClick={() => onChange(dates)}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" className="p-2 disabled:opacity-30" disabled={month <= monthStart(today)} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="이전 달">‹</button>
        <span className="font-semibold">{year}년 {mon}월</span>
        <button type="button" className="p-2" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="다음 달">›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {'월화수목금토일'.split('').map((w) => <div key={w} className="py-1 text-sub">{w}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={i} />
          const on = selected.includes(d)
          return (
            <button
              key={d}
              type="button"
              disabled={!canSelect(d, selected, today)}
              aria-pressed={on}
              onClick={() => toggle(d)}
              className={`m-0.5 flex h-11 flex-col items-center justify-center rounded-lg ${on ? 'bg-ink text-white' : ''} ${d === today ? 'ring-1 ring-ink' : ''} disabled:text-sub/40`}
            >
              <span>{Number(d.slice(8))}</span>
              {d === cook && <span className="text-[10px] leading-none text-sub">조리</span>}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-sm text-sub">
        {selected.length}일 선택, 최대 {config.maxSelectDays}일
      </p>
    </div>
  )
}
