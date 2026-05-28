# TEK17 §11-2 / §11-3 – korrigeringer og utvidelser i Konsept.tsx

Alle endringer gjøres i `src/pages/Konsept.tsx`.

## 1. Rettelser i `bygningsTypeRisikoklasseMap`

- Fjern oppføringen `"Fritidshjem": "RK3"` (linje 102). RK3 skal kun inneholde Barnehage og Skole.
- Rename nøkkel `"Trafikkterminaler"` → `"Trafikkterminal"` (RK5, linje 123).
- Rename nøkkel `"Forlegning og leirskole"` → `"Feriekoloni og leirskole"` (RK6, linje 130).
- `"Kraftstasjon": "RK2"` beholdes uendret.

## 2. Nytt felt for §11-3 nr. 8 (særlig konsekvens / BKL4)

I `formData`-initialiseringen legges til:

- `saerligKonsekvensBKL4: false`
- `risikoklasseManuell: ""` (om brukeren har valgt manuelt)
- `risikoklasseBegrunnelse: ""`

## 3. Brannklasse-logikk

I `useEffect`-en som beregner brannklasse (rundt linje 905):

- Hvis `saerligKonsekvensBKL4 === true`: sett `brannklasse: "BKL4"`, `brannklasseUnntak: ""`, og lagre den tabellberegnede verdien i et nytt felt `brannklasseTabellReferanse` for visning.
- Ellers: dagens logikk.
- Legg `formData.saerligKonsekvensBKL4` til dependency-arrayen.

## 4. UI i kapittel 2 – under brannklasse-feltet

Rett under eksisterende brannklasse-visning/redigering:

- **Checkbox** med label «Brann kan medføre særlig stor konsekvens (BKL4)».
- Under: `text-xs text-muted-foreground` med veiledningsteksten (mer enn 16 etasjer, kritisk infrastruktur, byggverk under terreng, kjemisk industri, særlig farlige stoffer; må dokumenteres ved analyse iht. § 11-3).
- Når avhuket:
  - Brannklasse-feltet vises som låst på «BKL4» (disabled), med liten referansetekst: «Tabellverdi: {brannklasseTabellReferanse}».
  - Vis gul `<Alert variant="warning">` med teksten fra brukerforespørselen om at preaksepterte ytelser ikke dekker BKL4 fullt ut, inkl. punkt a–d.

## 5. UI i risikoklasse-seksjonen – manuell RK-dialog

Under RK-select:

- Oppdater hjelpetekst til: «Velg fra listen, eller bruk knappen under hvis bygget ikke er listet. Etter §11-2 må slike tilfeller plasseres etter begrunnet og dokumentert vurdering.»
- Ny knapp (variant `link` eller `outline` sm): «Bygget mitt finnes ikke i listen» som åpner en `Dialog`.

Dialogens innhold:

- Tittel: «Manuell plassering i risikoklasse (§11-2)».
- Informasjonsblokk med §11-2 sine fire kriteriespørsmål som hjelp (kun visuelt – ikke validerende):
  1. Er personopphold kun sporadisk?
  2. Kjenner personer rømningsforholdene?
  3. Er byggverket beregnet for overnatting?
  4. Er det forutsatt liten brannenergi/-fare?
  Hvert som radio «Ja / Nei / Vet ikke» (kun støtte for vurdering, lagres ikke).
- `Select` for RK1–RK6 (binder til `risikoklasseManuell`).
- `Textarea` for begrunnelse (binder til `risikoklasseBegrunnelse`, required).
- Knapper: Avbryt / Lagre. Ved lagring settes `formData.risikoklasse` til valgt RK, og `risikoklasseBegrunnelse` lagres i metadata.

Når `risikoklasseBegrunnelse` er satt, vises en liten badge/note under RK-select: «Manuelt plassert – se begrunnelse» med tooltip/expand.

## 6. Persistens

`risikoklasseBegrunnelse` og `saerligKonsekvensBKL4` inkluderes automatisk når hele `formData` lagres (samme mekanisme som øvrige metadatafelt). Ingen DB-migrasjon nødvendig – `fire_concepts.data` er JSONB.

## Filer

- `src/pages/Konsept.tsx` (eneste fil som endres).
