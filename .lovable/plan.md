## Tilbakestill innput-panelet til minimalistisk stil

### Endringer i `src/components/konsept/TilstandsvurderingPanel.tsx`

1. **Ytre wrapper** – tilbake til opprinnelig stil:
   - Fra: `rounded-xl border-2 border-amber-300 ... bg-amber-50 ... shadow-md overflow-hidden`
   - Til: `mt-4 p-4 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg`

2. **Fjern header-bånd**:
   - Fjern hele `<div>` med ikon (`ClipboardCheck`), "TILSTANDSVURDERING"-label og TG-badge
   - Erstatt med opprinnelig enkel label `"Tilstandsvurdering – {sectionLabel}"` over "Samlet tilstandsgrad"-feltet
   - Fjern `ClipboardCheck` fra `lucide-react`-import

3. **Kategori-blokker** – tilbake til enklere stil i `renderKategori`:
   - Fjern wrapper-kant, fargebakgrunn og header-stripe
   - Bruk enkel `<div>` med liten `<Label>` (label) og hjelpetekst
   - Fjern `accent.wrapper`/`accent.header`-props; behold kun `chip` for "Avvik N"-tekstfarge

4. **Innholdspadding**:
   - Erstatt `<div className="p-4 space-y-4">` med direkte `space-y-4` på root, siden ytre wrapper igjen har egen `p-4`

### Det som IKKE endres
- Datastruktur (`TilstandAvvik`, `TilstandKategori`, `TilstandData`)
- Logikken for `addAvvik`, `removeAvvik`, `updateAvvik`, opplasting av bilder
- `renderAvvikKort` og dens stil (avvik-kortene var greie)
- Rapport- og Word-eksport (uendret)

### Resultat
Innput-panelet får tilbake sin lette, "innput-aktige" stripete amber-stil, mens selve rapporten beholder den nye fremtredende presentasjonen.