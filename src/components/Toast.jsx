/**
 * Toast.jsx
 * ─────────────────────────────────────────────────────────────
 * 화면 하단에 잠깐 나타났다 사라지는 알림 메시지 컴포넌트입니다.
 * msg가 null이면 아무것도 렌더링하지 않습니다.
 *
 * 사용법:
 *   <Toast msg="경로 안내를 시작합니다!" />
 * ─────────────────────────────────────────────────────────────
 */
export default function Toast({ msg }) {
  // msg가 없으면 렌더링 하지 않음
  if (!msg) return null

  return (
    <div style={{
      position:  'fixed',
      bottom:    90,
      left:      '50%',
      transform: 'translateX(-50%)',         // 수평 중앙 정렬

      background: 'rgba(19,22,42,0.95)',
      border:     '1px solid var(--border)',
      color:      'var(--text)',
      padding:    '11px 22px',
      borderRadius: 24,
      fontSize:   13,
      fontWeight: 600,
      zIndex:     9999,                      // 항상 최상단에 표시
      whiteSpace: 'nowrap',
      boxShadow:  '0 8px 28px rgba(0,0,0,.6)',
      animation:  'fadeIn .25s ease',
      pointerEvents: 'none',                 // 토스트 클릭 방지 (하단 버튼 클릭 가능)
    }}>
      {msg}
    </div>
  )
}
