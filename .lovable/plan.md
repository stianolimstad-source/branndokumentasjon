## Mål

Oppdater "Generer sammendrag automatisk" i `src/pages/Konsept.tsx` (~linje 2883–2926) slik at sammendraget tilpasses dokumenttype og regelverk:

- **Tilstandsvurdering BF85** bruker `bygningsbrannklasse` (ikke risiko-/brannklasse) og en tekst tilpasset tilstandsvurdering, ikke prosjektering.
- **Tilstandsvurdering TEK17** bruker risiko-/brannklasse, men formuleres som vurdering av eksisterende bygg.
- **Brannkonsept** beholder dagens tekst (engasjert for prosjektering).

## Endringer

### `src/pages/Konsept.tsx` (~linje 2883–2926) – `onClick` for "Generer sammendrag automatisk"

Forgrene basert på `documentType === "tilstandsvurdering"` og `formData.regelverk === "BF85"`:

**Felles innledning (tilstandsvurdering, begge regelverk):**
```
{firma} er engasjert av {oppdragsgiver} for å utføre brannteknisk
tilstandsvurdering av {prosjekt}. Bygget er et {bygningstype} med
{etasjer} tellende etasje(r) og et samlet bruksareal på {areal} m².
```
(legg til adresse hvis `formData.adresse` finnes)

**BF85-grenen** – erstatt risiko-/brannklasse-setningen med:
```
Bygget er oppført etter Byggeforskrift 1985 (BF85) og er klassifisert
som bygningsbrannklasse {bygningsbrannklasse} ({bygningstype}).
```
Hvis `bygningsbrannklasse` mangler: vis "[bygningsbrannklasse ikke fastsatt]".

Dropp metode-setningen (preakseptert/analyse), den gjelder prosjektering.

**TEK17-tilstandsvurdering** – behold risikoklasse/brannklasse-setningen, men reformuler som "Bygget er klassifisert i risikoklasse … og brannklasse …" (ikke "plassert i").

**Felles for tilstandsvurdering – legg til kort kunde-relevant info:**
- Antall avvik registrert (telles fra `formData.fraviksdokumentasjon` eller tilsvarende registrerte avvik – sjekkes i implementering hvilken array som finnes; hvis ingen finnes, hopp over).
- Setning: "Vurderingen er basert på befaring og gjennomgang av tilgjengelig dokumentasjon. Avvik fra gjeldende regelverk er beskrevet i kapittel 3 og oppsummert nedenfor."
- Aktive branntekniske tiltak (sprinkler, brannalarm, ledesystem osv.) – samme `aktiveTiltak`-logikk som i dag, men introdusert med "Følgende aktive branntekniske tiltak er registrert i bygget:".

**Brannkonsept-grenen** beholder dagens tekst uendret.

## Avgrensning

- Endrer kun den auto-genererte teksten. Brukeren kan fortsatt redigere fritt etterpå.
- Ingen endringer i forhåndsvisning, Word-eksport eller datamodell.
- Hvis `bygningsbrannklasse` ikke er satt for BF85, brukes plassholder.

## Akseptkriterier

- BF85-tilstandsvurdering: sammendraget nevner bygningsbrannklasse, ikke risiko-/brannklasse, og ikke "preaksepterte ytelser".
- TEK17-tilstandsvurdering: sammendraget formuleres som vurdering, ikke prosjektering, og bruker risiko-/brannklasse.
- Brannkonsept (TEK17): uendret.
