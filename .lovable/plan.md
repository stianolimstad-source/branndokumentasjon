## Mål
Fjerne den åpne SELECT-policyen på `profiles` som lar alle innloggede brukere lese alle profiler, og erstatte den med en sikker server-side funksjon som kun returnerer minimal info (id, navn, e-post) for én spesifikk e-post om gangen.

## Endringer

### 1. Database (migrasjon)
- **Fjern policy** `"Authenticated users can lookup profiles by email"` på `public.profiles`.
- **Behold** eksisterende sikre policies (`Users can view own profile`, `Users can view group member profiles`, `Users can insert/update own profile`).
- **Opprett SECURITY DEFINER-funksjon** `public.lookup_profile_by_email(_email text)` som:
  - Krever innlogget bruker (`auth.uid() IS NOT NULL`).
  - Returnerer kun `id`, `full_name`, `email` for nøyaktig én treff.
  - Returnerer ingenting (tom) hvis e-post ikke finnes — ingen lekkasje av andre felt som `phone`, `company`, `logo_url`, `title`, `education`.

### 2. Frontend-tilpasning
Oppdater stedene som slår opp profiler på e-post for å bruke den nye RPC-funksjonen i stedet for direkte tabell-spørring:
- `src/components/gruppe/AddMemberDialog.tsx` — bytt `.from("profiles").select(...).eq("email", ...)` til `supabase.rpc("lookup_profile_by_email", { _email: ... })`.
- Søk gjennom resten av kodebasen etter andre steder som gjør oppslag på `profiles` via e-post (f.eks. kontakt-/deling-flyt) og oppdater tilsvarende.

### 3. Verifisering
- Test "Legg til medlem"-dialogen: oppslag på eksisterende e-post skal fortsatt fungere.
- Test at oppslag på ukjent e-post gir riktig feilmelding ("Ingen bruker funnet").
- Bekreft at sikkerhetsfunnet `profiles_public_readable` markeres som løst.

## Resultat
Etter endringen kan ingen innlogget bruker lenger laste ned hele profil-tabellen. Gruppeinvitasjon via e-post fungerer som før, men avslører kun id + navn for den spesifikke e-posten som slås opp — ikke telefon, firma eller andre personopplysninger.
