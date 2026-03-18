/**
 * Brannmotstand i konstruksjoner – datagrunnlag og beregningslogikk
 *
 * Lette konstruksjoner:
 *   Komponentadditivmetoden iht. EN 1995-1-2:2004, Annex E
 *   Metoden beregner EI (isolasjon) ved å summere bidrag fra hvert lag.
 *
 * Massive konstruksjoner:
 *   Tabellverdier iht. EN 1992-1-2 (betong), EN 1996-1-2 (murverk)
 *   og NS-EN 1520 / SINTEF Byggforsk (lettbetong).
 */

// ── Materialbibliotek for komponentadditivmetoden ──────────────────────

export interface LayerMaterial {
  id: string;
  name: string;
  category: "plate" | "isolasjon" | "luft";
  /** Grunnverdi: t_ins,0 = factor × tykkelse(mm), i minutter */
  factor: number;
  /** Faste bidrag (for luft) i min, uavhengig av tykkelse */
  fixedMinutes?: number;
  /** Standard tykkelser (mm) */
  standardThicknesses: number[];
  /** Mest vanlig tykkelse (mm) – brukes som default */
  defaultThickness: number;
  /** Referanse */
  ref: string;
}

export const layerMaterials: LayerMaterial[] = [
  // ── Gipsplater ──
  {
    id: "gips_a",
    name: "Gipsplate Type A (standard)",
    category: "plate",
    factor: 1.25,
    standardThicknesses: [9.5, 12.5, 15],
    defaultThickness: 12.5,
    ref: "EN 1995-1-2 Annex E, Tabell E.3",
  },
  {
    id: "branngips",
    name: "Branngips (Type F/DF)",
    category: "plate",
    factor: 1.5,
    standardThicknesses: [12.5, 15, 18],
    defaultThickness: 15,
    ref: "EN 1995-1-2 Annex E, Tabell E.3",
  },
  // ── Andre plater ──
  {
    id: "kryssfiner",
    name: "Kryssfiner",
    category: "plate",
    factor: 0.5,
    standardThicknesses: [9, 12, 15, 18, 21],
    defaultThickness: 15,
    ref: "EN 1995-1-2 Annex E, Tabell E.3",
  },
  {
    id: "sponplate",
    name: "Sponplate",
    category: "plate",
    factor: 0.45,
    standardThicknesses: [12, 16, 19, 22],
    defaultThickness: 12,
    ref: "EN 1995-1-2 Annex E, Tabell E.3",
  },
  {
    id: "trefiberplate",
    name: "Trefiberplate (MDF/HDF)",
    category: "plate",
    factor: 0.4,
    standardThicknesses: [6, 9, 12, 15],
    defaultThickness: 12,
    ref: "EN 1995-1-2 Annex E, Tabell E.3",
  },
  {
    id: "fibersement",
    name: "Fibersementplate",
    category: "plate",
    factor: 1.3,
    standardThicknesses: [6, 8, 10, 12],
    defaultThickness: 8,
    ref: "SINTEF Byggforsk / EN 1995-1-2",
  },
  // ── Isolasjon ──
  {
    id: "steinull",
    name: "Steinull (≥ 26 kg/m³)",
    category: "isolasjon",
    factor: 0.2,
    standardThicknesses: [45, 50, 70, 95, 100, 120, 145, 148, 150, 198, 200, 250],
    defaultThickness: 150,
    ref: "EN 1995-1-2 Annex E, Tabell E.4",
  },
  {
    id: "steinull_hd",
    name: "Steinull høydensitet (≥ 50 kg/m³)",
    category: "isolasjon",
    factor: 0.25,
    standardThicknesses: [30, 45, 50, 70, 95, 100],
    defaultThickness: 50,
    ref: "EN 1995-1-2 Annex E / SINTEF",
  },
  {
    id: "glassull",
    name: "Glassull (≥ 15 kg/m³)",
    category: "isolasjon",
    factor: 0.1,
    standardThicknesses: [45, 50, 70, 95, 100, 120, 145, 148, 150, 198, 200],
    defaultThickness: 150,
    ref: "EN 1995-1-2 Annex E, Tabell E.4",
  },
  // ── Luft ──
  {
    id: "luftspalte",
    name: "Luftspalte (tom)",
    category: "luft",
    factor: 0,
    fixedMinutes: 5,
    standardThicknesses: [25, 36, 48, 70],
    defaultThickness: 36,
    ref: "EN 1995-1-2 Annex E",
  },
];

// ── Posisjonsfaktorer k_pos ──────────────────────────────────────────

/** Maks antall lag i lett konstruksjon */
export const MAX_LAYERS = 5;

/**
 * k_pos avhenger av lagets posisjon (1-indeksert fra brannsiden).
 * Standard k_pos-verdier:
 *   Lag 1: 1.0
 *   Lag 2: 0.85
 *   Lag 3: 0.70
 *   Lag 4: 0.55
 *   Lag 5: 0.40
 */
const KPOS_VALUES = [1.0, 0.85, 0.70, 0.55, 0.40];

export function getPositionFactor(layerIndex: number): number {
  if (layerIndex < 0) return 1.0;
  if (layerIndex >= KPOS_VALUES.length) return KPOS_VALUES[KPOS_VALUES.length - 1];
  return KPOS_VALUES[layerIndex];
}

// ── Beregning: Komponentadditivmetoden ──────────────────────────────

export interface WallLayer {
  materialId: string;
  thickness: number; // mm
}

export interface CalculationResult {
  totalMinutes: number;
  fireClass: string;
  layerBreakdown: { materialName: string; thickness: number; contribution: number; kPos: number }[];
  method: string;
  references: string[];
}

export function calculateLightWallResistance(layers: WallLayer[]): CalculationResult {
  const breakdown: CalculationResult["layerBreakdown"] = [];
  let totalMinutes = 0;
  const references = new Set<string>();
  references.add("EN 1995-1-2:2004, Annex E – Komponentadditivmetoden");

  let previousMaterialId: string | null = null;

  for (const layer of layers) {
    const mat = layerMaterials.find((m) => m.id === layer.materialId);
    if (!mat) continue;

    references.add(mat.ref);
    const kPos = getPositionFactor(previousMaterialId);

    let contribution: number;
    if (mat.fixedMinutes !== undefined) {
      contribution = mat.fixedMinutes;
    } else {
      contribution = mat.factor * layer.thickness * kPos;
    }

    breakdown.push({
      materialName: mat.name,
      thickness: layer.thickness,
      contribution: Math.round(contribution * 10) / 10,
      kPos: Math.round(kPos * 100) / 100,
    });

    totalMinutes += contribution;
    previousMaterialId = mat.id;
  }

  totalMinutes = Math.round(totalMinutes);

  return {
    totalMinutes,
    fireClass: getFireClass(totalMinutes),
    layerBreakdown: breakdown,
    method: "Komponentadditivmetoden (EN 1995-1-2 Annex E)",
    references: Array.from(references),
  };
}

function getFireClass(minutes: number): string {
  if (minutes >= 240) return "EI 240";
  if (minutes >= 180) return "EI 180";
  if (minutes >= 120) return "EI 120";
  if (minutes >= 90) return "EI 90";
  if (minutes >= 60) return "EI 60";
  if (minutes >= 45) return "EI 45";
  if (minutes >= 30) return "EI 30";
  if (minutes >= 20) return "EI 20";
  if (minutes >= 15) return "EI 15";
  return "< EI 15";
}

// ── Tabellverdier for massive konstruksjoner ────────────────────────

export interface MassiveWallType {
  id: string;
  name: string;
  /** Tykkelse (mm) → brannmotstand (min) for EI (ikke-bærende) */
  thicknessTable: { thickness: number; minutes: number }[];
  /** Tykkelse-intervall → brannmotstand (min) for REI (bærende) */
  thicknessTableREI?: { thicknessRange: string; minutes: number }[];
  ref: string;
  notes?: string;
}

export const massiveWallTypes: MassiveWallType[] = [
  {
    id: "betong_normal",
    name: "Normalvektsbetong (uarmert/armert)",
    thicknessTable: [
      { thickness: 60, minutes: 30 },
      { thickness: 80, minutes: 60 },
      { thickness: 100, minutes: 90 },
      { thickness: 120, minutes: 120 },
      { thickness: 150, minutes: 180 },
      { thickness: 175, minutes: 240 },
    ],
    thicknessTableREI: [
      { thicknessRange: "ca. 100 mm", minutes: 30 },
      { thicknessRange: "110–120 mm", minutes: 60 },
      { thicknessRange: "ca. 120–140 mm", minutes: 90 },
      { thicknessRange: "ca. 135–160 mm", minutes: 120 },
      { thicknessRange: "ca. 180–200 mm", minutes: 180 },
      { thicknessRange: "ca. 230–250 mm", minutes: 240 },
    ],
    ref: "EN 1992-1-2:2004, Tabell 5.3 / 5.4",
    notes: "Verdier gjelder silika-tilslagsmateriale (vanlig betong). REI-verdier forutsetter tilstrekkelig armering iht. EN 1992-1-2.",
  },
  {
    id: "lettbetong",
    name: "Lettbetong / Lettklinker (f.eks. Leca)",
    thicknessTable: [
      { thickness: 60, minutes: 60 },
      { thickness: 70, minutes: 90 },
      { thickness: 85, minutes: 120 },
      { thickness: 100, minutes: 180 },
      { thickness: 120, minutes: 240 },
    ],
    thicknessTableREI: [
      { thicknessRange: "ca. 80–100 mm", minutes: 60 },
      { thicknessRange: "ca. 100–120 mm", minutes: 90 },
      { thicknessRange: "ca. 120–140 mm", minutes: 120 },
      { thicknessRange: "ca. 150–170 mm", minutes: 180 },
      { thicknessRange: "ca. 180–200 mm", minutes: 240 },
    ],
    ref: "EN 1992-1-2 Tabell 5.3 / NS-EN 1520 / SINTEF Byggforsk",
    notes: "Lettbetong har bedre branntekniske egenskaper enn normalvektsbetong per mm tykkelse.",
  },
  {
    id: "tegl",
    name: "Teglstein (massiv)",
    thicknessTable: [
      { thickness: 70, minutes: 30 },
      { thickness: 100, minutes: 60 },
      { thickness: 120, minutes: 90 },
      { thickness: 150, minutes: 120 },
      { thickness: 200, minutes: 180 },
      { thickness: 250, minutes: 240 },
    ],
    thicknessTableREI: [
      { thicknessRange: "ca. 100–120 mm", minutes: 30 },
      { thicknessRange: "ca. 120–140 mm", minutes: 60 },
      { thicknessRange: "ca. 140–160 mm", minutes: 90 },
      { thicknessRange: "ca. 170–190 mm", minutes: 120 },
      { thicknessRange: "ca. 220–240 mm", minutes: 180 },
      { thicknessRange: "ca. 260–280 mm", minutes: 240 },
    ],
    ref: "EN 1996-1-2:2005, Tabell NA.B.1 / SINTEF Byggforsk",
  },
  {
    id: "betong_blokk",
    name: "Betongblokk / lecablokk (hulblokk)",
    thicknessTable: [
      { thickness: 100, minutes: 60 },
      { thickness: 120, minutes: 90 },
      { thickness: 150, minutes: 120 },
      { thickness: 200, minutes: 180 },
      { thickness: 250, minutes: 240 },
    ],
    thicknessTableREI: [
      { thicknessRange: "ca. 130–150 mm", minutes: 60 },
      { thicknessRange: "ca. 150–170 mm", minutes: 90 },
      { thicknessRange: "ca. 170–200 mm", minutes: 120 },
      { thicknessRange: "ca. 200–230 mm", minutes: 180 },
      { thicknessRange: "ca. 250–280 mm", minutes: 240 },
    ],
    ref: "EN 1996-1-2:2005 / SINTEF Byggforsk",
    notes: "Verdier avhenger av blokktype og fylling. Oppgitte verdier gjelder tomme blokker.",
  },
  {
    id: "porebetong",
    name: "Porebetong (f.eks. Siporex)",
    thicknessTable: [
      { thickness: 50, minutes: 30 },
      { thickness: 75, minutes: 60 },
      { thickness: 100, minutes: 120 },
      { thickness: 125, minutes: 180 },
      { thickness: 150, minutes: 240 },
    ],
    thicknessTableREI: [
      { thicknessRange: "ca. 75–90 mm", minutes: 30 },
      { thicknessRange: "ca. 100–115 mm", minutes: 60 },
      { thicknessRange: "ca. 125–140 mm", minutes: 120 },
      { thicknessRange: "ca. 150–165 mm", minutes: 180 },
      { thicknessRange: "ca. 175–190 mm", minutes: 240 },
    ],
    ref: "EN 1992-1-2 / SINTEF Byggforsk 520.331",
    notes: "Porebetong har svært gode branntekniske egenskaper grunnet lav varmeledningsevne.",
  },
];

/**
 * Slå opp brannmotstand for massiv vegg basert på type og tykkelse.
 * Interpolerer lineært mellom tabellverdier.
 */
export function lookupMassiveWallResistance(
  wallTypeId: string,
  thickness: number
): CalculationResult | null {
  const wallType = massiveWallTypes.find((w) => w.id === wallTypeId);
  if (!wallType) return null;

  const table = wallType.thicknessTable;
  let minutes: number;

  if (thickness <= table[0].thickness) {
    // Under minste tabellverdi – ekstrapolerer ned
    const ratio = thickness / table[0].thickness;
    minutes = Math.round(table[0].minutes * ratio);
  } else if (thickness >= table[table.length - 1].thickness) {
    minutes = table[table.length - 1].minutes;
  } else {
    // Lineær interpolering
    let lower = table[0];
    let upper = table[1];
    for (let i = 0; i < table.length - 1; i++) {
      if (thickness >= table[i].thickness && thickness <= table[i + 1].thickness) {
        lower = table[i];
        upper = table[i + 1];
        break;
      }
    }
    const fraction = (thickness - lower.thickness) / (upper.thickness - lower.thickness);
    minutes = Math.round(lower.minutes + fraction * (upper.minutes - lower.minutes));
  }

  return {
    totalMinutes: minutes,
    fireClass: getFireClass(minutes),
    layerBreakdown: [
      {
        materialName: wallType.name,
        thickness,
        contribution: minutes,
        kPos: 1,
      },
    ],
    method: "Tabelloppslag (massive konstruksjoner)",
    references: [wallType.ref],
  };
}
