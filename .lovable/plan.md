

## Plan: Forbedre generert tekst i seksjon 3.8 for flere bygningsdeler

### Problem
«Generer tekst»-funksjonen i seksjon 3.8 bruker kun hovedbygningsdelens risikoklasse og etasjer for å bestemme trapperomstype og evakueringsstrategi. Den ignorerer ekstra bygningsdeler i `formData.bygningsdeler`.

### Endring i `src/pages/Konsept.tsx` (linje 7057–7121)

Oppdatere tekstgenereringen slik at:

1. **Innledning** beskriver alle bygningsdeler:
   - «Bygget inneholder Bygningsdel 1 (Kontorbygg, RK3) og Bygningsdel 2 (Forsamlingslokale, RK5).»

2. **Trapperomstype** beregnes per bygningsdel og samles:
   - Iterere gjennom alle deler (primær + `bygningsdeler`) og beregne trapperomstype basert på hver dels risikoklasse og etasjer.
   - Vis per del: «Bygningsdel 1 (Kontorbygg): Tr2 (lukket trapperom)» osv.
   - Bruk strengeste trapperomstype for felles tekst om trapperom.

3. **Evakueringsstrategi** tilpasses:
   - Sjekk om noen del har RK6/sykehus – da inkluderes horisontal forflytningsstrategi for den delen.
   - Andre deler får standard evakueringstekst med sin trapperomstype.

4. **Seksjonering og øvrig** logikk beholdes som i dag, men seksjoneringsteksten nevner at deler med ulik risikoklasse er adskilt med branncelleskille/seksjoneringsvegg.

### Eksempel på generert tekst (multi-part)
```
Bygget inneholder Bygningsdel 1 (Kontorbygg, RK3) og Bygningsdel 2 (Forsamlingslokale, RK5).
Kontorbygget har 4 etasjer. Forsamlingslokalet har 2 etasjer.

Bygningsdel 1 (Kontorbygg, RK3): Trapperom utføres som Tr2 (lukket trapperom).
Bygningsdel 2 (Forsamlingslokale, RK5): Trapperom utføres som Tr2 (lukket trapperom).

Bygget har flere trapper og utganger. Maksimal avstand til nærmeste utgang er 30 m.

Evakuering skjer via Tr2 (lukket trapperom) via rømningsveier til det fri.
```

### Omfang
Kun én fil endres: `src/pages/Konsept.tsx`, «Generer tekst»-knappens onClick-handler (ca. linje 7057–7121).

