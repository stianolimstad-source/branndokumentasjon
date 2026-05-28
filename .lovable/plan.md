# Compliance-tilpasninger for ROS: NVE-klasse og sensitivitet

## 1. Datamodell (`src/components/ros/RosPreview.tsx`)

Utvid `RosContent.metadata`:
```ts
nveKlasse?: 1 | 2 | 3;
sensitivKlassifisering?: "apen" | "intern" | "fortrolig" | "strengt_fortrolig";
```

Utvid `RosHendelse`:
```ts
sensitiv?: boolean;
```

Begge er valgfrie — eksisterende analyser fortsetter å fungere uten migrering. Default for nye analyser settes i editor til `sensitivKlassifisering: "intern"`.

## 2. Editor (`src/pages/RosAnalyse.tsx`)

**Metadata-seksjonen øverst:** to nye `Select`-felter etter eksisterende felter:
- «NVE-klasse (§5-4)» — alternativer: «Ikke klassifisert», «Klasse 1», «Klasse 2», «Klasse 3». Tooltip: «Klasse fra NVE styrer hvilke sikringskrav som gjelder for anlegget iht. beredskapsforskriften §5-5.»
- «Sensitivitetsklassifisering (§6-2)» — alternativer: «Åpen», «Intern», «Fortrolig», «Strengt fortrolig». Default «Intern» for nye analyser.

**Hendelse-accordion:** rett under tittel-feltet, en kompakt `Checkbox` «Inneholder kraftsensitiv informasjon (§6-2)» bundet til `hendelse.sensitiv`.

## 3. Preview (`src/components/ros/RosPreview.tsx`)

- I metadata-rendering: vis NVE-klasse og sensitivitetsklassifisering når satt.
- I hendelsestabell/-kort: når `hendelse.sensitiv === true`, vis rød kantlinje (`border-destructive`) og et lite `Shield`-ikon (lucide-react) ved siden av tittelen.

## 4. Word-eksport (`src/lib/ros-word-export.ts`)

**Topptekst (Header) på hver side:** hvis `sensitivKlassifisering` er `"fortrolig"` eller `"strengt_fortrolig"`:
> «KRAFTSENSITIV INFORMASJON – Behandles iht. beredskapsforskriften §6-2»

**Forside:** stor farget boks (gul for fortrolig, rød for strengt fortrolig) med tydelig klassifiseringstekst. Ingen boks/header for «åpen» eller «intern».

**Metadata-tabell:** to nye rader — «NVE-klasse» og «Sensitivitetsklassifisering» (vises kun når satt; sensitivitet vises alltid hvis ulik default).

**Hendelsesregister:** ny smal kolonne «Sens.» som viser «★» (eller skjold-glyph) for sensitive hendelser. Hele raden for sensitive hendelser får skygget (lys grå/rød) bakgrunn via `shading: { type: ShadingType.CLEAR, fill: "..." }` på cellene.

## 5. Verifikasjon

- Sjekk at gamle analyser uten de nye feltene rendres uten feil.
- Verifiser at Word-eksporten genererer gyldig fil ved hver klassifiseringsverdi (åpen/intern → ingen markering; fortrolig → gul; strengt fortrolig → rød).
