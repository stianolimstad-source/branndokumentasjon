## Endring av terskel-logikk i `src/lib/trafo-eksplosjon.ts`

### 1. Tank-status: Bytt til margin-baserte soner
**Nåværende:**
- `error`: `E_eff > tankkapasitet * 1.3`
- `warning`: `E_eff > tankkapasitet`
- `ok`: ellers (inkl. eksakt lik kapasitet)

**Ny logikk (margin = E_eff / tankkapasitet):**
- `error`: margin ≥ 1.30
- `warning`: margin ≥ 0.85 og < 1.30
- `ok`: margin < 0.85

Dette gir en "gul sone" fra 85 % til 130 % av tankkapasiteten, som reflekterer usikkerheten i forsøksdataene. Når buenergi er eksakt lik kapasiteten, blir det nå `warning` (margin = 1,0), ikke `ok`.

**Tekstoppdateringer:**
- `ok`-teksten beholdes med effektiv buenergi under elastisk kapasitet.
- `warning`-teksten justeres for å reflektere at det er innenfor "gul sone" (≥ 85 % av kapasiteten).
- `error`-teksten beholdes (margin ≥ 1,3).

### 2. Trykkbølge-status: Hev warning-terskel fra 10 % til 30 %
**Nåværende:**
- `error`: sannsynlighet > 50 %
- `warning`: sannsynlighet > 10 %
- `ok`: ellers

**Ny logikk:**
- `error`: sannsynlighet > 50 % (uendret)
- `warning`: sannsynlighet > 30 % (endret fra 10 %)
- `ok`: ellers

Dette gjør varslingen mer konsistent med faglige vurderinger.

### 3. Fil
Kun `src/lib/trafo-eksplosjon.ts` berøres (linje 96–104 og 121). Ingen andre filer endres.