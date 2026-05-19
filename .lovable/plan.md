## Mål

Vise tabeller for **konsekvenskriterier** og **sannsynlighetskriterier** for kraftstasjoner sammen med 5×5-risikomatrisen, slik at leseren forstår hva nivåene 1–5 betyr. Merket tydelig "Gjelder kraftstasjoner" — strukturen åpnes senere for andre bransjer.

## Innhold (faste data fra opplastet bilde)

Nytt modul `src/lib/ros-risk-criteria.ts`:

```ts
export type BransjeId = "kraftstasjon"; // utvides senere

export interface KriterieRad { niva: 1|2|3|4|5; navn: string; beskrivelse: string; }

export const KONSEKVENS_KRITERIER: Record<BransjeId, {tittel: string; rader: KriterieRad[]}> = {
  kraftstasjon: {
    tittel: "Konsekvenskriterier – forsyningssikkerhet (kraftstasjon)",
    rader: [
      {niva:1, navn:"Ubetydelig", beskrivelse:"Ikke avbrudd i strøm- eller fjernvarmeforsyning."},
      {niva:2, navn:"Liten",      beskrivelse:"Ingen samfunnskonsekvenser. Avbrudd < 10 timer hos < 10 sluttbrukere."},
      {niva:3, navn:"Middels",    beskrivelse:"Noen lokale konsekvenser for privatabonnenter. Avbrudd < 10 t hos < 1000 sluttbrukere, eller ≥ 10 t hos < 10 sluttbrukere."},
      {niva:4, navn:"Alvorlig",   beskrivelse:"Alvorlige konsekvenser i infrastruktur og lokalsamfunn. Avbrudd ≥ 10 t hos < 1000 sluttbrukere."},
      {niva:5, navn:"Kritisk",    beskrivelse:"Samfunnsviktige funksjoner som liv og helse, samt viktig infrastruktur, rammet/satt ut av funksjon. Avbrudd ≥ 10 t hos ≥ 1000 sluttbrukere."},
    ],
  },
};

export const SANNSYNLIGHET_KRITERIER: Record<BransjeId, {tittel: string; rader: KriterieRad[]}> = {
  kraftstasjon: {
    tittel: "Sannsynlighetskriterier – frekvens (kraftstasjon)",
    rader: [
      {niva:1, navn:"Svært lite sannsynlig", beskrivelse:"Sjeldnere enn hvert 1000. år (aldri hørt om lignende). Inkluderer tilnærmet «utenkelige» forhold."},
      {niva:2, navn:"Lite sannsynlig",       beskrivelse:"Fra hvert 100. år til hvert 1000. år (hørt om lignende i Norge eller utlandet)."},
      {niva:3, navn:"Sannsynlig",            beskrivelse:"Fra hvert 10. år til hvert 100. år (skjedd i selskapet eller hos andre)."},
      {niva:4, navn:"Meget sannsynlig",      beskrivelse:"Fra 1 gang pr. år til hvert 10. år (skjedd flere ganger i eget eller andres selskap)."},
      {niva:5, navn:"Svært sannsynlig",      beskrivelse:"Oftere enn 1 gang pr. år (skjer ofte/svært ofte i eget/andres selskap)."},
    ],
  },
};
```

Strukturen `Record<BransjeId, ...>` gjør det enkelt å legge til f.eks. `"industri"`, `"helse"` senere uten å endre UI.

## Ny komponent

`src/components/ros/RosKriterier.tsx` — viser de to tabellene kompakt under hverandre, med liten badge "Gjelder kraftstasjoner". Bruker semantiske tokens (`bg-muted/30`, `border`, `text-muted-foreground`). Props: `bransje?: BransjeId` (default `"kraftstasjon"`), `compact?: boolean`.

Hver rad: `[niva]  Navn — beskrivelse`, der niva er en liten farget pille (grønn 1–2, gul 3, oransje 4, rød 5) for å koble visuelt til matrisen.

## Hvor det vises

1. **Redigering** — `src/pages/RosAnalyse.tsx` ved linje 910–912: under `<RosMatriks size="sm" />` i samme `border`-kortet.
2. **Preview** — `src/components/ros/RosPreview.tsx` rett etter den eksisterende fargeforklaringen på linje 728 (under 2.6 Risikomatrise).
3. **Word-eksport** — `src/lib/ros-word-export.ts` etter `matriseTabell` (linje 339): to nye `Table`-er med samme innhold (gjenbruker `KONSEKVENS_KRITERIER`/`SANNSYNLIGHET_KRITERIER`). Overskrift: "Konsekvens- og sannsynlighetskriterier (kraftstasjon)".

## Tekniske detaljer

- Ingen DB-endringer, ingen ROS-modellendringer. Bransje er hardkodet til `"kraftstasjon"` nå.
- Når flere bransjer skal støttes, kan vi legge `risikoKriterierBransje?: BransjeId` på ROS-content og en velger i metadata. Utenfor scope nå.
- Preview- og Word-tabellene bruker samme `KriterieRad`-data slik at HTML og .docx alltid er i synk.

## Ikke gjort

- Ingen bransje-velger i UI (kommer senere).
- Ingen endring av risikofargene i selve matrisen.
- Ingen tekstendringer i kap. 2.1 metode.
