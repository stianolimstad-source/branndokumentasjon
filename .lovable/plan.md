## Mål
Etablere rolle-skille (`engineer` / `customer`) som fundament for kommende kundeportal. Eksisterende brukere blir automatisk `engineer`. Nye brukere må velge rolle ved første innlogging.

## Del A – Database-migrasjon
Én migrasjon med:
- `profiles.role TEXT CHECK (role IN ('engineer','customer'))` – nullable
- `UPDATE profiles SET role = 'engineer' WHERE role IS NULL`
- `projects.created_by_role TEXT NOT NULL DEFAULT 'engineer' CHECK (...)`
- `ros_analyses.created_by UUID REFERENCES auth.users(id)`
- Backfill `ros_analyses.created_by` fra `projects.user_id` via join på `project_id`

Ingen RLS-endringer i denne fasen (kun fundament). `types.ts` regenereres automatisk.

## Del B – RoleSelectModal
Ny fil: `src/components/auth/RoleSelectModal.tsx`
- Dialog uten lukking: ingen X, `onOpenChange` ignoreres, `onPointerDownOutside`/`onEscapeKeyDown` preventDefault
- Tittel: «Velkommen til Branndokumentasjon.no»
- Beskrivelse som spesifisert
- To store kort-knapper side om side (grid md:grid-cols-2):
  - «Jeg er branningeniør» – `Briefcase`-ikon, undertekst
  - «Jeg er kunde» – `User`-ikon, undertekst
- Footer-tekst: «Du kan endre dette senere i kontoinnstillinger.»
- Ved valg: `update profiles set role = ...`, lukk modal, `window.location.reload()`

Bruker eksisterende semantiske tokens (ingen hardkodede farger).

## Del C – Vise modal ved første innlogging
Utvide `src/hooks/useAuth.tsx`:
- Etter at `session` er satt, hent `profiles.role` for innlogget bruker
- Eksponer `needsRoleSelect: boolean` (true når innlogget og `role === null`)

Render `<RoleSelectModal />` i `src/App.tsx` (innenfor `AuthProvider`) basert på `needsRoleSelect`.

## Del D – useUserRole hook
Ny fil: `src/hooks/useUserRole.tsx` – som spesifisert i oppgaven (returnerer `{ role, loading, isEngineer, isCustomer }`).

## Del E – Rolle-bytting i MinProfil
Utvide `src/pages/MinProfil.tsx` med ny seksjon «Brukerrolle»:
- Badge med nåværende rolle (norsk label: «Branningeniør» / «Kunde»)
- Beskrivelsestekst
- Knapp «Bytt rolle» → `AlertDialog` med bekreftelse som inneholder nåværende og motsatt rolle
- Ved bekreft: oppdater `profiles.role`, `supabase.auth.signOut()`, redirect til `/auth`

## Del F – Default-verdier ved opprettelse
Sikre testkriterium 4 og 5:
- `projects.created_by_role` har DB-default `'engineer'` – ingen kodeendring nødvendig for engineer-flyten, men vi setter eksplisitt verdi der prosjekter opprettes (`MineProsjekter.tsx`) for å være forberedt på customer-flyten
- Der ROS-analyser opprettes (søk: `from('ros_analyses').insert`), legg til `created_by: user.id`

## Tekniske detaljer
- Ingen endringer i RLS i denne fasen
- Ingen endringer i navigasjon/sidebar basert på rolle ennå (kommer i senere fase)
- Modal må rendres på alle ruter, derfor i `App.tsx` rett etter `AppHeader`
- `useAuth` må kunne re-hente rolle etter at modal har lagret valget (reload løser dette i MVP)

## Filer som endres/opprettes
- ny migrasjon (Del A)
- `src/components/auth/RoleSelectModal.tsx` (ny)
- `src/hooks/useUserRole.tsx` (ny)
- `src/hooks/useAuth.tsx` (utvide med rolle-sjekk + `needsRoleSelect`)
- `src/App.tsx` (rendre modal)
- `src/pages/MinProfil.tsx` (rolle-seksjon + bytt-dialog)
- `src/pages/MineProsjekter.tsx` (sett `created_by_role`)
- der ROS opprettes (sannsynligvis `RosAnalyse.tsx` / `UploadRosDialog.tsx`) – legg til `created_by`
