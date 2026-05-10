## Endring: Egen «Maler»-fane (skill ut fra Logo)

I dag ligger malstyringen (`MalvalgPanel`) under fanen «Logo» sammen med opplasting av gruppelogo. Vi flytter den ut til en egen fane slik at administratorer har én tydelig knapp/fane for hver oppgave.

### Hva endres

**`src/pages/GruppeDetalj.tsx`**
- Legg til en ny `<TabsTrigger value="maler">` ved siden av «Logo» (kun synlig for `isAdmin`), med ikon `Sparkles` (eller `FileText`/`LayoutTemplate`) og label «Maler».
- Opprett `<TabsContent value="maler">` som inneholder kun `MalvalgPanel`-komponenten (med samme props som i dag).
- Fjern `MalvalgPanel` fra `<TabsContent value="innstillinger">` (Logo-fanen) — den fanen inneholder kun gruppelogo-håndteringen.

### Hva er IKKE påvirket

- `MalvalgPanel` selv (intern oppførsel, opprettelse av ny mal, lagring osv.) er uendret.
- Logo-håndtering, medlemmer- og delte prosjekter-fanene er uendret.
- Ingen endringer i database eller backend.

### Resultat

Adminbrukere får tre faner i tillegg til medlemmer/delte: **Logo** og **Maler** står som hver sin separate inngang. Dette gjør det enklere å finne malene og holder Logo-fanen fokusert på sitt formål.