## Endring
I `src/pages/Konsept.tsx` linje 2700–2702: bytt fra kommaseparert tiltaksliste til en linjebrutt punktliste med stor forbokstav.

**Før:**
```ts
if (aktiveTiltak.length > 0) {
  tekst += `\n\nFølgende aktive branntekniske tiltak er forutsatt: ${aktiveTiltak.join(", ")}.`;
}
```

**Etter:**
```ts
if (aktiveTiltak.length > 0) {
  const punkter = aktiveTiltak
    .map(t => `- ${t.charAt(0).toUpperCase()}${t.slice(1)}`)
    .join("\n");
  tekst += `\n\nFølgende aktive branntekniske tiltak er forutsatt:\n${punkter}`;
}
```

Gjelder både TEK17 og BF85 (samme generator). Manuelt redigerte sammendrag berøres ikke.