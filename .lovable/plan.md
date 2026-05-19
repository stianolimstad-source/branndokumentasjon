## Mål
Legg til en ny innledende seksjon **2.1 Analyseprosess** i kap. 2 i `src/components/ros/RosPreview.tsx`, som beskriver hvordan ROS-analysen er bygget opp basert på risikoanalyseprosessen i Aven, Røed, Wiencke (2008) / ISO 31000. Eksisterende skala/matrise-seksjoner renummereres tilsvarende. Tilsvarende oppdatering i Word-eksporten (`src/lib/ros-word-export.ts`) hvis den speiler kapittel 2.

## Innhold i ny 2.1 Analyseprosess

Kort introtekst:
> Analysen følger risikoanalyseprosessen beskrevet i Aven, Røed og Wiencke (2008) "Risikoanalyser – prinsipper og metoder, med anvendelser", som igjen bygger på ISO 31000. Prosessen deles i tre hovedfaser: planlegging, risiko- og sårbarhetsvurdering og risikohåndtering.

Etterfølges av et **vertikalt prosessdiagram** med tre nummererte grupper (rendret som ren HTML/CSS, ingen ekstern bibliotek — fungerer i preview, PDF og Word-eksport via samme markup):

```
1) Planlegging
   ├─ Problemdefinisjon, informasjonsinnhenting og organisering
   └─ Valg av analysemetode

2) Risiko- og sårbarhetsvurdering
   ├─ Identifikasjon av mulige initierende hendelser (farer, trusler, muligheter)
   ├─ Årsaksanalysen   |   Konsekvensanalysen
   └─ Risikobilde

3) Risikohåndtering
   ├─ Sammenligning av alternativer, identifisering og vurdering av tiltak
   └─ Ledelsens vurdering og beslutning
```

Implementasjon: en flex/grid-basert komponent inline i seksjonen — lyseblå bokser (`#e8eef7`, border `#94a3b8`), piler mellom (Unicode `▼` eller liten SVG), gruppe-merking til høyre med vertikal klamme (border-right + label). Tilsvarende stil som matriserammen ellers i dokumentet. Avsluttes med kildehenvisning: *Figur: Risiko- og sårbarhetsanalyseprosessens ulike trinn (ref. Aven et al. 2008)*.

## Renummerering
- 2.1 Sannsynlighetsskala → **2.2**
- 2.2 Konsekvensskala → **2.3**
- 2.3 Risikomatrise (5×5) → **2.4**

Eksisterende intro-avsnitt under "2. Metode" beholdes som den er; ny 2.1 legges inn rett etter intro-avsnittet.

## Word-eksport
Sjekk `src/lib/ros-word-export.ts` for kap. 2-struktur. Hvis den speiler underseksjonene, legges samme 2.1 inn (tekst + enkel punktliste eller tabell som representerer prosesstrinnene — ingen SVG-figur i Word, kun strukturert liste/tabell), og 2.1→2.2 osv. renummereres. Hvis Word-eksporten kun har én samlet "Metode"-bolk, legges teksten inn der.

## Filer som endres
- `src/components/ros/RosPreview.tsx` — kap. 2-blokken (linjer ~290–370): legg til 2.1 Analyseprosess + renummerer underseksjoner.
- `src/lib/ros-word-export.ts` — speil endringen for nedlastet Word-dokument.

## Ingen endringer
- Datamodell, AI, RLS, kap. 1, 3, 4, 5/6.
