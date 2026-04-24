## Plan: Innmeldingsmengder for gass i rapporten

Jeg oppdaterer «Lagring av brannfarlig stoff» slik at innmeldingsvurderingen også viser brannfarlig gass med riktig innmeldingsmengde, slik som i eksempelet du la ved.

## Hva som endres

### 1. Legge til gass i innmeldingsgrunnlaget

Dagens innmeldingsvurdering bruker bare væsker/diesel. Jeg legger til en egen stoffgruppe for gass:

```text
Stoffgruppe: Brannfarlig gass, kategori 1 og 2
Brannfarlig stoff: LPG (propan, butan), LNG (flytende naturgass), CNG (komprimert naturgass), Naturgass (i rørledning)
Innmeldingsmengde fra: 400 liter (0,4 m³ beholdervolum)
```

### 2. Oppdatere beregningen

Innmeldingsvurderingen utvides slik at total mengde gass fra «Total mengde brannfarlig stoff» inngår i vurderingen:

```text
gass_kat1 + gass_kat2
```

Denne sammenlignes mot 400 liter / 0,4 m³ beholdervolum.

Merk: dagens gassfelt er oppgitt i kg i brukergrensesnittet. Jeg vil derfor vise vurderingen tydelig som «registrert mengde» mot «innmeldingsmengde fra 400 liter beholdervolum», slik at rapporten ikke later som kg og liter er samme måleenhet.

### 3. Oppdatere innmeldingstabellen i forhåndsvisningen

Rapportseksjonen «Innmeldingsplikt til DSB» får en tabell som inkluderer gassraden. Tabellen utvides til å kunne vise:

- Stoffgruppe
- Brannfarlig stoff
- Total/registrert mengde
- Innmeldingsmengde fra
- Status
- Margin der dette er entydig

### 4. Oppdatere Word-eksporten

Word-rapporten får samme gassrad og samme vurderingslogikk som forhåndsvisningen, slik at eksport og forhåndsvisning stemmer overens.

### 5. Oppdatere input-siden

I fanen «Innmelding» oppdateres vurderingstabellen slik at brannfarlig gass vises sammen med væsker/diesel, og slik at innmeldingsgrensen for gass fremgår tydelig.

## Filer som endres

- `src/lib/brensellagring-krav.ts`
  - legge til innmeldingsgrense for brannfarlig gass

- `src/pages/Brensellagring.tsx`
  - utvide innmeldingsberegningen med gass
  - vise gass i innmeldingstabellen på input-siden

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - støtte og vise gassraden i rapportforhåndsvisningen

- `src/lib/brensellagring-word-export.ts`
  - støtte og vise gassraden i Word-rapporten

## Resultat

Innmeldingsseksjonen vil vise gass som egen stoffgruppe med innmeldingsmengde fra 400 liter / 0,4 m³ beholdervolum, og rapporten blir mer komplett for virksomheter som lagrer LPG, LNG, CNG eller naturgass.