// Konsekvens- og sannsynlighetskriterier for ROS bow-tie / 5×5-matrise.
// Strukturert per bransje slik at vi enkelt kan legge til flere senere
// (industri, helse, skole, lager osv.) uten å endre UI.

export type BransjeId = "kraftstasjon";

export interface KriterieRad {
  niva: 1 | 2 | 3 | 4 | 5;
  navn: string;
  beskrivelse: string;
}

export interface KriterieTabell {
  tittel: string;
  rader: KriterieRad[];
}

export const KONSEKVENS_KRITERIER: Record<BransjeId, KriterieTabell> = {
  kraftstasjon: {
    tittel: "Konsekvenskriterier – forsyningssikkerhet (kraftstasjon)",
    rader: [
      { niva: 1, navn: "Ubetydelig", beskrivelse: "Ikke avbrudd i strøm- eller fjernvarmeforsyning." },
      { niva: 2, navn: "Liten", beskrivelse: "Ingen samfunnskonsekvenser. Avbrudd < 10 timer hos < 10 sluttbrukere." },
      { niva: 3, navn: "Middels", beskrivelse: "Noen lokale konsekvenser for privatabonnenter. Avbrudd < 10 t hos < 1000 sluttbrukere, eller ≥ 10 t hos < 10 sluttbrukere." },
      { niva: 4, navn: "Alvorlig", beskrivelse: "Alvorlige konsekvenser i infrastruktur og lokalsamfunn. Avbrudd ≥ 10 t hos < 1000 sluttbrukere." },
      { niva: 5, navn: "Kritisk", beskrivelse: "Samfunnsviktige funksjoner som liv og helse, samt viktig infrastruktur, rammet/satt ut av funksjon. Avbrudd ≥ 10 t hos ≥ 1000 sluttbrukere." },
    ],
  },
};

export const SANNSYNLIGHET_KRITERIER: Record<BransjeId, KriterieTabell> = {
  kraftstasjon: {
    tittel: "Sannsynlighetskriterier – frekvens (kraftstasjon)",
    rader: [
      { niva: 1, navn: "Svært lite sannsynlig", beskrivelse: "Sjeldnere enn hvert 1000. år (aldri hørt om lignende). Inkluderer tilnærmet «utenkelige» forhold." },
      { niva: 2, navn: "Lite sannsynlig", beskrivelse: "Fra hvert 100. år til hvert 1000. år (hørt om lignende i Norge eller utlandet)." },
      { niva: 3, navn: "Sannsynlig", beskrivelse: "Fra hvert 10. år til hvert 100. år (skjedd i selskapet eller hos andre)." },
      { niva: 4, navn: "Meget sannsynlig", beskrivelse: "Fra 1 gang pr. år til hvert 10. år (skjedd flere ganger i eget eller andres selskap)." },
      { niva: 5, navn: "Svært sannsynlig", beskrivelse: "Oftere enn 1 gang pr. år (skjer ofte/svært ofte i eget/andres selskap)." },
    ],
  },
};

export function nivaaFargeKlasse(niva: 1 | 2 | 3 | 4 | 5): string {
  // Visuell kobling til 5×5-matrisen (grønn/gul/oransje/rød)
  switch (niva) {
    case 1: return "bg-emerald-500/85 text-white";
    case 2: return "bg-emerald-500/85 text-white";
    case 3: return "bg-amber-400/90 text-foreground";
    case 4: return "bg-orange-500/90 text-white";
    case 5: return "bg-red-500/90 text-white";
  }
}
