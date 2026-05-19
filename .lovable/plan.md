## Plan: Illustrasjon for detaljeringsnivå i ROS-analyse

Lage et nytt, profesjonelt illustrasjonsbilde som viser konseptet med de tre detaljeringsnivåene i en ROS-analyse, inspirert av det opplastede referansebildet, men med et renere og mer moderne uttrykk som passer applikasjonens visuelle stil.

### Innhold i illustrasjonen

Bildet skal inneholde to lag som i originalen:

1. **Øvre del — systemoversikt med nivå-soner**
   - Et stilisert energisystem-landskap (vannkraft, gasskraft, bioenergi, transformatorstasjoner, kraftlinjer, boliger, industri, tankskip)
   - Tre konsentriske/overlappende soner som markerer omfanget for hvert nivå:
     - Stor blå sone = Nivå 1 (hele systemet)
     - Mindre lilla sone = Nivå 2 (et anlegg/aktivitet)
     - Liten oransje sirkel = Nivå 3 (én komponent, f.eks. en tank)

2. **Nedre del — tre prosess-spalter**
   - Tre kolonner med overskrifter:
     - **Nivå 1:** Overordnet ROS-analyse (blå)
     - **Nivå 2:** ROS-analyse for anlegg og aktiviteter (lilla)
     - **Nivå 3:** Detaljert ROS-analyse av delsystem/komponenter (oransje)
   - Hver kolonne med tre bokser i rekkefølge: **Planlegging → ROS-vurdering → Risikohåndtering**
   - Piler mellom kolonnene som viser progresjon fra grovt til detaljert nivå

### Visuell stil

- Flat, moderne vektor-look (ikke tegneserieaktig som originalen)
- Rene linjer, mild fargepalett som matcher appens profesjonelle uttrykk
- Tydelige fargekoder for nivåene: blå/lilla/oransje (samme som kortene i 2.2-seksjonen)
- Norsk tekst på alle etiketter
- 16:9 format, høy oppløsning, lesbar når den vises i full bredde i metodeseksjonen

### Implementering

1. Generere bildet med `imagegen` (premium-kvalitet pga. norsk tekst som må være leselig)
2. Lagre som `src/assets/ros-detaljeringsnivaa.jpg`
3. Importere bildet i `src/pages/RosAnalyse.tsx` og vise det i input-seksjonen for "Detaljeringsnivå" (under select-feltet) som visuell forklaring
4. Importere samme bilde i `src/components/ros/RosPreview.tsx` og vise det i kap. 2.2 over de tre valgkortene
5. Legge bildet inn i Word-eksport (`src/lib/ros-word-export.ts`) i 2.2-blokken via `ImageRun`

### Filer som endres

- Ny: `src/assets/ros-detaljeringsnivaa.jpg`
- `src/pages/RosAnalyse.tsx` (vise bildet i input)
- `src/components/ros/RosPreview.tsx` (vise bildet i preview-kap. 2.2)
- `src/lib/ros-word-export.ts` (inkludere bildet i Word-eksport)
