interface RosMatriksProps {
  /** Optional highlight – risiko (S, K) plottes med ramme */
  highlight?: { sannsynlighet: number; konsekvens: number } | null;
  size?: "sm" | "md";
}

/**
 * 5x5 risikomatrise (sannsynlighet × konsekvens).
 * Fargekoding følger vanlig praksis (NS 5814-inspirert):
 *   produkt 1–4   = grønn (akseptabel)
 *   produkt 5–9   = gul   (ALARP / må vurderes)
 *   produkt 10–25 = rød   (ikke akseptabel)
 */
export function risikoFarge(s: number, k: number): "gronn" | "gul" | "rod" {
  const v = s * k;
  if (v >= 10) return "rod";
  if (v >= 5) return "gul";
  return "gronn";
}

const FARGE_KLASSER: Record<ReturnType<typeof risikoFarge>, string> = {
  gronn: "bg-emerald-500/80 text-white",
  gul: "bg-amber-400/90 text-foreground",
  rod: "bg-red-500/85 text-white",
};

export default function RosMatriks({ highlight, size = "md" }: RosMatriksProps) {
  const cellSize = size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm";
  // Konsekvens 1..5 horisontalt, sannsynlighet 5..1 vertikalt (5 øverst)
  const sRows = [5, 4, 3, 2, 1];
  const kCols = [1, 2, 3, 4, 5];
  return (
    <div className="inline-block">
      <div className="flex">
        <div className="w-8" />
        {kCols.map((k) => (
          <div key={k} className={`${cellSize} flex items-center justify-center font-medium text-muted-foreground`}>
            {k}
          </div>
        ))}
      </div>
      {sRows.map((s) => (
        <div key={s} className="flex items-center">
          <div className={`${cellSize} flex items-center justify-center font-medium text-muted-foreground`}>{s}</div>
          {kCols.map((k) => {
            const farge = risikoFarge(s, k);
            const isHl = highlight && highlight.sannsynlighet === s && highlight.konsekvens === k;
            return (
              <div
                key={`${s}-${k}`}
                className={`${cellSize} m-0.5 flex items-center justify-center rounded ${FARGE_KLASSER[farge]} ${isHl ? "ring-2 ring-foreground" : ""}`}
                title={`S=${s}, K=${k}, R=${s * k}`}
              >
                {s * k}
              </div>
            );
          })}
        </div>
      ))}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-500/80" /> Akseptabel</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-amber-400/90" /> Vurderes</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500/85" /> Ikke akseptabel</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">Rader: sannsynlighet (1–5). Kolonner: konsekvens (1–5).</div>
    </div>
  );
}
