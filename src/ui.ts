// 화면 공통 스타일
export const primaryButton = 'w-full rounded-xl bg-ink py-4 font-semibold text-white disabled:bg-line disabled:text-sub'

// I3
export const ADVICE = '질환이 있거나 식사 제한이 필요하면 전문가와 상담하세요.'

// I5 면책 문구: 재료 선택은 알레르기 차단 기능이 아니고, 영양 수치는 대략치다
export const ALLERGY_NOTE = '먹고 싶은 재료를 고르는 기능이에요. 알레르기가 있다면 레시피의 재료를 꼭 직접 확인해 주세요.'
export const NUTRITION_NOTE = '영양 수치는 일반 재료 자료로 계산한 대략치예요.'

// 숫자와 금액 표시
export const num = (n: number) => n.toLocaleString('ko-KR')
export const won = (n: number) => `${num(n)}원`

export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

// I9 셰프 모자 아이콘의 크기별 선 굵기(viewBox 24 단위, 몸통 / 띠). 작을수록 굵게 해 뭉개지지 않게 한다. 최소 18px
export function hatStroke(size: number): [body: number, band: number] {
  if (size >= 64) return [1.6, 2.1]
  if (size >= 40) return [1.7, 2.1]
  if (size > 24) return [1.9, 2.4]
  return [2.2, 2.8]
}

// I8 떠 있는 하단 메뉴 자리. 화면 아래 여백과, 하단 고정 버튼을 메뉴 바로 위에 쌓는 위치
export const NAV_SPACE = 'pb-[calc(96px+env(safe-area-inset-bottom))]'
export const ABOVE_NAV = 'bottom-[calc(74px+env(safe-area-inset-bottom))]'
