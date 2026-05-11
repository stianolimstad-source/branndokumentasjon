## Mål
Legg til kraftstasjon-spesifikt avsnitt om **brannalarmanlegg i kraftforsyningsanlegg i fjell og under dagen** under kap. 3.9, kun for **tilstandsvurdering + BF85 + kraftstasjon**.

## Tekstinnhold (fra opplastet bilde)
Tittel-rad: **"Brannalarmanlegg – kraftstasjon"** (Ansvar: RIE)

Hovedtekst:
> Det skal være brannalarmanlegg i alle kraftforsyningsanlegg i fjell og under dagen (jf. FOBTOT § 2.1 jf. FEA-F § 25.3). Automatisk brannalarm skal installeres i alle rom i den delen av bygget hvor driftssentralen med tilbehør er installert. Denne skal også varsle eventuell hjemmevakt (jf. Beredskapsforskriften § 6.4, pkt. e).
>
> Vedlikehold og periodisk tilstandskontroll av brannalarmanlegg skal utføres av kvalifisert personell (kan ivaretas av egne ansatte som er kvalifisert for dette, for eksempel ved FG-godkjenning eller lignende).
>
> Konsekvensreduserende tiltak kan være:
> - Å montere brannalarmanlegg som varsler både personell som kan befinne seg i stasjonen og vaktpersonell på driftssentralen, samt eventuelt direkte til brannvesen.
> - Å koble brannalarmanlegget mot røyk- og brannspjeld samt dører/luker slik at spredning av røyk og brann unngås (se Ventilasjonsanlegg, kap. 3.7).

## Endringer

### 1. `src/lib/word-export-chapter3.ts` (rundt linje 1247–1292, kap. 3.9 kraftstasjon-blokk)
Legg til ny `contentRowMultiLine("Brannalarmanlegg – kraftstasjon", …, "RIE")` **først** i kraftstasjon-blokken, gated på:
```ts
documentType === "tilstandsvurdering" && formData.regelverk === "BF85" && erKraftstasjon39
```

### 2. `src/components/konsept/KonseptPreview.tsx` (rundt linje 3975–3990, der "Nødbelysning – kraftstasjon" rendres)
Speil samme rad i HTML-preview med samme gating (tilstandsvurdering + BF85 + kraftstasjon), slik at preview matcher Word-eksport.

### 3. `src/pages/Konsept.tsx` (KraftstasjonTilleggskravCard for 3.9, linje 8125–8141)
Utvid bullet-listen med en linje som forklarer at brannalarm-avsnittet inkluderes automatisk for tilstandsvurdering etter BF85 (synlig informativt for brukeren).

## Ingen endringer
- Ingen DB/skjema-endringer, ingen nye `formData`-felt.
- Eksisterende nødbelysning/redningsrom/transformatorrom-avsnitt berøres ikke.
- TEK17 og brannkonsept-modus får ikke det nye avsnittet (per brukers eksplisitte avgrensning).