import defaultBuilding from "@/assets/default-building.jpg";
import defaultBolig from "@/assets/default-bolig.jpg";
import defaultSkole from "@/assets/default-skole.jpg";
import defaultKontor from "@/assets/default-kontor.jpg";
import defaultIndustri from "@/assets/default-industri.jpg";
import defaultHotell from "@/assets/default-hotell.jpg";
import defaultForretning from "@/assets/default-forretning.jpg";

type BuildingCategory = "bolig" | "skole" | "kontor" | "industri" | "hotell" | "forretning" | "default";

const bygningsTypeKategoriMap: Record<string, BuildingCategory> = {
  // Bolig
  "Bolig": "bolig",
  "Boligbrakke": "bolig",
  "Studentbolig": "bolig",
  "Fritidsbolig, inkl. selvbetjente hytter, campinghytter og campingenheter": "bolig",
  "Internat": "bolig",
  "Bolig beregnet for personer med behov for heldøgns pleie og omsorg": "bolig",
  "Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger": "bolig",
  // Skole / barnehage
  "Barnehage": "skole",
  "Skole": "skole",
  "Barnehjem": "skole",
  "Forlegning og leirskole": "skole",
  // Kontor
  "Kontor": "kontor",
  "Laboratorium": "kontor",
  "Brannstasjon uten døgnbemanning": "kontor",
  "Brannstasjon med døgnbemanning": "kontor",
  "Trafo eller fordelingsstasjon": "kontor",
  // Industri / lager
  "Industri": "industri",
  "Lager": "industri",
  "Fryselager": "industri",
  "Sagbruk": "industri",
  "Trelastopplag": "industri",
  "Kjemisk fabrikk og kjemikalielager": "industri",
  "Sprengstoffindustri": "industri",
  "Flyhangar": "industri",
  "Arbeidsbrakke": "industri",
  "Båtnaust": "industri",
  "Carport": "industri",
  "Skur": "industri",
  "Driftsbygning med husdyrrom": "industri",
  "Garasje og parkeringshus med én etasje": "industri",
  "Parkeringshus og garasje med to eller flere etasjer eller plan": "industri",
  "Parkeringskjeller og garasje under terreng": "industri",
  // Hotell / overnatting
  "Overnattingssted og hotell": "hotell",
  "Turisthytte og vandrerhjem": "hotell",
  "Pleieinstitusjon": "hotell",
  "Sykehus og sykehjem": "hotell",
  "Asylmottak og transittmottak": "hotell",
  "Arrestlokaler og fengsel": "hotell",
  // Forretning / forsamling
  "Forsamlingslokale": "forretning",
  "Idrettshall": "forretning",
  "Kantine beregnet for utleie eller for mer enn 150 personer": "forretning",
  "Kantine beregnet for egne ansatte til og med 150 personer": "forretning",
  "Kinolokale": "forretning",
  "Kirke": "forretning",
  "Kongressenter": "forretning",
  "Messelokale": "forretning",
  "Museum": "forretning",
  "Salgslokale": "forretning",
  "Teaterlokale": "forretning",
  "Trafikkterminaler": "forretning",
  "Tribuneanlegg for mer enn 150 personer": "forretning",
};

const categoryImageMap: Record<BuildingCategory, string> = {
  bolig: defaultBolig,
  skole: defaultSkole,
  kontor: defaultKontor,
  industri: defaultIndustri,
  hotell: defaultHotell,
  forretning: defaultForretning,
  default: defaultBuilding,
};

export function getDefaultBuildingImage(bygningstype?: string | null): string {
  if (!bygningstype) return defaultBuilding;
  const category = bygningsTypeKategoriMap[bygningstype];
  return category ? categoryImageMap[category] : defaultBuilding;
}
