// Forhåndsdefinerte konsekvenser for ROS bow-tie analyse.
// Kuratert med fokus på brann og eksplosjon, basert på DSB, NS 5814,
// FEU og generell ROS-praksis. Dekker bolig, næring, industri, lager,
// helse, skole, kulturbygg, parkering og kraftstasjon.

export interface KonsekvensForslag {
  kategori: string;
  tekst: string;
}

export const KONSEKVENS_FORSLAG: KonsekvensForslag[] = [
  // Liv og helse
  { kategori: "Liv og helse", tekst: "Dødsfall blant beboere eller brukere" },
  { kategori: "Liv og helse", tekst: "Alvorlig personskade (brannskader, røykforgiftning)" },
  { kategori: "Liv og helse", tekst: "Lettere personskader" },
  { kategori: "Liv og helse", tekst: "Dødsfall eller skade på innsatspersonell (brannvesen)" },
  { kategori: "Liv og helse", tekst: "Panikk og klemskader under evakuering" },
  { kategori: "Liv og helse", tekst: "Psykiske ettervirkninger / traumer" },
  { kategori: "Liv og helse", tekst: "Skade på husdyr eller dyr i landbruksbygg" },

  // Bygning og materielle verdier
  { kategori: "Bygning og materielle verdier", tekst: "Totalskade av bygning" },
  { kategori: "Bygning og materielle verdier", tekst: "Omfattende brann- og røykskader i deler av bygget" },
  { kategori: "Bygning og materielle verdier", tekst: "Vannskader som følge av slokkeinnsats" },
  { kategori: "Bygning og materielle verdier", tekst: "Skade på bærende konstruksjoner / fare for kollaps" },
  { kategori: "Bygning og materielle verdier", tekst: "Skade på fasade og tak ved utvendig brannspredning" },
  { kategori: "Bygning og materielle verdier", tekst: "Brannspredning til nabobygg" },
  { kategori: "Bygning og materielle verdier", tekst: "Skade på tekniske installasjoner (el, VVS, ventilasjon)" },
  { kategori: "Bygning og materielle verdier", tekst: "Skade på heis og rømningsveier" },
  { kategori: "Bygning og materielle verdier", tekst: "Skade på inventar og løsøre" },

  // Eksplosjon
  { kategori: "Eksplosjon", tekst: "Trykkbølge med skade på bygningskropp" },
  { kategori: "Eksplosjon", tekst: "Splintskader fra knust glass og fasadeelementer" },
  { kategori: "Eksplosjon", tekst: "Sekundær brann etter eksplosjon" },
  { kategori: "Eksplosjon", tekst: "Skade på nabobygg fra trykkbølge eller kastestykker" },
  { kategori: "Eksplosjon", tekst: "Utslipp av brennbar gass eller damp" },
  { kategori: "Eksplosjon", tekst: "BLEVE / kjelesprengning" },
  { kategori: "Eksplosjon", tekst: "Domino-effekt på nærliggende industri eller tankanlegg" },

  // Miljø
  { kategori: "Miljø", tekst: "Utslipp av røyk og forurenset slokkevann til grunn eller vassdrag" },
  { kategori: "Miljø", tekst: "Spredning av farlige stoffer (kjemikalier, asbest, PCB)" },
  { kategori: "Miljø", tekst: "Klimagassutslipp ved storbrann" },
  { kategori: "Miljø", tekst: "Forurensning av drikkevannskilder" },

  // Drift, økonomi og samfunn
  { kategori: "Drift, økonomi og samfunn", tekst: "Driftsstans eller produksjonsstopp" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Tap av kritisk infrastruktur (strøm, IKT, nødnett)" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Tap av kulturhistoriske verdier / uerstattelige objekter" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Tap av forskningsdata eller dokumentasjon" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Økonomisk tap (gjenoppbygging, erstatninger)" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Tap av omdømme" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Forsikringsmessige konsekvenser / regress" },
  { kategori: "Drift, økonomi og samfunn", tekst: "Tap av leieinntekter" },

  // Evakuering og beredskap
  { kategori: "Evakuering og beredskap", tekst: "Behov for omplassering av beboere eller brukere" },
  { kategori: "Evakuering og beredskap", tekst: "Stenging av vei eller område rundt bygget" },
  { kategori: "Evakuering og beredskap", tekst: "Belastning på nødetater og helsetjeneste" },
  { kategori: "Evakuering og beredskap", tekst: "Behov for langvarig brannvakt etter hendelsen" },

  // Sårbare bygg og spesielle scenarier
  { kategori: "Sårbare bygg og spesielle scenarier", tekst: "Risiko for pasienter som ikke kan evakuere selv (sykehus, sykehjem)" },
  { kategori: "Sårbare bygg og spesielle scenarier", tekst: "Risiko for barn i barnehage eller skole" },
  { kategori: "Sårbare bygg og spesielle scenarier", tekst: "Spredning til lagrede brannfarlige varer" },
  { kategori: "Sårbare bygg og spesielle scenarier", tekst: "Brann i elbil eller batteripakke (litium-ion)" },
  { kategori: "Sårbare bygg og spesielle scenarier", tekst: "Brann i parkeringsanlegg med rask spredning mellom kjøretøy" },
  { kategori: "Sårbare bygg og spesielle scenarier", tekst: "Bortfall av strømforsyning til kritisk virksomhet" },
];

export function groupKonsekvenserByKategori(): Record<string, KonsekvensForslag[]> {
  const out: Record<string, KonsekvensForslag[]> = {};
  for (const k of KONSEKVENS_FORSLAG) {
    (out[k.kategori] ||= []).push(k);
  }
  return out;
}
