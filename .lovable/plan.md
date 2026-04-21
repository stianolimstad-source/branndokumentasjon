

## Mål
Rydde opp i "Lagring i bygning"-seksjonen slik at det ikke er dobbelt opp med samme informasjon, og vise DSB sin originale tabell direkte når **Salgslokale** velges som bygningstype.

## Problem i dag
- "Tillatte mengder – Salgslokale" viser samme tall som "Stykkgods – mengdegrenser etter areal".
- Stykkgodstabellen ligger i en separat collapsible som er løsrevet fra bygningstypevalget.
- Resultatet oppleves rotete og redundant.

## Løsning

### 1. Bytt ut tabellen for salgslokale med DSB sin originale tabellstruktur
Når `valgtBygningstype === "salgslokale"`:
- Fjerne "Tillatte mengder – Salgslokale"-kortet (det med "Aerosoler / Propan / Kat 1&2 / Kat 3" som separate rader).
- I stedet vise **én tabell som speiler DSB-veiledningen** med kolonner:
  
  ```text
  | Salgslokalets areal | Aerosoler | Brannfarlig gass | Br.f. væske kat 1 og 2 | Br.f. væske kat 3 |
  | < 200 m²            | 50 L      | 60 L (25,2 kg)   | 50 L                   | 250 L             |
  | 200 – 1 000 m²      | 100 L     | 60 L (25,2 kg)   | 250 L                  | 500 L             |
  | > 1 000 m²          | 200 L     | 60 L (25,2 kg)   | 250 L                  | 1 000 L           |
  ```
- Tittel: "Største tillatte mengder i salgslokaler – DSB Temaveiledning Kap. 3".
- Beholde input-felt for areal, og uthev (highlight) den raden som matcher det innskrevne arealet.
- Kildehenvisning: DSB Temaveiledning Kap. 3.

### 2. Fjerne den separate collapsiblen "Stykkgods – mengdegrenser etter areal"
Den er ikke lenger nødvendig som egen seksjon når salgslokale-tabellen gjør samme jobb. Stykkgodsdata er allerede i `STYKKGODS_GRENSER`, denne brukes nå direkte i salgslokale-tabellen.

### 3. For andre bygningstyper (bolig, garasje, fyrrom osv.)
- Beholde nåværende "Tillatte mengder"-tabell uendret – den er meningsfull der mengdegrensene er én verdi per brensel og ikke arealavhengige.
- Fjerne den separate stykkgods-collapsiblen (den hører ikke hjemme her – stykkgods gjelder primært salgs-/lagerlokaler).

### 4. Konstruksjonskrav ("Vis krav"-knappen)
Beholdes uendret for begge tilfeller – men for salgslokale knyttes den til hver radkategori (aerosoler, gass, kat 1&2, kat 3) via en "Vis krav"-knapp på hver kolonneoverskrift eller en utvidbar rad under tabellen.

## Filer som endres
- `src/pages/Brensellagring.tsx` – bytte ut blokken på linje 949–1134 (Lagring i bygning-seksjonen):
  - Conditional render: `valgtBygningstype === "salgslokale"` → DSB-tabell (én bred tabell med areal-kolonner).
  - Ellers → eksisterende `valgtBygg.grenser`-tabell.
  - Fjerne `<Collapsible>` for stykkgods (linjene 1063–1134) – data flyttes inn i salgslokale-tabellen.
- Ingen endringer i `src/lib/brensellagring-krav.ts` – `STYKKGODS_GRENSER` brukes som datakilde.
- Ingen endringer i `BrensellagringPreview.tsx` (rapporten).

## Resultat
Ved valg av Salgslokale ser brukeren én klar tabell identisk med DSB-veiledningens layout. Ingen duplisering. For øvrige bygningstyper er grensesnittet ryddet ved at den irrelevante stykkgods-seksjonen er fjernet.

