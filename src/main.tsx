import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// H1 레시피 관리 화면은 개발 서버에서 ?admin으로만 연다. 빌드에서는 DEV가 false라 이 코드와 화면이 빠진다
const admin = import.meta.env.DEV && new URLSearchParams(location.search).has('admin')
const AdminScreen = admin ? lazy(() => import('./screens/AdminScreen.tsx')) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {AdminScreen ? (
      <Suspense>
        <AdminScreen />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
