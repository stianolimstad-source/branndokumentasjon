## Mål
I § 3.4 for BF85 (både brannkonsept og tilstandsvurdering) skal "Gjennomsnittlig spesifikk brannbelastning" velges fra intervaller (jf. Tabell 34:23) i stedet for å skrives inn som et nøyaktig tall.

## Intervaller (matcher `bf85TabellRader` i `src/lib/bf85-constants.ts`)
- under 50 MJ/m²
- 50 – 200 MJ/m²
- 200 – 400 MJ/m²
- over 400 MJ/m²

## Endring i `src/pages/Konsept.tsx` (linje ~4388–4397)
Bytt ut `<Input type="number">` for `bf85_34_brannbelastning` med en `<Select>`:
- Verdier lagres som representativt midtpunkt slik at eksisterende `getBF85BrannveggKravKap34(areal, brannbelastning, tiltak)` (som matcher på intervaller) fortsatt fungerer uendret:
  - "under 50" → `"25"`
  - "50–200" → `"125"`
  - "200–400" → `"300"`
  - "over 400" → `"500"`
- Trigger-høyde og styling holdes likt det andre Select-feltet i samme rad ("Tiltak").
- `value`-bindingen leser fra `formData.bf85_34_brannbelastning` direkte (strengen som lagres er midtpunktet).

Ingen endringer kreves i `bf85-constants.ts`, forhåndsvisning eller Word-eksport, siden eksisterende logikk allerede tolker tallet via intervallene i `bf85TabellRader`.

## Filer som endres
- `src/pages/Konsept.tsx`
