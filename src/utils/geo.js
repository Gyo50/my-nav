// ── API 인증 키
const CLIENT_ID = 'kvy0ec2zgu'
const SECRET_KEY = '5anSvaNVW2c6jpNAS56zz56otzxbOsNGfxyfbiaC'

// ── 두 좌표 사이의 거리 계산 (단위: 미터)
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── 거리 포맷 (1000m 미만 → "250m", 이상 → "1.2km")
export function fmtDist(m) {
  if (m == null) return '-'
  return m < 1000
    ? `${Math.round(m)}m`
    : `${(m / 1000).toFixed(1)}km`
}

// ── 시간 포맷 (초 단위 → "30초" / "15분" / "1시간 20분")
export function fmtTime(s) {
  if (s == null) return '-'
  if (s < 60) return `${Math.round(s)}초`
  if (s < 3600) return `${Math.round(s / 60)}분`
  return `${Math.floor(s / 3600)}시간 ${Math.round((s % 3600) / 60)}분`
}

// ── 도착 예정 시각 ETA
export function etaTime(durSec) {
  if (durSec == null) return '-'
  const d = new Date(Date.now() + durSec * 1000)
  return d.toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })
}

// ── 네이버 Directions5 API 경로 계산
export async function fetchRoute(startLat, startLng, destLat, destLng) {
  const params = new URLSearchParams({
    start: `${startLng},${startLat}`,  // 경도,위도 순서 주의!
    goal: `${destLng},${destLat}`,
    option: 'trafast',                  // 실시간 빠른길
  })

  // ✅ 수정된 URL (/api/naver 로 통일)
  const url = `/api/directions?${params}`

  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': CLIENT_ID,
      'X-NCP-APIGW-API-KEY': SECRET_KEY,
    },
  })

  if (!res.ok) throw new Error(`Directions API 오류 (HTTP ${res.status})`)

  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message || '경로를 찾을 수 없습니다.')

  const route = data.route?.trafast?.[0]
  if (!route) throw new Error('경로 데이터가 없습니다.')

  return {
    dist: route.summary.distance,
    dur: route.summary.duration / 1000,
    tollFare: route.summary.tollFare,
    fuelPrice: route.summary.fuelPrice,
    path: route.path,
    guide: route.guide,
  }
}

// ── 턴 안내 타입 → 아이콘
const TURN_ICONS = {
  0: '🚀',  // 출발
  1: '⬆️',  // 직진
  2: '↗️',  // 좌측 방면
  3: '↘️',  // 우측 방면
  5: '↰',   // 좌회전
  6: '↱',   // 우회전
  7: '↶',   // 유턴
  8: '↖️',  // 고속도로 진입 (좌)
  9: '↗️',  // 고속도로 진입 (우)
  10: '🔄',  // 회전교차로
  11: '↘️',  // 출구
  12: '↗️',  // 진입
  16: '🏁',  // 도착
}

export function guideIcon(type) {
  return TURN_ICONS[type] ?? '➡️'
}