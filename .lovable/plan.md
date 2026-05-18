## Mål
Legg til en «Generer tekst»-knapp i ROS-analyse under seksjon 1. Innledning som fyller inn standardtekst for Bakgrunn og Formål. Teksten er fortsatt fullt redigerbar etterpå.

## Tilnærming
Bruk lokal mal-tekst (ikke AI-kall) — gir umiddelbar respons og en konsistent, profesjonell standardtekst som beskriver hva en ROS-analyse er og hvorfor den utføres. Metadata (prosjektnavn/adresse) flettes inn der det finnes.

## Endring i `src/pages/RosAnalyse.tsx`

1. Legg til to hjelpefunksjoner som returnerer standardtekst:
   - `generateBakgrunn(meta)` — beskriver at ROS-analysen utføres for å kartlegge brannrisiko ved [prosjektnavn/adresse], i tråd med plan- og bygningsloven, brann- og eksplosjonsvernloven og internkontrollforskriften.
   - `generateFormal(meta)` — beskriver formålet: identifisere uønskede hendelser, vurdere sannsynlighet og konsekvens, og foreslå risikoreduserende tiltak slik at akseptabelt sikkerhetsnivå oppnås.

2. Utvid `Area`-komponenten (eller wrap den i seksjonen) slik at felt-overskriften kan ha en liten «Generer tekst»-knapp (Sparkles-ikon) til høyre. Klikk setter feltverdien til generert tekst — men bekrefter overskriving hvis feltet allerede har innhold (enkel `window.confirm("Erstatt eksisterende tekst?")`).

3. Legg knappene på Bakgrunn og Formål i seksjon 1. Innledning (linje 388–391).

## Verifisering
- Åpne en ROS-analyse → klikk «Generer tekst» ved Bakgrunn → standardtekst fylles inn.
- Tekstområdet er fortsatt redigerbart.
- Klikk igjen når feltet har innhold → bekreftelse vises før overskriving.
- Tilsvarende for Formål.
