## Mål
Legge til en ny underseksjon "Redningsrom" i kap. 3.9 for kraftstasjoner (både brannkonsept og tilstandsvurdering, BF85 og TEK17). Innholdet baseres på FEA-F § 26 og dekker plassering, utforming og utstyr.

## Hvor
Vises kun når bygningstype/bygningsdel = "Kraftstasjon", direkte under den eksisterende "Nødbelysning – kraftstasjon"-raden i kap. 3.9.

## Innhold som legges inn
**Innledning (4.3.4 Redningsrom):**
> I kraft-, transformator- og omformerstasjoner i fjell og under dagen hvor det ikke er anordnet minst to uavhengige rømningsveier, skal det være innredet redningsrom. I store kraftstasjoner og/eller når forholdene ligger til rette for det, bør det innredes ett eller flere redningsrom (jf. FEA-F § 26).
>
> Redningsrommet må være et reelt alternativ til hovedrømningsvei, det forutsettes derfor at selskapet nøye vurderer plassering og utforming.

**Plassering:**
> Redningsrommene gis en hensiktsmessig og sikker plassering i forhold til mulige skadesteder, og fortrinnsvis slik at det er tilfredsstillende adkomst med skadet personell på båre.
>
> Plassering i forhold til transformatorer og koblingsanlegg bør veie tungt i vurderingen ved valg av plassering av redningsrom.

**Utforming:**
> Redningsrom skal være røyktett og egen branncelle, og utformet slik at det er intakt etter en eksplosjon (jf. FEA-F § 26).
>
> For å minimere personellets eksponering for røyk og gasser, anbefales det å alltid ha døren til redningsrommet lukket, eventuelt med selvlukkende dør koblet til brannalarmanlegget.

**Utstyr:**
Redningsrommene (jf. FEA-F § 26) skal være utstyrt med:
- Luftbeholdning som dekker minst 4 timers forbruk for det antall personer som rommet er dimensjonert for. Det skal tas hensyn til lokale forhold som lengde på adkomsttunnel, rommets plassering i stasjonen, forventet tid før hjelp når frem mv.
- Førstehjelpsutstyr og båre
- Samband til utenforliggende bemannet vaktsted (f.eks. driftssentral) og til inngangen/portalbygg. Sambandsmidlene skal være uavhengig av stasjonsstrømforsyningen og må være beskyttet mot skade fra brann, overspenning mv.

## Toggle/styring
Innledningen ("I kraft-, transformator- og omformerstasjoner i fjell og under dagen…") vises kun når `kraftstasjonUnderFjell` er huket av (samme logikk som FEA-F § 26-setningen for nødbelysning). Plassering, Utforming og Utstyr vises alltid for kraftstasjoner (gjelder også større stasjoner over bakken), tilsvarende dagens FEA-F § 25-tekst.

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (rundt linje 3816–3834)
Legge til en ny `<tr>` rett etter "Nødbelysning – kraftstasjon"-raden:
- Forhold-celle: "Redningsrom – kraftstasjon"
- Løsning-celle: underoverskrifter (Plassering / Utforming / Utstyr) i fet skrift, avsnittene over som `<p>` og utstyrslisten som `<ul>`. Innledningsavsnittene rendres betinget på `formData.kraftstasjonUnderFjell`.
- Ansvar-celle: "RIE" (samme som nødbelysning-raden)

### `src/lib/word-export-chapter3.ts` (rundt linje 1177–1188)
Like under den eksisterende kraftstasjon-blokken legges en ny `contentRowMultiLine("Redningsrom – kraftstasjon", lines, "RIE")` der `lines` bygges på samme måte: innledningstekst kun hvis `kraftstasjonUnderFjell`, deretter plassering/utforming/utstyr (med tomme strenger som avsnittsskille og bullets prefikset med "• " for konsistens med øvrige multi-line rader).

### Hjelpetekst i `src/pages/Konsept.tsx` (linje ~3120)
Oppdatere eksisterende info-tekst under togglen så den også nevner at FEA-F § 26-innledningen til Redningsrom inkluderes når togglen er på, mens Plassering/Utforming/Utstyr alltid tas med.

Ingen endringer i datamodell – gjenbruker `formData.kraftstasjonUnderFjell`.