

# Utvid TEK17-assistenten med kunnskap fra brannkonsept-reglene

## Hva vi gjør
Beriker system-prompten i `tek17-chat` edge-funksjonen med all den strukturerte regellogikken som allerede er kodet i brannkonsept-verktøyet, for både **TEK17** og **BF85** (Byggeforskrift 1985). Dette gjør assistenten til en vesentlig mer presis rådgiver som kan svare på spørsmål om begge regelverk.

## Ny kunnskap som legges til

### TEK17 (fra `fire-concept-constants.ts` og memories)
- **Brannklasse-tabell** med alle VTEK-unntak (RK4/3 etasjer/terreng → BKL1, RK5/<800m²/2 etasjer → BKL1, RK6/2 etasjer → BKL1)
- **Branncelle-typer** (komplett liste a–t fra VTEK §11-8)
- **Sprinkler-regler**: Påkrevd for RK6 og RK4 >1 etasje; kompenserende tiltak (doble arealer, redusert brannmotstand)
- **Brannalarm-regler**: Kategori og unntak per RK
- **Rømning**: Fri bredde (0,86m vs 1,16m), gangavstand per RK, trapperomstype (Tr1/2/3), evakuering via vindu
- **Garasje-krav** (fra `garasje-krav.ts`)
- **Brannmotstand-data** (materialbibliotek, komponentadditivmetoden)

### BF85 (fra `bf85-constants.ts`)
- **Bygningsbrannklasse 1–4** per bygningstype (Tabell 31:1, 32:12, 33:2, 34:22, osv.)
- **Brannmotstand per klasse** (Tabell 30:41) – hovedsystem, sekundære, kjeller, trapperom
- **Brannseksjonering** (Tabell 34:23) – arealgrenser med/uten sprinkler/brannventilasjon
- **Mapping BF85 → TEK17** for enkel sammenligning

## Teknisk implementasjon

### Fil som endres
`supabase/functions/tek17-chat/index.ts` – kun system-prompten utvides.

### Endringer i system-prompten
1. **Ny seksjon: BF85 Byggeforskrift 1985** med:
   - Bygningsbrannklasse-tabeller per bygningstype
   - Brannmotstandskrav (Tabell 30:41)
   - Brannseksjoneringsregler (Tabell 34:23)
   - Mapping til TEK17-paragrafer

2. **Utvidet TEK17-seksjon** med:
   - Komplett brannklasse-tabell inkl. VTEK-unntak
   - Branncelle-typer (a–t)
   - Detaljerte sprinkler- og alarmregler
   - Rømningsregler (bredde, gangavstand, trapperomstype)

3. **Oppdaterte retningslinjer**:
   - Assistenten kan nå svare på BF85-spørsmål
   - Tydelig skille mellom TEK17 og BF85 i svar
   - Ved spørsmål om eldre bygg, vurder BF85-krav

### Modellvalg
Bytter til `google/gemini-2.5-flash` for bedre håndtering av den større konteksten (fra ~2000 til ~5000 ord i prompten).

## Omfang
- Én fil endres
- Ingen nye tabeller, komponenter eller ruter
- Edge function redeployes automatisk

