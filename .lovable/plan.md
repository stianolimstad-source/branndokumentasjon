## Plan: Ta med alle registrerte stoffgrupper i innmeldingsvurderingen

Jeg oppdaterer innmeldingsvurderingen slik at alle stoffgrupper som har fått registrert en mengde vises i vurderingen, også når mengden ligger under innmeldingsgrensen. Dette gir en mer komplett og ryddig oversikt i både input-siden, forhåndsvisningen og Word-rapporten.

## Hva som endres

### 1. Filtrere innmeldingstabellen på registrerte mengder

Dagens vurdering bygger status for alle innmeldingsgrupper, og viser også grupper uten mengde som «Ikke aktuelt». Jeg endrer visningen slik at tabellen bare viser grupper der brukeren faktisk har oppgitt mengde:

```text
Vises:
- Brannfarlig gass, kategori 1 og 2, hvis gassmengde > 0
- Brannfarlig væske, kategori 1 og 2, hvis mengde > 0
- Brannfarlig væske, kategori 3, hvis mengde > 0
- Diesel og fyringsoljer, hvis mengde > 0

Skjules:
- Stoffgrupper uten registrert mengde
```

### 2. Beholde status for under/over grense

For stoffgrupper med registrert mengde vises status uansett om grensen er overskredet:

```text
Over grense  -> Innmeldingspliktig
Under grense -> Under grense
```

Dermed kan rapporten vise f.eks. at det er registrert 50 kg gass selv om dette ikke alene utløser innmelding.

### 3. Oppdatere input-siden

I fanen «Innmelding» endres tabellen slik at den ikke lenger fylles med irrelevante rader uten mengde. Alle registrerte stoffgrupper blir stående i tabellen med mengde, grense og status.

### 4. Oppdatere rapportforhåndsvisningen

I rapportseksjonen «Innmeldingsplikt til DSB» vises samme filtrerte vurderingstabell: kun stoffgrupper med registrert mengde, også de som ligger under grensen.

### 5. Oppdatere Word-eksporten

Word-rapporten får samme logikk som forhåndsvisningen, slik at eksporten viser alle registrerte stoffgrupper og ikke bare de som overskrider innmeldingsgrensen.

## Tekniske detaljer

Filer som endres:

- `src/pages/Brensellagring.tsx`
  - justere `evaluerInnmelding()` til å returnere en egen visningsliste eller filtrere `grupper` til `sum > 0`
  - oppdatere tabellen i fanen «Innmelding»

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - bruke kun innmeldingsgrupper med registrert mengde i rapporttabellen og konklusjonsteksten

- `src/lib/brensellagring-word-export.ts`
  - bruke samme filtrerte innmeldingsgrupper i Word-tabellen

## Resultat

Innmeldingsvurderingen blir mer oversiktlig: rapporten dokumenterer alle stoffgrupper som faktisk er registrert med mengde, samtidig som den tydelig skiller mellom «Under grense» og «Innmeldingspliktig». Når ingen mengder er registrert, vises fortsatt meldingen om at totalmengder må fylles inn.