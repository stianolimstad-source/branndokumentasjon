## Mål
Lage et nytt beregningsverktøy under `/verktoy` som hjelper bruker å vurdere størrelsen og konsekvensen av en eksplosjon i en oljefylt krafttrafo (typisk vannkraftstasjon), og som anbefaler barrierer for å oppnå best mulig utfall. Baseres på fagnotatet (CIGRE TB 537, NFPA 850, IEEE 979, EN 61936-1/NEK 440, PLOS One / ASME 2022).

## Plassering og navigasjon
- Ny rute: `/verktoy/trafoeksplosjon`
- Ny side: `src/pages/verktoy/Trafoeksplosjon.tsx`
- Nytt kort i `src/pages/Verktoy.tsx` med ikon `Zap` eller `AlertTriangle`, tittel "Trafoeksplosjon", beskrivelse "Vurder eksplosjonsenergi, trykkbølge, fragmenter og brann i oljefylt krafttrafo".
- Rute registreres i `src/App.tsx`.
- Markeres som `locked: true` (krever fullt abonnement) på lik linje med Brannsimulering — fordi dette er et nytt avansert verktøy. (Kan justeres hvis du vil ha det åpent.)

## Inndata (skjema)
Felt brukeren fyller inn — gruppert i kort:

**Trafo / olje**
- Oljevolum (L)
- Tanktype: corrugated / conservator / hermetic
- Spenningsnivå (kV) og merkeeffekt (MVA) — informativt
- Estimert buenergi (MJ) — med hjelp/forhåndsvalg: 0,65 / 1,28 / 2,64 / 5 / 6,3 / 17,3 (fra testene i notatet)
- Tankkapasitet elastisk (MJ) — default 5

**Plassering**
- Innendørs / utendørs
- Avstand til nærmeste personell-/utstyrsrom (m)
- Avstand til maskinhall/kontrollbygg (m)
- Oljegruve-/bassengareal (m²) — for pølbrann

**Eksisterende barrierer (checkboxer)**
- Bucholtz-vern, differensialvern, DGA, temperaturovervåking
- Bristeskive (pressure relief valve)
- Aktivt trykkavlastningssystem (Sergi TP / ABB TXpand)
- Brannmur EI60 / EI120 / EI240
- Deluge / vannspray / høytrykks vanntåke
- Oljegruve med oljeavskiller
- Avstand iht. NFPA 850 / IEEE 979 / NEK 440

## Beregninger
Implementeres i `src/lib/trafo-eksplosjon.ts`:

1. **Gassproduksjon**: V_gass [L] = buenergi [kJ] × 0,08 (midtverdi 60–100 cm³/kJ).
2. **Tankvurdering**: sammenlign buenergi mot elastisk kapasitet → status OK / risiko for deformasjon / sannsynlig brudd.
3. **Trykkbølge — strukturskadesannsynlighet** ved oppgitt avstand. Bruk forenklet interpolasjon basert på case (80 kPa innendørs, 100 % skade ≤20 m, 50 % ≤78 m, avtagende), kalibrert mot buenergi.
4. **Fragmenter**: vis "trygg sone" og "vurderingssone" basert på 1,1 m³-data — 80–90 % innenfor ~115 m, ytterpunkt ~430 m, ekstremt ~860 m / >1 km. Markér om kontrollrom/maskinhall ligger innenfor.
5. **Pølbrann**:
   - Pølediameter D fra oppgitt bassengareal.
   - Masseavbrenningsrate m″ ≈ 0,015 kg/(m²·s) (modnet pølbrann).
   - Total varmeavgivelse Q = m″ · A · ΔH_c (ΔH_c ≈ 42 MJ/kg).
   - Stråling q″ ved avstand r via punktkilde / Solid Flame-forenkling (gjenbruk logikk fra `src/components/verktoy/Punktkilde.tsx` / `SolidFlamme.tsx`).
   - Klassifiser mot terskler 1,58 / 4,7 / 12,5 kW/m².
6. **BLEVE-sjekk** (worst case): markér 140 m fatal-sone hvis hele oljemengden går til fyrball.
7. **Sannsynlighet/levetid**: vis CIGRE-tall (0,1 %/år, ~4 % over 40 år).

## Resultat / utfall (output)
- Statuskort per kategori (trykkbølge, fragmenter, oljebrann, BLEVE) med fargekoding (gjenbruk mønster fra `StralingResultat.tsx` — grønn/gul/rød).
- Avstandsdiagram: enkel SVG-skala med trafo i sentrum, sonene 20/78/115/140/430 m markert sammen med brukerens oppgitte avstander.
- "Barriereanbefalinger"-panel: dynamisk liste som krysser av eksisterende barrierer og foreslår manglende (basert på beregnet alvorlighet og standarder NFPA 850 / IEEE 979 / NEK 440).
- "Hendelsesstige"-visualisering (1–5) fra fagnotatet kap. 7.
- Kilde-/referansefot med CIGRE TB 537, NFPA 850, IEEE 979, EN 61936-1, PLOS One 2015, ASME 2022.

## Filer som opprettes / endres
- `src/pages/verktoy/Trafoeksplosjon.tsx` (ny side med PageHeader + komponenten)
- `src/components/verktoy/TrafoEksplosjonTool.tsx` (hovedkomponent: skjema + resultat)
- `src/components/verktoy/trafo/TrafoInputs.tsx` (skjema-seksjon)
- `src/components/verktoy/trafo/TrafoResultat.tsx` (resultatkort + soneskisse)
- `src/components/verktoy/trafo/BarriereAnbefalinger.tsx`
- `src/lib/trafo-eksplosjon.ts` (rene beregningsfunksjoner + terskler/konstanter)
- `src/lib/trafo-cases.ts` (caseliste fra notatet — vises i en "Referansecases"-accordion)
- `src/App.tsx` (ny rute)
- `src/pages/Verktoy.tsx` (nytt kort)

## Bevisst utenfor scope (denne iterasjonen)
- Word-/PDF-eksport av rapport.
- Integrasjon mot fravik-/konsept-dokumenter.
- Avansert CFD/FEM-modellering — vi bruker forenklede ingeniørformler med tydelig kildehenvisning og forbehold om at verdiene må verifiseres mot primærkilder.

Si fra hvis du vil at verktøyet skal være åpent (ikke låst bak fullt abonnement), eller om noe i input/output-listen skal endres før vi bygger.