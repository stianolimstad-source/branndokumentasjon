## Endring i `src/lib/ros-word-export.ts`

Legg vedlagte beregninger inn i Word-eksporten under hver hendelse i kap. 3-tabellen.

### Steg

1. **Utvid `text`-hjelperen** (linje 101–102) til å støtte `italics?: boolean` slik at kommentaren kan rendres i kursiv. Bakoverkompatibelt.

2. **Lokal label-map** like før kap. 3-blokken:
   ```ts
   const BEREGNING_LABELS: Record<string, string> = {
     straling: "Strålingsberegning",
     flammehoyde: "Flammehøyde",
     brannenergi: "Brannenergi",
     persontall: "Persontallsberegning",
     omhyllingsflate: "Omhyllingsflate",
     brannmotstand: "Brannmotstand",
     trafoeksplosjon: "Trafoeksplosjon",
   };
   ```

3. **Hjelpefunksjon `buildBeregningerBlock(beregninger)`** som returnerer `(Paragraph | Table)[]`:
   - H4-paragraf: `new Paragraph({ heading: HeadingLevel.HEADING_4, children: [text("Beregningsgrunnlag", { bold: true, size: 18 })] })`.
   - For hver beregning:
     - Paragraph med fet tekst `"{BEREGNING_LABELS[type] ?? type} – {label}"` (size 16).
     - To-kolonners `Table` (`WidthType.PERCENTAGE`, 100 %) som bruker eksisterende `smallHeader`/`smallCell`-mønster: header `Parameter` (30 %) / `Verdi` (70 %), deretter én rad per `Object.entries(b.results)` med nøkkel formattert via `replace(/_/g, " ")` og verdi som `String(v)`.
     - Hvis `b.kommentar?.trim()`: én paragraf «Kommentar:» (fet, size 16) og én paragraf med kommentaren i kursiv (`italics: true`, size 16).
   - Avsluttende tom paragraph for luft.

4. **Legg inn etter hendelsesraden** (rundt linje 482, inne i `content.hendelser.forEach`): hvis `h.beregninger && h.beregninger.length > 0`, push en ekstra `TableRow` med én `TableCell` som har `columnSpan: 15` og `children: buildBeregningerBlock(h.beregninger)`. Dette holder beregningene logisk koblet til hendelsen, mellom restrisiko-feltet og neste hendelse.

5. Ingen andre filer berøres. Stil og font følger eksisterende `font`/`theme`/`tableHeaderShading`-mønster fra kap. 3.
