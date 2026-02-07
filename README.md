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

## Diagrams
- Customer status flow (PNG): `diagrams/customer-status.png`
- Customer status flow (SVG): `diagrams/customer-status.svg`
- Mermaid source: `diagrams/customer-status.mmd`
- Source bundle: `diagrams/customer-status-source-bundle.txt`
