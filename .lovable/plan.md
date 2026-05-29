## Mål
Utvide RLS slik at brukere med rolle `customer` kan opprette egne prosjekter og full CRUD på egne ROS-analyser (inkludert flytting mellom tilgjengelige prosjekter), mens read-only-tilgang på delte brannkonsept, fravik og tilstandsvurderinger via gruppe forblir uendret. Eksisterende engineer-policies røres ikke.

## Migrasjon (én fil)

**Helper-funksjon**
- `public.is_customer(user_id uuid) returns boolean` – `SECURITY DEFINER`, `set search_path = public`, sjekker `profiles.role = 'customer'`. Brukes ikke i policies under (for å holde SQL eksplisitt), men gjøres tilgjengelig for senere bruk.

**Policies på `public.projects`** (additive, OR-r med eksisterende)
- `Customers can create own projects` – INSERT WITH CHECK: `auth.uid() = user_id AND created_by_role = 'customer' AND EXISTS (profiles WHERE id = auth.uid() AND role = 'customer')`
- `Customers can update own projects` – UPDATE USING: `auth.uid() = user_id AND created_by_role = 'customer'`
- `Customers can delete own projects` – DELETE USING: `auth.uid() = user_id AND created_by_role = 'customer'`

**Policies på `public.ros_analyses`**
«Tilgjengelig prosjekt» = eier (`p.user_id = auth.uid()`) ELLER delt via gruppe (`get_user_group_ids`) ELLER delt via direkte kontakt (`project_shares.contact_id → contacts.linked_user_id = auth.uid()`).

- `Customers can view ROS in own or shared projects` – SELECT USING: prosjekt er tilgjengelig
- `Customers can create ROS in accessible projects` – INSERT WITH CHECK: `auth.uid() = created_by` AND prosjekt tilgjengelig
- `Customers can update own ROS analyses` – UPDATE USING `auth.uid() = created_by`, WITH CHECK `auth.uid() = created_by AND` mål-prosjekt tilgjengelig (støtter flytting)
- `Customers can delete own ROS analyses` – DELETE USING: `auth.uid() = created_by`

**Ikke berørt**: `fire_concepts`, fravik- og tilstandsvurderingstabeller får ingen nye INSERT/UPDATE/DELETE-policies. Eksisterende SELECT via `project_shares` + gruppe gir kunden read-only.

## Tekniske detaljer
- Migrasjonen inneholder kun `CREATE FUNCTION` og `CREATE POLICY` – ingen schema-endringer, ingen GRANTs nødvendig (tabellene har dem).
- `project_shares.contact_id`-stien er tatt med i ROS-policiene for å dekke direkte deling til en kunde-kontakt, selv om eksisterende `fire_concepts`-policy kun bruker gruppe-stien. Dette gir konsistent kundeopplevelse på ROS.
- Engineer-flyten påvirkes ikke: alle eksisterende policies består, og PostgreSQL OR-r dem med de nye.
- Ingen kodeendringer i frontend i denne fasen – sikrer kun datalaget.

## Verifikasjon etter migrasjon
1. `supabase--linter` for å fange evt. warnings.
2. Bekreft at policies vises på `projects` og `ros_analyses` (allerede synlig i schema-context etter migrasjon).
3. Manuelle tester per oppgavens 7 punkter.

## Filer
- Ny migrasjonsfil under `supabase/migrations/` (auto-navngitt).
