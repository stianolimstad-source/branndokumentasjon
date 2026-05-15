## Mål

Etablere et nytt verktøy "ROS-analyse" (brannrelatert) med samme arbeidsflyt som brannkonsept og tilstandsvurdering: forsideknapp → opprett/velg → todelt side med input til venstre og forhåndsvisning til høyre, lagret per prosjekt. Innholdet bygges ut i senere runder.

## Omfang i denne runden

Kun rammeverket settes opp. 5×5-matrisen synliggjøres som metodevalg, men hendelsesregisteret fylles med enkle felt (tittel, beskrivelse, sannsynlighet 1–5, konsekvens 1–5, tiltak) slik at strukturen kan utvides senere uten datatap.

## Funksjonalitet

1. **Forside (`src/pages/Index.tsx`)**: Ny knapp/kort "ROS-analyse" ved siden av Brannkonsept og Tilstandsvurdering, samme stil og ikon-språk (f.eks. `ShieldAlert`).
2. **Rute**: Ny `/ros-analyse` registrert i `src/App.tsx`, beskyttet med `RequireSubscription feature="ROS-analyse"` (følger eksisterende mønster; lås håndteres senere når abonnement defineres).
3. **Opprettelse/valg**: Samme flyt som konsept — velg prosjekt → opprett ny eller åpne eksisterende ROS-analyse. Liste presenteres som kortgrid.
4. **Side-layout**: Todelt (venstre input, høyre `RosPreview`) som speiler `Konsept`/`Tilstandsvurdering`. Header bruker global `AppHeader`, kontekstuell tilbake-knapp til prosjektet.
5. **Innhold (skall)**:
   - Kap. 1 Innledning: prosjektmetadata (auto-prefill fra prosjekt: navn, adresse, oppdragsgiver), bakgrunn, formål, omfang, avgrensninger.
   - Kap. 2 Metode: 5×5 sannsynlighet × konsekvens beskrevet, med farge-matrise (grønn/gul/rød) og forklarende skalaer.
   - Kap. 3 Hendelsesregister: tabell/liste med felt per hendelse: tittel, beskrivelse, årsak, sannsynlighet (1–5), konsekvens (1–5), risikoverdi (auto = S×K), foreslåtte tiltak, restrisiko.
   - Kap. 4 Oppsummering: auto-generert basert på registrerte hendelser.
   - Kap. 5 Revisjonshistorikk: samme tabellformat som brannkonsept (uten "prosjekterende" — kun "utførende" jf. tidligere preferanse for tilstandsvurdering, vurderes likt her).
6. **Forhåndsvisning**: HTML-render som matcher senere Word-eksport (eksport ikke i denne runden). Sticky toppmeny med ankerlenker som i konsept.
7. **Lagring**: Ny tabell `ros_analyses` med samme struktur som `fire_concepts` (`id`, `project_id`, `user_id`, `name`, `content jsonb`, `status`, timestamps). RLS speiler `fire_concepts` (eier + delte via `project_shares`/grupper).

## Teknisk

```text
src/
  pages/
    RosAnalyse.tsx              # ny side, todelt layout
  components/
    ros/
      RosPreview.tsx            # høyre forhåndsvisning
      RosMatriks.tsx            # 5x5 farget matrise
      RosHendelseForm.tsx       # input per hendelse
  App.tsx                       # legg til <Route path="/ros-analyse" ...>
  pages/Index.tsx               # ny kortknapp ROS-analyse
```

DB:
```sql
create table public.ros_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid not null,
  name text not null,
  content jsonb not null default '{}',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ros_analyses enable row level security;
-- policies: eier full CRUD; gruppemedlemmer SELECT via project_shares (samme mønster som fire_concepts)
```

`content`-skjema (jsonb), første versjon:
```ts
{
  metadata: { prosjektnavn, adresse, oppdragsgiver, utfortAv, dato, versjon },
  innledning: { bakgrunn, formal, omfang, avgrensninger },
  metode: { matriseStorrelse: "5x5", sannsynlighetsskala: [...], konsekvensskala: [...] },
  hendelser: [{ id, tittel, beskrivelse, arsak, sannsynlighet, konsekvens, tiltak, restrisiko }],
  oppsummering: string,
  revisjonshistorikk: [{ versjon, dato, utfortAv, endring }]
}
```

## Utenfor scope nå

- Word/PDF-eksport (legges til senere, i tråd med `useCanDownload`).
- AI-utfylling, predefinerte hendelseskataloger, kobling til konsept/tilstandsvurdering.
- Egen Stripe-feature og låsing — `RequireSubscription` legges på, men feature-navnet kan justeres når monetisering bestemmes.
- Dypere integrasjon mot fraviksdokumentasjon.

## Leveranse etter godkjenning

Skall som er trygt å bygge videre på: ny knapp på forsiden, ny rute, todelt side, 5×5-matrise på plass, lagring per prosjekt med RLS, forhåndsvisning som speiler input. Klar for iterativ påfylling av innhold/automatikk i neste runder.
