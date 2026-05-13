## Mål
For tilstandsvurderinger etter BF85 skal det vises at tilrettelegging for redning av husdyr er "ikke relevant" når brukeren ikke huker av for at bygget er beregnet for husdyrhold (`husdyrRedningRelevant = false`).

## Dagens oppførsel (problem)
I både forhåndsvisning og Word-eksport vises meldingen "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket." kun for TEK17. For BF85 skjules denne meldingen eksplisitt (`!isBF85` i preview, `!isBF85Tilstand310` i Word).

## Endringer

### 1) Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx`
Fjern `!isBF85`-betingelsen rundt fallback-raden (~linje 5475) slik at meldingen vises for både TEK17 og BF85 når `!formData.husdyrRedningRelevant`.

**Fra:**
```tsx
!isBF85 && (
  <tr>
    <td colSpan={3} style={{fontStyle: 'italic'}}>
      Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.
    </td>
  </tr>
)
```

**Til:** Vis raden uavhengig av `isBF85`.

### 2) Word-eksport – `src/lib/word-export-chapter3.ts`
Endre `else if (!isBF85Tilstand310)` til `else` (~linje 1786) slik at "ikke relevant"-raden pushes også for BF85.

**Fra:**
```ts
} else if (!isBF85Tilstand310) {
  rows.push(contentRow("", "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.", "-"));
}
```

**Til:**
```ts
} else {
  rows.push(contentRow("", "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.", "-"));
}
```

## Avgrensning
- Ingen endringer i skjema (`Konsept.tsx`) – dagens checkbox + info-boks beholdes.
- Ingen nye datafelt; ingen migrering.
- Kun to linjeendringer (fjerne / endre en betingelse).

## Akseptkriterier
- I BF85-tilstand viser forhåndsvisning og Word-eksport "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket." når checkboxen for husdyrhold ikke er huket av.
- TEK17-tilstand beholder dagens oppførsel (samme melding vises som før).
