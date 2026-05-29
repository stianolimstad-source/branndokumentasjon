## Mål
Når et eksisterende tilstandsvurderingsdokument lastes opp, skal AI også hente ut **registrerte avvik fra det gamle bygget** og presentere dem i oppsummeringen, slik at brukeren kan huke av hvilke som skal tas med inn i den nye rapporten — plassert under riktig kapittel 3.x.

## 1. Edge function (`supabase/functions/parse-fire-concept/index.ts`)
Utvid JSON-skjemaet AI returnerer med et nytt felt `avvik` (kun ment for tilstandsvurdering, men returneres alltid som array — tom hvis ingen funnet):

```jsonc
"avvik": [
  {
    "sectionKey": "3_5",          // én av 3_1..3_14 (mapping forklart i prompt)
    "kind": "tiltak",              // "tiltak" = må utbedres, "fravik" = kan fraviksbehandles
    "grad": "tg2",                 // tg0|tg1|tg2|tg3|tgiu
    "beskrivelse": "..."           // fritekstbeskrivelse av avviket (1–3 setninger)
  }
]
```

Prompt-tillegg (kun aktivt for `documentType === "tilstandsvurdering"`):
- Forklar TG-skalaen (NS 3424: TG0 ingen, TG1 mindre, TG2 vesentlige, TG3 store/alvorlige) og at modellen skal velge `tg2`/`tg3` for klare avvik, `tg1` for mindre.
- Forklar `kind`: bruk `tiltak` for avvik som rapporten beskriver må utbedres / settes i stand, og `fravik` der rapporten konkluderer at det aksepteres og dokumenteres som fravik. Default `tiltak` ved tvil.
- Gi mapping fra typiske paragraf-/temanavn til `sectionKey`:
  - §11-4 / bæreevne → `3_1`
  - §11-5 / eksplosjon → `3_2`
  - §11-6 / brannspredning mellom byggverk → `3_3`
  - §11-7 / seksjonering/brannvegg → `3_4`
  - §11-8 / brannceller, EI-vegger, dører → `3_5`
  - §11-9 / overflater, materialer → `3_6`
  - §11-10 / tekniske installasjoner, gjennomføringer, ventilasjon → `3_7`
  - §11-11 / rømning og redning generelt → `3_8`
  - §11-12 / brannalarm, ledesystem, sprinkler, slokkeanlegg → `3_9`
  - §11-13 / utgang fra branncelle → `3_10` (TEK17). For BF85 brukes `3_10` om rømning generelt — uansett trygt valg ved usikkerhet.
  - §11-13/§11-14 rømningsvei, trapperom → `3_11`
  - §11-15 husdyr → `3_12`
  - §11-16 manuell slokking, brannslange/håndslukker → `3_13`
  - §11-17 tilrettelegging for slokkemannskap → `3_14`
- Be modellen returnere tom `beskrivelse` aldri — droppe avviket i stedet.

Selve return-strukturen og resten av promptet beholdes uendret.

## 2. Upload-dialog (`src/components/konsept/UploadConceptDialog.tsx`)
- Utvid `ExtractedData` med `avvik?: ExtractedAvvik[]` der `ExtractedAvvik = { sectionKey, kind, grad, beskrivelse }`.
- Etter parsing: bygg en `avvikKeysFound`-liste (indekser i avvik-arrayet) og en `selectedAvvik: Set<number>` (default: alle valgt).
- Vis kun avvik når `documentType === "tilstandsvurdering"` og listen ikke er tom.
- Ny seksjon i review-UI under "Kapittel 3" med tittel **"Registrerte avvik fra gammel rapport"** og "Velg alle / Fjern alle":
  - Grupper rader per `sectionKey` med kapittel-label hentet fra et lokalt mapping-objekt (gjenspeiler `tilstandSectionsTEK17`).
  - Hver rad: checkbox + badge for `kind` (Tiltak / Fravik) + badge for `grad` (TG2/TG3 …) + trunkert `beskrivelse`.
- "Fyll inn valgte felter" inkluderer `filtered.avvik = selectedAvvik` → sendes til `onDataExtracted`.
- Telleren oppdateres til å summere meta + kap3 + avvik.

## 3. Påføring i skjemaet (`src/pages/Konsept.tsx`)
I `onDataExtracted`-callbacken (ca. linje 2790): etter eksisterende `setIfEmpty`-kall, legg til logikk som **appender** importerte avvik til riktig seksjon — ikke overskriver:

```ts
if (Array.isArray(extracted.avvik) && documentType === "tilstandsvurdering") {
  const tv = { ...(updated.tilstandsvurderinger || {}) };
  for (const a of extracted.avvik) {
    // BF85: re-map 3_11→3_10, 3_12→3_12, 3_13→3_13, 3_14→3_14 (samme key brukes allerede)
    const key = a.sectionKey;
    const eksisterende = tv[key] || emptyTilstand();
    const kat = (a.kind === "fravik" ? eksisterende.fravik : eksisterende.tiltak) ?? emptyKategori();
    const nyAvvik = { id: crypto.randomUUID(), grad: a.grad || "tg2", beskrivelse: a.beskrivelse, bilder: [] };
    const oppdatertKat = { ...kat, avvik: [...(kat.avvik ?? []), nyAvvik] };
    tv[key] = a.kind === "fravik"
      ? { ...eksisterende, fravik: oppdatertKat }
      : { ...eksisterende, tiltak: oppdatertKat };
  }
  updated.tilstandsvurderinger = tv;
}
```

Eksisterende oppførsel (avvik registrert manuelt) er intakt; importerte avvik føyes til på enden av tiltak-/fraviks-listen under riktig kapittel og dukker opp både i kapittel 3.x og i "Oppsummering av avvik".

## 4. Ingen endringer i
- Datamodell i Supabase (avvik lagres allerede som JSON i `fire_concepts`).
- Word-export / preview-logikk.
- `UploadRosDialog` (ROS-flyten er separat).

## Resultat
Etter opplasting av en gammel tilstandsrapport viser oppsummeringen f.eks.:

> **Registrerte avvik fra gammel rapport** (Velg alle / Fjern alle)
> ☑ 3.5 Brannceller — TG3 · Tiltak: Manglende EI 60 mellom leiligheter i 2. etg …
> ☑ 3.7 Tekniske installasjoner — TG2 · Tiltak: Ventilasjonskanal går gjennom branncellevegg uten brannmansjett …
> ☑ 3.11 Rømningsvei — TG2 · Fravik: Trapperom Tr1 i stedet for Tr2, kompenseres med …

Brukeren huker av hva som skal med, og avvikene legges inn under riktig kapittel 3.x i den nye rapporten, klare for videre redigering.
