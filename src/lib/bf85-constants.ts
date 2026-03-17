/**
 * BF85 – Byggeforskrift 1985 (Del 3 Brannvern)
 * 
 * Requirements mapped to the TEK17 §11-x chapter structure for consistent layout.
 * Each entry provides the BF85-equivalent requirement for the corresponding TEK17 section.
 */

export interface BF85Section {
  id: string;
  ref: string;       // BF85 reference (e.g. "Kap. 30:41")
  title: string;     // Short section title
  description: string; // Brief description of the requirement
}

/**
 * BF85 requirements mapped to the TEK17 tilstandsvurdering chapter structure.
 * key = same as TEK17 tilstand section keys (3_1 .. 3_14)
 */
export interface BF85MappedSection {
  tek17Key: string;        // e.g. "3_1"
  tek17Label: string;      // TEK17 section label for display
  bf85Ref: string;         // BF85 reference(s)
  bf85Title: string;       // BF85 equivalent title
  bf85Description: string; // BF85 requirement description
}

export const bf85MappedSections: BF85MappedSection[] = [
  {
    tek17Key: "3_1",
    tek17Label: "3.1 Bæreevne og stabilitet",
    bf85Ref: "Kap. 30:23 / 30:41",
    bf85Title: "Bygningsbrannklasse og brannmotstand",
    bf85Description: "Bygningsbrannklasse (1–4) iht. kap. 31–39. Bærende og skillende konstruksjoners brannmotstand iht. Tabell 30:41.",
  },
  {
    tek17Key: "3_2",
    tek17Label: "3.2 Sikkerhet ved eksplosjon",
    bf85Ref: "Kap. 30:33 / Kap. 49",
    bf85Title: "Tekniske rom, fyrrom og ildsted",
    bf85Description: "Heismaskinrom, ventilasjonsrom, søppelrom og fyrrom – branncelle A 60 (Kap. 30:33). Krav til røykpiper, ildsteder, varmeanlegg og fyringsanlegg (Kap. 49).",
  },
  {
    tek17Key: "3_3",
    tek17Label: "3.3 Brannspredning mellom byggverk",
    bf85Ref: "Kap. 30:32",
    bf85Title: "Avstand mellom bygninger",
    bf85Description: "Minste avstand mellom bygninger, brannvegg, krav til grupper av bygninger og strålevarme (Kap. 30:32).",
  },
  {
    tek17Key: "3_4",
    tek17Label: "3.4 Brannseksjoner",
    bf85Ref: "Kap. 30:6",
    bf85Title: "Brannteknisk oppdeling (brannvegg/branndekke)",
    bf85Description: "Oppdeling med brannvegg og branndekke, utførelse, gjennomføringer (30:61–62).",
  },
  {
    tek17Key: "3_5",
    tek17Label: "3.5 Brannceller",
    bf85Ref: "Kap. 30:63–64",
    bf85Title: "Branncelleinndeling",
    bf85Description: "Inndeling i brannceller, dører i branncellebegrensende vegger, loft/kjeller (30:63–64). Krav avhengig av bruk (kap. 31–39).",
  },
  {
    tek17Key: "3_6",
    tek17Label: "3.6 Materialer og produkter",
    bf85Ref: "Kap. 30:42 / 30:51–53",
    bf85Title: "Kledninger, overflater, vegger og tak",
    bf85Description: "Innvendige og utvendige overflater og kledninger iht. Tabell 30:42. Ytterveggers brannmotstand (Tabell 30:512), B-konstruksjoner (30:513), fasademateriale, brennbar isolasjon, taktekning og nedforet himling.",
  },
  {
    tek17Key: "3_7",
    tek17Label: "3.7 Tekniske installasjoner",
    bf85Ref: "Kap. 47",
    bf85Title: "Ventilasjon og installasjoner",
    bf85Description: "Branntekniske krav til ventilasjonsanlegg, kanaler og gjennomføringer gjennom brannskiller (Kap. 47).",
  },
  {
    tek17Key: "3_8",
    tek17Label: "3.8 Rømning og redning",
    bf85Ref: "Kap. 30:7",
    bf85Title: "Rømningsvei – generelle krav",
    bf85Description: "Generelle krav til rømningsvei (30:71–78), antall, bredde, dører (Tabell 30:75), vindu som rømningsvei, markering, brannventilasjon og ledelys.",
  },
  {
    tek17Key: "3_9",
    tek17Label: "3.9 Tilrettelegging for rømning",
    bf85Ref: "Kap. 31–39",
    bf85Title: "Brannalarmanlegg og røykvarsler",
    bf85Description: "Krav til brannalarmanlegg og røykvarsler avhengig av bygningens bruk og størrelse (Kap. 31–39).",
  },
  {
    tek17Key: "3_10",
    tek17Label: "3.10 Utgang fra branncelle",
    bf85Ref: "Kap. 30:71–73",
    bf85Title: "Utganger og rømningsveier fra branncelle",
    bf85Description: "Krav til antall utganger, dørbredder og plassering av utganger fra brannceller (30:71–73).",
  },
  {
    tek17Key: "3_11",
    tek17Label: "3.11 Rømningsvei",
    bf85Ref: "Kap. 30:7 / 30:41",
    bf85Title: "Trapperom og heissjakt",
    bf85Description: "Krav til åpne, lukkede, branntrygge og røykfrie trapperom. Bygningsdeler som omgir trapperom og heissjakt.",
  },
  {
    tek17Key: "3_12",
    tek17Label: "3.12 Redning av husdyr",
    bf85Ref: "Kap. 39",
    bf85Title: "Driftsbygning for jordbruket",
    bf85Description: "Krav til driftsbygninger med husdyrrom (Kap. 39). Brannventilasjon, rømning for husdyr.",
  },
  {
    tek17Key: "3_13",
    tek17Label: "3.13 Manuell slokking",
    bf85Ref: "Kap. 30:93 / 31–39",
    bf85Title: "Slokkingsredskap og slokkingsvann",
    bf85Description: "Brannslanger, håndslokkingsapparater, stigeledning (30:91) og sprinkleranlegg der krevet.",
  },
  {
    tek17Key: "3_14",
    tek17Label: "3.14 Slokkemannskap",
    bf85Ref: "Kap. 30:92/94/95",
    bf85Title: "Atkomst for brannvesenet",
    bf85Description: "Kjøreatkomst for brannvesenet (30:92), atkomst til loft og yttertak (30:94), atkomst til kjeller (30:95).",
  },
];

/**
 * Get BF85 requirement description for a given TEK17 section key.
 */
export const getBF85Requirement = (tek17Key: string): BF85MappedSection | undefined =>
  bf85MappedSections.find((s) => s.tek17Key === tek17Key);

/**
 * BF85 Tabell 30:41 – Bygningsdelers brannmotstand per bygningsbrannklasse.
 * Returns auto-generated bæreevne text for section 2.1 based on bygningsbrannklasse (1–4).
 */
export const getBaereevneTekstBF85 = (bygningsbrannklasse: string): { tekst: string; kravTabell: BF85BaereevneKrav | null } => {
  const klasse = parseInt(bygningsbrannklasse, 10);
  if (isNaN(klasse) || klasse < 1 || klasse > 4) return { tekst: "", kravTabell: null };

  const krav: Record<number, BF85BaereevneKrav> = {
    1: {
      hovedsystem: "A 90",
      sekundaer: "A 60",
      branncellebegrensende: "A 60",
      kjeller: "A 180",
      trapperomOgHeissjakt: "A 60",
      trappeloep: "A 30",
    },
    2: {
      hovedsystem: "A 60",
      sekundaer: "B 60",
      branncellebegrensende: "B 60",
      kjeller: "A 90",
      trapperomOgHeissjakt: "A 60",
      trappeloep: "A 30",
    },
    3: {
      hovedsystem: "A 10 eller B 30",
      sekundaer: "A 10 eller B 30",
      branncellebegrensende: "B 30",
      kjeller: "A 60",
      trapperomOgHeissjakt: "B 30",
      trappeloep: "A 10 eller B 30",
    },
    4: {
      hovedsystem: "B 15",
      sekundaer: "B 15",
      branncellebegrensende: "B 30",
      kjeller: "A 60",
      trapperomOgHeissjakt: "B 15",
      trappeloep: "Ingen krav",
    },
  };

  const k = krav[klasse];
  const tekst = `Bærende hovedsystem: ${k.hovedsystem}
Sekundære bærende deler, etasjeskiller som ikke er stabiliserende: ${k.sekundaer}
Ikke-bærende branncellebegrensende bygningsdel (unntatt yttervegg): ${k.branncellebegrensende}
Bygningsdel under øverste kjellergolv: ${k.kjeller}
Bygningsdel som omgir trapperom og heissjakt: ${k.trapperomOgHeissjakt}
Trappeløp: ${k.trappeloep}`;

  return { tekst, kravTabell: k };
};

export interface BF85BaereevneKrav {
  hovedsystem: string;
  sekundaer: string;
  branncellebegrensende: string;
  kjeller: string;
  trapperomOgHeissjakt: string;
  trappeloep: string;
}

/**
 * Get BF85 TOC entries mapped to TEK17 structure
 */
export const getBF85TocEntries = (): { num: string; title: string }[] =>
  bf85MappedSections.map((s) => ({
    num: s.tek17Key.replace("3_", "2."),
    title: `${s.bf85Ref} – ${s.bf85Title}`,
  }));

/**
 * Legacy BF85 sections (kept for backward compatibility).
 * @deprecated Use bf85MappedSections instead.
 */
export const bf85Sections: BF85Section[] = bf85MappedSections.map((s, i) => ({
  id: `bf85_${s.tek17Key}`,
  ref: s.bf85Ref,
  title: s.bf85Title,
  description: s.bf85Description,
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

/**
 * BF85 Tabell 32:12 – Maks bruttoareal pr etasje uten oppdeling med brannvegg for skoler.
 * Returns the max area and corresponding bygningsbrannklasse for schools.
 */
export interface BF85BrannveggKravSkole {
  etasjerLabel: string;
  maksAreal: number;
  bygningsbrannklasse: string;
}

export const bf85BrannveggTabellSkole: BF85BrannveggKravSkole[] = [
  { etasjerLabel: "1", maksAreal: 800, bygningsbrannklasse: "4" },
  { etasjerLabel: "1", maksAreal: 1200, bygningsbrannklasse: "3" },
  { etasjerLabel: "2", maksAreal: 800, bygningsbrannklasse: "3" },
  { etasjerLabel: "2", maksAreal: 1200, bygningsbrannklasse: "2" },
  { etasjerLabel: "3 og 4", maksAreal: 800, bygningsbrannklasse: "2" },
  { etasjerLabel: "over 4", maksAreal: 800, bygningsbrannklasse: "1" },
];

/**
 * Evaluate if brannvegg is required for a school based on BF85 Tabell 32:12.
 * Sprinkler, brannalarm, and røykluker do NOT affect the area limits in BF85.
 */
export const getBF85BrannveggKravSkole = (
  etasjer: number,
  arealPerEtasje: number,
  bygningsbrannklasse: string,
): { krevBrannvegg: boolean; maksAreal: number; merknad?: string } | null => {
  if (etasjer < 1 || arealPerEtasje <= 0 || !bygningsbrannklasse) return null;

  // Find the max area for the given floors + bygningsbrannklasse
  const match = bf85BrannveggTabellSkole.find((row) => {
    const klasseMatch = row.bygningsbrannklasse === bygningsbrannklasse;
    if (etasjer === 1) return klasseMatch && row.etasjerLabel === "1";
    if (etasjer === 2) return klasseMatch && row.etasjerLabel === "2";
    if (etasjer >= 3 && etasjer <= 4) return klasseMatch && row.etasjerLabel === "3 og 4";
    if (etasjer > 4) return klasseMatch && row.etasjerLabel === "over 4";
    return false;
  });

  if (!match) return null;

  const krevBrannvegg = arealPerEtasje > match.maksAreal;
  return {
    krevBrannvegg,
    maksAreal: match.maksAreal,
    merknad: krevBrannvegg
      ? `Bruttoareal pr. etasje (${arealPerEtasje} m²) overstiger maks tillatt areal (${match.maksAreal} m²) for bygningsbrannklasse ${bygningsbrannklasse}. Oppdeling med brannvegg er påkrevd.`
      : `Bruttoareal pr. etasje (${arealPerEtasje} m²) er innenfor maks tillatt areal (${match.maksAreal} m²) for bygningsbrannklasse ${bygningsbrannklasse}. Oppdeling med brannvegg er ikke påkrevd.`,
  };
};
