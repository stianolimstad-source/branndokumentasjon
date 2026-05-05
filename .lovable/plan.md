# Fjern duplikat brannenergi-felt og vis verdien i rapporten

## Problem
I BF85 tilstandsvurdering vises det to felter for spesifikk brannenergi i kapittel 2:
1. **Kap 2.1 Bygningsinformasjon** – "Spesifikk brannenergi (MJ/m²)" (`formData.brannseksjonBrannenergi`, Konsept.tsx linje 3129).
2. **Lenger ned i kap 2** (under Grunnlagsdokumenter, kun for bygningstype Industri/Lager) – "Spesifikk brannbelastning (MJ/m²)" (`formData.bf85Brannbelastning`, Konsept.tsx linje 3520).

Verdien fra 2.1 vises heller ikke i forhåndsvisningen for tilstandsvurdering (`KonseptPreview.tsx` linje 512–544).

## Løsning

### 1. Fjern duplikat-feltet under 2.2 (Konsept.tsx)
Fjern hele blokken på linje 3517–3545 (`Spesifikk brannbelastning` for industri/lager). Behold `bf85Brannbelastning`-feltet i state for bakoverkompatibilitet, men sett det automatisk fra `brannseksjonBrannenergi`:
- I `onValueChange` for "Spesifikk brannenergi" under 2.1: når bygningstype er Industri/Lager (BF85), oppdater også `bf85Brannbelastning` med samme verdi og rekalkuler `bygningsbrannklasse` via `getBygningsbrannklasse(...)` (samme kall som finnes i den nåværende duplikat-blokken).
- Slik beholder vi den automatiske bygningsbrannklasse-beregningen uten å vise dobbelt felt.

### 2. Vis "Spesifikk brannenergi" i forhåndsvisning (KonseptPreview.tsx)
I tilstand-grenen rundt linje 512–544, legg til en ny rad i bygningsinformasjons-tabellen rett før Bygningsbrannklasse/Risikoklasse:
```
| Spesifikk brannenergi | <Over 400 / 50–400 / Under 50 MJ/m²> |
```
Mapping fra `formData.brannseksjonBrannenergi`: `"over400"` → "Over 400 MJ/m²", `"50-400"` → "50–400 MJ/m²", `"under50"` → "Under 50 MJ/m²", ellers "[Angis]".

### 3. Word-eksport
I `src/lib/word-export-chapter3.ts` (eller den filen som genererer kap. 2-tabellen for tilstandsvurdering) legge til samme rad slik at Word-dokumentet matcher forhåndsvisningen.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
