## Mål
På inputsiden i `/konsept` (brannkonsept) og `/tilstandsvurdering` skal vi visuelt skille mellom **generelle krav** etter BF85/TEK17 og **tilleggskrav for kraftstasjoner** (hentet fra "Veiledning om brannsikkerhet i kraftstasjoner"). Brukeren skal lett se hva som er ekstra for kraftstasjoner.

Skillet vises kun når bygningstype/bygningsdel = Kraftstasjon (som i dag). Ingen endringer i preview eller Word-eksport — kun input-UI.

## Visuell løsning

For hver av seksjonene 3.1–3.14 i `src/pages/Konsept.tsx` der det finnes kraftstasjon-spesifikke felter, samles disse i et eget kort under de generelle kravene:

```
┌─ Generelle krav (BF85 / TEK17) ──────────┐
│ [eksisterende felter]                    │
└──────────────────────────────────────────┘

┌─ ⚡ Tilleggskrav for kraftstasjon ───────┐  (ny seksjon, kun synlig
│ Kilde: Veiledning om brannsikkerhet i    │   når Kraftstasjon valgt)
│ kraftstasjoner                           │
│                                          │
│ [kraftstasjon-spesifikke felter]         │
└──────────────────────────────────────────┘
```

Stil: `Card` med `border-primary/40`, lett bakgrunn (`bg-primary/5`), liten badge "Kraftstasjon" og kildehenvisning i header. Følger eksisterende design-tokens (ingen direkte farger).

## Felles helper

Ny gjenbrukbar komponent `KraftstasjonTilleggskravCard` (i `src/components/konsept/KraftstasjonTilleggskravCard.tsx`):

```tsx
<KraftstasjonTilleggskravCard kapittel="3.7" visible={erKraftstasjon}>
  {/* kraftstasjon-felter */}
</KraftstasjonTilleggskravCard>
```

Props: `kapittel`, `visible`, `children`, valgfri `kildeTekst` (default: "Veiledning om brannsikkerhet i kraftstasjoner"). Returnerer `null` når `!visible`.

Dette gir konsekvent visuell merking i alle 14 kapitler uten å duplisere markup.

## Kapittelvis omstrukturering

Følgende eksisterende kraftstasjon-felter flyttes inn i tilleggskravkortet for sitt kapittel (selve logikken/state-feltene endres ikke — kun visuell innramming og plassering):

- **3.5 Brannceller**: rad/innstilling for "Dører til teknisk rom skal være utadslående" (lagt til nylig)
- **3.7 Tekniske installasjoner**:
  - Kabler (kulverter, sjakter, kabeltunneler)
  - Ventilasjonsanlegg – brannspjeld (automatiske spjeld, ikke smeltesikring)
- **3.8 Rømning og redning** (linjer ~8430–8615):
  - "Dører lite antall personer" (deaktivert for kraftstasjon med forklaringstekst)
  - "Panikkbeslag" (påkrevd NS-EN 1125)
  - "Kraftstasjon under fjell eller under dagen" (sjekkboks ~linje 3112) flyttes hit hvis den hører hjemme i 3.8/3.9, eller forblir i sin nåværende metadata-seksjon men får tydelig kraftstasjon-merking via samme komponent (se "Avklaring" nedenfor)
- **3.9 Tilrettelegging for rømning**: redningsrom (FEA-F § 26), nødlysanlegg (FEA-F § 25/26), håndlykter — alt som styres av `kraftstasjonUnderFjell` / kraftstasjon-detektering

Kapitler **3.1, 3.2, 3.3, 3.4, 3.6, 3.10, 3.11, 3.12, 3.13, 3.14** har i dag ingen kraftstasjon-spesifikke felter. Der legges det **ikke** inn tomt kort — komponenten returnerer `null`. Strukturen er klar for fremtidige tilleggskrav (vi kan legge inn et plassholder-kommentar `{/* TODO: kraftstasjon-tilleggskrav for 3.X */}` i hver seksjon for å gjøre det tydelig hvor de skal inn).

## Detektering

Bruk allerede etablert mønster:
```ts
const erKraftstasjon =
  (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
  || (formData.bygningsdeler || []).some(
       (d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon")
     );
```

Eksponeres som lokal variabel der det trengs (eller via en liten `useErKraftstasjon`-hook hvis det blir mange call sites).

## Avklaring underveis

"Kraftstasjon under fjell eller under dagen"-sjekkboksen (linje 3112) ligger i dag i bygningstype-/metadata-seksjonen og styrer innhold i kap. 3.9. Den **forblir der** (det er en metadata-bryter, ikke et kapittelkrav), men får visuell kraftstasjon-merking via samme styling.

## Tekniske endringer (filer)

1. **Ny fil**: `src/components/konsept/KraftstasjonTilleggskravCard.tsx` — gjenbrukbar wrapper-komponent med Card + badge + kildetekst.
2. **`src/pages/Konsept.tsx`**: Wrappe eksisterende kraftstasjon-spesifikke input-blokker i 3.5, 3.7, 3.8, 3.9 med `<KraftstasjonTilleggskravCard>`. Ingen endring i state/feltlogikk.
3. **Ingen endringer** i `KonseptPreview.tsx`, `word-export-chapter3.ts` eller datamodell.

## Ut av scope

- Endringer i preview eller Word-eksport
- Nye kraftstasjon-krav (kun omorganisering av eksisterende)
- Endringer i validerings-/forretningslogikk
