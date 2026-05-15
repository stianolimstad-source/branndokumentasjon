## Plan

1. Oppdater importfunksjonen for ROS slik at `tittel` ikke lenger tas fra AI-responsens lange tekstfelt, men settes konsekvent fra `sarbarhet` ved import.
2. Juster AI-instruksen i samme importflyt så modellen blir bedt om å bruke kort tittel basert på sårbarhet, ikke `sårbarhet – hendelse`.
3. Behold fallback når `sarbarhet` mangler, men prioriter kortest meningsfulle verdi slik at tittelen fortsatt blir kort og redigerbar i editoren.
4. Verifiser at importoversikten og ROS-editoren viser den korte tittelen uten at hendelsesbeskrivelsen går tapt i `hendelse`-feltet.

## Teknisk

- Fil: `supabase/functions/parse-ros-analysis/index.ts`
- Endringer:
  - Endre promptregelen for `tittel` til å bruke kun sårbarhet som kort importtittel.
  - Endre sanitizingen slik at vi ikke stoler på `h.tittel` fra modellen hvis den er lang/komponert, men bygger tittelen selv med prioritet `sarbarhet -> hendelse`.
  - La full tekst fortsatt ligge i `hendelse`/`beskrivelse`.
- Forventet effekt:
  - Eksempel: importert rad får `tittel = "Trafo 1"` i stedet for en lang sammenslått streng.
  - Tittelen er fortsatt redigerbar etter import i ROS-analysen.