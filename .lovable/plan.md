## Endring: Fjern popup ved «Ny mal»

I dag åpner knappen «Ny mal» en dialog (`NyMalDialog`) hvor man velger navn og baselayout før malen opprettes. Editoren under listen brukes deretter til finjustering.

Vi forenkler dette slik at klikk på «Ny mal» oppretter malen umiddelbart og laster den rett inn i editoren under listen — all videre tilpasning (navn, baselayout, farger, font, layout-extras) skjer på samme side, slik den allerede gjør i dag.

### Hva endres

**`src/components/gruppe/MalvalgPanel.tsx`**
- Fjern `NyMalDialog`-import og `showNew`-state.
- Knappen «Ny mal» kaller en ny `handleCreate`-funksjon som:
  1. Setter inn en ny rad i `group_templates` med defaults: `name = "Ny mal"` (eller "Ny mal 2", "Ny mal 3"… hvis navnet allerede finnes), `base_template = "klassisk"`, farger/font fra `getTemplateDefaults("klassisk")`, `settings = DEFAULT_EXTRAS`, `is_default = false` hvis det finnes en standard fra før, ellers `true`, `sort_order = max + 1`.
  2. Refresher listen og laster den nye malen inn i editoren (`loadIntoEditor`).
  3. Scroller editoren inn i view og fokuserer navn-input slik at brukeren med en gang kan endre navnet.
- Behold `handleCreated` ikke lenger relevant — fjernes.

**`src/components/gruppe/NyMalDialog.tsx`**
- Slettes (filen er ikke lenger i bruk noe sted).

### Hva er IKKE påvirket

- Editoren under listen (navn, baselayout-kort, farger, font, layout-tilpasninger, lagre, forhåndsvis Word) er uendret.
- «Sett som standard», «Slett» og bekreftelsesdialog for sletting beholdes.
- Database-skjema og RLS er uendret — vi bruker samme `INSERT` som dialogen brukte.
- Andre komponenter som lytter til `onSaved` påvirkes ikke.

### Resultat

Ett klikk på «Ny mal» → ny mal vises i listen og er allerede åpen i editoren klar for redigering. Ingen modal i mellom.