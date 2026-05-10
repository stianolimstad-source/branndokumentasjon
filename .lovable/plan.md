## Mål

La bedriften lage, lagre og velge mellom flere egne, navngitte maler — i tillegg til de tre ferdige (Klassisk, Moderne, Minimalistisk). Hver egne mal bygger på en av baselayoutene, men med utvidede tilpasningsvalg utover bare farger og font.

## Datamodell

Ny tabell `group_templates` (én rad per egne mal):

- `group_id` — hvilken bedrift malen tilhører
- `name` — visningsnavn (f.eks. "Standard rapport", "Tilbud light")
- `base_template` — `klassisk` | `moderne` | `minimalistisk`
- `primary_color`, `accent_color`, `font_family`
- `settings` (jsonb) — utvidede valg (se under)
- `is_default` — markert som bedriftens standard
- `sort_order`

RLS:
- Medlemmer av gruppen kan **se** maler.
- Bare gruppe-admin kan opprette/endre/slette.

`contact_groups.template_settings` beholdes for bakoverkompatibilitet (peker på «aktiv» preset-mal hvis ingen egen er valgt). Når en egne mal er satt som standard, brukes den.

## Utvidede tilpasningsvalg (lagres i `settings` jsonb)

- **Topplinje på forside:** av / tynn (18px) / tykk (36px) / ekstra tykk (54px)
- **Forsidelayout:** logo øverst sentrert · logo venstrejustert · stor farget toppblokk
- **Logoplassering i header:** venstre · sentrert · høyre · skjult
- **Footer:** vis sidetall · vis bedriftsnavn · vis dato (på/av hver for seg)
- **Datoformat:** `dd.mm.åååå` · `d. måned åååå` · ISO
- **Avstand før tittel på forside:** liten / standard / stor

(Alle har fornuftige defaults arvet fra valgt baselayout — bedriften justerer kun det de bryr seg om.)

## Brukergrensesnitt — endringer i `MalvalgPanel`

Erstatter dagens enkle valg med en mal-liste øverst:

```text
[ Mine maler i bedriften ]
 ┌────────────────┬────────────────┬──────────────┐
 │ ✓ Standard     │  Tilbud light  │  + Ny mal    │
 │ (Klassisk)     │  (Moderne)     │              │
 └────────────────┴────────────────┴──────────────┘
   Sett som std.   Rediger  Slett
```

- Klikk på en mal → laster den inn i editoren under (samme felter som i dag + nye layout-valg).
- "Ny mal" → modal: navn + velg baselayout → åpner editor.
- "Sett som standard" → markerer den som bedriftens default.
- Live-forhåndsvisning og "Forhåndsvis i Word" fungerer som i dag, men på den åpne malen.
- De tre faste presetene vises fortsatt som "Start fra preset" når du oppretter ny mal — de er ikke selvstendige rader, bare utgangspunkt.

## Bruk i dokumenter

`resolveDocumentTheme` i `src/lib/document-templates.ts` utvides:

1. Hvis prosjektet er delt med en gruppe → bruk gruppens `is_default` egne mal hvis den finnes, ellers `template_settings`.
2. Ellers: brukerens `default_template_group_id` → samme logikk.
3. Fallback: dagens "Klassisk".

`ResolvedTheme` får nye felt for de utvidede valgene. `KonseptPreview`, `MalForhandsvisning`, `buildCoverPage`, `buildHeader`, `buildFooter` leser disse og rendrer deretter (topplinje-tykkelse, logoposisjon, footer-elementer, datoformat).

## Tekniske detaljer

**Migrasjon:**
```sql
create table public.group_templates (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references contact_groups(id) on delete cascade,
  name text not null,
  base_template text not null check (base_template in ('klassisk','moderne','minimalistisk')),
  primary_color text not null,
  accent_color text not null,
  font_family text not null,
  settings jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.group_templates enable row level security;

-- members can view
create policy "Members can view group templates" on public.group_templates
  for select using (group_id in (select get_user_group_ids(auth.uid())));
-- admins manage
create policy "Admins can insert group templates" on public.group_templates
  for insert with check (is_group_admin(group_id, auth.uid()));
create policy "Admins can update group templates" on public.group_templates
  for update using (is_group_admin(group_id, auth.uid()));
create policy "Admins can delete group templates" on public.group_templates
  for delete using (is_group_admin(group_id, auth.uid()));

-- ensure only one is_default per group via partial unique index
create unique index group_templates_one_default
  on public.group_templates(group_id) where is_default;

create trigger trg_group_templates_updated
  before update on public.group_templates
  for each row execute function update_updated_at_column();
```

**Filer som endres / opprettes:**
- `supabase/migrations/...` — ny tabell + RLS
- `src/lib/document-templates.ts` — utvid `TemplateSettings`/`ResolvedTheme` med `extras` (topbar_height, cover_layout, logo_position, footer_show_*, date_format), oppdater `resolveDocumentTheme` for å lese fra `group_templates`, oppdater `buildCoverPage`/`buildHeader`/`buildFooter`
- `src/components/gruppe/MalvalgPanel.tsx` — mal-liste, opprett/rediger/slett, marker standard
- `src/components/gruppe/MalForhandsvisning.tsx` + `src/components/konsept/KonseptPreview.tsx` — respektere nye `extras`
- Ny komponent `src/components/gruppe/NyMalDialog.tsx` — opprettelses-modal
- Bekreftelsesdialog ved sletting (matcher prosjektets sikkerhetsregel)

## Ikke berørt

- Bruker-individuelle valg (`profiles.default_template_group_id`) — fortsatt på gruppenivå, ikke per mal.
- Brukere uten admin-rolle ser malene men kan ikke endre.
- De tre ferdige presetene er fortsatt tilgjengelige som utgangspunkt og som fallback.
