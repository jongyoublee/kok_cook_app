// A2 식사 날짜 계산. 날짜는 기기 현지 시간 기준 'YYYY-MM-DD' 문자열로 다룬다(문자열 정렬 = 날짜 정렬).
import { config } from '../config'

export type ISODate = string

const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export const daysBetween = (a: ISODate, b: ISODate) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000)

// 월요일 시작 기준 요일 (월=0 ... 일=6)
export const mondayIndex = (s: ISODate) => (fromISO(s).getDay() + 6) % 7

// A2 빠른 선택: 다음 주 평일(월~금) 또는 다음 주 매일(월~일)
export function nextWeek(today: ISODate, weekdaysOnly: boolean): ISODate[] {
  const monday = addDays(today, 7 - mondayIndex(today))
  return Array.from({ length: weekdaysOnly ? 5 : 7 }, (_, i) => addDays(monday, i))
}

// 조리일은 첫 식사일 전날로 가정한다
export const cookDay = (dates: ISODate[]): ISODate | null => (dates.length ? addDays([...dates].sort()[0], -1) : null)

export const formatDay = (s: ISODate) => {
  const d = fromISO(s)
  return `${d.getMonth() + 1}/${d.getDate()}(${'일월화수목금토'[d.getDay()]})`
}

// 지난 날짜는 선택 불가, 선택 해제는 항상 가능, 최대 기간은 config.maxSelectMode 해석을 따른다
export function canSelect(date: ISODate, selected: ISODate[], today: ISODate): boolean {
  if (selected.includes(date)) return true
  if (date < today) return false
  if (config.maxSelectMode === 'count') return selected.length < config.maxSelectDays
  const all = [...selected, date].sort()
  return daysBetween(all[0], all[all.length - 1]) + 1 <= config.maxSelectDays
}
