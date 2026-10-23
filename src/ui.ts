// 화면 공통 스타일
export const primaryButton = 'w-full rounded-xl bg-black py-4 font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400'

// I3
export const ADVICE = '질환이 있거나 식사 제한이 필요하면 전문가와 상담하세요.'

// 숫자와 금액 표시
export const num = (n: number) => n.toLocaleString('ko-KR')
export const won = (n: number) => `${num(n)}원`

export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
