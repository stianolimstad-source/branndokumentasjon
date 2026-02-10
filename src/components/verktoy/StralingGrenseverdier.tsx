const grenseverdier = [
  { kw: "< 2,5", desc: "Ingen risiko for antennelse selv ved langvarig eksponering. Trygg avstand for personer.", color: "text-green-700 dark:text-green-400" },
  { kw: "2,5", desc: "Grense for smerte ved eksponering av hud i mer enn noen sekunder.", color: "text-green-700 dark:text-green-400" },
  { kw: "4,0", desc: "Kritisk grense for personer som ikke kan søke ly. Brannskade ved langvarig eksponering.", color: "text-yellow-700 dark:text-yellow-400" },
  { kw: "8,0", desc: "Spontan antennelse av trevirke ved langvarig eksponering. Anbefalt varselgrense for nabobygninger.", color: "text-yellow-700 dark:text-yellow-400" },
  { kw: "12,5", desc: "Grenseverdi iht. TEK17 § 11-6 / VTEK for brannspredning mellom bygninger. Tiltak påkrevd over denne verdien.", color: "text-orange-700 dark:text-orange-400" },
  { kw: "20", desc: "Antennelse av trevirke uten pilotflamme ved kort eksponeringstid.", color: "text-red-700 dark:text-red-400" },
  { kw: "> 30", desc: "Umiddelbar antennelse av de fleste brennbare materialer. Svært farlig for personer.", color: "text-red-700 dark:text-red-400" },
];

const StralingGrenseverdier = () => {
  return (
    <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
      <p className="font-semibold">Grenseverdier for strålingsintensitet:</p>
      <div className="space-y-2">
        {grenseverdier.map((row) => (
          <div key={row.kw} className="flex gap-3 items-start">
            <span className={`font-mono font-semibold whitespace-nowrap min-w-[5rem] text-right ${row.color}`}>
              {row.kw} kW/m²
            </span>
            <span className="text-muted-foreground">{row.desc}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t space-y-1">
        <p className="font-semibold">Tommelfingerverdier:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>ε: 0,8–1,0</li>
          <li>χ<sub>r</sub>: 0,2–0,4 (avhengig av brennstoff, sot, ventilasjon)</li>
          <li>T<sub>f</sub> (effektiv): typisk 900–1200 °C (1173–1473 K) i grove modeller</li>
        </ul>
      </div>
    </div>
  );
};

export default StralingGrenseverdier;
