import { useState } from 'react'
import { defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import { toISO } from './lib/dates'
import InputScreen from './screens/InputScreen'
import MenuScreen from './screens/MenuScreen'
import SetupScreen from './screens/SetupScreen'

const today = toISO(new Date())
// U02 저장된 조건이 있으면 불러와 조건 화면으로(U03), 없으면 처음 설정부터(U04) (I2)
const saved = loadConditions(today)

export default function App() {
  // 처음 설정은 단백질·탄수화물을 비운 채 시작해 직접 고르게 한다
  const [conditions, setConditions] = useState(saved ?? { ...defaultConditions(today), proteins: [], carbs: [] })
  const [screen, setScreen] = useState<'setup' | 'input' | 'menu'>(saved ? 'input' : 'setup')

  const save = (c: Conditions) => {
    saveConditions(c)
    setConditions(c)
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

  if (screen === 'menu')
    return (
      <MenuScreen
        conditions={conditions}
        onBack={() => setScreen('input')}
        onMenuCountChange={(menuCount) => save({ ...conditions, menuCount })}
      />
    )

  return (
    <InputScreen
      today={today}
      initial={conditions}
      onSubmit={(c) => {
        save(c)
        setScreen('menu')
      }}
    />
  )
}
