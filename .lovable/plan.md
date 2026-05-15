## Mål
Få ROS-analyser til å dukke opp inne på prosjektsiden (`/prosjekt/:id`) ved siden av brannkonsepter, tilstandsvurderinger, fraviksdokumenter og brensellagring — i stedet for kun på den frittstående `/ros-analyse`-siden.

## Status på den eksisterende analysen
Den ROS-analysen som ligger på kontoen `stian.olimstad@…olimstadbrannrdgivning.no` er **allerede** koblet til Bøylefoss-prosjektet (project_id matcher Bøylefoss). Den vil derfor automatisk dukke opp i den nye "ROS-analyser"-seksjonen så snart UI-en er på plass — ingen flytting i databasen er nødvendig.

## Endringer

### `src/pages/ProsjektDetalj.tsx`
1. Nytt interface `RosAnalysis { id, name, status, created_at }`.
2. Ny state `rosAnalyses` + hent fra `ros_analyses` i `fetchProject` (parallelt med eksisterende `Promise.all`):
   `supabase.from('ros_analyses').select('id, name, status, created_at').eq('project_id', id!).order('created_at', { ascending: false })`.
3. Nytt `handleDeleteRos(id, name)` som speiler `handleDeleteConcept` men mot `ros_analyses`.
4. Nytt kort "ROS-analyser ({antall})" plassert etter "Brensellagring":
   - Ikon: `BarChart3` (lucide), farge `text-purple-600` (eller `text-blue-600` for å passe paletten).
   - "Nytt"-knapp lenker til `/ros-analyse?project={project.id}&new=true`.
   - Hver rad bruker samme stil som `ConceptRow`, men en lettere variant uten KS-badge (ROS har ikke sidemannskontroll-flyt enda). Lenke "Åpne" → `/ros-analyse?id={ros.id}`.
   - Slett-knapp med `AlertDialog`-bekreftelse (samme pattern som konsepter).
5. Importer `BarChart3` fra `lucide-react` (allerede importert på siden).

Ingen endringer på `RosAnalyse.tsx` — den støtter allerede `?project=…&new=true` og `?id=…`.

### Ingen databaseendringer
- Ingen migrering, ingen RLS-endring, ingen flytting av rader.
- ROS-tabellen har allerede `project_id` og riktige RLS-policyer.

## Utenfor scope
- Ingen endring i `/ros-analyse`-landingssiden (den fortsetter å fungere som global oversikt).
- Ingen endring i navigasjon/header.
- Ingen KS-/sidemannskontroll-integrasjon for ROS.
