/**
 * App.jsx
 */
import { useState, useEffect, useRef } from 'react'
import ListScreen    from './components/ListScreen'
import InquiryScreen from './components/InquiryScreen'
import Toast         from './components/Toast'

export default function App() {
  // 현재 화면: 'list' | 'inquiry'
  const [screen, setScreen] = useState('list')
  const [gps,    setGps]    = useState({
    lat: null, lng: null, speed: 0, ok: false,
  })
  const [toast,    setToast]    = useState(null)
  const toastTimer = useRef(null)

  // ── GPS 시작
  useEffect(() => {
    if (!navigator.geolocation) {
      showToast('이 브라우저는 GPS를 지원하지 않습니다.')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, speed } = pos.coords
        setGps({ lat, lng, speed: speed ? Math.round(speed * 3.6) : 0, ok: true })
      },
      (err) => {
        const msgs = {
          1: 'GPS 권한이 거부됐습니다.',
          2: '현재 위치를 가져올 수 없습니다.',
          3: 'GPS 응답 시간이 초과됐습니다.',
        }
        showToast(msgs[err.code] || 'GPS 오류가 발생했습니다.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  function showToast(msg, dur = 3000) {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), dur)
  }

  return (
    <div style={{
      width: '100%', height: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 목적지 목록 화면 */}
      {screen === 'list' && (
        <ListScreen
          gps={gps}
          onInquiry={() => setScreen('inquiry')}
        />
      )}

      {/* 건의사항 화면 */}
      {screen === 'inquiry' && (
        <InquiryScreen
          onBack={() => setScreen('list')}
        />
      )}

      {/* 토스트 메시지 */}
      <Toast msg={toast} />
    </div>
  )
}