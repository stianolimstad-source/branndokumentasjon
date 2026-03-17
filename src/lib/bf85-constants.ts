/**
 * BF85 – Byggeforskrift 1985 (Del 3 Brannvern)
 * 
 * Sections for tilstandsvurdering mapped from Kap. 30–39.
 * Used when regelverk === "BF85" in tilstandsvurderinger.
 */

export interface BF85Section {
  id: string;
  ref: string;       // BF85 reference (e.g. "Kap. 30:41")
  title: string;     // Short section title
  description: string; // Brief description of the requirement
}

/**
 * BF85 tilstandsvurdering sections for Chapter 2.
 * These replace the TEK17 § 11-x sections when BF85 is selected.
 */
export const bf85Sections: BF85Section[] = [
  {
    id: "bf85_brannklasse",
    ref: "Kap. 30:23 / 30:41",
    title: "Bygningsbrannklasse og brannmotstand",
    description: "Bygningsbrannklasse (1–4) iht. kap. 31–39. Bærende og skillende konstruksjoners brannmotstand iht. Tabell 30:41.",
  },
  {
    id: "bf85_avstand",
    ref: "Kap. 30:32",
    title: "Avstand mellom bygninger",
    description: "Minste avstand mellom bygninger, brannvegg, krav til grupper av bygninger og strålevarme.",
  },
  {
    id: "bf85_brannseksjoner",
    ref: "Kap. 30:6",
    title: "Brannteknisk oppdeling (brannvegg/branndekke)",
    description: "Oppdeling med brannvegg og branndekke, utførelse, gjennomføringer (30:61–62).",
  },
  {
    id: "bf85_brannceller",
    ref: "Kap. 30:63",
    title: "Branncelleinndeling",
    description: "Inndeling i brannceller, dører i branncellebegrensende vegger, loft/kjeller (30:63–64). Krav avhengig av bruk (kap. 31–39).",
  },
  {
    id: "bf85_kledninger",
    ref: "Kap. 30:42",
    title: "Kledninger og overflater",
    description: "Innvendige og utvendige overflater og kledninger iht. Tabell 30:42. Særkrav for rømningsvei.",
  },
  {
    id: "bf85_vegger_tak",
    ref: "Kap. 30:51–53",
    title: "Vegger, tak og nedforet himling",
    description: "Ytterveggers brannmotstand (Tabell 30:512), B-konstruksjoner (30:513), fasademateriale, brennbar isolasjon, taktekning og nedforet himling.",
  },
  {
    id: "bf85_tekniske_rom",
    ref: "Kap. 30:33",
    title: "Tekniske rom",
    description: "Heismaskinrom, ventilasjonsrom, søppelrom og fyrrom – branncelle A 60.",
  },
  {
    id: "bf85_romningsvei",
    ref: "Kap. 30:7",
    title: "Rømningsvei",
    description: "Generelle krav til rømningsvei (30:71–78), antall, bredde, dører (Tabell 30:75), vindu som rømningsvei, markering, brannventilasjon og ledelys.",
  },
  {
    id: "bf85_trapperom",
    ref: "Kap. 30:7 / 30:41",
    title: "Trapperom og heissjakt",
    description: "Krav til åpne, lukkede, branntrygge og røykfrie trapperom. Bygningsdeler som omgir trapperom og heissjakt.",
  },
  {
    id: "bf85_brannalarm",
    ref: "Kap. 31–39",
    title: "Brannalarmanlegg og røykvarsler",
    description: "Krav til brannalarmanlegg og røykvarsler avhengig av bygningens bruk og størrelse.",
  },
  {
    id: "bf85_slokkingsredskap",
    ref: "Kap. 30:93 / 31–39",
    title: "Slokkingsredskap og slokkingsvann",
    description: "Brannslanger, håndslokkingsapparater, stigeledning (30:91) og sprinkleranlegg der krevet.",
  },
  {
    id: "bf85_atkomst",
    ref: "Kap. 30:92/94/95",
    title: "Atkomst for brannvesenet",
    description: "Kjøreatkomst for brannvesenet (30:92), atkomst til loft og yttertak (30:94), atkomst til kjeller (30:95).",
  },
  {
    id: "bf85_ventilasjon",
    ref: "Kap. 47",
    title: "Ventilasjon og installasjoner",
    description: "Branntekniske krav til ventilasjonsanlegg, kanaler og gjennomføringer gjennom brannskiller (Kap. 47).",
  },
  {
    id: "bf85_roykpipe",
    ref: "Kap. 49",
    title: "Røykpipe, varmeanlegg og ildsted",
    description: "Krav til røykpiper, ildsteder, varmeanlegg og fyringsanlegg (Kap. 49).",
  },
];

/**
 * Get BF85 TOC entries for the preview
 */
export const getBF85TocEntries = (): { num: string; title: string }[] =>
  bf85Sections.map((s, i) => ({
    num: `2.${i + 1}`,
    title: `${s.ref} – ${s.title}`,
  }));

/**
 * BF85 bygningstyper mapped to their kapittel for bygningsbrannklasse lookup.
 */
export type BF85Bygningstype =
  | "Bolig"
  | "Skole"
  | "Barnehage"
  | "Forsamlingslokale"
  | "Industri"
  | "Lager"
  | "Kontor"
  | "Garasje"
  | "Salgslokale"
  | "Overnattingssted"
  | "Sykehus"
  | "Skur"
  | "Arbeidsbrakke"
  | "Boligbrakke"
  | "Driftsbygning";

export const bf85BygningstyperListe: { value: BF85Bygningstype; label: string; kap: string }[] = [
  { value: "Bolig", label: "Bolig", kap: "Kap. 31" },
  { value: "Skole", label: "Skole / undervisning", kap: "Kap. 32" },
  { value: "Barnehage", label: "Barnehage / fritidshjem", kap: "Kap. 32" },
  { value: "Forsamlingslokale", label: "Forsamlingslokale", kap: "Kap. 33" },
  { value: "Industri", label: "Industri / håndverk", kap: "Kap. 34" },
  { value: "Lager", label: "Lager", kap: "Kap. 34" },
  { value: "Kontor", label: "Kontor", kap: "Kap. 34" },
  { value: "Garasje", label: "Garasje", kap: "Kap. 34" },
  { value: "Salgslokale", label: "Salgslokale", kap: "Kap. 35" },
  { value: "Overnattingssted", label: "Overnattingssted / hotell", kap: "Kap. 36" },
  { value: "Sykehus", label: "Sykehus / pleieanstalt", kap: "Kap. 37" },
  { value: "Skur", label: "Skur / arbeidsbrakke", kap: "Kap. 38" },
  { value: "Boligbrakke", label: "Boligbrakke", kap: "Kap. 38" },
  { value: "Driftsbygning", label: "Driftsbygning for jordbruket", kap: "Kap. 39" },
];

/**
 * Calculate bygningsbrannklasse according to BF85 Kap. 31–39.
 * Returns the class (1-4) and the table reference.
 */
export const getBygningsbrannklasse = (
  bygningstype: BF85Bygningstype,
  etasjer: number,
  arealPerEtasje: number,
  options?: {
    brannbelastning?: "under50" | "50-400" | "over400"; // For industri/lager
    harBrannalarm?: boolean; // For kontor
  }
): { klasse: string; tabell: string; merknad?: string } | null => {
  if (!bygningstype || etasjer < 1) return null;

  switch (bygningstype) {
    // ──────────────────── Kap. 31 Boliger ────────────────────
    case "Bolig": {
      // Tabell 31:1
      if (etasjer === 1 && arealPerEtasje <= 1000) return { klasse: "4", tabell: "Tabell 31:1" };
      if (etasjer === 2 && arealPerEtasje <= 800) return { klasse: "4", tabell: "Tabell 31:1" };
      if (etasjer >= 3 && etasjer <= 4 && arealPerEtasje <= 1000)
        return { klasse: "2", tabell: "Tabell 31:1", merknad: "Øverste etasje kan være i bygningsbrannklasse 3, forutsatt at underliggende etasjeskiller er A 60." };
      if (etasjer > 4 && arealPerEtasje <= 1000)
        return { klasse: "1", tabell: "Tabell 31:1", merknad: "Terrassehus over 4 etasjer kan utføres i bygningsbrannklasse 2 når hver etasje har utgang direkte til det fri." };
      // Area exceeds table - highest class
      if (etasjer <= 2) return { klasse: "4", tabell: "Tabell 31:1", merknad: "Areal overstiger tabellverdi – oppdeling med brannvegg kan være nødvendig." };
      if (etasjer <= 4) return { klasse: "2", tabell: "Tabell 31:1", merknad: "Areal overstiger tabellverdi – oppdeling med brannvegg kan være nødvendig." };
      return { klasse: "1", tabell: "Tabell 31:1" };
    }

    // ──────────────────── Kap. 32 Skoler ────────────────────
    case "Skole": {
      // Tabell 32:12
      if (etasjer === 1) {
        if (arealPerEtasje <= 800) return { klasse: "4", tabell: "Tabell 32:12" };
        if (arealPerEtasje <= 1200) return { klasse: "3", tabell: "Tabell 32:12" };
        return { klasse: "3", tabell: "Tabell 32:12", merknad: "Areal overstiger tabellverdi – oppdeling med brannvegg kan være nødvendig." };
      }
      if (etasjer === 2) {
        if (arealPerEtasje <= 800) return { klasse: "3", tabell: "Tabell 32:12" };
        if (arealPerEtasje <= 1200) return { klasse: "2", tabell: "Tabell 32:12" };
        return { klasse: "2", tabell: "Tabell 32:12", merknad: "Areal overstiger tabellverdi – oppdeling med brannvegg kan være nødvendig." };
      }
      if (etasjer >= 3 && etasjer <= 4) return { klasse: "2", tabell: "Tabell 32:12" };
      return { klasse: "1", tabell: "Tabell 32:12" };
    }

    // ──────────────────── Kap. 32 Barnehage ────────────────────
    case "Barnehage": {
      // Tabell 32:22
      if (etasjer === 1 && arealPerEtasje <= 500) return { klasse: "4", tabell: "Tabell 32:22" };
      if (etasjer === 2) {
        if (arealPerEtasje <= 250) return { klasse: "4", tabell: "Tabell 32:22", merknad: "Forutsatt at nederste etasje er i bygningsbrannklasse 2, og etasjeskiller er A 60." };
        if (arealPerEtasje <= 500) return { klasse: "2", tabell: "Tabell 32:22" };
      }
      // Barnehage can also be in buildings >2 floors with bolig class
      return { klasse: "2", tabell: "Tabell 32:22", merknad: "Barnehage i bygning med flere enn to etasjer skal ha bygningsbrannklasse minst som for bolig." };
    }

    // ──────────────────── Kap. 33 Forsamlingslokaler ────────────────────
    case "Forsamlingslokale": {
      // Tabell 33:2
      if (etasjer === 1) {
        if (arealPerEtasje <= 800) return { klasse: "4", tabell: "Tabell 33:2" };
        return { klasse: "3", tabell: "Tabell 33:2", merknad: "Birom skal skilles fra forsamlingslokale med brannvegg når arealer åpne for publikum overstiger 1800 m²." };
      }
      if (etasjer === 2) {
        if (arealPerEtasje <= 800) return { klasse: "3", tabell: "Tabell 33:2" };
        if (arealPerEtasje <= 1800) return { klasse: "2", tabell: "Tabell 33:2" };
        return { klasse: "2", tabell: "Tabell 33:2", merknad: "Areal overstiger tabellverdi." };
      }
      if (arealPerEtasje <= 1800) return { klasse: "1", tabell: "Tabell 33:2" };
      return { klasse: "1", tabell: "Tabell 33:2" };
    }

    // ──────────────────── Kap. 34 Industri/Lager ────────────────────
    case "Industri":
    case "Lager": {
      // Tabell 34:22
      const bl = options?.brannbelastning || "50-400";
      if (etasjer === 1) {
        if (bl === "under50") return { klasse: "4", tabell: "Tabell 34:22" };
        return { klasse: "3", tabell: "Tabell 34:22" };
      }
      if (etasjer === 2) return { klasse: "3", tabell: "Tabell 34:22" };
      if (etasjer >= 3 && etasjer <= 4) {
        if (bl === "over400") return { klasse: "2", tabell: "Tabell 34:22", merknad: "Bygningsdelenes brannmotstand velges ut fra forholdene og skal godkjennes av bygningsrådet." };
        return { klasse: "2", tabell: "Tabell 34:22", merknad: "Øverste etasje kan være i bygningsbrannklasse 3, forutsatt at underliggende etasjeskiller er A 60." };
      }
      if (bl === "under50") return { klasse: "2", tabell: "Tabell 34:22", merknad: "Øverste etasje kan være i bygningsbrannklasse 3." };
      return { klasse: "1", tabell: "Tabell 34:22" };
    }

    // ──────────────────── Kap. 34 Kontor ────────────────────
    case "Kontor": {
      // Tabell 34:31
      if (etasjer === 1) return { klasse: options?.harBrannalarm ? "3" : "4", tabell: "Tabell 34:31" };
      if (etasjer === 2) return { klasse: "3", tabell: "Tabell 34:31" };
      if (etasjer >= 3 && etasjer <= 4)
        return { klasse: "2", tabell: "Tabell 34:31", merknad: "Øverste etasje kan være i bygningsbrannklasse 3, forutsatt at underliggende etasjeskiller er A 60." };
      return { klasse: "1", tabell: "Tabell 34:31", merknad: "Øverste etasje kan være i bygningsbrannklasse 3, forutsatt at underliggende etasjeskiller er A 60." };
    }

    // ──────────────────── Kap. 34 Garasje ────────────────────
    case "Garasje": {
      // Simplified from Tabell 34:42
      if (etasjer === 1) return { klasse: "3", tabell: "Tabell 34:42" };
      return { klasse: "2", tabell: "Tabell 34:42", merknad: "Øverste etasje kan utføres i bygningsbrannklasse 3 forutsatt at underliggende etasjeskiller er A 60." };
    }

    // ──────────────────── Kap. 35 Salgslokaler ────────────────────
    case "Salgslokale": {
      // Tabell 35:1
      if (etasjer === 1) {
        if (arealPerEtasje <= 300) return { klasse: "4", tabell: "Tabell 35:1" };
        if (arealPerEtasje <= 1800) return { klasse: "3", tabell: "Tabell 35:1" };
        return { klasse: "3", tabell: "Tabell 35:1", merknad: "Birom skal skilles fra salgslokale med brannvegg når arealer åpne for publikum overstiger 1800 m²." };
      }
      if (etasjer === 2) {
        if (arealPerEtasje <= 600) return { klasse: "3", tabell: "Tabell 35:1" };
        if (arealPerEtasje <= 1800) return { klasse: "3", tabell: "Tabell 35:1" };
        return { klasse: "3", tabell: "Tabell 35:1", merknad: "Areal overstiger tabellverdi." };
      }
      return { klasse: "1", tabell: "Tabell 35:1" };
    }

    // ──────────────────── Kap. 36 Overnattingssteder ────────────────────
    case "Overnattingssted": {
      // Tabell 36:2
      if (etasjer === 1 && arealPerEtasje <= 600) return { klasse: "3", tabell: "Tabell 36:2" };
      if (etasjer === 2 && arealPerEtasje <= 300) return { klasse: "3", tabell: "Tabell 36:2" };
      if (etasjer <= 2) return { klasse: "2", tabell: "Tabell 36:2", merknad: "Areal overstiger tabellverdi for bygningsbrannklasse 3." };
      if (etasjer <= 4) return { klasse: "2", tabell: "Tabell 36:2" };
      return { klasse: "1", tabell: "Tabell 36:2" };
    }

    // ──────────────────── Kap. 37 Sykehus ────────────────────
    case "Sykehus": {
      // Tabell 37:2
      if (etasjer === 1 && arealPerEtasje <= 600) return { klasse: "3", tabell: "Tabell 37:2" };
      if (etasjer === 2 && arealPerEtasje <= 300) return { klasse: "3", tabell: "Tabell 37:2" };
      if (etasjer <= 2) return { klasse: "2", tabell: "Tabell 37:2", merknad: "Areal overstiger tabellverdi for bygningsbrannklasse 3." };
      if (etasjer >= 3 && etasjer <= 4) return { klasse: "2", tabell: "Tabell 37:2" };
      return { klasse: "1", tabell: "Tabell 37:2" };
    }

    // ──────────────────── Kap. 38 Skur/brakke ────────────────────
    case "Skur":
      return { klasse: "4", tabell: "Kap. 38", merknad: "Skur og arbeidsbrakke – ingen spesifikke krav til bygningsbrannklasse." };
    case "Arbeidsbrakke":
      return { klasse: "4", tabell: "Kap. 38", merknad: "Arbeidsbrakke – ingen spesifikke krav til bygningsbrannklasse." };
    case "Boligbrakke":
      return { klasse: "3", tabell: "Kap. 38", merknad: "Boligbrakke – maks 2 etasjer, oppdeling med brannvegg for hver 600 m²." };

    // ──────────────────── Kap. 39 Driftsbygning ────────────────────
    case "Driftsbygning":
      return { klasse: "4", tabell: "Kap. 39", merknad: "Driftsbygning for jordbruket – kun krav til røykpipe/ildsted (Kap. 49) og garasje (Kap. 34)." };

    default:
      return null;
  }
};
