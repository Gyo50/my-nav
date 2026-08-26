/**
 * DestCard.jsx
 * ─────────────────────────────────────────────────────────────
 * 목적지 목록에서 각 항목을 표시하는 카드 컴포넌트입니다.
 * 누르는 동안 살짝 축소되는 터치 피드백이 있습니다.
 *
 * Props:
 *   dest    : destinations.js 의 항목 하나
 *   onClick : 카드를 눌렀을 때 실행할 함수
 * ─────────────────────────────────────────────────────────────
 */
import { useState } from 'react'

export default function DestCard({ dest, onClick }) {
  // 누르는 동안 true → 배경색 변경 & 살짝 축소
  const [pressed, setPressed] = useState(false)

  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}    // 손가락 닿으면
      onPointerUp={() => setPressed(false)}     // 손가락 떼면
      onPointerLeave={() => setPressed(false)}  // 카드 밖으로 나가면
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        14,

        // 누를 때 색상 변경
        background: pressed ? 'var(--card2)' : 'var(--card)',
        border:     '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding:    '14px 16px',
        marginBottom: 8,

        cursor:     'pointer',
        transition: 'all .15s',
        // 누를 때 살짝 축소
        transform:  pressed ? 'scale(0.985)' : 'scale(1)',
        animation:  'slideUp .2s ease',
        userSelect: 'none',  // 텍스트 드래그 방지
      }}
    >
      {/* 이모지 아이콘 영역 */}
      <div style={{
        width:  50,
        height: 50,
        borderRadius: 14,
        background: 'var(--card2)',
        border: '1px solid var(--border)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:  26,
        flexShrink: 0,  // 줄어들지 않게 고정
      }}>
        {dest.emoji}
      </div>

      {/* 장소명 + 주소 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:   15,
          fontWeight: 700,
          marginBottom: 3,
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',  // 길면 "..." 처리
        }}>
          {dest.name}
        </div>
        <div style={{
          fontSize:     12,
          color:        'var(--muted)',
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {dest.address}
        </div>
      </div>

      {/* 카테고리 뱃지 + 화살표 */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-end',
        gap:           6,
        flexShrink:    0,
      }}>
        {/* 카테고리 뱃지 */}
        <span style={{
          fontSize:   11,
          fontWeight: 700,
          color:      'var(--accent)',
          background: 'rgba(0,199,60,.12)',
          border:     '1px solid rgba(0,199,60,.25)',
          borderRadius: 6,
          padding:    '2px 8px',
        }}>
          {dest.category}
        </span>
        {/* 진입 화살표 */}
        <span style={{ color: 'var(--muted)', fontSize: 20, lineHeight: 1 }}>›</span>
      </div>
    </div>
  )
}
