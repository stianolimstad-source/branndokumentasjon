## Problem

Når man klikker på underseksjonene A–I i kapittel 3.6 (§11-9), hopper siden. Årsaken er at `SubSection`-komponenten er definert **inne i en IIFE inni render-funksjonen** i `src/pages/Konsept.tsx` (rundt linje 7691). 

Hver gang state endres (f.eks. `kap36Open`), opprettes `SubSection` som en *helt ny komponenttype*. React behandler det som en ny komponent og **unmount/remount-er hele undertreet** ved hvert klikk. Det forstyrrer Radix Collapsible-animasjonen, kan flytte fokus og forårsaker scroll-hopp.

## Løsning

Flytt `SubSection` ut av render-funksjonen til en stabil, modul-nivå komponent (på linje med `SectionCollapsible` øverst i filen).

### Endringer i `src/pages/Konsept.tsx`

1. **Definer `SubSection` på modulnivå** (rett etter `SectionCollapsible`, ca. linje 75):
   - Props: `id: string`, `title: string`, `open: boolean`, `onOpenChange: (o: boolean) => void`, `children: ReactNode`.
   - Samme markup som i dag (Collapsible m/ChevronDown).

2. **Fjern den inline-definerte `SubSection`** inne i IIFE-en rundt linje 7691–7705.

3. **Oppdater bruksstedene** (alle `<SubSection id="B" title="...">` osv. i 3.6-blokken) til å sende inn:
   - `open={!!kap36Open[id]}`
   - `onOpenChange={(o) => setKap36Open(prev => ({ ...prev, [id]: o }))}`

### Bonus (samme fil, valgfritt men anbefalt)

For å unngå at nettleseren scroller når Collapsible åpnes nederst på siden, ingen ekstra endringer kreves — selve hoppingen forsvinner når komponenten får stabil identitet.

## Filer som endres

- `src/pages/Konsept.tsx` (én komponent flyttes ut, ca. 15 linjer endret)

Ingen endringer i logikk, styling, Word-eksport eller andre filer.