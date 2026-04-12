

## Plan: Oppdater seksjon 3.9 for flere bygningsdeler

### Problem
Seksjon 3.9 bruker allerede `formData.bygningsdeler.some()` for å vise slokkeanlegg-sjekkbokser for RK4/RK6, men:
1. **Brannalarm/røykvarsler-logikken** (linje 7394–7416) bruker kun primær risikoklasse for å bestemme `kanVelgeRoykvarsler`, `brannalarmkategori` og fravikssjekker
2. **Rapporten** (KonseptPreview.tsx) viser ikke hvilke bygningsdeler som utløser hvilke krav
3. Ledesystem-logikken sjekker kun primær RK for RK5/RK6-kravet

### Endringer

**1. `src/pages/Konsept.tsx` — UI-logikk (linje ~7394–7616)**
- Bygge opp `allParts`-array (primær + bygningsdeler) som brukt i andre seksjoner
- `kanVelgeRoykvarsler`: sjekke om **alle** deler kvalifiserer (ikke bare primær). Hvis noen del krever brannalarm, kan ikke røykvarsler velges
- `brannalarmkategori`: beregne per del og bruke strengeste (høyeste) kategori
- Fravikssjekk for brannalarm: sjekke om noen del har RK2–RK6
- Vise per-del info der det er relevant: «Bygningsdel 1 (Kontor, RK3): Kategori 2» osv.
- Ledesystem: sjekke om noen del har RK5/RK6

**2. `src/components/konsept/KonseptPreview.tsx` — Rapport**
- Slokkeanlegg-rader: legge til bygningsdel-label i «Løsning»-kolonnen (kompakt format som i 3.1/3.4/3.6)
- Brannalarmkategori: vise per bygningsdel hvis ulike kategorier

**3. `src/lib/word-export-chapter3.ts` — Word-eksport**
- Tilsvarende oppdateringer som i preview for konsistent eksport

### Omfang
Tre filer endres. Logikken følger samme mønster som allerede implementert i 3.1, 3.4, 3.6 og 3.7.

