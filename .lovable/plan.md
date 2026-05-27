# Gjør TrafoEksplosjonTool til kontrollert komponent

## Endring 1: `src/components/verktoy/TrafoEksplosjonTool.tsx`

Gjør `TrafoEksplosjonTool` om til en kontrollert/ukontrollert komponent etter samme mønster som React-form-elementer.

- Legg til `Props`-interface:
  ```ts
  interface Props {
    input?: TrafoInput;
    onInputChange?: (input: TrafoInput) => void;
  }
  ```
- Endre signaturen til `const TrafoEksplosjonTool = ({ input: externalInput, onInputChange }: Props = {}) => { ... }`.
- Erstatt `const [input, setInput] = useState<TrafoInput>(defaultInput);` med:
  ```ts
  const [internalInput, setInternalInput] = useState<TrafoInput>(defaultInput);
  const isControlled = externalInput !== undefined && onInputChange !== undefined;
  const input = isControlled ? externalInput : internalInput;
  const setInput = (next: TrafoInput | ((p: TrafoInput) => TrafoInput)) => {
    if (isControlled) {
      const value = typeof next === "function" ? (next as (p: TrafoInput) => TrafoInput)(externalInput!) : next;
      onInputChange!(value);
    } else {
      setInternalInput(next);
    }
  };
  ```
- Eksisterende `setInput((p) => …)`-kall (i `upd`, `updB`, `updD` og de to `useEffect`-ene som auto-oppdaterer `tankkapasitet_MJ` og `buenergi_MJ`) trenger ikke endres – den nye `setInput` håndterer både objekt og updater-funksjon.

Standalone-bruk på `/verktoy/trafoeksplosjon` fortsetter å fungere uendret fordi props er valgfrie.

## Endring 2: `src/components/fraviksdokumentasjon/calculators/TrafoEksplosjonCalculator.tsx`

- Bytt `const [input] = useState<TrafoInput>(defaultInput);` til `const [input, setInput] = useState<TrafoInput>(defaultInput);`.
- Fjern kommentaren om at toolet ikke eksponerer state.
- Returner `<TrafoEksplosjonTool input={input} onInputChange={setInput} />`.
- `useEffect` som genererer `onResult` beholdes som i dag (den reagerer allerede på endringer i `input`).

## Filer som endres
- `src/components/verktoy/TrafoEksplosjonTool.tsx`
- `src/components/fraviksdokumentasjon/calculators/TrafoEksplosjonCalculator.tsx`
