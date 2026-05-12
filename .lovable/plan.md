## Tillegg: Brannceller over flere enn 3 plan – fravik

Når «Brannceller over flere plan er relevant» er huket av, skal det vises et oppfølgingsspørsmål om branncellen strekker seg over flere enn 3 plan. Hvis ja, vises en fravik-melding og det rapporteres som fravik i forhåndsvisningen / rapporten. Gjelder både brannkonsept og tilstandsvurdering, og både TEK17 og BF85.

### Bakgrunn

Hovedregel (TEK17 VTEK § 11-8 og tilsvarende i BF85): brannceller kan ha åpen forbindelse over inntil 3 plan. Flere plan er ikke en preakseptert ytelse og må dokumenteres som fravik.

### Endringer

**1. Datafelt (`src/pages/Konsept.tsx`, `formData`-initialisering)**
- Legg til `branncellerFlerePlanOver3: false` i samme initialisering som `branncellerFlerePlanRelevant`. Settes alltid tilbake til `false` når hovedchecken slås av (utvid `onCheckedChange` på linje 6635–6637).

**2. UI – under «Brannceller over flere plan er relevant»** (`src/pages/Konsept.tsx` linje 6641–6664, inne i `branncellerFlerePlanRelevant`-blokken, etter eksisterende RK-advarsel og før `<p>`-hjelpteksten):
- Ny checkbox: «Branncellen strekker seg over flere enn 3 plan».
- Når den er huket av, vis en rød fravik-boks (samme stil som linje 6649–6654):
  > ⚠ Obs: Preakseptert ytelse tillater åpen forbindelse over inntil 3 plan. Branncelle over flere enn 3 plan er ikke dekket av preakseptert ytelse og må dokumenteres som fravik.
- Tekstvariant for `formData.regelverk === "BF85"`:
  > ⚠ Obs: Hovedregel etter BF85 er åpen forbindelse over inntil 3 plan. Flere plan i samme branncelle må dokumenteres som fravik.

**3. Forhåndsvisning / rapport** (`src/components/konsept/KonseptPreview.tsx` linje 2766–2798)
- I «Brannceller over flere plan»-raden, etter eksisterende RK-fravik-blokker, legg til ny blokk vist når `formData.branncellerFlerePlanOver3` er true – samme rød `⚠ Fravik: …`-stil som de andre, med tekst tilsvarende UI-meldingen over (TEK17 / BF85-variant).

**4. Word-eksport**
- Sjekk `src/lib/word-export-chapter3.ts` for samme «Brannceller over flere plan»-rad og speile fravik-teksten der så Word-rapport blir konsistent med forhåndsvisning.

### Det som ikke endres

- Eksisterende RK 3 / RK 6-fravik-logikk beholdes uendret.
- Ingen endringer i datamodell på server, RLS, kapittel 3-paneler eller andre seksjoner.
- Tilstandsvurdering-flyten gjenbruker samme komponent (Konsept.tsx) – ingen separate endringer trengs.
