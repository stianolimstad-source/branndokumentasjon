## Problem

For BF85-konsepter slår dørkrav-tabellen i kap. 3.5 sammen bygningsbrannklasse 1 og 2 (`bbk12`) og 3 og 4 (`bbk34`). Det gir feil dørkrav for et BBK 1-bygg, der dører i A-klassifiserte vegger skal være A 30 (ikke B 30), og dører i vegger med krav B 60 skal være B 30.

Eksempel fra dagens `bf85DorKravMap` i `src/components/konsept/KonseptPreview.tsx` (linje 2048–2058):

- `bf85_kjeller_trapperom` → bbk12 = `"B 60 S (EI 60-CSa)"` → feil for BBK 1, der veggen er A 60 og døren skal være A 30 S.
- `bf85_loft_trapperom` → bbk12 = `"B 30 S (EI 30-CSa)"` → kan være feil for BBK 1 hvis veggen rundt trapperom er A 60.
- `bf85_branncelle_korridor` → bbk12 = `"B 30 (EI 30-Sa)"` → for BBK 1 skal det egentlig være A 30, men "ofte godtas B 30".
- `bf85_branncelle_branncelle` → samme som over.

Sammenslåingen av BBK 1+2 og BBK 3+4 hindrer korrekt visning og må splittes opp i alle fire klasser.

## Endring

### 1. `src/components/konsept/KonseptPreview.tsx` (~linje 2046–2075)

Erstatt `{ bbk12, bbk34 }` med `{ bbk1, bbk2, bbk3, bbk4 }` i `bf85DorKravMap`. Endre oppslaget fra `isBBK12 ? d.bbk12 : d.bbk34` til en `bbk`-nøkkel basert på faktisk bygningsbrannklasse:

```ts
const bbkKey = `bbk${bbk}` as "bbk1" | "bbk2" | "bbk3" | "bbk4";
const krav = d[bbkKey];
```

Foreslåtte verdier (avledet fra BF85 Tabell 30:41/30:75 — halve veggens motstand, A-klasse beholdes der vegg er A-klasse):

| Dørplassering | BBK 1 | BBK 2 | BBK 3 | BBK 4 |
|---|---|---|---|---|
| Branncelle – åpent trapperom (Tr1) | A 30 S | A 30 S | B 30 S | B 30 S |
| Korridor – lukket trapperom (Tr2) | A 30 S | A 30 S | B 30 S / F 30 S | B 30 S / F 30 S |
| Korridor/sluse – branntrygt trapperom (Tr2) | A 60 S | A 60 S | A 60 S | A 60 S |
| Røykfritt trapperom (Tr3) – fri luft | A 60 S | A 60 S | A 60 S | A 60 S |
| Korridor – fri luft (kombinasjon Tr3) | A 30 (med merknad) | A 30 / B 30 | B 30 | B 30 |
| Branncelle – korridor | A 30 (B 30 godtas) | A 30 (B 30 godtas) | B 30 | B 15 |
| Branncelle – branncelle | A 30 (B 30 godtas) | A 30 (B 30 godtas) | B 30 | B 15 |
| Loft – trapperom | A 30 S | A 30 S | B 30 S | B 15 S |
| Kjeller – trapperom | A 60 S | A 60 S | A 30 S (B 30 godtas) | A 30 S (B 30 godtas) |
| Kjeller under øverste – egen atkomst | A 60 S | A 60 S | A 60 S | A 60 S |

Disse må verifiseres mot Tabell 30:75 før låsing — se Spørsmål under.

### 2. `src/lib/word-export-chapter3.ts`

Speile samme strukturendring og verditabell i Word-eksporten slik at preview og rapport stemmer.

## Ikke endret

- TEK17-grenen.
- Inputlisten over dørplasseringer i `Konsept.tsx`.
- `getBaereevneTekstBF85`-tabellen.

## Spørsmål

For å sikre at tabellverdiene blir korrekte iht. BF85 Tabell 30:75, bekreft eller korriger:

1. Skal dørklassen alltid være A når veggens krav er A-klasse, eller skal vi tillate B-erstatning som standard og kun nevne A-kravet i en merknad?
2. Stemmer foreslått matrise over for alle 10 dørplasseringer i alle 4 bygningsbrannklasser? Hvis nei, oppgi korrekte verdier per celle.
3. Skal "B 30 godtas i praksis"-merknaden vises som egen tekst i raden (f.eks. parentes etter A-kravet), eller bare som tooltip/info?
