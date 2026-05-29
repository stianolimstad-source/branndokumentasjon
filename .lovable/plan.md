## Mål

Legg til editor-only referansetabeller (Collapsible «Vis full referansetabell (kun i editor)») i kap 3.1, 3.4, 3.5, 3.6, 3.9 og en ekstra tabell i 3.10, kun i TEK17-grenen. Følg eksisterende mønster fra kap 3.10 (linjene 9468–9488 i `src/pages/Konsept.tsx`). Tabellene skal ikke renderes i `KonseptPreview.tsx` eller `word-export-chapter3.ts`.

## Mønster

For hver innsetting brukes samme JSX-struktur som dagens 3.10:

```tsx
<Collapsible>
  <CollapsibleTrigger className="text-xs text-primary hover:underline mt-2">
    Vis full referansetabell (kun i editor)
  </CollapsibleTrigger>
  <CollapsibleContent>
    <table className="w-full text-xs border mt-2">
      <thead className="bg-muted">
        <tr>{/* headers */}</tr>
      </thead>
      <tbody>{/* rader */}</tbody>
    </table>
    <p className="text-[11px] text-muted-foreground mt-1 italic">
      Kilde: VTEK § 11-X Tabell N.
    </p>
  </CollapsibleContent>
</Collapsible>
```

Plassering: under hovedinnholdet for §-seksjonen, før eventuell `TilstandsvurderingPanel`. Innpakkes i `{formData.regelverk !== "BF85" && (...)}` slik at BF85 forblir uendret.

## Endringer – `src/pages/Konsept.tsx`

### 1. Kap 3.1 – § 11-4 Bæreevne (SectionCollapsible starter linje 4441)
Legg til Collapsible mot slutten av TEK17-grenens innhold i seksjonen (etter unntaks-/toggles-blokken, før eventuell TilstandsvurderingPanel). Tabell: Bygningsdel × BKL 1/2/3 med 5 rader (hovedsystem, sekundære, trappeløp, utvendige trapper, under øverste kjeller) iht. spesifikasjonen.
Kilde: «VTEK § 11-4 Tabell 1.»

### 2. Kap 3.4 – § 11-7 Brannseksjonering (SectionCollapsible linje 5032)
Legg til Collapsible nederst i TEK17-grenen. Tabell: Spesifikk brannenergi × Normalt / Brannalarm / Sprinkler / Røykventilasjon (3 rader: >400, 50–400, <50).
Kilde: «VTEK § 11-7 Tabell 1.»

### 3. Kap 3.5 – § 11-8 Brannceller (SectionCollapsible linje 5598)
Collapsible med 3 rader: Branncellebegrensende vegg/dekke, Dør i branncellebegrensende konstruksjon, Vindu i branncellebegrensende vegg – kolonner BKL 1/2/3.
Kilde: «VTEK § 11-8 Tabeller 1 og 2.»

### 4. Kap 3.6 – § 11-9 Materialer (SectionCollapsible linje 7521)
To separate Collapsibles, men vis kun «den andre» tabellen i forhold til prosjektets RK:
- Hvis prosjektet har kun RK 1–5 → vis Tabell 1B (RK 6) som referanse.
- Hvis prosjektet har kun RK 6 → vis Tabell 1A (RK 1–5) som referanse.
- Hvis begge → vis ingen ekstra (begge ligger allerede i hovedteksten).

Bruk eksisterende `getMaterialerReferanseTabell`-logikk i `src/lib/tek17/referansetabeller.ts` som referanse for hvilken som er «den andre», men implementer som inline JSX i Konsept.tsx (ikke gjenbruk komponent for preview/Word). Tabellene har headere Plassering × BKL 1/2/3 og radene gitt i spesifikasjonen (7 rader for 1A, 5 rader for 1B).
Kilder: «VTEK § 11-9 Tabell 1A.» / «VTEK § 11-9 Tabell 1B.»

### 5. Kap 3.9 – § 11-12 Brannvarsling (SectionCollapsible linje 8535)
Collapsible med tabell: Risikoklasse × 1 etasje / 2+ etasjer (6 rader RK1–RK6) + forklaringsavsnitt under tabellen (Kategori 1/Kategori 2) som `<p className="text-xs text-muted-foreground mt-2">…</p>` over kildelinjen.
Kilde: «VTEK § 11-12 Tabell 3.»

### 6. Kap 3.10 – § 11-13 Tabell 2 (ny, i tillegg til eksisterende Tabell 1 på linje 9468)
Legg til en ny, separat Collapsible umiddelbart etter den eksisterende (etter linje 9488) med tabell: Risikoklasse × ≤8 etasjer / >8 etasjer (6 rader) + forklaring (Tr 1/Tr 2/Tr 3).
Kilde: «VTEK § 11-13 Tabell 2.»

## Ikke endres

- `src/components/konsept/KonseptPreview.tsx` – ingen rendering av disse tabellene.
- `src/lib/word-export-chapter3.ts` – ingen tabell-eksport.
- BF85-grenene i alle seksjoner – uberørt.
- All dagens conditional hovedtekst – beholdes; tabellene er kun et tillegg under.
- `src/lib/tek17/referansetabeller.ts` – uberørt (brukes ikke fra dette mønsteret, men beholdes som data-referanse).

## Verifikasjon

1. TEK17-prosjekt: åpne kap 3.1, 3.4, 3.5, 3.6, 3.9, 3.10 → hver `Vis full referansetabell (kun i editor)` åpner riktig tabell.
2. Forhåndsvisning: ingen av tabellene synlige.
3. Word-eksport: ingen av tabellene med.
4. BF85-prosjekt: ingen av disse Collapsibles vises; eksisterende BF85-tabeller (30:41 osv.) er uendret.
5. Kap 3.6 med RK 1–5 → Tabell 1B vises som referanse; med RK 6 → Tabell 1A; med begge → ingen ekstra.

## Filer som endres

- `src/pages/Konsept.tsx` (6 innsettinger i TEK17-grener)
