## Mål
Når husdyrhold-checkboxen ikke er huket av i BF85-tilstand, skal kun "Generelt"-raden vises i tabellen 3.11 husdyr. BF85-info-raden ("Byggeforskrift 1985 hadde ingen egne krav…") er da overflødig og skal skjules. Når checkboxen er huket av: vis BF85-info-raden + TEK17-radene som i dag.

## Endringer

### 1) Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx` (~linje 5392–5400)
Endre BF85-info-raden slik at den kun rendres når `formData.husdyrRedningRelevant` er true:

```tsx
{isBF85 && formData.husdyrRedningRelevant && (
  <tr>
    <td>Byggeforskrift 1985</td>
    <td>Byggeforskrift 1985 hadde ingen egne krav … brukes derfor som referanse …</td>
    <td>-</td>
  </tr>
)}
```

(Resten av seksjonen — TEK17-rader når relevant, ny "Generelt"-rad når ikke relevant — er uendret.)

### 2) Word-eksport – `src/lib/word-export-chapter3.ts` (~linje 1755–1760)
Endre `if (isBF85Tilstand310)` til `if (isBF85Tilstand310 && formData.husdyrRedningRelevant)` slik at info-raden kun pushes når brukeren har huket av husdyrhold.

## Avgrensning
- Kun BF85 påvirkes.
- Ingen endringer i skjema/datafelt.

## Akseptkriterier
- BF85 + husdyr ikke avhuket: tabellen viser kun "Generelt | Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket. | -".
- BF85 + husdyr avhuket: viser BF85-info-rad + TEK17-rader som i dag.
- TEK17 uendret.
