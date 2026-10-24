// D1~D6 장보기 목록 (와이어프레임 4), G1~G3 쿠팡 링크, F2 예산 확인 (버전 B, 와이어프레임 5).
// I8 하단 메뉴의 장보기 탭. 보관 방법은 보관 탭으로 옮겼다. D11 위쪽 요약 카드(하단 고정 합계 대신)
import { useState, type ReactNode } from 'react'
import { BudgetField, CheckCircle, CostBar } from '../components/fields'
import type { Conditions } from '../conditions'
import { CORNERS, ingredients, type IngredientId } from '../data/ingredients'
import { priceOf } from '../data/prices'
import type { Recipe } from '../data/recipes'
import { budgetOf, budgetVersion, suggestSwap } from '../lib/budget'
import { COUPANG_NOTICE, coupangLink } from '../lib/coupang'
import { formatDay, type ISODate } from '../lib/dates'
import { buildShoppingList, servingsOf, shoppingText } from '../lib/shopping'
import { cookDateOptions } from '../lib/storagePlan'
import type { Extra } from '../plan'
import { EYEBROW, num } from '../ui'

type Props = {
  top?: ReactNode // B13 이번 주·다음 주 계획 고르기
  today: ISODate
  period: string // '이번 주' 또는 '다음 주'
  conditions: Conditions
  cookDate: ISODate
  onCookDateChange: (d: ISODate) => void
  menu: Recipe[]
  checked: IngredientId[]
  onToggle: (id: IngredientId) => void
  onOpenRecipe: (r: Recipe) => void
  onBudgetChange: (budget: number) => void
  onApplySwap?: (menu: Recipe[]) => void // 먹기 시작한 계획(이번 주)은 메뉴를 바꾸지 않아 없다
  extras: Extra[] // D9 직접 추가한 항목
  onExtrasChange: (extras: Extra[]) => void
}

export default function ShoppingScreen(props: Props) {
  const { top, today, period, conditions: c, cookDate, onCookDateChange, menu, checked, onToggle, onOpenRecipe, onBudgetChange, onApplySwap, extras, onExtrasChange } = props
  const [keep, setKeep] = useState(false) // F2 "그대로 진행"을 누르면 교체 제안을 닫는다
  const [draftExtra, setDraftExtra] = useState('') // D9 입력 중인 항목
  const [shared, setShared] = useState('') // D10 공유 결과 안내
  const list = buildShoppingList(menu, servingsOf(menu, c), c.pantry, priceOf)
  const left = list.items.filter((it) => !checked.includes(it.id)).length
  const seasoningCost = list.items.filter((it) => it.corner === '양념').reduce((s, it) => s + (it.price ?? 0), 0)
  const versionB = budgetVersion() === 'B'
  const budget = budgetOf(c)
  const cookOptions = cookDateOptions(today, c.dates)
  const suggestion = versionB && onApplySwap && !keep && list.total > budget ? suggestSwap(menu, c) : null

  const share = async () => {
    const text = shoppingText(`장보기 목록 (${formatDay(cookDate)} 조리 전까지)`, list, checked, extras)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShared('복사했어요')
    } catch {
      setShared('공유하지 못했어요')
    }
  }
  const addExtra = () => {
    const name = draftExtra.trim()
    if (!name) return
    onExtrasChange([...extras, { name, done: false }])
    setDraftExtra('')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-surface px-5 pt-4">
      {top}

      <section>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">장보기</h1>
          {/* D10 공유 기능이 있으면 공유 창, 없으면 복사 */}
          <button type="button" onClick={share} className="rounded-full border border-line px-3 py-1.5 text-sm">
            목록 공유
          </button>
        </div>
        {shared && <p className="text-right text-sm text-sub">{shared}</p>}
        {/* D11 부제의 장보기 날짜(= 조리일)를 바로 고친다. 보관 탭의 조리일과 같은 값 */}
        <p className="mt-1 text-sm text-sub">
          {period} · {formatDay(c.dates[0])}~{formatDay(c.dates[c.dates.length - 1])} ·{' '}
          <label className="relative inline-block font-semibold text-ink">
            {formatDay(cookDate)} 장보기 ✎
            <select
              value={cookDate}
              onChange={(e) => onCookDateChange(e.target.value)}
              aria-label="장보기 날짜"
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {(cookOptions.includes(cookDate) ? cookOptions : [cookDate, ...cookOptions]).map((d) => (
                <option key={d} value={d}>
                  {formatDay(d)}
                </option>
              ))}
            </select>
          </label>
        </p>

        {/* D11 요약 카드: 큰 예상 금액, 구매 진행, 가격 계산 방법 */}
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <p className={EYEBROW}>
            {formatDay(c.dates[0])} ~ {formatDay(c.dates[c.dates.length - 1])}
          </p>
          <p className="mt-1 text-[28px] font-bold tabular-nums">약 {num(list.total)}원</p>
          <p className="mt-2 text-sm text-sub">
            {list.items.length}개 중 {list.items.length - left}개 샀어요
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin={0} aria-valuemax={list.items.length} aria-valuenow={list.items.length - left} aria-label="구매 진행">
            <div className="h-full rounded-full bg-ink" style={{ width: `${list.items.length ? ((list.items.length - left) / list.items.length) * 100 : 0}%` }} />
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold">가격은 이렇게 계산해요</summary>
            {/* D4 참가격 연동 전 가짜 가격, D8 정가 기준 추정, D7 양념은 여러 주, G2 수수료 고지 */}
            <p className="mt-2 text-sub">할인 전 정가 기준 추정치라 실제 결제 금액은 대개 이보다 적어요. 지금은 임시 가격 데이터예요.</p>
            {seasoningCost > 0 && <p className="mt-1 text-sub">이 중 양념 약 {num(seasoningCost)}원은 한 번 사면 여러 주 써요.</p>}
            {COUPANG_NOTICE && <p className="mt-1 text-sub">{COUPANG_NOTICE}</p>}
          </details>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {menu.map((r) => (
            <button key={r.id} type="button" onClick={() => onOpenRecipe(r)} className="rounded-full border border-line px-3 py-1 text-sm">
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
            <p className="text-sm text-sub">메뉴를 바꿔서 줄일 수 있는 조합이 없어요. 메뉴 수를 줄이거나 집에 있는 양념을 확인해 보세요.</p>
          )}
          {suggestion && (
            <div className="rounded-xl border border-ink px-4 py-3">
              <p className="font-semibold">교체 제안</p>
              <p className="mt-1 text-sm">
                {suggestion.from.name} → {suggestion.to.name}로 바꾸면 약 {num(suggestion.saving)}원 줄어요.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium">
                <button type="button" onClick={() => setKeep(true)} className="rounded-lg border border-line py-2">
                  그대로 진행
                </button>
                <button type="button" onClick={() => onApplySwap?.(suggestion.menu)} className="rounded-lg bg-ink py-2 text-white">
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
            <h2 className={`${EYEBROW} mb-2`}>
              {corner}
              {corner === '양념' && <span className="ml-2 font-semibold tracking-normal">한 번 사면 오래 써요</span>}
            </h2>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {items.map((it) => {
                const done = checked.includes(it.id)
                return (
                  <li key={it.id} className="flex items-start">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 py-3 pl-4">
                      <CheckCircle checked={done} onChange={() => onToggle(it.id)} />
                      <span className={`min-w-0 flex-1 ${done ? 'text-sub line-through' : ''}`}>
                        <span className="flex justify-between gap-2">
                          <span className="font-medium">
                            {it.name}
                            {/* D7 양념은 한 번 사면 여러 주 쓴다 */}
                            {it.corner === '양념' && <span className="ml-1.5 rounded-full border border-line px-1.5 py-0.5 text-[11px] font-normal text-sub">오래 써요</span>}
                          </span>
                          {it.price !== undefined && <span className="shrink-0">약 {num(it.price)}원</span>}
                        </span>
                        <span className="block text-sm text-sub">
                          {it.saleLabel} × {it.packs} · 필요 {num(it.need)}
                          {it.unit}
                          {it.leftover > 0 && ` · ${num(it.leftover)}${it.unit} 남음`}
                        </span>
                        {/* D3 같은 재료를 여러 메뉴에 나눠 쓴다 */}
                        {it.usedBy.length > 1 && <span className="block text-sm text-sub">{it.usedBy.join(', ')}에 함께 써요</span>}
                      </span>
                    </label>
                    {/* G1 재료별 쿠팡 검색. 체크 상자와 겹치지 않게 label 밖에 둔다 */}
                    <a
                      href={coupangLink(it.id)}
                      target="_blank"
                      rel="noopener sponsored"
                      aria-label={`${it.name} 쿠팡에서 찾기`}
                      className="m-2 mt-2.5 shrink-0 rounded-lg border border-line px-2 py-1 text-xs font-medium"
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

      {/* D9 메뉴와 관계없이 살 물건 */}
      <section>
        <h2 className={`${EYEBROW} mb-2`}>직접 추가</h2>
        {extras.length > 0 && (
          <ul className="mb-2 divide-y divide-line rounded-xl border border-line">
            {extras.map((e, i) => (
              <li key={i} className="flex items-center gap-3 py-3 pr-2 pl-4">
                <CheckCircle checked={e.done} onChange={() => onExtrasChange(extras.with(i, { ...e, done: !e.done }))} label={`${e.name} 샀어요`} />
                <span className={`min-w-0 flex-1 ${e.done ? 'text-sub line-through' : ''}`}>{e.name}</span>
                <button type="button" onClick={() => onExtrasChange(extras.filter((_, j) => j !== i))} aria-label={`${e.name} 지우기`} className="p-2 text-sub">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(ev) => {
            ev.preventDefault()
            addExtra()
          }}
          className="flex gap-2"
        >
          <input
            value={draftExtra}
            onChange={(ev) => setDraftExtra(ev.target.value)}
            placeholder="예: 휴지, 우유"
            aria-label="장보기 항목 직접 추가"
            className="min-w-0 flex-1 rounded-xl border border-line px-4 py-2"
          />
          <button type="submit" disabled={!draftExtra.trim()} className="rounded-xl border border-ink px-4 py-2 text-sm font-semibold disabled:opacity-30">
            추가
          </button>
        </form>
      </section>

      {list.inPantry.length > 0 && (
        <details className="rounded-xl border border-line px-4 py-3">
          <summary className="cursor-pointer text-sm">집에 있어서 뺀 양념 {list.inPantry.length}개</summary>
          <p className="mt-2 text-sm text-sub">{list.inPantry.map((id) => ingredients[id].name).join(', ')}</p>
        </details>
      )}

    </main>
  )
}
