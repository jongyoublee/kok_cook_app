import { useState } from 'react'
import { defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import type { Recipe } from './data/recipes'
import { toISO } from './lib/dates'
import { filterCandidates, initialMenu, maxMenus } from './lib/menu'
import { servingsOf } from './lib/shopping'
import { loadPlan, savePlan, type Plan } from './plan'
import InputScreen from './screens/InputScreen'
import MenuScreen from './screens/MenuScreen'
import RecipeScreen from './screens/RecipeScreen'
import SetupScreen from './screens/SetupScreen'
import ShoppingScreen from './screens/ShoppingScreen'
import { toggle } from './ui'

const today = toISO(new Date())
// U02 저장된 조건이 있으면 불러와 조건 화면으로(U03), 없으면 처음 설정부터(U04) (I2)
const saved = loadConditions(today)
// I2 확정한 메뉴와 구매 체크
const savedPlan = loadPlan()

type Screen = 'setup' | 'input' | 'menu' | 'recipe' | 'shopping'
const sameMenu = (a: Recipe[], b: Recipe[]) => a.map((r) => r.id).join() === b.map((r) => r.id).join()

export default function App() {
  const [conditions, setConditions] = useState(saved ?? defaultConditions(today))
  const [screen, setScreen] = useState<Screen>(saved ? 'input' : 'setup')
  const [menu, setMenu] = useState<Recipe[]>(savedPlan?.menu ?? []) // 추천 메뉴 화면에서 고치는 중인 메뉴
  const [plan, setPlan] = useState<Plan | null>(savedPlan) // 확정한 메뉴와 구매 체크
  const [recipe, setRecipe] = useState<{ r: Recipe; back: 'menu' | 'shopping' } | null>(null)

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
    const list = recipe.back === 'shopping' && plan ? plan.menu : menu
    return <RecipeScreen recipe={recipe.r} servings={servingsOf(list, conditions)[list.indexOf(recipe.r)] ?? conditions.people} onBack={() => setScreen(recipe.back)} />
  }

  if (screen === 'menu')
    return (
      <MenuScreen
        conditions={conditions}
        menu={menu}
        onChange={setMenu}
        onOpenRecipe={openRecipe('menu')}
        onBack={() => setScreen('input')}
        onConfirm={() => {
          // A4 사용자가 추가·삭제로 개수를 바꿨을 때만 다음에 그 개수로 시작한다(끼니 수 상한으로 줄어든 경우 제외)
          const start = Math.min(conditions.menuCount, maxMenus(conditions, filterCandidates(conditions)))
          if (menu.length !== start) save({ ...conditions, menuCount: menu.length })
          // 메뉴가 그대로면 구매 체크를 이어 쓰고, 바뀌었으면 비운다
          updatePlan({ menu, checked: plan && sameMenu(plan.menu, menu) ? plan.checked : [] })
          setScreen('shopping')
        }}
      />
    )

  if (screen === 'shopping' && plan)
    return (
      <ShoppingScreen
        conditions={conditions}
        menu={plan.menu}
        checked={plan.checked}
        onToggle={(id) => updatePlan({ ...plan, checked: toggle(plan.checked, id) })}
        onOpenRecipe={openRecipe('shopping')}
        onBack={() => {
          setMenu(plan.menu)
          setScreen('menu')
        }}
      />
    )

  return (
    <InputScreen
      today={today}
      initial={conditions}
      onOpenShopping={plan ? () => setScreen('shopping') : undefined}
      onSubmit={(c) => {
        save(c)
        setMenu(initialMenu(c))
        setScreen('menu')
      }}
    />
  )
}
