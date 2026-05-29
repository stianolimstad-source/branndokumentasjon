# Koble «Inkluder referansetabeller» til preview og Word-eksport

## Bakgrunn
Flagget heter `formData.inkluderReferansetabeller` (ikke `…IRapport`). Det fungerer allerede for kap 3.10 (§ 11-13 fluktvei) og 3.11 (§ 11-14 fri bredde) i både `KonseptPreview.tsx` og `word-export-chapter3.ts`. Manglende kobling: kap 3.1, 3.4, 3.5 og 3.6. Editor-Collapsibles i `Konsept.tsx` beholdes uendret (kun et hjelpemiddel for redaktør).

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx`
Legg til referansetabell rett etter prosjektets klassifiseringstekst, gated på `formData.inkluderReferansetabeller`, i:

- **Kap 3.1 § 11-4 Bæreevne** — tabell over R-krav (R 30 / R 60 / R 90 etc.) per BKL 1–3, fra `src/lib/tek17/baereevne.ts` / VTEK § 11-4 Tabell 1.
- **Kap 3.4 § 11-7 Brannseksjonering** — arealgrense-tabell per brannenergikategori × tiltak, basert på `seksjoneringsGrenser` i `src/lib/tek17/brannseksjonering.ts`.
- **Kap 3.5 § 11-8 Brannceller** — EI-klasser for branncellebegrensende konstruksjon og tilhørende dørkrav (EI₂CS) per BKL 1–3, fra VTEK § 11-8.
- **Kap 3.6 § 11-9 Materialer** — vise *kun den tabellen som ikke matcher prosjektet* (Tabell 1A for RK 1–5 hvis prosjektet er RK 6, og motsatt Tabell 1B for RK 6 hvis prosjektet er RK 1–5). Hovedteksten viser allerede den relevante tabellen.

Hver referansetabell rendres som `<table>` med eksisterende preview-stil (matche tabellen brukt i 3.10 referansetekst og øvrige preview-tabeller, små bokstaver, italic «Kilde: …»). Mønster:
```tsx
{formData.inkluderReferansetabeller && (
  <table className="…referansetabell…"> … </table>
)}
```

### 2. `src/lib/word-export-chapter3.ts`
Tilsvarende tilskudd i samme fire kapitler. Bruk eksisterende docx-tabellhjelpere (`new Table({...})`) med samme stil som de andre tabellene i Word-eksporten (border, shading, font). Gate på `formData.inkluderReferansetabeller`. Plasser tabellen rett etter den konditionelle teksten om gjeldende klassifisering, slik at rekkefølgen matcher preview.

For 3.6: samme «vis kun den som ikke matcher prosjektet»-logikk som over.

### 3. `src/pages/Konsept.tsx`
Kun teksten til avkrysningsboksen (linje ~11141–11148) oppdateres. Selve `SectionCollapsible`/`Collapsible`-blokkene i editoren beholdes urørt.

Ny tekst i et `<TooltipProvider>` eller med `title=`-attributt (følg eksisterende mønster i samme fil — sjekk hvilken mekanisme nabokomponenter bruker):

> «Inkluder referansetabeller i rapporten — Når du huker av denne, blir fullstendige referansetabeller fra TEK17 § 11 inkludert i forhåndsvisning og Word-eksport. Tabellene viser alle brann- og risikoklasser. Når den er av (default), vises kun det som gjelder ditt prosjekt.»

## Gjelder også tilstandsvurdering
`KonseptPreview.tsx` og `word-export-chapter3.ts` brukes for begge `documentType`-verdier. Samme `formData.inkluderReferansetabeller`-flagg styrer begge rapportformene — ingen ekstra forgrening nødvendig.

## Filer som endres
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
- `src/pages/Konsept.tsx` (kun hjelpetekst på avkrysningsboksen)

## Testkriterier
1. Hake på → preview viser referansetabeller i kap 3.1, 3.4, 3.5, 3.6, 3.10, 3.11.
2. Hake på → Word-eksport inneholder samme tabeller med konsistent stil.
3. Hovedinnholdet er fortsatt kun det relevante for prosjektets klassifisering; referansetabellen er et tillegg.
4. Hake av → preview og Word er kompakte uten tabellene.
5. Samme oppførsel for `documentType === "tilstandsvurdering"`.
