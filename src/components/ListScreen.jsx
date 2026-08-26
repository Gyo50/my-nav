/**
 * ListScreen.jsx
 * ─────────────────────────────────────────────────────────────
 * 첫 번째 화면: 목적지 목록 선택 화면입니다.
 *
 * 기능:
 *   - 카테고리 필터 탭
 *   - 장소명 / 주소 검색
 *   - 목적지 카드 목록
 *   - 하단 현재 GPS 좌표 표시
 *
 * Props:
 *   gps      : { lat, lng, ok } — App.jsx 에서 내려오는 GPS 상태
 *   onSelect : 목적지 선택 시 호출할 함수 (dest 객체 전달)
 * ─────────────────────────────────────────────────────────────
 */
import { useState } from 'react'
import { DESTINATIONS, CATEGORIES } from '../data/destinations'
import DestCard from './DestCard'

export default function ListScreen({ gps, onSelect }) {
  const [cat,   setCat]   = useState('전체')  // 선택된 카테고리
  const [query, setQuery] = useState('')      // 검색어

  // 카테고리 + 검색어 동시 필터링
  const filtered = DESTINATIONS.filter(d => {
    const matchCat = cat === '전체' || d.category === cat
    const matchQ   = d.name.includes(query) || d.address.includes(query)
    return matchCat && matchQ
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ────────────────── 상단 헤더 ────────────────── */}
      <div style={{
        background:   'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding:      '16px 16px 12px',
        flexShrink:   0,
      }}>

        {/* 타이틀 + GPS 상태 뱃지 */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   14,
        }}>
          <div>
            <div style={{
              fontSize:   22,
              fontWeight: 900,
              letterSpacing: '-0.5px',
              // 네이버 그린 그라디언트 텍스트
              background:           'linear-gradient(135deg, #00c73c, #03c75a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
            }}>
              네비게이션
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              어디로 갈까요?
            </div>
          </div>

          {/* GPS 연결 상태 뱃지 */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        7,
            background: 'var(--card)',
            border:     '1px solid var(--border)',
            borderRadius: 20,
            padding:    '6px 12px',
          }}>
            {/* GPS 초록 점 (연결됐을 때 반짝임) */}
            <div style={{
              width:      8,
              height:     8,
              borderRadius: '50%',
              background:  gps.ok ? 'var(--accent)' : 'var(--muted)',
              boxShadow:   gps.ok ? '0 0 8px var(--accent)' : 'none',
              animation:   gps.ok ? 'glow 2s infinite' : 'none',
              transition:  'all .3s',
            }} />
            <span style={{
              fontSize:   12,
              color:      gps.ok ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 600,
            }}>
              {gps.ok ? 'GPS 연결됨' : 'GPS 대기 중'}
            </span>
          </div>
        </div>

        {/* 검색창 */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          background: 'var(--card)',
          border:     '1.5px solid var(--border)',
          borderRadius: 12,
          padding:    '10px 14px',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="목적지 검색..."
            style={{
              flex:       1,
              background: 'none',
              border:     'none',
              outline:    'none',
              color:      'var(--text)',
              fontSize:   14,
            }}
          />
          {/* 검색어 있을 때만 지우기 버튼 표시 */}
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border:     'none',
                color:      'var(--muted)',
                cursor:     'pointer',
                fontSize:   15,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 카테고리 필터 (가로 스크롤) */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                flexShrink:   0,
                padding:      '6px 14px',
                borderRadius: 20,
                border:       '1px solid ' + (cat === c ? 'transparent' : 'var(--border)'),
                // 선택된 카테고리만 그린 그라디언트
                background:   cat === c
                  ? 'linear-gradient(135deg, #00c73c, #03c75a)'
                  : 'var(--card)',
                color:      cat === c ? '#fff' : 'var(--muted)',
                fontSize:   12,
                fontWeight: 700,
                cursor:     'pointer',
                whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────── 목적지 목록 ────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 20px' }}>
        {/* 검색 결과 없을 때 */}
        {filtered.length === 0 ? (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            paddingTop:    60,
            color:         'var(--muted)',
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>검색 결과가 없습니다</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>다른 키워드로 검색해보세요</div>
          </div>
        ) : (
          // 목적지 카드 목록
          filtered.map(d => (
            <DestCard
              key={d.id}
              dest={d}
              onClick={() => onSelect(d)}  // 선택 시 App.jsx 로 전달
            />
          ))
        )}
      </div>

      {/* ────────────────── 하단 GPS 좌표 표시 ────────────────── */}
      <div style={{
        background:  'var(--surface)',
        borderTop:   '1px solid var(--border)',
        padding:     '10px 16px',
        flexShrink:  0,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
        gap:         6,
      }}>
        <span style={{ fontSize: 13 }}>📍</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {gps.ok
            ? `현재 위치: ${gps.lat?.toFixed(5)}, ${gps.lng?.toFixed(5)}`
            : 'GPS 위치를 가져오는 중...'}
        </span>
      </div>
    </div>
  )
}
