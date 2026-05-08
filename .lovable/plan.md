
# Bedriftsmaler for dokumenter

## Mål
Gjøre det mulig for bedrifter (grupper) å gi sine egne dokumenter et eget visuelt uttrykk — uten å endre fagligt innhold. Vi starter med 3 standardmaler som vises som eksempler. Tilpassede maler kan lages på bestilling senere.

## Hvordan det fungerer for brukeren

1. **Gruppe-admin** går til "Mine kontakter → Gruppe → Innstillinger" og velger en mal for bedriften:
   - **Klassisk** (blå/grå, Calibri, enkel forside)
   - **Moderne** (mørk aksent, Arial, fullsides farget forside med logo)
   - **Minimalistisk** (sort/hvit, Georgia, ren typografisk forside)
2. Admin kan i tillegg justere:
   - **Logo** (bruker eksisterende `contact_groups.logo_url`)
   - **Primærfarge** og **aksentfarge** (hex)
   - **Skrifttype** (dropdown: Arial, Calibri, Georgia, Times New Roman)
3. **Når et dokument eksporteres til Word**:
   - Hvis prosjektet er delt med en gruppe → bruk gruppens mal
   - Ellers → bruk brukerens egen profil (uendret oppførsel, fallback)
4. En **forhåndsvisning** vises ved siden av valget slik at admin ser hvordan en eksempelside ser ut.

## Omfang i denne iterasjonen

Berørte eksport-filer:
- `src/lib/ks-word-export.ts` (Brannkonsept)
- `src/lib/kvalitativ-word-export.ts` (Fraviksdokumentasjon)
- Tilstandsvurdering-eksport (lokalisert i tilsvarende fil i Tilstandsvurdering-flyten)

Ikke i denne omgang: brensellagring, tilbud, oppdragsbekreftelse (lett å legge til etterpå med samme mekanisme).

## Teknisk design

### Database
Ny kolonne på `contact_groups`:
```
template_settings jsonb default '{}'::jsonb
```
Struktur:
```json
{
  "template": "klassisk" | "moderne" | "minimalistisk",
  "primary_color": "#1a4d8c",
  "accent_color": "#3b82f6",
  "font_family": "Arial"
}
```
Logo finnes allerede i `logo_url`. Ingen endringer i RLS — eksisterende policies dekker.

### Ny modul: `src/lib/document-templates.ts`
Definerer:
```ts
export type TemplateId = "klassisk" | "moderne" | "minimalistisk";
export interface DocumentTemplate {
  id: TemplateId;
  name: string;
  // Fargepalett (med defaults som overstyres av group settings)
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  // Layout-funksjoner som bygger docx-elementer:
  buildCoverPage(opts: { title, subtitle, projectName, logoBuffer?, date }): Paragraph[];
  buildHeader(opts): Header;
  buildFooter(opts): Footer;
  buildSectionHeading(text, level): Paragraph;
  buildTableHeaderShading(): { fill, type };
}
```
Tre konkrete implementasjoner i samme fil.

### Hjelper: `resolveDocumentTheme(projectId)`
Henter:
1. Brukerens profil (eksisterende kall)
2. Sjekker `project_shares` → `contact_groups.template_settings + logo_url` for prosjektets gruppe
3. Returnerer en sammensatt `ResolvedTheme` (template + farger + font + logo URL)

### Refaktor av eksport-filer
Hver `*-word-export.ts` tar i mot et `theme: ResolvedTheme`-argument og bruker `template.buildCoverPage(...)`, `template.buildHeader(...)` osv. i stedet for hardkodet stil. Innholdslogikken (paragrafer, tabeller, fagdata) er uendret.

### UI
Ny komponent `src/components/gruppe/MalvalgPanel.tsx` som rendres på `GruppeDetalj`-siden (kun synlig for admin):
- 3 mal-kort med miniatyrbilde
- Color pickers (primær + aksent)
- Font dropdown
- "Lagre"-knapp + "Forhåndsvis i Word" som genererer en demo-DOCX
- Info-boks: "Trenger din bedrift en helt skreddersydd mal? Ta kontakt for tilbud."

## Tekniske begrensninger
- Logo må være PNG/JPG (ikke SVG) for `ImageRun` i docx.
- Forhåndsvisningen er en miniatyr (statisk PNG i `src/assets/templates/`), ikke en live render.
- Tilpassede maler "på bestilling" implementeres senere som ekstra `TemplateId`-er.

## Leveransesteg
1. SQL-migrering: legg til `template_settings` på `contact_groups`.
2. Lag `src/lib/document-templates.ts` med 3 maler og hjelperen `resolveDocumentTheme`.
3. Generer 3 miniatyrer til `src/assets/templates/`.
4. Bygg `MalvalgPanel.tsx` og hekt den på `GruppeDetalj`.
5. Refaktorer `ks-word-export.ts`, `kvalitativ-word-export.ts` og tilstandsvurdering-eksport til å bruke `theme`.
6. Oppdater eksport-anropene (i Konsept/Tilstandsvurdering/Fravik-sider) til å hente theme via `resolveDocumentTheme(projectId)` før kall.
