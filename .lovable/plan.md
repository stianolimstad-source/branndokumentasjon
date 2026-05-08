## Diagnose

Logoen er lagret i databasen for gruppen `Olimstad Brannrådgivning AS` med URL:
```
.../company-logos/64b0032f-…/logo.png
```
Men selve filen i Storage heter `logo-1776873754963.png` (med tidsstempel). URL-en peker derfor på en fil som ikke finnes (HTTP 400). Profilens logo URL er korrekt og inneholder tidsstemplet navn + cache-buster.

Sannsynligvis ble gruppens `logo_url` satt fra en eldre versjon av profil-logoen (uten tidsstempel) som siden er erstattet. Resultat: brutt bilde i topp-banner, i logo-kortet, i forhåndsvisningen — alle bruker `groupLogoUrl`.

## Fiks

### 1. Reparer dataen (engangs-migrering)
Oppdater alle rader i `contact_groups` der `logo_url` peker på Supabase storage uten tidsstempel ved å sette den til eierens profil-logo (eller `NULL` hvis profilen ikke har en). Konkret: for `Olimstad Brannrådgivning AS` kopierer vi `profiles.logo_url` for `user_id = 64b0032f-…` inn i gruppens `logo_url`. Generelt SQL:

```sql
update contact_groups cg
set logo_url = p.logo_url
from profiles p
where cg.user_id = p.id
  and cg.logo_url is not null
  and cg.logo_url not like '%logo-%'   -- gamle URL-er uten tidsstempel
  and p.logo_url is not null;
```

### 2. Hardfør UI-en mot brutte logoer
Legg til `onError`-fallback i bilde-elementene som viser logoen:

- **GruppeDetalj** — to steder (topp-banner og "Gruppelogo"-kort): hvis `groupLogoUrl` feiler å laste, bruk `profileLogoUrl` automatisk (kun visuelt, ikke lagre).
- **MalForhandsvisning** — alle tre malene: img har `onError` som setter en `failed`-state og viser plassholderen i stedet for et brutt bilde-ikon.

### 3. Fikse opplastings-flyten for fremtiden
I `handleLogoUpload`: navngi filen med tidsstempel (`logo-${Date.now()}.${ext}`) slik at upserts ikke kolliderer med browser-cache, og bruk samme URL i `getPublicUrl` etterpå. Det samme grepet som profil-uploaden allerede bruker.

## Filer

- **Ny migrering:** `supabase/migrations/...sql` — fix-spørringen over.
- **Endret:** `src/pages/GruppeDetalj.tsx` — `onError` på de to logo-bildene + tidsstempel i opplastings-stien.
- **Endret:** `src/components/gruppe/MalForhandsvisning.tsx` — `useState<failed>`-flag og `onError` i `LogoOrPlaceholder`.

Ingen RLS- eller skjemaendringer.
