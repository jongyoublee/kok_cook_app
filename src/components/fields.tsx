// 조건 입력 칸. 처음 설정(SetupScreen)과 이번 식단 조건(InputScreen)이 같은 칸을 쓴다.
// 아이콘은 나중에 단색 아이콘으로 넣는다
import { useState } from 'react'
import { budgetOf, budgetRange } from '../lib/budget'
import { ALL_CARBS, ALL_PROTEINS, CARB_OPTIONS, PANTRY_GROUPS, PROTEIN_OPTIONS, type Conditions } from '../conditions'
import { ingredients, type IngredientId } from '../data/ingredients'
import { ALLERGY_NOTE, toggle, won } from '../ui'

export type FieldProps = { c: Conditions; set: (patch: Partial<Conditions>) => void }

// 선택 칸. 고르면 흰 바탕에 굵은 검정 테두리(ring으로 두께를 더해 크기가 변하지 않게)
export function Tile({ on, onClick, label, desc }: { on: boolean; onClick: () => void; label: string; desc?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-12 flex-col justify-center rounded-xl border bg-white px-4 py-3 text-left text-gray-900 transition-colors ${
        on ? 'border-black font-semibold ring-1 ring-black' : 'border-gray-200'
      }`}
    >
      <span>{label}</span>
      {desc && <span className="mt-0.5 text-sm font-normal text-gray-500">{desc}</span>}
    </button>
  )
}

// "전부 좋아요"처럼 묶음 선택에 쓰는 글자 버튼
function TextButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="text-sm font-medium text-gray-900 underline underline-offset-4 disabled:text-gray-300 disabled:no-underline">
      {children}
    </button>
  )
}

// A1
export function PeopleField({ c, set }: FieldProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
      <button type="button" aria-label="인원 줄이기" disabled={c.people <= 1} onClick={() => set({ people: c.people - 1 })} className="h-10 w-10 rounded-full border border-gray-200 text-xl disabled:opacity-30">−</button>
      <span className="text-2xl font-bold">
        {c.people}
        <span className="ml-1 text-base font-medium text-gray-500">명</span>
      </span>
      <button type="button" aria-label="인원 늘리기" onClick={() => set({ people: c.people + 1 })} className="h-10 w-10 rounded-full border border-gray-200 text-xl">+</button>
    </div>
  )
}

// A8
export function ProteinField({ c, set }: FieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {PROTEIN_OPTIONS.map(({ label, sources }) => {
          const on = sources.every((s) => c.proteins.includes(s))
          const next = on ? c.proteins.filter((p) => !sources.includes(p)) : [...c.proteins, ...sources]
          return <Tile key={label} on={on} onClick={() => set({ proteins: next })} label={label} />
        })}
      </div>
      <div className="flex justify-end">
        <TextButton onClick={() => set({ proteins: ALL_PROTEINS })} disabled={c.proteins.length === ALL_PROTEINS.length}>전부 좋아요</TextButton>
      </div>
      {/* I5 */}
      <p className="text-xs text-gray-400">{ALLERGY_NOTE}</p>
    </div>
  )
}

// A10
export function CarbField({ c, set }: FieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {CARB_OPTIONS.map(({ label, value }) => (
          <Tile key={value} on={c.carbs.includes(value)} onClick={() => set({ carbs: toggle(c.carbs, value) })} label={label} />
        ))}
      </div>
      <div className="flex justify-end">
        <TextButton onClick={() => set({ carbs: ALL_CARBS })} disabled={c.carbs.length === ALL_CARBS.length}>전부 좋아요</TextButton>
      </div>
    </div>
  )
}

// A9 기본 양념 10개만 먼저 보여주고, 한식·양식 양념은 아래 버튼으로 펼친다.
// 펼친 쪽에서 고른 게 있으면 펼친 채로 시작
export function PantryField({ c, set }: FieldProps) {
  const [basic, ...rest] = PANTRY_GROUPS
  const restCount = rest.reduce((n, g) => n + g.ids.length, 0)
  const [more, setMore] = useState(() => rest.some((g) => g.ids.some((id) => c.pantry.includes(id))))
  const grid = (ids: IngredientId[]) => (
    <div className="grid grid-cols-3 gap-2">
      {ids.map((id) => (
        <Tile key={id} on={c.pantry.includes(id)} onClick={() => set({ pantry: toggle(c.pantry, id) })} label={ingredients[id].name} />
      ))}
    </div>
  )
  return (
    <div className="flex flex-col gap-3">
      {grid(basic.ids)}
      {more &&
        rest.map((g) => (
          <div key={g.title} className="mt-2 flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500">{g.title}</h3>
            {grid(g.ids)}
          </div>
        ))}
      <p className="text-sm text-gray-500">{c.pantry.length}개 선택</p>
      <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium">
        {more ? '접기' : `한식·양식 양념 더 보기 (${restCount})`}
      </button>
    </div>
  )
}


// A7 예산 슬라이더와 F1 "가장 싸게 구성". 버전 B는 cheapest 없이 슬라이더만 쓴다
// 범위는 조건에 따라 바뀐다(budgetRange). 아직 정하지 않았으면 범위 중간을 보여준다
export function BudgetField({ c, set, showCheapest = true }: FieldProps & { showCheapest?: boolean }) {
  const range = budgetRange(c)
  const { min, max, step } = range
  const value = budgetOf(c, range)
  const off = showCheapest && c.cheapest
  return (
    <div className="flex flex-col gap-3">
      <div className={`rounded-xl border border-gray-200 px-4 py-3 ${off ? 'opacity-40' : ''}`}>
        <p className="text-center text-2xl font-bold">{won(value)}</p>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={off}
          onChange={(e) => set({ budget: Number(e.target.value) })}
          aria-label="예산"
          className="mt-2 w-full accent-black"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{won(min)}</span>
          <span>{won(max)}</span>
        </div>
        <p className="mt-1 text-center text-xs text-gray-400">가장 싸게 구성한 금액부터 고를 수 있어요. 인원과 날짜에 따라 범위가 바뀌어요.</p>
      </div>
      {showCheapest && (
        <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <span>
            <span className="block font-medium">가장 싸게 구성</span>
            <span className="block text-sm text-gray-500">예산과 상관없이 예상 금액이 가장 적은 메뉴로 골라요</span>
          </span>
          <input type="checkbox" checked={c.cheapest} onChange={(e) => set({ cheapest: e.target.checked })} className="h-5 w-5 shrink-0 accent-black" />
        </label>
      )}
    </div>
  )
}

// 예상 금액과 예산 비교 막대. budget이 없으면 금액만
export function CostBar({ cost, budget }: { cost: number; budget?: number }) {
  const over = budget !== undefined && cost > budget
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">예상 금액</span>
        <span className="font-bold">약 {won(cost)}</span>
      </div>
      {budget !== undefined && (
        <>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100" role="meter" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={cost} aria-label="예산 대비 예상 금액">
            <div className={`h-2 rounded-full ${over ? 'bg-black' : 'bg-gray-400'}`} style={{ width: `${Math.min(100, (cost / budget) * 100)}%` }} />
          </div>
          <p className={`mt-1 text-sm ${over ? 'font-semibold text-black' : 'text-gray-500'}`}>
            예산 {won(budget)} {over ? `· ${won(cost - budget)} 넘어요` : `· ${won(budget - cost)} 남아요`}
          </p>
        </>
      )}
    </div>
  )
}
