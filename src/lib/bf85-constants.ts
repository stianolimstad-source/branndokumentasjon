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
