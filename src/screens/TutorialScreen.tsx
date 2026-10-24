// I10 사용법 안내. 넘겨 보는 카드 4장(재료 → 메뉴 → 장보기 → 보관). 처음 실행할 때 처음 설정 앞에 한 번,
// 이후에는 내 설정의 '사용법 보기'로 연다. 그림은 직접 그린 단색 선 SVG, 강조색은 그래픽에만(I7)
import { useRef, useState, type ReactNode } from 'react'
import { config } from '../config'
import { primaryButton } from '../ui'

type Props = { onDone: () => void }

// 48 viewBox 선 그림. 검정 선 위에 강조할 부분만 accent-mark
const Art = ({ children }: { children: ReactNode }) => (
  <svg width="128" height="128" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink" aria-hidden>
    {children}
  </svg>
)
const Mark = ({ children }: { children: ReactNode }) => <g className="text-accent-mark">{children}</g>

const CARDS: { title: string; desc: string; art: ReactNode }[] = [
  {
    title: '집에 있는 재료부터 골라요',
    desc: '고른 재료를 쓰는 메뉴를 먼저 추천해요. 먹을 날짜만 정하면 일주일 저녁 메뉴가 만들어져요.',
    art: (
      <Art>
        <path d="M8 22h32l-3.5 16.5a3 3 0 0 1-2.9 2.5H14.4a3 3 0 0 1-2.9-2.5L8 22z" />
        <path d="M15 22l5-10M33 22l-5-10" />
        <Mark>
          <circle cx="24" cy="31" r="5.5" />
          <path d="M21.5 31l1.8 1.8 3.4-3.6" />
        </Mark>
      </Art>
    ),
  },
  {
    title: '마음에 안 들면 한 번에 바꿔요',
    desc: `메뉴마다 '교체'를 누르면 다른 메뉴로 바뀌어요. 메뉴는 ${config.menuCount.min}~${config.menuCount.max}개까지 늘리고 줄일 수 있어요.`,
    art: (
      <Art>
        <rect x="6" y="9" width="24" height="12" rx="3" />
        <rect x="18" y="27" width="24" height="12" rx="3" />
        <path d="M11 15h8M23 33h8" />
        <Mark>
          <path d="M36 12v8l-3-3M36 20l3-3" />
          <path d="M12 36v-8l3 3M12 28l-3 3" />
        </Mark>
      </Art>
    ),
  },
  {
    title: '장보기 목록은 알아서 계산해요',
    desc: '한 팩 같은 판매 단위로 묶고 예상 금액을 보여 줘요. 재료마다 쿠팡에서 바로 찾아볼 수 있어요.',
    art: (
      <Art>
        <rect x="10" y="6" width="28" height="36" rx="3" />
        <path d="M22 16h10M22 24h10M22 32h10" />
        <Mark>
          <circle cx="16.5" cy="16" r="2.5" />
          <path d="M15.3 16l.9.9 1.6-1.7" />
        </Mark>
        <circle cx="16.5" cy="24" r="2.5" />
        <circle cx="16.5" cy="32" r="2.5" />
      </Art>
    ),
  },
  {
    title: '보관은 날짜에 맞춰 알려 줘요',
    desc: '언제까지 냉장하고 언제부터 냉동할지, 먹기 전날 할 일을 보관 탭에서 확인해요.',
    art: (
      <Art>
        <rect x="4" y="10" width="28" height="28" rx="3" />
        <path d="M4 18h28M11 6v7M25 6v7" />
        <path d="M10 25h4M18 25h4M10 31h4" />
        <Mark>
          <path d="M39 27v14M32.9 30.5l12.2 7M32.9 37.5l12.2-7" />
        </Mark>
      </Art>
    ),
  },
]

export default function TutorialScreen({ onDone }: Props) {
  const [i, setI] = useState(0)
  const startX = useRef<number | null>(null)
  const last = i === CARDS.length - 1
  const go = (n: number) => setI(Math.max(0, Math.min(CARDS.length - 1, n)))
  const { title, desc, art } = CARDS[i]

  return (
    <main
      className="mx-auto flex min-h-dvh max-w-md touch-pan-y flex-col bg-surface px-5 pt-4"
      // 옆으로 밀어 넘긴다
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return
        const dx = e.clientX - startX.current
        startX.current = null
        if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1)
        if (e.key === 'ArrowLeft') go(i - 1)
      }}
    >
      <header className="flex h-10 items-center justify-between">
        <button type="button" onClick={() => go(i - 1)} aria-label="이전" className={`flex h-10 w-10 items-center justify-center rounded-full border border-line text-xl ${i === 0 ? 'invisible' : ''}`}>
          ‹
        </button>
        <button type="button" onClick={onDone} className="px-2 py-2 text-sm text-sub">
          건너뛰기
        </button>
      </header>

      <section key={i} className="screen-in flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center" aria-live="polite" aria-label={`사용법 ${i + 1}/${CARDS.length}`}>
        <div className="flex h-44 w-44 items-center justify-center rounded-full bg-bg">{art}</div>
        <div>
          <h1 className="text-[24px] leading-snug font-bold">{title}</h1>
          <p className="mt-3 text-[15px] text-sub">{desc}</p>
        </div>
      </section>

      <div className="flex flex-col items-center gap-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          {CARDS.map((c, n) => (
            <button
              key={c.title}
              type="button"
              onClick={() => go(n)}
              aria-label={`${n + 1}번째 안내`}
              aria-current={n === i ? 'step' : undefined}
              className={`h-2 rounded-full transition-all ${n === i ? 'w-5 bg-ink' : 'w-2 bg-line'}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => (last ? onDone() : go(i + 1))} className={primaryButton}>
          {last ? '시작하기' : '다음'}
        </button>
      </div>
    </main>
  )
}
