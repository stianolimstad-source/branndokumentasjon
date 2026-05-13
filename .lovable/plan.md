## Mål
Oppdatere alle kapitteloverskrifter og navigasjonsetiketter i `Konsept.tsx` (inputtsiden) slik at BF85-modus følger samme navnelogikk som `KonseptPreview.tsx`:
- Når BF85-tittel == TEK17-tittel: parentes viser kun paragrafnummer `(§ 11-X)`
- Når BF85-tittel != TEK17-tittel: parentes viser paragrafnummer + TEK17-tittel

## Endringer i Konsept.tsx

### 1. SectionCollapsible labels (accordion-overskrifter)
Oppdatere følgende kapitteloverskrifter:

| Kap. | Nåværende BF85 | Endring |
|------|----------------|---------|
| 3.3 | `Avstand mellom bygninger (§ 11-6)` | → `Avstand mellom bygninger (§ 11-6 Tiltak mot brannspredning mellom byggverk)` |
| 3.4 | `Brannteknisk oppdeling (§ 11-7)` | → `Brannteknisk oppdeling (§ 11-7 Brannseksjoner)` |
| 3.6 | `Kledninger og overflater (:42)` | → `Kledninger og overflater (§ 11-9 Materialer og produkters egenskaper ved brann)` |
| 3.8 | `Rømning og redning (§ 11-11)` | → `Rømning og redning (§ 11-11 Generelle krav om rømning og redning)` |
| 3.9 | `Tilrettelegging for rømning (§ 11-12)` | → `Tilrettelegging for rømning (§ 11-12 Tiltak for å påvirke rømnings- og redningstider)` |
| 3.11 | `Rømningsvei (§ 11-14)` | → `Rømningsvei (§ 11-14 Rømningsvei)` (allike, behold som i dag) |
| 3.12 | `Redning av husdyr (§ 11-15)` | → `Redning av husdyr (§ 11-15 Tilrettelegging for redning av husdyr)` |
| 3.13 | `Manuell slokking (§ 11-16)` | → `Manuell slokking (§ 11-16 Tilrettelegging for manuell slokking)` |
| 3.14 | `Tilrettelegging for slokkemannskap (§ 11-17)` | → `Tilrettelegging for slokkemannskap (§ 11-17 Tilrettelegging for rednings- og slokkemannskap)` |

3.1, 3.2, 3.5, 3.7, 3.10 er allerede korrekte.

### 2. Interne Labels (inni hver seksjon)
Kap. 3.7–3.14 har ikke BF85-gren i det hele tatt. Legge til `formData.regelverk === "BF85" ? ...` for:
- **3.7**: `3.7 Tekniske installasjoner (§ 11-10)` / `3.7 § 11-10 Tekniske installasjoner`
- **3.8**: `3.8 Rømning og redning (§ 11-11 Generelle krav om rømning og redning)` / `3.8 § 11-11 Rømning og redning`
- **3.9**: `3.9 Tilrettelegging for rømning (§ 11-12 Tiltak for å påvirke rømnings- og redningstider)` / `3.9 § 11-12 Tilrettelegging for rømning og redning`
- **3.10**: `3.10 Utgang fra branncelle (§ 11-13)` / `3.10 § 11-13 Utgang fra branncelle`
- **3.11**: `3.11 Rømningsvei (§ 11-14 Rømningsvei)` / `3.11 § 11-14 Rømningsvei`
- **3.12**: `3.12 Redning av husdyr (§ 11-15 Tilrettelegging for redning av husdyr)` / `3.12 § 11-15 Tilrettelegging for redning av husdyr`
- **3.13**: `3.13 Manuell slokking (§ 11-16 Tilrettelegging for manuell slokking)` / `3.13 § 11-16 Manuell slokking`
- **3.14**: `3.14 Tilrettelegging for slokkemannskap (§ 11-17 Tilrettelegging for rednings- og slokkemannskap)` / `3.14 § 11-17 Tilrettelegging for slokkemannskap`

### 3. Tilstandsvurderings-seksjoner
Oppdatere `tilstandSectionsTEK17` til å generere BF85-titler dynamisk, eller opprette en egen `tilstandSectionsBF85`-liste som brukes når `regelverk === "BF85"`.

## Tekniske detaljer
- `tilstandSections`-variabelen defineres nå som `tilstandSectionsTEK17` utenfor komponenten. Den flyttes inn eller splittes i to lister.
- Ingen endringer i datastrukturer, API-er, databasemodeller, eller word-export (unntatt eventuell TEK17-navn-endring i innebygd Word-eksport TOC).
- Alle endringer er presentasjonelle (labels/tekst) i frontend.