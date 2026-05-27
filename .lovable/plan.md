## Mål

Bygg om konsekvens-UI i hendelse-accordion (`src/pages/RosAnalyse.tsx`) fra én enkelt K-Select (før/etter) til en liste over `KonsekvensVurdering` per dimensjon. Sannsynlighet, "Beskrivelse av risiko / konsekvens" og "Beskrivelse av risiko og konsekvens etter tiltak" beholdes uendret.

## Endringer i `src/pages/RosAnalyse.tsx`

### Imports
- Legg til `migrerHendelse`, `KonsekvensVurdering` fra `@/components/ros/RosPreview`.
- Legg til `DIMENSJON_NAVN`, `ALLE_DIMENSJONER`, `KonsekvensDimensjon` fra `@/lib/ros-risk-criteria`.
- Legg til `Plus`-ikon fra `lucide-react` (Trash2 finnes allerede).
- Sørg for `DropdownMenu`-komponenter er importert (ellers bruk eksisterende `Popover` + knappeliste).

### Ny hjelper (definert i `RosAnalyse`-komponenten, ved siden av `updateHendelse`)

```ts
const oppdaterKonsekvensvurdering = (h, dimensjon, oppdatering) => {
  const nyeKV = (h.konsekvensvurderinger || []).map(kv =>
    kv.dimensjon === dimensjon ? { ...kv, ...oppdatering } : kv
  );
  const oppdateringer: Partial<RosHendelse> = { konsekvensvurderinger: nyeKV };
  if (dimensjon === "forsyningssikkerhet") {
    if (oppdatering.score !== undefined) oppdateringer.konsekvens = oppdatering.score;
    if (oppdatering.scoreEtter !== undefined) oppdateringer.konsekvensEtter = oppdatering.scoreEtter;
  }
  updateHendelse(h.id, oppdateringer);
};

const leggTilDimensjon = (h, dimensjon) => {
  const nye = [...(h.konsekvensvurderinger || []), { dimensjon, score: 1, begrunnelse: "" }];
  updateHendelse(h.id, { konsekvensvurderinger: nye });
};

const fjernDimensjon = (h, dimensjon) => {
  if (dimensjon === "forsyningssikkerhet") return;
  const nye = (h.konsekvensvurderinger || []).filter(kv => kv.dimensjon !== dimensjon);
  updateHendelse(h.id, { konsekvensvurderinger: nye });
};
```

### Inni accordion map-callback (rundt linje 1000)

Helt øverst i callback: `const hm = migrerHendelse(h);` slik at `hm.konsekvensvurderinger` alltid finnes. Bruk `hm` for å lese verdiene i UI; bruk `h.id` for oppdateringer.

### "Før tiltak"-grid (linje 1061–1086)

Endre grid fra `sm:grid-cols-3` til `sm:grid-cols-2` (eller `sm:grid-cols-1`) og fjern:
- "Konsekvens (1–5)"-Select
- "Risiko (S × K)"-display

Behold kun sannsynlighet-Select-en.

### "Etter tiltak"-grid (linje 1114–1139)

Tilsvarende: endre til `sm:grid-cols-2`, fjern "Konsekvens etter (1–5)"-Select og "Risiko etter"-display. Behold kun sannsynlighet-etter-Select.

### Ny seksjon "Konsekvensvurderinger per dimensjon"

Plasseres som egen `border-t pt-3`-blokk mellom "Forebyggende tiltak" og "Tilknyttede beregninger"-kortet (rundt linje 1093, før Card på 1094).

```tsx
<div className="space-y-2 border-t pt-3">
  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    Konsekvensvurderinger per dimensjon
  </p>

  <div className="space-y-2">
    {hm.konsekvensvurderinger!.map((kv) => {
      const sFor = h.sannsynlighet;
      const sEtt = sE;
      const risikoFor = sFor * (kv.score || 1);
      const risikoEtt = kv.scoreEtter ? sEtt * kv.scoreEtter : null;
      const clsKv = riskCellStyle(sFor, kv.score);
      const clsKvEtter = kv.scoreEtter ? riskCellStyle(sEtt, kv.scoreEtter) : "";

      return (
        <div key={kv.dimensjon} className="border rounded-md p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {DIMENSJON_NAVN[kv.dimensjon]}
            </Badge>
            {kv.dimensjon !== "forsyningssikkerhet" && (
              <Button variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => fjernDimensjon(h, kv.dimensjon)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Score (1–5)</Label>
              <div className="flex gap-1">
                <Select value={String(kv.score)}
                  onValueChange={(v) => oppdaterKonsekvensvurdering(h, kv.dimensjon, { score: Number(v) })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => (
                      <SelectItem key={n} value={String(n)}>
                        <Popover>
                          <PopoverTrigger asChild><span>{n}</span></PopoverTrigger>
                          <PopoverContent><RosKriterier dimensjon={kv.dimensjon} /></PopoverContent>
                        </Popover>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={`h-9 px-2 rounded-md border flex items-center text-xs font-semibold ${clsKv}`}>
                  {risikoFor}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Score etter (1–5)</Label>
              <div className="flex gap-1">
                <Select value={kv.scoreEtter ? String(kv.scoreEtter) : ""}
                  onValueChange={(v) => oppdaterKonsekvensvurdering(h, kv.dimensjon, { scoreEtter: Number(v) })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                {risikoEtt !== null && (
                  <div className={`h-9 px-2 rounded-md border flex items-center text-xs font-semibold ${clsKvEtter}`}>
                    {risikoEtt}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Textarea rows={2}
            placeholder="Begrunnelse for konsekvensvurderingen..."
            value={kv.begrunnelse || ""}
            onChange={(e) => oppdaterKonsekvensvurdering(h, kv.dimensjon, { begrunnelse: e.target.value })}
            className="text-sm" />

          {kv.scoreEtter !== undefined && (
            <Textarea rows={2}
              placeholder="Begrunnelse etter tiltak..."
              value={kv.begrunnelseEtter || ""}
              onChange={(e) => oppdaterKonsekvensvurdering(h, kv.dimensjon, { begrunnelseEtter: e.target.value })}
              className="text-sm" />
          )}
        </div>
      );
    })}
  </div>

  {/* Legg til dimensjon */}
  {(() => {
    const brukte = new Set(hm.konsekvensvurderinger!.map(k => k.dimensjon));
    const tilgjengelige = ALLE_DIMENSJONER.filter(d => !brukte.has(d));
    if (tilgjengelige.length === 0) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Legg til dimensjon
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {tilgjengelige.map(d => (
            <DropdownMenuItem key={d} onSelect={() => leggTilDimensjon(h, d)}>
              {DIMENSJON_NAVN[d]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  })()}
</div>
```

### Score-klikk → kriterier-popover

Pga. at `Popover` inni `SelectItem` er upraktisk, forenkles det til en separat info-knapp ved siden av Score-Select: liten `?`/info-ikon som åpner `Popover` med `<RosKriterier dimensjon={kv.dimensjon} />`. Dette beholder funksjonalitet uten å bryte Select-tilgjengelighet.

## Tekniske notater

- `riskCellStyle` finnes allerede i fil – gjenbrukes per dimensjon.
- `migrerHendelse` garanterer at `forsyningssikkerhet` alltid er rad 0; ingen ekstra null-sjekk.
- `DropdownMenu`-imports legges til hvis ikke allerede der.
- Ingen endringer i datamodell, lagring, eller andre filer.

## Fil som endres

- `src/pages/RosAnalyse.tsx`
