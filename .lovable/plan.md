## Plan: Auto-beregning av tankkapasitet i TrafoEksplosjonTool

### Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. **Ny auto-beregningslogikk** for tankkapasitet:
   - `E = oljevolum_L / 1000 * 0.2` (MJ) — grunnverdi i kubikkmeter
   - Multipliser med tanktype-faktor:
     - `conservator` → 1,0
     - `corrugated` → 0,85
     - `hermetic` → 0,70
   - Multipliser med spenningsfaktor:
     - `spenning_kV > 220` → 1,3
     - `132 <= spenning_kV <= 220` → 1,0
     - `spenning_kV < 132` → 0,8
   - Minimumsverdi: 1,0 MJ

2. **State-håndtering**:
   - Lag en `useEffect` som oppdaterer `input.tankkapasitet_MJ` automatisk når `oljevolum_L`, `tanktype` eller `spenning_kV` endres.
   - Legg til et flagg `tankkapManuellOverstyrt` (boolean) som settes til `true` når brukeren manuelt endrer tankkapasitet-feltet, slik at auto-beregningen stopper å overskrive brukerens verdi.

3. **UI-endringer i tankkapasitet-feltet (linje 232-234)**:
   - Legg en «Beregn automatisk»-knapp ved siden av input-feltet. Knappen setter `tankkapManuellOverstyrt = false` og oppdaterer feltet til den beregnede verdien.
   - Legg til hjelpetekst under feltet: «Auto-beregnet fra oljevolum, tanktype og spenning. Overstyr hvis trafoleverandøren har testet høyere kapasitet.»
   - Input-feltet forblir redigerbart som i dag.

4. **Default-verdi**:
   - `defaultInput.tankkapasitet_MJ` fjernes eller settes til `null`/undefined; verdien populeres i stedet av `useEffect` ved første render.

### Tekniske detaljer
- Funksjon for beregning: `beregnTankkapasitet(oljevolum_L, tanktype, spenning_kV) => number`
- Ingen endringer i `trafo-eksplosjon.ts` (beregningslogikken bruker allerede `input.tankkapasitet_MJ`).
- Ingen endringer i routing, API-kall eller andre komponenter.