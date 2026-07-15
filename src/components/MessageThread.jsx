import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

export default function MessageThread({ messages, myRole, onSend, placeholder }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await onSend(text)
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="thread">
      <div className="thread__messages">
        {messages.length === 0 ? (
          <p className="detail-card__hint" style={{ textAlign: 'center', marginTop: 30 }}>No messages yet — say hello.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={'thread__bubble' + (m.senderRole === myRole ? ' thread__bubble--mine' : '')}>
              <div className="thread__bubble-text">{m.text}</div>
              <div className="thread__bubble-time">{new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form className="thread__input-row" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || 'Type a message…'}
        />
        <button type="submit" className="thread__send" disabled={sending || !text.trim()}>
          <Send size={17} />
        </button>
      </form>
    </div>
  )
}
