/**
 * destinations.js
 * ─────────────────────────────────────────────────────────────
 * ★ 목적지 데이터 파일 — 여기만 수정하면 됩니다 ★
 *
 * 각 항목 설명:
 *   id       : 고유 번호 (다른 항목과 겹치면 안 됩니다)
 *   name     : 화면에 표시할 장소명
 *   address  : 지도 마커 툴팁에 표시할 주소
 *   lat      : 위도  (소수점 4자리 이상 권장)
 *   lng      : 경도
 *   category : 카테고리 필터에 사용 (자유롭게 작성 가능)
 *   emoji    : 목록 아이콘 및 지도 마커에 표시
 *
 * 좌표 확인 방법:
 *   https://map.naver.com 접속 → 원하는 위치 우클릭
 *   → "이 위치 좌표 복사" 클릭 → lat, lng에 붙여넣기
 * ─────────────────────────────────────────────────────────────
 */

export const DESTINATIONS = [
  {
    id: 1,
    name: '경복궁',
    address: '서울 종로구 사직로 161',
    lat: 37.5796,
    lng: 126.9770,
    category: '관광지',
    emoji: '🏯',
  },
  {
    id: 2,
    name: 'N서울타워 (남산타워)',
    address: '서울 용산구 남산공원길 105',
    lat: 37.5512,
    lng: 126.9882,
    category: '관광지',
    emoji: '🗼',
  },
  {
    id: 3,
    name: '홍대입구역',
    address: '서울 마포구 양화로 지하 160',
    lat: 37.5570,
    lng: 126.9244,
    category: '교통',
    emoji: '🚇',
  },
  {
    id: 4,
    name: '강남역',
    address: '서울 강남구 강남대로 지하 396',
    lat: 37.4979,
    lng: 127.0276,
    category: '교통',
    emoji: '🚇',
  },
  {
    id: 5,
    name: '롯데월드',
    address: '서울 송파구 올림픽로 240',
    lat: 37.5111,
    lng: 127.0984,
    category: '쇼핑/놀이',
    emoji: '🎡',
  },
  {
    id: 6,
    name: '코엑스몰',
    address: '서울 강남구 영동대로 513',
    lat: 37.5115,
    lng: 127.0595,
    category: '쇼핑/놀이',
    emoji: '🛍',
  },
  {
    id: 7,
    name: '인천국제공항 1터미널',
    address: '인천 중구 공항로 272',
    lat: 37.4602,
    lng: 126.4407,
    category: '교통',
    emoji: '✈️',
  },
  {
    id: 8,
    name: '서울역',
    address: '서울 용산구 한강대로 405',
    lat: 37.5547,
    lng: 126.9706,
    category: '교통',
    emoji: '🚂',
  },
  {
    id: 9,
    name: '이태원 음식거리',
    address: '서울 용산구 이태원로',
    lat: 37.5345,
    lng: 126.9946,
    category: '음식',
    emoji: '🍽',
  },
  {
    id: 10,
    name: '명동성당',
    address: '서울 중구 명동길 74',
    lat: 37.5633,
    lng: 126.9872,
    category: '관광지',
    emoji: '⛪',
  },
  {
    id: 11,
    name: '동대문디자인플라자 (DDP)',
    address: '서울 중구 을지로 281',
    lat: 37.5670,
    lng: 127.0096,
    category: '관광지',
    emoji: '🏛',
  },
  {
    id: 12,
    name: '여의도 한강공원',
    address: '서울 영등포구 여의동로 330',
    lat: 37.5283,
    lng: 126.9328,
    category: '공원',
    emoji: '🌿',
  },
  {
    id: 13,
    name: '북촌한옥마을',
    address: '서울 종로구 계동길 37',
    lat: 37.5826,
    lng: 126.9853,
    category: '관광지',
    emoji: '🏘',
  },
  {
    id: 14,
    name: '성수동 카페거리',
    address: '서울 성동구 성수이로',
    lat: 37.5446,
    lng: 127.0557,
    category: '음식',
    emoji: '☕',
  },
  {
    id: 15,
    name: '광화문광장',
    address: '서울 종로구 세종대로 172',
    lat: 37.5720,
    lng: 126.9768,
    category: '관광지',
    emoji: '🏛',
  },
]

/**
 * CATEGORIES
 * DESTINATIONS 배열에서 category 값을 자동으로 추출합니다.
 * '전체'를 맨 앞에 추가합니다.
 * 목적지를 추가/삭제하면 자동으로 갱신됩니다.
 */
export const CATEGORIES = ['전체', ...new Set(DESTINATIONS.map(d => d.category))]
