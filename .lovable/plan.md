## Mål

I BF85-modus skal den kursiverte parentesen i kapitteloverskriftene i kap. 3 kun inneholde TEK17-kapittelnavnet når det avviker fra BF85-tittelen. Når navnene er like, skal kun paragrafnummeret stå i parentesen.

## Regler per kapittel

| Kap. | BF85-tittel | TEK17-tittel (§) | Endring |
|------|-------------|------------------|---------|
| 3.1  | Bæreevne og stabilitet | §11-4 Bæreevne og stabilitet | SAMME → endre til `(§ 11-4)` |
| 3.2  | Sikkerhet ved eksplosjon | §11-5 Sikkerhet ved eksplosjon | SAMME → endre til `(§ 11-5)` |
| 3.3  | Avstand mellom bygninger | §11-6 Tiltak mot brannspredning mellom byggverk | ULIK → behold som i dag |
| 3.4  | Brannteknisk oppdeling | §11-7 Brannseksjoner | ULIK → behold |
| 3.5  | Branncelleinndeling | §11-8 Brannceller | ULIK → behold |
| 3.6  | Kledninger og overflater for vegger og tak | §11-9 Materialer og produkters egenskaper ved brann | ULIK → behold |
| 3.7  | Ventilasjon og installasjoner | §11-10 Tekniske installasjoner | ULIK → behold |
| 3.8  | Rømningsvei – generelle krav | §11-11 Generelle krav om rømning og redning | ULIK → behold |
| 3.9  | Brannalarmanlegg og røykvarsler | §11-12 Tilrettelegging for rømning og redning | ULIK → behold |
| 3.10 | Utganger og rømningsveier fra branncelle | §11-13 Utgang fra branncelle | ULIK → behold |
| 3.11 | Trapperom og heissjakt | §11-14 Rømningsvei | ULIK → behold |
| 3.12 | Tilrettelegging for redning av husdyr | §11-15 (samme) | SAMME → allerede `(§11-15)`, ingen endring |
| 3.13 | Slokkingsredskap og slokkingsvann | §11-16 Tilrettelegging for manuell slokking | ULIK → behold |
| 3.14 | Atkomst for brannvesenet | §11-17 Tilrettelegging for slokkemannskap | ULIK → behold |

## Endringer

`src/components/konsept/KonseptPreview.tsx`
- Linje 1112 (kap. 3.1, BF85-grein): `(§11-4 Bæreevne og stabilitet)` → `(§ 11-4)`
- Linje 1333 (kap. 3.2): `(§11-5 Sikkerhet ved eksplosjon)` → `(§ 11-5)`

Ingen endringer i Konsept.tsx, word-export, TOC eller andre kapitteloverskrifter — disse er allerede korrekte (enten ulike titler med navn, eller like titler uten navn).

Endringen gjelder begge dokumenttyper (konsept og tilstandsvurdering), siden overskriften er felles. Dette gir konsistent visning.
