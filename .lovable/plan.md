## Mål

I dag støtter bow-tie-analysen kun **preventive barrierer** (venstre side: årsak → topphendelse). Vi mangler **konsekvensreduserende tiltak** på høyre side (topphendelse → konsekvens) – det vil si tiltak som ikke hindrer at topphendelsen inntreffer, men som reduserer skaden etterpå (f.eks. sprinkler, røykventilasjon, beredskapsplan, evakueringsplan).

Endringen gjelder bow-tie-delen i ROS-analysen (kap. 4) – både input, diagram, AI-analyse og Word-eksport.

## Datamodell

Utvid `RosBowTie` i `src/components/ros/RosPreview.tsx`:

```ts
export interface RosKonsekvensTiltak {
  tekst: string;
  konsekvensIndekser: number[]; // peker inn i bt.konsekvenser[]
  kilde?: "ai" | "manuell";
}

export interface RosBowTie {
  // ... eksisterende felt
  konsekvensReduserende?: RosKonsekvensTiltak[];
}
```

Vi bruker indekser fordi `bt.konsekvenser` er `string[]` uten ID. Hvis bruker fjerner en konsekvens må vi re-indeksere (samme mønster som vi allerede har for `arsakIds` på barrierer).

## Ny edge function: `analyze-bowtie-mitigations`

Speilbilde av `analyze-bowtie-barriers`, men:
- Input: `{ topphendelse, beskrivelse, konsekvenser: [{ id: index, tekst }] }`
- Systemprompt fokuserer på **konsekvensreduserende** tiltak (sprinkler, røykventilasjon, brannvesen-respons, beredskap, evakuering, varsling, branncellebegrensning av spredning). Maks ~80 tegn per tiltak.
- Returnerer `{ tiltak: [{ tekst, konsekvensIndekser: number[] }] }`
- Et tiltak må dekke minst 1 konsekvens (ikke 2 som for barrierer – konsekvensreduserende kan godt være målrettet mot én konsekvens).

## Input-side (`src/pages/RosAnalyse.tsx`)

Under blokken «Felles barrierer / tiltak» legger vi en **ny seksjon «Konsekvensreduserende tiltak»** med samme oppsett:

- Knapp «Analyser med AI» (krever ≥ 1 konsekvens registrert)
- Liste over genererte/manuelle tiltak med tekst + multivelg av konsekvenser
- Manuelt skjema: tekst-felt + popover-multivelg av konsekvenser + «Legg til»
- Slett-knapp per tiltak
- Hold tiltak i synk: når en konsekvens slettes/redigeres, fjernes ugyldige indekser, og indekser over slettet posisjon dekrementeres

Funksjoner som speiler eksisterende mønster:
- `analyzeKonsekvensTiltak(bt)`
- `addManuellKonsekvensTiltak(btId)`
- `removeKonsekvensTiltak(btId, index)`
- Nye lokale states: `analyzingKonsId`, `newKonsTekst`, `newKonsIndekser`

## Diagram (`BowTieDiagram` i `RosPreview.tsx`)

På høyre side får vi nå tre kolonner i stedet for to:

```text
TOPP  →  KONS-TILTAK  →  KONSEKVENSER
```

- Endre `KONS` til `KTIL` (tiltak) og legg til ny `KONS`-kolonne enda lengre til høyre når det finnes konsekvensreduserende tiltak.
- Hver konsekvens får sin egen farge (samme palett gjenbrukt).
- Linje topphendelse → tiltak farges nøytralt (grønn, lik dagens barrierer).
- Linje tiltak → konsekvens farges etter konsekvensen.
- Tiltak-kort viser «K1, K2 …»-prikker for hvilke konsekvenser de dekker (speiler dagens B1/B2-mønster på barrierer).
- Hover på en konsekvens fremhever tilhørende tiltak (og motsatt).
- Diagrambredde økes til ~1200 px når begge sider har «mellomledd».

Dekningsmatrise under diagrammet får et eget panel: «Konsekvens × tiltak» med fargede prikker, parallelt med dagens «Årsak × barriere»-matrise.

## Word-eksport (`src/lib/ros-word-export.ts`)

I bow-tie-blokken legges:
- Ny seksjon «Konsekvensreduserende tiltak» som lister punkter med «(reduserer: konsekvens A, konsekvens B)»-suffiks
- Ny dekningsmatrise «Konsekvens × tiltak» (samme stil som dagens årsak × barriere-matrise)

## Hva endringen ikke berører

- Hendelsesregister (kap. 3) er uendret – tiltak per hendelse er fortsatt frittstående.
- Datamigrering: ikke nødvendig, alt ligger i eksisterende `content` JSONB. Eksisterende bow-tier får bare et tomt `konsekvensReduserende`-felt.

## Filer som endres

- `src/components/ros/RosPreview.tsx` – type, diagram (tre kolonner høyre side), ny matrise
- `src/pages/RosAnalyse.tsx` – ny seksjon i input, sanitering ved last og ved sletting av konsekvens
- `src/lib/ros-word-export.ts` – ny seksjon + matrise i bow-tie-eksport
- **Ny fil:** `supabase/functions/analyze-bowtie-mitigations/index.ts`

## Spørsmål før implementasjon

1. Skal AI-analysen for konsekvensreduserende tiltak være en **egen knapp** i UI, eller skal dagens «Analyser med AI»-knapp kjøre **begge** analysene samtidig (én klikk → AI foreslår både barrierer og konsekvensreduserende tiltak)?
2. Skal et tiltak måtte dekke **minst 1** konsekvens (mer fleksibelt) eller **minst 2** (kun «felles» tiltak, som for barrierene)?
