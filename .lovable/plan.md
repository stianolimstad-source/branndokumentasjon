

## Mål
«Kontroll og tilstandskontroll (§ 9)»-fanen skal tilpasses anleggstypen, slik at tank-spesifikke krav ikke vises for anlegg som ikke har tanker (typisk butikk/utsalg med småemballasje).

## Logikk — anleggstype styrer kontrollkrav
Bygger videre på det eksisterende valget av `bygningstype` / lagringsform. Vi innfører en avledet flagg `harTankanlegg` basert på:

- **Har tank**: Bygningstype = `tankanlegg`, `industri_tank`, `bensinstasjon`, `fyringsanlegg`, eller når brukeren har fylt inn mengder under «Tanker» (f.eks. `diesel_fyringsolje` over 0 L i en stasjonær tank-kategori).
- **Uten tank** (typisk butikk, lager med småemballasje): Bygningstype = `butikk`, `utsalg`, `lager_smaaemballasje`, eller når kun «småemballerte beholdere» / aerosoler er fylt inn.

Hvis det er usikkert (blandet eller manglende valg), defaulter vi til **å vise alle krav** og lar brukeren velge bort manuelt — i tråd med dagens oppførsel.

## Datastruktur — utvide `KontrollKrav`
I `src/lib/brensellagring-krav.ts`:
- Legge til felt `gjelder: "tank" | "alle"` på hver post i `KONTROLL_KRAV`.
- Klassifisering:
  - `Ferdigkontroll` → `alle` (gjelder alle anlegg, men teksten justeres for ikke-tank — se under)
  - `Utvendig tilstandskontroll` → `tank`
  - `Innvendig tilstandskontroll` → `tank`
  - `Sikkerhetskritisk utstyr` → `tank` (nødstopp/nødavstengning er tank-/prosessrelevant)
  - `Rørsystem og utstyr` → `tank`
- Legge til **to nye, generelle krav** som vises for ikke-tank-anlegg (butikk/lager med småemballasje):
  - `Visuell kontroll av lager og emballasje` → `alle` — «Periodisk visuell kontroll av emballasje, merking, hylleinnredning og brannskap. Lekkasjer, skadet emballasje og utløpte produkter fjernes.» Intervall: «Årlig».
  - `Kontroll av branntekniske tiltak` → `alle` — «Kontroll av ventilasjon i lagerrom, tetthet på brannskap/oppsamlingskar, tilgjengelighet til slokkeutstyr og rømningsveier.» Intervall: «Årlig».

Tekstene tilpasses slik at «Ferdigkontroll» nevner trykkprøving/tetthetsprøving **kun** der det er relevant — vi splitter den i to varianter via `gjelder` og bruker korrekt variant.

## UI-endringer i «Kontroll»-fanen
Filen: `src/pages/Brensellagring.tsx` (linje ~1151–1206).

1. Beregne `harTankanlegg` (memo) ut fra `bygningstype` og `plannedAmounts`.
2. Filtrere `KONTROLL_KRAV` før rendering:
   - `harTankanlegg === true` → vis poster med `gjelder` i `["tank", "alle"]` (alle).
   - `harTankanlegg === false` → vis kun `gjelder === "alle"`.
3. Liste «Generelt skal systematisk tilstandskontroll omfatte:» tilpasses likt:
   - **Tank**: dagens liste (visuell, korrosjon, tetthetsprøving, komponenter, sikkerhetsfunksjoner, dokumentasjon, kontrollrapport).
   - **Ikke-tank**: kortere liste (visuell kontroll av emballasje/merking/hyller, kontroll av brannskap og oppsamling, ventilasjon, slokkeutstyr og rømningsveier, kontrollrapport med avvik).
4. Liten info-banner øverst i fanen som forklarer hvorfor visningen ser slik ut:
   - Tank-modus: «Vist kontrollomfang er tilpasset anlegg med tanker.»
   - Ikke-tank-modus: «Anlegget har ikke tanker. Kontrollkrav for tankanlegg (utvendig/innvendig tilstandskontroll, rørsystem) er ikke aktuelle og er skjult. Du kan endre bygningstype for å vise alle krav.»

## Rapportgenerering
Filen: `src/components/brensellagring/BrensellagringPreview.tsx` (linje ~774).
- Bruke samme filtrering når kontroll-seksjonen rendres til rapporten — kun valgte (`isKravSelected`) kontrollkrav inkluderes uansett, men listen over generelle punkter byttes til ikke-tank-variant når `harTankanlegg === false`.
- Propagere `harTankanlegg` (eller direkte `bygningstype` + `plannedAmounts`) som prop fra `Brensellagring.tsx`.

## Filer som endres
1. **`src/lib/brensellagring-krav.ts`** — legge til `gjelder`-felt på `KONTROLL_KRAV`, legge til to nye generelle poster, splitte `Ferdigkontroll` om nødvendig.
2. **`src/pages/Brensellagring.tsx`** — beregne `harTankanlegg`, filtrere kontrollkrav, vise tilpasset info-banner og generell liste.
3. **`src/components/brensellagring/BrensellagringpPreview.tsx`** — motta `harTankanlegg` prop og bruke samme filtrering / generelle liste i rapporten.

Ingen databasemigrasjoner. Eksisterende dokumenter som har huket av tank-spesifikke kontrollkrav beholder valget i lagret state — de filtreres bare bort fra UI når anleggstypen ikke er tank, slik at brukeren får en ren visning.
