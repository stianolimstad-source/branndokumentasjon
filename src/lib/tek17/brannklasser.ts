// Brannklasser iht. TEK17 § 11-3 og preaksepterte ytelser fra VTEK.

export type Brannklasse = "BKL1" | "BKL2" | "BKL3" | "BKL4";

/** Hovedtabell fra TEK17 § 11-3 Tabell 1: Brannklasse (BKL) for byggverk. */
export const brannklasseTabell: Record<number, Record<string, string>> = {
  1: { "1": "-", "2": "BKL1", "3-4": "BKL2", "5+": "BKL2" },
  2: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
  3: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
  4: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
  5: { "1": "BKL1", "2": "BKL2", "3-4": "BKL3", "5+": "BKL3" },
  6: { "1": "BKL1", "2": "BKL2", "3-4": "BKL2", "5+": "BKL3" },
};

/**
 * Funksjon for å beregne brannklasse basert på risikoklasse og antall etasjer.
 * Inkluderer preaksepterte ytelser/unntak fra VTEK § 11-3.
 */
export const getBrannklasse = (
  risikoklasse: string,
  etasjer: string,
  harTerrengTilgang: string,
  areal: string,
  erRKL6Boligbygning?: boolean,
): { brannklasse: string; brannklasseUnntak: string | null } => {
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);
  const arealNum = parseFloat(areal) || 0;

  if (isNaN(rk) || isNaN(floors) || rk < 1 || rk > 6 || floors < 1) {
    return { brannklasse: "", brannklasseUnntak: null };
  }

  // Preakseptert ytelse nr. 3: Boligbygning i RK4 med tre etasjer, kan oppføres i BKL1
  // når hver boenhet har utgang direkte til terreng.
  if (rk === 4 && floors === 3 && harTerrengTilgang === "ja") {
    return {
      brannklasse: "BKL1",
      brannklasseUnntak:
        "Boligbygning i risikoklasse 4 med tre etasjer, kan oppføres i brannklasse 1 når hver boenhet har utgang direkte til terreng, uten å måtte rømme via trapp eller trapperom til terreng (jf. VTEK § 11-3, preakseptert ytelse nr. 3).",
    };
  }

  // Preakseptert ytelse nr. 4: Forsamlingslokale og salgslokale i RK5 under 800 m² i maks 2 etasjer.
  if (rk === 5 && floors === 2 && arealNum > 0 && arealNum < 800) {
    return {
      brannklasse: "BKL1",
      brannklasseUnntak:
        "Forsamlingslokale og salgslokale i risikoklasse 5 med bruksareal under 800 m² i maksimalt 2 etasjer kan oppføres i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 4).",
    };
  }

  // Preakseptert ytelse nr. 7: Boligbygning i RK6 i to etasjer kan oppføres i BKL1.
  if (rk === 6 && floors <= 2 && erRKL6Boligbygning) {
    return {
      brannklasse: "BKL1",
      brannklasseUnntak:
        "Boligbygning i risikoklasse 6 i to etasjer kan oppføres i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 7).",
    };
  }

  let etasjeKey: string;
  if (floors === 1) etasjeKey = "1";
  else if (floors === 2) etasjeKey = "2";
  else if (floors >= 3 && floors <= 4) etasjeKey = "3-4";
  else etasjeKey = "5+";

  return { brannklasse: brannklasseTabell[rk]?.[etasjeKey] || "", brannklasseUnntak: null };
};

/** Funksjon for å finne hvilke § 11-4-unntak som gjelder automatisk. */
export const getRelevantUnntak = (risikoklasse: string, brannklasse: string, etasjer: string): string[] => {
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const bkl = parseInt(brannklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);

  const relevant: string[] = [];

  // Unntak 3: Byggverk i én etasje i RK2, 3 og 5 kan ha R 15.
  if (floors === 1 && [2, 3, 5].includes(rk)) {
    relevant.push("unntak3");
  }

  // Unntak 4: Byggverk i BKL1 og RK4 kan ha R 15.
  if (bkl === 1 && rk === 4) {
    relevant.push("unntak4");
  }

  // Unntak 5: Byggverk i én etasje i RK2 kan oppføres uten spesifisert brannmotstand.
  if (floors === 1 && rk === 2) {
    relevant.push("unntak5");
  }

  return relevant;
};
