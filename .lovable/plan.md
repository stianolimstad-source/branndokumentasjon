## Mål

Vise en visuell forhåndsvisning av valgt mal **direkte på bedriftssiden** i `MalvalgPanel`, slik at brukeren ser endringer (farger, skrift, logo, forside-stil) umiddelbart — uten å måtte laste ned Word-filen. Word-forhåndsvisning beholdes som ekstra valg.

## Hva som lages

Ny komponent `src/components/gruppe/MalForhandsvisning.tsx` som rendrer en HTML/CSS-mockup av et A4-dokument med:

- **Forside** (cover) — tittel, undertittel, prosjektnavn, dato, logo, plassert etter mal-stilen (klassisk = sentrert med farget bånd, moderne = venstrejustert med stor fargeblokk, minimalistisk = sober tekst på hvit).
- **Topp-/bunntekst** — liten logo + dokumentnavn / sidetall i valgt aksentfarge.
- **Eksempelinnhold** — én H1 ("1. Innledning"), brødtekst, én H2, en liten tabellrad — alt med valgt skrifttype og farger.

Forhåndsvisningen oppdateres **live** mens brukeren endrer mal/farger/skrift (via React state i `MalvalgPanel`).

## Plassering i UI

I `MalvalgPanel` legges en ny seksjon under fargevelgerne, over knapperaden:

```text
[Mal-kort: Klassisk | Moderne | Minimalistisk]
[Primærfarge] [Aksentfarge] [Skrifttype]
─────────── Forhåndsvisning ───────────
[ A4-mockup med live oppdatering ]
[Lagre] [Forhåndsvis i Word]
```

Mockupen vises som et "papirark" med skygge (`shadow-elegant`, `aspect-[1/1.414]`) skalert til ca. 480px bredt på desktop, full bredde på mobil.

## Teknisk

- Ren React/Tailwind, ingen ekstra avhengigheter.
- Tre layout-varianter (en per `TemplateId`) styres med en `switch` inne i `MalForhandsvisning`.
- Bruker samme `primary`, `accent`, `font`, `logoUrl`, `groupName` som allerede finnes i `MalvalgPanel`-state — sendes som props.
- Logo lastes via vanlig `<img src={logoUrl}>` (ikke buffer) — raskt og uten Supabase-kall.
- Ingen endringer i `document-templates.ts`, ingen endringer i Word-eksporten, ingen DB-endringer.

## Filer

- **Ny:** `src/components/gruppe/MalForhandsvisning.tsx`
- **Endret:** `src/components/gruppe/MalvalgPanel.tsx` — importer og rendre `<MalForhandsvisning ... />` med live state.

## Bemerkning om presisjon

HTML-forhåndsvisningen er en **visuell tilnærming**, ikke en pixelperfekt Word-rendering. Word-knappen beholdes for nøyaktig kontroll. Dette kommuniseres med en liten label: *"Visuell forhåndsvisning — endelig layout vises i Word."*
