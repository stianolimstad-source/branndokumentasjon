## Problem
I BF85-modus i kap. 3.5 viser rapporten kun den gamle TEK17-teksten ("1. Trapperom som er rømningsvei…") selv etter at BF85 §78-sjekkboksen er huket av.

## Årsak
I `src/components/konsept/KonseptPreview.tsx` (linjene 2700–2728) sjekkes `formData.roykKontrollKravTekst` (fritekst) først. Hvis den har innhold rendres den teksten — uavhengig av regelverk eller om BF85-sjekkboksen er på. Dokumenter som tidligere har vært i TEK17-modus har auto-utfylt fritekst med TEK17-rømningsveitekst (se Konsept.tsx linje 6300–6302), så ved bytte til BF85 blir den gamle teksten "låst" inn.

## Løsning
I `src/components/konsept/KonseptPreview.tsx`, i kap. 3.5 røykkontroll-blokken (rundt linje 2700–2759):

1. Når `isBF85` er `true`, ignorer `roykKontrollKravTekst`-grenen helt.
2. I stedet:
   - Hvis `bf85_royk_brannventilasjon` er huket av → vis dedikert rad med Forhold = "Brannventilasjon (Røykventilasjon)", Løsning = den fulle BF85-teksten ("For bygninger med inntil 8 etasjer …"), Ansvar = "ARK/RIV".
   - Hvis ikke huket av og `etasjer > 2` → vis avviks-raden (eksisterer allerede).
   - Hvis ikke huket av og `etasjer ≤ 2` → ingen rad.
3. La fritekst-grenen være som før for ikke-BF85.

Ingen endringer i input-siden (`Konsept.tsx`) eller Word-eksport. Sjekkboks og avvik-melding der virker allerede.

## Tekniske detaljer
- Endring isolert til én preview-blokk; ingen state-mutasjon eller migrering.
- Bruker eksisterende `bf85_royk_brannventilasjon`-flagg i `roykKontrollKrav`-arrayen.
- Påvirker kun `/tilstandsvurdering` med BF85; TEK17-konsept uendret.
