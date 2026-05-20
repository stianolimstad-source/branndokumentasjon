## Problem

På mobil (390 px viewport) stables input- og preview-panelet riktig, men store deler av forhåndsvisningen blir kuttet på høyre side. Årsaken:

1. `pageStyle` i `RosPreview.tsx` har `padding: "20mm 18mm 24mm 18mm"` — 18 mm (~68 px) horisontal padding × 2 spiser nesten halvparten av en 390 px skjerm før innholdet starter.
2. Flere tabeller har `minWidth: 1100` eller bred kolonneoppsett. De ligger ikke alle i en `overflow-x: auto`-wrapper, og global CSS-regelen `html, body { overflow-x: hidden }` klipper det som stikker ut.
3. Preview-wrapperen (`<div className="bg-muted/20 lg:overflow-y-auto …">` i `RosAnalyse.tsx` linje 1601) har ingen `overflow-x` på mobil — bredt innhold blir derfor skjult, ikke scrollbart.
4. `landscapePageStyle` (linje 980) brukes for bow-tie-siden med samme problem.

## Endringer (kun frontend / CSS)

### `src/components/ros/RosPreview.tsx`
- Reduser `pageStyle` horisontal padding på små skjermer. Konverter den ene inline-stilen til en kombinasjon av inline + CSS-klasse (legg `.ros-page` regel i den eksisterende `<style>`-blokken) som overstyrer padding til `12px` under 640 px, samt `boxShadow: none` for å spare plass. Samme for `landscapePageStyle` via `.ros-page-landscape`.
- Sett `maxWidth: "100%"` fallback så landscape-siden ikke krever 297 mm — la container styre.
- Gå gjennom alle `<table>` som ikke allerede er pakket i en scrollende ref, og sørg for at de står inne i `<div style={{ overflowX: "auto" }} className="ros-h-scroll-hidden">` slik at brede tabeller (særlig de med `minWidth: 1100` rundt linje 794 og 1727/1792) kan scrolles horisontalt på mobil i stedet for å klippes.

### `src/pages/RosAnalyse.tsx`
- Linje 1601: legg til `overflow-x-auto` på preview-wrapperen så hele forhåndsvisningen kan scrolles horisontalt på mobil hvis noe likevel er bredere enn skjermen. Behold `lg:overflow-y-auto lg:h-[calc(100vh-117px)]`.

## Ikke berørt
- Forretningslogikk, Word-eksport, AI-funksjoner, RosMatriks, RosKriterier, datamodell.
- Desktop-layout (alle endringer er gated på `max-width: 640px` eller fungerer identisk på desktop).
