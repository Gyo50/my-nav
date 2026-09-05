/**
 * MapScreen.jsx
 * ─────────────────────────────────────────────────────────────
 * 두 번째 화면: 네이버 지도 + 실시간 네비게이션 화면
 * - 교통수단 선택 (자동차 / 도보 / 대중교통) 추가
 * ─────────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchRoute, guideIcon, fmtDist, fmtTime, etaTime, haversine } from '../utils/geo'

export default function MapScreen({ dest, gps, onBack, showToast }) {
  const mapElRef      = useRef(null)
  const mapRef        = useRef(null)
  const myMarkerRef   = useRef(null)
  const destMarkerRef = useRef(null)
  const polylineRef   = useRef(null)

  const [route,      setRoute]      = useState(null)
  const [guideIdx,   setGuideIdx]   = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [follow,     setFollow]     = useState(true)
  const [travelMode, setTravelMode] = useState('driving') // 교통수단 상태

  const routeRef      = useRef(null)
  const guideIdxRef   = useRef(0)
  const followRef     = useRef(true)
  const travelModeRef = useRef('driving')

  useEffect(() => { routeRef.current    = route },      [route])
  useEffect(() => { guideIdxRef.current = guideIdx },   [guideIdx])
  useEffect(() => { followRef.current   = follow },     [follow])
  useEffect(() => { travelModeRef.current = travelMode }, [travelMode])


  // ────────────────────────────────────────────────────────
  //  1) 지도 초기화
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const initMap = () => {
      const naver = window.naver
      if (!naver?.maps) { setTimeout(initMap, 500); return }
      if (mapRef.current) return

      const map = new naver.maps.Map(mapElRef.current, {
        center: new naver.maps.LatLng(gps.lat ?? 37.5665, gps.lng ?? 126.9780),
        zoom: 16,
        mapTypeId: naver.maps.MapTypeId.NORMAL,
        scaleControl: false,
        logoControl: true,
        mapDataControl: false,
        zoomControl: false,
      })
      mapRef.current = map

      naver.maps.Event.addListener(map, 'dragstart', () => setFollow(false))

      const destMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(dest.lat, dest.lng),
        map,
        icon: {
          content: `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <div style="
                background: linear-gradient(135deg, #ff4d4d, #ff7070);
                border: 2.5px solid #fff;
                border-radius: 50% 50% 50% 0;
                width: 38px; height: 38px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px;
                box-shadow: 0 4px 14px rgba(255,77,77,.5);
                transform: rotate(-45deg);
              ">
                <span style="transform:rotate(45deg)">${dest.emoji}</span>
              </div>
              <div style="
                background: rgba(13,15,26,.9);
                color: #fff; font-size: 11px; font-weight:700;
                padding: 3px 9px; border-radius: 8px; margin-top: 5px;
                border: 1px solid rgba(255,255,255,.15);
                white-space: nowrap;
              ">${dest.name}</div>
            </div>`,
          anchor: new naver.maps.Point(19, 57),
        },
        zIndex: 200,
      })
      destMarkerRef.current = destMarker

      calcRoute('driving')
    }

    initMap()

    return () => {
      if (mapRef.current) { mapRef.current.destroy?.(); mapRef.current = null }
      myMarkerRef.current = null
      destMarkerRef.current = null
      polylineRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // ────────────────────────────────────────────────────────
  //  2) GPS 업데이트 → 마커 이동 + 턴 감지
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
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(0,199,60,.25);animation:ripple 1.8s ease-out infinite;"></div>
              <div style="width:16px;height:16px;border-radius:50%;background:#00c73c;border:2.5px solid #fff;box-shadow:0 0 12px rgba(0,199,60,.8);position:relative;z-index:1;"></div>
            </div>`,
          anchor: new naver.maps.Point(16, 16),
        },
        zIndex: 300,
      })
    } else {
      myMarkerRef.current.setPosition(pos)
    }

    if (followRef.current) mapRef.current.setCenter(pos)

    // 턴-바이-턴 감지 (자동차 모드만)
    if (travelModeRef.current === 'driving') {
      const r  = routeRef.current
      const gi = guideIdxRef.current
      if (r && gi < r.guide.length - 1) {
        const g    = r.guide[gi]
        const dist = haversine(gps.lat, gps.lng, g.y, g.x)
        if (dist < 30) {
          const next = gi + 1
          setGuideIdx(next)
          if (r.guide[next]?.type === 16) showToast('🏁 목적지에 도착했습니다!')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps])


  // ────────────────────────────────────────────────────────
  //  3) 경로 계산 함수
  // ────────────────────────────────────────────────────────
  const calcRoute = useCallback(async (mode = travelModeRef.current) => {
    if (!gps.lat) { showToast('GPS 위치를 아직 가져오지 못했습니다.'); return }

    // 대중교통: 네이버 지도 웹으로 연결
    if (mode === 'transit') {
      const webUrl = `https://map.naver.com/v5/directions/-/${dest.lng},${dest.lat},${encodeURIComponent(dest.name)},,/transit`
      window.open(webUrl, '_blank')
      showToast('🚇 네이버 지도에서 대중교통 경로를 확인하세요!')
      return
    }

    setLoading(true)
    setGuideIdx(0)

    try {
      let r

      if (mode === 'walking') {
        // 도보: 직선거리 기반 예상
        const dist = haversine(gps.lat, gps.lng, dest.lat, dest.lng)
        const dur  = dist / 1.2 // 도보 평균 1.2m/s
        r = {
          dist, dur,
          tollFare: 0, fuelPrice: 0,
          path: [[gps.lng, gps.lat], [dest.lng, dest.lat]],
          guide: [
            { type: 0,  instructions: '도보 출발', distance: dist, duration: dur, x: gps.lng, y: gps.lat },
            { type: 16, instructions: '목적지 도착', distance: 0,    duration: 0,   x: dest.lng, y: dest.lat },
          ],
          isWalking: true,
        }
        showToast('🚶 도보 경로입니다 (직선 거리 기준)')
      } else {
        // 자동차: Directions API
        r = await fetchRoute(gps.lat, gps.lng, dest.lat, dest.lng)
        showToast('경로 안내를 시작합니다! 🚗')
      }

      setRoute(r)

      const naver = window.naver
      if (polylineRef.current) polylineRef.current.setMap(null)

      const path = r.path.map(([lng, lat]) => new naver.maps.LatLng(lat, lng))

      polylineRef.current = new naver.maps.Polyline({
        map:           mapRef.current,
        path,
        strokeColor:   mode === 'walking' ? '#4f8ef7' : '#00c73c',
        strokeWeight:  6,
        strokeOpacity: mode === 'walking' ? 0.7 : 0.9,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        strokeStyle:   mode === 'walking' ? 'shortdash' : 'solid',
      })

      const bounds = new naver.maps.LatLngBounds()
      path.forEach(p => bounds.extend(p))
      mapRef.current.fitBounds(bounds, { top: 80, right: 40, bottom: 160, left: 40 })

    } catch (e) {
      console.error(e)
      showToast('경로 계산 실패: ' + e.message)
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps.lat, gps.lng, dest])


  // ── 현재 턴 안내 스텝
  const curGuide   = route?.guide?.[guideIdx]
  const remainDist = route ? route.guide.slice(guideIdx).reduce((a, g) => a + (g.distance ?? 0), 0) : null
  const remainDur  = remainDist != null && route ? (remainDist / route.dist) * route.dur : null


  // ────────────────────────────────────────────────────────
  //  렌더링
  // ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ──────────── 상단 헤더 ──────────── */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text)', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>‹</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dest.emoji} {dest.name}
          </div>
          {route && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
              {fmtDist(remainDist)} · {fmtTime(remainDur)} · 도착 {etaTime(remainDur)}
            </div>
          )}
        </div>

        <button onClick={() => calcRoute(travelMode)} disabled={loading} title="경로 재계산" style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--border)',
          fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, opacity: loading ? .5 : 1,
        }}>🔄</button>
      </div>

      {/* ──────────── 교통수단 선택 탭 ──────────── */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', padding: '8px 14px', gap: 8, flexShrink: 0,
      }}>
        {[
          { mode: 'driving', label: '🚗 자동차' },
          { mode: 'walking', label: '🚶 도보'   },
          { mode: 'transit', label: '🚇 대중교통' },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => {
              setTravelMode(mode)
              travelModeRef.current = mode
              calcRoute(mode)
            }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              border: '1px solid ' + (travelMode === mode ? 'transparent' : 'var(--border)'),
              background: travelMode === mode
                ? 'linear-gradient(135deg, #00c73c, #03c75a)'
                : 'var(--card)',
              color:      travelMode === mode ? '#fff' : 'var(--muted)',
              fontSize:   12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ──────────── 턴-바이-턴 안내 바 ──────────── */}
      {curGuide && travelMode === 'driving' && (
        <div style={{
          background: 'var(--card)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', flexShrink: 0, animation: 'slideUp .3s ease',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #00c73c, #03c75a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {guideIcon(curGuide.type)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
              {curGuide.instructions || curGuide.name || '계속 직진'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>
              {fmtDist(curGuide.distance)} 후 · 남은 구간 {route.guide.length - 1 - guideIdx}개
            </div>
          </div>
        </div>
      )}

      {/* 도보 안내 바 */}
      {route?.isWalking && (
        <div style={{
          background: 'var(--card)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', flexShrink: 0,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🚶</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>목적지까지 도보로 이동</div>
            <div style={{ fontSize: 12, color: '#4f8ef7', marginTop: 3 }}>
              직선거리 기준 · 실제 거리는 더 길 수 있습니다
            </div>
          </div>
        </div>
      )}

      {/* ──────────── 지도 영역 ──────────── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />

        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(13,15,26,.75)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
              animation: 'spin .8s linear infinite',
            }} />
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12, fontWeight: 600 }}>
              경로 계산 중...
            </div>
          </div>
        )}

        {/* 내 위치 FAB */}
        <div style={{ position: 'absolute', right: 14, bottom: 16, zIndex: 50 }}>
          <button
            onClick={() => {
              setFollow(true)
              if (mapRef.current && gps.lat) {
                mapRef.current.setCenter(new window.naver.maps.LatLng(gps.lat, gps.lng))
                mapRef.current.setZoom(17)
              }
            }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: follow ? 'var(--accent)' : 'var(--card)',
              border: '1px solid ' + (follow ? 'var(--accent)' : 'var(--border)'),
              fontSize: 19, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
            }}
          >📍</button>
        </div>

        {/* 속도 뱃지 */}
        {gps.ok && travelMode === 'driving' && (
          <div style={{
            position: 'absolute', left: 14, bottom: 16, zIndex: 50,
            background: 'var(--card)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '8px 16px', textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,.4)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--yellow)', lineHeight: 1 }}>
              {gps.speed ?? 0}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>km/h</div>
          </div>
        )}
      </div>

      {/* ──────────── 하단 경로 요약 바 ──────────── */}
      {route && (
        <div style={{
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '10px 0', flexShrink: 0,
        }}>
          <StatBox label="총 거리"   val={fmtDist(route.dist)} />
          <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
          <StatBox label="소요 시간" val={fmtTime(route.dur)} />
          <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
          <StatBox label="도착 예정" val={etaTime(route.dur)} />
          {route.tollFare > 0 && (
            <>
              <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
              <StatBox label="통행료" val={`${route.tollFare.toLocaleString()}원`} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, val }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
      <div style={{ fontSize: 17, fontWeight: 800 }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
    </div>
  )
}