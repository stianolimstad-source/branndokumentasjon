## Visuell oppgradering av tilstandsvurderingspanelet

### Bakgrunn
Panelet nederst i hvert kapittel (komponenten `TilstandsvurderingPanel`) fremstår som uformelt på grunn av:
- Stiplet kant (`border-dashed`)
- Svak, gjennomsiktig bakgrunn (`bg-amber-50/50`)
- Liten overskriftstekst (`text-xs`)
- Ingen ikon eller visuell anker
- Mangel på skygge/dybde

### Forslag til endringer

1. **Kant og bakgrunn**
   - Erstatt `border-dashed` med `border-solid`
   - Tykkere venstre kantstripe i en sterkere farge (f.eks. 4 px amber/oransje) som visuelt anker
   - Sterkere bakgrunn: `bg-amber-100` (lys modus) / `bg-amber-950/40` (mørk modus)

2. **Overskriftsstripe**
   - Legg til en tydelig topprad/header med bakgrunnsfarge
   - Overskrift: "Tilstandsvurdering – {kapittel}" i normal/large størrelse
   - Ikon (f.eks. `ClipboardCheck` eller `ShieldAlert`) for å signalisere at dette er en viktig vurdering

3. **Kort-stil**
   - Bruk `shadow-md` for dybde
   - Rundere hjørner (`rounded-xl`)
   - Padding økes litt for luftigere inntrykk

4. **Underkategorier**
   - "Avvik som krever aktive tiltak" beholdes med rød tone, men med solid kant og egen header
   - "Avvik som kan fraviksbehandles" beholdes med amber-tone, men med solid kant og egen header

### Tekniske detaljer
- Fil: `src/components/konsept/TilstandsvurderingPanel.tsx`
- Endringer er rent CSS/Tailwind – ingen logikkendringer
- Mørk/modus-støtte beholdes
- Ingen endringer i datastruktur eller lagring

### Resultat
Panelet vil fremstå som et tydelig, viktig element – nesten som et eget "kort" eller " dokument-seksjon" – i stedet for et uformelt stiplefelt.