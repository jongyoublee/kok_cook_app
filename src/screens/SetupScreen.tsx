// 내 설정: A1 인원, A5·A6 식단, A8 먹고 싶은 단백질, A10 베이스 탄수화물, A9 집에 있는 양념.
// 처음 한 번 질문 하나씩 묻고 저장한다. 이후에는 이번 주 조건 화면에서 "변경"으로 다시 연다
import { useState, type ReactNode } from 'react'
import { ALL_CARBS, ALL_PROTEINS, CARB_OPTIONS, PANTRY_OPTIONS, PROTEIN_OPTIONS, type Conditions, type Diet } from '../conditions'
import { ingredients } from '../data/ingredients'
import { filterCandidates } from '../lib/menu'
import { ADVICE, primaryButton, toggle } from '../ui'

type Props = {
  initial: Conditions
  onDone: (c: Conditions) => void
  onCancel?: () => void // 처음 설정일 때는 없다
}

const STEPS = ['인원', '식단', '단백질', '탄수화물', '양념']

const DIETS: { value: Diet; icon: string; label: string; desc: string }[] = [
  { value: 'korean', icon: '🍲', label: '한식', desc: '집밥 같은 한식 메뉴' },
  { value: 'highProtein', icon: '💪', label: '고단백', desc: '1인분 단백질 30g 이상' },
]

// 선택 카드. multi면 체크 상자, 아니면 라디오 모양 표시
function OptionCard({ on, onClick, icon, label, desc, multi = false }: { on: boolean; onClick: () => void; icon: string; label: string; desc?: string; multi?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-colors ${
        on ? 'border-emerald-500 bg-emerald-50' : 'border-transparent shadow-sm'
      }`}
    >
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900">{label}</span>
        {desc && <span className="block text-sm text-gray-500">{desc}</span>}
      </span>
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center text-xs text-white ${multi ? 'rounded-md' : 'rounded-full'} ${
          on ? 'bg-emerald-500' : 'border-2 border-gray-300'
        }`}
      >
        {on && '✓'}
      </span>
    </button>
  )
}

function Question({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] leading-snug font-bold text-gray-900">{title}</h1>
        {desc && <p className="mt-2 text-[15px] text-gray-500">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

// 조건에 맞는 메뉴 수와 "전부 좋아요" 버튼
function CandidateBar({ picked, count, allOn, onAll }: { picked: boolean; count: number; allOn: boolean; onAll: () => void }) {
  const warn = picked && !count
  return (
    <div className="flex items-center justify-between">
      <span className={`rounded-full px-3 py-1 text-sm ${warn ? 'bg-orange-50 text-orange-600' : 'bg-white text-gray-600 shadow-sm'}`}>
        {!picked ? '1개 이상 골라 주세요' : count ? `조건에 맞는 메뉴 ${count}개` : '맞는 메뉴가 없어요. 더 골라 주세요'}
      </span>
      <button type="button" onClick={onAll} disabled={allOn} className="text-sm font-medium text-emerald-700 disabled:text-gray-300">
        전부 좋아요
      </button>
    </div>
  )
}

export default function SetupScreen({ initial, onDone, onCancel }: Props) {
  const [step, setStep] = useState(0)
  const [c, setC] = useState(initial)
  const set = (patch: Partial<Conditions>) => setC((cur) => ({ ...cur, ...patch }))
  const back = step > 0 ? () => setStep(step - 1) : onCancel
  const last = step === STEPS.length - 1
  // 아직 답하지 않은 질문(빈 선택)은 전부로 보고 센다. 처음 설정에서 단백질 단계일 때 탄수화물이 비어 있기 때문
  const candidates = filterCandidates({
    ...c,
    proteins: c.proteins.length ? c.proteins : ALL_PROTEINS,
    carbs: c.carbs.length ? c.carbs : ALL_CARBS,
  }).length
  const blocked = (step === 2 && !c.proteins.length) || (step === 3 && !c.carbs.length) || ((step === 2 || step === 3) && !candidates)

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-stone-50 px-5 pt-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          disabled={!back}
          aria-label="이전"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm disabled:invisible"
        >
          ‹
        </button>
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="설정 진행">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <span className="w-10 text-right text-sm text-gray-400">
          {step + 1}/{STEPS.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="mb-2 text-sm font-semibold text-emerald-600">내 설정 · {STEPS[step]}</p>

        {step === 0 && (
          <Question title="몇 명이 먹나요?" desc="인원수에 맞춰 재료 분량을 계산해요.">
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <button type="button" aria-label="인원 줄이기" disabled={c.people <= 1} onClick={() => set({ people: c.people - 1 })} className="h-12 w-12 rounded-full bg-stone-100 text-2xl disabled:opacity-30">−</button>
              <span className="text-4xl font-bold text-gray-900">
                {c.people}
                <span className="ml-1 text-lg font-medium text-gray-500">명</span>
              </span>
              <button type="button" aria-label="인원 늘리기" onClick={() => set({ people: c.people + 1 })} className="h-12 w-12 rounded-full bg-stone-100 text-2xl">+</button>
            </div>
          </Question>
        )}

        {step === 1 && (
          <Question title="어떤 식단으로 할까요?" desc={`한 끼 ${c.maxKcal}kcal 이하 메뉴로 골라요.`}>
            <div className="flex flex-col gap-3">
              {DIETS.map((d) => (
                <OptionCard key={d.value} on={c.diet === d.value} onClick={() => set({ diet: d.value })} icon={d.icon} label={d.label} desc={d.desc} />
              ))}
            </div>
            <p className="text-xs text-gray-400">{ADVICE}</p>
          </Question>
        )}

        {step === 2 && (
          <Question title="어떤 단백질을 먹고 싶나요?" desc="고른 재료가 주재료인 메뉴로 추천해요. 여러 개 고를 수 있어요.">
            <div className="grid grid-cols-2 gap-2">
              {PROTEIN_OPTIONS.map(({ label, icon, sources }) => {
                const on = sources.every((s) => c.proteins.includes(s))
                const next = on ? c.proteins.filter((p) => !sources.includes(p)) : [...c.proteins, ...sources]
                return <OptionCard key={label} multi on={on} onClick={() => set({ proteins: next })} icon={icon} label={label} />
              })}
            </div>
            <CandidateBar picked={c.proteins.length > 0} count={candidates} allOn={c.proteins.length === ALL_PROTEINS.length} onAll={() => set({ proteins: ALL_PROTEINS })} />
          </Question>
        )}

        {step === 3 && (
          <Question title="무엇과 함께 먹고 싶나요?" desc="밥, 면처럼 메뉴의 바탕이 되는 탄수화물이에요. 여러 개 고를 수 있어요.">
            <div className="grid grid-cols-2 gap-2">
              {CARB_OPTIONS.map(({ label, icon, value }) => (
                <OptionCard key={value} multi on={c.carbs.includes(value)} onClick={() => set({ carbs: toggle(c.carbs, value) })} icon={icon} label={label} />
              ))}
            </div>
            <CandidateBar picked={c.carbs.length > 0} count={candidates} allOn={c.carbs.length === ALL_CARBS.length} onAll={() => set({ carbs: ALL_CARBS })} />
          </Question>
        )}

        {step === 4 && (
          <Question title="집에 이미 있는 양념을 골라 주세요" desc="고른 양념은 장보기 목록에서 빼고, 다음 주에도 기억해요.">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{c.pantry.length}개 선택</span>
              <button
                type="button"
                onClick={() => set({ pantry: c.pantry.length === PANTRY_OPTIONS.length ? [] : PANTRY_OPTIONS })}
                className="font-medium text-emerald-700"
              >
                {c.pantry.length === PANTRY_OPTIONS.length ? '모두 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PANTRY_OPTIONS.map((id) => {
                const on = c.pantry.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ pantry: toggle(c.pantry, id) })}
                    className={`rounded-full border px-4 py-2 text-[15px] transition-colors ${
                      on ? 'border-emerald-500 bg-emerald-500 font-semibold text-white' : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {on && '✓ '}
                    {ingredients[id].name}
                  </button>
                )
              })}
            </div>
          </Question>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-stone-50 from-70% px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => (last ? onDone(c) : setStep(step + 1))}
          disabled={blocked}
          className={primaryButton}
        >
          {last ? '완료' : '다음'}
        </button>
      </div>
    </main>
  )
}
