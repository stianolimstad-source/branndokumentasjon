# Inline fravik i brannkonsept kapittel 3

## Mål
Brukeren skal kunne se og opprette fravik direkte fra hver §11-X-seksjon i brannkonseptet, uten å miste konteksten.

## Datamodell (gjenbruker eksisterende felt)
`FravikEntry.funksjonskrav` er allerede en multiline-streng der hver linje er en TEK17-paragrafetikett (f.eks. `"§ 11-7. Brannseksjoner"`). Vi innfører **ingen** nytt felt — i stedet legger vi en liten hjelper:

```ts
// src/lib/fravik-paragraf.ts
export const extractParagrafIds = (funksjonskrav: string): string[] =>
  Array.from((funksjonskrav || "").matchAll(/§\s*(11-\d+)/g)).map(m => m[1]);

export const paragrafLabelFor = (id: string) => /* slå opp i tek17Paragrafer */;
```

Dette gjør at et fravik med `funksjonskrav` som inneholder `"§ 11-7..."` automatisk er knyttet til §11-7. Ved opprettelse fra brannkonseptet pre-fyller vi `funksjonskrav` med riktig etikett.

## Henting av fravik per prosjekt
I `Konsept.tsx` legges en `useFravikForProsjekt(projectId)`-hook (egen fil, `src/hooks/useFravikForProsjekt.ts`):

- Henter alle rader fra `fire_concepts` der `project_id = projectId` **og** `content->>'contentType'` er `'kvalitativ' | 'komparativ' | 'risikoanalyse'` (matcher dagens lagring).
- Returnerer en flat liste `{ conceptId, conceptName, fravikId, navn, fravikBeskrivelse, konklusjon, paragrafIds[], status }`.
- `status` avledes av `konklusjon`-feltet: tomt → `foreslått`, `tilstrekkelig|komparativ|risikoanalyse|egendefinert` → `akseptert`. (Ingen «avvist»-tilstand finnes i datamodellen i dag — se åpent spørsmål.)
- Cacher i state, eksponerer `refresh()`.

## Ny komponent: `FravikForParagraf`
`src/components/konsept/FravikForParagraf.tsx`:

- Props: `paragrafId` (f.eks. `"11-7"`), `projectId`, `konseptId`, `fravikList`, `refresh`.
- Renderer:
  - Tittel «Fravik fra preakseptert ytelse» (AlertTriangle-ikon, `text-destructive`).
  - Hjelpetekst om SAK 10 § 9-1.
  - Liste: for hvert fravik som matcher `paragrafId` → kompakt rad med ID-badge, navn/første linje av `fravikBeskrivelse`, status-badge, «Åpne»-knapp som lenker til `/lnsdokumentasjon/{contentType}?project={projectId}&concept={conceptId}#fravik-{fravikId}`.
  - Tom-tilstand: kursiv «Ingen fravik registrert for § 11-X».
  - «+ Opprett fravik fra § 11-X»-knapp og en refresh-knapp.

«Opprett»-handling:
- Hvis prosjektet allerede har et fraviksdokument: naviger til det med `?tekParagraf=11-X&fromKonsept={konseptId}&newFravik=1`.
- Hvis ikke: naviger til `/lnsdokumentasjon/kvalitativ?project={projectId}&new=true&tekParagraf=11-X&fromKonsept={konseptId}`.

## Endringer i `KvalitativAnalyse.tsx`
- Les `tekParagraf` og `newFravik` fra `useSearchParams` ved mount.
- Hvis satt: opprett (eller append) et `emptyFravik()` med `funksjonskrav` forhåndsutfylt til riktig label fra `tek17Paragrafer`, scroll til det, og rens query-parameterne.
- `fromKonsept` lagres i state og brukes til en «Tilbake til brannkonsept»-knapp øverst.

## Plassering i `Konsept.tsx`
Inni hver av de 14 `SectionCollapsible`-blokkene (`preview-3-1` … `preview-3-14`), helt nederst i innholdet, monteres:
```tsx
<FravikForParagraf paragrafId="11-4" projectId={projectId} konseptId={konseptId}
  fravikList={fravikList} refresh={refreshFravik} />
```
Paragraf-ID per seksjon: 3-1→11-4, 3-2→11-5, 3-3→11-6, 3-4→11-7, 3-5→11-8, 3-6→11-9, 3-7→11-10, 3-8→11-11, 3-9→11-12, 3-10→11-13, 3-11→11-14, 3-12→11-15, 3-13→11-16, 3-14→11-17.

## Word-eksport
I rapport-genereringen for hvert §-avsnitt i kapittel 3: hvis `fravikList.filter(f => f.paragrafIds.includes(paragrafId)).length > 0`, legg til en sub-seksjon «Fravik» med en kompakt linje per fravik (`F{n} – {navn} – {status}`). Ingen tekst hvis tom. Samme oppdatering i `KonseptPreview.tsx` for konsistent live-preview.

## Filer som endres
- ny: `src/lib/fravik-paragraf.ts`
- ny: `src/hooks/useFravikForProsjekt.ts`
- ny: `src/components/konsept/FravikForParagraf.tsx`
- `src/pages/Konsept.tsx` (14 innsettinger + hook + Word-eksport)
- `src/components/konsept/KonseptPreview.tsx` (sub-seksjon i preview)
- `src/pages/fraviksdokumentasjon/KvalitativAnalyse.tsx` (les query-params, prefyll)

## Åpne spørsmål
1. **Status-badge:** Vi har ikke et eksplisitt `status`-felt på fravik. Forslag: avled `foreslått` (tom `konklusjon`) / `akseptert` (utfylt `konklusjon`). Vil du heller ha et nytt eksplisitt felt `status: 'foreslått'|'akseptert'|'avvist'` (krever migrasjon av JSON-innhold)?
2. **Opprett-knapp UX:** Innebygd Dialog i brannkonseptet, eller redirect til fraviksdokumentasjonen med prefyll (anbefalt – beholder all eksisterende logikk i ett sted)?
