/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────
 * 앱의 최상위 컴포넌트입니다.
 *
 * 담당 역할:
 *   1) GPS watchPosition 시작 및 관리
 *   2) 화면 전환 관리: 'list' ↔ 'map'
 *   3) 토스트 메시지 관리
 *   4) GPS 상태 / 선택된 목적지를 하위 컴포넌트에 전달
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react'
import ListScreen from './components/ListScreen'
import MapScreen  from './components/MapScreen'
import Toast      from './components/Toast'

export default function App() {
  // ── 현재 화면 상태: 'list' = 목적지 선택 화면, 'map' = 지도 화면
  const [screen, setScreen] = useState('list')

  // ── 사용자가 선택한 목적지 (destinations.js 항목 하나)
  const [dest, setDest] = useState(null)

  // ── GPS 상태
  const [gps, setGps] = useState({
    lat:   null,   // 위도
    lng:   null,   // 경도
    speed: 0,      // 속도 (km/h)
    ok:    false,  // GPS 연결 여부
  })

  // ── 토스트 메시지
  const [toast, setToast]   = useState(null)
  const toastTimer = useRef(null)  // 토스트 자동 숨김 타이머


  // ────────────────────────────────────────────────────────
  //  GPS watchPosition 시작
  //  앱 시작 시 1회 실행, 언마운트 시 clearWatch로 정리
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      showToast('이 브라우저는 GPS를 지원하지 않습니다.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      // 위치 업데이트 성공 콜백
      (pos) => {
        const { latitude: lat, longitude: lng, speed } = pos.coords
        setGps({
          lat,
          lng,
          speed: speed ? Math.round(speed * 3.6) : 0,  // m/s → km/h 변환
          ok:    true,
        })
      },
      // 위치 업데이트 실패 콜백
      (err) => {
        const msgs = {
          1: 'GPS 권한이 거부됐습니다. 브라우저 설정에서 위치 권한을 허용해주세요.',
          2: '현재 위치를 가져올 수 없습니다.',
          3: 'GPS 응답 시간이 초과됐습니다.',
        }
        showToast(msgs[err.code] || 'GPS 오류가 발생했습니다.')
      },
      {
        enableHighAccuracy: true,   // 고정밀 GPS 사용 (배터리 더 소모되지만 정확)
        timeout:            15000,  // 15초 안에 응답 없으면 오류
        maximumAge:         1000,   // 1초 이내 캐시된 위치 허용
      }
    )

    // 컴포넌트 언마운트 시 GPS 워치 해제
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])  // 최초 1회만 실행


  // ── 토스트 표시 함수
  // msg: 표시할 메시지, dur: 표시 시간(ms)
  function showToast(msg, dur = 3000) {
    clearTimeout(toastTimer.current)     // 기존 타이머 취소
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), dur)
  }

  // ── 목적지 선택 → 지도 화면으로 전환
  function handleSelect(d) {
    setDest(d)
    setScreen('map')
  }

  // ── 뒤로가기 → 목록 화면으로 전환
  function handleBack() {
    setScreen('list')
    setDest(null)
  }


  // ────────────────────────────────────────────────────────
  //  렌더링
  // ────────────────────────────────────────────────────────
  return (
    <div style={{
      width:      '100%',
      height:     '100vh',
      background: 'var(--bg)',
      display:    'flex',
      flexDirection: 'column',
      position:   'relative',
      overflow:   'hidden',
    }}>
      {/* 목적지 목록 화면 */}
      {screen === 'list' && (
        <ListScreen
          gps={gps}
          onSelect={handleSelect}
        />
      )}

      {/* 지도 + 네비게이션 화면 */}
      {screen === 'map' && dest && (
        <MapScreen
          dest={dest}
          gps={gps}
          onBack={handleBack}
          showToast={showToast}
        />
      )}

      {/* 토스트 메시지 (항상 최상단) */}
      <Toast msg={toast} />
    </div>
  )
}
