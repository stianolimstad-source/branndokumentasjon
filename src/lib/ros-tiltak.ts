/**
 * Tiltaksplan-typer og hjelpere for ROS-analyser.
 *
 * Brukes på tvers av editor (RosAnalyse), preview (RosPreview) og Word-eksport.
 */

export type RosTiltakStatus =
  | "foreslatt"
  | "besluttet"
  | "under_arbeid"
  | "gjennomfort"
  | "forkastet";

export type RosTiltakKategori =
  | "sannsynlighetsreduserende"
  | "konsekvensreduserende";

export type Vurdering = "lav" | "medium" | "hoy";

export interface RosTiltak {
  id: string;
  tittel: string;
  beskrivelse: string;
  kategori: RosTiltakKategori;
  ansvarlig: string;
  /** ISO-dato (YYYY-MM-DD) */
  frist: string;
  status: RosTiltakStatus;
  kostnadVurdering?: Vurdering;
  effektVurdering?: Vurdering;
  hendelseIds: string[];
  kommentar?: string;
}

export const TILTAK_STATUS_LABEL: Record<RosTiltakStatus, string> = {
  foreslatt: "Foreslått",
  besluttet: "Besluttet",
  under_arbeid: "Under arbeid",
  gjennomfort: "Gjennomført",
  forkastet: "Forkastet",
};

export const TILTAK_STATUS_REKKEFOLGE: RosTiltakStatus[] = [
  "foreslatt",
  "besluttet",
  "under_arbeid",
  "gjennomfort",
  "forkastet",
];

/** Tailwind-className for badge per status. */
export const TILTAK_STATUS_BADGE_CLASS: Record<RosTiltakStatus, string> = {
  foreslatt: "bg-muted text-muted-foreground border border-border",
  besluttet: "bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  under_arbeid: "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  gjennomfort: "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  forkastet: "bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
};

/** Hex-farger til Word-eksport (cell shading fill). */
export const TILTAK_STATUS_FILL: Record<RosTiltakStatus, string> = {
  foreslatt: "E5E7EB",
  besluttet: "DBEAFE",
  under_arbeid: "FEF3C7",
  gjennomfort: "D1FAE5",
  forkastet: "FECDD3",
};

export const TILTAK_KATEGORI_LABEL: Record<RosTiltakKategori, string> = {
  sannsynlighetsreduserende: "Sannsynlighetsreduserende",
  konsekvensreduserende: "Konsekvensreduserende",
};

export const VURDERING_LABEL: Record<Vurdering, string> = {
  lav: "Lav",
  medium: "Medium",
  hoy: "Høy",
};

export const VURDERING_VALG: Vurdering[] = ["lav", "medium", "hoy"];

/** Numerisk vekt for sortering etter effekt/kostnad (Høy høyest). */
const VURDERING_VEKT: Record<Vurdering, number> = { hoy: 3, medium: 2, lav: 1 };

/** Numerisk vekt for sortering etter status (besluttet/under_arbeid har høyest prioritet). */
const STATUS_VEKT: Record<RosTiltakStatus, number> = {
  besluttet: 5,
  under_arbeid: 4,
  foreslatt: 3,
  gjennomfort: 2,
  forkastet: 1,
};

/** Bygger lesbare T-IDer (T1, T2 …) i samme rekkefølge som arrayet. */
export function byggTiltakIder(tiltaksplan: RosTiltak[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  (tiltaksplan || []).forEach((t, i) => map.set(t.id, `T${i + 1}`));
  return map;
}

/** Er fristen passert (og tiltaket ikke ferdig/forkastet)? */
export function erFristPassert(t: RosTiltak): boolean {
  if (!t.frist) return false;
  if (t.status === "gjennomfort" || t.status === "forkastet") return false;
  const d = new Date(t.frist);
  if (Number.isNaN(d.getTime())) return false;
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  return d.getTime() < idag.getTime();
}

/**
 * Sorter etter prioritet for visning i rapport/preview:
 *   1) status (besluttet/under_arbeid øverst)
 *   2) høy effekt øverst
 *   3) tidligste frist øverst
 */
export function sorterTiltakEtterPrioritet(tiltak: RosTiltak[]): RosTiltak[] {
  return [...tiltak].sort((a, b) => {
    const s = STATUS_VEKT[b.status] - STATUS_VEKT[a.status];
    if (s !== 0) return s;
    const ea = a.effektVurdering ? VURDERING_VEKT[a.effektVurdering] : 0;
    const eb = b.effektVurdering ? VURDERING_VEKT[b.effektVurdering] : 0;
    if (eb !== ea) return eb - ea;
    const fa = a.frist ? new Date(a.frist).getTime() : Number.POSITIVE_INFINITY;
    const fb = b.frist ? new Date(b.frist).getTime() : Number.POSITIVE_INFINITY;
    return fa - fb;
  });
}

export function sorterTiltakEtter(
  tiltak: RosTiltak[],
  felt: "frist" | "status" | "effekt" | "kostnad",
): RosTiltak[] {
  const liste = [...tiltak];
  if (felt === "frist") {
    liste.sort((a, b) => {
      const fa = a.frist ? new Date(a.frist).getTime() : Number.POSITIVE_INFINITY;
      const fb = b.frist ? new Date(b.frist).getTime() : Number.POSITIVE_INFINITY;
      return fa - fb;
    });
  } else if (felt === "status") {
    liste.sort((a, b) => STATUS_VEKT[b.status] - STATUS_VEKT[a.status]);
  } else if (felt === "effekt") {
    liste.sort((a, b) => {
      const ea = a.effektVurdering ? VURDERING_VEKT[a.effektVurdering] : 0;
      const eb = b.effektVurdering ? VURDERING_VEKT[b.effektVurdering] : 0;
      return eb - ea;
    });
  } else if (felt === "kostnad") {
    liste.sort((a, b) => {
      const ka = a.kostnadVurdering ? VURDERING_VEKT[a.kostnadVurdering] : 0;
      const kb = b.kostnadVurdering ? VURDERING_VEKT[b.kostnadVurdering] : 0;
      return ka - kb; // lav kostnad øverst
    });
  }
  return liste;
}

/** Formaterer ISO-dato til norsk lokal visning. Tom string → "—". */
export function formaterFrist(frist: string): string {
  if (!frist) return "—";
  const d = new Date(frist);
  if (Number.isNaN(d.getTime())) return frist;
  return d.toLocaleDateString("no-NO", { year: "numeric", month: "short", day: "numeric" });
}

/** Frist + 90 dager fra i dag (ISO YYYY-MM-DD). */
export function defaultFristIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}
