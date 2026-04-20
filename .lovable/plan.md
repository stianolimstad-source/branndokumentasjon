

## Problem

Brannkonsept-siden har vesentlig mer plass enn Brensellagring-siden, fordi de bruker forskjellige layout-strategier:

**Brannkonsept (`/konsept`)** — bruker hele skjermbredden:
- Wrapper: `w-full px-4` + `max-w-[1800px]`
- Grid: `lg:grid-cols-2` (50/50)
- Preview: `maxWidth: 210mm`, `fontSize: 11px` (skalerer pent)

**Brensellagring (`/brensellagring`)** — innsnevret:
- Wrapper: `container mx-auto px-3 sm:px-4` ← Tailwind `container` låser bredden til breakpoint-størrelser (typisk maks ~1400px), uavhengig av `max-w-[1920px]` inni
- Grid: `lg:grid-cols-[1fr_1.4fr]` (asymmetrisk)
- Preview: `maxWidth: 250mm`, `fontSize: 13` (større innhold tvinger mer scroll)

## Plan

Justér Brensellagring-siden til å speile Brannkonsept-layouten:

**1. `src/pages/Brensellagring.tsx`**
- Bytt ut `<section className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">` med `<div className="w-full px-4 py-6">` (samme som Konsept)
- Endre den indre wrapperen fra `max-w-[1920px]` til `max-w-[1800px]`
- Endre grid fra `lg:grid-cols-[1fr_1.4fr] gap-10 lg:h-[calc(100vh-160px)]` til `lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]` (identisk med Konsept)

**2. `src/components/brensellagring/BrensellagringPreview.tsx`**
- Tilbakestill preview til standard A4-dimensjoner som matcher Konsept-preview:
  - `maxWidth: "210mm"` (fra 250mm)
  - `minHeight: "297mm"` (fra 350mm)
  - `fontSize: 11` (fra 13)
  - H2: `15` (fra 18), H3: `12` (fra 15)
  - Padding: `"20mm 18mm 24mm 18mm"` (fra 24mm/22mm)
  - Tabell-padding tilsvarende ned

## Resultat

Begge sider vil ha:
- Samme ytre bredde (full skjerm opp til 1800px)
- Samme symmetriske 50/50 split mellom input og forhåndsvisning
- Samme A4-skalering på preview
- Samme leselighet — preview vises i sin helhet uten horisontal scroll, og venstre kolonne får like mye plass som på brannkonsept-siden

