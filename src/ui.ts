// 화면 공통 스타일
export const chip = (on: boolean) =>
  `rounded-xl border px-3 py-2 ${on ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-700' : 'border-gray-300'}`

export const primaryButton = 'w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white disabled:bg-gray-300'

// I3
export const ADVICE = '질환이 있거나 식사 제한이 필요하면 전문가와 상담하세요.'

export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
