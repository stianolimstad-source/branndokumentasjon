## Mål

Legge til Word-nedlasting (.docx) for ROS-analysen, i samme stil og struktur som forhåndsvisningen og som matcher mønsteret fra brannkonsept/tilstandsvurdering.

## Omfang

- Knapp "Last ned Word" på ROS-editorsiden, låst bak `useCanDownload` (samme regel som øvrige eksporter).
- Genererer .docx som speiler `RosPreview` 1:1: header med metadata, kap. 1 Innledning, kap. 2 Metode (inkl. skalaer + 5×5-matrise), kap. 3 Hendelsesregister, kap. 4 Oppsummering, kap. 5 Revisjonshistorikk.
- Bruker brukerens profil (navn, firma, e-post, telefon) og evt. opplastet logo i toppfelt — samme mønster som `ks-word-export` / `kvalitativ-word-export`.

## Innhold i Word-fil

1. **Forside/header**: Logo (hvis lastet opp), tittel "ROS-analyse (brann)", prosjektnavn, adresse, oppdragsgiver, utført av, dato, versjon.
2. **Kap. 1 Innledning**: 1.1 Bakgrunn, 1.2 Formål, 1.3 Omfang, 1.4 Avgrensninger.
3. **Kap. 2 Metode**: Innledende avsnitt om 5×5-metodikk, to lister (sannsynlighets- og konsekvensskala) og en 5×5-tabell hvor hver celle viser `S×K = R` med fargekoding (grønn 1–4, gul 5–9, rød 10–25). Tabellen rendres som ekte Word-tabell med `shading` per celle.
4. **Kap. 3 Hendelsesregister**: Word-tabell med kolonner `Nr | Tittel | Beskrivelse | Årsak | S | K | R | Tiltak | Restrisiko`. R-cellen får fargekoding tilsvarende matrisen.
5. **Kap. 4 Oppsummering**: Fritekst.
6. **Kap. 5 Revisjonshistorikk**: Tabell `Versjon | Dato | Utførende | Endring`.

## Teknisk

- Nytt fil: `src/lib/ros-word-export.ts` med `exportRosToWord(content, sender, logoDataUrl?)`.
- Bruker `docx`-biblioteket (allerede i prosjektet, jf. eksisterende eksportlibs).
- Hjelpefunksjon `risikoFarge(s,k)` deles med `RosMatriks` (flyttes til `src/lib/ros-utils.ts` eller eksporteres fra eksisterende komponent) for konsistent fargelogikk mellom preview og Word.
- Knapp legges i `RosAnalyse.tsx`-editor (header-rad ved siden av Lagre):
  - Skjules/disables når `useCanDownload()` er false (med tooltip "Krever aktivt abonnement").
  - Kaller `exportRosToWord(content, profile, logoUrl)`.
- Profil og logo hentes som i `Oppdragsbekreftelse.tsx` / `Konsept`-eksport: `profiles`-tabell + brukerens (eller gruppens) logo-felt.

## Filer

```text
src/
  lib/
    ros-word-export.ts        # ny — bygger .docx
    ros-utils.ts              # ny (eller utvid eksisterende) — risikoFarge delt
  components/ros/
    RosMatriks.tsx            # importer risikoFarge fra ros-utils
    RosPreview.tsx            # importer risikoFarge fra ros-utils
  pages/
    RosAnalyse.tsx            # ny "Last ned Word"-knapp + lastlogikk for profil/logo
```

## Utenfor scope

- Excel-eksport.
- PDF-eksport (kan løses via "Skriv ut" i nettleseren ved behov).
- Endringer i datamodell eller `ros_analyses`-tabellen.
- AI-utfylling av innhold.

## Leveranse

Etter godkjenning: brukeren kan åpne en ROS-analyse, klikke "Last ned Word" og få en .docx som er identisk i innhold og rekkefølge med forhåndsvisningen, inkludert fargekodet 5×5-matrise og fargekodet risikoverdi per hendelse. Låses bak abonnement på samme måte som øvrige eksporter.
