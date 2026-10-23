// A2 식사 날짜 선택 시트 (와이어프레임 1-2)
import { useEffect, useRef, useState } from 'react'
import { config } from '../config'
import { addDays, canSelect, cookDay, mondayIndex, nextWeek, toISO, type ISODate } from '../lib/dates'

type Props = {
  open: boolean
  today: ISODate
  selected: ISODate[]
  onClose: () => void
  onDone: (dates: ISODate[]) => void
}

const monthStart = (s: ISODate) => s.slice(0, 8) + '01'
const shiftMonth = (s: ISODate, n: number) => {
  const [y, m] = s.split('-').map(Number)
  return toISO(new Date(y, m - 1 + n, 1))
}

export default function CalendarSheet({ open, today, selected, onClose, onDone }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(selected)
  const [month, setMonth] = useState(monthStart(selected[0] ?? today))

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) {
      setDraft(selected)
      setMonth(monthStart(selected[0] ?? today))
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  }, [open, selected, today])

  const toggle = (d: ISODate) =>
    setDraft((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))

  // 월요일 시작 달력. 앞쪽 빈칸 + 그 달 날짜
  const days: (ISODate | null)[] = Array(mondayIndex(month)).fill(null)
  for (let d = month; d.slice(0, 7) === month.slice(0, 7); d = addDays(d, 1)) days.push(d)
  const cook = cookDay(draft)
  const [year, mon] = month.split('-').map(Number)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-2xl bg-white p-4 backdrop:bg-black/40"
      aria-labelledby="calendar-title"
    >
      <div className="flex items-center justify-between">
        <h2 id="calendar-title" className="text-lg font-bold">먹을 날짜 선택</h2>
        <button type="button" onClick={onClose} className="p-2 text-gray-500" aria-label="닫기">✕</button>
      </div>

      <div className="mt-2 flex gap-2 text-sm">
        <button type="button" className="rounded-full border px-3 py-1" onClick={() => setDraft(nextWeek(today, true))}>다음 주 평일</button>
        <button type="button" className="rounded-full border px-3 py-1" onClick={() => setDraft(nextWeek(today, false))}>다음 주 매일</button>
        <button type="button" className="rounded-full border px-3 py-1" onClick={() => setDraft([])}>선택 해제</button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" className="p-2 disabled:opacity-30" disabled={month <= monthStart(today)} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="이전 달">‹</button>
        <span className="font-semibold">{year}년 {mon}월</span>
        <button type="button" className="p-2" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="다음 달">›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {'월화수목금토일'.split('').map((w) => <div key={w} className="py-1 text-gray-500">{w}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={i} />
          const on = draft.includes(d)
          const enabled = canSelect(d, draft, today)
          return (
            <button
              key={d}
              type="button"
              disabled={!enabled}
              aria-pressed={on}
              onClick={() => toggle(d)}
              className={`m-0.5 flex h-11 flex-col items-center justify-center rounded-lg ${on ? 'bg-emerald-600 text-white' : ''} ${d === today ? 'ring-1 ring-emerald-600' : ''} disabled:text-gray-300`}
            >
              <span>{Number(d.slice(8))}</span>
              {d === cook && <span className={`text-[10px] leading-none ${on ? '' : 'text-orange-600'}`}>조리</span>}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {draft.length}일 선택, 최대 {config.maxSelectDays}일
      </p>
      <button
        type="button"
        disabled={!draft.length}
        onClick={() => onDone(draft)}
        className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:bg-gray-300"
      >
        선택 완료
      </button>
    </dialog>
  )
}
