## Mål
ROS-analyser skal kun nås via prosjektsiden. Den frittstående landing-siden ("Mine ROS-analyser") fjernes, og tilbakeknappen i ROS-editoren skal gå til prosjektet analysen tilhører.

## Endringer

### `src/pages/RosAnalyse.tsx`
1. Fjern hele LANDING-blokken (linjene som rendrer "Mine ROS-analyser"-grid, "Ny ROS-analyse"-knapp og kort-lista).
2. Hvis siden åpnes uten `?id=` og uten `?new=true&project=...`: redirect via `useEffect` → `navigate("/mine-prosjekter", { replace: true })`. Dropper også fetch av `analyses`-lista (brukes ikke lenger; behold kun `projects` om nødvendig for create-flow, eller hent kun det aktuelle prosjektet ved behov).
3. Lagre `projectId` fra ROS-raden i state når en analyse lastes (og fra `?project=` ved opprettelse).
4. Oppdater tilbake-knappen i editoren:
   - Tekst: "Tilbake til prosjekt"
   - `onClick`: `navigate(`/prosjekt/${projectId}`)` (fallback `/mine-prosjekter` hvis projectId mangler).
5. Oppdater `handleDelete` til å navigere til `/prosjekt/${projectId}` etter sletting (i stedet for `/ros-analyse`).
6. Behold create-dialog-flyten for `?new=true&project=...` slik at "Ny"-knappen på prosjektsiden fortsatt fungerer; etter opprettelse brukes `setParams({ id })` som i dag.

### `src/pages/Index.tsx`
- Endre "ROS-analyse"-kortets `href` fra `/ros-analyse` til `/mine-prosjekter` (slik at brukeren går via prosjekt for å opprette/åpne ROS), eller fjern kortet hvis ønskelig. Standard: bytt href.

### `src/App.tsx`
- Behold `/ros-analyse`-ruten (den brukes fortsatt med query-params `?id=` og `?project=&new=true`). Ingen ruteendring nødvendig.

## Utenfor scope
- Ingen DB-endringer.
- Ingen endringer i ROS-seksjonen på prosjektsiden (`ProsjektDetalj.tsx`) — den fungerer allerede.
- Ingen endring i Word-eksport, AI-import eller forhåndsvisning.
