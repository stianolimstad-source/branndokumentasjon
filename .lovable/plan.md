## Bakgrunn

I dag finnes maler kun på **gruppenivå** (`contact_groups.template_settings`). Word-eksportene (`ks-word-export.ts`, `kvalitativ-word-export.ts`) tar imot en valgfri `theme`, men **ingen kallested sender den inn** — alle dokumenter bruker derfor default-malen, uavhengig av om brukeren tilhører en bedrift med egen mal.

En enkel "Bruk bedriftens mal"-knapp på Min profil løser ikke kjernen: brukeren kan tilhøre flere grupper, og de fleste vil at malen skal "bare virke" uten å måtte huske å trykke noe.

## Anbefalt løsning: automatisk + valgbar standard

To deler:

### 1. Automatisk valg av mal ved eksport (gjør jobben usynlig)
Når et dokument eksporteres:
- Hent brukerens profil + alle grupper brukeren er medlem i.
- Hvis brukeren har satt en `default_template_group_id` i profilen → bruk den gruppens `template_settings` + `logo_url`.
- Ellers, hvis brukeren er medlem av nøyaktig **én** gruppe med template_settings → bruk den automatisk.
- Ellers → fall tilbake til default (slik som i dag).

Dette gjør at de aller fleste brukere ("én bedrift, én mal") får riktig mal automatisk uten å klikke noe.

### 2. Standardmal-velger på Min profil (kun for de med flere grupper / som vil overstyre)
Et lite kort i `MinProfil.tsx`:
- Tittel: "Dokumentmal"
- Hjelpetekst: "Velg hvilken bedrifts visuelle mal som skal brukes på dine dokumenter."
- Dropdown med:
  - "Egen mal (standard)" → ingen group_id
  - Én oppføring per gruppe brukeren er medlem av som har `template_settings` definert
- Lagrer `default_template_group_id` på `profiles`.
- Vises kun hvis brukeren faktisk er medlem av minst én gruppe.

## Endringer

### Database
- Migrasjon: legg til kolonne `profiles.default_template_group_id uuid NULL`. Ingen FK (gruppen kan slettes; vi tolker null/ugyldig som "egen mal").

### `src/lib/document-templates.ts`
- Ny helper `resolveUserTheme(userId)` som:
  1. Henter `profiles` (logo, default_template_group_id, company).
  2. Hvis `default_template_group_id` er satt → hent den gruppen.
  3. Ellers henter alle gruppemedlemskap; hvis nøyaktig én har `template_settings` → bruk den.
  4. Returnerer `{ theme: ResolvedTheme, logoUrl }` klar til å sendes til word-exports.

### Eksport-kallesteder
- I komponenter som kaller `generateKonseptWord` / `exportKvalitativAnalyse` / lignende: kall `resolveUserTheme(user.id)` først og send inn `theme` + `logoUrl`. (Identifiseres med `rg "generateKonseptWord|exportKvalitativ"`.)

### `src/pages/MinProfil.tsx`
- Nytt kort "Dokumentmal" som beskrevet over.
- Lagrer `default_template_group_id`.
- Skjules helt om brukeren ikke er i noen gruppe.

### `src/components/gruppe/MalvalgPanel.tsx`
- Liten infoboks: "Medlemmer i denne bedriften kan velge denne malen som standard fra Min profil → Dokumentmal."

## Hva vi IKKE gjør
- Ingen "Bruk bedriftens mal"-knapp som overstyrer per dokument — for friksjonsrikt.
- Ingen valg per prosjekt (kan eventuelt komme senere som overstyring).

## Resultat
- Bruker i én bedrift: får automatisk bedriftens mal — null klikk.
- Bruker i flere bedrifter: velger standard én gang i profilen.
- Frilanser uten gruppe: ser ingenting nytt, bruker default som før.
