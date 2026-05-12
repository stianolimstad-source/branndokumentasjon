## Redigerbar oppsummering av avvik i Fravik-accordion

I `src/pages/Konsept.tsx`, Fravik-accordion (ca. linje 9684–9701), når `documentType === "tilstandsvurdering"`:

1. Iterer gjennom `tilstandSectionsTEK17` og les `formData.tilstandsvurderinger[key]` med samme `ensureKategorier`-logikk som brukes i preview.
2. Vis to underseksjoner som matcher rapportens «Oppsummering av avvik»:
   - **Avvik som krever aktive tiltak** (rød aksent) – kort per seksjon med kapittel-label, TG-chip og `Textarea` bundet til `tilstandsvurderinger[key].tiltak.beskrivelse`.
   - **Avvik som kan fraviksbehandles** (gul aksent) – tilsvarende, bundet til `tilstandsvurderinger[key].fravik.beskrivelse`.
3. Endringer skriver tilbake til samme felt som kapittel 3.x-panelet bruker → én datakilde, holder rapport og innput synkronisert.
4. Tom tilstand: «Ingen avvik registrert ennå. Avvik registreres under kapittel 3.x.»
5. Behold eksisterende `formData.fravik`-fritekst nederst som «Generelle merknader (valgfritt)» – ingen datatap.
6. Brannkonsept (`documentType !== "tilstandsvurdering"`): uendret.

Gjenbruker `tilstandSectionList` og `getKategorier` fra `KonseptPreview.tsx` (eksporter om nødvendig).

Ingen endringer i datamodell, lagring, word-eksport, preview-rapport eller kapittel 3.x-panelene.