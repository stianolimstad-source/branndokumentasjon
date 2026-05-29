# Ekstraher TEK17-logikk fra Konsept.tsx til src/lib/tek17/

Ren ekstraksjon – ingen UI-endringer, ingen atferdsendringer. Kun flytting av top-level konstanter og funksjoner ut av `src/pages/Konsept.tsx` (11 391 linjer) til et nytt bibliotek, og oppdatering av imports.

## Funn fra kartlegging

Følgende eksisterer som top-level deklarasjoner i `Konsept.tsx` og kan flyttes direkte:

- `bygningsTypeRisikoklasseMap` (linje 92)
- `DEFAULT_OVERORDNET` (linje 154)
- `branncelleTyperListe` (linje 163) – merk: finnes også i `src/lib/fire-concept-constants.ts`; vi konsoliderer ved å la tek17/branncelle.ts re-eksportere derfra eller flytte og fjerne duplikatet (se "Duplikat-håndtering" nedenfor)
- `getBrannklasse` (linje 188) – versjonen i Konsept.tsx tar ekstra parameter `erRKL6Boligbygning` (utvidet vs. fire-concept-constants)
- `brannklasseTabell` (linje 226, lokal inne i `getBrannklasse`)
- `getRelevantUnntak` (linje 250)
- `seksjoneringsGrenser` (linje 276)
- `isSeksjoneringRequired` (linje 283)
- `getBaereevneTekst` (linje 308) – inkl. unntakstekstene `unntak3/4/5` (linje 383–385)

`getAktiveRiskKlasser`, `getFluktveiKrav`, `getStrengesteFluktvei`, `getFriBreddeKrav`, `getStrengesteFriBredde` ligger allerede i `src/lib/fire-concept-constants.ts` og importeres på linje 14. De flyttes til `src/lib/tek17/romning.ts` og `risikoklasser.ts` og re-eksporteres fra barrel.

## Hva som IKKE kan ekstraheres som planlagt

Disse er nevnt i prompten, men finnes ikke som named top-level data i Konsept.tsx (de bor inne i JSX-arrays/closures). De holdes utenfor denne fasen, jf. prompten "UI skal ikke flyttes ennå":

- `trapperomTypeMap310` (Tr1/Tr2/Tr3-tabell § 11-13) – finnes ikke som constant; trapperomslogikken er strødd som inline arrays inne i JSX og auto-beregning (rundt linje 6157–6180, 6671–6698). Flagges som fase 2.
- Tabell 1A/1B for § 11-9 overflater – data lever i JSX rundt linje 7737–7868, ikke som named constants.
- Toggle-håndtering for `trappeloep/kjeller/utvendig` i bæreevne – `getBaereevneTekst` tar allerede toggles som parameter; flyttes som den er. Selve toggle-state forblir i komponenten.
- `getBaereevneTekstBF85` og BF85-konstanter ligger allerede i `src/lib/bf85-constants.ts` – ikke rør.

`src/lib/tek17/overflater.ts` og `src/lib/tek17/romning.ts` opprettes likevel som tomme/minimale moduler (med det som faktisk finnes: § 11-14 bredde og fluktvei flyttet fra `fire-concept-constants.ts`) slik at barrel-strukturen er på plass for fase 2.

## Duplikat-håndtering

`branncelleTyperListe` og fluktvei/bredde-helpers eksisterer både i Konsept.tsx og i `src/lib/fire-concept-constants.ts`. Plan:

1. Flytt kanonisk versjon til `src/lib/tek17/`.
2. Endre `src/lib/fire-concept-constants.ts` til å re-eksportere fra `@/lib/tek17` (ingen brytende endring for andre konsumenter; en grep viser at flere filer importerer derfra).
3. Konsept.tsx-versjonen slettes og erstattes med import.

`getBrannklasse`: tek17-versjonen blir den utvidede (med `erRKL6Boligbygning`-parameter, default optional). `fire-concept-constants.ts` får sin re-eksportert versjon – kall uten den nye parameteren forblir kompatible.

## Filstruktur

```text
src/lib/tek17/
  index.ts            barrel, export * from hver fil
  risikoklasser.ts    bygningsTypeRisikoklasseMap, getAktiveRiskKlasser, RK-typer
  brannklasser.ts     brannklasseTabell, getBrannklasse, getRelevantUnntak,
                      unntak3/4/5-tekstene, BKL-type
  baereevne.ts        getBaereevneTekst (importerer fra brannklasser ved behov)
  brannseksjonering.ts seksjoneringsGrenser, isSeksjoneringRequired
  branncelle.ts       branncelleTyperListe
  overflater.ts       (skall – minimal modul, klar for fase 2)
  romning.ts          getFluktveiKrav, getStrengesteFluktvei,
                      getFriBreddeKrav, getStrengesteFriBredde
  overordnet.ts       DEFAULT_OVERORDNET
```

## Endringer i Konsept.tsx

- Fjern linje 92, 154, 163, 188–246, 250–273, 276–281, 283–306, 308–387 (omtrentlig – nøyaktige hunks ved implementasjon).
- Endre import-blokken: legg til samlet import fra `@/lib/tek17`, fjern duplikate fra `fire-concept-constants.ts`.
- Ingen øvrige endringer i komponentkroppen.

Forventet linjereduksjon i Konsept.tsx: ca. 200–250 linjer (ikke 1500–2500 som prompten anslår – mesteparten av Konsept.tsx er JSX og state, ikke ekstraherbar data/logikk).

## Endringer i andre filer

- `src/lib/fire-concept-constants.ts`: erstatt egne definisjoner med re-eksport fra `@/lib/tek17`. Beholder fil og navn så alle eksisterende importsteder fortsetter å virke.
- `src/components/konsept/KonseptPreview.tsx`: ingen endring nødvendig (importerer ikke fra Konsept.tsx ifølge grep).
- `src/lib/bf85-constants.ts`: urørt.

## Verifikasjon

1. TypeScript-build skal gå grønt.
2. `wc -l src/pages/Konsept.tsx` før/etter for å bekrefte reduksjon.
3. Visuell røyktest: åpne et eksisterende TEK17-konsept og et BF85-konsept – ingen endringer skal være synlige.

## Risiko

Lav – ren mekanisk flytting av top-level deklarasjoner. Eneste subtile punkt er at `getBrannklasse` i Konsept.tsx har én ekstra (valgfri) parameter sammenlignet med `fire-concept-constants.ts`-versjonen; vi beholder den utvidede signaturen og gjør parameteren optional, slik at begge eksisterende kallsteder fortsetter å fungere.
