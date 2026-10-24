// I12 로그인 화면(화면만). 처음 실행 때 사용법 안내(I10) 앞에 한 번 보인다.
// MVP는 로그인 없이 기기에 저장한다(2026-10-23 확정). 카카오·네이버는 안내만 하고, 실제 로그인은 J11과 함께 후속
import { useState } from 'react'
import Logo from '../components/Logo'
import { primaryButton } from '../ui'

const LOGIN = 'flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold'

export default function LoginScreen({ onGuest }: { onGuest: () => void }) {
  const [soon, setSoon] = useState(false)

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface px-5">
      <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Logo vertical />
        <p className="text-[15px] text-sub">
          장보기부터 보관까지
          <br />
          일주일 저녁을 한 번에
        </p>
      </section>

      <div className="flex flex-col gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {soon && (
          <p role="status" className="mb-1 rounded-xl bg-accent-tint px-4 py-3 text-center text-sm text-warn-ink">
            곧 지원할 예정이에요. 지금은 로그인 없이 시작해 주세요.
          </p>
        )}
        {/* 버튼 색과 기호는 시안용. 실제 연동 때 각 서비스의 로그인 버튼 가이드로 바꾼다 */}
        <button type="button" onClick={() => setSoon(true)} className={`${LOGIN} bg-kakao text-black/85`}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 3.5C6.8 3.5 2.6 6.8 2.6 10.9c0 2.6 1.7 4.9 4.3 6.2l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.4 0 .9.1 1.3.1 5.2 0 9.4-3.3 9.4-7.5S17.2 3.5 12 3.5z" fill="currentColor" />
          </svg>
          카카오 로그인
        </button>
        <button type="button" onClick={() => setSoon(true)} className={`${LOGIN} bg-naver text-white`}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path d="M15.6 12.8 8.1 2H2v20h6.4V11.2L15.9 22H22V2h-6.4z" fill="currentColor" />
          </svg>
          네이버 로그인
        </button>
        <button type="button" onClick={onGuest} className={`${primaryButton} mt-2`}>
          로그인 없이 시작하기
        </button>
        <p className="mt-1 text-center text-xs text-sub">로그인하지 않아도 이 기기에 저장돼요</p>
      </div>
    </main>
  )
}
