## Plan: Farger og innmeldingsplikt i Word-dokumentet

Jeg oppdaterer Word-eksporten for «Lagring av brannfarlig stoff» slik at den matcher forhåndsvisningen bedre, særlig statusfarger og vurderingstekster.

## Hva som endres

### 1. Ta med farger på status- og vurderingstekster i Word

Word-dokumentet skal få med samme type fargekoding som forhåndsvisningen, blant annet:

- «Tillatt» vises grønt
- «Ikke tillatt» vises rødt
- «Innmeldingspliktig» vises rødt
- «Under grense» vises grønt
- «Ikke aktuelt» vises dempet/grått
- «Overskrider» vises rødt
- «Overstiger ikke» vises grønt
- viktige konklusjonstekster får tilsvarende farge der previewen bruker farge

### 2. Gjøre Word-tabeller i stand til å fargelegge enkeltceller

Eksporten bruker i dag en generell tabellfunksjon som stort sett lager alle vanlige celler likt. Jeg utvider denne slik at tabeller kan få farge/bold per celle, uten å ødelegge eksisterende tabeller.

### 3. Forbedre innmeldingsplikt i Word-rapporten

Innmeldingsdelen i Word skal speile vurderingen i forhåndsvisningen bedre:

- tydelig konklusjon om anlegget er innmeldingspliktig eller ikke
- tabell med stoffgrupper der det er registrert mengde
- statusfarger i tabellen
- margin/gjenstående mengde til grense for stoffgrupper som ligger under grensen
- kommentar beholdes dersom den er lagt inn
- kildehenvisning til FBRT § 12 tas med i seksjonen

### 4. Ta med innmeldingsplikt i vurderingen av mengde over anbefalt DSB-mengde

I seksjonen «Vurdering av mengde over anbefalt DSB-mengde» legger jeg inn en kort vurdering av innmeldingsplikt når innmeldingsdata finnes, slik at rapporten tydelig viser om de totale mengdene også utløser meldeplikt til DSB.

Eksempel på innhold:

```text
Innmeldingsplikt: Basert på registrerte totalmengder er anlegget ikke innmeldingspliktig etter FBRT § 12.
```

eller:

```text
Innmeldingsplikt: Basert på registrerte totalmengder er anlegget innmeldingspliktig etter FBRT § 12. Følgende stoffgrupper overskrider innmeldingsgrensen: ...
```

## Tekniske detaljer

Filen som endres:

- `src/lib/brensellagring-word-export.ts`
  - utvide `cell`/`table`-hjelpere eller legge til en egen tabellhjelper for celleformattering
  - bruke fargeverdier fra previewen i relevante Word-celler
  - utvide innmeldingsseksjonen med margin, kilde og farget status
  - legge inn innmeldingsvurdering i overskridelsesseksjonen når `innmeldingVurdering` finnes

Det trengs ikke databaseendringer.