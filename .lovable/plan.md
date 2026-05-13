## Mål

I kap. 3.9 for **tilstandsvurderinger** (både BF85 og TEK17) skal brukeren alltid kunne hake av for at bygget faktisk har:

- Brannalarmanlegg
- Automatisk slokkeanlegg (sprinkler)
- Røykventilasjon

— uavhengig av om regelverket krever det. Begrunnelse: disse anleggene benyttes ofte som **kompenserende tiltak** for andre mangler. Dette gjelder kun i tilstandsvurderingsmodus (`documentType === "tilstandsvurdering"`), ikke i ordinære brannkonsept.

## Endringer

### 1. Datamodell (`src/pages/Konsept.tsx`, init av `formData` ca. linje 815–830)

Tre nye felter (boolske, default `false`):

- `tilstand_39_brannalarm_installert: boolean`
- `tilstand_39_slokkeanlegg_installert: boolean`
- `tilstand_39_roykventilasjon_installert: boolean`

(Feltene gjenbrukes for både BF85 og TEK17 tilstandsvurdering — det finnes ingen TEK17-konseptlogikk som kolliderer.)

### 2. UI i kap. 3.9 (`src/pages/Konsept.tsx`, ca. linje 8031–8127)

Helt øverst i 3.9-blokken, direkte under headeren, legges en ny boks som **kun vises når `documentType === "tilstandsvurdering"`** (uavhengig av regelverk):

- Tittel: «Installerte anlegg (kan benyttes som kompenserende tiltak)»
- Hjelpetekst: kort forklaring om at avhukingen registrerer at anlegget faktisk er installert i bygget – også der regelverket ikke krever det – slik at det kan inngå i vurderingen som kompenserende tiltak.
- Tre Checkbox-rader:
  1. **Brannalarmanlegg installert** → `tilstand_39_brannalarm_installert`
  2. **Automatisk slokkeanlegg (sprinkler) installert** → `tilstand_39_slokkeanlegg_installert`
  3. **Røykventilasjon installert** → `tilstand_39_roykventilasjon_installert`

Eksisterende BF85-blokker (`bf85_16_brannalarmanlegg`, `bf85_39_kontor_brannalarm`, `bf85_39_industri_slokkeanlegg`) og TEK17-logikken beholdes uendret under den nye boksen — disse representerer fortsatt forskriftens *krav*, mens den nye boksen registrerer faktiske installasjoner.

### 3. Preview (`src/components/konsept/KonseptPreview.tsx`)

I 3.9-tabellen, kun når `documentType === "tilstandsvurdering"`, legges det til en ekstra rad/avsnitt «Installerte anlegg (kompenserende tiltak)» som lister opp de avhukede anleggene. Hvis ingen er huket av, vises raden ikke. Beholdes etter eventuelle krav-rader for å gjøre det tydelig at dette er en faktisk-tilstand-observasjon.

### 4. Word-eksport (`src/lib/word-export-chapter3.ts`)

Tilsvarende avsnitt/rad i 3.9 når `documentType === "tilstandsvurdering"` og minst ett felt er avhuket. Bruker samme fraser som preview for konsistens.

## Akseptansekriterier

- I tilstandsvurdering (både BF85 og TEK17) vises en ny boks i 3.9 med tre avhukinger — alltid, uavhengig av bygningstype/regelverkskrav.
- Avhukingene speiles i preview og Word-eksport.
- Ordinære brannkonsept (`documentType === "brannkonsept"`) er uendret.
- Eksisterende BF85-krav-bokser i 3.9 påvirkes ikke.

## Spørsmål

1. Skal de tre avhukingene også eksponeres i 3.5/3.4-vurdering (eller andre seksjoner) som "tilgjengelige kompenserende tiltak", eller holder det at de bare bor i 3.9 og kan refereres manuelt? Planen forutsetter sistnevnte.
2. Ønsker du et fritekstfelt per anlegg (f.eks. type/dekning/standard som NS-EN 12845, alder, kontrollstatus) i tillegg til selve avhukingen?
