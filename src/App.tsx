import { useEffect, useState } from 'react'
import { addHidden, defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import type { Recipe } from './data/recipes'
import { followingPeriod, toISO } from './lib/dates'
import { filterCandidates, maxMenus } from './lib/menu'
import { budgetOf, budgetVersion } from './lib/budget'
import { buildMenuOptions, type MenuOption } from './lib/options'
import { servingsOf } from './lib/shopping'
import { ingredients } from './data/ingredients'
import { clearSavedData, confirmPlan, droppedChecks, loadPlan, planConditions, planCookDate, savePlan, type Plan } from './plan'
import InputScreen from './screens/InputScreen'
import MenuScreen from './screens/MenuScreen'
import RecipeScreen from './screens/RecipeScreen'
import SetupScreen from './screens/SetupScreen'
import ShoppingScreen from './screens/ShoppingScreen'
import { toggle } from './ui'

// U02 저장된 조건이 있으면 불러와 조건 화면으로(U03), 없으면 처음 설정부터(U04) (I2)
const openedOn = toISO(new Date())
const saved = loadConditions(openedOn)
// I2 확정한 메뉴와 구매 체크. 날짜가 없는 예전 저장값은 지금 조건으로 채운다
const savedPlan = loadPlan(saved ?? defaultConditions(openedOn))

type Screen = 'setup' | 'input' | 'menu' | 'recipe' | 'shopping'

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
  const [screen, setScreen] = useState<Screen>(saved ? 'input' : 'setup')
  const [menu, setMenu] = useState<Recipe[]>(savedPlan?.menu ?? []) // 추천 메뉴 화면에서 고치는 중인 메뉴
  const [options, setOptions] = useState<MenuOption[]>([]) // B1 추천안 3개
  const [plan, setPlan] = useState<Plan | null>(savedPlan) // 확정한 메뉴와 구매 체크
  const [recipe, setRecipe] = useState<{ r: Recipe; back: 'menu' | 'shopping' } | null>(null)
  // U33 다음 주 계획하기로 연 조건 화면의 처음 값. '메뉴 만들기' 전까지는 저장하지 않아 지금 계획의 장보기 목록이 바뀌지 않는다
  const [draft, setDraft] = useState<Conditions | null>(null)

  const save = (c: Conditions) => {
    saveConditions(c)
    setConditions(c)
  }
  const updatePlan = (p: Plan) => {
    savePlan(p)
    setPlan(p)
  }
  // B8 이미 산 재료를 쓸 곳이 없어지면 확인을 받는다
  const okToDrop = (next: Recipe[], c: Conditions) => {
    const dropped = droppedChecks(plan, next, c)
    return !dropped.length || window.confirm(`이미 산 ${dropped.map((id) => ingredients[id].name).join(', ')}를 쓸 곳이 없어요. 그래도 메뉴를 바꿀까요?`)
  }
  const openRecipe = (back: 'menu' | 'shopping') => (r: Recipe) => {
    setRecipe({ r, back })
    setScreen('recipe')
  }

  if (screen === 'setup')
    return (
      <SetupScreen
        today={today}
        initial={conditions}
        onDone={(c) => {
          save(c)
          setScreen('input')
        }}
      />
    )

  if (screen === 'recipe' && recipe) {
    const fromPlan = recipe.back === 'shopping' && plan
    const list = fromPlan ? plan.menu : menu
    const c = fromPlan ? planConditions(plan, conditions) : conditions
    return <RecipeScreen recipe={recipe.r} servings={servingsOf(list, c)[list.indexOf(recipe.r)] ?? c.people} onBack={() => setScreen(recipe.back)} />
  }

  if (screen === 'menu')
    return (
      <MenuScreen
        conditions={conditions}
        menu={menu}
        options={options}
        onChange={setMenu}
        onOpenRecipe={openRecipe('menu')}
        onBack={() => setScreen('input')}
        onHide={(id) => save({ ...conditions, hidden: addHidden(conditions.hidden, id) })}
        onConfirm={() => {
          if (!okToDrop(menu, conditions)) return
          // A4 사용자가 추가·삭제로 개수를 바꿨을 때만 다음에 그 개수로 시작한다(끼니 수 상한으로 줄어든 경우 제외)
          const start = Math.min(conditions.menuCount, maxMenus(conditions, filterCandidates(conditions)))
          if (menu.length !== start) save({ ...conditions, menuCount: menu.length })
          // 날짜·인원이 그대로면 조리일과 새 메뉴가 쓰는 재료의 구매 체크를 이어 쓰고, 바뀌었으면 비운다
          updatePlan(confirmPlan(plan, menu, conditions))
          setScreen('shopping')
        }}
      />
    )

  if (screen === 'shopping' && plan)
    return (
      <ShoppingScreen
        today={today}
        conditions={planConditions(plan, conditions)}
        cookDate={planCookDate(plan)}
        onCookDateChange={(cookDate) => updatePlan({ ...plan, cookDate })}
        menu={plan.menu}
        checked={plan.checked}
        onToggle={(id) => updatePlan({ ...plan, checked: toggle(plan.checked, id) })}
        onOpenRecipe={openRecipe('shopping')}
        onBudgetChange={(budget) => save({ ...conditions, budget })}
        onApplySwap={(next) => {
          // U25 교체 제안 적용: 새 메뉴가 쓰지 않는 재료의 구매 체크만 지운다(B8)
          const pc = planConditions(plan, conditions)
          if (!okToDrop(next, pc)) return
          setMenu(next)
          updatePlan(confirmPlan(plan, next, pc))
        }}
        onToggleSkip={(d) => updatePlan({ ...plan, skipped: toggle(plan.skipped, d) })}
        extras={plan.extras}
        onExtrasChange={(extras) => updatePlan({ ...plan, extras })}
        onBack={() => {
          setMenu(plan.menu)
          setScreen('menu')
        }}
        onPlanNext={() => {
          setDraft({ ...conditions, dates: followingPeriod(plan.dates, today) })
          setScreen('input')
        }}
      />
    )

  return (
    <InputScreen
      key={draft ? 'draft' : 'saved'}
      today={today}
      initial={draft ?? conditions}
      onOpenShopping={
        plan
          ? () => {
              setDraft(null)
              setScreen('shopping')
            }
          : undefined
      }
      onReset={() => {
        clearSavedData()
        setConditions(defaultConditions(today))
        setPlan(null)
        setMenu([])
        setOptions([])
        setDraft(null)
        setScreen('setup')
      }}
      onSubmit={(c) => {
        setDraft(null)
        save(c)
        // U11 버전 A면 예산 안 조합(U12)으로, 아니면 예산 없이 추천안을 만들고 첫 추천안으로 시작한다
        const { options } = buildMenuOptions(c, budgetVersion() === 'A' ? budgetOf(c) : undefined)
        setOptions(options)
        setMenu(options[0]?.menu ?? [])
        setScreen('menu')
      }}
    />
  )
}
