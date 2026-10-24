// 처음 설정: A1 인원 → A8 단백질 → A10 탄수화물 → A9 양념 → A2 먹을 날짜 (A5 식단은 2026-10-23 삭제).
// 질문 하나씩 묻고 저장한다. 다음부터는 이번 식단 조건 화면(InputScreen)에서 바로 고친다
import { useState, type ReactNode } from 'react'
import Calendar from '../components/Calendar'
import Logo from '../components/Logo'
import { CarbField, PantryField, PeopleField, ProteinField } from '../components/fields'
import { ALL_CARBS, ALL_PROTEINS, type Conditions } from '../conditions'
import { cookDay, formatDay, type ISODate } from '../lib/dates'
import { filterCandidates, hintText, widenHints } from '../lib/menu'
import { config } from '../config'
import { ADVICE, primaryButton } from '../ui'

type Props = {
  today: ISODate
  initial: Conditions
  onDone: (c: Conditions) => void
}

const STEPS = [
  { name: '인원', title: '몇 명이 먹나요?', desc: '인원수에 맞춰 재료 분량을 계산해요.' },
  { name: '단백질', title: '어떤 단백질을 먹고 싶나요?', desc: '고른 재료가 주재료인 메뉴로 추천해요. 여러 개 고를 수 있어요.' },
  { name: '탄수화물', title: '무엇과 함께 먹고 싶나요?', desc: '메뉴의 바탕이 되는 탄수화물이에요. 여러 개 고를 수 있어요.' },
  { name: '양념', title: '집에 이미 있는 양념을 골라 주세요', desc: '고른 양념은 장보기 목록에서 빼고, 다음 주에도 기억해요.' },
  { name: '날짜', title: '언제 먹을 건가요?', desc: '고른 날짜 수만큼 저녁 끼니를 준비해요.' },
]

function Question({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] leading-snug font-bold">{title}</h1>
        {desc && <p className="mt-2 text-[15px] text-sub">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

export default function SetupScreen({ today, initial, onDone }: Props) {
  const [step, setStep] = useState(0)
  const [c, setC] = useState(initial)
  const set = (patch: Partial<Conditions>) => setC((cur) => ({ ...cur, ...patch }))
  const last = step === STEPS.length - 1
  const { name, title, desc } = STEPS[step]

  // 아직 답하지 않은 질문(빈 선택)은 전부로 보고 센다. 처음 설정에서 단백질 단계일 때 탄수화물이 비어 있기 때문
  const counted = {
    ...c,
    proteins: c.proteins.length ? c.proteins : ALL_PROTEINS,
    carbs: c.carbs.length ? c.carbs : ALL_CARBS,
  }
  const candidates = filterCandidates(counted).length
  const hints = candidates < c.menuCount ? widenHints(counted) : []
  const picked = [true, c.proteins.length > 0, c.carbs.length > 0, true, c.dates.length > 0][step]
  const showCount = step === 1 || step === 2

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface px-5 pt-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          aria-label="이전"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-xl disabled:invisible"
        >
          ‹
        </button>
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="설정 진행">
          {STEPS.map((s, i) => (
            <div key={s.name} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
        <span className="w-10 text-right text-sm text-sub">
          {step + 1}/{STEPS.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        {/* I9 첫 화면에만 세로형 로고 */}
        {step === 0 && (
          <div className="mb-10 flex justify-center">
            <Logo vertical />
          </div>
        )}
        <p className="mb-2 text-sm font-semibold text-sub">{name}</p>
        <Question title={title} desc={desc}>
          {step === 0 && <PeopleField c={c} set={set} />}
          {step === 1 && <ProteinField c={c} set={set} />}
          {step === 2 && <CarbField c={c} set={set} />}
          {step === 3 && <PantryField c={c} set={set} />}
          {step === 4 && (
            <>
              <Calendar today={today} selected={c.dates} onChange={(dates) => set({ dates })} />
              {c.dates.length > 0 && <p className="-mt-2 text-sm text-sub">조리일은 {formatDay(cookDay(c.dates)!)}로 가정해요</p>}
              <p className="text-sm text-sub">모든 메뉴는 한 끼 {config.maxKcalPerMeal}kcal 이하 기준으로 만들었어요.</p>
              <p className="text-xs text-sub">{ADVICE}</p>
            </>
          )}
          {showCount && picked && (
            <p className={`text-sm ${candidates ? 'text-sub' : 'font-medium text-ink'}`}>
              {candidates ? `조건에 맞는 메뉴 ${candidates}개` : '맞는 메뉴가 없어요. 더 골라 주세요'}
              {/* A11 */}
              {hints.length > 0 && <span className="block font-medium text-ink">{hintText(hints)}</span>}
            </p>
          )}
        </Question>
      </div>

      <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-surface from-70% px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => (last ? onDone(c) : setStep(step + 1))}
          disabled={!picked || (showCount && !candidates)}
          className={primaryButton}
        >
          {last ? '완료' : '다음'}
        </button>
      </div>
    </main>
  )
}
