## Mål
Erstatte fritekst-input for konsekvenser i bow-tie-analysen med en nedtrekksliste (Combobox) med forhåndsdefinerte, brann- og eksplosjonsrelevante konsekvenser for ulike bygningstyper. Brukeren skal fortsatt kunne legge til egne (fri tekst).

## UX
- «Legg til konsekvens» åpner en **Combobox** (Popover + cmdk) med søk.
- Konsekvenser er gruppert i kategorier (`CommandGroup`) for rask navigering.
- Søkefeltet filtrerer i sanntid. Skriver brukeren noe som ikke finnes, vises «+ Legg til "{tekst}"» som lar dem opprette en egen konsekvens.
- Valgte konsekvenser vises som rader under (eksisterende UI), fortsatt redigerbare og slettbare.
- Samme konsekvens kan ikke velges to ganger på samme topphendelse (dempet i listen).

## Forhåndsdefinerte konsekvenser
Ny fil `src/lib/ros-konsekvenser.ts` — kuratert liste basert på DSB, NS 5814, FEU, Sintef og generell ROS-praksis. Fokus: brann og eksplosjon, dekker bolig, næring, industri, lager, helse, skole, kulturbygg, parkering, kraftstasjon.

```ts
export interface KonsekvensForslag { kategori: string; tekst: string; }
export const KONSEKVENS_KATEGORIER = [
  // Liv og helse
  "Dødsfall blant beboere / brukere",
  "Alvorlig personskade (brannskader, røykforgiftning)",
  "Lettere personskader",
  "Dødsfall eller skade på innsatspersonell (brannvesen)",
  "Panikk og klemskader under evakuering",
  "Skade på husdyr / dyr i landbruksbygg",
  // Bygning og materielle verdier
  "Totalskade av bygning",
  "Omfattende brann- og røykskader i deler av bygget",
  "Vannskader som følge av slokkeinnsats",
  "Skade på bærende konstruksjoner / fare for kollaps",
  "Skade på fasade og tak ved utvendig brannspredning",
  "Skade på tekniske installasjoner (el, VVS, ventilasjon)",
  "Skade på heis og rømningsveier",
  // Eksplosjon
  "Trykkbølge med skade på bygningskropp",
  "Splintskader fra knust glass og fasadeelementer",
  "Sekundær brann etter eksplosjon",
  "Skade på nabobygg fra trykkbølge / kastestykker",
  "Utslipp av brennbar gass / damp",
  // Miljø
  "Utslipp av røyk og forurenset slokkevann til grunn/vassdrag",
  "Spredning av farlige stoffer (kjemikalier, asbest, PCB)",
  "Klimagassutslipp ved storbrann",
  // Drift, økonomi, samfunn
  "Driftsstans / produksjonsstopp",
  "Tap av kritisk infrastruktur (strøm, IKT, nødnett)",
  "Tap av kulturhistoriske verdier / uerstattelige objekter",
  "Tap av forskningsdata / dokumentasjon",
  "Økonomisk tap (gjenoppbygging, erstatninger)",
  "Tap av omdømme",
  "Forsikringsmessige konsekvenser / regress",
  // Evakuering / beredskap
  "Behov for omplassering av beboere / brukere",
  "Stenging av vei eller område rundt bygget",
  "Belastning på nødetater og helsetjeneste",
  // Spesifikt for sårbare bygg
  "Risiko for pasienter som ikke kan evakuere selv (sykehus, sykehjem)",
  "Risiko for barn i barnehage / skole",
  "Spredning til lagrede brannfarlige varer",
  "Domino-effekt på nærliggende industri / tankanlegg",
];
```
(Endelig liste utvides/justeres ved skriving — ca. 30–40 punkter gruppert i ~7 kategorier.)

## Endringer

### `src/lib/ros-konsekvenser.ts` (ny)
- Eksporterer `KONSEKVENS_FORSLAG: KonsekvensForslag[]` og hjelper `groupByKategori()`.

### `src/pages/RosAnalyse.tsx`
- Importere `Command*` fra `@/components/ui/command`, `Popover*` fra `@/components/ui/popover` og listen.
- Erstatte «Legg til»-knappen og fritekst-rader med:
  - Knapp «+ Legg til konsekvens» som åpner Popover med Command-søk gruppert per kategori.
  - Valg legger strengen direkte i `bt.konsekvenser`.
  - `CommandEmpty` rendres som klikkbar «Legg til "{søk}"» for egne konsekvenser.
- Beholde nåværende visning av valgte konsekvenser som rader (med slett-knapp), men erstatte fri-tekst `Input` med vanlig tekst — brukeren kan fortsatt redigere via et lite blyantikon som bytter til Input, ELLER vi beholder Input slik at egne tekster kan finpusses. Vi beholder Input for fleksibilitet.

### Ingen endringer
- `RosPreview.tsx`, `ros-word-export.ts` og datamodellen er uendret — konsekvenser er fortsatt `string[]`.

## Verifisering
- Klikk «+ Legg til konsekvens» → Popover åpnes, kategorier vises, søk filtrerer.
- Velg «Totalskade av bygning» → vises som rad.
- Skriv «Egendefinert X» → «Legg til "Egendefinert X"» → legges til.
- Slett-knapp fjerner rad. Lagring og Word-eksport fungerer som før.
