

## Mål
Korrigere relevans-matrisen slik at **Beliggenhet** og **Dokumentasjon** behandles som tank-/anleggsrelaterte faner, ikke som "alltid generelle". For småskala bygg (Bolig, Garasje, Salgslokale, Forretning) er det meste av innholdet i disse fanene irrelevant – det handler om branngater, inngjerding av tankgrupper, områdeklassifisering, storulykke-samtykke osv.

## Bekreftelse av analysen
**Beliggenhet (§ 15.1)** – alle 7 kravene er rettet mot tankanlegg: tankgrupper, branngater mellom tanker, inngjerding (≥ 2 m), rømningsveier på anlegg, transportplan inn til anlegget.

**Dokumentasjon (§ 13)** – 14 av 14 punkter er primært for meldepliktige tank-/storulykkesanlegg: områdeklassifisering, eksplosjonsverndokument, storulykke-samtykke, risikoanalyse, arealdisponeringsplan, kvittering for innmelding av farlig stoff, ulykkesrapportering.

## Oppdatert relevans-matrise

| Fane | Bolig | Garasje | Salgslokale | Forretning | Verksted | Fyrrom | Tankrom | Lager |
|---|---|---|---|---|---|---|---|---|
| **Beliggenhet** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Tanker** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Oppsamling** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Rør & ventiler** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |
| **Kontroll** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Innmelding DSB** | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Dokumentasjon** | – | – | – | – | ✓ | ✓ | ✓ | ✓ |

Endringer kontra forrige matrise: **Beliggenhet** og **Dokumentasjon** flyttes fra "alltid synlig" til "kun tank-bygg". Salgslokale og Forretning beholder kun de fanene de faktisk trenger (mengder + Innmelding + Kontroll).

## Resultat per bygg
- **Bolig / Garasje**: 1 fane → **Kontroll** (+ den faste mengdetabellen øverst som alltid vises ut fra valgt bygningstype).
- **Salgslokale / Forretning**: 3 faner → **Kontroll**, **Innmelding DSB**, (+ DSB-tabellen for salgslokaler).
- **Verksted / Fyrrom / Tankrom / Lager**: alle 7 faner.

## Endringer
- `src/pages/Brensellagring.tsx`: oppdater `isTabRelevant`-helperen slik at `beliggenhet` og `dokumentasjon` returnerer `true` kun når `valgtBygningstype` er i `TANK_BYGG`.
- Oppdater info-stripen øverst: fjern "Beliggenhet" og "Dokumentasjon" fra teksten om hva som "alltid vises". Erstatt med: "Generelle krav (Kontroll) vises alltid. Krav som gjelder tankanlegg vises kun for verksted, fyrrom, tankrom og lager."
- Hvis aktiv fane blir irrelevant etter bytte av bygningstype, fall tilbake til `kontroll` (siden `stoffdata` ikke lenger finnes og `beliggenhet` nå kan være skjult).
- Ingen endringer i datafiler eller i preview-/eksportlogikk.

