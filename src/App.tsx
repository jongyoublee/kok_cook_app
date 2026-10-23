import { useState } from 'react'
import { defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import { toISO } from './lib/dates'
import InputScreen from './screens/InputScreen'
import MenuScreen from './screens/MenuScreen'

const today = toISO(new Date())
// U02 저장된 조건이 있으면 불러온다 (I2)
const saved = loadConditions(today)

export default function App() {
  const [conditions, setConditions] = useState(saved ?? defaultConditions(today))
  const [submitted, setSubmitted] = useState(false)

  if (submitted) return <MenuScreen conditions={conditions} onBack={() => setSubmitted(false)} />

  return (
    <InputScreen
      today={today}
      initial={conditions}
      restored={saved !== null}
      onSubmit={(c: Conditions) => {
        saveConditions(c)
        setConditions(c)
        setSubmitted(true)
      }}
    />
  )
}
