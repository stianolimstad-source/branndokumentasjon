## Legg til kollapsbar veiledning øverst i TrafoEksplosjonTool

I `src/components/verktoy/TrafoEksplosjonTool.tsx` skal det legges til en Accordion-komponent helt øverst i retur-JSX-en, før `/* INPUT */`-seksjonen.

### Endringer

1. **Accordion med `type="single"` og `defaultValue="veiledning"`**
   - Bruker eksisterende import fra `@/components/ui/accordion`.
   - En `<AccordionItem value="veiledning">` som er åpen ved første sidelast.
   - `<AccordionTrigger>`-tekst: **«Slik bruker du verktøyet»**

2. **Innhold i fire seksjoner**
   - Hver seksjon har en liten overskrift (`<h4>` eller `font-semibold`) etterfulgt av kortfattet prosa (ingen punktlister).
   - Teksten følger brukerens fire seksjoner nøyaktig:
     1. «Hva verktøyet gjør»
     2. «Slik fyller du ut»
     3. «Slik tolker du resultatene»
     4. «Iterativ vurdering»

3. **Disclaimer-note nederst**
   - En kort avsluttende paragraf i liten skrift (`text-xs text-muted-foreground`) med den nøyaktige teksten brukeren spesifiserte om at verktøyet ikke erstatter fullstendig risikovurdering.

### Fil
- `src/components/verktoy/TrafoEksplosjonTool.tsx`