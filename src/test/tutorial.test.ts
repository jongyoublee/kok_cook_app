import { describe, expect, it } from 'vitest'
import { clearSavedData } from '../plan'
import { loginSkipped, markLoginSkipped, markTutorialSeen, tutorialSeen } from '../tutorial'

const fakeStorage = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}

describe('사용법 안내 (I10)', () => {
  it('처음에는 안 봤고, 본 뒤에는 기억한다', () => {
    const s = fakeStorage()
    expect(tutorialSeen(s)).toBe(false)
    markTutorialSeen(s)
    expect(tutorialSeen(s)).toBe(true)
  })

  it('내 데이터 지우기로는 지우지 않는다', () => {
    const s = fakeStorage()
    markTutorialSeen(s)
    clearSavedData(s)
    expect(tutorialSeen(s)).toBe(true)
  })

  it('로그인 없이 시작한 것은 따로 기억하고, 내 데이터 지우기로 지우지 않는다 (I12)', () => {
    const s = fakeStorage()
    markTutorialSeen(s)
    expect(loginSkipped(s)).toBe(false)
    markLoginSkipped(s)
    clearSavedData(s)
    expect(loginSkipped(s)).toBe(true)
  })

  it('저장 공간이 막혀도 멈추지 않는다', () => {
    const broken = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') } }
    expect(tutorialSeen(broken)).toBe(false)
    expect(() => markTutorialSeen(broken)).not.toThrow()
  })
})
