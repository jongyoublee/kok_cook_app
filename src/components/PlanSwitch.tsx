// B13 장보기·보관 탭에서 이번 주 계획과 다음 주 계획이 모두 있을 때 고르는 칸
import type { View } from './HomeHeader'

export default function PlanSwitch({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-bg p-1 text-sm font-medium" role="tablist">
      {(
        [
          ['this', '이번 주'],
          ['next', '다음 주'],
        ] as const
      ).map(([v, label]) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={`rounded-lg py-2 ${value === v ? 'bg-surface shadow-card' : 'text-sub'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}
