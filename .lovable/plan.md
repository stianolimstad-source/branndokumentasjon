## Mål
Innputsiden for ROS-analyse skal håndtere mange hendelser (44+) uten å bli en endeløs scroll. Hver hendelse pakkes inn i en sammenleggbar rad som standard er lukket, og viser de viktigste opplysningene i toppraden.

## Endringer

### `src/pages/RosAnalyse.tsx` — seksjon "3. Hendelser"
Erstatte den åpne kort-listen med `Accordion` (`type="multiple"`) fra `@/components/ui/accordion`, slik at:

- Hver hendelse er en `AccordionItem` som er kollapsert som standard.
- Toppraden (alltid synlig) viser:
  - Nummer (`#1`, `#2` …)
  - Tittel (eller «Uten tittel» hvis tom)
  - Risiko-pille med `S×K=R` og fargen fra `risikoFarge` (grønn/gul/rød), samme klasser som i dag
  - Liten slett-knapp (åpner ikke accordion)
- Innholdet (når åpnet) inneholder dagens skjema: Tittel, Beskrivelse, Årsak, Sannsynlighet/Konsekvens (Select), Tiltak, Restrisiko.
- Over listen legges to hjelpeknapper: «Utvid alle» / «Lukk alle», som styrer en kontrollert `value`-state for accordion.
- Søkefelt øverst i seksjonen (fri tekst) som filtrerer hvilke `AccordionItem` som rendres basert på tittel/beskrivelse/årsak. Filtrering påvirker kun visning, ikke `content.hendelser`.
- «Ny hendelse» åpner automatisk den nye raden (legg id-en inn i åpen-state).

Ingen endringer i datamodell, lagring, Word-eksport eller forhåndsvisning. `RosPreview` fortsetter å vise alle hendelser i sin tabell.

### Tekniske detaljer
- Bruker eksisterende shadcn `Accordion` (`AccordionItem`, `AccordionTrigger`, `AccordionContent`) — finnes allerede i prosjektet.
- Slett-knappen i toppraden får `onClick={(e) => { e.stopPropagation(); removeHendelse(h.id); }}` for å unngå å toggle accordion.
- Åpen-state: `const [openHendelser, setOpenHendelser] = useState<string[]>([])`.
- Søk: `const [hendelseSok, setHendelseSok] = useState("")`, filtrering med `toLowerCase().includes(...)`.

### Ut av scope
- Ingen endring i selve hendelse-feltene eller validering.
- Ingen endring i `RosPreview` eller `ros-word-export`.
- Ingen import/Excel/AI-funksjonalitet.
