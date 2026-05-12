## Mål

I rapportens kap. 3.4 (BF85) skal kravradene til brannvegg (`Brannvegg (:62)`, `Gjennomføringer (:621)` og `Åpninger i brannvegg`) **ikke vises** dersom valgt brannbelastning kombinert med tiltak (brannventilasjon/sprinkler) gjør at det ikke lenger er krav til oppdeling med brannvegg. Per i dag vises radene alltid for BF85 (med mindre brannvegg mangler og ikke etableres som nytt tiltak).

## Endring

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.4, BF85-grenen)

Innfør et felles flagg `kreverBrannvegg` som styrer om kravradene rendres:

- Default `true` (uendret oppførsel for bygningstyper uten Tabell 34:23-vurdering: Kontor, Skole, Lager osv. der brannvegg fortsatt kan være aktuelt).
- For **Industri/Kraftstasjon/Kontor/Garasje/Lager** når `formData.bf85_34_brannbelastning` er valgt: bruk `getBF85BrannveggKravKap34(areal, brannbelastning, tiltak)`.
  - Hvis `krav.ingenKrav === true` **eller** `krav.krevBrannvegg === false` → `kreverBrannvegg = false`.
- Hvis brukeren har valgt at brannvegg etableres som nytt tiltak (`formData.manglerSeksjonering && formData.etablererSeksjoneringLikevel`) → behold `kreverBrannvegg = true` (eksplisitt brukervalg overstyrer).

Bruk `kreverBrannvegg` i tillegg til den eksisterende sjekken (`!(manglerSeksjonering && !etablererSeksjoneringLikevel)`) på de tre radene:

- `Brannvegg (:62)` (linje ~1503–1519)
- `Gjennomføringer (:621)` (linje ~1521–1532)
- `Åpninger i brannvegg` (linje ~1534–1546)

Vurderingsraden `Tabell 34:23` (linje ~1479–1502) og `Generelt (:61)` (linje ~1434–1470) beholdes som før — de viser fortsatt selve konklusjonen om at brannvegg ikke er påkrevd.

## Ikke endret

- TEK17-grenen.
- `Konsept.tsx` (inputside).
- Word-eksport (følges opp i samme fil hvis den speiler preview; sjekkes ved implementering).
- Beregningslogikk og konstanter.
