## Mål
Gjør det tydelig på innputtsiden hva togglen "Kraftstasjon under fjell eller under dagen" faktisk styrer, slik at brukeren forstår at avhukingen påvirker kap. 3.9.

## Endring
Under checkboxen i innledningen (Konsept.tsx, ved bygningstype = Kraftstasjon) legges det til en kort hjelpetekst (`text-xs text-muted-foreground`) som forklarer:

> Hukes av: Inkluderer krav om nødlysanlegg etter FEA-F § 26 i kap. 3.9 (gjelder stasjoner i fjell og under dagen). Krav etter FEA-F § 25 om uavhengig nødbelysning og anbefaling om håndlykter tas alltid med for kraftstasjoner.

## Filer
- `src/pages/Konsept.tsx` — utvid eksisterende kraftstasjon-toggle med beskrivelse under label.

Ingen logikkendring.
