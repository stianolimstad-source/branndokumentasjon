// Rømning iht. TEK17 § 11-13 og § 11-14.

/** Maksimal fluktvei (m) iht. § 11-13 Tabell 1 per RK. RK4 har ikke eget krav her. */
export const getFluktveiKrav = (rk: string): number | null => {
  switch (rk) {
    case "RK1":
    case "RK2":
      return 50;
    case "RK3":
    case "RK5":
      return 30;
    case "RK6":
      return 25;
    default:
      return null;
  }
};

/** Strengeste fluktvei-krav (laveste tall) fra aktive RK-er. */
export const getStrengesteFluktvei = (rks: string[]): number | null => {
  const kravs = rks.map(getFluktveiKrav).filter((v): v is number => v !== null);
  return kravs.length > 0 ? Math.min(...kravs) : null;
};

/** Fri bredde-krav (m) iht. § 11-14 punkt 4 per RK + bygningstype. */
export const getFriBreddeKrav = (rk: string, bygningstype?: string): { bredde: number; merknad?: string } => {
  const erBolig = (bygningstype || "").toLowerCase().includes("bolig");
  if (rk === "RK6") {
    if (erBolig) {
      return { bredde: 0.86, merknad: "Boligunntak iht. § 11-2 Tabell 1." };
    }
    return { bredde: 1.16 };
  }
  if (rk === "RK3" || rk === "RK5") return { bredde: 1.16 };
  // RK1, RK2, RK4 (og ukjent)
  return { bredde: 0.86 };
};

/** Strengeste fri bredde-krav (høyeste tall) fra aktive RK-er. */
export const getStrengesteFriBredde = (rks: string[], bygningstype?: string): { bredde: number; merknad?: string } => {
  if (rks.length === 0) return { bredde: 0.86 };
  let max: { bredde: number; merknad?: string } = { bredde: 0, merknad: undefined };
  for (const rk of rks) {
    const k = getFriBreddeKrav(rk, bygningstype);
    if (k.bredde > max.bredde) max = k;
  }
  return max.bredde > 0 ? max : { bredde: 0.86 };
};

/** Persontall basert på areal og kategori (m² per person). */
export const beregnPersontall = (areal: string | number, kategoriFaktor: number): number => {
  const a = typeof areal === "string" ? parseFloat(areal) : areal;
  if (!a || !kategoriFaktor) return 0;
  return Math.floor(a / kategoriFaktor);
};
