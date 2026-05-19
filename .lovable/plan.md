## Mål

Gjøre det åpenbart hvilke barrierer som dekker hvilke årsaker i bow-tie-diagrammet (punkt 4 i ROS-preview og Word-eksport). I dag tegnes alle linjer i samme grå farge med samme tykkelse, så når 5 årsaker × 6 barrierer gir 20+ kryssende streker, blir det umulig å lese.

## Forslag (kombineres)

### 1. Fargekode per årsak (hovedgrep)
Hver årsak får en unik farge fra en kvalitativ palett (8–10 fargesterke, godt adskilte farger; gjenbrukes med stiplet linje hvis flere enn 10 årsaker). Alle linjer fra årsaken til sine barrierer tegnes i den fargen. Et lite fargemerke (prikk/strek) plasseres til venstre for årsakskortet og foran hver barriere som dekkes — slik at det går å lese sammenhengen uten å følge linjen.

### 2. Hover/klikk-uthevning (kun preview, ikke Word)
- Hover på en årsak → kun dens linjer + tilhørende barrierer beholder full opacity; resten dempes til ~0.15.
- Hover på en barriere → kun linjer til årsakene den dekker uthevet, og de aktuelle årsakskortene får ramme.
- Klikk for å «låse» uthevning til man klikker utenfor.

### 3. Bedre linjegeometri
- Ortogonal ruting (rette segmenter med avrundede hjørner) i stedet for bezier — lettere å spore visuelt.
- Linjene fra én årsak samles til en felles vertikal «buss» før de splittes ut til hver barriere, slik at man tydelig ser én utgang per årsak.
- Tykkere strek (2 px) og hvit «halo» (3.5 px hvit understrek) for å redusere visuell støy der linjer krysser.

### 4. Liten matrise-tabell under diagrammet
For Word-eksporten (der hover ikke finnes) og som backup i preview: en kompakt tabell

```
                | Barriere 1 | Barriere 2 | Barriere 3 | ...
Årsak Trafo 1   |     X      |            |     X      |
Årsak Trafo 2   |            |     X      |     X      |
```

Dette er entydig og overlever utskrift/PDF.

### 5. Sortering av barrierer
Barrierer sorteres slik at de som dekker overlappende sett av årsaker plasseres nær hverandre — reduserer linjekrysning betydelig.

## Anbefaling
Implementer **1 + 3 + 4** som standard (fungerer i både skjerm og Word), og legg til **2** som ekstra hjelp i skjermversjonen. **5** er en liten ekstra forbedring som krever lite kode.

## Filer som endres
- `src/components/ros/RosPreview.tsx` — fargepalett per årsak, ortogonal ruting med halo, fargeprikker på årsaks/barrierekort, hover-state, matrisetabell, sortering.
- `src/lib/ros-word-export.ts` — fargede streker (eller fargeprikker) per årsak i bow-tie-bildet, matrisetabell under bow-tie.

Ingen DB-endringer. Ingen endring i datamodell — koblingene finnes allerede i `felleseBarrierer[].arsakIds`.

## Spørsmål før implementasjon
1. Vil du ha alle fire grepene (1+2+3+4) eller bare et utvalg?
2. Skal matrisetabellen erstatte dagens «Barrierer / tiltak»-tabell under diagrammet, eller komme i tillegg?
