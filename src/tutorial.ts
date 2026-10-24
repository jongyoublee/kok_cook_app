// I10 사용법 안내를 본 적이 있는지 기기에 저장한다. 내 데이터 지우기(I6)로도 지우지 않는다(다시 보기는 내 설정에서)
import { storageOrNull, type KV } from './conditions'

export const TUTORIAL_KEY = 'kokcook.tutorialSeen'

export function tutorialSeen(storage = storageOrNull()): boolean {
  try {
    return storage?.getItem(TUTORIAL_KEY) === '1'
  } catch {
    return false
  }
}

export function markTutorialSeen(storage: KV | null = storageOrNull()) {
  try {
    storage?.setItem(TUTORIAL_KEY, '1')
  } catch {
    // 저장 공간이 막힌 환경에서는 다음에 다시 보여준다
  }
}
