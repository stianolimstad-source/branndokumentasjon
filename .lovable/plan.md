

# TEK17 AI-assistent

## Hva vi bygger
En chatbasert AI-assistent som kan svare på spørsmål om TEK17 (Teknisk forskrift), VTEK17, og brannteknisk prosjektering. Assistenten blir tilgjengelig som en flytende chat-boble på alle sider, samt en dedikert side.

## Arkitektur

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Chat UI    │────▶│  Edge Function   │────▶│  Lovable AI     │
│  (React)    │◀────│  tek17-chat      │◀────│  Gateway        │
│  Streaming  │     │  System prompt   │     │  gemini-3-flash │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementasjon

### 1. Edge Function: `supabase/functions/tek17-chat/index.ts`
- Streaming SSE-basert chat med Lovable AI Gateway
- System-prompt som inneholder kjerneinnholdet fra TEK17 kapittel 11 (brannsikkerhet), inkludert:
  - Risikoklasser og brannklasser
  - Krav til branncelleinndeling, rømningsveier, brannmotstand
  - Materialkrav og overflatebehandling
  - Sprinkler- og slokkekrav
  - Nøkkelreferanser til VTEK17
- Modell: `google/gemini-3-flash-preview` (rask og presis)
- Håndterer 429/402-feil

### 2. Chat-komponent: `src/components/tek17/TEK17Chat.tsx`
- Flytende chat-boble (ikon nederst til høyre)
- Ekspanderbar til chat-panel med meldingshistorikk
- Streaming token-by-token rendering med markdown-støtte
- Forhåndsdefinerte hurtigspørsmål (f.eks. "Hva er kravene for RK4?", "Når trengs sprinkler?")
- Responsivt design

### 3. Dedikert side: `src/pages/TEK17Assistent.tsx`
- Fullskjerm chat-grensesnitt
- Lenke fra hovedmenyen/verktøysiden

### 4. Routing og navigasjon
- Ny rute `/tek17-assistent`
- Kort på Index-siden og Verktøy-siden
- Flytende chat-boble tilgjengelig på alle sider

## Tekniske detaljer
- Bruker eksisterende `LOVABLE_API_KEY` (allerede konfigurert)
- Ingen database-tabeller nødvendig (chat-historikk kun i session)
- System-prompten inneholder komprimert TEK17 kap. 11 referansemateriale for presise svar
- Markdown-rendering via `react-markdown`

