/**
 * InquiryScreen.jsx
 * ─────────────────────────────────────────────────────────────
 * 건의사항 화면
 * EmailJS를 통해 이름, 연락처, 건의사항을 이메일로 전송합니다.
 * ─────────────────────────────────────────────────────────────
 */
import { useState } from 'react'

// ── EmailJS 설정값
const EMAILJS_SERVICE_ID  = 'service_kn1b0q7'
const EMAILJS_TEMPLATE_ID = 'template_kvhymc5'
const EMAILJS_PUBLIC_KEY  = 'Knn1wUJdfRaFyjqm0'

export default function InquiryScreen({ onBack }) {
  const [form, setForm] = useState({
    from_name: '',   // 이름
    contact:   '',   // 연락처
    message:   '',   // 건의사항
  })
  const [sending,  setSending]  = useState(false)  // 전송 중 여부
  const [sent,     setSent]     = useState(false)   // 전송 완료 여부
  const [error,    setError]    = useState(null)    // 오류 메시지

  // ── 입력값 변경
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── 전송
  async function handleSubmit() {
    // 유효성 검사
    if (!form.from_name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!form.contact.trim())   { setError('연락처를 입력해주세요.'); return }
    if (!form.message.trim())   { setError('건의사항을 입력해주세요.'); return }

    setSending(true)
    setError(null)

    try {
      // EmailJS SDK 동적 로드
      const emailjs = await loadEmailJS()

      await emailjs.send(
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  {
    from_name: form.from_name,  // 이름
    contact:   form.contact,    // 연락처
    message:   form.message,    // 건의사항
    name:      form.from_name,  // From Name 용 ({{name}})
    email:     form.contact,    // Reply To 용 ({{email}})
  },
  EMAILJS_PUBLIC_KEY
)

      setSent(true)
      setForm({ from_name: '', contact: '', message: '' })

    } catch (e) {
      console.error(e)
      setError('전송에 실패했습니다. 다시 시도해주세요.')
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── 상단 헤더 */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>📬 건의사항</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
            더 나은 서비스를 위해 고객님의 소중한 목소리를 들려주세요.
          </div>
        </div>
      </div>

      {/* ── 폼 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>

        {/* 전송 완료 화면 */}
        {sent ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 60, gap: 12,
          }}>
            <div style={{ fontSize: 56 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>전송 완료!</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
              건의사항이 접수되었습니다.<br />빠르게 검토 후 답변드리겠습니다.
            </div>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: 16,
                padding: '12px 32px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #00c73c, #03c75a)',
                border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              다시 작성하기
            </button>
          </div>
        ) : (
          <>
            {/* 이름 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
                이름 *
              </div>
              <input
                name="from_name"
                value={form.from_name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                style={inputStyle}
              />
            </div>

            {/* 연락처 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
                연락처 *
              </div>
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="전화번호 또는 이메일"
                style={inputStyle}
              />
            </div>

            {/* 건의사항 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
                건의사항 *
              </div>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="건의사항을 자세히 작성해주세요"
                rows={6}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div style={{
                background: 'rgba(255,77,77,.12)',
                border: '1px solid rgba(255,77,77,.3)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 13, color: '#ff4d4d',
                marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* 전송 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={sending}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: sending
                  ? 'var(--card)'
                  : 'linear-gradient(135deg, #00c73c, #03c75a)',
                border: 'none',
                color: sending ? 'var(--muted)' : '#fff',
                fontSize: 15, fontWeight: 800,
                cursor: sending ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {sending ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    animation: 'spin .8s linear infinite',
                  }} />
                  전송 중...
                </>
              ) : '📬 건의사항 보내기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── 공통 input 스타일
const inputStyle = {
  width: '100%',
  background: 'var(--card)',
  border: '1.5px solid var(--border)',
  borderRadius: 12,
  padding: '12px 14px',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

// ── EmailJS SDK 동적 로드
function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) { resolve(window.emailjs); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    script.onload = () => resolve(window.emailjs)
    script.onerror = reject
    document.head.appendChild(script)
  })
}