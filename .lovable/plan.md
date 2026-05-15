## Endring i `src/pages/RosAnalyse.tsx`

**Mål:** "Lagre"-knappen skal være synlig hele tiden mens man scroller, og den skal ligge på inputsiden (venstre kolonne) — ikke under forhåndsvisningen.

### Konkrete endringer

1. **Fjern dagens sticky bunn-linje** (linjene 528–534) som ligger utenfor grid-en og strekker seg på tvers av begge kolonner.

2. **Legg "Lagre"-knappen inn som en sticky bunn-bar inne i venstre (input-)kolonne** (linje 349). 
   - Endre input-kolonnen fra `border-r p-6 space-y-8 overflow-y-auto` til en flex-container slik at innholdet scroller inni, og en bunn-bar sitter sticky:
     ```tsx
     <div className="border-r flex flex-col max-h-[calc(100vh-65px-49px)]">
       <div className="p-6 space-y-8 overflow-y-auto flex-1">
         {/* alle eksisterende seksjoner */}
       </div>
       <div className="border-t bg-background/95 backdrop-blur px-6 py-2 flex items-center justify-end">
         <Button size="sm" onClick={handleSave} disabled={saving}>
           <Save className="h-4 w-4 mr-1" /> {saving ? "Lagrer…" : "Lagre"}
         </Button>
       </div>
     </div>
     ```
   - Maks-høyden tar høyde for global header (top-[65px]) og den eksisterende sticky topp-baren slik at bunn-baren alltid er synlig i viewportet uansett scroll-posisjon i input-kolonnen.

3. **Forhåndsvisningskolonnen** (linje 523) forblir uendret bortsett fra at den også får tilsvarende max-høyde, slik at høyrekolonnen scroller selvstendig som før.

### Resultat
- Lagre-knappen vises permanent nederst i venstre kolonne (input), uansett hvor langt man scroller.
- Den er ikke lenger plassert under forhåndsvisningen.
- Word-, slett- og opplastingsknappene blir værende i den eksisterende sticky topp-baren.
