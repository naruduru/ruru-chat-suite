# ruru-chat-suite

Monorepo for customer, counselor, and counselor_be.

## Projects
- `customer`
- `counselor`
- `counselor_be`

## Run

### 1) Backend (Spring)
```bash
cd counselor_be
./gradlew bootRun
```

### 2) Customer (Vite)
```bash
cd customer
npm install
npm run dev -- --host
```

### 3) Counselor (Vite)
```bash
cd counselor
npm install
npm run dev -- --host --port 5174
```

## Customer Status Test
1) Open customer UI: http://localhost:5173
2) Open counselor UI: http://localhost:5174
3) In customer UI, click **채팅 연결**
4) Click **이탈** or **복귀** buttons (top-right)
5) Counselor UI should show status in the left panel and chat banner

## Chat Test
1) Customer UI: click **채팅 연결**
2) Counselor UI: select the waiting card → **상담 시작**
3) Send message from customer → counselor receives
4) Send message from counselor → customer receives

## Diagrams
- Customer status flow (PNG): `diagrams/customer-status.png`
- Customer status flow (SVG): `diagrams/customer-status.svg`
- Mermaid source: `diagrams/customer-status.mmd`
- Source bundle: `diagrams/customer-status-source-bundle.txt`
