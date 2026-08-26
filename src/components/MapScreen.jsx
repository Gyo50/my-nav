/**
 * MapScreen.jsx
 * ─────────────────────────────────────────────────────────────
 * 두 번째 화면: 네이버 지도 + 실시간 네비게이션 화면입니다.
 *
 * 기능:
 *   - 네이버 지도 초기화 및 렌더링
 *   - 내 위치(GPS) 마커 실시간 업데이트
 *   - 목적지 마커 표시
 *   - Directions5 API로 경로 폴리라인 표시
 *   - 턴-바이-턴 안내 (guide 배열 기반)
 *   - 내 위치 자동 추적 / 수동 해제
 *   - 경로 재계산 버튼
 *   - 속도 뱃지, 총 거리/시간/ETA 표시
 *
 * Props:
 *   dest      : 선택된 목적지 객체
 *   gps       : { lat, lng, speed, ok }
 *   onBack    : 뒤로가기 함수
 *   showToast : 토스트 메시지 함수
 * ─────────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchRoute, guideIcon, fmtDist, fmtTime, etaTime, haversine } from '../utils/geo'

export default function MapScreen({ dest, gps, onBack, showToast }) {
  // ── DOM ref: 네이버 지도가 마운트될 div
  const mapElRef = useRef(null)

  // ── 인스턴스 refs (리렌더링과 무관하게 유지)
  const mapRef        = useRef(null)  // naver.maps.Map 인스턴스
  const myMarkerRef   = useRef(null)  // 내 위치 마커
  const destMarkerRef = useRef(null)  // 목적지 마커
  const polylineRef   = useRef(null)  // 경로 폴리라인

  // ── 상태
  const [route,    setRoute]    = useState(null)   // fetchRoute() 결과
  const [guideIdx, setGuideIdx] = useState(0)      // 현재 턴 안내 인덱스
  const [loading,  setLoading]  = useState(false)  // 경로 계산 중 여부
  const [follow,   setFollow]   = useState(true)   // true: 지도가 내 위치를 자동 추적

  // ── 최신 값을 useEffect 안에서 읽기 위한 refs
  // (useEffect의 클로저 문제를 해결합니다)
  const routeRef    = useRef(null)
  const guideIdxRef = useRef(0)
  const followRef   = useRef(true)

  useEffect(() => { routeRef.current = route },       [route])
  useEffect(() => { guideIdxRef.current = guideIdx }, [guideIdx])
  useEffect(() => { followRef.current = follow },     [follow])


  // ────────────────────────────────────────────────────────
  //  1) 지도 초기화 (MapScreen 진입 시 최초 1회 실행)
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const naver = window.naver
    if (!naver || mapRef.current) return  // 이미 초기화됐으면 스킵

    // 네이버 지도 생성
    const map = new naver.maps.Map(mapElRef.current, {
      // 초기 중심: GPS 있으면 내 위치, 없으면 서울 시청
      center: new naver.maps.LatLng(
        gps.lat ?? 37.5665,
        gps.lng ?? 126.9780
      ),
      zoom:             16,
      mapTypeId:        naver.maps.MapTypeId.NORMAL,
      scaleControl:     false,   // 축척 컨트롤 숨김
      logoControl:      true,    // 네이버 로고 표시 (필수)
      mapDataControl:   false,   // 지도 데이터 컨트롤 숨김
      zoomControl:      false,   // 줌 버튼 숨김 (커스텀 FAB 사용)
    })
    mapRef.current = map

    // 지도 드래그 시작 → 자동 추적 해제
    naver.maps.Event.addListener(map, 'dragstart', () => {
      setFollow(false)
    })

    // ── 목적지 마커 생성
    const destMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(dest.lat, dest.lng),
      map,
      icon: {
        // HTML 커스텀 마커: 핀 + 장소명 라벨
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
        // 마커의 기준점 (핀 뾰족한 부분)
        anchor: new naver.maps.Point(19, 57),
      },
      zIndex: 200,
    })
    destMarkerRef.current = destMarker

    // ── 지도 준비 완료 후 경로 계산
    calcRoute()

    // ── cleanup: MapScreen을 벗어날 때 지도 리소스 해제
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy?.()
        mapRef.current = null
      }
      myMarkerRef.current   = null
      destMarkerRef.current = null
      polylineRef.current   = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // 마운트 1회만 실행


  // ────────────────────────────────────────────────────────
  //  2) GPS 업데이트 → 마커 이동 + 턴 감지
  //     gps 상태가 바뀔 때마다 실행됩니다
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !gps.lat) return
    const naver = window.naver
    const pos   = new naver.maps.LatLng(gps.lat, gps.lng)

    if (!myMarkerRef.current) {
      // ── 내 위치 마커 최초 생성
      myMarkerRef.current = new naver.maps.Marker({
        position: pos,
        map:      mapRef.current,
        icon: {
          content: `
            <div style="
              position: relative; width: 32px; height: 32px;
              display: flex; align-items: center; justify-content: center;
            ">
              <!-- 물결 퍼짐 애니메이션 -->
              <div style="
                position: absolute; width: 32px; height: 32px;
                border-radius: 50%;
                background: rgba(0,199,60,.25);
                animation: ripple 1.8s ease-out infinite;
              "></div>
              <!-- 중앙 녹색 점 -->
              <div style="
                width: 16px; height: 16px; border-radius: 50%;
                background: #00c73c;
                border: 2.5px solid #fff;
                box-shadow: 0 0 12px rgba(0,199,60,.8);
                position: relative; z-index: 1;
              "></div>
            </div>`,
          anchor: new naver.maps.Point(16, 16),
        },
        zIndex: 300,  // 목적지 마커(200)보다 위에 표시
      })
    } else {
      // ── 이미 있으면 위치만 업데이트
      myMarkerRef.current.setPosition(pos)
    }

    // ── 자동 추적 모드: 지도 중심을 내 위치로 이동
    if (followRef.current) {
      mapRef.current.setCenter(pos)
    }

    // ── 턴-바이-턴 진행 감지
    // 현재 안내 포인트에 30m 이내로 접근하면 다음 안내로 넘어감
    const r  = routeRef.current
    const gi = guideIdxRef.current
    if (r && gi < r.guide.length - 1) {
      const g    = r.guide[gi]
      // guide 좌표는 [lng, lat] 배열 형태
      const dist = haversine(gps.lat, gps.lng, g.y, g.x)
      if (dist < 30) {
        const next = gi + 1
        setGuideIdx(next)
        // 마지막 안내(type=16)가 도착이면 완료 메시지
        if (r.guide[next]?.type === 16) {
          showToast('🏁 목적지에 도착했습니다!')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps])  // gps가 바뀔 때만 실행


  // ────────────────────────────────────────────────────────
  //  3) 경로 계산 함수
  //     버튼 클릭 또는 지도 초기화 시 호출
  // ────────────────────────────────────────────────────────
  const calcRoute = useCallback(async () => {
    if (!gps.lat) {
      showToast('GPS 위치를 아직 가져오지 못했습니다.')
      return
    }
    setLoading(true)
    setGuideIdx(0)  // 안내 인덱스 초기화

    try {
      // geo.js의 fetchRoute 호출 (Directions5 API)
      const r = await fetchRoute(gps.lat, gps.lng, dest.lat, dest.lng)
      setRoute(r)

      // ── 경로 폴리라인 그리기
      const naver = window.naver

      // 기존 폴리라인 제거
      if (polylineRef.current) polylineRef.current.setMap(null)

      // API 경로 좌표: [[lng, lat], ...] → LatLng 배열로 변환
      const path = r.path.map(([lng, lat]) => new naver.maps.LatLng(lat, lng))

      polylineRef.current = new naver.maps.Polyline({
        map:             mapRef.current,
        path,
        strokeColor:     '#00c73c',   // 네이버 그린
        strokeWeight:    6,
        strokeOpacity:   0.9,
        strokeLineCap:   'round',
        strokeLineJoin:  'round',
      })

      // ── 경로 전체가 보이도록 지도 범위 자동 조절
      const bounds = new naver.maps.LatLngBounds()
      path.forEach(p => bounds.extend(p))
      mapRef.current.fitBounds(bounds, {
        top: 80, right: 40, bottom: 160, left: 40,
      })

      showToast('경로 안내를 시작합니다! 🚗')
    } catch (e) {
      console.error(e)
      showToast('경로 계산 실패: ' + e.message)
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps.lat, gps.lng, dest])


  // ── 현재 턴 안내 스텝
  const curGuide = route?.guide?.[guideIdx]

  // ── 남은 거리 / 시간 계산 (현재 스텝 이후 합산)
  const remainDist = route
    ? route.guide.slice(guideIdx).reduce((a, g) => a + (g.distance ?? 0), 0)
    : null
  const remainDur = remainDist != null && route
    ? (remainDist / route.dist) * route.dur  // 비율로 추정
    : null


  // ────────────────────────────────────────────────────────
  //  렌더링
  // ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ──────────── 상단 헤더 ──────────── */}
      <div style={{
        background:   'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        padding:      '10px 14px',
        flexShrink:   0,
      }}>
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          style={{
            width:          38,
            height:         38,
            borderRadius:   '50%',
            background:     'var(--card)',
            border:         '1px solid var(--border)',
            color:          'var(--text)',
            fontSize:       22,
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          ‹
        </button>

        {/* 목적지명 + 남은 거리/시간/ETA */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:     15,
            fontWeight:   800,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {dest.emoji} {dest.name}
          </div>
          {/* 경로 계산 완료 시에만 표시 */}
          {route && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
              {fmtDist(remainDist)} · {fmtTime(remainDur)} · 도착 {etaTime(remainDur)}
            </div>
          )}
        </div>

        {/* 경로 재계산 버튼 */}
        <button
          onClick={calcRoute}
          disabled={loading}
          title="경로 재계산"
          style={{
            width:          38,
            height:         38,
            borderRadius:   '50%',
            background:     'var(--card)',
            border:         '1px solid var(--border)',
            fontSize:       16,
            cursor:         loading ? 'not-allowed' : 'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            opacity:        loading ? .5 : 1,
          }}
        >
          🔄
        </button>
      </div>

      {/* ──────────── 턴-바이-턴 안내 바 ──────────── */}
      {/* 경로 계산 완료 + 현재 안내 스텝 있을 때만 표시 */}
      {curGuide && (
        <div style={{
          background:   'var(--card)',
          borderBottom: '1px solid var(--border)',
          display:      'flex',
          alignItems:   'center',
          gap:          12,
          padding:      '10px 14px',
          flexShrink:   0,
          animation:    'slideUp .3s ease',
        }}>
          {/* 안내 방향 아이콘 */}
          <div style={{
            width:          46,
            height:         46,
            borderRadius:   14,
            flexShrink:     0,
            background:     'linear-gradient(135deg, #00c73c, #03c75a)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       22,
          }}>
            {guideIcon(curGuide.type)}
          </div>

          {/* 안내 텍스트 + 남은 구간 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
              {/* instructions: API가 제공하는 안내 문구 */}
              {curGuide.instructions || curGuide.name || '계속 직진'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>
              {fmtDist(curGuide.distance)} 후 · 남은 구간 {route.guide.length - 1 - guideIdx}개
            </div>
          </div>
        </div>
      )}

      {/* ──────────── 지도 영역 ──────────── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>

        {/* 네이버 지도가 실제 렌더링되는 div */}
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />

        {/* 경로 계산 중 로딩 오버레이 */}
        {loading && (
          <div style={{
            position:       'absolute',
            inset:          0,
            background:     'rgba(13,15,26,.75)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         100,
          }}>
            {/* 스피너 */}
            <div style={{
              width:       42,
              height:      42,
              borderRadius: '50%',
              border:      '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              animation:   'spin .8s linear infinite',
            }} />
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12, fontWeight: 600 }}>
              경로 계산 중...
            </div>
          </div>
        )}

        {/* ── 내 위치 추적 FAB 버튼 (우하단) */}
        <div style={{
          position: 'absolute', right: 14, bottom: 16,
          zIndex: 50, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <button
            onClick={() => {
              setFollow(true)  // 자동 추적 재활성화
              if (mapRef.current && gps.lat) {
                mapRef.current.setCenter(
                  new window.naver.maps.LatLng(gps.lat, gps.lng)
                )
                mapRef.current.setZoom(17)
              }
            }}
            title={follow ? '추적 중' : '내 위치로 이동'}
            style={{
              width:      46,
              height:     46,
              borderRadius: '50%',
              // 추적 중이면 그린, 아니면 카드색
              background: follow ? 'var(--accent)' : 'var(--card)',
              border:     '1px solid ' + (follow ? 'var(--accent)' : 'var(--border)'),
              fontSize:   19,
              cursor:     'pointer',
              boxShadow:  '0 4px 16px rgba(0,0,0,.5)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition: 'all .2s',
            }}
          >
            📍
          </button>
        </div>

        {/* ── 속도 뱃지 (좌하단) — GPS 연결됐을 때만 표시 */}
        {gps.ok && (
          <div style={{
            position:   'absolute',
            left:       14,
            bottom:     16,
            zIndex:     50,
            background: 'var(--card)',
            border:     '1.5px solid var(--border)',
            borderRadius: 14,
            padding:    '8px 16px',
            textAlign:  'center',
            boxShadow:  '0 4px 16px rgba(0,0,0,.4)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--yellow)', lineHeight: 1 }}>
              {gps.speed ?? 0}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>km/h</div>
          </div>
        )}
      </div>

      {/* ──────────── 하단 경로 요약 바 ──────────── */}
      {/* 경로 계산 완료 시에만 표시 */}
      {route && (
        <div style={{
          background:  'var(--surface)',
          borderTop:   '1px solid var(--border)',
          display:     'flex',
          alignItems:  'center',
          padding:     '10px 0',
          flexShrink:  0,
        }}>
          <StatBox label="총 거리"   val={fmtDist(route.dist)} />
          <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
          <StatBox label="소요 시간" val={fmtTime(route.dur)} />
          <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
          <StatBox label="도착 예정" val={etaTime(route.dur)} />
          {/* 통행료 있을 때만 표시 */}
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

// ── 하단 요약 바 각 항목 컴포넌트
function StatBox({ label, val }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
      <div style={{ fontSize: 17, fontWeight: 800 }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
