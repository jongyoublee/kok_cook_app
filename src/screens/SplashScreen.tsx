// I11 시작 화면. 열 때마다 로고 애니메이션(시안 B 봉우리 부풀기, index.css)을 잠깐 보여 주고 넘어간다.
// 누르면 바로 넘어간다. 움직임 줄이기 설정과 상관없이 애니메이션을 보여 준다(2026-10-25 사용자 결정)
import { useEffect } from 'react'
import { HatIcon } from '../components/Logo'
import { config } from '../config'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, config.splash.ms)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <main onClick={onDone} className="relative mx-auto flex min-h-dvh max-w-md cursor-pointer flex-col items-center justify-center gap-3 bg-surface">
      <span className="splash-hat">
        <HatIcon size={88} />
      </span>
      <h1 aria-label="KokCook" className="font-wordmark text-[34px] font-extrabold tracking-[-0.03em] text-ink">
        {'KokCook'.split('').map((ch, i) => (
          <span key={i} aria-hidden className="splash-letter" style={{ animationDelay: `${1.15 + i * 0.06}s` }}>
            {ch}
          </span>
        ))}
      </h1>
      <p className="splash-fade absolute bottom-[max(2rem,env(safe-area-inset-bottom))] text-xs text-sub">일주일 저녁, 한 번에 장보기</p>
    </main>
  )
}
