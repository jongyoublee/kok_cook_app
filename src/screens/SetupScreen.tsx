// 내 설정: A1 인원, A5·A6 식단, A8 먹고 싶은 단백질, A9 집에 있는 양념.
// 처음 한 번 질문 하나씩 묻고 저장한다. 이후에는 이번 주 조건 화면에서 "변경"으로 다시 연다
import { useState } from 'react'
import { ALL_PROTEINS, PANTRY_OPTIONS, PROTEIN_OPTIONS, type Conditions, type Diet } from '../conditions'
import { ingredients } from '../data/ingredients'
import { filterCandidates } from '../lib/menu'
import { ADVICE, chip, primaryButton, toggle } from '../ui'

type Props = {
  initial: Conditions
  onDone: (c: Conditions) => void
  onCancel?: () => void // 처음 설정일 때는 없다
}

const STEPS = 4

export default function SetupScreen({ initial, onDone, onCancel }: Props) {
  const [step, setStep] = useState(0)
  const [c, setC] = useState(initial)
  const set = (patch: Partial<Conditions>) => setC((cur) => ({ ...cur, ...patch }))
  const back = step > 0 ? () => setStep(step - 1) : onCancel
  const candidates = filterCandidates(c).length

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={back} disabled={!back} className="p-1 text-xl disabled:invisible" aria-label="이전">‹</button>
        <div className="h-1 flex-1 rounded bg-gray-200" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
          <div className="h-1 rounded bg-emerald-600" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <section className="flex flex-col gap-8">
          <h1 className="text-2xl font-bold">몇 명이 먹나요?</h1>
          <div className="flex items-center justify-center gap-6">
            <button type="button" aria-label="인원 줄이기" disabled={c.people <= 1} onClick={() => set({ people: c.people - 1 })} className="h-12 w-12 rounded-full border text-xl disabled:opacity-30">−</button>
            <span className="w-16 text-center text-4xl font-bold">{c.people}</span>
            <button type="button" aria-label="인원 늘리기" onClick={() => set({ people: c.people + 1 })} className="h-12 w-12 rounded-full border text-xl">+</button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">어떤 식단으로 할까요?</h1>
          {([['korean', '한식', '집밥 같은 한식 메뉴'], ['highProtein', '고단백', '1인분 단백질 30g 이상']] as [Diet, string, string][]).map(([v, label, desc]) => (
            <button key={v} type="button" aria-pressed={c.diet === v} onClick={() => set({ diet: v })} className={`${chip(c.diet === v)} py-4 text-left`}>
              <span className="block">{label}</span>
              <span className="block text-sm font-normal text-gray-500">{desc}</span>
            </button>
          ))}
          <p className="text-sm text-gray-500">한 끼 {c.maxKcal}kcal 이하 메뉴로 골라요.</p>
          <p className="text-xs text-gray-500">{ADVICE}</p>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">어떤 단백질을 먹고 싶나요?</h1>
            <p className="mt-1 text-sm text-gray-500">고른 재료가 주재료인 메뉴로 추천해요. 여러 개 고를 수 있어요.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PROTEIN_OPTIONS.map(({ label, sources }) => {
              const on = sources.every((s) => c.proteins.includes(s))
              const next = on ? c.proteins.filter((p) => !sources.includes(p)) : [...c.proteins, ...sources]
              return (
                <button key={label} type="button" aria-pressed={on} onClick={() => set({ proteins: next })} className={chip(on)}>
                  {label}
                </button>
              )
            })}
          </div>
          <button type="button" aria-pressed={c.proteins.length === ALL_PROTEINS.length} onClick={() => set({ proteins: ALL_PROTEINS })} className={chip(c.proteins.length === ALL_PROTEINS.length)}>
            전부 좋아요
          </button>
          <p className={`text-sm ${candidates < 2 ? 'text-orange-600' : 'text-gray-500'}`}>
            {c.proteins.length ? `조건에 맞는 메뉴 ${candidates}개` : '1개 이상 골라 주세요'}
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">집에 이미 있는 양념을 골라 주세요</h1>
            <p className="mt-1 text-sm text-gray-500">고른 양념은 장보기 목록에서 빼고, 다음 주에도 기억해요.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PANTRY_OPTIONS.map((id) => (
              <button key={id} type="button" aria-pressed={c.pantry.includes(id)} onClick={() => set({ pantry: toggle(c.pantry, id) })} className={chip(c.pantry.includes(id))}>
                {ingredients[id].name}
              </button>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => (step < STEPS - 1 ? setStep(step + 1) : onDone(c))}
        disabled={step === 2 && !candidates}
        className={`${primaryButton} mt-auto`}
      >
        {step < STEPS - 1 ? '다음' : '완료'}
      </button>
    </main>
  )
}
