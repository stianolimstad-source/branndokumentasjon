// Bakoverkompatibel fasade. Den faktiske implementasjonen ligger nå i
// `@/lib/tek17/`. Denne filen re-eksporterer for å unngå å bryte eksisterende
// importer fra denne stien.
export {
  branncelleTyperListe,
} from "@/lib/tek17/branncelle";

export {
  getBrannklasse,
} from "@/lib/tek17/brannklasser";

export {
  getAktiveRiskKlasser,
} from "@/lib/tek17/risikoklasser";

export {
  getFluktveiKrav,
  getStrengesteFluktvei,
  getFriBreddeKrav,
  getStrengesteFriBredde,
  beregnPersontall,
} from "@/lib/tek17/romning";
