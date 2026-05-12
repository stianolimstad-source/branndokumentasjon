## Endring: Velg mellom å etablere brannvegg/seksjoneringsvegg likevel – eller dokumentere fravik i tilstandsvurderingen

I dag, hvis bruker huker av at brannvegg/seksjoneringsvegg «mangler», vises et fast rødt avvik i kap. 3.4 og kravene under listes opp uansett. Vi bygger nå inn et reelt valg: enten **etableres veggen likevel** (som tiltak), eller så beskrives **fraviket i tilstandsvurderingen** på slutten av kapittelet.

### Inputside (`src/pages/Konsept.tsx`, kap. 3.4 ca. linje 4604–4645)

Beholder dagens ytre checkbox («Brannvegg/seksjoneringsvegg er ikke etablert i bygget»). Når den er avhuket, viser vi i tillegg en **ny underliggende checkbox**:

> «Brannvegg/seksjoneringsvegg etableres likevel som tiltak»  
> *(Huk av dersom vi velger å etablere veggen til tross for at den mangler. Ellers dokumenteres dette som fravik i tilstandsvurderingen nederst i kapittelet.)*

Ny formData-flagg:
- `etablererSeksjoneringLikevel: false`

Adferd basert på de to flaggene (kun i tilstandsvurdering):

| `manglerSeksjonering` | `etablererSeksjoneringLikevel` | Resultat i kap. 3.4 |
|---|---|---|
| false | – | Som i dag, ingen avvik. |
| true | **true** | Vises som **tiltak** i tabelltoppen («Brannvegg/seksjoneringsvegg etableres som nytt tiltak …»), og kravene under dokumenteres som normalt. Ingen rødt avvik. Ingen automatisk tekst i tilstandspanelet. |
| true | false | Ingen rødt avviksrad øverst. Kravene under dokumenteres som normalt (slik at det er sporbart hva som skulle vært). Fraviket beskrives via det eksisterende **tilstandspanelet** for 3.4 nederst i kapittelet (forhåndsutfylt forslag i `beskrivelse`-feltet hvis tomt). |

Kommentar/begrunnelse-feltet (`manglerSeksjoneringKommentar`) beholdes og brukes:
- ved «etableres likevel» → tas inn som tilleggsbeskrivelse i tiltaks-raden.
- ved fravik → tas inn i tilstandspanelets beskrivelse-felt (eller vises i tillegg).

`useEffect`-resetten utvides slik at `etablererSeksjoneringLikevel` også nullstilles når `manglerSeksjonering` blir `false` eller når kravet bortfaller.

### Tilstandspanel for 3.4

Sikre at `renderTilstandPanel("3_4")` faktisk er rendret nederst i kap. 3.4 (slik som `renderTilstandPanel("3_3")` for kap. 3.3). Hvis det allerede er der: ingen endring. Hvis ikke: legg det inn rett før `</SectionCollapsible>` for 3.4.

Når `manglerSeksjonering === true && etablererSeksjoneringLikevel === false` og `tilstandsvurderinger["3_4"].beskrivelse` er tom, prefyll automatisk en setning som:
> «Bygget mangler påkrevd {brannvegg|seksjoneringsvegg} iht. {BF85 Kap. 30:6 | TEK17 § 11-7}. {evt. manglerSeksjoneringKommentar}»  
…og foreslå `grad = "tg3"`. Bruker kan endre fritt.

### Rapport / preview (`src/components/konsept/KonseptPreview.tsx`, ca. linje 1413–1433)

Oppdater den eksisterende avviksraden:

- Vises kun når `manglerSeksjonering && !etablererSeksjoneringLikevel` → **fjernes**, fordi fraviket nå håndteres av `TilstandTableRow` for 3_4 nederst i kapittelet (samme mønster som 3.3).
- Når `manglerSeksjonering && etablererSeksjoneringLikevel` → vis i stedet en nøytral **tiltaksrad** (grønn/standard, ikke rød):
  - Forhold: «Nytt tiltak – {brannvegg|seksjoneringsvegg}»
  - Løsning: «{Brannvegg|Seksjoneringsvegg} er ikke etablert i dag, men etableres som nytt tiltak iht. {regelverkshenvisning}. {manglerSeksjoneringKommentar}»
  - Ansvar: «RIBr»

Sørg for at `TilstandTableRow` for 3_4 fortsatt kommer på slutten av kap. 3.4-blokken i previewet (legges til hvis den mangler, slik at fraviket faktisk kommer «i slutten av kapittelet» som ønsket).

### Hva endres ikke
- Selve kravberegningene (Skole/Tabell 34:23/TEK17 areal+brannenergi) er uendret.
- Konseptmodus uendret – nye flagg er kun synlig i tilstandsvurdering.
- Word-eksport følger preview automatisk.
