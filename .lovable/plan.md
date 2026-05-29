## Mål
Innføre en dedikert hovedside for kunder (`role = 'customer'`) med to seksjoner og en ny ROS-flyt, samt «Flytt ROS»-funksjon for kundens egne analyser. Engineer-opplevelsen forblir helt uendret.

## Del A – Routing og rolle-basert hovedside

`/` er i dag `Index` (markedsføringssiden), og `/mine-prosjekter` er engineer-dashboardet. For å holde engineer-flyten 100% urørt:

- I `src/pages/Index.tsx`: helt på toppen av komponenten, etter eksisterende hooks, legg til:
  ```ts
  const { isCustomer, loading: roleLoading } = useUserRole();
  if (user && roleLoading) return <Skeleton-fallback />;
  if (user && isCustomer) return <KundeHjem />;
  ```
  Ingen andre endringer i `Index.tsx`. Engineer/anonyme brukere får dagens visning.
- `src/pages/MineProsjekter.tsx`: tilsvarende kort guard på toppen – hvis `isCustomer`, redirect (`<Navigate to="/" replace />`) slik at kunder ikke ender på engineer-prosjektlista.

## Del B – Rollebasert AppHeader-meny

I `src/components/AppHeader.tsx`:
- Hent `const { isCustomer } = useUserRole()`.
- Render to forskjellige `DropdownMenuContent`-grupper:
  - Engineer/ukjent: dagens menyvalg uendret.
  - Customer: kun «Mine prosjekter» (→ `/`), «Min profil», «Logg ut». Varselbjelle og ThemeToggle uendret.

Ingen ruter fjernes – kun menyvisningen filtreres. Eksisterende `RequireSubscription`/`RequireFullAccess`-wrappers blokkerer fortsatt direkte URL-tilgang for engineer-funksjoner; vi vurderer ikke kunde-spesifikk URL-blokkering nå (utenfor scope).

## Del C – `src/pages/KundeHjem.tsx` (ny)

Layout:
- Toppseksjon: stor primær-knapp «Ny ROS-analyse» (åpner `NyRosAnalyseDialog`).
- Seksjon «Mine prosjekter»: kort-grid (samme stil som `MineProsjekter`), fra `useTilgjengeligeProsjekter()` filtrert på `kategori === 'personlig'`. Hvert kort viser navn, opprettet-dato, `Badge` «Personlig». Klikk → `/prosjekt/:id`. Tom: kursiv «Du har ikke opprettet egne prosjekter ennå.»
- Seksjon «Delt med meg»: tilsvarende, filtrert på `kategori === 'delt'`. Kort viser navn, `Badge` «Delt av {engineer-navn}». Tom: «Ingen prosjekter er delt med deg ennå. Når en branningeniør deler et prosjekt med din e-postadresse vil det dukke opp her.»

All styling via eksisterende semantiske tokens (`bg-card`, `text-muted-foreground`, `bg-gradient-subtle`, osv.).

## Del D – `NyRosAnalyseDialog`

Egen komponent `src/components/kunde/NyRosAnalyseDialog.tsx`:
- Input «Navn på ROS-analysen» (påkrevd).
- `Select` over prosjekter fra `useTilgjengeligeProsjekter(true)`. Visuelt grupperes egne og delte ved hjelp av `SelectGroup` + `SelectLabel` (shadcn støtter dette).
- Hvis lista er tom: bytt UI til «Vi oppretter et prosjekt for deg», med Input default «Min ROS-analyse» (kunden kan endre).
- «Opprett»-knapp:
  1. Hvis nytt prosjekt: `insert projects { user_id, created_by_role: 'customer', name }`. Henter `id`.
  2. `insert ros_analyses { project_id, user_id, created_by, name, content: tomt RosContent-objekt }`.
  3. `navigate(`/ros-analyse?id=${rosId}`)`. (Eksisterende `RosAnalyse` leser `id` fra searchParams – ref. linje 935.)
- Feilhåndtering med `toast`.

## Del E – Flytt ROS

I `src/pages/RosAnalyse.tsx`, ved knapperaden på linje ~3162 (ved siden av «Lagre»):
- Hent `created_by` fra ROS-raden ved fetch og lagre i state.
- Vis ny knapp `Flytt` kun når `user.id === createdBy`.
- Klikk åpner ny komponent `FlyttRosDialog` (`src/components/ros/FlyttRosDialog.tsx`):
  - Vis nåværende prosjektnavn øverst.
  - `Select` fra `useTilgjengeligeProsjekter(true)` (samme hook, grupperer), filtrert bort nåværende `project_id`.
  - Når valgt mål er et delt prosjekt: advarsel «Når du flytter ROS-en til dette prosjektet vil branningeniør {navn} også få tilgang til den.»
  - «Flytt»-knapp kjører `update ros_analyses set project_id = ... where id = ...`, refetcher analysen og lukker dialog. Toast på suksess/feil.

## Del F – `src/hooks/useTilgjengeligeProsjekter.tsx` (ny)

```ts
type Prosjekttilgang = {
  id: string;
  name: string;
  kategori: 'personlig' | 'delt';
  engineerNavn?: string;   // sett kun for 'delt'
  created_at: string;
};
function useTilgjengeligeProsjekter(forRosEdit = false): { prosjekter, loading, refetch }
```

Implementasjon:
1. Hent `projects` der `user_id = auth.uid()` → kategori `personlig`.
2. Hent `project_shares` der gruppen tilhører meg (via `group_members.user_id = auth.uid()`) eller `contact.linked_user_id = auth.uid()`. Join til `projects` og `profiles` for å hente eier-navnet (`profiles.full_name`).
3. Slå sammen, dedupliser på `id` (prefer `personlig`). Sorter på `created_at desc`.
4. `forRosEdit`-parameteren reserveres for fremtidig filtrering (alle disse prosjektene har RLS-tilgang for kunden's ROS-CRUD allerede, så ingen ekstra filtrering i v1).

## Tekniske detaljer
- Bruker eksisterende `useAuth`, `useUserRole`, `supabase`-klient. Ingen schema-endringer.
- `Skeleton` brukes som loading-fallback i Index og KundeHjem.
- All tekst på norsk. Ingen hardkodede farger.
- Engineer-relevante komponenter (`Index`, `MineProsjekter`, eksisterende menyvalg) endres minimalt: kun guards på toppen.
- Ingen nye ruter – `KundeHjem` rendres inline fra `/`.

## Filer
- Ny: `src/pages/KundeHjem.tsx`
- Ny: `src/hooks/useTilgjengeligeProsjekter.tsx`
- Ny: `src/components/kunde/NyRosAnalyseDialog.tsx`
- Ny: `src/components/ros/FlyttRosDialog.tsx`
- Endres: `src/pages/Index.tsx` (guard øverst)
- Endres: `src/pages/MineProsjekter.tsx` (redirect-guard for kunder)
- Endres: `src/components/AppHeader.tsx` (rollebasert meny)
- Endres: `src/pages/RosAnalyse.tsx` (Flytt-knapp + state for `created_by`)
