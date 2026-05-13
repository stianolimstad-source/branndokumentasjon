## Mål
Oppdatere alle info-bokser med teksten «✓ Følgende krav er automatisk inkludert i rapporten» i tilstandsvurderingsskjemaet (`Konsept.tsx`) slik at BF85-tilstandsvurderinger viser korrekte BF85-referanser og terminologi i stedet for TEK17/VTEK-termer.

## Seksjoner som skal oppdateres

### 3.1 Bæreevne og stabilitet (~linje 4289)
- Eksisterer allerede `regelverk === "BF85"`-tilpasning for bygningsbrannklasse.
- **Endring:** Fjerne TEK17-spesifikk tekst «Krav til bærende hovedsystem, sekundære bærende deler, trapperom og heissjakt» → erstatt med generisk «Krav til bærende konstruksjoners brannmotstand iht. BF85 Tabell 30:41».
- **Endring:** Fjerne VTEK-referansen i unntakspunktet for BF85.

### 3.2 Sikkerhet ved eksplosjon (~linje 4411)
- **Endring:** Erstatte «Preaksepterte ytelser iht. VTEK § 11-5» med «Krav til tekniske rom, fyrrom og ildsted iht. BF85 Kap. 30:33 og Kap. 49».
- **Endring:** Når eksplosjon ikke er relevant: standardtekst om at krav til tekniske rom likevel må vurderes.

### 3.3 Avstand mellom bygninger (~linje 4657)
- **Endring:** Erstatte «brannvegg/branncellevegg» med «brannvegg» for BF85.
- **Endring:** Tekst tilpasset BF85 Kap. 30:32.

### 3.4 Brannteknisk oppdeling (~linje 5212)
- **Endring:** Erstatte «seksjoneringsvegger (brannvegg)» med «brannvegg/branndekke» for BF85.
- **Endring:** Fjerne «brannbelastningsgrenser» som TEK17-spesifikt begrep.

### 3.5 Brannceller (~linje 7080)
- **Endring:** Erstatte generisk «branncelle-typer» med BF85-spesifikke branncellekrav (Kap. 30:63–64).
- **Endring:** Dørkrav tilpasset BF85s terminologi.

### 3.6 Materialer og produkter (~linje 7349)
- **Endring:** Erstatte alle forekomster av «brannklasse» med «bygningsbrannklasse» for BF85.
- **Endring:** Erstatte «risikoklasse» med «bygningsbrannklasse» eller «bygningstype» for BF85.
- **Endring:** Fjerne RK6-referanser som TEK17-spesifikt.

### 3.7 Tekniske installasjoner (~linje 7580)
- **Endring:** Erstatte TEK17 § 11-10-referanser med BF85 Kap. 47 for ventilasjonskrav.
- **Endring:** Beholde TEK17-kravene som utgangspunkt (som nylig avtalt), men justere overskriften.

### 3.8 Rømning og redning (~linje 7847)
- Generelt OK, men kan justeres til «Krav til rømningsvei iht. BF85 Kap. 30:7».

### 3.9 Alarm og slokking (~linje 8535)
- **Endring:** Erstatte «risikoklasse» med «bygningsbrannklasse/bygningstype» for BF85.
- **Endring:** Alarmkrav tilpasset BF85 Kap. 31–39 (bygningstype-spesifikt).

### 3.10 Utgang fra branncelle (~linje 9032)
- **Endring:** Erstatte «risikoklasse og brannklasse» med «bygningsbrannklasse og bygningstype».

### 3.11 Trapperom og heissjakt (~linje 9203)
- **Endring:** Erstatte RK3/RK5/RK6-referanser med BF85-bygningsbrannklasse (1–4).
- **Endring:** Erstatte BKL1/BKL2/BKL3 med bygningsbrannklasse 1–4.
- **Endring:** Erstatte UPS-krav med BF85-spesifikke krav til avbruddsfri strøm.

### 3.12 Husdyr (~linje 9293)
- OK som den er, evt. justere overskrift til BF85 Kap. 39.

### 3.13 Manuell slokking (~linje 9410)
- **Endring:** Erstatte «NS-EN»-referanser med BF85-relevante referanser (Kap. 30:91).
- **Endring:** Fjerne RK1-referanse.

### 3.14 Slokkemannskap (~linje 9555)
- **Endring:** Tekst tilpasset BF85 Kap. 30:92/94/95.

### 3.15 Branninstruks
- **Endring:** Tekst tilpasset BF85s krav til brannvernleder og brannøvelser.

## Tekniske detaljer
- Alle endringer gjøres i `src/pages/Konsept.tsx` ved å legge til betingede `formData.regelverk === "BF85"`-ternary der hvor TEK17-tekst nå dominerer.
- Der BF85-gren allerede finnes (f.eks. 3.1), suppleres med fjerning av gjenværende TEK17-referanser.
- Ingen databaseendringer nødvendig.
- Tilsvarende oppdateringer gjøres i `src/lib/word-export-chapter3.ts` for Word-eksport.
