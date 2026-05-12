## Problem
Jeg misforsto forrige melding og fjernet Kap. 30:63 fra rapporten. Brukeren ønsker:
1. Teksten «Kap. 30:63 – Branncelleinndeling» med tilhørende innhold skal vises **både** på inputsiden og i rapporten.
2. På inputsiden skal den fargede/innrammede boksen rundt teksten fjernes – kun ren tekst.

## Endringer

### 1. `src/pages/Konsept.tsx` (linje 4948–4956)
Fjern `div`-wrapperen med `bg-accent/30 border border-accent rounded p-3` og erstatt med en ren tekstblokk uten bakgrunn/ramme. Behold tittel, innledningssetning, BBK-avhengige verdier (`branncellebegrensende`, `dorKrav`) og de tre kulepunktene. Bruk samme tekststørrelse som omgivelsene (f.eks. `text-xs space-y-2 mb-3`), tittel i fet skrift.

### 2. `src/components/konsept/KonseptPreview.tsx` (linje 1684–1714)
Gjeninnsett Kap. 30:63-raden i tabellen for BF85 som tidligere ble fjernet. Utvidelse av `bf85KravMap` tilbake til å inkludere `branncellebegrensende` og `dorKrav` per BBK 1–4. Ny rad rendres før Tekniske rom-raden:

- Forhold: «Kap. 30:63 – Branncelleinndeling»
- Løsning: innledning + ikke-bærende branncellebegrensende bygningsdel (verdi), + tre kulepunkter (form/innredning, sjakter, dørkrav). Verdier vises i fet skrift uten rød farge (matchende stilen vi ble enige om sist).
- Ansvar: «ARK/RIBr»

## Hva endres ikke
- Word-eksport (rendres fra preview-HTML – får automatisk endringen).
- Datamodell, branncelle-listen, øvrige rader (Tekniske rom, Loft/kjeller, Takflater).
- TEK17-visning.
