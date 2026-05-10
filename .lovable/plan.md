# "Mer info"-knapp og info-side

## Mål
Legge til en liten "Mer info"-knapp under hero-teksten på forsiden (kun synlig for ikke-innloggede besøkende), som tar brukeren til en ny side `/om` med en utfyllende beskrivelse av Branndokumentasjon.no.

## 1. Knapp på forsiden
I `src/pages/Index.tsx` (rundt linje 156–164, i ikke-innlogget-grenen):
- Under `<p>` med teksten "Komplett verktøykasse…" legges en `<Link to="/om">` med `Button variant="outline" size="sm"` og ikon `Info` fra lucide. Tekst: "Mer info".
- Sentreres under teksten med litt topp-margin (`pt-2`).

## 2. Ny side `src/pages/Om.tsx`
Rute: `/om`. Bruker eksisterende global `AppHeader`. Layout `container max-w-3xl`, samme `bg-gradient-subtle` som Kontakt-siden.

### Innhold (norsk, profesjonell tone)

**Tittel:** Om Branndokumentasjon.no

**Ingress:**
> Branndokumentasjon.no er et komplett digitalt verktøy laget av en brannrådgiver for brannrådgivere. Appen samler hele arbeidsflyten – fra brannkonseptet starter, via beregninger og fraviksanalyser, til ferdig dokumentasjon leveres til kunde.

**Seksjoner (hver med ikon + tittel + brødtekst i `Card`):**

1. **For hvem? — `Users`-ikon**
   Branndokumentasjon.no er utviklet for brannrådgivere, branntekniske prosjekterende og rådgivende ingeniører som jobber med brannprosjektering, tilstandsvurderinger og brannteknisk dokumentasjon. Verktøyet egner seg både for selvstendige rådgivere og rådgiverfirmaer som ønsker å effektivisere arbeidsflyten og heve kvaliteten på leveransene.

2. **Brannkonsept etter TEK17 — `FileText`-ikon**
   Lag komplette brannkonsepter forankret i TEK17, VTEK og relevante byggforskrifter. Appen genererer strukturerte kapitler om bæreevne, brannspredning, branncellearealer, rømning, slokkeanlegg, manuell slokking og innsatsmannskap – med automatisk sammenstilling av krav på tvers av flere bygningsdeler.

3. **Tilstandsvurdering av eksisterende bygg — `ClipboardCheck`-ikon**
   Utfør branntekniske tilstandsvurderinger etter NS 3424, med støtte for både moderne TEK-bygg og eldre bygg etter Byggeforskrift 1985 (BF85). Bilder med EXIF-rotasjon, tilstandsgrader og kapittelstruktur håndteres automatisk i rapporten.

4. **Fraviksdokumentasjon — `FileWarning`-ikon**
   Kvalitative og kvantitative fraviksanalyser etter Byggforsk 321.026, med integrerte beregningsverktøy (stråling, flammehøyde, brannenergi, persontall, brannmotstand m.m.) som dokumenteres direkte inn i analysen.

5. **Beregningsverktøy — `Calculator`-ikon**
   Et bibliotek av branntekniske beregningsverktøy: Solid Flame stråling, Heskestad flammehøyde, brannmotstand etter additiv komponentmetode, brannareal og røykventilasjon etter HO-3/2000, eksplosjonsavlastning, brensellagring etter DSB, og mer.

6. **Samarbeid og kvalitetssikring — `ShieldCheck`-ikon**
   Del prosjekter med kollegaer og grupper, tildel oppgaver, og kjør egen- og sidemannskontroll med snapshot. Logoer og maler kan tilpasses per gruppe slik at ferdig Word-/PDF-dokumentasjon får riktig profil.

7. **Eksempelkatalog — `BookOpen`-ikon**
   Bla i en katalog av verifiserte løsninger for branntekniske konstruksjoner og brannfarlige stoffer, med referanser til SINTEF, Norgips og relevante kilder.

**Avsluttende CTA-blokk:**
> Vil du prøve verktøyet eller har spørsmål? [Opprett konto] [Kontakt oss]

To knapper: `Link to="/auth"` og `Link to="/kontakt"`.

## 3. Rute
Legge til `<Route path="/om" element={<Om />} />` i `src/App.tsx`.

## Tekniske detaljer
- Bruker semantiske design-tokens (ingen hardkodede farger).
- Ikoner i `bg-primary/10 text-primary`-bokser, samme stil som Kontakt-siden.
- Responsivt med `max-w-3xl` container.
- Ingen backend-endringer.

## Ute av scope
- Lenke i header eller meny (kun knapp på forsiden).
- Skjema, video, eller bilder.
