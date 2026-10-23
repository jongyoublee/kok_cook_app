// E1~E4 보관 안내 (와이어프레임 6). 장보기 화면의 "보관 방법" 탭
import { config } from '../config'
import type { Recipe } from '../data/recipes'
import { formatDay, type ISODate } from '../lib/dates'
import { cookDateOptions, schedule, thawDate } from '../lib/storagePlan'

type Props = {
  today: ISODate
  dates: ISODate[]
  menu: Recipe[]
  cookDate: ISODate
  onCookDateChange: (d: ISODate) => void
  skipped: ISODate[] // B9 안 먹는 날
  onToggleSkip: (d: ISODate) => void
}

export default function StorageTab({ today, dates, menu, cookDate, onCookDateChange, skipped, onToggleSkip }: Props) {
  const slots = schedule(menu, dates, cookDate, config.storageSplit, skipped)
  const skippedDays = dates.filter((d) => skipped.includes(d))
  const options = cookDateOptions(today, dates)
  const { fridgeMaxC, freezerMaxC, provisional } = config.foodSafety
  const tooLong = slots.filter((s) => s.tooLong)

  return (
    <div className="flex flex-col gap-6">
      {/* E1 조리일은 이 화면에서만 바꾼다 */}
      <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
        <span className="font-semibold">조리일</span>
        <select
          value={cookDate}
          onChange={(e) => onCookDateChange(e.target.value)}
          disabled={options.length < 2}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2"
        >
          {(options.includes(cookDate) ? options : [cookDate, ...options]).map((d) => (
            <option key={d} value={d}>
              {formatDay(d)}
            </option>
          ))}
        </select>
      </label>

      {tooLong.length > 0 && (
        <p className="rounded-xl border border-black px-4 py-3 text-sm">
          냉동하기 어려운 메뉴가 냉장 보관 기간을 넘어요({tooLong.map((s) => formatDay(s.date)).join(', ')}). 메뉴를 바꾸거나 날짜를 줄여 주세요.
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">날짜별 보관</h2>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {slots.map((s) => (
            <li key={s.date} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-gray-500">{formatDay(s.date)}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${s.place === 'freezer' ? 'bg-black text-white' : 'border border-gray-300'}`}>
                  {s.place === 'freezer' ? '냉동' : '냉장'}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.recipe.name}</span>
                {/* B9 외식 등으로 안 먹는 날. 남은 끼니가 하나면 뺄 수 없다 */}
                <button type="button" onClick={() => onToggleSkip(s.date)} disabled={slots.length <= 1} className="shrink-0 text-xs text-gray-400 underline underline-offset-2 disabled:no-underline disabled:opacity-40">
                  안 먹어요
                </button>
              </div>
              {/* E3 해동 할 일 */}
              {s.place === 'freezer' && (
                <p className="mt-1 pl-[92px] text-sm text-gray-500">
                  {formatDay(thawDate(s))} 밤에 냉장실로 옮기기
                </p>
              )}
            </li>
          ))}
        </ul>
        {skippedDays.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            안 먹는 날:{' '}
            {skippedDays.map((d) => (
              <button key={d} type="button" onClick={() => onToggleSkip(d)} className="mr-2 underline underline-offset-2">
                {formatDay(d)} 되돌리기
              </button>
            ))}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">해동한 음식은 속까지 충분히 데워 먹고, 다시 얼리지 마세요.</p>
      </section>

      {/* E4 공식 기준 확인 전 임시값 */}
      <section className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
        <h2 className="mb-1 font-semibold">보관 온도</h2>
        <ul className="list-disc pl-5 text-gray-600">
          <li>냉장 {fridgeMaxC}℃ 이하, 냉동 {freezerMaxC}℃ 이하</li>
          <li>조리 후 상온에 두지 않기</li>
        </ul>
        {provisional && <p className="mt-2 text-xs text-gray-400">보관 온도와 일수는 공식 기준 확인 전 임시값이에요.</p>}
      </section>
    </div>
  )
}
