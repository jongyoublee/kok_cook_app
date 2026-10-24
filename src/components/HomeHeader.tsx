// B13 홈 머리: 가로형 로고(I9)와 [이번 주 | 다음 주] 탭, 고른 계획의 날짜 범위
import { formatDay, type ISODate } from '../lib/dates'
import Logo from './Logo'

export type View = 'this' | 'next'

export default function HomeHeader({ view, onView, dates }: { view: View; onView: (v: View) => void; dates?: ISODate[] }) {
  return (
    <header className="flex flex-col gap-3">
      <Logo />
      <div className="flex items-center gap-2" role="tablist">
        {(
          [
            ['this', '이번 주'],
            ['next', '다음 주'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => onView(v)}
            className={`rounded-full px-4 py-1.5 text-sm ${view === v ? 'border-2 border-ink font-bold' : 'border border-line text-sub'}`}
          >
            {label}
          </button>
        ))}
        {dates && dates.length > 0 && (
          <span className="ml-auto text-sm text-sub">
            {formatDay(dates[0])} ~ {formatDay(dates[dates.length - 1])}
          </span>
        )}
      </div>
    </header>
  )
}
