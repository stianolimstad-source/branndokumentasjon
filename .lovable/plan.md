

# Forbedre TEK17-assistentens system-prompt

## Problem
Assistenten gir for lange og upresise svar. Ved spørsmål om rømningsvindu fra soverom i kjellerleilighet burde svaret vært kort og direkte: **"Nei"** – etterfulgt av en kort forklaring om at kravet gjelder utgang til det fri fra branncellen (leiligheten), ikke fra enkeltrom.

## Endringer

### 1. Oppdatere system-prompt i `supabase/functions/tek17-chat/index.ts`

**Retningslinjer for svar** – legge til regler om:
- Start alltid med et kort, direkte svar (ja/nei) før forklaring
- Hold svar korte og presise – maks 3-5 setninger med mindre brukeren ber om mer
- Unngå å gjenta spørsmålet tilbake

**§11-11 Rømning** – presisere:
- Krav til rømning gjelder fra **branncellen** (f.eks. boenheten), IKKE fra enkeltrom
- Det er INGEN krav til rømningsvindu fra soverom i TEK17
- Hovedadkomst (inngangsdør) er normalt tilstrekkelig som utgang til det fri fra en boenhet i BKL1
- For boliger i BKL1 er det tilstrekkelig med én utgang til det fri dersom branncellen har direkte utgang, eller vindu som brannvesenet kan nå med høydemateriell

### 2. Deploy edge function
Deploye oppdatert `tek17-chat` funksjon.

## Teknisk omfang
- Én fil endres: `supabase/functions/tek17-chat/index.ts`
- Kun system-prompt oppdateres, ingen kodelogikk

