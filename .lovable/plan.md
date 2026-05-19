## Mål
1. Gjøre «Årsaker (hendelser fra kap. 3)» i bow-tie-editoren til en kompakt nedtrekksmeny i stedet for en stor chip-liste.
2. Vise et merke/badge på hver hendelse i kap. 3 som forteller at den er brukt i én eller flere bow-tie-analyser (inkl. navn på topphendelsen(e)).

## Endringer

### `src/pages/RosAnalyse.tsx`

**A. Årsaker som nedtrekksmeny (linje ~702–732)**
- Erstatte chip-grid med en `Popover` + `Command` (samme mønster som `KonsekvensPicker`):
  - Trigger: `Button variant="outline" size="sm"` som viser «Velg årsaker ({antall valgt})».
  - I popoveren: `CommandInput` (søk på tittel/sårbarhet), `CommandList` med alle `content.hendelser`. Hver `CommandItem`:
    - Liten farget prikk (rød/gul/grønn fra `risikoFarge`) + tittel
    - `Check`-ikon når valgt
    - Klikk kaller `toggleBowTieHendelse(bt.id, h.id)` (popover holdes åpen).
  - Under trigger: kompakt rad med valgte som små «removable» chips (klikk × kaller toggle) — bevarer rask oversikt uten å fylle hele kortet.
- Tom-tilstand: «Registrer hendelser først» beholdes når `content.hendelser.length === 0`.

**B. Merknad i kap. 3-listen (linje ~535–551)**
- Beregne én gang per render: `bowTieBruk: Map<hendelseId, { navn: string }[]>` fra `content.bowTies`.
- I `AccordionTrigger`-raden, etter tittelen og før R-badgene, vise et lite badge når hendelsen er brukt:
  - `Badge variant="secondary"` med ikon (`Network` eller `GitBranch` fra lucide) + tekst «Bow-tie» (skjult under sm-breakpoint).
  - `Tooltip` (eller `title`) viser navnene på topphendelsene den inngår i, f.eks. «Brukt i: Eksplosjon, Brann i lager».
- Ingen endring i datamodellen eller eksport — kun visning i editor.

### Ingen endringer
- `RosPreview.tsx`, `ros-word-export.ts`, datamodell (`RosBowTie`), Konsekvens-pickeren.

## Verifisering
- Åpne en ROS-analyse, opprett bow-tie → «Velg årsaker» åpner søkbar liste, valg vises som chips, popoveren tar minimal plass.
- Velg en hendelse fra kap. 3 → samme hendelse i kap. 3-listen får «Bow-tie»-badge med tooltip som lister topphendelsen.
- Fjern valg → badge forsvinner. Slett hendelse → fjernes også fra bow-tie (eksisterende logikk).
