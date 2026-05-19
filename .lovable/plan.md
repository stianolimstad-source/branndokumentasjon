## Mål
Legge til et øye-ikon ved siden av hver kapitteloverskrift i ROS-analyse-editoren — samme mønster som i brannkonseptet — som scroller forhåndsvisningen til riktig kapittel.

## Bakgrunn
- `RosPreview.tsx` har allerede ankere: `#kap-1`, `#kap-2`, `#kap-3`, `#kap-4` (når bow-tie finnes), `#kap-5` (oppsummering), `#kap-6` (revisjonshistorikk).
- Editor-seksjonene i `src/pages/RosAnalyse.tsx` har overskriftene «Metadata», «1. Innledning», «2. Metode», «3. Hendelser», «4. Bow-tie analyse», «Oppsummering», «Revisjonshistorikk».
- Konsept bruker mønsteret `document.getElementById(previewId).scrollIntoView({ behavior: 'smooth', block: 'start' })`.

## Endringer

### `src/pages/RosAnalyse.tsx`
- Importere `Eye` fra `lucide-react`.
- Legge til en liten hjelpefunksjon `scrollToPreview(id: string)` (top i komponenten eller modul-scope).
- Lage en liten lokal komponent `KapittelHeading({ title, previewId })` som rendrer `<h2>` + en `button` med `Eye`-ikon (klassene matcher Konsept: `p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors`, `title="Gå til i forhåndsvisning"`).
- Bytte ut de eksisterende `<h2>`-overskriftene med `KapittelHeading`:
  - «1. Innledning» → `previewId="kap-1"`
  - «2. Metode» → `previewId="kap-2"`
  - «3. Hendelser» → `previewId="kap-3"` (beholde eksisterende knappe-rad ved siden av)
  - «4. Bow-tie analyse» → `previewId="kap-4"`
  - «Oppsummering»-overskrift → `previewId="kap-5"`
  - «Revisjonshistorikk»-overskrift → `previewId="kap-6"`
- «Metadata»-seksjonen får ikke øye (ingen tilsvarende preview-anker).

### Ingen endringer
- `RosPreview.tsx` — ankrene finnes allerede.
- Datamodell, eksport, andre filer.

## Verifisering
- Klikk øye-ikonet ved «3. Hendelser» → preview til høyre scroller til kapittel 3.
- Klikk øye ved «4. Bow-tie analyse» når det finnes en bow-tie → scroller til kap. 4.
- Test alle 6 ikon — riktig kapittel kommer i toppen av preview.
