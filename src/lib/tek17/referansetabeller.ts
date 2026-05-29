// Referansetabeller fra TEK17/VTEK § 11 – delt mellom preview og Word-eksport.
// Brukes når brukeren huker av "Inkluder referansetabeller i rapporten".

import { baereevneKravTabell } from "./baereevne";
import { seksjoneringsGrenser } from "./brannseksjonering";

export interface ReferanseTabell {
  tittel: string;
  kilde: string;
  headers: string[];
  rows: string[][];
}

/** § 11-4 Tabell 1 – Brannmotstand for bærende bygningsdeler per brannklasse. */
export const referanseBaereevne: ReferanseTabell = {
  tittel: "Referansetabell – Bærende bygningsdeler per brannklasse",
  kilde: "Kilde: VTEK § 11-4 Tabell 1.",
  headers: ["Bygningsdel", "BKL 1", "BKL 2", "BKL 3"],
  rows: [
    ["Bærende hovedsystem", baereevneKravTabell[1].hovedsystem, baereevneKravTabell[2].hovedsystem, baereevneKravTabell[3].hovedsystem],
    ["Sekundære bærende bygningsdeler / etasjeskillere / takkonstruksjoner", baereevneKravTabell[1].sekundaer, baereevneKravTabell[2].sekundaer, baereevneKravTabell[3].sekundaer],
    ["Trappeløp", baereevneKravTabell[1].trappeloep, baereevneKravTabell[2].trappeloep, baereevneKravTabell[3].trappeloep],
    ["Bærende bygningsdeler under øverste kjeller", baereevneKravTabell[1].kjeller, baereevneKravTabell[2].kjeller, baereevneKravTabell[3].kjeller],
    ["Utvendig trappeløp (beskyttet)", baereevneKravTabell[1].utvendig, baereevneKravTabell[2].utvendig, baereevneKravTabell[3].utvendig],
  ],
};

/** § 11-7 Tabell 1 – Arealgrenser for brannseksjonering. */
export const referanseSeksjonering: ReferanseTabell = (() => {
  const fmt = (n: number) => (n === Infinity ? "ingen grense" : n === 0 ? "uegnet" : `${n} m²`);
  const labels: Record<string, string> = {
    "under50": "Brannenergi ≤ 50 MJ/m²",
    "50-400": "Brannenergi 50–400 MJ/m²",
    "over400": "Brannenergi > 400 MJ/m²",
  };
  return {
    tittel: "Referansetabell – Største tillatte bruttoareal per brannseksjon",
    kilde: "Kilde: VTEK § 11-7 Tabell 1.",
    headers: ["Brannenergi", "Normalt", "+ Brannalarmanlegg", "+ Automatisk sprinkler", "+ Røykventilasjon"],
    rows: Object.entries(labels).map(([key, label]) => {
      const g = seksjoneringsGrenser[key];
      return [label, fmt(g.normalt), fmt(g.brannalarm), fmt(g.sprinkler), fmt(g.roykventilasjon)];
    }),
  };
})();

/** § 11-8 – Brannmotstand for branncellebegrensende bygningsdeler per BKL. */
export const referanseBrannceller: ReferanseTabell = {
  tittel: "Referansetabell – Branncellebegrensende bygningsdel og dørkrav per brannklasse",
  kilde: "Kilde: VTEK § 11-8 (preaksepterte ytelser, branncellebegrensende konstruksjoner).",
  headers: ["Bygningsdel", "BKL 1", "BKL 2", "BKL 3"],
  rows: [
    ["Branncellebegrensende bygningsdel – generelt", "EI 30 [B 30]", "EI 60 [B 60]", "EI 90 A2-s1,d0 [A 90]"],
    ["Branncellebegrensende bygningsdel – mot rømningsvei", "EI 30 [B 30]", "EI 60 A2-s1,d0 [A 60]", "EI 90 A2-s1,d0 [A 90]"],
    ["Branncellevegg mot annen virksomhet/eier", "EI 60 [B 60]", "EI 60 A2-s1,d0 [A 60]", "EI 90 A2-s1,d0 [A 90]"],
    ["Dør i branncellebegrensende konstruksjon", "EI₂ 30-Sₐ [B 30 S]", "EI₂ 60-Sₐ [B 60 S]", "EI₂ 60-A2-s1,d0-Sₐ [A 60 S]"],
    ["Dør mellom branncelle og trapperom Tr 1 / Tr 2", "EI₂ 30-CSₐ [B 30 S]", "EI₂ 30-CSₐ [B 30 S]", "EI₂ 60-CSₐ [B 60 S]"],
    ["Dør mellom branncelle og trapperom Tr 3", "EI₂ 60-CSₐ [B 60 S]", "EI₂ 60-CSₐ [B 60 S]", "EI₂ 60-CSₐ [B 60 S]"],
  ],
};

const materialerTabell1A: ReferanseTabell = {
  tittel: "Referansetabell 1A – Ytelser til overflater og kledninger for risikoklasse 1–5",
  kilde: "Kilde: VTEK § 11-9 Tabell 1A.",
  headers: ["Bygningsdel", "BKL 1", "BKL 2", "BKL 3"],
  rows: [
    ["Overflater på vegger og i tak – branncelle ≤ 200 m²", "D-s2,d0 [In 2]", "D-s2,d0 [In 2]", "D-s2,d0 [In 2]"],
    ["Overflater på vegger og i tak – branncelle > 200 m²", "D-s2,d0 [In 2]", "B-s1,d0 [In 1]", "B-s1,d0 [In 1]"],
    ["Overflater på vegger og i tak – rømningsvei", "B-s1,d0 [In 1]", "B-s1,d0 [In 1]", "B-s1,d0 [In 1]"],
    ["Overflater på gulv – branncelle", "Dfl-s1 [G]", "Dfl-s1 [G]", "Dfl-s1 [G]"],
    ["Overflater på gulv – rømningsvei", "Dfl-s1 [G]", "Dfl-s1 [G]", "Dfl-s1 [G]"],
    ["Kledning på vegger og i tak – branncelle", "K₂10 D-s2,d0 [K2]", "K₂10 B-s1,d0 [K1]", "K₂10 B-s1,d0 [K1]"],
    ["Kledning på vegger og i tak – rømningsvei", "K₂10 B-s1,d0 [K1]", "K₂10 A2-s1,d0 [K1-A]", "K₂10 A2-s1,d0 [K1-A]"],
  ],
};

const materialerTabell1B: ReferanseTabell = {
  tittel: "Referansetabell 1B – Ytelser til overflater og kledninger for risikoklasse 6",
  kilde: "Kilde: VTEK § 11-9 Tabell 1B.",
  headers: ["Bygningsdel", "Krav (RK 6)"],
  rows: [
    ["Overflater på vegger og i tak – branncelle ≤ 200 m²", "B-s1,d0 [In 1]"],
    ["Overflater på vegger og i tak – branncelle > 200 m²", "B-s1,d0 [In 1]"],
    ["Overflater på vegger og i tak – rømningsvei", "A2-s1,d0 [ubrennbart]"],
    ["Overflater på gulv – branncelle", "Dfl-s1 [G]"],
    ["Overflater på gulv – rømningsvei", "Dfl-s1 [G]"],
    ["Kledning på vegger og i tak – branncelle", "K₂10 B-s1,d0 [K1]"],
    ["Kledning på vegger og i tak – rømningsvei", "K₂10 A2-s1,d0 [K1-A]"],
  ],
};

/**
 * Returnerer materialer-referansetabellen som IKKE matcher prosjektets risikoklasse.
 * Hovedteksten viser allerede den relevante tabellen, så referanseseksjonen viser den andre for kontekst.
 * Returnerer null hvis vi ikke har relevant kontekst (ukjent RK).
 */
export function getMaterialerReferanseTabell(risikoklasse: string | undefined, harFlereRisikoklasser?: boolean, bygningsdeler?: any[]): ReferanseTabell | null {
  const rkr: string[] = [];
  if (risikoklasse) rkr.push(risikoklasse);
  if (harFlereRisikoklasser && Array.isArray(bygningsdeler)) {
    bygningsdeler.forEach((d) => { if (d?.risikoklasse) rkr.push(d.risikoklasse); });
  }
  const harRK6 = rkr.includes("RK6");
  const harRK1to5 = rkr.some((r) => r !== "RK6");
  // Vis "den andre" – den som ikke allerede er integrert i hovedteksten.
  if (harRK1to5 && !harRK6) return materialerTabell1B;
  if (harRK6 && !harRK1to5) return materialerTabell1A;
  // Hvis prosjektet har begge, er begge tabellene allerede i hovedteksten – vis ingen ekstra.
  if (harRK1to5 && harRK6) return null;
  return null;
}
