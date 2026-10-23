import { useEffect, useState } from 'react'
import { defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import type { Recipe } from './data/recipes'
import { followingPeriod, toISO } from './lib/dates'
import { filterCandidates, maxMenus } from './lib/menu'
import { budgetOf, budgetVersion } from './lib/budget'
import { buildMenuOptions, type MenuOption } from './lib/options'
import { servingsOf } from './lib/shopping'
import { confirmPlan, loadPlan, planConditions, planCookDate, savePlan, type Plan } from './plan'
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
        onConfirm={() => {
          // A4 사용자가 추가·삭제로 개수를 바꿨을 때만 다음에 그 개수로 시작한다(끼니 수 상한으로 줄어든 경우 제외)
          const start = Math.min(conditions.menuCount, maxMenus(conditions, filterCandidates(conditions)))
          if (menu.length !== start) save({ ...conditions, menuCount: menu.length })
          // 메뉴와 날짜·인원이 그대로면 구매 체크와 조리일을 이어 쓰고, 바뀌었으면 비운다
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
          // U25 교체 제안 적용: 메뉴가 바뀌므로 구매 체크는 비운다
          setMenu(next)
          updatePlan({ ...plan, menu: next, checked: [] })
        }}
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
