## Vis hjelpetekst når TG 0 velges

### Bakgrunn
Når brukeren velger "TG 0 – Ingen avvik" i feltet **Samlet tilstandsgrad for seksjonen** i `TilstandsvurderingPanel`, skal det vises en informativ tekst som bekrefter at det ikke er funnet avvik på dette området.

### Endring
**Fil:** `src/components/konsept/TilstandsvurderingPanel.tsx`

- Under `<Select>`-komponenten for "Samlet tilstandsgrad for seksjonen", legg til betinget rendring:
  - Hvis `data.grad === "tg0"`, vis en `<p>`- eller Alert-komponent med teksten:
    - *"Det er ikke funnet noen avvik på dette området."*
- Stil: diskret, men synlig – f.eks. `text-green-700` med en liten ikon eller bare som en kort informasjonstekst under select-feltet.

### Det som ikke endres
- Datastruktur, logikk for avvik, kategorier, bildeopplasting eller rapporteksport.
