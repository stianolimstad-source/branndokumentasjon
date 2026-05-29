# Plan: Tydeligere feilmeldinger for AI-analyse

## Bakgrunn

Brukeren får «dokumentet kan ikke leses» ved opplasting av tilstandsrapport. Edge-loggene viser at den faktiske feilen er fra Lovable AI Gateway:

```
AI API error: {"type":"payment_required","message":"Not enough credits"}  (HTTP 402)
```

Dvs. PDF-en leses fint, men AI-kallet feiler fordi AI-kreditten er brukt opp. I dag svelger edge-funksjonen detaljene og returnerer kun "AI analysis failed", som klienten viser som en generell feil. Det samme mønsteret gjelder for rate-limit (HTTP 429).

## Tiltak fra bruker

Fyll på AI-kreditter i Lovable Cloud (Workspace → Settings → Usage / Lovable AI). Uten kreditter vil ingen AI-funksjon i appen virke — verken brannkonsept-opplasting, ROS-opplasting, tilstandsvurdering-opplasting eller AI-brannkonsulent.

## Kodendringer

### 1. `supabase/functions/parse-fire-concept/index.ts`
Når `response.ok === false`, propagér status og en lesbar `errorType`:
- `402` → `{ error: "Lovable AI er tom for kreditter. Fyll på i Lovable Cloud → Settings → Usage.", errorType: "payment_required" }`
- `429` → `{ error: "AI-tjenesten er midlertidig overbelastet. Prøv igjen om et øyeblikk.", errorType: "rate_limited" }`
- Annet → behold dagens generelle melding, men inkluder statuskoden i error-strengen.

Returner samme HTTP-status som AI-Gatewayen ga (402/429) i stedet for å maskere alt som 500, slik at klienten ser forskjellen.

### 2. `src/components/konsept/UploadConceptDialog.tsx`
I `handleFileSelect` catch-blokken: hvis `data?.errorType === "payment_required"`, vis en egen toast «Lovable AI er tom for kreditter» med lenke-tekst som ber brukeren fylle på. Tilsvarende for `rate_limited`. For øvrige feil, behold dagens tekst.

Logg `console.log` av `text.length` allerede er på plass — behold den så vi kan se i konsollen at PDF-en faktisk ble lest.

### 3. `src/components/ros/UploadRosDialog.tsx` og `src/components/tilstandsvurdering/...` (om opplasting der bruker samme funksjon)
Speile samme håndtering så feilen vises konsekvent uansett hvor brukeren laster opp.

## Ikke i scope

- Endringer i selve PDF-parseren (`pdfjs-dist`) — den fungerer.
- Endringer i AI-modellen eller prompten.
- Automatisk re-try ved 429 (kan vurderes senere).

## Filer som endres

- `supabase/functions/parse-fire-concept/index.ts`
- `src/components/konsept/UploadConceptDialog.tsx`
- `src/components/ros/UploadRosDialog.tsx`
