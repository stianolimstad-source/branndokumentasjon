## Plan: Vis alle oppgitte mengder i vurdering av anbefalt DSB-mengde

Jeg oppdaterer seksjonen «Vurdering av mengde over anbefalt DSB-mengde» slik at tabellen viser alle stoffgrupper der brukeren har oppgitt en planlagt mengde, også når mengden ikke overstiger anbefalt DSB-mengde.

## Hva som endres

### 1. Endre beregningsgrunnlaget

Dagens logikk filtrerer bort rader som ikke har overskridelse. Jeg endrer dette slik at tabellen inkluderer alle rader der:

```text
Planlagt mengde > 0
og
Anbefalt DSB-mengde finnes (> 0)
```

Dermed vises både:

```text
Over anbefalt mengde  -> Overskridelse vises
Under/lik anbefalt    -> Vises som ikke overskredet
```

### 2. Tydelig status i input-siden

I inputtabellen for denne vurderingen legges det inn en statuskolonne eller tydelig tekst i overskridelseskolonnen:

```text
Overskrider
Overstiger ikke
```

For mengder under grensen vises f.eks.:

```text
0 liter (0 %) / Overstiger ikke
```

eller tilsvarende ryddig statusmerking.

### 3. Oppdatere rapportforhåndsvisningen

I rapporten vises samme komplette vurderingstabell. Stoffgrupper med registrert mengde, men uten overskridelse, får en grønn/nøytral status som viser at mengden ikke overstiger anbefalt DSB-mengde.

### 4. Oppdatere Word-eksporten

Word-rapporten oppdateres med samme logikk og samme statusfelt, slik at eksporten samsvarer med forhåndsvisningen.

### 5. Beholde vurderingstekst kun ved faktisk overskridelse

Automatisk vurderingstekst og konklusjon som omtaler «overskridelse» skal fortsatt bare genereres når minst én stoffgruppe faktisk overstiger anbefalt mengde. Hvis alle oppgitte mengder ligger under anbefalt DSB-mengde, skal tabellen kunne vises uten at teksten feilaktig beskriver en overskridelse.

## Tekniske detaljer

Filer som endres:

- `src/pages/Brensellagring.tsx`
  - endre `overskridelseRows` fra å filtrere på `row.overskridelse > 0` til å inkludere alle rader med oppgitt mengde
  - beregne egen indikator for faktisk overskridelse
  - oppdatere inputtabellen/statusvisningen for «overstiger ikke»

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - oppdatere seksjonen «Vurdering av mengde over anbefalt DSB-mengde» slik at alle oppgitte stoffgrupper vises
  - vise status for både overskridelse og ikke overskridelse
  - unngå overskridelsestekst når ingen rader overstiger

- `src/lib/brensellagring-word-export.ts`
  - oppdatere Word-tabellen med statuskolonne/tekst
  - sikre samme datagrunnlag som i forhåndsvisningen

## Resultat

Rapporten blir mer oversiktlig: alle stoffgrupper med oppgitt mengde dokumenteres i vurderingen, og tabellen viser tydelig om mengden overstiger eller ikke overstiger anbefalt DSB-mengde.