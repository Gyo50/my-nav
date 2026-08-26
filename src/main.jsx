/**
 * main.jsx
 * ─────────────────────────────────────────────────────────────
 * React 앱 진입점 + 서비스 워커 등록 (PWA)
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// ── 서비스 워커 등록 (PWA 핵심)
// 브라우저가 서비스 워커를 지원할 때만 등록합니다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('✅ 서비스 워커 등록 완료'))
      .catch((err) => console.error('❌ 서비스 워커 등록 실패:', err))
  })
}
