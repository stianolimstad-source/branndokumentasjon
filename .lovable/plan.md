## Mål

Legg til følgende informasjonstekst i kap. 3.2 (Sikkerhet ved eksplosjon) på **inputtsiden** når dokumenttypen er tilstandsvurdering og regelverket er BF85:

> "BF 85 beskriver kun at bygninger skal være tilstrekkelig sikret mot eksplosjoner, her refereres det derfor videre til TEK17 sine krav for å kunne ivareta dette forholdet."

## Endring

### `src/pages/Konsept.tsx` (~linje 4427–4431)

Den eksisterende muted-teksten under overskriften til 3.2 vises i dag når `formData.regelverk === "BF85"`:

> "Sikkerhet ved eksplosjon er ikke spesifikt kravsatt i BF85, men må likevel vurderes i en tilstandsvurdering."

Bytt ut/utvid denne slik at det – kun for `documentType === "tilstandsvurdering"` og `formData.regelverk === "BF85"` – vises den nye teksten som et eget avsnitt rett under den eksisterende muted-paragrafen. Eksempel:

```tsx
{formData.regelverk === "BF85" && (
  <>
    <p className="text-xs text-muted-foreground mt-1">
      Sikkerhet ved eksplosjon er ikke spesifikt kravsatt i BF85, men må likevel vurderes i en tilstandsvurdering.
    </p>
    {documentType === "tilstandsvurdering" && (
      <p className="text-xs text-muted-foreground mt-1">
        BF 85 beskriver kun at bygninger skal være tilstrekkelig sikret mot eksplosjoner, her refereres det derfor videre til TEK17 sine krav for å kunne ivareta dette forholdet.
      </p>
    )}
  </>
)}
```

## Avgrensning

- Endringen gjelder **kun inputtsiden** – ingen endring i forhåndsvisning, Word-eksport eller datamodell.
- Påvirker ikke brannkonsept eller TEK17-tilstandsvurdering.
