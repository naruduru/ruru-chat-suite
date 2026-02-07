import { Client } from '@stomp/stompjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const WAIT_MS = 4000
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/customer'
const STATUS_DEST = '/app/customer/status'

function App() {
  const [view, setView] = useState('landing')
  const [assigned, setAssigned] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [wsState, setWsState] = useState('connecting')
  const [pendingRequest, setPendingRequest] = useState(false)
  const [customerId] = useState(() => `cust-${crypto.randomUUID().slice(0, 8)}`)
  const [customerName] = useState('신규 고객')
  const clientRef = useRef(null)
  const endRef = useRef(null)
  const chatSubRef = useRef(null)

  const canSend = assigned && input.trim().length > 0

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      connectHeaders: {
        role: 'customer',
      },
      onConnect: () => {
        setWsState('connected')
        setPendingRequest(true)
        clientRef.current = client
      },
      onStompError: () => setWsState('error'),
      onWebSocketClose: () => setWsState('error'),
    })

    client.activate()
    clientRef.current = client

    return () => {
      chatSubRef.current?.unsubscribe()
      client.deactivate()
    }
  }, [])

  useEffect(() => {
    if (view !== 'chat') return
    setAssigned(false)
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'system',
        text: '상담원을 배정 중입니다. 잠시만 기다려주세요.',
        time: new Date(),
      },
    ])
    const timer = setTimeout(() => {
      setAssigned(true)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          text: '상담원이 연결되었습니다. 무엇을 도와드릴까요?',
          time: new Date(),
        },
      ])
    }, WAIT_MS)
    return () => clearTimeout(timer)
  }, [view])

  useEffect(() => {
    if (view !== 'chat') return
    const client = clientRef.current
    if (!client || !client.connected) return
    if (chatSubRef.current) return
    chatSubRef.current = client.subscribe(`/topic/chat/${customerId}`, (message) => {
      try {
        const payload = JSON.parse(message.body)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: payload.sender === 'counselor' ? 'counselor' : 'user',
            text: payload.content,
            time: new Date(),
          },
        ])
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
      } catch (error) {
        console.error('chat payload parse error', error)
      }
    })
  }, [view, customerId])

  useEffect(() => {
    if (!pendingRequest || view !== 'chat') return
    sendQueueRequest()
    setPendingRequest(false)
  }, [pendingRequest, view])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (view !== 'chat') return

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sendStatus('LEFT')
      } else if (document.visibilityState === 'visible') {
        sendStatus('RETURNED')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [view])

  const statusLabel = useMemo(
    () => (assigned ? '상담원 연결됨' : '상담원 배정 중'),
    [assigned]
  )

  const sendStatus = (status) => {
    const client = clientRef.current
    if (!client || !client.connected) return

    const payload = {
      customerId,
      status,
      occurredAt: new Date().toISOString(),
    }

    client.publish({
      destination: STATUS_DEST,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  const sendQueueRequest = () => {
    const client = clientRef.current
    if (!client || !client.connected) return

    const payload = {
      customerId,
      name: customerName,
      preview: '상담 연결을 요청했습니다.',
    }

    client.publish({
      destination: '/app/customer/request',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  const onSend = () => {
    if (!canSend) return
    const text = input.trim()
    setInput('')
    const client = clientRef.current
    if (!client || !client.connected) return
    client.publish({
      destination: '/app/chat.send',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        roomId: customerId,
        sender: 'customer',
        content: text,
      }),
    })
  }

  if (view === 'landing') {
    return (
      <div className="app">
        <section className="hero">
          <div className="hero__badge">RURU 상담</div>
          <h1 className="hero__title">필요한 순간, 바로 연결되는 상담</h1>
          <p className="hero__desc">
            채팅 버튼을 누르면 상담원을 배정합니다. 배정이 완료될 때까지
            대기 화면이 유지돼요.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => setView('chat')}>
              채팅 연결
            </button>
            <button className="btn btn--ghost">이용 안내</button>
          </div>
        </section>
        <section className="steps">
          <div className="step-card">
            <div className="step-card__num">01</div>
            <div className="step-card__title">연결 요청</div>
            <div className="step-card__desc">버튼을 눌러 상담을 시작합니다.</div>
          </div>
          <div className="step-card">
            <div className="step-card__num">02</div>
            <div className="step-card__title">상담원 배정</div>
            <div className="step-card__desc">배정이 완료될 때까지 대기합니다.</div>
          </div>
          <div className="step-card">
            <div className="step-card__num">03</div>
            <div className="step-card__title">채팅 시작</div>
            <div className="step-card__desc">상담원이 들어오면 바로 대화합니다.</div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="app app--chat">
      <header className="chat-header">
        <div>
          <div className="chat-title">고객 상담 채팅</div>
          <div className={`chat-status ${assigned ? 'is-online' : 'is-wait'}`}>
            <span className="status-dot" />
            {statusLabel}
          </div>
        </div>
        <div className="chat-header__actions">
          <span className={`ws-pill ws-pill--${wsState}`}>
            {wsState === 'connected' ? 'WS 연결됨' : wsState === 'error' ? 'WS 끊김' : 'WS 연결 중'}
          </span>
          <button className="btn btn--ghost" onClick={() => sendStatus('LEFT')}>
            이탈
          </button>
          <button className="btn btn--ghost" onClick={() => sendStatus('RETURNED')}>
            복귀
          </button>
          <button className="btn btn--ghost" onClick={() => setView('landing')}>
            나가기
          </button>
        </div>
      </header>

      <section className="chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`bubble bubble--${msg.role}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={endRef} />
      </section>

      <footer className="chat-input">
        {!assigned && (
          <div className="wait-overlay">
            상담원 배정 중... 연결 후 메시지를 보낼 수 있어요.
          </div>
        )}
        <input
          type="text"
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend()
          }}
          disabled={!assigned}
        />
        <button className="btn btn--primary" onClick={onSend} disabled={!canSend}>
          전송
        </button>
      </footer>
    </div>
  )
}

export default App
