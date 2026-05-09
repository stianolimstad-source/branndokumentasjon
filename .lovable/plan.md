## Oppdatere abonnementssiden med redusert pris-info

### Bakgrunn
Programmet er under utvikling og prisen er derfor redusert. Brukeren skal informeres tydelig om at dagens pris er midlertidig, og hva den ordinære prisen blir.

### Endringer

#### 1. Info-banner under tittel
Legge til et synlig info-alert under `<h1>Abonnement</h1>` på `src/pages/Abonnement.tsx` med tekst:
> **Introduksjonspris** — Programmet er under utvikling. Prisen vil øke til 1 000 kr per måned per bruker når programmet er ferdig (forventet høsten 2027).

#### 2. Vis fremtidig pris på priskortene
På begge priskortene (månedlig og årlig), ved siden av dagens pris, vise den fremtidige ordinære prisen med gjennomstreking for å tydeliggjøre rabatten:
- Månedlig: ~~1 000 kr~~ → 500 kr
- Årlig: ~~10 000 kr~~ → 5 000 kr (antatt, basert på samme forhold)

#### 3. Oppdatere bunntekst
Evt. justere den eksisterende bunnteksten for å forsterke at dagens pris er introduksjonspris.

### Tekniske detaljer
- Kun frontend-endring i `src/pages/Abonnement.tsx`
- Bruker eksisterende `<Alert>`-komponent fra `@/components/ui/alert`
- Ingen database- eller Stripe-endringer nødvendig
- Prisene i Stripe (500/5000) beholdes som de er — dette er ren informasjon til brukeren