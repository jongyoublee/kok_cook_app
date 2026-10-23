// D1~D6 장보기 목록 (와이어프레임 4), G1~G3 쿠팡 링크, F2 예산 확인 (버전 B, 와이어프레임 5)과
// E1~E4 보관 방법 탭 (와이어프레임 6)
import { useState } from 'react'
import { BudgetField, CostBar } from '../components/fields'
import StorageTab from '../components/StorageTab'
import type { Conditions } from '../conditions'
import { CORNERS, ingredients, type IngredientId } from '../data/ingredients'
import { priceOf } from '../data/prices'
import type { Recipe } from '../data/recipes'
import { budgetOf, budgetVersion, suggestSwap } from '../lib/budget'
import { COUPANG_NOTICE, coupangLink } from '../lib/coupang'
import { formatDay, type ISODate } from '../lib/dates'
import { buildShoppingList, servingsOf } from '../lib/shopping'

type Props = {
  today: ISODate
  conditions: Conditions
  cookDate: ISODate
  onCookDateChange: (d: ISODate) => void
  menu: Recipe[]
  checked: IngredientId[]
  onToggle: (id: IngredientId) => void
  onOpenRecipe: (r: Recipe) => void
  onBudgetChange: (budget: number) => void
  onApplySwap: (menu: Recipe[]) => void
  onBack: () => void
}

const num = (n: number) => n.toLocaleString('ko-KR')

export default function ShoppingScreen(props: Props) {
  const { today, conditions: c, cookDate, onCookDateChange, menu, checked, onToggle, onOpenRecipe, onBudgetChange, onApplySwap, onBack } = props
  const [tab, setTab] = useState<'list' | 'storage'>('list')
  const [keep, setKeep] = useState(false) // F2 "그대로 진행"을 누르면 교체 제안을 닫는다
  const list = buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf)
  const left = list.items.filter((it) => !checked.includes(it.id)).length
  const versionB = budgetVersion() === 'B'
  const budget = budgetOf(c)
  const suggestion = versionB && !keep && list.total > budget ? suggestSwap(menu, c) : null

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-white px-5 pt-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="메뉴로 돌아가기"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-xl"
        >
          ‹
        </button>
      </header>

      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-medium" role="tablist">
        {(
          [
            ['list', '장보기 목록'],
            ['storage', '보관 방법'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-lg py-2 ${tab === value ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'storage' ? (
        <StorageTab today={today} dates={c.dates} menu={menu} cookDate={cookDate} onCookDateChange={onCookDateChange} />
      ) : (
        <>
          <section>
            <h1 className="text-[26px] font-bold">장보기 목록</h1>
            <p className="mt-1 text-gray-500">
              {formatDay(cookDate)} 조리 전까지 구매 · {left}개 남음
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {menu.map((r) => (
                <button key={r.id} type="button" onClick={() => onOpenRecipe(r)} className="rounded-full border border-gray-200 px-3 py-1 text-sm">
                  {r.name} 레시피
                </button>
              ))}
            </div>
          </section>

          {/* U22~U25 버전 B: 구성 후 예산을 받고 넘으면 교체를 제안한다 */}
          {versionB && (
            <section className="flex flex-col gap-3">
              <h2 className="font-semibold">예산</h2>
              <BudgetField c={c} set={(p) => typeof p.budget === 'number' && onBudgetChange(p.budget)} showCheapest={false} />
              <CostBar cost={list.total} budget={budget} />
              {!suggestion && list.total > budget && (
                <p className="text-sm text-gray-500">메뉴를 바꿔서 줄일 수 있는 조합이 없어요. 메뉴 수를 줄이거나 집에 있는 양념을 확인해 보세요.</p>
              )}
              {suggestion && (
                <div className="rounded-xl border border-black px-4 py-3">
                  <p className="font-semibold">교체 제안</p>
                  <p className="mt-1 text-sm">
                    {suggestion.from.name} → {suggestion.to.name}로 바꾸면 약 {num(suggestion.saving)}원 줄어요.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium">
                    <button type="button" onClick={() => setKeep(true)} className="rounded-lg border border-gray-200 py-2">
                      그대로 진행
                    </button>
                    <button type="button" onClick={() => onApplySwap(suggestion.menu)} className="rounded-lg bg-black py-2 text-white">
                      교체 제안 적용
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {CORNERS.map((corner) => {
            const items = list.items.filter((it) => it.corner === corner)
            if (!items.length) return null
            return (
              <section key={corner}>
                <h2 className="mb-2 text-sm font-semibold text-gray-500">{corner}</h2>
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {items.map((it) => {
                    const done = checked.includes(it.id)
                    return (
                      <li key={it.id} className="flex items-start">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 py-3 pl-4">
                          <input type="checkbox" checked={done} onChange={() => onToggle(it.id)} className="mt-1 h-5 w-5 shrink-0 accent-black" />
                          <span className={`min-w-0 flex-1 ${done ? 'text-gray-400 line-through' : ''}`}>
                            <span className="flex justify-between gap-2">
                              <span className="font-medium">{it.name}</span>
                              {it.price !== undefined && <span className="shrink-0">약 {num(it.price)}원</span>}
                            </span>
                            <span className="block text-sm text-gray-500">
                              {it.saleLabel} × {it.packs} · 필요 {num(it.need)}
                              {it.unit}
                              {it.leftover > 0 && ` · ${num(it.leftover)}${it.unit} 남음`}
                            </span>
                            {/* D3 같은 재료를 여러 메뉴에 나눠 쓴다 */}
                            {it.usedBy.length > 1 && <span className="block text-sm text-gray-500">{it.usedBy.join(', ')}에 함께 써요</span>}
                          </span>
                        </label>
                        {/* G1 재료별 쿠팡 검색. 체크 상자와 겹치지 않게 label 밖에 둔다 */}
                        <a
                          href={coupangLink(it.id)}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          aria-label={`${it.name} 쿠팡에서 찾기`}
                          className="m-2 mt-2.5 shrink-0 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium"
                        >
                          쿠팡
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}

          {list.inPantry.length > 0 && (
            <details className="rounded-xl border border-gray-200 px-4 py-3">
              <summary className="cursor-pointer text-sm">집에 있어서 뺀 양념 {list.inPantry.length}개</summary>
              <p className="mt-2 text-sm text-gray-500">{list.inPantry.map((id) => ingredients[id].name).join(', ')}</p>
            </details>
          )}
        </>
      )}

      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-gray-100 bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">예상 금액 합계</span>
          <span className="text-xl font-bold">약 {num(list.total)}원</span>
        </div>
        {/* D4 참가격 연동 전 가짜 가격, G2 수수료 고지 */}
        <p className="mt-1 text-xs text-gray-400">임시 가격 데이터로 계산한 추정치예요. 실제 가격과 다를 수 있어요.</p>
        {COUPANG_NOTICE && <p className="mt-1 text-xs text-gray-400">{COUPANG_NOTICE}</p>}
      </div>
    </main>
  )
}
