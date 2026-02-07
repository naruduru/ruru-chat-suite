import { Client } from '@stomp/stompjs'
import WebSocket from 'ws'

const wsUrl = process.env.WS_URL || 'ws://localhost:8080/customer'
const customerId = process.env.CUSTOMER_ID || 'w-1024'
const status = process.env.STATUS || 'LEFT'

const client = new Client({
  webSocketFactory: () => new WebSocket(wsUrl),
  reconnectDelay: 0,
  debug: (msg) => console.log('[stomp]', msg),
  onConnect: () => {
    const payload = {
      customerId,
      status,
      occurredAt: new Date().toISOString(),
    }
    client.publish({
      destination: '/app/customer/status',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    setTimeout(() => {
      client.deactivate()
    }, 300)
  },
  onStompError: (frame) => {
    console.error('STOMP error', frame.headers['message'])
    client.deactivate()
  },
  onWebSocketError: (err) => {
    console.error('WS error', err.message)
  },
})

client.activate()
