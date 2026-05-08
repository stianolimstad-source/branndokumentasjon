## Mål
Bruk samme automatiske bedriftsmal-logikk på brannkonsept- og tilstandsvurdering-eksporter, og la brukeren se den visuelle effekten både i forhåndsvisningen på siden og i Word-filen.

## Endringer

### 1. `src/pages/Konsept.tsx` — Word-eksporten (`exportToWord`, ca. linje 1483)
Begynn funksjonen med å hente det resolverte temaet:
```ts
const { resolveDocumentTheme } = await import("@/lib/document-templates");
const theme = await resolveDocumentTheme(selectedProjectId, logoUrl, user?.id);
```
Bruk `theme` på følgende konkrete steder (minimalt invasivt):
- **Logo til forsiden**: bytt `if (logoUrl)` → `const coverLogoUrl = theme.logoUrl ?? logoUrl;` og bruk denne både i `fetch(...)` og `img.src = ...`. Gjør at gruppens logo vinner over personlig logo.
- **Standard font** i `Document.styles.default.document.run`: bytt `font: "Verdana"` → `font: theme.fontFamily`.
- **Forsidetittel** ("BRANNKONSEPT"/"TILSTANDSVURDERING"): legg til `color: theme.primaryColor` på `TextRun`-en (krever å bytte `text:` til `children: [new TextRun(...)]` siden HeadingLevel.TITLE bruker text-prop direkte). Legg også til en tynn aksentlinje (Paragraph med border-bottom i `theme.accentColor`) rett under tittelen.
- **Forsidetekst (prosjektnavn/adresse/dato)** beholdes som de er — fungerer mot alle farger.

Vi rører ikke alle de hundrevis av `HEADING_1`-paragrafene i resten av dokumentet i denne runden — det blir for stor risiko. Forside + logo + font er det brukeren ser tydeligst.

### 2. `src/components/konsept/KonseptPreview.tsx` — On-screen forhåndsvisning
- Legg til ny valgfri prop `theme?: { primaryColor: string; accentColor: string; fontFamily: string }`.
- Hvis `theme` er gitt:
  - Sett `fontFamily` på rot-`<div>` (overstyrer Verdana-default).
  - Forsidetittel (`<h1>BRANNKONSEPT/TILSTANDSVURDERING`) får `color: theme.primaryColor`.
  - Legg en `<div>` med `borderTop: 2px solid {accentColor}` under logoen på forsiden.
- Ingen andre stiler røres; alt annet beholder dagens utseende.

### 3. `src/pages/Konsept.tsx` — vis temaet i preview også
- Ny state `[previewTheme, setPreviewTheme]`. I `useEffect` som reagerer på `selectedProjectId`/`user`, kall `resolveDocumentTheme(selectedProjectId, logoUrl, user?.id)` og lagre.
- Send `theme={previewTheme ?? undefined}` til `<KonseptPreview ... />`.
- Når brukeren bytter prosjekt eller logger inn, refetch.

## Hva brukeren får
- Brannkonsept- og tilstandsvurderingsforhåndsvisningen får farget tittel + bedriftens logo + bedriftens skrifttype (når brukeren tilhører én bedrift med mal, eller har valgt standard på Min profil).
- Word-fila som lastes ned bruker samme logo, font og forsidefarger.
- Ingen DB- eller backend-endringer (allerede gjort i forrige steg).

## Avgrensninger
- Vi tema-styler ikke alle interne kapitteloverskrifter i Word i denne runden (kan komme senere). Forsiden + logo + font gir 80 % av visuell effekt med 5 % av risikoen i et 9 000-linjers eksportprogram.
