## Endringsplan: Referanseverdier-tabell i veiledningen

### Fil: `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. **Importer Table-komponenter**
   Legg til import av `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell` fra `@/components/ui/table`.

2. **Legg til ny seksjon i veiledningen**
   Sett inn en ny `<section>` rett før den avsluttende `<p className="text-xs text-muted-foreground pt-2 border-t">`-noten i `AccordionContent`.

   Seksjonen inneholder:
   - Overskrift: `<h4>Referanseverdier – typiske norske vannkraftstasjoner</h4>`
   - En `Table` med følgende kolonner: **Anleggstype**, **Effekt**, **Spenning HV**, **Oljevolum**, **Kortslutningsstrøm I_k**, **Buenergi typisk worst case**
   - 4 datarader:
     - Småkraft (mindre enn 10 MW): 1–15 MVA / 22 eller 66 kV / 2 000–10 000 L / 5–15 kA / 0,5–3 MJ
     - Mellomstor stasjon (10–100 MW): 15–150 MVA / 66 eller 132 kV / 10 000–30 000 L / 15–30 kA / 2–8 MJ
     - Stort kraftverk (100–300 MW): 150–300 MVA / 132 eller 300 kV / 30 000–70 000 L / 30–50 kA / 5–15 MJ
     - Storkraftverk (over 300 MW): 300–1100 MVA / 300 eller 420 kV / 50 000–100 000 L / 40–60 kA / 10–25 MJ
   - Under tabellen: Kommentarparagraf med teksten: «Tallene er typiske intervaller for nye/moderne norske anlegg. Eldre trafoer kan ha vesentlig høyere buenergi-eksponering på grunn av langsommere reléinnstillinger og lavere kortslutningsbidrag fra nettet. Sjekk konkrete prosjektverdier mot leverandør og nettselskap.»

### Tekniske detaljer
- Bruker eksisterende shadcn/ui `Table`-komponent som allerede finnes i prosjektet (`src/components/ui/table.tsx`).
- Ingen endringer i logikk, beregninger eller datastrukturer – ren presentasjonsendring.
- Tabellen plasseres som siste seksjon i veiledningen, før den avsluttende noten.