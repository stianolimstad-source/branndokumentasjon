## Mål

1. Fjerne firmanavn (groupName) som tekst i forhåndsvisningen — logoen står for identiteten.
2. Vise et helt testbrannkonsept (forside + flere innholdssider) som brukeren kan skrolle gjennom for å se hvordan malen vil ta seg ut i ferdig dokument.

## Endringer

### `src/components/gruppe/MalForhandsvisning.tsx` (omskriving)

- Fjern alle steder der `groupName` rendres som tekst i forsiden (de små "uppercase tracking" labels). Beholder fortsatt logoplasseringen som før — én logo per mal-stil. `groupName` brukes kun i sidefoten på hver side (diskré nederst), siden Word-malen også bruker det der.
- Bytt fra én A4-side til en vertikal stack av A4-sider (samme `Page`-wrapper, men flere instanser stacket med `space-y-6`). Beholder `aspectRatio: 1/1.414` per side så forholdene stemmer.
- Wrapperen i `MalvalgPanel` får `max-h-[80vh] overflow-y-auto` slik at man kan scrolle innenfor previewet.
- Sidesett per mal-stil (`klassisk`, `moderne`, `minimalistisk`) — 4 sider hver, med samme typografi/farger som i dag, men nytt innhold:
  1. **Forside** — logo, "Brannkonsept", undertittel, prosjektnavn, dato. Ingen firmanavn-tekst.
  2. **Innholdsfortegnelse** — kapittel 1–6 (Innledning, Forutsetninger, Branntekniske ytelser, Rømning og redning, Slokking og varsling, Vedlegg).
  3. **Innholdsside 1** — "1. Innledning" + "2. Forutsetninger" med flere paragrafer eksempeltekst og en liten faktatabell (risikoklasse, brannklasse, antall etasjer).
  4. **Innholdsside 2** — "3. Branntekniske ytelser" med en tabell (Forhold / Løsning / Ansvar) med 3–4 rader eksempel, slik den ser ut i ekte rapporter.
- Felles komponenter: `Page`, `LogoOrPlaceholder`, `Header` (smal topplinje med kun logo + accent-strek, uten firmanavn), `Footer` (kun sidetall + dato — fjerner groupName-teksten der også for å unngå dobling, eller lar den stå diskré; jeg lar foten ha kun sidetall + dato for et renere uttrykk siden logo allerede identifiserer firmaet).
- Sidetall settes dynamisk per side ("Side 1", "Side 2" osv.).
- Tabeller stiles med `primary` for headerlinje og `accent` for radskillelinjer slik at fargevalget vises tydelig på flere sider.

### `src/components/gruppe/MalvalgPanel.tsx` (mindre justering)

- Endre preview-containeren (linje 261) fra `flex justify-center` til en scroll-container:
  ```
  <div className="rounded-lg bg-muted/40 p-6 max-h-[80vh] overflow-y-auto">
    <div className="flex flex-col items-center gap-6">
      <MalForhandsvisning ... />
    </div>
  </div>
  ```
- Oppdater hjelpeteksten til: "Bla gjennom for å se hele malen — endelig layout vises i Word."

### `Props`-grensesnittet

- Beholdes uendret. `groupName` mottas fortsatt (brukes evt. i alt-tekst), men rendres ikke som synlig tekst i forsiden.

## Ikke berørt

- Word-eksport, fargevalg-logikk, logo-fallback, lagring, mal-defaults. Kun visuell forhåndsvisning endres.
