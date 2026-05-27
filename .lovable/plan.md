## Sjekkliste-accordion for kundeinformasjon

### Fil: `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. **Legg til ny `AccordionItem value="sjekkliste"`** rett etter `kilder`-elementet (linje 927), inne i samme `Accordion`.

2. **Innhold:** Tittel "Sjekkliste – informasjon å innhente fra kunde". Innholdet skal inneholde:
   - En `id="trafo-sjekkliste"` wrapper rundt selve listen for print-targeting.
   - En "Skriv ut sjekkliste"-knapp øverst til høyre (`Button variant="outline" size="sm"` med `Printer`-ikon fra lucide-react) som kaller `window.print()`.
   - Fem seksjoner, hver med `<h4>` som inneholder `CheckCircle2 className="h-4 w-4 text-green-600"` + tittel, etterfulgt av `<ul className="list-disc pl-6 text-sm">`-punkter:
     - **Trafo og olje:** Typeskilt/datablad. Oljevolum (L/kg), tanktype (conservator/hermetisk/corrugated), oljetype (mineral/ester), nominell spenning HV og LV, nominell effekt MVA, idriftsettingsår, tankens trykkbestandighet hvis testet.
     - **Elektrisk og vern:** Kortslutningsstrøm I_k på begge spenningssider, oversikt over installert vern (Bucholtz, differensialvern 87T, jordfeilvern), målte klareringstider for primær-/reservevern, siste relévern-koordinering.
     - **Plassering og geometri:** Plassering innendørs/utendørs, avstand til personellsone, avstand til maskinhall/verdifull bygning, oljegruvens areal og dybde, ventilasjon (hvis innendørs).
     - **Brannteknisk:** Eksisterende brannmurer (EI-klasse), aktivt slokkesystem (deluge/vannspray/vanntåke), oljeavskiller i avløp, brannvarslingsanlegg, deteksjon (Bucholtz, røyk, varme).
     - **Drift og tilstand:** Driftsalder, lasthistorikk (kontinuerlig overlast?), siste DGA-analyse (dato/resultat), siste hovedrevisjon, oljebehandling/regenerering, kjente feilmodi/historikk.

3. **Print-stylesheet:** Legg til en `<style>`-tag innenfor accordion-innholdet (eller helst en globalt scoped `media="print"`-blokk) som skjuler alle elementer unntatt `#trafo-sjekkliste`:
   ```css
   @media print {
     body * { visibility: hidden; }
     #trafo-sjekkliste, #trafo-sjekkliste * { visibility: visible; }
     #trafo-sjekkliste { position: absolute; left: 0; top: 0; width: 100%; }
     .no-print { display: none !important; }
   }
   ```
   Print-knappen får klasse `no-print`. Stylesheet plasseres som en lokal `<style>`-tag inne i komponenten.

4. **Imports:** Legg til `Printer` i lucide-react-importen ved siden av `CheckCircle2` (allerede importert).

### Tekniske detaljer
- Ren presentasjonsendring, ingen state eller beregningslogikk.
- `window.print()` kalles direkte på knappklikk.
- Print-CSS scoped via `@media print` så det ikke påvirker normal visning.