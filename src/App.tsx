import { useState } from 'react'
import { defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import { toISO } from './lib/dates'
import InputScreen from './screens/InputScreen'
import MenuScreen from './screens/MenuScreen'
import SetupScreen from './screens/SetupScreen'

const today = toISO(new Date())
// U02 저장된 설정이 있으면 불러오고(U03), 없으면 내 설정부터 묻는다(U04) (I2)
const saved = loadConditions(today)

export default function App() {
  const [conditions, setConditions] = useState(saved ?? { ...defaultConditions(today), proteins: [], carbs: [] })
  const [hasProfile, setHasProfile] = useState(saved !== null)
  const [screen, setScreen] = useState<'setup' | 'input' | 'menu'>(saved ? 'input' : 'setup')

  const save = (c: Conditions) => {
    saveConditions(c)
    setConditions(c)
  }

  if (screen === 'setup')
    return (
      <SetupScreen
        initial={conditions}
        onCancel={hasProfile ? () => setScreen('input') : undefined}
        onDone={(c) => {
          save(c)
          setHasProfile(true)
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
      onEditProfile={(c) => {
        setConditions(c)
        setScreen('setup')
      }}
      onSubmit={(c) => {
        save(c)
        setScreen('menu')
      }}
    />
  )
}
