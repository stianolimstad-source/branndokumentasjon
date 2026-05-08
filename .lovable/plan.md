## Mål
Endre abonnementsprisene til norske kroner og oppdatere visningen på `/abonnement`.

## Nye priser

| Plan | Ny pris | Gammel pris |
|---|---|---|
| Månedlig | **500 NOK / mnd** | $9 USD |
| Årlig | **5 000 NOK / år** | 90 NOK (feilsatt) |

Årlig gir ~17 % rabatt (tilsvarer 10 måneder, 2 mnd gratis).

## Endringer

### 1. Paddle (via API)
- `PATCH /prices/pri_01kr36xghzd11md9nt7bt5g4yb` (månedlig) → `unit_price: { amount: "50000", currency_code: "NOK" }`
- `PATCH /prices/pri_01kr36xgy8dgkbagept52qeg4z` (årlig) → `unit_price: { amount: "500000", currency_code: "NOK" }`

Dette gjøres i sandbox nå. Når du publiserer synces det automatisk til live.

### 2. Frontend: `src/pages/Abonnement.tsx`
- Månedlig kort: `price="500 kr"`, `period="/mnd"`
- Årlig kort: `price="5 000 kr"`, `period="/år"`, badge `"Spar ~17%"`
- Fjern plassholder-tekst nederst ("Pristabellen er foreløpig…")

## Skatt (informativt)
Du trenger ikke gjøre noe spesielt. Paddle er Merchant of Record — de håndterer MVA mot kundene og utbetaler nettobeløp til deg. Du fører bare inntekten som vanlig i regnskapet.
