// 처음 실행 때 한 번만 보이는 화면을 지나갔는지 기기에 저장한다: I10 사용법 안내, I12 로그인 화면('로그인 없이 시작하기').
// 내 데이터 지우기(I6)로도 지우지 않는다(사용법은 내 설정에서 다시 본다)
import { storageOrNull, type KV } from './conditions'

export const TUTORIAL_KEY = 'kokcook.tutorialSeen'
export const LOGIN_KEY = 'kokcook.loginSkipped'

function isSet(key: string, storage: KV | null) {
  try {
    return storage?.getItem(key) === '1'
  } catch {
    return false
  }
}

function mark(key: string, storage: KV | null) {
  try {
    storage?.setItem(key, '1')
  } catch {
    // 저장 공간이 막힌 환경에서는 다음에 다시 보여준다
  }
}

export const tutorialSeen = (storage = storageOrNull()) => isSet(TUTORIAL_KEY, storage)
export const markTutorialSeen = (storage: KV | null = storageOrNull()) => mark(TUTORIAL_KEY, storage)
export const loginSkipped = (storage = storageOrNull()) => isSet(LOGIN_KEY, storage)
export const markLoginSkipped = (storage: KV | null = storageOrNull()) => mark(LOGIN_KEY, storage)
