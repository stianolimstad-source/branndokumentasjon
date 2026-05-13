## Mål
Den røde info-boksen «✓ Følgende krav er automatisk inkludert i rapporten» under kap 3.7 viser i dag samme punktliste uavhengig av regelverk. For et BF85-tilstandsvurderingsprosjekt (f.eks. Bøylefoss kraftstasjon) listes punkter som faktisk ikke skrives ut i rapporten, og enkelte BF85-punkter mangler. Boksen skal speile rapporten 1:1.

## Hva rapporten faktisk inneholder for BF85 (kap 3.7)
Fra `KonseptPreview.tsx` (linjene 3807–3848) genereres kun disse radene for BF85:

1. **«:1332 Avtrekk»** – kun når `formData.bf85_1332_avtrekk` er på (kjøkken/WC i egne kanaler m.m.).
2. **«Ventilasjonsanlegg»** – kun når `formData.ventilasjonRelevant`. Punktliste:
   - Ventilasjonskanal gjennom brannskillende bygningsdel.
   - Innfesting og oppheng for kanaler/utstyr.
   - Avtrekk fra komfyr i egen kanal.
   - Materialer i klasse A2-s1,d0.
   - `ventKrav5`: avtrekk storkjøkken/frityr EI 30 A2-s1,d0.
   - `ventKrav6`: avtrekk kjøkken i boenhet EI 15 A2-s1,d0.
   - `ventKrav7` (RK4 / boligbygg RK6): småhus, stål-/aluminium-kanal.
   - `ventKrav8` (samme): småhus, klasse E-kanal.
   - `ventKrav9`: brannspjeld i seksjoneringsvegg.
3. **«Ventilasjonsanlegg er ikke installert»** – når `ventilasjonRelevant` er av.

Vann/avløp, rør- og kanalisolasjon og elektriske installasjoner skrives **ikke** ut i BF85-rapporten – de finnes kun i TEK17-grenen.

## Endring i `src/pages/Konsept.tsx` (info-boks ~linje 7634–7696)
Splitt innholdet i en BF85-gren og en TEK17-gren:

### BF85-gren
- Behold den innledende italic-noten om at TEK17 §11-10 legges til grunn som vurderingsgrunnlag.
- List kun:
  - Hvis `bf85_1332_avtrekk`: tre punkter for «:1332 Avtrekk» (kjøkken/WC i egne kanaler; egne kanaler en etasje opp; vindu/ytterdør for utlufting i bygninger med naturlig avtrekk).
  - Hvis `ventilasjonRelevant`: fire faste punkter (kanal gjennom brannskillende bygningsdel, innfesting/oppheng, avtrekk fra komfyr i egen kanal, materialer A2-s1,d0) + de betingede `ventKrav5/6/7/8/9` med samme tekst som i preview.
  - Hvis `!ventilasjonRelevant`: ett punkt «Ventilasjonsanlegg er ikke installert».
- Ikke vis vann/avløp-, rør-/kanalisolasjon- eller elektrisk-punkter (selv om checkboksene står på, siden de ikke kommer ut i rapporten under BF85). Ev. kan disse seksjonene også skjules som UI-valg, men det er utenfor scope her.
- Fallback når verken `bf85_1332_avtrekk` eller `ventilasjonRelevant` er valgt: «Velg relevante tekniske installasjoner ovenfor».

### TEK17-gren
- Behold dagens liste uendret (ventilasjon, vann/avløp, rør-/kanalisolasjon, elektrisk inkl. PII/PIII-logikken).

## Andre filer
- `src/components/konsept/KonseptPreview.tsx`: ingen endring – brukes som fasit.
- `src/lib/word-export-chapter3.ts`: ingen endring (Word-eksporten følger allerede preview-logikken for BF85).

## Akseptansekriterier
- I et BF85-prosjekt med `ventilasjonRelevant=true` viser den røde boksen nøyaktig de fire faste ventilasjonspunktene + aktive `ventKrav5–9`, og ev. `:1332 Avtrekk`-punkter når den haken er på.
- I et BF85-prosjekt med `ventilasjonRelevant=false` viser boksen kun «Ventilasjonsanlegg er ikke installert» (samme rad som rapporten).
- TEK17-prosjekter ser samme boks som i dag.
