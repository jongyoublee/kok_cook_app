import { useState } from 'react'
import { defaultConditions, loadConditions, saveConditions, type Conditions } from './conditions'
import { toISO } from './lib/dates'
import InputScreen from './screens/InputScreen'

const today = toISO(new Date())
// U02 저장된 조건이 있으면 불러온다 (I2)
const saved = loadConditions(today)

export default function App() {
  const [submitted, setSubmitted] = useState<Conditions | null>(null)

  // 메뉴 구성 화면은 3단계에서 만든다
  if (submitted)
    return (
      <main className="mx-auto max-w-md p-4">
        <p>메뉴 구성은 다음 단계에서 준비 중이에요.</p>
        <button type="button" className="mt-4 underline" onClick={() => setSubmitted(null)}>조건으로 돌아가기</button>
      </main>
    )

  return (
    <InputScreen
      today={today}
      initial={saved ?? defaultConditions(today)}
      restored={saved !== null}
      onSubmit={(c) => {
        saveConditions(c)
        setSubmitted(c)
      }}
    />
  )
}
