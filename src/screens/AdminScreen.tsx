// H1 레시피 관리 화면(개발 서버 전용, ?admin). 고친 목록은 검사(lib/recipeCheck)를 통과해야 recipes.json에 저장된다
import { useMemo, useState } from 'react'
import { config } from '../config'
import { CARB_OPTIONS, PROTEIN_OPTIONS } from '../conditions'
import { CORNERS, ingredients, type IngredientId } from '../data/ingredients'
import { priceOf } from '../data/prices'
import { FLAVOR_LABEL, METHOD_LABEL, recipeData, type RecipeData } from '../data/recipes'
import { candidates, draftFromCandidate, type Candidate } from '../lib/candidates'
import { computeNutrition, proteinEnergyShare } from '../lib/nutrition'
import { checkRecipe, checkRecipes } from '../lib/recipeCheck'
import { perServingCost } from '../lib/shopping'
import { num, won } from '../ui'

type Filter = 'all' | 'todo' | 'done'

const PROTEINS = PROTEIN_OPTIONS.flatMap((o) => o.sources.map((s) => [s, o.sources.length > 1 ? `${o.label}(${s === 'tofu' ? '두부' : '콩'})` : o.label] as const))
const INGREDIENT_IDS = Object.keys(ingredients) as IngredientId[]

const blank = (): RecipeData => ({
  id: '',
  name: '',
  korean: true,
  proteinSource: 'pork',
  carb: 'rice',
  flavor: 'soy',
  method: 'stirFry',
  ingredients: [],
  steps: [''],
  cookMinutes: 20,
  portionG: 200,
  storage: { freezable: true, fridgeDays: config.foodSafety.fridgeDays },
  verified: false,
})

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2'
const small = 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm'

export default function AdminScreen() {
  const [list, setList] = useState<RecipeData[]>(() => structuredClone(recipeData))
  // 저장하면 recipes.json이 바뀌어 화면이 새로 고쳐지므로 고르던 레시피는 주소 #에 둔다
  const [selected, setSelected] = useState(() => Math.max(0, list.findIndex((r) => r.id === decodeURIComponent(location.hash.slice(1)))))
  const [filter, setFilter] = useState<Filter>('all')
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<string[]>([])

  const r = list[selected]
  const update = (patch: Partial<RecipeData>) => {
    setList((l) => l.map((x, i) => (i === selected ? { ...x, ...patch } : x)))
    setDirty(true)
  }
  const select = (i: number) => {
    setSelected(i)
    history.replaceState(null, '', `#${encodeURIComponent(list[i]?.id ?? '')}`)
  }

  const errors = useMemo(() => (r ? checkRecipe(r) : []), [r])
  const nutrition = useMemo(() => (r && !errors.some((e) => e.includes('재료')) ? computeNutrition(r) : null), [r, errors])

  const shown = list.map((x, i) => [x, i] as const).filter(([x]) => filter === 'all' || (filter === 'done') === x.verified)

  async function save() {
    const all = checkRecipes(list)
    if (all.length) return setMessage(all)
    const res = await fetch('/__admin/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list) })
    const data = (await res.json()) as { ok?: boolean; errors?: string[] }
    if (data.ok) {
      setDirty(false)
      setMessage(['저장했어요. git으로 변경 내용을 확인하고 커밋하세요.'])
    } else setMessage(data.errors ?? ['저장하지 못했어요'])
  }

  function addRecipe() {
    setList((l) => [...l, blank()])
    setSelected(list.length)
    setDirty(true)
  }

  // 후보를 초안으로 목록 끝에 더한다. 분량·조리 단계를 채우고 저장해야 파일에 반영된다
  function promote(c: Candidate) {
    setList((l) => [...l, draftFromCandidate(c).draft])
    setSelected(list.length)
    setDirty(true)
  }
  const waiting = candidates.filter((c) => !list.some((x) => x.candidateId === c.id))
  const candidate = r?.candidateId ? candidates.find((c) => c.id === r.candidateId) : undefined

  function removeRecipe() {
    if (!r || !confirm(`'${r.name || '새 레시피'}'를 목록에서 지울까요? 저장해야 파일에 반영돼요.`)) return
    setList((l) => l.filter((_, i) => i !== selected))
    setSelected(0)
    setDirty(true)
  }

  const setIngredient = (i: number, patch: Partial<RecipeData['ingredients'][number]>) =>
    update({ ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const setStep = (i: number, text: string) => update({ steps: r.steps.map((s, j) => (j === i ? text : s)) })

  return (
    <div className="min-h-dvh bg-white text-black">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <h1 className="text-lg font-bold">레시피 관리</h1>
        <span className="text-sm text-gray-500">
          {list.length}개 · 검수 완료 {list.filter((x) => x.verified).length}개{dirty && ' · 저장 안 한 변경 있음'}
        </span>
        <div className="ml-auto flex gap-2">
          <button type="button" className={small} onClick={addRecipe}>
            새 레시피
          </button>
          <button type="button" className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40" disabled={!dirty} onClick={save}>
            저장
          </button>
        </div>
      </header>

      {message.length > 0 && (
        <ul className="mx-5 mt-3 rounded-lg border border-black px-4 py-2 text-sm">
          {message.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-6 p-5 md:flex-row">
        <nav className="md:w-64 md:shrink-0">
          <div className="mb-2 flex gap-1">
            {(
              [
                ['all', '전체'],
                ['todo', '검수 전'],
                ['done', '검수 완료'],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setFilter(v)} className={`${small} ${filter === v ? 'border-2 border-black font-semibold' : ''}`}>
                {label}
              </button>
            ))}
          </div>
          <ul className="max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200 md:max-h-[calc(100dvh-10rem)]">
            {shown.map(([x, i]) => (
              <li key={i}>
                <button type="button" onClick={() => select(i)} className={`flex w-full justify-between px-3 py-2 text-left text-sm ${i === selected ? 'bg-gray-100 font-semibold' : ''}`}>
                  <span>{x.name || '(이름 없음)'}</span>
                  <span className="text-gray-400">{x.verified ? '검수' : ''}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* H1 레시피 후보(data/recipe-candidates.json) 중 아직 올리지 않은 것 */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold">레시피 후보 ({waiting.length})</summary>
            <ul className="mt-2 max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200">
              {waiting.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span>{c.name}</span>
                  <button type="button" className={small} onClick={() => promote(c)}>
                    올리기
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </nav>

        {r && (
          <main className="flex min-w-0 flex-1 flex-col gap-6">
            {candidate && <CandidateNote c={candidate} />}
            <section className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                이름
                <input className={input} value={r.name} onChange={(e) => update({ name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                id (영문 소문자, 숫자, -)
                <input className={input} value={r.id} onChange={(e) => update({ id: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                단백질
                <select className={input} value={r.proteinSource} onChange={(e) => update({ proteinSource: e.target.value as RecipeData['proteinSource'] })}>
                  {PROTEINS.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                베이스 탄수화물
                <select className={input} value={r.carb} onChange={(e) => update({ carb: e.target.value as RecipeData['carb'] })}>
                  {CARB_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                맛 계열
                <select className={input} value={r.flavor} onChange={(e) => update({ flavor: e.target.value as RecipeData['flavor'] })}>
                  {Object.entries(FLAVOR_LABEL).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                조리법
                <select className={input} value={r.method} onChange={(e) => update({ method: e.target.value as RecipeData['method'] })}>
                  {Object.entries(METHOD_LABEL).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={r.korean} onChange={(e) => update({ korean: e.target.checked })} />
                한식
              </label>
            </section>

            <section>
              <h2 className="mb-2 font-semibold">재료 (1인분)</h2>
              <ul className="flex flex-col gap-2">
                {r.ingredients.map((x, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <select className={`${input} flex-1`} value={x.id} onChange={(e) => setIngredient(i, { id: e.target.value as IngredientId })}>
                      {CORNERS.map((corner) => (
                        <optgroup key={corner} label={corner}>
                          {INGREDIENT_IDS.filter((id) => ingredients[id].corner === corner).map((id) => (
                            <option key={id} value={id}>
                              {ingredients[id].name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input type="number" min={0} className={`${input} w-24`} value={x.amount} onChange={(e) => setIngredient(i, { amount: Number(e.target.value) })} />
                    <span className="w-6 text-sm text-gray-500">{ingredients[x.id]?.unit}</span>
                    <button type="button" aria-label="재료 빼기" className={small} onClick={() => update({ ingredients: r.ingredients.filter((_, j) => j !== i) })}>
                      빼기
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className={`${small} mt-2`} onClick={() => update({ ingredients: [...r.ingredients, { id: INGREDIENT_IDS[0], amount: 0 }] })}>
                재료 추가
              </button>
            </section>

            <section>
              <h2 className="mb-2 font-semibold">조리 순서</h2>
              <p className="mb-2 text-xs text-gray-500">외부 레시피 글을 옮기지 말고 직접 써 주세요.</p>
              <ol className="flex flex-col gap-2">
                {r.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 w-5 text-sm font-semibold">{i + 1}</span>
                    <textarea rows={2} className={`${input} flex-1`} value={s} onChange={(e) => setStep(i, e.target.value)} />
                    <button type="button" className={small} onClick={() => update({ steps: r.steps.filter((_, j) => j !== i) })}>
                      빼기
                    </button>
                  </li>
                ))}
              </ol>
              <button type="button" className={`${small} mt-2`} onClick={() => update({ steps: [...r.steps, ''] })}>
                단계 추가
              </button>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                조리 시간(분)
                <input type="number" min={0} className={input} value={r.cookMinutes} onChange={(e) => update({ cookMinutes: Number(e.target.value) })} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                1인분 조리 후 무게(g)
                <input type="number" min={0} className={input} value={r.portionG} onChange={(e) => update({ portionG: Number(e.target.value) })} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                냉장 일수 (최대 {config.foodSafety.fridgeDays}일)
                <input
                  type="number"
                  min={1}
                  max={config.foodSafety.fridgeDays}
                  className={input}
                  value={r.storage.fridgeDays}
                  onChange={(e) => update({ storage: { ...r.storage, fridgeDays: Number(e.target.value) } })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={r.storage.freezable} onChange={(e) => update({ storage: { ...r.storage, freezable: e.target.checked } })} />
                냉동 가능
              </label>
            </section>

            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="mb-2 font-semibold">계산 결과 (1인분{r.carb === 'rice' && `, 밥 ${config.riceWithMeal.grams}g 포함`})</h2>
              {nutrition ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                  {(
                    [
                      ['칼로리', `${nutrition.kcal}kcal / 기준 ${config.maxKcalPerMeal}`],
                      ['단백질', `${nutrition.proteinG}g (${proteinEnergyShare(nutrition)}%)`],
                      ['탄수화물', `${nutrition.carbsG}g`],
                      ['지방', `${nutrition.fatG}g`],
                      ['포화지방', `${nutrition.saturatedFatG}g`],
                      ['당류', `${nutrition.sugarG}g`],
                      ['나트륨', `${num(nutrition.sodiumMg)}mg`],
                      ['1인분 예상 금액', won(perServingCost({ ...r, nutrition }, [], priceOf))],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">재료를 고치면 계산해요.</p>
              )}
              {errors.length > 0 ? (
                <ul className="mt-3 list-disc pl-5 text-sm font-semibold">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">검사 통과</p>
              )}
            </section>

            <section className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={r.verified} onChange={(e) => update({ verified: e.target.checked })} />
                검수 완료 (재료, 분량, 조리 순서, 보관 정보를 사람이 확인함)
              </label>
              <button type="button" className={`${small} ml-auto`} onClick={removeRecipe}>
                이 레시피 지우기
              </button>
            </section>
          </main>
        )}
      </div>
    </div>
  )
}

// 후보에서 올린 레시피의 참고 정보. 출처 글은 재료 구성만 참고하고 조리 단계는 직접 쓴다
function CandidateNote({ c }: { c: Candidate }) {
  const { unmatched } = draftFromCandidate(c)
  return (
    <section className="rounded-xl border border-black p-4 text-sm">
      <h2 className="font-semibold">후보에서 올린 레시피 ({c.id})</h2>
      <p className="mt-1">
        참고한 재료 구성:{' '}
        <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline">
          출처
        </a>{' '}
        · 글과 사진은 옮기지 말고 조리 순서는 직접 써 주세요.
      </p>
      {c.mealPrep && <p className="mt-1">밀프렙 메모: {c.mealPrep}</p>}
      {c.note && <p className="mt-1">메모: {c.note}</p>}
      {(c.protein === 'other' || c.carb === 'other') && <p className="mt-1">후보의 단백질이나 탄수화물이 '기타'라서 임시 값을 넣었어요. 맞게 골라 주세요.</p>}
      {unmatched.length > 0 && (
        <p className="mt-1">
          재료 사전에 없어 빠진 재료: {unmatched.join(', ')}. 비슷한 재료로 고르거나 재료 사전(src/data/ingredients.ts)에 먼저 추가해 주세요.
        </p>
      )}
    </section>
  )
}
