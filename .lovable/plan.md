## Mål
Legg til bow-tie-analyse i ROS-modulen slik at brukeren kan definere en uønsket topphendelse (f.eks. «Eksplosjon») og knytte eksisterende registrerte hendelser til den som årsaker. Dette gir kategorisering av hendelser og synliggjør tiltak som virker på tvers av flere topphendelser.

## Konsept (bow-tie)
```text
   Årsaker (registrerte hendelser)            Konsekvenser
   ─────────────────────────────┐         ┌──────────────────
   • Hendelse A  ──┐            │         │
   • Hendelse B  ──┼── Barrierer ▶ TOPPHENDELSE ▶ Barrierer ── • Konsekvens 1
   • Hendelse C  ──┘            │         │                    • Konsekvens 2
   ─────────────────────────────┘         └──────────────────
```
Venstre side («årsaker») kobles direkte til allerede registrerte hendelser i ROS-analysen. Høyre side («konsekvenser») skrives som korte fritekstpunkter per topphendelse. Tiltak hentes automatisk fra de koblede hendelsene + en valgfri «felles barriere»-tekst.

## Datamodell (utvidelse av `RosContent`)
I `src/components/ros/RosPreview.tsx`:
```ts
export interface RosBowTie {
  id: string;
  navn: string;                 // f.eks. "Eksplosjon i transformator"
  beskrivelse?: string;
  hendelseIds: string[];        // refererer til RosHendelse.id (årsaker)
  konsekvenser: string[];       // fritekst-punkter
  fellesBarrierer?: string;     // valgfri tekst om felles tiltak
}
export interface RosContent {
  ...
  bowTies?: RosBowTie[];        // valgfri => bakoverkompatibel
}
```
Eksisterende analyser uten `bowTies` fungerer uendret.

## Endringer

### 1. `src/pages/RosAnalyse.tsx`
- Ny seksjon «4. Bow-tie analyse» (etter Hendelser, før Oppsummering).
- «+ Ny topphendelse»-knapp åpner Accordion-item med:
  - Tittel + valgfri beskrivelse.
  - **Årsaker**: multi-select chip-liste over alle `content.hendelser` (søkbar). Klikk på chip toggler tilhørighet. Viser også risiko-fargekode per hendelse.
  - **Konsekvenser**: enkel liste med + / slett, tekstfelt per rad.
  - **Felles barrierer / tiltak**: textarea (valgfri).
  - Slett topphendelse-knapp (med `AlertDialog`-bekreftelse).
- Oppdater søk/innholdshåndtering i samme mønster som eksisterende `hendelser`.

### 2. `src/components/ros/RosPreview.tsx`
- Render ny seksjon «4. Bow-tie analyse» når `bowTies?.length`:
  - Per topphendelse: SVG-/CSS-bow-tie med årsaker (venstre kolonne, knyttet til topp via linjer), topphendelse-boks i midten, konsekvenser (høyre kolonne).
  - Under diagrammet: tabell «Aggregerte tiltak» som lister `tiltak` fra alle koblede hendelser + felles barrierer. Tiltak som forekommer i ≥2 topphendelser merkes som «Felles tiltak» (badge).

### 3. `src/lib/ros-word-export.ts`
- Eksporter samme seksjon til Word: per topphendelse en tabell med kolonnene «Årsak (hendelse-ID/tittel) | S | K | Risiko» og under: «Konsekvenser» + «Felles barrierer» + «Aggregerte tiltak».
- Numerisk kapittelnummerering oppdateres så Oppsummering blir kap. 5.

### 4. Hendelser ↔ bow-tie konsistens
- Hvis en hendelse slettes, fjern `id` fra alle `bowTies[].hendelseIds` automatisk.

## Verifisering
- Opprett ROS → legg til 3 hendelser → opprett topphendelse «Eksplosjon» → tilknytt 2 av hendelsene → legg til 2 konsekvenser. Preview viser bow-tie med riktige årsaker, konsekvenser og aggregerte tiltak.
- Slett en koblet hendelse → forsvinner automatisk fra bow-tie.
- Eksporter til Word → bow-tie-seksjonen er med, med korrekt nummerering.
- Eksisterende ROS-analyser uten `bowTies` åpnes uten feil og viser ingen bow-tie-seksjon før første topphendelse opprettes.
