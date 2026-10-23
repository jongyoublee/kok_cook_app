// 화면 공통 스타일
export const primaryButton = 'w-full rounded-xl bg-black py-4 font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400'

// I3
export const ADVICE = '질환이 있거나 식사 제한이 필요하면 전문가와 상담하세요.'

// I5 면책 문구: 재료 선택은 알레르기 차단 기능이 아니고, 영양 수치는 대략치다
export const ALLERGY_NOTE = '먹고 싶은 재료를 고르는 기능이에요. 알레르기가 있다면 레시피의 재료를 꼭 직접 확인해 주세요.'
export const NUTRITION_NOTE = '영양 수치는 일반 재료 자료로 계산한 대략치예요.'

// 숫자와 금액 표시
export const num = (n: number) => n.toLocaleString('ko-KR')
export const won = (n: number) => `${num(n)}원`

export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
