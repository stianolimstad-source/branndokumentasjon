## Mål
Erstatt dagens inngang slik at brukerne velger rolle først, og sørg for at innloggede brukere og brukere med lagret valg går rett til riktig destinasjon.

## Ny rute-struktur

```text
/                  → RollePicker (eller smart redirect)
/branningenior     → dagens Index (engineer-landing, marketing/dashboard)
/kunde-landing     → ny KundeLanding (kunde-marketing)
/mine-prosjekter   → engineer-hjem (uendret)
/kunde             → KundeHjem (innlogget kunde, flyttes fra dagens "/" for customer-rolle)
/auth              → som i dag (utvides til å lese ?rolle=)
```

## Nye filer
- `src/pages/RollePicker.tsx` — rotsiden med to store rolle-kort.
- `src/pages/KundeLanding.tsx` — marketing-side for kunder med hero, fordeler, CTA til `/auth?rolle=customer`.

## Filer som endres
- `src/App.tsx` — ny routing: `/` → `RollePicker`, `/branningenior` → `Index`, `/kunde-landing` → `KundeLanding`, `/kunde` → `KundeHjem` (egen rute), behold `RoleSelectModal` som fallback.
- `src/pages/Index.tsx` — fjern intern `isCustomer`-gren (KundeHjem flyttes til egen rute). Beholdes som engineer-landing. Legg til en liten "Bytt til kunde-visning"-knapp nederst som tømmer localStorage og navigerer til `/`.
- `src/pages/KundeHjem.tsx` — uendret innhold, men nås nå via `/kunde`. Engineer-brukere som lander her redirectes til `/mine-prosjekter`.
- `src/pages/Auth.tsx` — les `?rolle=` fra URL. Etter vellykket signup: oppdater `profiles.role` til den valgte rollen. Etter login: redirect til `/mine-prosjekter` (engineer) eller `/kunde` (customer) basert på profil-rolle.
- `src/pages/MinProfil.tsx` — når rolle byttes, oppdater også `localStorage.branndok_selected_role`.
- `src/hooks/useAuth.tsx` — `needsRoleSelect` beholdes som fallback (RoleSelectModal vises kun hvis `role === null` etter login).

## RollePicker-logikk (`/`)

```text
useEffect på mount:
  1. hvis auth loading → vis spinner
  2. hvis user innlogget:
       - hent profiles.role
       - engineer → navigate("/mine-prosjekter", replace)
       - customer → navigate("/kunde", replace)
       - null     → vis RollePicker (modal-fallback dekker dette)
  3. hvis ikke innlogget:
       - les localStorage.branndok_selected_role
       - "engineer" → navigate("/branningenior", replace)
       - "customer" → navigate("/kunde-landing", replace)
       - ellers     → render RollePicker
```

Ved klikk på et kort: `localStorage.setItem("branndok_selected_role", valg)` og naviger til riktig landing.

## RollePicker UI
- Logo + navn øverst, sentrert.
- H1: "Velkommen til Branndokumentasjon.no", undertittel: "Velg hvordan du vil bruke siden".
- Grid med 2 store kort (samme visuelle språk som `RoleSelectModal`, men større padding, hover-skygge, ikon i sirkel):
  - Branningeniør (Briefcase): fordelsliste med Check-ikoner.
  - Kunde (User): fordelsliste med Check-ikoner.
- Footer-tekst: "Du kan endre dette senere i Min profil hvis du registrerer deg."

## KundeLanding UI (`/kunde-landing`)
- Hero: "For kunder av branningeniører" / "Få oversikt og bruk våre verktøy".
- Tre fordels-kort (delte prosjekter, egne ROS, gratis registrering).
- Primær CTA: `<Link to="/auth?rolle=customer&mode=signup">Registrer deg gratis</Link>`.
- Sekundær lenke: `<Link to="/auth">Logg inn</Link>`.
- Nederst i hjørnet liten ghost-knapp "Bytt til branningeniør-visning" → tømmer localStorage og navigerer til `/`.

## Engineer-landing (`/branningenior`)
Dagens `Index` uendret, men legg til samme lille "Bytt til kunde-visning"-knapp nederst.

## Signup med pre-selektert rolle
I `Auth.tsx`:
- Parse `searchParams.get("rolle")` ved mount, hold i state `preselectedRole`.
- Etter `signUp` suksess: når `onAuthStateChange` gir oss user, kjør `supabase.from("profiles").update({ role: preselectedRole }).eq("id", user.id)` (eller bruk `data` i `signUp.options.data` og la trigger plukke det opp — vi velger client-side update for å unngå migrasjon).
- Lagre også i localStorage for konsistens.
- Default ved engineer-flyt: `engineer`.

## Fallback
- `RoleSelectModal` (montert globalt i `App.tsx`) vises fortsatt hvis `profiles.role === null` etter innlogging — dekker edge-cases.

## MinProfil rolle-bytte
- I `handleRoleSwitch`: etter vellykket DB-update, kall `localStorage.setItem("branndok_selected_role", newRole)` før signOut/navigate.

## Ingen DB-migrasjoner kreves
Vi bruker eksisterende `profiles.role`-kolonne og setter den client-side etter signup. `handle_new_user`-trigger forblir uendret.
