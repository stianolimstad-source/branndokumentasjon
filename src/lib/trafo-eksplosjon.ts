// Beregningslogikk for trafoeksplosjon i oljefylte krafttrafoer.
// Kilder: CIGRE TB 537, NFPA 850, IEEE 979, EN 61936-1/NEK 440,
// PLOS One 2015, ASME 2022. Verdier er forenklede ingeniøranslag.

export type TankType = "corrugated" | "conservator" | "hermetic";
export type Plassering = "innendørs" | "utendørs";

export interface TrafoInput {
  oljevolum_L: number;
  tanktype: TankType;
  spenning_kV: number;
  effekt_MVA: number;
  buenergi_MJ: number;
  tankkapasitet_MJ: number; // elastisk
  plassering: Plassering;
  avstand_personell_m: number;
  avstand_maskinhall_m: number;
  basseng_areal_m2: number;
  barrierer: Barrierer;
}

export interface Barrierer {
  bucholtz: boolean;
  differensialvern: boolean;
  dga: boolean;
  temperaturovervaking: boolean;
  bristeskive: boolean;
  aktiv_trykkavlastning: boolean;
  brannmur_EI: 0 | 60 | 120 | 240;
  deluge_vannspray: boolean;
  oljegruve: boolean;
  avstand_standard: boolean;
}

export type Status = "ok" | "warning" | "error";

export interface Resultat {
  gass_L: number;
  tank: { status: Status; tekst: string };
  trykkbolge: {
    status: Status;
    peak_kPa: number;
    sannsynlighet_personell_pct: number;
    sannsynlighet_maskinhall_pct: number;
    tekst: string;
  };
  fragmenter: { status: Status; soner: { p80_m: number; ytter_m: number; ekstrem_m: number }; tekst: string };
  oljebrann: {
    status: Status;
    polediameter_m: number;
    Q_MW: number;
    qStrale_personell_kW: number;
    qStrale_maskinhall_kW: number;
    tekst: string;
  };
  bleve: { fatal_radius_m: number; innenfor_personell: boolean; innenfor_maskinhall: boolean };
  sannsynlighet: { aarlig_pct: number; levetid40_pct: number };
  anbefalinger: Anbefaling[];
}

export interface Anbefaling {
  kategori: string;
  tekst: string;
  prioritet: "kritisk" | "anbefalt" | "valgfri";
  oppfylt: boolean;
}

const DH_C = 42; // MJ/kg
const RHO_OLJE = 880; // kg/m³
const M_BURN = 0.015; // kg/(m²·s) modnet pølbrann
const X_RAD = 0.35; // strålingsandel av Q

export function beregn(input: TrafoInput): Resultat {
  const E = input.buenergi_MJ;
  const E_kJ = E * 1000;

  // 1. Gassproduksjon (midt 80 cm³/kJ)
  const gass_L = (E_kJ * 80) / 1000;

  // 2. Tankvurdering
  let tankStatus: Status = "ok";
  let tankTekst = `Buenergi ${E.toFixed(2)} MJ er under elastisk kapasitet (${input.tankkapasitet_MJ} MJ). Tanken antas å tåle hendelsen.`;
  if (E > input.tankkapasitet_MJ * 1.3) {
    tankStatus = "error";
    tankTekst = `Buenergi ${E.toFixed(2)} MJ overskrider tankkapasitet (${input.tankkapasitet_MJ} MJ) vesentlig — sannsynlig tankbrudd og eksplosjon.`;
  } else if (E > input.tankkapasitet_MJ) {
    tankStatus = "warning";
    tankTekst = `Buenergi ${E.toFixed(2)} MJ overskrider elastisk kapasitet — risiko for deformasjon/brudd.`;
  }

  // 3. Trykkbølge — kalibrert mot ASME 2022 case (80 kPa, 100 % skade <=20 m, 50 % <=78 m)
  // Skalering med (E/2.64)^(1/3) ift. PLOS One testenergi.
  const skala = Math.cbrt(Math.max(E, 0.1) / 2.64);
  const peak_kPa = 80 * skala;
  const sannsynlighetTrykk = (r: number) => {
    if (r <= 0) return 100;
    const r20 = 20 * skala;
    const r78 = 78 * skala;
    if (r <= r20) return 100;
    if (r >= r78 * 2) return 0;
    // lineær interpolasjon 100 -> 50 -> 0
    if (r <= r78) return 100 - ((r - r20) / (r78 - r20)) * 50;
    return 50 - ((r - r78) / r78) * 50;
  };
  const p_pers = sannsynlighetTrykk(input.avstand_personell_m);
  const p_mh = sannsynlighetTrykk(input.avstand_maskinhall_m);
  let trykkStatus: Status = p_pers > 50 || p_mh > 50 ? "error" : p_pers > 10 || p_mh > 10 ? "warning" : "ok";

  // 4. Fragmenter — skaleres med oljevolum mot 1100 L referanse
  const fragSkala = Math.cbrt(Math.max(input.oljevolum_L, 100) / 1100);
  const p80 = 115 * fragSkala;
  const ytter = 430 * fragSkala;
  const ekstrem = 860 * fragSkala;
  const minAvstand = Math.min(input.avstand_personell_m, input.avstand_maskinhall_m);
  let fragStatus: Status = "ok";
  let fragTekst = `Hovedmengden fragmenter forventes innenfor ${p80.toFixed(0)} m. Personell/maskinhall ligger utenfor sannsynlig fragmentsone.`;
  if (minAvstand < p80) {
    fragStatus = "error";
    fragTekst = `Personell/maskinhall (${minAvstand} m) ligger innenfor sone hvor 80–90 % av fragmenter lander (${p80.toFixed(0)} m).`;
  } else if (minAvstand < ytter) {
    fragStatus = "warning";
    fragTekst = `Personell/maskinhall (${minAvstand} m) ligger innenfor ytterspekter for fragmenter (${ytter.toFixed(0)} m).`;
  }

  // 5. Pølbrann
  const A = Math.max(input.basseng_areal_m2, 1);
  const D = 2 * Math.sqrt(A / Math.PI);
  const Q_MW = (M_BURN * A * DH_C * 1000) / 1000; // MW = kg/s * MJ/kg
  const stralePunkt = (r: number) => {
    if (r <= 0.1) return 1000;
    return (X_RAD * Q_MW * 1000) / (4 * Math.PI * r * r); // kW/m²
  };
  const q_pers = stralePunkt(input.avstand_personell_m);
  const q_mh = stralePunkt(input.avstand_maskinhall_m);
  const qMax = Math.max(q_pers, q_mh);
  let brannStatus: Status = qMax > 12.5 ? "error" : qMax > 4.7 ? "warning" : "ok";
  const brannTekst = `Pølbrann med diameter ${D.toFixed(1)} m gir Q ≈ ${Q_MW.toFixed(1)} MW. Stråling mot personell: ${q_pers.toFixed(2)} kW/m², mot maskinhall: ${q_mh.toFixed(2)} kW/m². Terskler: 1,58 / 4,7 / 12,5 kW/m².`;

  // 6. BLEVE — fatal-radius skaleres mot ASME case (140 m for stor oljemengde, anta 5000 L referanse)
  const bleveSkala = Math.cbrt(Math.max(input.oljevolum_L, 100) / 5000);
  const bleveR = 140 * bleveSkala;

  // 7. Sannsynlighet
  const sann = { aarlig_pct: 0.1, levetid40_pct: 4 };

  // Anbefalinger
  const a: Anbefaling[] = [];
  const b = input.barrierer;
  a.push({ kategori: "Vern", tekst: "Bucholtz-vern installert", prioritet: "kritisk", oppfylt: b.bucholtz });
  a.push({ kategori: "Vern", tekst: "Differensialvern (87T)", prioritet: "kritisk", oppfylt: b.differensialvern });
  a.push({ kategori: "Overvåking", tekst: "DGA (gass-i-olje-analyse)", prioritet: "anbefalt", oppfylt: b.dga });
  a.push({ kategori: "Overvåking", tekst: "Temperaturovervåking", prioritet: "anbefalt", oppfylt: b.temperaturovervaking });
  a.push({ kategori: "Trykkavlastning", tekst: "Bristeskive (pressure relief valve)", prioritet: "kritisk", oppfylt: b.bristeskive });
  if (tankStatus !== "ok") {
    a.push({ kategori: "Trykkavlastning", tekst: "Aktivt trykkavlastningssystem (Sergi TP / ABB TXpand)", prioritet: "anbefalt", oppfylt: b.aktiv_trykkavlastning });
  }
  const krevdEI = input.plassering === "innendørs" && input.oljevolum_L > 379 ? 180 : 120;
  a.push({
    kategori: "Brannmur",
    tekst: `Brannmur ≥ EI${krevdEI} mot maskinhall/kontrollbygg (NFPA 850 / NEK 440)`,
    prioritet: trykkStatus === "ok" && brannStatus === "ok" ? "anbefalt" : "kritisk",
    oppfylt: b.brannmur_EI >= krevdEI,
  });
  a.push({
    kategori: "Slokking",
    tekst: "Deluge / vannspray / høytrykks vanntåke (NFPA 15, ~10 L/min/m²)",
    prioritet: brannStatus === "ok" ? "anbefalt" : "kritisk",
    oppfylt: b.deluge_vannspray,
  });
  a.push({
    kategori: "Containment",
    tekst: "Oljegruve dimensjonert for full oljemengde + slokkevann, med oljeavskiller",
    prioritet: "kritisk",
    oppfylt: b.oljegruve,
  });
  a.push({
    kategori: "Avstand",
    tekst: "Klaringsavstand iht. IEEE 979 (≥9,1 m) / EN 61936-1",
    prioritet: minAvstand < 9.1 ? "kritisk" : "anbefalt",
    oppfylt: b.avstand_standard && minAvstand >= 9.1,
  });

  let trykkTekst = `Estimert topptrykk ${peak_kPa.toFixed(0)} kPa. Strukturskade-sannsynlighet personell: ${p_pers.toFixed(0)} %, maskinhall: ${p_mh.toFixed(0)} %.`;

  return {
    gass_L,
    tank: { status: tankStatus, tekst: tankTekst },
    trykkbolge: {
      status: trykkStatus,
      peak_kPa,
      sannsynlighet_personell_pct: p_pers,
      sannsynlighet_maskinhall_pct: p_mh,
      tekst: trykkTekst,
    },
    fragmenter: { status: fragStatus, soner: { p80_m: p80, ytter_m: ytter, ekstrem_m: ekstrem }, tekst: fragTekst },
    oljebrann: {
      status: brannStatus,
      polediameter_m: D,
      Q_MW,
      qStrale_personell_kW: q_pers,
      qStrale_maskinhall_kW: q_mh,
      tekst: brannTekst,
    },
    bleve: {
      fatal_radius_m: bleveR,
      innenfor_personell: input.avstand_personell_m < bleveR,
      innenfor_maskinhall: input.avstand_maskinhall_m < bleveR,
    },
    sannsynlighet: sann,
    anbefalinger: a,
  };
}

export const BUENERGI_PRESETS = [0.65, 1.28, 2.64, 5, 6.3, 17.3];
