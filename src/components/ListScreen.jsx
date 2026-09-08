/**
 * ListScreen.jsx
 * - 센터 드롭다운 선택
 * - 교통수단 드롭다운 선택
 * - 길찾기 버튼 → 네이버 지도 바로 연결
 */
import { useState } from 'react'
import { DESTINATIONS } from '../data/destinations'

const TRAVEL_MODES = [
  { value: 'car', label: '🚗 자동차' },
  { value: 'walk', label: '🚶 도보' },
  { value: 'transit', label: '🚇 대중교통' },
]

export default function ListScreen({ gps, onInquiry }) {
  const [selectedDest, setSelectedDest] = useState('')  // 선택된 센터 id
  const [selectedMode, setSelectedMode] = useState('car') // 선택된 교통수단

  // 선택된 목적지 객체
  const dest = DESTINATIONS.find(d => d.id === Number(selectedDest))

  // 네이버 지도 열기
  function handleNavigate() {
    if (!dest) {
      alert('센터를 선택해주세요!')
      return
    }

    if (!gps.ok) {
      alert('GPS 위치를 가져오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const destName = encodeURIComponent(dest.name)
    const startName = encodeURIComponent('내 위치')

    // 네이버 지도 웹 URL
    const webUrl =
      `https://map.naver.com/p/directions/` +
      `${gps.lng},${gps.lat},${startName},-,COORD/` +
      `${dest.lng},${dest.lat},${destName},-,COORD/-/${selectedMode}` +
      `?c=11.00,0,0,0,dh`

    // 🚶 도보 / 🚇 대중교통
    if (selectedMode !== 'car') {
      window.open(webUrl, '_blank')
      return
    }

    // 🚗 자동차
    // 네이버 지도 앱 호출 URL
    const appUrl =
      `nmap://route/car` +
      `?slat=${gps.lat}` +
      `&slng=${gps.lng}` +
      `&sname=${startName}` +
      `&dlat=${dest.lat}` +
      `&dlng=${dest.lng}` +
      `&dname=${destName}` +
      `&appname=CS센터길찾기`

    // PC에서는 앱 URL을 사용할 필요가 없으므로 웹으로
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (!isMobile) {
      window.open(webUrl, '_blank')
      return
    }

    // 모바일에서는 네이버 앱 실행 시도
    let appOpened = false

    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true
        clearTimeout(fallbackTimer)
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        )
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    const fallbackTimer = setTimeout(() => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )

      // 앱이 열리지 않았다면 네이버 지도 웹으로 이동
      if (!appOpened) {
        window.location.href = webUrl
      }
    }, 1500)

    window.location.href = appUrl
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── 상단 헤더 */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 20px 16px',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #00c73c, #03c75a)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 4,
        }}>
          CS센터 길찾기
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          센터와 교통수단을 선택하세요
        </div>
      </div>

      {/* ── 메인 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        {/* GPS 상태 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 24,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: gps.ok ? 'var(--accent)' : 'var(--muted)',
            boxShadow: gps.ok ? '0 0 8px var(--accent)' : 'none',
            animation: gps.ok ? 'glow 2s infinite' : 'none',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 13, color: gps.ok ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>
            {gps.ok
              ? `GPS 연결됨`
              : 'GPS 위치를 가져오는 중...'}
          </span>
        </div>

        {/* 센터 선택 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
            📍 센터 찾기
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedDest}
              onChange={e => setSelectedDest(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--card)',
                border: `1.5px solid ${selectedDest ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '14px 44px 14px 16px',
                color: selectedDest ? 'var(--text)' : 'var(--muted)',
                fontSize: 15,
                fontWeight: selectedDest ? 700 : 400,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                transition: 'border-color .2s',
              }}
            >
              <option value="">센터를 선택하세요</option>
              {DESTINATIONS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.name}
                </option>
              ))}
            </select>
            {/* 화살표 아이콘 */}
            <div style={{
              position: 'absolute', right: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)', fontSize: 16, pointerEvents: 'none',
            }}>▾</div>
          </div>

          {/* 선택된 센터 주소 표시 */}
          {dest && (
            <div style={{
              marginTop: 8, padding: '8px 12px',
              background: 'rgba(0,199,60,.08)',
              border: '1px solid rgba(0,199,60,.2)',
              borderRadius: 10,
              fontSize: 12, color: 'var(--accent)',
            }}>
              📍 {dest.address}
            </div>
          )}
        </div>

        {/* 교통수단 선택 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
            🚦 교통수단
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {TRAVEL_MODES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedMode(value)}
                style={{
                  flex: 1, padding: '12px 0',
                  borderRadius: 12,
                  border: '1.5px solid ' + (selectedMode === value ? 'transparent' : 'var(--border)'),
                  background: selectedMode === value
                    ? 'linear-gradient(135deg, #00c73c, #03c75a)'
                    : 'var(--card)',
                  color: selectedMode === value ? '#fff' : 'var(--muted)',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .2s',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {value === 'car' ? '🚗' : value === 'walk' ? '🚶' : '🚇'}
                </span>
                <span>{value === 'car' ? '자동차' : value === 'walk' ? '도보' : '대중교통'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 길찾기 버튼 */}
        <button
          onClick={handleNavigate}
          disabled={!dest || !gps.ok}
          style={{
            width: '100%', padding: '16px',
            borderRadius: 16,
            background: dest && gps.ok
              ? 'linear-gradient(135deg, #00c73c, #03c75a)'
              : 'var(--card)',
            border: 'none',
            color: dest && gps.ok ? '#fff' : 'var(--muted)',
            fontSize: 16, fontWeight: 900,
            cursor: dest && gps.ok ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: dest && gps.ok ? '0 4px 20px rgba(0,199,60,.3)' : 'none',
          }}
        >
          🗺 네이버 지도로 길찾기
        </button>

        {/* 안내 문구 */}
        {(!dest || !gps.ok) && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            {!gps.ok ? '⏳ GPS 위치를 가져오는 중...' : '⬆️ 센터를 먼저 선택해주세요'}
          </div>
        )}
      </div>

      {/* ── 하단 건의사항 버튼 */}
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '12px 20px',
        flexShrink: 0,
      }}>
        <button
          onClick={onInquiry}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 12,
            background: 'rgba(251,191,36,.08)',
            border: '1px solid rgba(251,191,36,.25)',
            color: '#fbbf24',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          📬 건의사항 보내기
        </button>
      </div>
    </div>
  )
}