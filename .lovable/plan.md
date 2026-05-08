## Mål
Lås tilgang til de fire seksjonene **Tilbud**, **Oppdragsbekreftelse**, **Sikkerhetsrutiner** og **Eksempelkatalog** for alle brukere unntatt `stianolimstad@gmail.com`. Ulåste brukere skal se et tydelig hengelås-overlay på kortene på forsiden, og blir blokkert fra rutene.

## Endringer

### 1. Ny hook: `src/hooks/useIsFullAccess.ts`
Returnerer `true` kun hvis innlogget bruker har e-post `stianolimstad@gmail.com`. Brukes som sentral porten for alle "under utvikling"-funksjoner.

```ts
export const useIsFullAccess = () => {
  const { user } = useAuth();
  return user?.email?.toLowerCase() === "stianolimstad@gmail.com";
};
```

### 2. Ny komponent: `src/components/LockedFeatureCard.tsx`
Wrapper rundt et eksisterende `Card` som legger på:
- Et halvtransparent overlay
- Stort sentralt `Lock`-ikon (lucide-react)
- Liten tekst: "Under utvikling"
- Fjerner `cursor-pointer` og hindrer klikk (ingen `<Link>`-wrapping)
- Tooltip ved hover: "Tilgang begrenset under utvikling"

### 3. `src/pages/Index.tsx`
- Importer `useIsFullAccess` og `LockedFeatureCard`.
- Marker disse fire features som `locked: true` i features-array: Tilbud, Oppdragsbekreftelse, Sikkerhetsrutiner, Eksempelkatalog.
- I render-loopen: hvis `feature.locked && !isFullAccess`, render kortet uten `<Link>` med hengelås-overlay i stedet.

### 4. Rute-beskyttelse (defense-in-depth)
Hvis bruker likevel navigerer direkte til `/tilbud`, `/oppdragsbekreftelse`, `/sikkerhetsrutiner`, `/eksempelkatalog`, `/eksempelkatalog/branncellevegger` eller `/eksempelkatalog/brannfarlige-stoffer`:
- Vis en låst tilstand (stort hengelås-ikon, tekst "Denne delen er under utvikling og krever utvidet tilgang", knapp tilbake til forsiden).

Implementeres ved å legge en sjekk øverst i hver av de fire side-komponentene (eller en felles `<RequireFullAccess>`-wrapper i `App.tsx` rundt rutene). Anbefaler felles wrapper for å unngå duplisert kode.

### 5. Det som IKKE endres
- Ingen endringer i RLS, database, eller backend — dette er kun en UI-gating for synlighet/test-modus. (Si fra hvis du vil at jeg også skal håndheve på serversiden senere.)
- Andre seksjoner (Brannkonsept, Tilstandsvurdering, Verktøy, Fravik, Brannfarlig lagring, m.fl.) forblir uendret.
- E-postsjekken er hardkodet — enkel å utvide til en liste senere når flere skal få full tilgang.

## Resultat
- `stianolimstad@gmail.com` ser alt som før.
- Alle andre (innloggede og ikke-innloggede) ser hengelås-overlay på de fire kortene på forsiden, og en låst skjerm hvis de prøver å navigere direkte til rutene.