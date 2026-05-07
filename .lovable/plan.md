## Mål
Legg til automatisk tekst i kap. 3.10 (Utgang fra branncelle) for kraftstasjoner i både brannkonsept og tilstandsvurdering — for både TEK17 og BF85. Teksten gjelder rom med både mineraloljefylte apparater og betjeningsorganer for høyspenning.

## Tekst som skal legges til (ny rad i tabellen)

**Tittel:** "Kraftstasjon – utganger fra rom med høyspentanlegg"

**Innhold:**
> Inneholder rommet både mineraloljefylte apparater og betjeningsorganer for høyspenning, kreves det utgangsmulighet som beskrevet ovenfor fra begge ender av rommet (vanligvis endene av betjeningsgangen).
>
> Det kreves bare én utgang hvis avstanden fra ethvert av betjeningsorganene til utgangen har en samlet lengde på maks 4 m. I den samlede lengde skal kun medregnes de deler av gangen hvor den frie gangbredden ut for felt med mineraloljefylte apparater er mindre enn 2 m.

**Ansvar:** ARK / RIE

## Hvor

### 1. `src/components/konsept/KonseptPreview.tsx` (kap. 3.10, ~linje 4197)
Legg til en ny `<tr>`-rad rett etter "Dører til rømningsvei"-blokken, conditional på `erKraftstasjon` (samme helper som brukes andre steder i filen — sjekker `bygningstype` og `bygningsdeler`). Vises uavhengig av TEK17/BF85 (regelen gjelder begge). Tilstandsvurdering bruker samme komponent (`Tilstandsvurdering.tsx` er bare en wrapper rundt Konsept), så endringen dekker begge automatisk.

### 2. `src/lib/word-export-chapter3.ts` (kap. 3.10, ~linje 1186)
Speil samme rad i Word-eksport: legg til conditional row med `erKraftstasjonRV`-helperen som allerede er definert i filen.

## Filer som endres
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`

Ingen nye form-felt — utløses automatisk av kraftstasjon-bygningstype.
