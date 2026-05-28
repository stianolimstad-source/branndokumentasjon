## Mål
Legg til en «Generer fra sjekkliste»-knapp i hendelser-seksjonen i `src/pages/RosAnalyse.tsx` som åpner en dialog der brukeren kan masse-opprette tomme `RosHendelse`-er fra NVE-veilederens vedlegg 1 (datastrukturen i `src/lib/ros-sjekklister.ts`).

## Endringer

### `src/pages/RosAnalyse.tsx` (eneste fil som endres)

**Imports**
- Importer `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription` fra `@/components/ui/dialog`.
- Importer `Checkbox` fra `@/components/ui/checkbox`.
- Importer `Label` fra `@/components/ui/label`.
- Importer `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` (allerede sannsynlig i bruk – verifiseres).
- Importer `SJEKKLISTER, SAERSKILTE_FORHOLD`, type `Anleggstype` fra `@/lib/ros-sjekklister`.
- Bruk `toast` fra `sonner` (allerede tilgjengelig i prosjektet).

**Ny state**
```ts
const [sjekklisteOpen, setSjekklisteOpen] = useState(false);
const [valgtAnleggstype, setValgtAnleggstype] = useState<Anleggstype>("vannkraftverk");
const [sjekklisteSok, setSjekklisteSok] = useState("");
const [valgtePunkter, setValgtePunkter] = useState<Set<string>>(new Set()); // key = `${anleggstype}::${delelement}::${hendelse}`
const [valgteForhold, setValgteForhold] = useState<Set<string>>(new Set()); // key = forhold.navn
```

**Beregnet i render**
- Filtrert liste over sjekklistepunkter for valgt anleggstype, gruppert etter `delelement`, filtrert etter `sjekklisteSok` (case-insensitive på `hendelse` og `delelement`).
- Eksisterende-sett: `Set<string>` over `${tittel}||${sarbarhet}` fra `content.hendelser` for å oppdage duplikater.
- Liste over valgte punkter som *ville* blitt duplikater → vises som advarsel-Alert i dialogen.
- Antall reelt nye = avkrysninger minus duplikater.

**UI: knapp**
Plasseres i headeren ved siden av «Ny hendelse» (rett over Accordion-en):
```tsx
<Button size="sm" variant="outline" onClick={() => setSjekklisteOpen(true)}>
  <Plus className="h-4 w-4 mr-1" /> Generer fra sjekkliste
</Button>
```

**UI: dialog**
- `DialogContent` med `max-w-2xl max-h-[85vh] flex flex-col`.
- Header: tittel + beskrivelse fra spesifikasjon.
- Anleggstype-`Select` (alle 8 verdier med `SJEKKLISTER[type].navn` som label). Bytte tømmer ikke `valgtePunkter` (nøklene er prefikset med anleggstype, så valg på andre typer beholdes).
- Søke-`Input` med `Search`-ikon.
- Scrollbar liste (`flex-1 overflow-y-auto`) gruppert etter delelement: en `<h4>` per delelement, deretter Checkbox-rader `«<hendelse> (<delelement>)»`. Beskrivelse vises i muted small under hvis finnes.
- Seksjon nederst i listen: «Tillegg fra generell sjekkliste» – grupperer `SAERSKILTE_FORHOLD` etter `kategori` (omgivelser/personell/teknisk/tilsiktet) med Checkboxer.
- Advarsel-Alert vises over footer hvis noen avkrysninger er duplikater.
- Footer: «Avbryt» + «Legg til N hendelser» (disabled hvis N=0). N = antall nye (etter dedupliering).

**Handler: handleGenererFraSjekkliste**
1. Bygg `eksisterendeSet` fra `content.hendelser`.
2. For hver valgt punkt-nøkkel → slå opp punkt → lag `RosHendelse` med feltene i spesifikasjonen. Hopp over hvis `${tittel}||${sarbarhet}` finnes i eksisterendeSet (og legg til i sett underveis for å unngå interne duplikater).
3. For hvert valgt særskilte forhold → samme, med `sarbarhet: \`Særskilt forhold (${forhold.kategori})\``.
4. `setContent(c => ({ ...c, hendelser: [...c.hendelser, ...nye] }))`.
5. `setOpenHendelser(o => [...o, ...nye.map(h => h.id)])`.
6. `toast.success(\`${nye.length} hendelser lagt til. Husk å fylle ut årsak, sannsynlighet og konsekvens for hver.\`)`.
7. Lukk dialog + tøm `valgtePunkter`, `valgteForhold`, `sjekklisteSok`.

**Felt-default på nye hendelser** (matcher eksisterende `addHendelse`):
```ts
{
  id: makeId(),
  tittel: punkt.hendelse,
  sarbarhet: punkt.delelement,
  hendelse: punkt.hendelse + (punkt.beskrivelse ? ` – ${punkt.beskrivelse}` : ""),
  arsak: "",
  beskrivelseSannsynlighetFor: "",
  beskrivelseRisikoFor: "",
  sannsynlighet: 1,
  konsekvens: 0,
  tiltak: "",
  eksisterendeBarrierer: "",
  foreslatteTiltak: "",
  beskrivelseEtter: "",
  sannsynlighetEtter: 1,
  restrisiko: "",
  konsekvensvurderinger: [],
  usikkerhet: "lav",
  styrbarhet: "medium",
}
```

## Ingen andre filer endres
`ros-sjekklister.ts` er ferdig; ingen Word-eksport- eller datastruktur-endringer kreves.
