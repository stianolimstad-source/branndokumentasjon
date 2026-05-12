## Mål

Når kap. 3.4 dokumenterer at brannvegg/seksjoneringsvegg ikke er etablert, og brukeren *ikke* huker av "etableres likevel som nytt tiltak", skal selve **kravene til veggen** ikke vises i forhåndsvisningen (de hører ikke hjemme der – fraviket beskrives i stedet i tilstandsvurderingen nederst i kapittelet).

Vurderingen av om seksjonering/brannvegg i utgangspunktet er påkrevd (arealvurdering, "Generelt") beholdes, slik at leseren fortsatt ser regelgrunnlaget som leder til fraviket.

## Endring

Kun frontend i `src/components/konsept/KonseptPreview.tsx`, kap. 3.4-blokken.

Innfør en hjelpe-flagg lokalt i 3.4-renderingen:

```
const skjulVeggKrav =
  formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel;
```

Skjul følgende rader når `skjulVeggKrav` er `true`:

**BF85-grenen (Kap. 30:6):**
- "Brannvegg (:62)" – preaksepterte ytelser til brannveggen
- "Gjennomføringer (:621)"
- "Åpninger i brannvegg" (dør/vindu-betinget)

**TEK17-grenen (§11-7):**
- "Vertikal oppdeling" (RK6 sykehus/pleie)
- "Seksjoneringsveggen" – blokken med preaksepterte ytelser (REI-klasser, takavslutning, hjørner osv.)
- "Dører og vinduer i seksjoneringsvegg"
- "Innvendig hjørne"-raden som vises i "ikke påkrevd"-grenen

**Beholdes uansett:**
- Tittelraden 3.4 og kolonneoverskrifter
- "Generelt"-rad / "Tabell 34:23"-rad som forklarer om seksjonering er påkrevd
- "Beskrivelse"-rad fra `formData.brannseksjoner` (brukerens egen tekst)
- Den eksisterende grønne "Nytt tiltak"-raden når `etablererSeksjoneringLikevel` er huket av (allerede på plass)
- `TilstandTableRow` for 3.4 nederst i kapittelet (fraviksbeskrivelsen)

Ingen endringer i `src/pages/Konsept.tsx`, beregningslogikk eller Word-eksport utover det som naturlig følger av samme preview-komponent.
