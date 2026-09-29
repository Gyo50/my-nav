/**
 * MapScreen.jsx
 * - 자동차 / 도보 / 대중교통 모두 네이버 지도 웹으로 연결
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { haversine } from '../utils/geo'

export default function MapScreen({ dest, gps, onBack, showToast }) {
  const mapElRef      = useRef(null)
  const mapRef        = useRef(null)
  const myMarkerRef   = useRef(null)
  const followRef     = useRef(true)

  const [follow,     setFollow]     = useState(true)
  const [travelMode, setTravelMode] = useState('driving')

  useEffect(() => { followRef.current = follow }, [follow])


  // ────────────────────────────────────────────────────────
  //  1) 지도 초기화 (내 위치 + 목적지 마커만 표시)
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const initMap = () => {
      if (!dest?.lat || !dest?.lng) return
      const naver = window.naver
      if (!naver?.maps) { setTimeout(initMap, 500); return }
      if (mapRef.current) return

      const map = new naver.maps.Map(mapElRef.current, {
        center: new naver.maps.LatLng(gps.lat ?? 37.5665, gps.lng ?? 126.9780),
        zoom: 14,
        mapTypeId: naver.maps.MapTypeId.NORMAL,
        scaleControl: false,
        logoControl: true,
        mapDataControl: false,
        zoomControl: false,
      })
      mapRef.current = map

      naver.maps.Event.addListener(map, 'dragstart', () => setFollow(false))

      // 목적지 마커
      new naver.maps.Marker({
        position: new naver.maps.LatLng(dest.lat, dest.lng),
        map,
        icon: {
          content: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="
                background:linear-gradient(135deg,#e60012,#c4000f);
                border:2.5px solid #fff;border-radius:50% 50% 50% 0;
                width:38px;height:38px;display:flex;align-items:center;
                justify-content:center;font-size:18px;
                box-shadow:0 4px 14px rgba(230,0,18,.4);transform:rotate(-45deg);">
                <span style="transform:rotate(45deg)">${dest.emoji}</span>
              </div>
              <div style="
                background:rgba(33,33,33,.92);color:#fff;font-size:11px;
                font-weight:700;padding:3px 9px;border-radius:8px;margin-top:5px;
                border:1px solid rgba(255,255,255,.15);white-space:nowrap;">
                ${dest.name}
              </div>
            </div>`,
          anchor: new naver.maps.Point(19, 57),
        },
        zIndex: 200,
      })

      // 출발지 ~ 목적지 모두 보이도록 지도 범위 조절
      if (gps.lat) {
        const bounds = new naver.maps.LatLngBounds(
          new naver.maps.LatLng(
            Math.min(gps.lat, dest.lat) - 0.01,
            Math.min(gps.lng, dest.lng) - 0.01
          ),
          new naver.maps.LatLng(
            Math.max(gps.lat, dest.lat) + 0.01,
            Math.max(gps.lng, dest.lng) + 0.01
          )
        )
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 60, left: 40 })
      }
    }

    initMap()

    return () => {
      if (mapRef.current) { mapRef.current.destroy?.(); mapRef.current = null }
      myMarkerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // ────────────────────────────────────────────────────────
  //  2) GPS 업데이트 → 내 위치 마커만 이동
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !gps.lat) return
    const naver = window.naver
    const pos   = new naver.maps.LatLng(gps.lat, gps.lng)

    if (!myMarkerRef.current) {
      myMarkerRef.current = new naver.maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: {
          content: `
            <div style="position:relative;width:32px;height:32px;
              display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:32px;height:32px;
                border-radius:50%;background:rgba(230,0,18,.2);
                animation:ripple 1.8s ease-out infinite;"></div>
              <div style="width:16px;height:16px;border-radius:50%;
                background:#e60012;border:2.5px solid #fff;
                box-shadow:0 0 12px rgba(230,0,18,.6);
                position:relative;z-index:1;"></div>
            </div>`,
          anchor: new naver.maps.Point(16, 16),
        },
        zIndex: 300,
      })
    } else {
      myMarkerRef.current.setPosition(pos)
    }

    if (followRef.current) mapRef.current.setCenter(pos)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps])


  // ────────────────────────────────────────────────────────
  //  3) 네이버 지도 열기
  // ────────────────────────────────────────────────────────
  const openNaverMap = useCallback((mode) => {
    if (!dest?.lat || !dest?.lng) { showToast('목적지 정보가 없습니다.'); return }
    if (!gps?.lat  || !gps?.lng)  { showToast('GPS 위치를 아직 가져오지 못했습니다.'); return }

    const destName = encodeURIComponent(dest.name)

    // 네이버 지도 URL 모드
    const modeMap = { driving: 'car', walking: 'walk', transit: 'transit' }
    const naverMode = modeMap[mode] || 'car'

    const url = `https://map.naver.com/p/directions/-/${dest.lng},${dest.lat},${destName},-,COORD/-/${naverMode}?c=11.00,0,0,0,dh`

    window.open(url, '_blank')

    const modeLabel = { driving: '🚗 자동차', walking: '🚶 도보', transit: '🚇 대중교통' }
    showToast(`${modeLabel[mode]} 경로를 네이버 지도에서 확인하세요!`)
  }, [dest, gps, showToast])


  // ── 거리 계산
  const distToDestM = gps.lat && dest?.lat
    ? haversine(gps.lat, gps.lng, dest.lat, dest.lng)
    : null
  const distStr = distToDestM
    ? distToDestM < 1000
      ? `${Math.round(distToDestM)}m`
      : `${(distToDestM / 1000).toFixed(1)}km`
    : '-'


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── 상단 헤더 */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text)', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>‹</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 800,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {dest.emoji} {dest.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
            📍 현재 위치에서 직선거리 {distStr}
          </div>
        </div>
      </div>

      {/* ── 교통수단 선택 + 네이버 지도 열기 버튼 */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '12px 14px', flexShrink: 0,
      }}>
        {/* 교통수단 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[
            { mode: 'driving', label: '🚗 자동차' },
            { mode: 'walking', label: '🚶 도보' },
            { mode: 'transit', label: '🚇 대중교통' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setTravelMode(mode)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                border: '1px solid ' + (travelMode === mode ? 'transparent' : 'var(--border)'),
                background: travelMode === mode
                  ? 'var(--accentGrad)'
                  : 'var(--card)',
                color: travelMode === mode ? '#fff' : 'var(--muted)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 네이버 지도 열기 버튼 */}
        <button
          onClick={() => openNaverMap(travelMode)}
          style={{
            width: '100%', padding: '13px',
            borderRadius: 12,
            background: 'var(--accentGrad)',
            border: 'none', color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          🗺 네이버 지도로 길찾기
        </button>
      </div>

      {/* ── 지도 (내 위치 + 목적지만 표시) */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />

        {/* 내 위치 FAB */}
        <div style={{ position: 'absolute', right: 14, bottom: 16, zIndex: 50 }}>
          <button
            onClick={() => {
              setFollow(true)
              if (mapRef.current && gps.lat) {
                mapRef.current.setCenter(
                  new window.naver.maps.LatLng(gps.lat, gps.lng)
                )
                mapRef.current.setZoom(16)
              }
            }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: follow ? 'var(--accent)' : 'var(--card)',
              border: '1px solid ' + (follow ? 'var(--accent)' : 'var(--border)'),
              fontSize: 19, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
            }}
          >📍</button>
        </div>

        {/* 속도 뱃지 */}
        {gps.ok && (
          <div style={{
            position: 'absolute', left: 14, bottom: 16, zIndex: 50,
            background: 'var(--card)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '8px 16px', textAlign: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,.12)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--yellow)', lineHeight: 1 }}>
              {gps.speed ?? 0}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>km/h</div>
          </div>
        )}
      </div>

      {/* ── 하단 목적지 정보 */}
      <div style={{
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '12px 16px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 28 }}>{dest.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{dest.name}</div>
          <div style={{
            fontSize: 12, color: 'var(--muted)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {dest.address}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>{distStr}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>직선거리</div>
        </div>
      </div>
    </div>
  )
}