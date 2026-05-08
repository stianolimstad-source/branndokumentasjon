## Mål

Endre refusjonspolicyen fra 30 til 14 dagers pengene-tilbake-garanti, slik at den matcher prøveperioden. Etter prøveperioden gis det ikke refusjon for endring av mening.

## Endringer

**Fil: `src/pages/legal/Refusjon.tsx`**

1. Endre overskriften "30 dagers pengene-tilbake-garanti" → "14 dagers pengene-tilbake-garanti".
2. Endre brødteksten "innen 30 dager etter kjøpsdato" → "innen 14 dager etter kjøpsdato".
3. Legg til en kort, tydelig setning som forklarer sammenhengen med prøveperioden, f.eks.:
   > "Refusjonsperioden tilsvarer den 14 dager lange gratis prøveperioden. Du kan teste tjenesten gratis i 14 dager før du belastes — etter at en betaling er gjennomført, gis ikke refusjon for endring av mening."
4. Oppdater "Sist oppdatert"-datoen til dagens dato.

## Andre steder å sjekke

Sjekk om "30 dager" / "30 dagers pengene-tilbake-garanti" nevnes andre steder i appen (landingsside, prising, FAQ, abonnementsside). Hvis ja, oppdater disse til 14 dager for konsistens.

## Paddle-krav

14 dager er innenfor Paddles tillatte intervall (14–90 dager). Policyen forblir godkjent for readiness check. Vi unngår fortsatt forbudte fraser som "no refunds" / "all sales final" — refusjon innen 14 dager er fortsatt garantert.
