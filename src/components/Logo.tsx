// I9 로고와 셰프 모자 아이콘(docs/design.md 9절, 원본 docs/brand/kokcook-icon.svg).
// 몸통은 검정 선, 띠 한 줄만 강조색 밝게. 채우거나 비율을 바꾸지 않는다
import { hatStroke } from '../ui'

export function HatIcon({ size }: { size: number }) {
  const [body, band] = hatStroke(Math.max(18, size))
  return (
    <svg width={Math.max(18, size)} height={Math.max(18, size)} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path
        d="M7.5 20h9a.5.5 0 0 0 .5-.5v-5.2a3.8 3.8 0 1 0-2.1-7.1 4 4 0 0 0-5.8 0A3.8 3.8 0 1 0 7 14.3v5.2a.5.5 0 0 0 .5.5z"
        className="stroke-ink"
        strokeWidth={body}
      />
      <path d="M7 16.6h10" className="stroke-accent-mark" strokeWidth={band} />
    </svg>
  )
}

// 가로형(기본, 앱 머리): 모자 28px + 글자 22px, 간격 6px. 세로형(첫 화면): 모자 위, 글자 아래, 간격 12px
export default function Logo({ vertical = false }: { vertical?: boolean }) {
  return (
    <span role="img" aria-label="KokCook" className={`inline-flex items-center ${vertical ? 'flex-col gap-3' : 'gap-1.5'}`}>
      <HatIcon size={vertical ? 64 : 28} />
      <span className={`font-wordmark font-extrabold text-ink ${vertical ? 'text-[32px] tracking-[-0.03em]' : 'text-[22px] tracking-[-0.03em]'}`}>KokCook</span>
    </span>
  )
}
