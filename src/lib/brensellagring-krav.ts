export type BrensellagringKravItem = { kategori: string; tekst: string; ansvar: string };

export type BrenselType = "fyringsparafin" | "lett_fyringsolje" | "begge";

export interface BrensellagringResult {
  romType: string;
  krav: BrensellagringKravItem[];
  feilmelding?: string;
}

export function getBrensellagringKrav(
  brenselType: BrenselType,
  mengdeLiter: number
): BrensellagringResult {
  const krav: BrensellagringKravItem[] = [];

  if (mengdeLiter <= 0) {
    return { romType: "", krav: [], feilmelding: "Oppgi mengde i liter." };
  }

  // Determine room type and requirements based on VTEK § 11-8 Tabell 4
  if (brenselType === "fyringsparafin") {
    if (mengdeLiter <= 1650) {
      // Fyrrom/garasje ≤50m²/annet rom
      return {
        romType: "Fyrrom / garasje / annet rom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende – gjelder ikke garasjeport.", ansvar: "ARK" },
          { kategori: "Tank", tekst: "Ståltank.", ansvar: "ARK" },
        ],
      };
    } else if (mengdeLiter <= 4000) {
      // Fyrrom med høyere krav
      return {
        romType: "Fyrrom / garasje / annet rom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S]. Klasse C [S] – selvlukkende – gjelder ikke garasjeport.", ansvar: "ARK" },
        ],
      };
    } else if (mengdeLiter <= 10000) {
      // Tankrom
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK" },
        ],
      };
    } else {
      return { romType: "", krav: [], feilmelding: "Mengden overskrider preaksepterte ytelser i VTEK (maks 10 000 liter for fyringsparafin). Krever analyse." };
    }
  } else if (brenselType === "lett_fyringsolje") {
    if (mengdeLiter <= 4000) {
      return {
        romType: "Fyrrom / garasje / annet rom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende – gjelder ikke garasjeport.", ansvar: "ARK" },
        ],
      };
    } else if (mengdeLiter <= 10000) {
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S].", ansvar: "ARK" },
        ],
      };
    } else {
      return { romType: "", krav: [], feilmelding: "Mengden overskrider preaksepterte ytelser i VTEK (maks 10 000 liter for lett fyringsolje). Krever analyse." };
    }
  } else if (brenselType === "begge") {
    if (mengdeLiter <= 6000) {
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK" },
          { kategori: "Tank", tekst: "Tank i brennbart materiale (f.eks. GUP-tank og polyetylen-HD-tank). Tank i GUP eller polyetylen med dokumentert brannmotstand 30 minutter kan plasseres i branncellebegrensende tankrom EI 30.", ansvar: "ARK" },
        ],
      };
    } else {
      return { romType: "", krav: [], feilmelding: "Mengden overskrider preaksepterte ytelser i VTEK (maks 6 000 liter for kombinasjon). Krever analyse." };
    }
  }

  return { romType: "", krav: [] };
}
