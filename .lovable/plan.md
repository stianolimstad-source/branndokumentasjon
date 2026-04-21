

## Mål
Gjøre fane-grensesnittet i "Lagring av brannfarlig stoff" mindre og mer relevant ved å skjule faner og kort som ikke gjelder valgt bygningstype. Generelle krav som gjelder alle bygg vises alltid.

## Relevans-matrise per bygningstype

| Fane / kort | Bolig | Garasje | Salgslokale | Forretning | Verksted | Fyrrom | Tankrom | Lager |
|---|---|---|---|---|---|---|---|---|
| **Stoffdata** (alltid generell) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Beliggenhet – generelle krav** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Beliggenhet – sikkerhetsavstander tank** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Beliggenhet – interne avstander kat. 1&2** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Tanker (§ 15.2)** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Pumper (§ 15.6)** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Oppsamling (§ 15.3)** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Rør & ventiler (§ 15.4/5)** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Kontroll (§ 9)** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Innmelding DSB (§ 12)** | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Dokumentasjon (§ 13)** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Tankanlegg-fanene (Tanker, Pumper, Oppsamling, Rør & ventiler) skjules altså fullstendig for typiske bygg uten tankanlegg (bolig, garasje, salgslokale, forretning).

## Endringer

### 1. `src/pages/Brensellagring.tsx`
- Legg til en helper `isTabRelevant(tabKey, valgtBygningstype)` basert på matrisen over.
- Filtrer `TabsList`-knappene: `BYGNING_TANK_TYPER = ["verksted","fyrrom","tankrom","lager"]`. Render kun TabsTrigger for relevante faner.
- Når valgt fane blir irrelevant pga. bytte av bygningstype, fall tilbake til `defaultValue="stoffdata"` via kontrollert `value`/`onValueChange`-state.
- I "Beliggenhet"-fanen: vis kortene "Sikkerhetsavstander tank til objekt" og "Interne avstander" kun for tank-bygg.
- I "Innmelding"-fanen: vis kun for bygg der mengder over innmeldingsgrense kan oppstå (ikke bolig/garasje).
- Vis en kort info-stripe øverst når en bygningstype er valgt: "Viser kun krav som er relevante for {bygningstype}. Generelle krav (stoffdata, kontroll, dokumentasjon) vises alltid."
- Hvis ingen bygningstype er valgt → vis alle faner som i dag (uendret).

### 2. Konsekvenser for dokumentet (preview/eksport)
Ingen endringer i `BrensellagringPreview.tsx` eller `brensellagring-krav.ts`. Brukeren kan fortsatt kun legge til seksjoner som er synlige, så dokumentet blir naturlig renere ved at irrelevante faner ikke har "Legg til i dokument"-knapper.

### 3. Edge cases
- Hvis et eksisterende lagret dokument inneholder seksjoner som nå er skjult for valgt bygg, beholdes de i `selectedKravIds` og vises i preview – men brukeren ser dem ikke i panelet. Vi viser en liten advarsel: "Dokumentet inneholder N krav som ikke vises for valgt bygningstype" med en knapp "Vis alle faner uansett" som overstyrer filtreringen i denne sesjonen.

## Resultat
Velger man Bolig får man kun 4 faner (Stoffdata, Beliggenhet, Kontroll, Dokumentasjon) – med kun de generelle beliggenhetspunktene. Velger man Tankrom/Fyrrom/Verksted/Lager vises alle 8 faner. Salgslokale/Forretning får 5 faner (uten tank-spesifikke). Skjermbildet blir betydelig mer oversiktlig og fokusert på det som faktisk gjelder.

