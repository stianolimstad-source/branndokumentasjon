## Endring: Vis "mangler brannvegg/seksjonering"-avhukningen kun ved faktisk krav

I dag dukker checkboxen «Brannvegg/seksjoneringsvegg er ikke etablert i bygget» opp øverst i kap. 3.4 så snart dokumenttype er tilstandsvurdering. Den skal i stedet kun vises når regelverket faktisk **krever** brannvegg/seksjonering for det aktuelle bygget – avhengig av areal, brannteknisk tiltak og brannbelastning.

### Når skal feltet vises (krav-til-seksjonering)

Feltet vises når **minst ett** av punktene under er sant (og dokumenttype = tilstandsvurdering):

**BF85 – Skole** (Tabell 32:12)
- `getBF85BrannveggKravSkole(etasjer, areal, klasse)` returnerer `krevBrannvegg = true`.

**BF85 – Industri / Kraftstasjon / Kontor / Garasje / Lager** (Tabell 34:23)
- Bruker har valgt brannbelastning og tiltak, og `getBF85BrannveggKravKap34(areal, brannbelastning, tiltak)` returnerer `krevBrannvegg = true`.

**TEK17 (§ 11-7)**
- `erSykehusPleieinstitusjon` er huket av (RK6 – krav om vertikal seksjonering), **eller**
- areal > maks tillatt areal beregnet ut fra valgt `brannseksjonTiltak` + `brannseksjonBrannenergi` (samme logikk som «Brannseksjonering er påkrevd»-rød-boksen i dag, ca. linje 4811).

Hvis ingen av disse er oppfylt → feltet (og tilhørende kommentar/avviks-rød-boks) skjules helt. Da skal også `formData.manglerSeksjonering` resettes til `false` slik at vi ikke får et "spøkelses-avvik" i rapporten dersom forutsetningene endres.

### Inputside (`src/pages/Konsept.tsx`, kap. 3.4 ca. linje 4520–4561)

- Beregn `seksjoneringErPaakrevd` (boolean) like før blokken, basert på reglene over (gjenbruk eksisterende helpers og `seksjoneringsGrenser`-logikk).
- Wrappe checkboxblokken slik at den kun rendres når `documentType === "tilstandsvurdering" && seksjoneringErPaakrevd`.
- Legg til en `useEffect` som setter `manglerSeksjonering = false` og tømmer `manglerSeksjoneringKommentar` når `seksjoneringErPaakrevd` blir `false` (unngår at gammelt avhuket avvik henger igjen).

### Rapport / preview (`src/components/konsept/KonseptPreview.tsx`)

Ingen logikkendring – avviksraden vises fortsatt kun når `formData.manglerSeksjonering === true`. Siden inputsiden nå nullstiller flagget når det ikke er krav, faller raden naturlig bort i rapporten i de tilfellene.

### Hva endres ikke
- Selve kravberegningene (Skole-tabell, Tabell 34:23, TEK17 areal/tiltak/brannenergi) er uendret.
- Konseptmodus uendret (feltet vises bare i tilstandsvurdering, og kun ved krav).
- Word-eksport følger preview automatisk.
