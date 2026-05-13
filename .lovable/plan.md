## Mål
Når husdyrhold-checkboxen ikke er huket av i BF85-tilstandsvurdering, skal "ikke relevant"-raden vises med `Forhold = "Generelt"` og `Løsning = "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket."` (i stedet for dagens fullbredde italic-rad). Når checkboxen er huket av, beholdes dagens visning.

## Endringer

### 1) Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx` (~linje 5474–5480)
For BF85: Vis raden med tre kolonner — `Generelt` / fritekst / `-`. For TEK17: behold dagens fullbredde italic-rad.

```tsx
) : (
  isBF85 ? (
    <tr>
      <td className="border border-gray-400 p-2 align-top">Generelt</td>
      <td className="border border-gray-400 p-2">Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.</td>
      <td className="border border-gray-400 p-2 align-top">-</td>
    </tr>
  ) : (
    <tr>
      <td className="border border-gray-400 p-2" colSpan={3} style={{fontStyle: 'italic'}}>
        Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.
      </td>
    </tr>
  )
)
```

### 2) Word-eksport – `src/lib/word-export-chapter3.ts` (~linje 1786–1788)
For BF85: bruk `contentRow("Generelt", "...", "-")`. For TEK17: behold tom Forhold som i dag.

```ts
} else if (isBF85Tilstand310) {
  rows.push(contentRow("Generelt", "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.", "-"));
} else {
  rows.push(contentRow("", "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.", "-"));
}
```

## Avgrensning
- Påvirker kun BF85 når `husdyrRedningRelevant = false`.
- Ingen endringer i skjema eller datafelt.
- Når checkboxen er huket av: uendret.

## Akseptkriterier
- I BF85-tilstand uten husdyrhold: tabellen viser én rad med "Generelt" | "Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket." | "-" — både i forhåndsvisning og Word.
- TEK17 uendret.
