// Konsekvens- og sannsynlighetskriterier for ROS bow-tie / 5×5-matrise.
// Strukturert per bransje slik at vi enkelt kan legge til flere senere
// (industri, helse, skole, lager osv.) uten å endre UI.

export type BransjeId = "kraftstasjon";

export type KonsekvensDimensjon =
  | "forsyningssikkerhet"
  | "personellsikkerhet"
  | "ytre_miljø"
  | "økonomi"
  | "omdømme";

export const DIMENSJON_NAVN: Record<KonsekvensDimensjon, string> = {
  forsyningssikkerhet: "Forsyningssikkerhet",
  personellsikkerhet: "Personellsikkerhet",
  ytre_miljø: "Ytre miljø",
  økonomi: "Økonomi",
  omdømme: "Omdømme",
};

export const ALLE_DIMENSJONER: KonsekvensDimensjon[] = [
  "forsyningssikkerhet",
  "personellsikkerhet",
  "ytre_miljø",
  "økonomi",
  "omdømme",
];

export interface KriterieRad {
  niva: 1 | 2 | 3 | 4 | 5;
  navn: string;
  beskrivelse: string;
}

export interface KriterieTabell {
  tittel: string;
  rader: KriterieRad[];
}

export const KONSEKVENS_KRITERIER: Record<BransjeId, Record<KonsekvensDimensjon, KriterieTabell>> = {
  kraftstasjon: {
    forsyningssikkerhet: {
      tittel: "Konsekvenskriterier – forsyningssikkerhet (kraftstasjon)",
      rader: [
        { niva: 1, navn: "Ubetydelig", beskrivelse: "Ikke avbrudd i strøm- eller fjernvarmeforsyning." },
        { niva: 2, navn: "Liten", beskrivelse: "Ingen samfunnskonsekvenser. Avbrudd < 10 timer hos < 10 sluttbrukere." },
        { niva: 3, navn: "Middels", beskrivelse: "Noen lokale konsekvenser for privatabonnenter. Avbrudd < 10 t hos < 1000 sluttbrukere, eller ≥ 10 t hos < 10 sluttbrukere." },
        { niva: 4, navn: "Alvorlig", beskrivelse: "Alvorlige konsekvenser i infrastruktur og lokalsamfunn. Avbrudd ≥ 10 t hos < 1000 sluttbrukere." },
        { niva: 5, navn: "Kritisk", beskrivelse: "Samfunnsviktige funksjoner som liv og helse, samt viktig infrastruktur, rammet/satt ut av funksjon. Avbrudd ≥ 10 t hos ≥ 1000 sluttbrukere." },
      ],
    },
    personellsikkerhet: {
      tittel: "Konsekvenskriterier – personellsikkerhet",
      rader: [
        { niva: 1, navn: "Ubetydelig", beskrivelse: "Ingen personskade." },
        { niva: 2, navn: "Liten", beskrivelse: "Mindre personskade, førstehjelp tilstrekkelig." },
        { niva: 3, navn: "Middels", beskrivelse: "Moderat personskade som krever legehjelp, sykefravær < 1 mnd." },
        { niva: 4, navn: "Alvorlig", beskrivelse: "Alvorlig personskade med langvarig sykefravær eller varig mén." },
        { niva: 5, navn: "Kritisk", beskrivelse: "Dødsfall eller flere alvorlig skadde." },
      ],
    },
    ytre_miljø: {
      tittel: "Konsekvenskriterier – ytre miljø",
      rader: [
        { niva: 1, navn: "Ubetydelig", beskrivelse: "Ingen miljøpåvirkning." },
        { niva: 2, navn: "Liten", beskrivelse: "Mindre utslipp, oppryddes innen kort tid og uten varig skade." },
        { niva: 3, navn: "Middels", beskrivelse: "Betydelig lokalt utslipp, opprydding tar uker, ingen varig skade." },
        { niva: 4, navn: "Alvorlig", beskrivelse: "Stort utslipp eller forurensning av vassdrag, varig miljøskade lokalt." },
        { niva: 5, navn: "Kritisk", beskrivelse: "Omfattende eller permanent miljøskade, regional/nasjonal betydning." },
      ],
    },
    økonomi: {
      tittel: "Konsekvenskriterier – økonomi",
      rader: [
        { niva: 1, navn: "Ubetydelig", beskrivelse: "Kostnad < 100 000 NOK." },
        { niva: 2, navn: "Liten", beskrivelse: "Kostnad 100 000–1 mill NOK." },
        { niva: 3, navn: "Middels", beskrivelse: "Kostnad 1–10 mill NOK." },
        { niva: 4, navn: "Alvorlig", beskrivelse: "Kostnad 10–100 mill NOK." },
        { niva: 5, navn: "Kritisk", beskrivelse: "Kostnad > 100 mill NOK eller truer virksomhetens drift." },
      ],
    },
    omdømme: {
      tittel: "Konsekvenskriterier – omdømme",
      rader: [
        { niva: 1, navn: "Ubetydelig", beskrivelse: "Ingen oppmerksomhet utenfor virksomheten." },
        { niva: 2, navn: "Liten", beskrivelse: "Kortvarig negativ omtale i lokale medier." },
        { niva: 3, navn: "Middels", beskrivelse: "Varig negativ omtale lokalt eller kortvarig regionalt." },
        { niva: 4, navn: "Alvorlig", beskrivelse: "Varig negativ omtale regionalt/nasjonalt, tap av tillit hos kunder eller myndigheter." },
        { niva: 5, navn: "Kritisk", beskrivelse: "Nasjonal/internasjonal mediedekning, tap av konsesjon eller alvorlig svekkelse av merkevare." },
      ],
    },
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
