# Plan: Vis valgt mal-farge også i bedriftens forhåndsvisning

## Problem
På bedriftsiden (Min gruppe → «Dokumentmal for bedriften») viser den nederste forhåndsvisningen et tomt brannkonsept via `KonseptPreview`. Når en bruker bytter mal eller farge, oppdateres forsiden — men selve rapport-innholdet (kapittel 3-rader, kapittel 4-overskrift) forblir blått, fordi `KonseptPreview` rendres uten `theme`-prop.

## Løsning (én fil)

**`src/components/gruppe/MalForhandsvisning.tsx`** – linje 161
- Bygge et `theme`-objekt fra eksisterende props (`template`, `primary`, `accent`, `font`, `logoUrl`, `groupName`) i samme format som `KonseptPreview` forventer (hex uten `#`).
- Sende det videre: `<KonseptPreview formData={{}} logoUrl={logoUrl} hideCover theme={previewTheme} />`.

Ingen andre endringer. Da slår valgt aksentfarge gjennom på alle seksjon-overskrift-rader (3.1, 3.2, …) og primærfargen på kapittel 4-overskriften — akkurat som på selve brannkonseptsiden.
