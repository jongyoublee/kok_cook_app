// I8 떠 있는 하단 메뉴(docs/design.md 3절). 선택된 탭만 검정 알약에 아이콘과 이름, 나머지는 아이콘만.
// 아이콘은 직접 그린 단색 선 SVG(24 viewBox, 선 1.8)
import type { ReactNode } from 'react'

export type Tab = 'week' | 'shopping' | 'storage' | 'settings'

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)

const TABS: { tab: Tab; label: string; icon: ReactNode }[] = [
  {
    tab: 'week',
    label: '이번 주',
    icon: (
      <Icon>
        <rect x="4" y="5" width="16" height="15" rx="2.5" />
        <path d="M4 10h16M8.5 3v4M15.5 3v4" />
      </Icon>
    ),
  },
  {
    tab: 'shopping',
    label: '장보기',
    icon: (
      <Icon>
        <path d="M3.5 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h7.6a1.5 1.5 0 0 0 1.5-1.1L20 8H6.6" />
        <circle cx="10" cy="19.5" r="1.2" />
        <circle cx="17" cy="19.5" r="1.2" />
      </Icon>
    ),
  },
  {
    tab: 'storage',
    label: '보관',
    icon: (
      <Icon>
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
      </Icon>
    ),
  },
  {
    tab: 'settings',
    label: '내 설정',
    icon: (
      <Icon>
        <circle cx="12" cy="8.5" r="3.8" />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
      </Icon>
    ),
  },
]

export default function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-[calc(14px+env(safe-area-inset-bottom))] z-20 mx-auto flex h-[52px] w-[calc(100%-28px)] max-w-[420px] items-center justify-between rounded-full bg-white/92 p-1.5 shadow-float backdrop-blur-md"
    >
      {TABS.map((t) => {
        const on = t.tab === tab
        return (
          <button
            key={t.tab}
            type="button"
            onClick={() => onChange(t.tab)}
            aria-label={t.label}
            aria-current={on ? 'page' : undefined}
            className={`flex h-10 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold ${on ? 'bg-ink text-white' : 'text-sub'}`}
          >
            {t.icon}
            {on && <span>{t.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
