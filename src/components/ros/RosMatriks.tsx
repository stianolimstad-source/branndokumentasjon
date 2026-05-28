import React from "react";
import type { RosHendelse } from "./RosPreview";
import { type KonsekvensDimensjon, DIMENSJON_NAVN } from "@/lib/ros-risk-criteria";

interface RosMatriksProps {
  /** Optional highlight – risiko (S, K) plottes med ramme */
  highlight?: { sannsynlighet: number; konsekvens: number } | null;
  size?: "sm" | "md";
  /** Hendelser som skal plottes i matrisen */
  hendelser?: RosHendelse[];
  /** Konsekvensdimensjon som plottes (påkrevd når hendelser er gitt) */
  dimensjon?: KonsekvensDimensjon;
  /** Marker hendelser med høy usikkerhet med stiplet ring */
  visUsikkerhet?: boolean;
  /** Velger om sannsynlighet/konsekvens FØR eller ETTER tiltak skal plottes */
  bruk?: "for" | "etter";
  /** Lesbare IDer per hendelse (H1, H2, …). Bygges av kaller. */
  ider?: Map<string, string>;
  /** Skjul tekstforklaringen over matrisen */
  visBeskrivelse?: boolean;
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

function styrbarhetsBadgeKlasse(v?: string): string {
  if (v === "høy") return "bg-emerald-600 text-white border-white";
  if (v === "medium") return "bg-amber-500 text-white border-white";
  if (v === "lav") return "bg-red-600 text-white border-white";
  return "bg-white text-foreground border-foreground/60";
}

interface PunktData {
  h: RosHendelse;
  s: number;
  k: number;
  label: string;
}

/**
 * Henter (s, k) for en hendelse i valgt dimensjon og bruk.
 * Returnerer null hvis hendelsen ikke har vurdering for dimensjonen,
 * eller mangler data for valgt «bruk».
 */
function hentSK(
  h: RosHendelse,
  dim: KonsekvensDimensjon,
  bruk: "for" | "etter",
): { s: number; k: number } | null {
  const kv = (h.konsekvensvurderinger || []).find((d) => d.dimensjon === dim);
  if (!kv) return null;
  if (bruk === "etter") {
    const s = h.sannsynlighetEtter;
    const k = kv.scoreEtter;
    if (!s || !k) return null;
    return { s, k };
  }
  const s = h.sannsynlighet;
  const k = kv.score;
  if (!s || !k) return null;
  return { s, k };
}

export default function RosMatriks({
  highlight,
  size = "md",
  hendelser,
  dimensjon,
  visUsikkerhet = true,
  bruk = "for",
  ider,
  visBeskrivelse = true,
}: RosMatriksProps) {
  const cellSize = size === "sm" ? "h-10 w-10 text-xs" : "h-14 w-14 text-sm";
  const sRows = [5, 4, 3, 2, 1];
  const kCols = [1, 2, 3, 4, 5];

  // Bygg punktdata pr celle
  const cellMap = new Map<string, PunktData[]>();
  if (hendelser && dimensjon) {
    hendelser.forEach((h, i) => {
      const sk = hentSK(h, dimensjon, bruk);
      if (!sk) return;
      const key = `${sk.s}-${sk.k}`;
      const arr = cellMap.get(key) || [];
      arr.push({ h, s: sk.s, k: sk.k, label: ider?.get(h.id) || `H${i + 1}` });
      cellMap.set(key, arr);
    });
  }

  const harData = hendelser !== undefined && dimensjon !== undefined;
  const dimNavn = dimensjon ? DIMENSJON_NAVN[dimensjon] : "forsyningssikkerhet";

  return (
    <div className="inline-block">
      {visBeskrivelse && (
        <p className="text-xs text-muted-foreground mb-2 max-w-md">
          {harData
            ? `Viser konsekvensdimensjonen ${dimNavn.toLowerCase()} for hendelser som har denne dimensjonen vurdert${
                bruk === "etter" ? " (etter tiltak)" : " (før tiltak)"
              }. Hendelser uten vurdering for denne dimensjonen vises ikke i matrisen.`
            : `Viser konsekvensdimensjonen ${dimNavn.toLowerCase()} for hendelser som har denne dimensjonen vurdert.`}
        </p>
      )}

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
            const punkter = cellMap.get(`${s}-${k}`) || [];
            const vis = punkter.slice(0, 4);
            const rest = punkter.length - vis.length;
            return (
              <div
                key={`${s}-${k}`}
                className={`${cellSize} m-0.5 rounded relative ${FARGE_KLASSER[farge]} ${isHl ? "ring-2 ring-foreground" : ""}`}
                title={
                  punkter.length === 0
                    ? `S=${s}, K=${k}, R=${s * k}`
                    : punkter.map((p) => `${p.label}: ${p.h.tittel || p.h.hendelse || "—"} (S=${p.s}, K=${p.k})`).join("\n")
                }
              >
                {punkter.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-70">
                    {s * k}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
                    {vis.map((p) => {
                      const ringen = visUsikkerhet && p.h.usikkerhet === "høy";
                      return (
                        <span
                          key={p.h.id}
                          className={`inline-flex items-center justify-center rounded-full border text-[9px] font-bold leading-none ${styrbarhetsBadgeKlasse(
                            p.h.styrbarhet,
                          )} ${ringen ? "border-dashed border-2" : "border"} h-4 min-w-[1rem] px-0.5`}
                          title={`${p.label}: ${p.h.tittel || p.h.hendelse || "—"} · S=${p.s} · K=${p.k}${
                            p.h.usikkerhet ? ` · Usikkerhet: ${p.h.usikkerhet}` : ""
                          }${p.h.styrbarhet ? ` · Styrbarhet: ${p.h.styrbarhet}` : ""}`}
                        >
                          {p.label}
                        </span>
                      );
                    })}
                    {rest > 0 && (
                      <span
                        className="inline-flex items-center justify-center rounded-full border bg-foreground/80 text-background text-[9px] font-bold leading-none h-4 min-w-[1rem] px-1"
                        title={punkter
                          .slice(4)
                          .map((p) => `${p.label}: ${p.h.tittel || "—"}`)
                          .join("\n")}
                      >
                        +{rest}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-500/80" /> Akseptabel</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-amber-400/90" /> Vurderes</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500/85" /> Ikke akseptabel</span>
        {harData && (
          <>
            <span className="mx-1 text-muted-foreground/60">|</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-emerald-600" /> Styrbarhet høy</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-600" /> Lav</span>
            {visUsikkerhet && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-foreground" /> Høy usikkerhet
              </span>
            )}
          </>
        )}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">Rader: sannsynlighet (1–5). Kolonner: konsekvens (1–5).</div>
    </div>
  );
}

/**
 * Returnerer dimensjoner som er brukt på minst én hendelse.
 */
export function tilgjengeligeDimensjoner(hendelser: RosHendelse[]): KonsekvensDimensjon[] {
  const set = new Set<KonsekvensDimensjon>();
  hendelser.forEach((h) => {
    (h.konsekvensvurderinger || []).forEach((kv) => {
      if (kv.score) set.add(kv.dimensjon);
    });
  });
  return Array.from(set);
}

/**
 * Bygger lesbare IDer "H1", "H2", … for hendelser i samme rekkefølge som listen.
 */
export function byggHendelseIder(hendelser: RosHendelse[]): Map<string, string> {
  const map = new Map<string, string>();
  hendelser.forEach((h, i) => map.set(h.id, `H${i + 1}`));
  return map;
}

/**
 * Teller hendelser per risikofarge for valgt dimensjon og bruk.
 */
export function tellRisikoSoner(
  hendelser: RosHendelse[],
  dim: KonsekvensDimensjon,
  bruk: "for" | "etter" = "for",
): { rod: number; gul: number; gronn: number } {
  let rod = 0, gul = 0, gronn = 0;
  hendelser.forEach((h) => {
    const sk = hentSK(h, dim, bruk);
    if (!sk) return;
    const f = risikoFarge(sk.s, sk.k);
    if (f === "rod") rod++;
    else if (f === "gul") gul++;
    else gronn++;
  });
  return { rod, gul, gronn };
}

/**
 * Returnerer true hvis minst én hendelse har data for «etter tiltak» i valgt dimensjon.
 */
export function harEtterData(hendelser: RosHendelse[], dim: KonsekvensDimensjon): boolean {
  return hendelser.some((h) => {
    const kv = (h.konsekvensvurderinger || []).find((d) => d.dimensjon === dim);
    return !!(kv?.scoreEtter && h.sannsynlighetEtter);
  });
}
