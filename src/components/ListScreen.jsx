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

  const ready = dest && gps.ok

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── 상단 헤더 (한일전기 브랜드) */}
      <div style={{
        background: 'var(--accentGrad)',
        color: '#fff',
        padding: '18px 20px 22px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* 워드마크 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: '#fff',
              color: 'var(--accent)', fontWeight: 900, fontSize: 17,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>H</div>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '1.5px' }}>HANIL</span>
          </div>
          {/* GPS 상태 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,.16)', borderRadius: 20,
            padding: '5px 10px', fontSize: 11, fontWeight: 700,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: gps.ok ? '#7dffa0' : 'rgba(255,255,255,.5)',
              boxShadow: gps.ok ? '0 0 6px #7dffa0' : 'none',
            }} />
            {gps.ok ? '위치 확인됨' : '위치 확인 중'}
          </div>
        </div>
        <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
          CS센터 찾기
        </div>
        <div style={{ fontSize: 13, opacity: .85 }}>
          가까운 한일전기 서비스센터로 안내해 드립니다
        </div>
      </div>

      {/* ── 메인 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 24px' }}>

        {/* 센터 선택 */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
            <span style={stepStyle}>1</span> 서비스센터 선택
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedDest}
              onChange={e => setSelectedDest(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: `1.5px solid ${selectedDest ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '14px 44px 14px 16px',
                color: selectedDest ? 'var(--text)' : 'var(--muted)',
                fontSize: 15,
                fontWeight: selectedDest ? 700 : 400,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                transition: 'border-color .2s',
                fontFamily: 'inherit',
              }}
            >
              <option value="">센터를 선택하세요</option>
              {DESTINATIONS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {/* 화살표 아이콘 */}
            <div style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent)', fontSize: 12, pointerEvents: 'none',
            }}>▼</div>
          </div>

          {/* 선택된 센터 주소 표시 */}
          {dest && (
            <div style={{
              marginTop: 10, padding: '10px 12px',
              background: 'var(--beigeSoft)',
              borderLeft: '3px solid var(--beige)',
              borderRadius: 8,
              fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.5,
              animation: 'slideUp .2s ease',
            }}>
              <div style={{ fontSize: 11, color: 'var(--beige)', fontWeight: 700, marginBottom: 2 }}>
                센터 주소
              </div>
              {dest.address}
            </div>
          )}
        </div>

        {/* 교통수단 선택 */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
            <span style={stepStyle}>2</span> 이동 수단
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {TRAVEL_MODES.map(({ value }) => {
              const on = selectedMode === value
              return (
                <button
                  key={value}
                  onClick={() => setSelectedMode(value)}
                  style={{
                    flex: 1, padding: '12px 0',
                    borderRadius: 12,
                    border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
                    background: on ? 'var(--accentSoft)' : 'var(--surface)',
                    color: on ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .2s',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 20, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : .6 }}>
                    {value === 'car' ? '🚗' : value === 'walk' ? '🚶' : '🚇'}
                  </span>
                  <span>{value === 'car' ? '자동차' : value === 'walk' ? '도보' : '대중교통'}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 길찾기 버튼 */}
        <button
          onClick={handleNavigate}
          disabled={!ready}
          style={{
            width: '100%', padding: '16px',
            borderRadius: 14,
            background: ready ? 'var(--accentGrad)' : '#e3ded6',
            border: 'none',
            color: ready ? '#fff' : 'var(--muted)',
            fontSize: 16, fontWeight: 800,
            cursor: ready ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
            boxShadow: ready ? '0 6px 18px rgba(230,0,18,.28)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          길찾기 시작
        </button>

        {/* 안내 문구 */}
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
          {!gps.ok
            ? '현재 위치를 확인하고 있습니다...'
            : !dest
              ? '서비스센터를 먼저 선택해주세요'
              : '네이버 지도로 경로를 안내합니다'}
        </div>
      </div>

      {/* ── 하단 건의사항 버튼 */}
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={onInquiry}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid var(--charcoal)',
            color: 'var(--charcoal)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          고객 건의사항 보내기
        </button>
      </div>
    </div>
  )
}

// ── 공통 스타일
const sectionStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '16px',
  marginBottom: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
}

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 12,
}

const stepStyle = {
  width: 20, height: 20, borderRadius: '50%',
  background: 'var(--accent)', color: '#fff',
  fontSize: 11, fontWeight: 800,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
