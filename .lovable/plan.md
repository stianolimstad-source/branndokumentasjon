## Øye-knapp for Fravik-accordionen

Fravik-accordionen mangler øye-snarveien som finnes på alle de andre accordionene.

**Endring i `src/pages/Konsept.tsx`** (Fravik-seksjonen ca. linje 9684–9691):

Pakk `AccordionTrigger` inn i samme `flex`-div som brukes for kap 5 og 6 (linje 9540–9553), og legg til en øye-knapp ved siden av:

```tsx
<div className="flex items-center">
  <AccordionTrigger ... className="... flex-1">...</AccordionTrigger>
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      const targetId = documentType === "tilstandsvurdering"
        ? "preview-oppsummering-avvik"
        : "preview-fravik";
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }}
    className="p-1.5 mr-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
    title="Gå til i forhåndsvisning"
  >
    <Eye className="h-3.5 w-3.5" />
  </button>
</div>
```

**Endring i `src/components/konsept/KonseptPreview.tsx`** (ca. linje 5502):

Legg til `id="preview-fravik"` på `<section>` for «Fravik og kompenserende tiltak» slik at brannkonsept-rapporten har et anker å scrolle til. `preview-oppsummering-avvik` finnes allerede på linje 5391.

Ingen andre endringer.