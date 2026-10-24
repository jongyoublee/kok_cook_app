// A2 식사 날짜 선택 시트 (와이어프레임 1-2). 선택 완료를 눌러야 반영한다
import { useEffect, useRef, useState } from 'react'
import type { ISODate } from '../lib/dates'
import { primaryButton } from '../ui'
import Calendar from './Calendar'

type Props = {
  open: boolean
  today: ISODate
  selected: ISODate[]
  onClose: () => void
  onDone: (dates: ISODate[]) => void
}

export default function CalendarSheet({ open, today, selected, onClose, onDone }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(selected)

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) {
      setDraft(selected)
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  }, [open, selected])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-2xl bg-surface p-5 backdrop:bg-ink/40"
      aria-labelledby="calendar-title"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="calendar-title" className="text-lg font-bold">먹을 날짜 선택</h2>
        <button type="button" onClick={onClose} className="p-2 text-sub" aria-label="닫기">✕</button>
      </div>
      {/* 열 때마다 새로 그려 표시 월을 선택한 날짜에 맞춘다 */}
      {open && <Calendar today={today} selected={draft} onChange={setDraft} />}
      <button type="button" disabled={!draft.length} onClick={() => onDone(draft)} className={`${primaryButton} mt-4`}>
        선택 완료
      </button>
    </dialog>
  )
}
