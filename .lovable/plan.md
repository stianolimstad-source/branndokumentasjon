## Endring

Fjern alle "– B 30 godtas i praksis" / "– B 30 S godtas i praksis"-merknader fra BF85 dørkrav-tabellen. Verdien skal kun vise selve dørklassen (f.eks. `A 30 (EI 30-A2s1,d0-Sa)`).

### Filer

1. **`src/components/konsept/KonseptPreview.tsx`** (`bf85DorKravMap`, ~linje 2049–2060): Fjern " – B 30 godtas i praksis" og " – B 30 S godtas i praksis" fra følgende strenger:
   - `bf85_korridor_fri_luft` (bbk1, bbk2)
   - `bf85_branncelle_korridor` (bbk1, bbk2)
   - `bf85_branncelle_branncelle` (bbk1, bbk2)
   - `bf85_kjeller_trapperom` (bbk3, bbk4)

2. **`src/lib/word-export-chapter3.ts`** (samme map, ~linje 590–598): Speile samme endring.

Ingen andre endringer.
