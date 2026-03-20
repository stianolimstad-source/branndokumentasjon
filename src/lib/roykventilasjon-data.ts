/**
 * Tabell fra Melding HO-3/2000: Nødvendig åpningsareal (Av) for termisk røykventilasjon
 * Kolonnene er brannareal Ab (m²): 1, 3, 5, 10, 15, 25, 40, 60, 90
 */

export const abKolonner = [1, 3, 5, 10, 15, 25, 40, 60, 90];

export interface RoykventRow {
  H: number;
  h: number;
  values: (number | null)[];
}

export const roykventTabell: RoykventRow[] = [
  // H=4
  { H: 4, h: 3, values: [3, 5, 6, 8, 10, 13, 17, 22, 28] },
  { H: 4, h: 2, values: [1, 2, 2, 3, 4, 6, 8, 10, 13] },
  // H=5
  { H: 5, h: 4, values: [6, 8, 10, 13, 16, 20, 26, 32, 40] },
  { H: 5, h: 2, values: [2, 3, 4, 6, 7, 9, 12, 16, 20] },
  // H=6
  { H: 6, h: 5, values: [9, 13, 15, 20, 23, 29, 36, 44, 54] },
  { H: 6, h: 4, values: [4, 6, 7, 9, 11, 14, 18, 23, 26] },
  { H: 6, h: 3, values: [2, 3, 4, 5, 6, 8, 10, 13, 16] },
  // H=7
  { H: 7, h: 5, values: [6, 9, 11, 14, 17, 21, 26, 31, 38] },
  { H: 7, h: 4, values: [3, 5, 6, 8, 9, 12, 15, 18, 23] },
  { H: 7, h: 3, values: [2, 2, 3, 4, 5, 7, 9, 11, 14] },
  // H=8
  { H: 8, h: 6, values: [9, 13, 15, 20, 23, 28, 34, 41, 50] },
  { H: 8, h: 5, values: [5, 7, 9, 11, 13, 17, 21, 25, 31] },
  { H: 8, h: 4, values: [3, 4, 5, 7, 8, 10, 13, 16, 20] },
  { H: 8, h: 3, values: [1, 2, 3, 4, 5, 6, 8, 10, 13] },
  // H=9
  { H: 9, h: 7, values: [13, 18, 21, 26, 30, 37, 45, 53, 64] },
  { H: 9, h: 6, values: [7, 11, 13, 16, 19, 23, 28, 34, 41] },
  { H: 9, h: 5, values: [4, 6, 8, 10, 12, 15, 18, 22, 27] },
  { H: 9, h: 4, values: [3, 4, 4, 6, 7, 9, 12, 14, 18] },
  { H: 9, h: 3, values: [1, 2, 2, 3, 4, 5, 7, 9, 11] },
  // H=10
  { H: 10, h: 7, values: [10, 14, 17, 22, 25, 30, 37, 43, 52] },
  { H: 10, h: 6, values: [6, 9, 11, 14, 16, 20, 24, 29, 36] },
  { H: 10, h: 5, values: [4, 6, 7, 9, 10, 13, 16, 20, 24] },
  { H: 10, h: 4, values: [2, 3, 4, 5, 6, 8, 11, 13, 16] },
  { H: 10, h: 3, values: [1, 2, 2, 3, 3, 4, 6, 8, 11] },
  // H=12
  { H: 12, h: 9, values: [18, 24, 28, 35, 41, 48, 58, 67, 80] },
  { H: 12, h: 8, values: [17, 17, 19, 24, 28, 34, 40, 47, 56] },
  { H: 12, h: 7, values: [8, 11, 13, 17, 19, 23, 28, 34, 40] },
  { H: 12, h: 6, values: [5, 7, 9, 11, 13, 16, 20, 24, 29] },
  { H: 12, h: 5, values: [3, 5, 6, 7, 9, 11, 14, 17, 21] },
  { H: 12, h: 3, values: [1, 2, 2, 3, 4, 5, 7, 8, 11] },
  // H=14
  { H: 14, h: 11, values: [28, 38, 43, 53, 61, 72, 84, 98, 114] },
  { H: 14, h: 10, values: [19, 26, 31, 38, 43, 51, 61, 71, 83] },
  { H: 14, h: 9, values: [14, 19, 22, 27, 31, 38, 45, 52, 62] },
  { H: 14, h: 8, values: [10, 13, 16, 20, 23, 27, 33, 39, 46] },
  { H: 14, h: 7, values: [7, 9, 11, 14, 16, 20, 24, 28, 34] },
  { H: 14, h: 5, values: [3, 4, 5, 7, 8, 10, 12, 15, 18] },
  { H: 14, h: 3, values: [1, 1, 2, 3, 3, 4, 5, 7, 8] },
  // H=16
  { H: 16, h: 12, values: [29, 39, 45, 56, 63, 74, 87, 100, 116] },
  { H: 16, h: 11, values: [21, 29, 34, 41, 47, 56, 65, 76, 88] },
  { H: 16, h: 10, values: [16, 22, 25, 31, 35, 42, 50, 58, 68] },
  { H: 16, h: 9, values: [12, 16, 19, 23, 27, 32, 38, 44, 52] },
  { H: 16, h: 8, values: [8, 12, 14, 17, 20, 24, 28, 33, 40] },
  { H: 16, h: 6, values: [4, 6, 7, 9, 10, 13, 15, 18, 22] },
  { H: 16, h: 3, values: [1, 1, 2, 3, 3, 4, 5, 7, 8] },
  // H=18
  { H: 18, h: 14, values: [41, 55, 63, 77, 87, 101, 118, 135, 155] },
  { H: 18, h: 12, values: [24, 32, 37, 45, 51, 60, 71, 82, 95] },
  { H: 18, h: 10, values: [14, 19, 22, 27, 31, 36, 43, 50, 59] },
  { H: 18, h: 8, values: [8, 10, 12, 15, 18, 21, 25, 30, 36] },
  { H: 18, h: 6, values: [4, 5, 6, 8, 9, 11, 14, 17, 20] },
  { H: 18, h: 3, values: [1, 1, 2, 3, 3, 4, 6, 7, null] },
  // H=21
  { H: 21, h: 18, values: [82, 110, 126, 152, 171, 198, 228, 259, 295] },
  { H: 21, h: 16, values: [49, 66, 75, 91, 103, 120, 138, 158, 180] },
  { H: 21, h: 14, values: [31, 41, 48, 58, 66, 77, 89, 102, 117] },
  { H: 21, h: 12, values: [19, 26, 30, 37, 42, 49, 58, 67, 77] },
  { H: 21, h: 10, values: [12, 16, 19, 23, 26, 31, 37, 43, 50] },
  { H: 21, h: 8, values: [7, 9, 11, 13, 15, 19, 22, 26, 31] },
  { H: 21, h: 6, values: [3, 5, 6, 7, 8, 10, 13, 15, 18] },
  { H: 21, h: 3, values: [1, 1, 2, 2, 2, 3, 4, 5, 7] },
];

/** Get unique H values */
export const getUniqueH = (): number[] => {
  return [...new Set(roykventTabell.map((r) => r.H))];
};

/** Get available h values for a given H */
export const getHValuesForH = (H: number): number[] => {
  return roykventTabell.filter((r) => r.H === H).map((r) => r.h);
};

/** Lookup Av value (exact match) */
export const lookupAv = (H: number, h: number, Ab: number): number | null => {
  const row = roykventTabell.find((r) => r.H === H && r.h === h);
  if (!row) return null;
  const colIdx = abKolonner.indexOf(Ab);
  if (colIdx === -1) return null;
  return row.values[colIdx];
};

/** Linear interpolation helper */
const lerp = (x: number, x0: number, x1: number, y0: number, y1: number): number => {
  if (x1 === x0) return y0;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

/** Find bracketing values in a sorted array */
const bracket = (val: number, arr: number[]): [number, number] | null => {
  const sorted = [...arr].sort((a, b) => a - b);
  if (val < sorted[0] || val > sorted[sorted.length - 1]) return null;
  if (sorted.includes(val)) return [val, val];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] < val && val < sorted[i + 1]) return [sorted[i], sorted[i + 1]];
  }
  return null;
};

/** Get Av for exact H and h, interpolating across Ab */
const getAvForHh = (H: number, h: number, Ab: number): number | null => {
  const row = roykventTabell.find((r) => r.H === H && r.h === h);
  if (!row) return null;

  const abIdx = abKolonner.indexOf(Ab);
  if (abIdx !== -1) return row.values[abIdx];

  // Interpolate across Ab columns
  const abBracket = bracket(Ab, abKolonner);
  if (!abBracket) return null;
  const [abLo, abHi] = abBracket;
  if (abLo === abHi) return row.values[abKolonner.indexOf(abLo)];
  const vLo = row.values[abKolonner.indexOf(abLo)];
  const vHi = row.values[abKolonner.indexOf(abHi)];
  if (vLo === null || vHi === null) return null;
  return lerp(Ab, abLo, abHi, vLo, vHi);
};

/** Get Av interpolating across h for a given exact H */
const getAvForH = (H: number, h: number, Ab: number): number | null => {
  const hVals = getHValuesForH(H);
  if (hVals.includes(h)) return getAvForHh(H, h, Ab);

  const hBracket = bracket(h, hVals);
  if (!hBracket) return null;
  const [hLo, hHi] = hBracket;
  if (hLo === hHi) return getAvForHh(H, hLo, Ab);
  const vLo = getAvForHh(H, hLo, Ab);
  const vHi = getAvForHh(H, hHi, Ab);
  if (vLo === null || vHi === null) return null;
  return lerp(h, hLo, hHi, vLo, vHi);
};

/**
 * Interpolated lookup of Av.
 * Supports arbitrary H, h, and Ab values within table range.
 * Uses trilinear interpolation across H, h, and Ab.
 */
export const interpolateAv = (H: number, h: number, Ab: number): number | null => {
  const uniqueHVals = getUniqueH();

  // If exact H exists, interpolate h and Ab
  if (uniqueHVals.includes(H)) return getAvForH(H, h, Ab);

  // Interpolate across H
  const hBracket = bracket(H, uniqueHVals);
  if (!hBracket) return null;
  const [HLo, HHi] = hBracket;
  if (HLo === HHi) return getAvForH(HLo, h, Ab);
  const vLo = getAvForH(HLo, h, Ab);
  const vHi = getAvForH(HHi, h, Ab);
  if (vLo === null || vHi === null) return null;
  return lerp(H, HLo, HHi, vLo, vHi);
};
