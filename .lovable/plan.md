## Mål
Skjul «Send til KS» og «Oppdater KS» for alle brukere unntatt eierne (definert i `useIsFullAccess`), siden funksjonen ikke er ferdig.

## Endring

**`src/pages/Konsept.tsx`** (samme side håndterer både brannkonsept og tilstandsvurdering):
- Importer `useIsFullAccess` fra `@/hooks/useIsFullAccess`.
- Hent `const isFullAccess = useIsFullAccess();` i komponenten.
- Pakk inn `<SendToKSDialog />` (linje 10486) og `<UpdateKSButton />` (linje 10493) i `{isFullAccess && ( ... )}` slik at kun eier-e-postene (`stianolimstad@gmail.com` m.fl.) ser knappene. Andre brukere ser fortsatt «Lagre endringer».

## Verifisering
- Logget inn som eier: begge KS-knappene synlige under «Lagre endringer» på både `/konsept` og `/tilstandsvurdering`.
- Logget inn som annen bruker: kun «Lagre endringer» vises; ingen referanse til KS-funksjonen.
