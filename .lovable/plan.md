## Problem

Når brukeren huker av "Brannvegg/seksjoneringsvegg er ikke etablert i bygget" (`manglerSeksjonering = true`) og **ikke** velger å etablere veggen som nytt tiltak (`etablererSeksjoneringLikevel = false`), vises kommentarfeltet i input — men teksten kommer ikke med i rapporten (kap. 3.4).

I dag rendres kommentaren (`formData.manglerSeksjoneringKommentar`) i `KonseptPreview.tsx` kun inne i "Nytt tiltak"-raden, som krever `etablererSeksjoneringLikevel = true` (linje 1413–1430). I "mangler-uten-tiltak"-grenen autoprefylles kommentaren riktignok inn i tilstandsvurdering 3.4 (`Konsept.tsx` linje 941–974), men kun hvis feltet er tomt fra før — så senere endringer i kommentaren forsvinner, og brukeren ser den uansett ikke direkte i selve kap. 3.4-tabellen.

## Endring

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.4)

Legg til en ny rad rett etter den eksisterende "Nytt tiltak"-raden (~linje 1430), som rendres når:

```
formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel
```

Raden viser:

- **Forhold:** "Fravik – {brannvegg|seksjoneringsvegg} mangler"
- **Løsning:** Standardtekst om at vegg ikke er etablert iht. BF85 Kap. 30:6 / TEK17 § 11-7 og dokumenteres som fravik i tilstandsvurderingen. Hvis `formData.manglerSeksjoneringKommentar` er fylt ut, vises kommentaren som et eget avsnitt under (italic), slik som i den eksisterende "Nytt tiltak"-raden.
- **Ansvar:** "RIBr"

Bruk `isBF85` for ordvalg ("brannvegg" vs. "seksjoneringsvegg") og regelverkshenvisning, på samme måte som linje 1416/1420–1422.

Den nye raden gjelder både BF85- og TEK17-grenen, så den plasseres utenfor `isBF85 ? (...) : (...)`-blokken, like under den eksisterende "Nytt tiltak"-raden.

### Word-eksport

Sjekk `src/lib/word-export-chapter3.ts` for tilsvarende rad. Hvis fravik-status og kommentar ikke allerede er med ved `manglerSeksjonering && !etablererSeksjoneringLikevel`, speil samme tillegg der så Word-rapporten matcher preview.

## Ikke endret

- Inputfeltet i `Konsept.tsx` (kommentarfeltet vises allerede korrekt).
- Auto-prefyllingen av tilstandsvurdering 3.4.
- Tabell 34:23-logikk og `kreverBrannvegg`-flagget for de andre brannvegg-radene.
- TEK17-spesifikk beregningslogikk.
