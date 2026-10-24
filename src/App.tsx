import { useEffect, useState } from 'react'
import BottomNav, { type Tab } from './components/BottomNav'
import HomeHeader, { type View } from './components/HomeHeader'
import PlanSwitch from './components/PlanSwitch'
import StorageTab from './components/StorageTab'
import { addHidden, defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import type { Recipe } from './data/recipes'
import { followingPeriod, toISO } from './lib/dates'
import { filterCandidates, maxMenus } from './lib/menu'
import { budgetOf, budgetVersion } from './lib/budget'
import { buildMenuOptions, type MenuOption } from './lib/options'
import { servingsOf } from './lib/shopping'
import { ingredients } from './data/ingredients'
import {
  clearSavedData,
  confirmPlan,
  currentPlan,
  droppedChecks,
  livePlans,
  loadPlans,
  planConditions,
  planCookDate,
  planOverlapping,
  savePlans,
  storePlan,
  upcomingPlan,
  type Plan,
} from './plan'
import InputScreen from './screens/InputScreen'
import MenuScreen from './screens/MenuScreen'
import RecipeScreen from './screens/RecipeScreen'
import SetupScreen from './screens/SetupScreen'
import ShoppingScreen from './screens/ShoppingScreen'
import ThisWeekScreen from './screens/ThisWeekScreen'
import { NAV_SPACE, toggle } from './ui'

// U02 저장된 조건이 있으면 불러와 홈으로(U03), 없으면 처음 설정부터(U04) (I2)
const openedOn = toISO(new Date())
const saved = loadConditions(openedOn)
// I2 확정한 계획(B13 지금 먹는 계획과 다음 계획). 날짜가 없는 예전 저장값은 지금 조건으로 채운다
const savedPlans = livePlans(loadPlans(saved ?? defaultConditions(openedOn)), openedOn)

// 다음 주 탭에서 고치는 중인 메뉴와 그 조건. 확정한 다음 계획이 있으면 그 계획으로 시작한다
type Draft = { c: Conditions; menu: Recipe[]; options: MenuOption[] }
const draftOf = (p: Plan | null, c: Conditions): Draft | null => (p ? { c: planConditions(p, c), menu: p.menu, options: [] } : null)

export default function App() {
  // 자정을 넘겨 열어 둔 탭도 맞도록, 탭으로 돌아올 때 오늘을 다시 구한다
  const [today, setToday] = useState(openedOn)
  useEffect(() => {
    const refresh = () => setToday(toISO(new Date()))
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  const [conditions, setConditions] = useState(saved ?? defaultConditions(openedOn))
  const [setup, setSetup] = useState(!saved)
  const [plans, setPlans] = useState(savedPlans)
  // I8 하단 메뉴 탭과, 어느 탭에서든 여는 레시피 상세(하위 화면)
  const [tab, setTab] = useState<Tab>('week')
  const [recipe, setRecipe] = useState<{ r: Recipe; servings: number } | null>(null)
  // B13 홈은 먹는 계획이 있으면 이번 주, 없으면 다음 주로 연다
  const [view, setView] = useState<View>(currentPlan(savedPlans, openedOn) ? 'this' : 'next')
  const [draft, setDraft] = useState(() => draftOf(upcomingPlan(savedPlans, openedOn), saved ?? defaultConditions(openedOn)))
  const [draftInput, setDraftInput] = useState<Conditions | null>(null) // 메뉴에서 조건으로 돌아갔을 때의 조건
  // 장보기는 살 계획(다음 주), 보관은 먹는 계획(이번 주)을 먼저 보여 준다
  const [shopView, setShopView] = useState<View>('next')
  const [storeView, setStoreView] = useState<View>('this')

  const live = livePlans(plans, today)
  const current = currentPlan(live, today)
  const upcoming = upcomingPlan(live, today)
  // 고치던 다음 계획이 먹는 날이 되어 이번 주로 넘어갔으면 다음 주 탭에서는 내린다
  const next = draft && current && draft.c.dates[0] === current.dates[0] ? null : draft

  const save = (c: Conditions) => {
    saveConditions(c)
    setConditions(c)
  }
  const updatePlans = (next: Plan[]) => {
    savePlans(next)
    setPlans(next)
  }
  const replacePlan = (old: Plan, p: Plan) => updatePlans(live.map((x) => (x === old ? p : x)))
  // B8 이미 산 재료를 쓸 곳이 없어지면 확인을 받는다
  const okToDrop = (next: Recipe[], c: Conditions) => {
    const dropped = droppedChecks(planOverlapping(live, c), next, c)
    return !dropped.length || window.confirm(`이미 산 ${dropped.map((id) => ingredients[id].name).join(', ')}를 쓸 곳이 없어요. 그래도 메뉴를 바꿀까요?`)
  }
  const openRecipe = (list: Recipe[], c: Conditions) => (r: Recipe) => setRecipe({ r, servings: servingsOf(list, c)[list.indexOf(r)] ?? c.people })
  const goTab = (t: Tab) => {
    setRecipe(null)
    setTab(t)
  }
  const planNext = () => {
    setView('next')
    goTab('week')
  }

  // I6 내 데이터 지우기
  const reset = () => {
    clearSavedData()
    setConditions(defaultConditions(today))
    setPlans([])
    setDraft(null)
    setDraftInput(null)
    setRecipe(null)
    setTab('week')
    setSetup(true)
  }

  if (setup)
    return (
      <SetupScreen
        today={today}
        initial={conditions}
        onDone={(c) => {
          save(c)
          setSetup(false)
          setView('next')
        }}
      />
    )

  // 다음 주 조건 화면의 날짜: 먹는 계획이 있으면 그다음 기간(U33), 없으면 저장한 날짜
  const nextInput = draftInput ?? (current ? { ...conditions, dates: followingPeriod(current.dates, today) } : conditions)
  const header = <HomeHeader view={view} onView={setView} dates={view === 'this' ? current?.dates : (next?.c.dates ?? nextInput.dates)} />

  const pick = (v: View) => (v === 'this' ? current : upcoming) ?? upcoming ?? current
  const switchFor = (v: View, onChange: (v: View) => void) => (current && upcoming ? <PlanSwitch value={v} onChange={onChange} /> : null)
  const empty = (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-surface px-5 text-center">
      <p className="font-semibold">아직 확정한 메뉴가 없어요</p>
      <button type="button" onClick={planNext} className="rounded-xl bg-ink px-5 py-3 font-semibold text-white">
        메뉴 만들기
      </button>
    </main>
  )

  let page
  if (recipe) page = <RecipeScreen recipe={recipe.r} servings={recipe.servings} onBack={() => setRecipe(null)} />
  else if (tab === 'settings')
    page = <InputScreen key="settings" today={today} initial={conditions} onChange={save} onReset={reset} />
  else if (tab === 'storage') {
    const p = pick(storeView)
    page = !p ? (
      empty
    ) : (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-surface px-5 pt-4">
        {switchFor(p === current ? 'this' : 'next', setStoreView)}
        <h1 className="text-[26px] font-bold">보관</h1>
        <StorageTab
          today={today}
          dates={p.dates}
          menu={p.menu}
          cookDate={planCookDate(p)}
          onCookDateChange={(cookDate) => replacePlan(p, { ...p, cookDate })}
          skipped={p.skipped}
          onToggleSkip={(d) => replacePlan(p, { ...p, skipped: toggle(p.skipped, d) })}
        />
      </main>
    )
  } else if (tab === 'shopping') {
    const p = pick(shopView)
    const pc = p && planConditions(p, conditions)
    page =
      !p || !pc ? (
        empty
      ) : (
        <ShoppingScreen
          key={p.dates[0]}
          top={switchFor(p === current ? 'this' : 'next', setShopView)}
          today={today}
          period={p === current ? '이번 주' : '다음 주'}
          conditions={pc}
          cookDate={planCookDate(p)}
          onCookDateChange={(cookDate) => replacePlan(p, { ...p, cookDate })}
          menu={p.menu}
          checked={p.checked}
          onToggle={(id) => replacePlan(p, { ...p, checked: toggle(p.checked, id) })}
          onOpenRecipe={openRecipe(p.menu, pc)}
          onBudgetChange={(budget) => save({ ...conditions, budget })}
          // U25 교체 제안 적용: 새 메뉴가 쓰지 않는 재료의 구매 체크만 지운다(B8). 먹기 시작한 계획은 바꾸지 않는다(B13)
          onApplySwap={
            p === upcoming
              ? (next) => {
                  if (!okToDrop(next, pc)) return
                  replacePlan(p, confirmPlan(p, next, pc))
                  setDraft((d) => d && { ...d, menu: next })
                }
              : undefined
          }
          extras={p.extras}
          onExtrasChange={(extras) => replacePlan(p, { ...p, extras })}
          onBuyOwned={(id) => replacePlan(p, { ...p, owned: p.owned.filter((x) => x !== id) })}
        />
      )
  } else if (view === 'this') page = <ThisWeekScreen header={header} plan={current} onOpenRecipe={current ? openRecipe(current.menu, planConditions(current, conditions)) : () => {}} onPlanNext={() => setView('next')} />
  else if (draft) {
    const d = draft
    page = (
      <MenuScreen
        header={header}
        conditions={d.c}
        menu={d.menu}
        options={d.options}
        onChange={(menu) => setDraft({ ...d, menu })}
        onOpenRecipe={openRecipe(d.menu, d.c)}
        onBack={() => {
          setDraftInput(d.c)
          setDraft(null)
        }}
        onHide={(id) => {
          const hidden = addHidden(conditions.hidden, id)
          save({ ...conditions, hidden })
          setDraft((cur) => cur && { ...cur, c: { ...cur.c, hidden } })
        }}
        onConfirm={() => {
          if (!okToDrop(d.menu, d.c)) return
          // A4 사용자가 추가·삭제로 개수를 바꿨을 때만 다음에 그 개수로 시작한다(끼니 수 상한으로 줄어든 경우 제외)
          const start = Math.min(d.c.menuCount, maxMenus(d.c, filterCandidates(d.c)))
          // A12 이 메뉴에 쓰는 집에 있는 재료는 다 쓴다고 보고, 다음 주 조건에서 뺀다(안 쓰는 재료는 남긴다)
          const used = new Set(d.menu.flatMap((r) => r.ingredients.map((i) => i.id)))
          const owned = conditions.owned.filter((id) => !used.has(id))
          if (d.menu.length !== start || owned.length !== conditions.owned.length)
            save({ ...conditions, owned, menuCount: d.menu.length !== start ? d.menu.length : conditions.menuCount })
          // 날짜·인원이 그대로면 조리일과 새 메뉴가 쓰는 재료의 구매 체크를 이어 쓰고, 바뀌었으면 비운다
          updatePlans(storePlan(live, confirmPlan(planOverlapping(live, d.c), d.menu, d.c), today))
          setShopView('next')
          goTab('shopping')
        }}
      />
    )
  } else
    page = (
      <InputScreen
        key={`next-${nextInput.dates.join()}`}
        header={header}
        today={today}
        initial={nextInput}
        onReset={reset}
        onSubmit={(c) => {
          setDraftInput(null)
          save(c)
          // U11 버전 A면 예산 안 조합(U12)으로, 아니면 예산 없이 추천안을 만들고 첫 추천안으로 시작한다
          const { options } = buildMenuOptions(c, budgetVersion() === 'A' ? budgetOf(c) : undefined)
          setDraft({ c, menu: options[0]?.menu ?? [], options })
        }}
      />
    )

  return (
    <div className={NAV_SPACE}>
      {page}
      <BottomNav tab={tab} onChange={goTab} />
    </div>
  )

}
