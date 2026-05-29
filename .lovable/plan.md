## Mål

Erstatt den enkle referansetabellen i kap 3.5 (§ 11-8 Brannceller, linje 7571–7595 i `src/pages/Konsept.tsx`) med tre separate Collapsible-komponenter. Hver tabell er et selvstendig arbeidsverktøy i editoren og skal aldri vises i forhåndsvisning eller Word-eksport.

## Endringer – `src/pages/Konsept.tsx`

### 1. Fjern eksisterende enkel tabell (linje 7571–7595)
Slett dagens Collapsible med 3 rader (Branncellebegrensende vegg/dekke, Dør, Vindu).

### 2. Legg til Collapsible 1: Branncellebegrensende konstruksjoner
Plassering: etter hovedinnholdet, før TilstandsvurderingPanel.

```text
Trigger: «Vis referansetabell – branncellebegrensende konstruksjoner (kun i editor)»
Tabell (5 rader × BKL 1/2/3):
- Vegger og dekker mellom branncelle                     | EI 30 [B 30] | EI 60 [B 60] | EI 90 A2-s1,d0 [A 90]
- Vegger og dekker mellom branncelle og rømningsvei    | EI 30 [B 30] | EI 60 [B 60] | EI 90 A2-s1,d0 [A 90]
- Vegger og dekker mellom branncelle og trapperom      | EI 30 [B 30] | EI 60 [B 60] | EI 90 A2-s1,d0 [A 90]
- Heissjakt (egen branncelle)                          | EI 60 [B 60] | EI 60 [B 60] | EI 90 A2-s1,d0 [A 90]
- Vegger og dekker som omslutter sjakt for kabler og rør| EI 30 [B 30] | EI 60 [B 60] | EI 90 A2-s1,d0 [A 90]
Kilde: VTEK § 11-8 Tabell 1.
```

Innpakket i `{formData.regelverk !== "BF85" && (...)}`.

### 3. Legg til Collapsible 2: Dørkrav per situasjon og brannklasse

```text
Trigger: «Vis referansetabell – dører i branncellebegrensende konstruksjoner (kun i editor)»
Tabell (10 rader × BKL 1/2/3):
- Dør mellom branncelle og branncelle          | EI₂ 30-Sa [B 30 S] | EI₂ 30-Sa [B 30 S] | EI₂ 60-Sa [B 60 S]
- Dør fra branncelle til rømningsvei           | EI₂ 30-Sa [B 30 S] | EI₂ 30-Sa [B 30 S] | EI₂ 60-Sa [B 60 S]
- Dør fra branncelle til Tr 1 (vanlig trapperom)| EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]| EI₂ 60-CSa [B 60 CS]
- Dør fra branncelle til Tr 2 (sluse)          | EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]
- Dør mellom korridor og Tr 1                  | EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]
- Dør mellom sluse og Tr 2                     | EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]
- Dør til mellomliggende rom ved Tr 3          | EI₂ 60-CSa [B 60 CS]| EI₂ 60-CSa [B 60 CS]| EI₂ 60-CSa [B 60 CS]
- Dør til heissjakt                            | E 30 [F 30]        | E 30 [F 30]        | E 30 [F 30]
- Dør til kjeller fra trapperom                | EI₂ 60-CSa [B 60 CS]| EI₂ 60-CSa [B 60 CS]| EI₂ 60-CSa [B 60 CS]
- Dør til loft fra trapperom                   | EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]| EI₂ 30-CSa [B 30 CS]
```

Under tabellen: forklaringsavsnitt `<p className="text-xs text-muted-foreground mt-2">…</p>`:
> S = røyktett (Sa eller Sm). C = selvlukkende. Eksempel: EI₂ 30-CSa = EI₂ 30 + selvlukkende + røyktett. For boliger i RK 4 mellom branncelle og Tr 1 kan «C» (selvlukkende) utgå, men dette må vurderes per prosjekt.

Kilde: VTEK § 11-8 Tabell 2.

### 4. Legg til Collapsible 3: Spesielle rom og krav

```text
Trigger: «Vis referansetabell – tekniske rom og spesielle krav (kun i editor)»
Tabell (1 kolonne «Krav (alle brannklasser med mindre annet er nevnt)»):
- Fyrrom for fyringsanlegg ≥ 100 kW      | EI 60 A2-s1,d0 [A 60] – egen branncelle
- Søppelrom                               | EI 60 A2-s1,d0 [A 60] – egen branncelle, vegger og dør
- Batterirom for stasjonært batterianlegg | EI 60 A2-s1,d0 [A 60] – egen branncelle
- Aggregat-/nødstrømrom                   | EI 60 A2-s1,d0 [A 60] – egen branncelle
- Garasje i bolig (inntil 50 m² i samme bruksenhet) | Ikke nødvendigvis egen branncelle, jf. § 11-8 ledd 4
- Garasje i bolig (over 50 m² eller i annen bruksenhet) | EI 30 / EI 60 / EI 90 avhengig av BKL
- Hulrom i konstruksjoner                  | Må deles opp brannteknisk slik at branncellen ikke utvider seg via hulrom
- Innvendig nedforet himling i rømningsvei | Himling EI 10 eller kledning K₂ 10 A2-s1,d0 [K1-A], jf. § 11-9
```

Kilde: VTEK § 11-8 ledd 2–6 og tilhørende preaksepterte ytelser.

### 5. Teknisk mønster
Alle tre bruker samme JSX-struktur som prompt 55:

```tsx
<Collapsible>
  <CollapsibleTrigger className="text-xs text-primary hover:underline mt-2">
    {tittel}
  </CollapsibleTrigger>
  <CollapsibleContent>
    <table className="w-full text-xs border mt-2">…</table>
    <p className="text-[11px] text-muted-foreground mt-1 italic">Kilde: …</p>
  </CollapsibleContent>
</Collapsible>
```

Plassert under hverandre nederst i kap 3.5, etter hovedinnholdet og før `renderTilstandPanel("3_5")` + `FravikForParagraf`.

## Ikke endres

- `KonseptPreview.tsx` – ingen endring
- `word-export-chapter3.ts` – ingen endring
- BF85-grenene i seksjon 3.5 – uberørt
- All annen conditional hovedtekst i kap 3.5 – beholdes

## Verifikasjon

1. TEK17-prosjekt: kap 3.5 viser tre Collapsibles med tydelige titler.
2. Klikk på hver – riktig tabell åpner med riktig innhold.
3. Forhåndsvisning: ingen tabeller synlige.
4. Word-eksport: ingen tabeller med.
5. BF85-prosjekt: ingen av Collapsibles vises.