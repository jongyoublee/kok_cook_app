// 조건 입력 칸. 처음 설정(SetupScreen)과 이번 식단 조건(InputScreen)이 같은 칸을 쓴다.
// 아이콘은 나중에 단색 아이콘으로 넣는다
import { useState } from 'react'
import { ALL_CARBS, ALL_PROTEINS, CARB_OPTIONS, PANTRY_GROUPS, PROTEIN_OPTIONS, type Conditions, type Diet } from '../conditions'
import { ingredients, type IngredientId } from '../data/ingredients'
import { toggle } from '../ui'

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

const DIETS: { value: Diet; label: string; desc: string }[] = [
  { value: 'korean', label: '한식', desc: '집밥 같은 한식 메뉴' },
  { value: 'highProtein', label: '고단백', desc: '1인분 단백질 30g 이상' },
]

// A5, A6
export function DietField({ c, set }: FieldProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DIETS.map((d) => (
        <Tile key={d.value} on={c.diet === d.value} onClick={() => set({ diet: d.value })} label={d.label} desc={d.desc} />
      ))}
    </div>
  )
}
