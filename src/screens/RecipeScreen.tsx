// C1~C4 레시피 상세 (와이어프레임 3). 재료 분량은 만들 인분(끼니 수 × 인원)으로 곱해 보여준다(C3)
import { config } from '../config'
import { ingredients } from '../data/ingredients'
import { FLAVOR_LABEL, METHOD_LABEL, type Recipe } from '../data/recipes'
import { num } from '../ui'

type Props = {
  recipe: Recipe
  servings: number
  onBack: () => void
}


export default function RecipeScreen({ recipe: r, servings, onBack }: Props) {
  const n = r.nutrition
  const nutrition: [string, string][] = [
    ['칼로리', `${n.kcal}kcal`],
    ['탄수화물', `${n.carbsG}g`],
    ['단백질', `${n.proteinG}g`],
    ['지방', `${n.fatG}g`],
    ['당류', `${n.sugarG}g`],
    ['나트륨', `${num(n.sodiumMg)}mg`],
  ]

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-white px-5 pt-4 pb-10">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="뒤로" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-xl">
          ‹
        </button>
      </header>

      <section>
        <div className="aspect-[4/3] w-full rounded-2xl bg-gray-100" aria-hidden />
        <h1 className="mt-4 text-[26px] font-bold">{r.name}</h1>
        <p className="mt-1 text-gray-500">
          {FLAVOR_LABEL[r.flavor]} {METHOD_LABEL[r.method]} · 조리 {r.cookMinutes}분 · {servings}인분
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">1인분 영양정보</h2>
        <dl className="grid grid-cols-3 gap-2">
          {nutrition.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-gray-200 px-3 py-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {r.carb === 'rice' && <p className="mt-2 text-xs text-gray-500">밥 {config.riceWithMeal.grams}g을 포함한 값이에요. 밥은 장보기 목록에 넣지 않아요.</p>}
        {!r.verified && <p className="mt-2 text-xs text-gray-400">검수 전 추정치예요.</p>}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">재료 ({servings}인분)</h2>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {r.ingredients.map(({ id, amount }) => (
            <li key={id} className="flex justify-between px-4 py-3">
              <span>{ingredients[id].name}</span>
              <span className="text-gray-600">
                {num(amount * servings)}
                {ingredients[id].unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">조리 순서</h2>
        <ol className="flex flex-col gap-3">
          {r.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black text-sm font-semibold">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {/* 분량을 인분만큼 늘렸으므로 단계의 시간·물 양은 상태를 보며 맞춘다 */}
        {servings > 1 && <p className="mt-3 text-sm text-gray-500">여러 인분을 한 번에 만들 때는 익는 정도를 보며 시간을 조금 늘려 주세요.</p>}
      </section>

      <section className="rounded-2xl border border-black p-4">
        <h2 className="font-semibold">나눠 담기</h2>
        <p className="mt-1">
          다 만든 뒤 저울로 <strong>1인분 약 {num(r.portionG)}g</strong>씩 {servings}개로 나눠 담으세요.
        </p>
        <p className="mt-1 text-sm text-gray-500">총 약 {num(r.portionG * servings)}g · 무게는 검수 전 추정치예요.</p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">보관</h2>
        <div className="flex gap-2">
          <span className="rounded-full border border-gray-200 px-3 py-1 text-sm">{r.storage.freezable ? '냉동 가능' : '냉동 비추천'}</span>
          <span className="rounded-full border border-gray-200 px-3 py-1 text-sm">냉장 {r.storage.fridgeDays}일</span>
        </div>
        {/* E4 식품 안전 수치는 공식 기준 확인 전 임시값 */}
        {config.foodSafety.provisional && <p className="mt-2 text-xs text-gray-400">보관 일수는 공식 기준 확인 전 임시값이에요.</p>}
      </section>
    </main>
  )
}
