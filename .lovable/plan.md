
## Plan: Gi alle innloggede brukere tilgang til nedlasting

Jeg endrer nedlastingstilgangen slik at «Last ned»-knapper vises for alle brukere som er logget inn, ikke bare for testbrukeren `stianolimstad@gmail.com`.

## Hva som endres

### 1. Oppdatere felles tilgangslogikk

I dag styres nedlasting av denne hooken:

```ts
useCanDownload()
```

Den sjekker nå mot én spesifikk e-postadresse. Jeg endrer den til å returnere `true` når brukeren er innlogget:

```ts
return !!user;
```

Da vil alle innloggede brukere få nedlastingsknappen.

### 2. Gjelder flere dokumenttyper

Siden `useCanDownload` brukes flere steder, vil endringen gjelde konsekvent for dokumentnedlasting i appen, blant annet:

- Brannkonsept
- KS-gjennomgang
- Kvalitativ analyse / fraviksdokumentasjon
- Lagring av brannfarlig stoff

Dette samsvarer med ønsket regel:

```text
Er brukeren logget inn, skal brukeren kunne laste ned.
```

### 3. Beholde skjuling for ikke-innloggede brukere

Brukere som ikke er logget inn skal fortsatt ikke se nedlastingsknappen på steder der appen krever innlogging.

### 4. Oppdatere prosjektminne

Jeg oppdaterer prosjektregelen som i dag sier at Word/PDF-nedlasting er låst til én testbruker, slik at den nye regelen blir:

```text
Alle innloggede brukere kan laste ned Word/PDF-dokumenter.
```

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig:

- `src/hooks/useCanDownload.ts`
  - fjerner hardkodet e-postbegrensning
  - returnerer `true` for alle innloggede brukere

Eventuelt kontrollerer jeg at nedlastingsknappen for brensellagring fortsatt ligger bak `canDownload`, slik at den automatisk følger den nye regelen.

## Ingen databaseendring

Dette krever ingen endringer i databasen eller autentiseringsoppsettet.
