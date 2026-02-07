import { Client } from '@stomp/stompjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/counselor'
const STATUS_TOPIC = '/topic/counselor/status'

const seedSessions = [
  {
    id: 'w-1024',
    name: '김민지',
    preview: '배송이 늦어지고 있어요.',
    startedAt: '10:12',
  },
  {
    id: 'w-1025',
    name: '박진우',
    preview: '결제 오류가 납니다.',
    startedAt: '10:15',
  },
  {
    id: 'w-1026',
    name: '이서연',
    preview: '환불 문의 드립니다.',
    startedAt: '10:18',
  },
]

const cannedHistory = [
  {
    id: 'c-1001',
    name: '정도현',
    summary: '환불 정책 안내 완료',
    closedAt: '09:42',
  },
  {
    id: 'c-1002',
    name: '오하늘',
    summary: '주소 변경 요청 처리',
    closedAt: '09:20',
  },
]

const initialMessages = {
  'c-1001': [
    {
      id: 'm-1',
      role: 'system',
      text: '상담이 종료되었습니다. 상담 이력을 확인합니다.',
    },
    {
      id: 'm-2',
      role: 'customer',
      text: '환불 가능한지 문의드립니다.',
    },
    {
      id: 'm-3',
      role: 'counselor',
      text: '구매 후 7일 이내라면 환불 가능합니다.',
    },
  ],
  'c-1002': [
    {
      id: 'm-4',
      role: 'system',
      text: '상담이 종료되었습니다. 상담 이력을 확인합니다.',
    },
    {
      id: 'm-5',
      role: 'customer',
      text: '배송 주소를 바꾸고 싶어요.',
    },
    {
      id: 'm-6',
      role: 'counselor',
      text: '새 주소로 변경 완료했습니다.',
    },
  ],
}

const formatTime = (value) => {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [waiting, setWaiting] = useState(seedSessions)
  const [active, setActive] = useState([])
  const [closed, setClosed] = useState(cannedHistory)
  const [currentId, setCurrentId] = useState(null)
  const [currentMode, setCurrentMode] = useState(null)
  const [selectedWaitingId, setSelectedWaitingId] = useState(null)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [wsState, setWsState] = useState('connecting')
  const [statusEvents, setStatusEvents] = useState([])
  const [statusByCustomer, setStatusByCustomer] = useState({})
  const endRef = useRef(null)
  const clientRef = useRef(null)
  const chatSubRef = useRef(null)

  const currentActive = useMemo(
    () => active.find((item) => item.id === currentId) || null,
    [active, currentId]
  )

  const currentClosed = useMemo(
    () => closed.find((item) => item.id === currentId) || null,
    [closed, currentId]
  )

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new WebSocket(WS_URL),
      reconnectDelay: 3000,
      connectHeaders: {
        role: 'counselor',
      },
      onConnect: () => {
        setWsState('connected')
        clientRef.current = client
        client.subscribe(STATUS_TOPIC, (message) => {
          try {
            const payload = JSON.parse(message.body)
            const event = {
              id: crypto.randomUUID(),
              customerId: payload.customerId,
              status: payload.status,
              occurredAt: payload.occurredAt,
            }
            setStatusByCustomer((prev) => ({
              ...prev,
              [event.customerId]: event.status,
            }))
            setStatusEvents((prev) => [event, ...prev].slice(0, 8))
            if (event.customerId) {
              const systemText =
                event.status === 'LEFT'
                  ? '고객이 채팅을 이탈했습니다.'
                  : '고객이 채팅에 복귀했습니다.'
              setMessages((prev) => ({
                ...prev,
                [event.customerId]: [
                  ...(prev[event.customerId] || []),
                  {
                    id: crypto.randomUUID(),
                    role: 'system',
                    text: systemText,
                  },
                ],
              }))
            }
          } catch (error) {
            console.error('status payload parse error', error)
          }
        })
        client.subscribe('/topic/counselor/waiting', (message) => {
          try {
            const payload = JSON.parse(message.body)
            if (!payload.customerId || !payload.name) return
            setWaiting((prev) => {
              if (prev.some((item) => item.id === payload.customerId)) {
                return prev
              }
              return [
                {
                  id: payload.customerId,
                  name: payload.name,
                  preview: payload.preview || '상담 요청',
                  startedAt: formatTime(),
                },
                ...prev,
              ]
            })
          } catch (error) {
            console.error('waiting payload parse error', error)
          }
        })
      },
      onStompError: () => setWsState('error'),
      onWebSocketClose: () => setWsState('error'),
    })

    client.activate()

    return () => {
      chatSubRef.current?.unsubscribe()
      client.deactivate()
    }
  }, [])

  const openSession = () => {
    const session = waiting.find((item) => item.id === selectedWaitingId)
    if (!session) return

    setWaiting((prev) => prev.filter((item) => item.id !== session.id))
    setActive((prev) => [
      {
        ...session,
        startedAt: formatTime(),
      },
      ...prev,
    ])
    setCurrentId(session.id)
    setCurrentMode('active')
    setSelectedWaitingId(null)
    ensureChatSubscription(session.id)
    setMessages((prev) => ({
      ...prev,
      [session.id]: [
        {
          id: crypto.randomUUID(),
          role: 'system',
          text: `${session.name} 고객님과 상담이 시작되었습니다.`,
        },
      ],
    }))
    setInput('')
  }

  const sendMessage = () => {
    if (currentMode !== 'active' || !currentActive) return
    const text = input.trim()
    if (!text) return
    setInput('')

    const client = clientRef.current
    if (!client || !client.connected) return
    client.publish({
      destination: '/app/chat.send',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        roomId: currentActive.id,
        sender: 'counselor',
        content: text,
      }),
    })
  }

  const endSession = () => {
    if (currentMode !== 'active' || !currentActive) return
    setActive((prev) => prev.filter((item) => item.id !== currentActive.id))
    setClosed((prev) => [
      {
        id: currentActive.id,
        name: currentActive.name,
        summary: '상담 종료 및 요약 저장됨',
        closedAt: formatTime(),
      },
      ...prev,
    ])
    setCurrentMode('closed')
    setCurrentId(currentActive.id)
    setInput('')
  }

  const currentMessages = currentId ? messages[currentId] || [] : []

  const ensureChatSubscription = (roomId) => {
    const client = clientRef.current
    if (!client || !client.connected) return
    if (chatSubRef.current) {
      chatSubRef.current.unsubscribe()
      chatSubRef.current = null
    }
    chatSubRef.current = client.subscribe(`/topic/chat/${roomId}`, (message) => {
      try {
        const payload = JSON.parse(message.body)
        setMessages((prev) => ({
          ...prev,
          [roomId]: [
            ...(prev[roomId] || []),
            {
              id: crypto.randomUUID(),
              role: payload.sender === 'counselor' ? 'counselor' : 'customer',
              text: payload.content,
            },
          ],
        }))
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
      } catch (error) {
        console.error('chat payload parse error', error)
      }
    })
  }

  const panelTitle = (() => {
    if (currentMode === 'active' && currentActive) {
      return `${currentActive.name} 고객님 상담 중`
    }
    if (currentMode === 'closed' && currentClosed) {
      return `${currentClosed.name} 상담 이력`
    }
    if (selectedWaitingId) {
      const selected = waiting.find((item) => item.id === selectedWaitingId)
      return selected ? `${selected.name} 상담 시작 준비` : '상담 시작 준비'
    }
    return '상담을 선택해 시작하세요.'
  })()

  return (
    <div className="counselor">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__logo">RURU</div>
          <div>
            <div className="brand__title">상담 콘솔</div>
            <div className="brand__sub">실시간 고객 상담</div>
          </div>
        </div>

        <div className="ws-status">
          <span className={`ws-dot ws-dot--${wsState}`} />
          {wsState === 'connected'
            ? 'WS 연결됨'
            : wsState === 'error'
            ? 'WS 끊김'
            : 'WS 연결 중'}
        </div>

        <section className="status-panel">
          <div className="status-panel__title">고객 상태</div>
          {statusEvents.length === 0 ? (
            <div className="status-panel__empty">
              아직 수신한 상태 이벤트가 없습니다.
            </div>
          ) : (
            <div className="status-panel__list">
              {statusEvents.map((event) => (
                <div key={event.id} className="status-item">
                  <span
                    className={`status-chip status-chip--${
                      event.status === 'LEFT' ? 'left' : 'returned'
                    }`}
                  >
                    {event.status === 'LEFT' ? '이탈' : '복귀'}
                  </span>
                  <div>
                    <div className="status-item__title">
                      고객 {event.customerId}
                    </div>
                    <div className="status-item__time">
                      {formatTime(event.occurredAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="queue">
          <div className="queue__title">대기</div>
          <div className="queue__list">
            {waiting.map((item) => (
              <button
                key={item.id}
                className={`queue-card ${
                  selectedWaitingId === item.id ? 'is-active' : ''
                }`}
                onClick={() => {
                  setSelectedWaitingId(item.id)
                  setCurrentId(null)
                  setCurrentMode(null)
                }}
              >
                <div className="queue-card__row">
                  <div className="queue-card__name">{item.name}</div>
                  {statusByCustomer[item.id] && (
                    <span
                      className={`status-chip status-chip--${
                        statusByCustomer[item.id] === 'LEFT'
                          ? 'left'
                          : 'returned'
                      }`}
                    >
                      {statusByCustomer[item.id] === 'LEFT' ? '이탈' : '복귀'}
                    </span>
                  )}
                </div>
                <div className="queue-card__meta">
                  {item.startedAt} · {item.preview}
                </div>
              </button>
            ))}
            {waiting.length === 0 && (
              <div className="queue-empty">대기 중인 상담이 없습니다.</div>
            )}
          </div>
        </section>

        <section className="queue">
          <div className="queue__title">진행</div>
          <div className="queue__list">
            {active.map((item) => (
              <button
                key={item.id}
                className={`queue-card ${
                  currentMode === 'active' && currentId === item.id
                    ? 'is-active'
                    : ''
                }`}
              onClick={() => {
                setCurrentId(item.id)
                setCurrentMode('active')
                setSelectedWaitingId(null)
                ensureChatSubscription(item.id)
              }}
            >
                <div className="queue-card__row">
                  <div className="queue-card__name">{item.name}</div>
                  {statusByCustomer[item.id] && (
                    <span
                      className={`status-chip status-chip--${
                        statusByCustomer[item.id] === 'LEFT'
                          ? 'left'
                          : 'returned'
                      }`}
                    >
                      {statusByCustomer[item.id] === 'LEFT' ? '이탈' : '복귀'}
                    </span>
                  )}
                </div>
                <div className="queue-card__meta">시작 {item.startedAt}</div>
              </button>
            ))}
            {active.length === 0 && (
              <div className="queue-empty">진행 중인 상담이 없습니다.</div>
            )}
          </div>
        </section>

        <section className="queue">
          <div className="queue__title">종료</div>
          <div className="queue__list">
            {closed.map((item) => (
              <button
                key={item.id}
                className={`queue-card queue-card--history ${
                  currentMode === 'closed' && currentId === item.id
                    ? 'is-active'
                    : ''
                }`}
                onClick={() => {
                  setCurrentId(item.id)
                  setCurrentMode('closed')
                  setSelectedWaitingId(null)
                }}
              >
                <div className="queue-card__row">
                  <div className="queue-card__name">{item.name}</div>
                  {statusByCustomer[item.id] && (
                    <span
                      className={`status-chip status-chip--${
                        statusByCustomer[item.id] === 'LEFT'
                          ? 'left'
                          : 'returned'
                      }`}
                    >
                      {statusByCustomer[item.id] === 'LEFT' ? '이탈' : '복귀'}
                    </span>
                  )}
                </div>
                <div className="queue-card__meta">
                  {item.closedAt} · {item.summary}
                </div>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="panel">
        <header className="panel__header">
          <div>
            <div className="panel__title">상담 채팅</div>
            <div className="panel__subtitle">{panelTitle}</div>
          </div>
          <div className="panel__actions">
            <button
              className="btn btn--ghost"
              onClick={() => {
                if (selectedWaitingId) openSession()
              }}
              disabled={!selectedWaitingId}
            >
              상담 시작
            </button>
            <button
              className="btn btn--primary"
              onClick={endSession}
              disabled={currentMode !== 'active' || !currentActive}
            >
              상담 종료
            </button>
          </div>
        </header>

        <section className="chat">
          {currentMode === 'active' && currentActive ? (
            <div className="chat__body">
              {statusByCustomer[currentActive.id] && (
                <div className="chat-status-banner">
                  {statusByCustomer[currentActive.id] === 'LEFT'
                    ? '고객이 이탈한 상태입니다.'
                    : '고객이 복귀했습니다.'}
                </div>
              )}
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bubble bubble--${msg.role}`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          ) : currentMode === 'closed' && currentClosed ? (
            <div className="chat__body">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bubble bubble--${msg.role}`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          ) : selectedWaitingId ? (
            <div className="chat__empty">
              상담 시작 버튼을 누르면 채팅이 시작됩니다.
            </div>
          ) : (
            <div className="chat__empty">
              좌측 대기/진행/종료 목록에서 상담을 선택하세요.
            </div>
          )}

          <footer className="chat__input">
            <input
              type="text"
              placeholder="메시지를 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage()
              }}
              disabled={currentMode !== 'active' || !currentActive}
            />
            <button
              className="btn btn--primary"
              onClick={sendMessage}
              disabled={
                currentMode !== 'active' || !currentActive || !input.trim()
              }
            >
              전송
            </button>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App
