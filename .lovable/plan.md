

## Mål
Fjerne "Stoffdata"-fanen fra dokumentgeneratoren for brannfarlig lagring, og flytte hele stoffkatalogen til en ny, egen seksjon i Eksempelkatalogen som oppslagsverk.

## Bakgrunn
I dag inneholder `/brensellagring` en fane "Stoffdata" der brukeren velger spesifikke stoffer (bensin, diesel, propan osv.) med tekniske data (flammepunkt, densitet, brennverdi, eksplosjonsgrenser). Dette blander oppslag med dokumentproduksjon. Det dokumentet faktisk trenger er kategoriene (Kat. 1, 2, 3, gass) og mengdegrensene – ikke detaljerte stoffdata.

## Endringer

### 1. Ny seksjon i Eksempelkatalogen: "Brannfarlige stoffer"
- Legg til et nytt kort i `src/pages/Eksempelkatalog.tsx` med ikon (FlaskConical / Droplet), tittel "Brannfarlige stoffer", beskrivelse "Oppslagsverk over vanlige brannfarlige væsker og gasser med tekniske data (flammepunkt, densitet, brennverdi, eksplosjonsgrenser m.m.) iht. GHS/CLP og DSB."
- Lenker til ny rute `/eksempelkatalog/brannfarlige-stoffer`.

### 2. Ny side: `src/pages/eksempelkatalog/BrannfarligeStoffer.tsx`
- Presenterer hele `STOFF_KATALOG` fra `src/lib/brensellagring-krav.ts` som et søkbart/filtrert oppslagsverk.
- Layout: kategorivalg (Kategori 1, 2, 3, Gass, Aerosoler) som filter-chips øverst + søkefelt på navn.
- Hvert stoff vises som et kort eller tabellrad med: navn, kategori, flammepunkt, densitet, nedre brennverdi, eksplosjonsgrenser, selvantennelsestemperatur.
- Liten infoboks øverst som forklarer kategoriinndelingen iht. CLP-forordningen.
- Bruker `AppHeader` (global) og samme visuelle stil som øvrige eksempelkatalog-sider.

### 3. Rydde opp i `src/pages/Brensellagring.tsx`
- Fjerne "Stoffdata"-`TabsTrigger` og tilhørende `TabsContent`-blokk.
- Fjerne all logikk knyttet til `selectedStoffIds` (state, persistens, dialoger for stoffvalg).
- Sett `defaultValue` / fallback for tabs til `"beliggenhet"` i stedet for `"stoffdata"`.
- Fjerne `isTabRelevant("stoffdata", …)`-grenen fra `isTabRelevant`-helperen.
- Oppdater info-stripen øverst slik at den ikke nevner "stoffdata" som alltid synlig.
- Legg inn en liten lenke/knapp ("Slå opp tekniske data for stoffer →") som peker til `/eksempelkatalog/brannfarlige-stoffer` slik at brukeren enkelt finner dataene hvis nødvendig.

### 4. Rydde opp i forhåndsvisning og eksport
- `src/components/brensellagring/BrensellagringPreview.tsx`: fjerne `selectedStoffIds`-prop og hele "Stoffdata"-seksjonen som rendres i dokumentet. Fjerne prop fra typedefinisjonen og alle steder den sendes inn.
- Hvis Word-eksport (`engagement-export.ts` eller tilsvarende for brensellagring) referer til stoffdata, fjernes det også.

### 5. Datafil
- `src/lib/brensellagring-krav.ts`: `STOFF_KATALOG` beholdes uendret (den brukes nå av eksempelkatalog-siden). Ingen sletting av data.

### 6. Ruting
- Legg til ny rute i `src/App.tsx`: `/eksempelkatalog/brannfarlige-stoffer` → `BrannfarligeStoffer`.

## Resultat
- Dokumentgeneratoren for brensellagring blir renere og fokuserer kun på det dokumentet trenger: kategorier, mengdegrenser og krav.
- Tekniske stoffdata flyttes til Eksempelkatalogen som et frittstående, søkbart oppslagsverk – tilgjengelig uavhengig av om man holder på med et dokument.
- Ingen data går tapt; bare reorganisert til riktig kontekst.

