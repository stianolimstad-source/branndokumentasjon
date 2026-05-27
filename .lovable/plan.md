## Mål

Legg til hjelpetekst-tooltips på alle input-felt i `src/components/verktoy/TrafoEksplosjonTool.tsx`. Tooltipen åpnes ved hover/klikk på et `HelpCircle`-ikon plassert til høyre for hver `Label`.

## Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. Legg til `HelpCircle` i lucide-react-importen.

2. Lag en liten lokal hjelpekomponent `LabelWithHelp` øverst i filen (utenfor `TrafoEksplosjonTool`):

```tsx
const LabelWithHelp = ({ label, help, className }: { label: string; help: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
    <Label>{label}</Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex" aria-label="Hjelp">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{help}</TooltipContent>
    </Tooltip>
  </div>
);
```

`help` blir et JSX-fragment med tre korte avsnitt — «Spør kunden om:», «Typiske verdier:», og evt. «Hvor finne det:» — hver med en `<strong>`-prefiks.

3. Definer en konstant `HELP` med JSX for hvert felt (oljevolum, tanktype, oljetype, spenning, effekt, buenergi, tankkapasitet, plassering, avstand_personell, avstand_maskinhall, basseng_areal, ik, ubue, tklar, alder, dga_maaneder, overlast). Innholdet hentes ordrett fra brukerens tekster.

4. Pakk hele input-grid i én `<TooltipProvider delayDuration={200}>` (siden ikke alle steder allerede har en provider rundt seg — det finnes lokale providers i Scenario/Manuell-fanene, men nested providers er trygt).

5. Erstatt hver `<Label>...</Label>` for input-feltene med `<LabelWithHelp label="..." help={HELP.felt} />`. Felt som får hjelp:

   - Trafo og olje-kortet: Oljevolum, Tanktype, Oljetype, Spenning, Effekt, Buenergi (på selve "Buenergi"-labelen øverst i seksjonen), Tankkapasitet elastisk.
   - Kortslutnings-fanen (under Buenergi): I_k, U_bue, t_klar.
   - Plassering-kortet: Plassering, Avstand personell, Avstand maskinhall, Oljegruve/bassengareal.
   - Driftstilstand-kortet: Alder, Måneder siden DGA, Overlast (her står label-teksten ved siden av checkboxen; legg HelpCircle inline etter teksten).

6. For Buenergi-labelen som allerede er i en `flex items-center justify-between`-rad: bytt ut `<Label>Buenergi</Label>` med `<LabelWithHelp label="Buenergi" help={HELP.buenergi} />` slik at "Brukes: X MJ" fortsatt står til høyre.

7. For checkboxen "Trafoen har hatt historisk overlast utover skiltverdi": legg `<HelpCircle>` med tooltip rett etter teksten i samme label-rad.

8. Tankkapasitet-feltet beholder eksisterende «Beregn automatisk»-knapp; `LabelWithHelp` settes inn på venstresiden av flex-raden.

## Tekstinnhold

Innholdet er en 1:1-overføring av brukerens tekster, med tre seksjoner per tooltip der det er relevant. Hver seksjon vises som en kort linje med en fet ledetekst, f.eks.:

```
Spør kunden om: typeskilt eller produsentens datablad.
Typiske verdier: småkraft 2 000–10 000 L, regionalt anlegg 15 000–40 000 L, ...
Hvor finne det: står ofte angitt på typeskiltet som «Oil weight» (kg) – del på 0,88 for å få liter.
```

For felter uten en naturlig «Hvor finne det» (f.eks. Plassering, Avstand til personell, Buespenning) brukes bare de to første seksjonene, eller hele teksten settes som én forklarende seksjon der det passer bedre (Tanktype, Buespenning, Klareringstid, Overlast).

## Filer

- `src/components/verktoy/TrafoEksplosjonTool.tsx` (eneste fil som endres)
