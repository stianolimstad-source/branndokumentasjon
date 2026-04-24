// =============================================================================
// Lagring av brannfarlig stoff – basert på DSB Temaveiledning om oppbevaring
// av farlig stoff + VTEK § 11-8
// =============================================================================

export type BrensellagringKravItem = { kategori: string; tekst: string; ansvar: string; referanse?: { label: string; url: string } };

export type BrenselType = "fyringsparafin" | "lett_fyringsolje" | "begge" | "propan" | "brannfarlig_gass" | "bensin" | "brannfarlig_vaeske_kat3";

export interface BrensellagringResult {
  romType: string;
  krav: BrensellagringKravItem[];
  feilmelding?: string;
}

// ---------------------------------------------------------------------------
// 1. Stoffkategorier iht. DSB / GHS – utvidet med data fra § 4.1 + gasser
// ---------------------------------------------------------------------------
export type VaeskeKategori = "kat1" | "kat2" | "kat3" | "diesel_fyringsolje" | "gass_kat1" | "gass_kat2";

export interface StoffInfo {
  id: string;
  navn: string;
  kategori: VaeskeKategori;
  kategoriNavn: string;
  flammepunkt: string;
  densitet: string;
  nedreBrennverdi: string;
  viskositet: string;
  destillasjonsintervall: string;
  karboninnhold: string;
  hydrogeninnhold: string;
  eksempler: string;
  /** For gasser: eksplosjonsgrenser i luft (vol%) */
  eksplosjonsgrenser?: string;
  /** For gasser: selvantennelsestemperatur */
  selvantennelse?: string;
  /** Aggregattilstand */
  tilstand: "væske" | "gass";
}

export const STOFF_KATALOG: StoffInfo[] = [
  // ===== BRANNFARLIGE VÆSKER – KATEGORI 1 =====
  {
    id: "bensin",
    navn: "Bensin",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "< −40 °C",
    densitet: "735–765 kg/m³",
    nedreBrennverdi: "43,8 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "< 20–210 °C",
    karboninnhold: "ca. 86 %",
    hydrogeninnhold: "ca. 14 %",
    eksempler: "Motorbensin, flybensin",
    tilstand: "væske",
  },
  {
    id: "etanol",
    navn: "Etanol",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "12 °C",
    densitet: "790 kg/m³",
    nedreBrennverdi: "26,7 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "78 °C",
    karboninnhold: "52 %",
    hydrogeninnhold: "13 %",
    eksempler: "Sprit, E85-drivstoff",
    tilstand: "væske",
  },
  {
    id: "metanol",
    navn: "Metanol",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "11 °C",
    densitet: "792 kg/m³",
    nedreBrennverdi: "19,9 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "64,7 °C",
    karboninnhold: "37,5 %",
    hydrogeninnhold: "12,5 %",
    eksempler: "Industriløsemiddel",
    tilstand: "væske",
  },
  {
    id: "dietyleter",
    navn: "Dietyleter",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "−45 °C",
    densitet: "713 kg/m³",
    nedreBrennverdi: "33,9 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "34,6 °C",
    karboninnhold: "64,9 %",
    hydrogeninnhold: "13,5 %",
    eksempler: "Eter, løsemiddel",
    tilstand: "væske",
  },
  {
    id: "pentan",
    navn: "Pentan",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "−49 °C",
    densitet: "626 kg/m³",
    nedreBrennverdi: "45,4 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "36 °C",
    karboninnhold: "83,3 %",
    hydrogeninnhold: "16,7 %",
    eksempler: "Blåsemiddel, løsemiddel",
    tilstand: "væske",
  },
  {
    id: "karbondisulfid",
    navn: "Karbondisulfid (CS₂)",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "−30 °C",
    densitet: "1 263 kg/m³",
    nedreBrennverdi: "13,6 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "46 °C",
    karboninnhold: "15,8 %",
    hydrogeninnhold: "–",
    eksempler: "Industrikjemikalie",
    selvantennelse: "90 °C",
    tilstand: "væske",
  },

  // ===== BRANNFARLIGE VÆSKER – KATEGORI 2 =====
  {
    id: "aceton",
    navn: "Aceton",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "−20 °C",
    densitet: "790 kg/m³",
    nedreBrennverdi: "29,6 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "56 °C",
    karboninnhold: "62 %",
    hydrogeninnhold: "10,3 %",
    eksempler: "Neglefjerner, løsemiddel",
    tilstand: "væske",
  },
  {
    id: "toluen",
    navn: "Toluen",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "4 °C",
    densitet: "867 kg/m³",
    nedreBrennverdi: "40,6 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "111 °C",
    karboninnhold: "91,3 %",
    hydrogeninnhold: "8,7 %",
    eksempler: "Løsemiddel, maling",
    tilstand: "væske",
  },
  {
    id: "xylen",
    navn: "Xylen",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "17–32 °C",
    densitet: "860–880 kg/m³",
    nedreBrennverdi: "40,8 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "137–144 °C",
    karboninnhold: "90,5 %",
    hydrogeninnhold: "9,5 %",
    eksempler: "Lakktynner, løsemiddel",
    tilstand: "væske",
  },
  {
    id: "isopropanol",
    navn: "Isopropanol (IPA)",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "12 °C",
    densitet: "786 kg/m³",
    nedreBrennverdi: "30,5 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "82,6 °C",
    karboninnhold: "60 %",
    hydrogeninnhold: "13,3 %",
    eksempler: "Desinfeksjon, rengjøring",
    tilstand: "væske",
  },
  {
    id: "etylacetat",
    navn: "Etylacetat",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "−4 °C",
    densitet: "897 kg/m³",
    nedreBrennverdi: "23,8 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "77 °C",
    karboninnhold: "54,5 %",
    hydrogeninnhold: "9,1 %",
    eksempler: "Lim, lakk, løsemiddel",
    tilstand: "væske",
  },
  {
    id: "metyletylketon",
    navn: "Metyletylketon (MEK)",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "−9 °C",
    densitet: "805 kg/m³",
    nedreBrennverdi: "31,5 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "80 °C",
    karboninnhold: "66,6 %",
    hydrogeninnhold: "11,1 %",
    eksempler: "Industriløsemiddel",
    tilstand: "væske",
  },
  {
    id: "heksan",
    navn: "n-Heksan",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "−22 °C",
    densitet: "660 kg/m³",
    nedreBrennverdi: "44,8 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "69 °C",
    karboninnhold: "83,7 %",
    hydrogeninnhold: "16,3 %",
    eksempler: "Ekstraksjon, løsemiddel",
    tilstand: "væske",
  },
  {
    id: "propanol",
    navn: "n-Propanol",
    kategori: "kat2",
    kategoriNavn: "Brannfarlig væske, kategori 2",
    flammepunkt: "15 °C",
    densitet: "803 kg/m³",
    nedreBrennverdi: "30,7 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "97 °C",
    karboninnhold: "60 %",
    hydrogeninnhold: "13,3 %",
    eksempler: "Løsemiddel, desinfeksjon",
    tilstand: "væske",
  },

  // ===== BRANNFARLIGE VÆSKER – KATEGORI 3 =====
  {
    id: "fyringsparafin",
    navn: "Fyringsparafin",
    kategori: "kat3",
    kategoriNavn: "Brannfarlig væske, kategori 3",
    flammepunkt: "≥ 35 °C",
    densitet: "780–815 kg/m³",
    nedreBrennverdi: "43,2 MJ/kg",
    viskositet: "2–4 cSt v/−20 °C",
    destillasjonsintervall: "150–280 °C",
    karboninnhold: "86 %",
    hydrogeninnhold: "14 %",
    eksempler: "Parafin, JetA1",
    tilstand: "væske",
  },
  {
    id: "white_spirit",
    navn: "White spirit",
    kategori: "kat3",
    kategoriNavn: "Brannfarlig væske, kategori 3",
    flammepunkt: "36–65 °C",
    densitet: "770–790 kg/m³",
    nedreBrennverdi: "43,0 MJ/kg",
    viskositet: "1–2 cSt v/25 °C",
    destillasjonsintervall: "145–205 °C",
    karboninnhold: "ca. 85 %",
    hydrogeninnhold: "ca. 15 %",
    eksempler: "Maletynner, rengjøring",
    tilstand: "væske",
  },
  {
    id: "styren",
    navn: "Styren",
    kategori: "kat3",
    kategoriNavn: "Brannfarlig væske, kategori 3",
    flammepunkt: "31 °C",
    densitet: "906 kg/m³",
    nedreBrennverdi: "40,5 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "145 °C",
    karboninnhold: "92,3 %",
    hydrogeninnhold: "7,7 %",
    eksempler: "Plastproduksjon, GRP",
    tilstand: "væske",
  },
  {
    id: "terpentin",
    navn: "Terpentin",
    kategori: "kat3",
    kategoriNavn: "Brannfarlig væske, kategori 3",
    flammepunkt: "35–40 °C",
    densitet: "855–870 kg/m³",
    nedreBrennverdi: "42,0 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "150–180 °C",
    karboninnhold: "ca. 88 %",
    hydrogeninnhold: "ca. 12 %",
    eksempler: "Maling, ferniss",
    tilstand: "væske",
  },
  {
    id: "butanol",
    navn: "n-Butanol",
    kategori: "kat3",
    kategoriNavn: "Brannfarlig væske, kategori 3",
    flammepunkt: "29 °C",
    densitet: "810 kg/m³",
    nedreBrennverdi: "33,1 MJ/kg",
    viskositet: "Ikke relevant",
    destillasjonsintervall: "117 °C",
    karboninnhold: "64,8 %",
    hydrogeninnhold: "13,5 %",
    eksempler: "Løsemiddel, plastproduksjon",
    tilstand: "væske",
  },

  // ===== DIESEL OG FYRINGSOLJER =====
  {
    id: "diesel",
    navn: "Diesel",
    kategori: "diesel_fyringsolje",
    kategoriNavn: "Diesel og fyringsoljer",
    flammepunkt: "≥ 56 °C",
    densitet: "820–845 kg/m³",
    nedreBrennverdi: "42,8 MJ/kg",
    viskositet: "1,5–4 cSt v/40 °C",
    destillasjonsintervall: "180–360 °C",
    karboninnhold: "ca. 86 %",
    hydrogeninnhold: "ca. 14 %",
    eksempler: "Autodiesel, gassolje",
    tilstand: "væske",
  },
  {
    id: "lett_fyringsolje",
    navn: "Lett fyringsolje",
    kategori: "diesel_fyringsolje",
    kategoriNavn: "Diesel og fyringsoljer",
    flammepunkt: "≥ 56 °C",
    densitet: "820–870 kg/m³",
    nedreBrennverdi: "42,7 MJ/kg",
    viskositet: "1,5–4 cSt v/40 °C",
    destillasjonsintervall: "180–370 °C",
    karboninnhold: "86 %",
    hydrogeninnhold: "ca. 14 %",
    eksempler: "Fyringsolje nr. 1",
    tilstand: "væske",
  },
  {
    id: "tung_fyringsolje",
    navn: "Tung fyringsolje",
    kategori: "diesel_fyringsolje",
    kategoriNavn: "Diesel og fyringsoljer",
    flammepunkt: "≥ 65 °C",
    densitet: "920–1 010 kg/m³",
    nedreBrennverdi: "40,0 MJ/kg",
    viskositet: "50–700 cSt v/50 °C",
    destillasjonsintervall: "250–600 °C",
    karboninnhold: "ca. 85 %",
    hydrogeninnhold: "ca. 11 %",
    eksempler: "Fyringsolje nr. 3/5/6",
    tilstand: "væske",
  },
  {
    id: "biodiesel",
    navn: "Biodiesel (FAME)",
    kategori: "diesel_fyringsolje",
    kategoriNavn: "Diesel og fyringsoljer",
    flammepunkt: "≥ 120 °C",
    densitet: "860–900 kg/m³",
    nedreBrennverdi: "37,2 MJ/kg",
    viskositet: "3,5–5 cSt v/40 °C",
    destillasjonsintervall: "315–360 °C",
    karboninnhold: "ca. 77 %",
    hydrogeninnhold: "ca. 12 %",
    eksempler: "B100, rapsmetylester",
    tilstand: "væske",
  },

  // ===== BRANNFARLIGE GASSER – KATEGORI 1 =====
  // (LEL ≤ 13 % eller eksplosjonsområde ≥ 12 prosentpoeng)
  {
    id: "hydrogen",
    navn: "Hydrogen (H₂)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "0,089 kg/m³",
    nedreBrennverdi: "120 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−253 °C (kokep.)",
    karboninnhold: "–",
    hydrogeninnhold: "100 %",
    eksempler: "Brenselceller, industri",
    eksplosjonsgrenser: "4–75 vol%",
    selvantennelse: "585 °C",
    tilstand: "gass",
  },
  {
    id: "metan",
    navn: "Metan (CH₄) / Naturgass",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "0,72 kg/m³",
    nedreBrennverdi: "49,8 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−161 °C (kokep.)",
    karboninnhold: "75 %",
    hydrogeninnhold: "25 %",
    eksempler: "Naturgass, CNG, LNG, biogass",
    eksplosjonsgrenser: "5–15 vol%",
    selvantennelse: "540 °C",
    tilstand: "gass",
  },
  {
    id: "propan",
    navn: "Propan (C₃H₈)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "1,96 kg/m³ (gass) / 500 kg/m³ (LPG)",
    nedreBrennverdi: "46,1 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−42 °C (kokep.)",
    karboninnhold: "81,8 %",
    hydrogeninnhold: "18,2 %",
    eksempler: "LPG, grillgass, gassbeholder, campinggass, oppvarming",
    eksplosjonsgrenser: "2,1–9,5 vol%",
    selvantennelse: "480 °C",
    tilstand: "gass",
  },
  {
    id: "butan",
    navn: "n-Butan (C₄H₁₀)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "2,49 kg/m³ (gass) / 580 kg/m³ (flyt.)",
    nedreBrennverdi: "45,7 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−0,5 °C (kokep.)",
    karboninnhold: "82,8 %",
    hydrogeninnhold: "17,2 %",
    eksempler: "Lighter, gassbeholder, campinggass, kartusj, LPG-blanding, aerosol (Biltema, Primus o.l.)",
    eksplosjonsgrenser: "1,8–8,4 vol%",
    selvantennelse: "365 °C",
    tilstand: "gass",
  },
  {
    id: "isobutan",
    navn: "Isobutan / 2-metylpropan (C₄H₁₀)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "2,51 kg/m³ (gass) / 563 kg/m³ (flyt.)",
    nedreBrennverdi: "45,6 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−11,7 °C (kokep.)",
    karboninnhold: "82,8 %",
    hydrogeninnhold: "17,2 %",
    eksempler: "Campinggass-kartusj, gassbeholder, drivgass i aerosol, kjølemedium R600a (ofte blandet med propan/butan i Biltema/Primus)",
    eksplosjonsgrenser: "1,8–8,4 vol%",
    selvantennelse: "460 °C",
    tilstand: "gass",
  },
  {
    id: "acetylen",
    navn: "Acetylen (C₂H₂)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "1,10 kg/m³",
    nedreBrennverdi: "48,2 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−84 °C (kokep.)",
    karboninnhold: "92,3 %",
    hydrogeninnhold: "7,7 %",
    eksempler: "Sveising, skjæring",
    eksplosjonsgrenser: "2,5–80 vol%",
    selvantennelse: "305 °C",
    tilstand: "gass",
  },
  {
    id: "etylen",
    navn: "Etylen (C₂H₄)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "1,18 kg/m³",
    nedreBrennverdi: "47,2 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−104 °C (kokep.)",
    karboninnhold: "85,7 %",
    hydrogeninnhold: "14,3 %",
    eksempler: "Plastindustri, kjemisk syntese",
    eksplosjonsgrenser: "2,7–36 vol%",
    selvantennelse: "490 °C",
    tilstand: "gass",
  },
  {
    id: "etan",
    navn: "Etan (C₂H₆)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "1,28 kg/m³",
    nedreBrennverdi: "47,5 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−89 °C (kokep.)",
    karboninnhold: "80 %",
    hydrogeninnhold: "20 %",
    eksempler: "Naturgasskomponent",
    eksplosjonsgrenser: "3,0–12,4 vol%",
    selvantennelse: "515 °C",
    tilstand: "gass",
  },

  // ===== BRANNFARLIGE GASSER – KATEGORI 2 =====
  {
    id: "ammoniakk",
    navn: "Ammoniakk (NH₃)",
    kategori: "gass_kat2",
    kategoriNavn: "Brannfarlig gass, kategori 2",
    flammepunkt: "Gass",
    densitet: "0,73 kg/m³ (gass) / 682 kg/m³ (flyt.)",
    nedreBrennverdi: "18,6 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−33 °C (kokep.)",
    karboninnhold: "–",
    hydrogeninnhold: "17,6 %",
    eksempler: "Kjøleanlegg, gjødsel",
    eksplosjonsgrenser: "15–28 vol%",
    selvantennelse: "651 °C",
    tilstand: "gass",
  },
  {
    id: "karbonmonoksid",
    navn: "Karbonmonoksid (CO)",
    kategori: "gass_kat2",
    kategoriNavn: "Brannfarlig gass, kategori 2",
    flammepunkt: "Gass",
    densitet: "1,15 kg/m³",
    nedreBrennverdi: "10,1 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−191 °C (kokep.)",
    karboninnhold: "42,9 %",
    hydrogeninnhold: "–",
    eksempler: "Forbrenningsprodukt, industrigass",
    eksplosjonsgrenser: "12,5–74 vol%",
    selvantennelse: "609 °C",
    tilstand: "gass",
  },
  {
    id: "dimetyleter",
    navn: "Dimetyleter (DME)",
    kategori: "gass_kat1",
    kategoriNavn: "Brannfarlig gass, kategori 1",
    flammepunkt: "Gass",
    densitet: "1,95 kg/m³ (gass)",
    nedreBrennverdi: "28,4 MJ/kg",
    viskositet: "–",
    destillasjonsintervall: "−25 °C (kokep.)",
    karboninnhold: "52,2 %",
    hydrogeninnhold: "13 %",
    eksempler: "Drivgass aerosol, alternativt brensel",
    eksplosjonsgrenser: "3,4–18 vol%",
    selvantennelse: "350 °C",
    tilstand: "gass",
  },
];

// ---------------------------------------------------------------------------
// 2. Innmeldingsgrenser til DSB (§ 12)
// ---------------------------------------------------------------------------
export interface InnmeldingsGrense {
  kategori: string;
  stoffer: string;
  grenseLiter: number;
  grenseTekst: string;
}

export const INNMELDINGS_GRENSER: InnmeldingsGrense[] = [
  {
    kategori: "Brannfarlig gass, kategori 1 og 2",
    stoffer: "LPG (propan, butan), LNG (flytende naturgass), CNG (komprimert naturgass), Naturgass (i rørledning)",
    grenseLiter: 400,
    grenseTekst: "400 liter (0,4 m³ beholdervolum)",
  },
  {
    kategori: "Brannfarlig væske, kategori 1 og 2",
    stoffer: "Metanol, Etanol, Propanol, Bensin, E85",
    grenseLiter: 6000,
    grenseTekst: "6 000 liter (6,0 m³ beholdervolum)",
  },
  {
    kategori: "Brannfarlig væske, kategori 3",
    stoffer: "Parafin, JetA1",
    grenseLiter: 12000,
    grenseTekst: "12 000 liter (12 m³ beholdervolum)",
  },
  {
    kategori: "Diesel og fyringsoljer",
    stoffer: "Diesel, gassolje, fyringsolje",
    grenseLiter: 100000,
    grenseTekst: "100 000 liter (100 m³ beholdervolum)",
  },
];

// ---------------------------------------------------------------------------
// 3. Sikkerhetsavstander iht. DSB § 15.11
// ---------------------------------------------------------------------------
export interface SikkerhetsavstandRad {
  objekt: string;
  kat1og2: string;
  kat3: string;
  dieselFyringsolje: string;
}

export const SIKKERHETSAVSTANDER: SikkerhetsavstandRad[] = [
  { objekt: "Brennbar bygning / brennbart opplag", kat1og2: "30 m", kat3: "15 m", dieselFyringsolje: "15 m" },
  { objekt: "Fylleplass bil, tog, kai, fattapperi", kat1og2: "20 m", kat3: "10 m", dieselFyringsolje: "10 m" },
  { objekt: "Fatlager i det fri", kat1og2: "15 m", kat3: "5 m", dieselFyringsolje: "5 m" },
  { objekt: "Jernbane inne på anlegget", kat1og2: "10 m", kat3: "10 m", dieselFyringsolje: "10 m" },
  { objekt: "Fyrhus / trafo", kat1og2: "20 m", kat3: "5 m", dieselFyringsolje: "5 m" },
  { objekt: "Nabotank (ref. vedlegg 1-1)", kat1og2: "Vedl. 1-1", kat3: "Vedl. 1-1", dieselFyringsolje: "¼ av vedl. 1-1, min 5 m" },
  { objekt: "Kraftlinje 0–24 kV", kat1og2: "15 m", kat3: "15 m", dieselFyringsolje: "15 m" },
  { objekt: "Kraftlinje 66–132 kV", kat1og2: "30 m", kat3: "30 m", dieselFyringsolje: "30 m" },
  { objekt: "Kraftlinje 300 kV", kat1og2: "45 m", kat3: "45 m", dieselFyringsolje: "45 m" },
  { objekt: "Kraftlinje 400 kV", kat1og2: "60 m", kat3: "60 m", dieselFyringsolje: "60 m" },
];

// ---------------------------------------------------------------------------
// 4. Interne avstander kat 1 & 2
// ---------------------------------------------------------------------------
export interface InternAvstandRad {
  fra: string;
  fyrhus: string;
  fylleplassKai: string;
  fylleplassBilTog: string;
  pumpehus: string;
  kontor: string;
  hydrant: string;
}

export const INTERNE_AVSTANDER_KAT12: InternAvstandRad[] = [
  { fra: "Fyrhus", fyrhus: "-", fylleplassKai: "50", fylleplassBilTog: "35", pumpehus: "25", kontor: "-", hydrant: "25" },
  { fra: "Fylleplass kai", fyrhus: "50", fylleplassKai: "-", fylleplassBilTog: "35", pumpehus: "20", kontor: "50", hydrant: "50" },
  { fra: "Fylleplass bil/tog", fyrhus: "35", fylleplassKai: "35", fylleplassBilTog: "-", pumpehus: "20", kontor: "40", hydrant: "35" },
  { fra: "Pumpehus", fyrhus: "25", fylleplassKai: "20", fylleplassBilTog: "20", pumpehus: "-", kontor: "20", hydrant: "25" },
  { fra: "Kontor", fyrhus: "-", fylleplassKai: "50", fylleplassBilTog: "40", pumpehus: "20", kontor: "-", hydrant: "25" },
  { fra: "Hydrant", fyrhus: "25", fylleplassKai: "50", fylleplassBilTog: "35", pumpehus: "25", kontor: "25", hydrant: "-" },
];

// ---------------------------------------------------------------------------
// 5. Oppsamling & overfylling krav (§ 15.3)
// ---------------------------------------------------------------------------
export interface OppsamlingKrav {
  tittel: string;
  beskrivelse: string;
  paragraf?: string;
}

export const OPPSAMLING_KRAV: OppsamlingKrav[] = [
  {
    tittel: "Oppsamlingsbasseng – enkelt tank",
    beskrivelse: "Kapasitet lik tankens totale rominnhold + ca. 15 cm overhøyde for skumslokking. I kapasiteten medregnes den delen av tanken som står lavere enn toppen av bassengveggen.",
    paragraf: "§ 15.3.1",
  },
  {
    tittel: "Felles oppsamlingsbasseng – flere tanker",
    beskrivelse: "Kapasitet ≥ volumet av største tank + 10 % av summen av øvrige tankers volum + ca. 15 cm overhøyde.",
    paragraf: "§ 15.3.1",
  },
  {
    tittel: "Materialer",
    beskrivelse: "Oppsamlingsbasseng kan være av stål, betong, betong/murblokker, jord tettet med leire e.l., avhengig av forholdene på stedet. Bassenget skal motstå vanntrykk ved maksimal oppfylling og ha tilstrekkelig brannmotstand.",
    paragraf: "§ 15.3.1",
  },
  {
    tittel: "Drenering",
    beskrivelse: "Bunnen i bassenget skal ha minst 1 % fall bort fra tanken. Dreneringsventiler skal normalt være stengt. Dreneringskapasiteten bør minst tilsvare den vannmengde som kan bli tilført under en brann.",
    paragraf: "§ 15.3.1",
  },
  {
    tittel: "Ledemurer",
    beskrivelse: "I skrånende terreng kan ledemurer lede lekkasje mot oppsamlingsbasseng. Krav til tetthet og vegetasjonsfrihet som for bassenger.",
    paragraf: "§ 15.3.1",
  },
  {
    tittel: "Overfyllingsvarsel",
    beskrivelse: "Tank med fast tilkobling skal ha overfyllingsvarsel. Alarm ved nivå over høyeste tillatte driftsnivå. Det skal da være tilstrekkelig ledig volum og tid til å stoppe videre oppfylling.",
    paragraf: "§ 15.3.2",
  },
  {
    tittel: "Overfyllingsvern",
    beskrivelse: "Krav ved stor fyllehastighet, store konsekvenser eller problematisk kommunikasjon mellom tank og fyllested. Automatisk stopp av tilførsel ved definert nivå + alarm. Skal være uavhengig av tankens nivåovervåkning.",
    paragraf: "§ 15.3.2",
  },
  {
    tittel: "Brannfarlig væske kat. 1 og 2",
    beskrivelse: "Tanker skal ha overfyllingsvern (automatisk stopp). Nivåfølere monteres lett tilgjengelig for funksjonskontroll.",
    paragraf: "§ 15.3.2",
  },
  {
    tittel: "Brannfarlig væske kat. 3 / diesel / fyringsolje",
    beskrivelse: "Tanker skal ha overfyllingsvarsel eller overfyllingsvern.",
    paragraf: "§ 15.3.2",
  },
  {
    tittel: "Oljeutskiller",
    beskrivelse: "Vann fra tanker, oppsamlingsbasseng, bilfylleplasser og kaianlegg skal ledes til oljeutskiller. Ved brannfarlig væske kat. 1 og 2 kreves tilbakeslagssikring (væskelås). Lufterør fra utskiller minst 3 m over terreng.",
    paragraf: "§ 15.3.1",
  },
];

// ---------------------------------------------------------------------------
// 6. Tankkrav – § 15.2
// ---------------------------------------------------------------------------
export interface TankKrav {
  tittel: string;
  beskrivelse: string;
}

export const TANK_KRAV: TankKrav[] = [
  {
    tittel: "Utførelse",
    beskrivelse: "Tanker skal utføres iht. anerkjent norm, f.eks. NS-EN 14015 (tidl. NS 1544) eller NS-EN 12285-2.",
  },
  {
    tittel: "Korrosjonsbeskyttelse",
    beskrivelse: "Tanker skal korrosjonsbeskyttelsesiht. anvendt standard. Beskyttelsen må kontrolleres regelmessig.",
  },
  {
    tittel: "Fundament",
    beskrivelse: "Tanker plasseres på fundament av ubrennbart materiale. Grunnen skal være bæredyktig og telefri.",
  },
  {
    tittel: "Lekkasjedeteksjon",
    beskrivelse: "Vertikale tanker bør ha væsketett plate/membran under eller i fundamentet, med dreneringsrør (sladrerør) for å påvise lekkasje i bunnseksjonen.",
  },
  {
    tittel: "Lufterør",
    beskrivelse: "Skal være av stål og hindre skader på tank pga. over-/undertrykk. Plassering skal ta hensyn til vindretninger, lavpunkter, brennbart opplag og bygninger.",
  },
  {
    tittel: "Flammesikring – kat. 1 & 2",
    beskrivelse: "Tank med flammepunkt < 10 °C over lagringstemperatur krever trykk/vakuumventil, flytetak eller annen godkjent flammesikring.",
  },
  {
    tittel: "Flammesikring – kat. 3 / diesel",
    beskrivelse: "Ingen særlige krav til flammesikring for væsker med flammepunkt ≥ 10 °C over lagringstemperatur.",
  },
];

// ---------------------------------------------------------------------------
// 7. Beliggenhet & utforming – § 15.1
// ---------------------------------------------------------------------------
export interface BeliggenhetKrav {
  tittel: string;
  beskrivelse: string;
}

export const BELIGGENHET_KRAV: BeliggenhetKrav[] = [
  {
    tittel: "Terrengforhold",
    beskrivelse: "Terrengforholdene skal utnyttes slik at eventuell lekkasje og utslipp gir minst mulig påvirkning. Terrenget bør også utnyttes til å begrense brannspredning utenfra og inn mot anlegget.",
  },
  {
    tittel: "Branngater",
    beskrivelse: "Mellom tankgrupper skal det legges branngater. Tankgrupper med samlet volum over 30 000 m³ bør adskilles med branngate ≥ 30 m. Branngater skal gi rask adkomst og være fri for vegetasjon og brennbart opplag.",
  },
  {
    tittel: "Tankgrupper – kat. 1 & 2",
    beskrivelse: "Samlet volum i en gruppe bør ikke overstige 8 000 m³. Tanker med kat. 3/diesel plasseres i egne grupper, adskilt fra kat. 1 & 2, med mindre risikoanalyse tillater samlokalisering.",
  },
  {
    tittel: "Inngjerding",
    beskrivelse: "Anlegg for kat. 1 & 2 skal være inngjerdet. Kat. 3/diesel bør være inngjerdet. Gjerdet skal være ≥ 2 m høyt, avstand til nærmeste anleggsdel ≥ 5 m. Porter skal være låsbare.",
  },
  {
    tittel: "Rømningsveier",
    beskrivelse: "Alle anleggsdeler skal ha minst to uavhengige rømningsveier, fri for trafikkhindringer.",
  },
  {
    tittel: "Vegetasjon",
    beskrivelse: "Gress, busker, nåletrær m.v. må begrenses i nærheten av bilfylleplasser, tappesteder, tanker og annet brannfarlig opplag.",
  },
  {
    tittel: "Transportplan",
    beskrivelse: "Det skal foreligge plan for sikker transport inn til, rundt på og ut av anlegget, inkl. adkomst for brann- og redningsvesenet (normalt fra to sider).",
  },
];

// ---------------------------------------------------------------------------
// 8. Rørledninger – § 15.4
// ---------------------------------------------------------------------------
export interface RoerledningKrav {
  tittel: string;
  beskrivelse: string;
}

export const ROERLEDNING_KRAV: RoerledningKrav[] = [
  {
    tittel: "Over grunn",
    beskrivelse: "Rørledninger bør være helsveiset med nok flenseforbindelser til omkobling uten varmt arbeid. Skal ha arrangement for lengdeforandringer og overtrykksavlastning.",
  },
  {
    tittel: "Bærekonstruksjoner",
    beskrivelse: "Bærekonstruksjoner for rørgater skal være av ubrennbart materiale med tilstrekkelig brannintegritet mot kollaps/brudd. Ingen brannbelastninger under rørgater.",
  },
  {
    tittel: "Nedgravd",
    beskrivelse: "PEH-plast/GRP rørledninger skal være nedgravd i sin helhet. Overgang plast–stål i tett kum eller min. 25 cm under bakken. Maks 0,7 × nominell trykklasse.",
  },
  {
    tittel: "Nye anlegg",
    beskrivelse: "Rørledninger bør legges over bakkenivå eller i væsketett kulvert. Eksisterende nedgravde rørledninger kan aksepteres med god lekkasje- og korrosjonskontroll.",
  },
];

// ---------------------------------------------------------------------------
// 9. Ventiler – § 15.5
// ---------------------------------------------------------------------------
export interface VentilKrav {
  tittel: string;
  beskrivelse: string;
}

export const VENTIL_KRAV: VentilKrav[] = [
  {
    tittel: "Materialkrav",
    beskrivelse: "Utstyr av sikkerhetsmessig betydning (tankventiler, kaiventiler, tilbakeslagsventiler, rørbruddsventiler, trykk-/vakuumventiler, lastearmer) skal være brannsikker utførelse, gods av støpestål eller tilsvarende.",
  },
  {
    tittel: "Tilbakeslagsventiler",
    beskrivelse: "Skal hindre tilbakestrømning ved brudd i pumpe/slange/tilkopling, og overstrømming mellom tanker gjennom lekke ventiler. Plasseres vanligvis på innpumpingsstedet.",
  },
  {
    tittel: "Rørbruddsventil",
    beskrivelse: "Monteres på utløpsledning fra tank, pumpe og der rørbrudd kan gi lekkasje av større mengder. For tanker med oppsamlingsbasseng plasseres ventilen i bassenget.",
  },
  {
    tittel: "Merking & tilgjengelighet",
    beskrivelse: "Viktige stengeventiler og tappeutstyr skal være tydelig merket, lett tilgjengelig i nødsituasjoner, og kunne låses i stengt posisjon.",
  },
];

// ---------------------------------------------------------------------------
// 10. Kontroll & tilstandskontroll – § 9
// ---------------------------------------------------------------------------
export interface KontrollKrav {
  tittel: string;
  beskrivelse: string;
  intervall?: string;
  gjelder: "tank" | "alle";
}

export const KONTROLL_KRAV: KontrollKrav[] = [
  {
    tittel: "Ferdigkontroll",
    beskrivelse: "Før overlevering skal det foretas ferdigkontroll av lager, merking, ventilasjon, branntekniske tiltak og relevante sikkerhetsfunksjoner. Tetthets-/trykkprøving inngår der anlegget har tanker eller rørsystem.",
    intervall: "Ved installasjon",
    gjelder: "alle",
  },
  {
    tittel: "Utvendig tilstandskontroll",
    beskrivelse: "Systematisk tilstandskontroll av tankenes ytre, korrosjonsbeskyttelse, viktige komponenter og sikkerhetsfunksjoner.",
    intervall: "Maks hvert 5. år",
    gjelder: "tank",
  },
  {
    tittel: "Innvendig tilstandskontroll",
    beskrivelse: "Innvendig inspeksjon av tanker for korrosjon, bunnsjikt og strukturell integritet.",
    intervall: "Maks hvert 20. år",
    gjelder: "tank",
  },
  {
    tittel: "Sikkerhetskritisk utstyr",
    beskrivelse: "Kontroll- og sikkerhetsfunksjoner (nødstopp, nødavstengning) kontrolleres og prøves etter fastsatte prosedyrer. Kan bruke NS-EN IEC 61508 for intervallbestemmelse.",
    intervall: "Hvert 2. år (uten 61508)",
    gjelder: "tank",
  },
  {
    tittel: "Rørsystem og utstyr",
    beskrivelse: "Systematisk tilstandskontroll av beholdere, rørsystem og øvrig utstyr.",
    intervall: "Maks hvert 5. år",
    gjelder: "tank",
  },
  {
    tittel: "Visuell kontroll av lager og emballasje",
    beskrivelse: "Periodisk visuell kontroll av emballasje, merking, hylleinnredning og brannskap. Lekkasjer, skadet emballasje og utløpte produkter fjernes.",
    intervall: "Årlig",
    gjelder: "alle",
  },
  {
    tittel: "Kontroll av branntekniske tiltak",
    beskrivelse: "Kontroll av ventilasjon i lagerrom, tetthet på brannskap/oppsamlingskar, tilgjengelighet til slokkeutstyr og rømningsveier.",
    intervall: "Årlig",
    gjelder: "alle",
  },
];

// ---------------------------------------------------------------------------
// 11. Dokumentasjonskrav – § 13
// ---------------------------------------------------------------------------
export interface DokumentasjonKrav {
  type: string;
  referanse: string;
}

export const DOKUMENTASJON_KRAV: DokumentasjonKrav[] = [
  { type: "Igangsettingstillatelse fra kommunen", referanse: "PBL" },
  { type: "Ferdigattest / midlertidig brukstillatelse", referanse: "PBL" },
  { type: "Kompetansedokumentasjon (prosjektering, drift, kontroll)", referanse: "§ 7" },
  { type: "Prosjektering med risikoanalyse og arealdisponeringsplan", referanse: "§ 8.1.1, 14, 16" },
  { type: "Kvittering for innmelding av farlig stoff", referanse: "§ 12" },
  { type: "Monterings-, bruks- og vedlikeholdsveiledninger", referanse: "§ 8.2.2" },
  { type: "Kontrollrapporter med sjekklister", referanse: "§ 9" },
  { type: "Systematisk tilstandskontroll", referanse: "§ 9.6–9.7" },
  { type: "Drifts-, vedlikeholds- og kontrollplaner", referanse: "§ 10" },
  { type: "Branninstruks, varslings- og beredskapsplan", referanse: "§ 10, 19" },
  { type: "Områdeklassifisering og eksplosjonsverndokument", referanse: "§ 15.12" },
  { type: "Elektriske installasjoner", referanse: "§ 15.13" },
  { type: "Samtykke (storulykkevirksomhet)", referanse: "§ 17" },
  { type: "Rapportering av uhell og ulykker", referanse: "§ 20" },
];

// ---------------------------------------------------------------------------
// 12. Pumper & pumperom – § 15.6
// ---------------------------------------------------------------------------
export interface PumpeKrav {
  tittel: string;
  beskrivelse: string;
}

export const PUMPE_KRAV: PumpeKrav[] = [
  {
    tittel: "Plassering",
    beskrivelse: "Pumper bør fortrinnsvis plasseres i friluft. Kan stå i eget rom dersom rommet er av ubrennbare materialer og godt ventilert. Gulv i pumperom skal være væsketett.",
  },
  {
    tittel: "Brannsikring",
    beskrivelse: "Pumper plasseres slik at brann ikke umiddelbart utsetter omgivelsene for varmepåvirkning. For kat. 1 & 2 skal pumper plasseres adskilt fra tanker med tilstrekkelig avstand eller brannvegg.",
  },
  {
    tittel: "Sikkerhet",
    beskrivelse: "Pumper skal være sikret mot varmgang ved kjøring mot stengt ventil. Nødstopp i betryggende avstand. Ventiler for avstenging skal være lett tilgjengelige.",
  },
];

// ---------------------------------------------------------------------------
// 13a. DSB Kapittel 3 – Stykkgods i bygning – mengdegrenser etter areal
// ---------------------------------------------------------------------------

export type ArealKategori = "under200" | "200til1000" | "over1000";

export interface StykkgodsGrense {
  arealKategori: ArealKategori;
  arealBeskrivelse: string;
  aerosoler: number;
  brannfarligGass: string;
  brannfarligVaeskeKat1og2: number;
  brannfarligVaeskeKat3: number;
}

export const STYKKGODS_GRENSER: StykkgodsGrense[] = [
  {
    arealKategori: "under200",
    arealBeskrivelse: "< 200 m²",
    aerosoler: 50,
    brannfarligGass: "60 liter (25,2 kg propan)",
    brannfarligVaeskeKat1og2: 50,
    brannfarligVaeskeKat3: 250,
  },
  {
    arealKategori: "200til1000",
    arealBeskrivelse: "200 – 1 000 m²",
    aerosoler: 100,
    brannfarligGass: "60 liter (25,2 kg propan)",
    brannfarligVaeskeKat1og2: 250,
    brannfarligVaeskeKat3: 500,
  },
  {
    arealKategori: "over1000",
    arealBeskrivelse: "> 1 000 m²",
    aerosoler: 200,
    brannfarligGass: "60 liter (25,2 kg propan)",
    brannfarligVaeskeKat1og2: 250,
    brannfarligVaeskeKat3: 1000,
  },
];

export function getStykkgodsGrense(arealM2: number): StykkgodsGrense {
  if (arealM2 < 200) return STYKKGODS_GRENSER[0];
  if (arealM2 <= 1000) return STYKKGODS_GRENSER[1];
  return STYKKGODS_GRENSER[2];
}

// ---------------------------------------------------------------------------
// 13. VTEK § 11-8 – lagring i bygg – bygningstype → tillatte mengder
// ---------------------------------------------------------------------------

export type BygningsType =
  | "bolig"
  | "garasje"
  | "fyrrom"
  | "tankrom"
  | "verksted"
  | "lager"
  | "forretning"
  | "salgslokale";

export interface ByggBrenselGrense {
  brenselType: BrenselType;
  brenselNavn: string;
  maksLiter: number | null; // null = ikke tillatt
  maksKg?: number | null; // for gass (kg)
  romKrav: BrensellagringKravItem[];
}

export interface BygningsTypeInfo {
  id: BygningsType;
  navn: string;
  beskrivelse: string;
  grenser: ByggBrenselGrense[];
}

export const BYGNINGSTYPER: BygningsTypeInfo[] = [
  {
    id: "bolig",
    navn: "Bolig / leilighetsbygg",
    beskrivelse: "Boliger, leiligheter, rekkehus o.l. Begrenset mengde lov i fyrrom/teknisk rom.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG (grillgass m.m.)",
        maksLiter: null,
        maksKg: 55,
        romKrav: [
          { kategori: "Plassering", tekst: "Propanflasker skal ikke oppbevares i kjeller, på loft eller i rom under terreng. Maks 2 × 11 kg flasker (inkl. reserve) i/ved bolig.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Ventilasjon", tekst: "Oppbevaring skal være i godt ventilert rom eller utendørs.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Avstand", tekst: "Min. 1 m fra brennbare materialer og tennkilder.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 1650,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Ståltank.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: null,
        romKrav: [],
      },
    ],
  },
  {
    id: "garasje",
    navn: "Garasje",
    beskrivelse: "Garasjer under eller i tilknytning til bygning. Lagring i egen branncelle.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG (grillgass m.m.)",
        maksLiter: null,
        maksKg: 55,
        romKrav: [
          { kategori: "Plassering", tekst: "Propanflasker skal ikke oppbevares i kjeller, på loft eller i rom under terreng.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Ventilasjon", tekst: "Oppbevaring skal være i godt ventilert rom eller utendørs.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Avstand", tekst: "Min. 1 m fra brennbare materialer og tennkilder.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 1650,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Ståltank.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: null,
        romKrav: [],
      },
    ],
  },
  {
    id: "fyrrom",
    navn: "Fyrrom (egen branncelle)",
    beskrivelse: "Eget fyrrom med egen branncelle iht. VTEK § 11-8. Tillater noe høyere mengder med strengere konstruksjonskrav.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG",
        maksLiter: null,
        maksKg: 55,
        romKrav: [
          { kategori: "Plassering", tekst: "Ikke i kjeller eller rom under terreng. Godt ventilert rom eller utendørs.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Ventilasjon", tekst: "Rommet skal ha god naturlig eller mekanisk ventilasjon ned mot gulv.", ansvar: "RIV", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: 6000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Tank i brennbart materiale (f.eks. GUP/polyetylen-HD). Med dokumentert brannmotstand 30 min kan tankrom være EI 30.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
    ],
  },
  {
    id: "tankrom",
    navn: "Tankrom (eget rom for tanklagring)",
    beskrivelse: "Dedikert tankrom med strengere konstruksjonskrav. Tillater de høyeste mengdene innenfor bygning.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG",
        maksLiter: null,
        maksKg: 200,
        romKrav: [
          { kategori: "Plassering", tekst: "Ikke i kjeller eller rom under terreng. Tankrom skal ha ventilasjon ned mot gulv.", ansvar: "RIV", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 10000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 10000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: 6000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Tank i brennbart materiale (f.eks. GUP/polyetylen-HD). Med dokumentert brannmotstand 30 min kan tankrom være EI 30.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
    ],
  },
  {
    id: "verksted",
    navn: "Verksted / industri",
    beskrivelse: "Industribygg, verksteder. Lagring av brannfarlig væske i tilknytning til produksjonsareal.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG",
        maksLiter: null,
        maksKg: 200,
        romKrav: [
          { kategori: "Plassering", tekst: "Godt ventilert rom eller utendørs. Ikke i kjeller eller rom under terreng.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Ventilasjon", tekst: "Mekanisk eller naturlig ventilasjon ned mot gulv i oppbevaringsrom.", ansvar: "RIV", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 10000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: 6000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Tank i brennbart materiale tillatt med dokumentert brannmotstand.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
    ],
  },
  {
    id: "lager",
    navn: "Lagerbygg",
    beskrivelse: "Lagerbygg og oppbevaringsrom. Lagring av brensel i eget tankrom.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG",
        maksLiter: null,
        maksKg: 400,
        romKrav: [
          { kategori: "Plassering", tekst: "Godt ventilert rom eller utendørs. Ikke i kjeller eller rom under terreng.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 10000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 10000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: 6000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
    ],
  },
  {
    id: "forretning",
    navn: "Forretningsbygg / kontor",
    beskrivelse: "Kontorer, forretningsbygg. Lagring kun i eget fyrrom/tankrom med begrenset mengde.",
    grenser: [
      {
        brenselType: "propan",
        brenselNavn: "Propan / LPG",
        maksLiter: null,
        maksKg: 55,
        romKrav: [
          { kategori: "Plassering", tekst: "Ikke i kjeller eller rom under terreng. Oppbevaring utendørs eller i godt ventilert rom.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Fyringsparafin",
        maksLiter: 1650,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Ståltank.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "begge",
        brenselNavn: "Kombinasjon (parafin + fyringsolje)",
        maksLiter: null,
        romKrav: [],
      },
    ],
  },
  {
    id: "salgslokale",
    navn: "Salgslokale (butikk / publikumsbygg)",
    beskrivelse: "Forretninger med kundeområder og publikum tilstede. Største anbefalte mengder brannfarlig stoff i salgslokaler avhenger av salgslokalets areal iht. DSB Temaveiledning om oppbevaring av farlig stoff.",
    grenser: [
      {
        brenselType: "aerosoler" as any,
        brenselNavn: "Aerosoler",
        maksLiter: 200,
        romKrav: [
          { kategori: "Areal < 200 m²", tekst: "Maks 50 liter aerosoler i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Areal 200–1 000 m²", tekst: "Maks 100 liter aerosoler i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Areal > 1 000 m²", tekst: "Maks 200 liter aerosoler i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Plassering", tekst: "Skal stå i ventilert hylle/skap, ikke ved tennkilder, elektriske tavler eller rømningsveier.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
        ],
      },
      {
        brenselType: "propan",
        brenselNavn: "Brannfarlig gass (propan / LPG)",
        maksLiter: null,
        maksKg: 25.2,
        romKrav: [
          { kategori: "Alle arealer", tekst: "Maks 60 liter brannfarlig gass (tilsvarer 25,2 kg propan) i salgslokalet, uavhengig av lokalets areal.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Plassering", tekst: "Større mengder skal lagres i eget lager utenfor publikumsareal. Ikke i kjeller eller rom under terreng.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Ventilasjon", tekst: "Godt ventilert område, fortrinnsvis utendørs i låsbart skap.", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
          { kategori: "Avstand", tekst: "Min. 1 m fra brennbare materialer og tennkilder. Skilting: «Brannfarlig vare – røyking forbudt».", ansvar: "Eier", referanse: { label: "DSB Kap. 2", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/#kapittel-2-%C2%AD-tankanlegg---lpg-og-lng" } },
        ],
      },
      {
        brenselType: "bensin",
        brenselNavn: "Brannfarlig væske kategori 1 og 2 (bensin)",
        maksLiter: 250,
        romKrav: [
          { kategori: "Areal < 200 m²", tekst: "Maks 50 liter brannfarlig væske kat. 1 og 2 i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Areal 200–1 000 m²", tekst: "Maks 250 liter brannfarlig væske kat. 1 og 2 i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Areal > 1 000 m²", tekst: "Maks 250 liter brannfarlig væske kat. 1 og 2 i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Emballasje", tekst: "Skal oppbevares i originalemballasje, fortrinnsvis maks 5 liter pr. enhet.", ansvar: "Eier", referanse: { label: "DSB Kap. 3", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Plassering", tekst: "Skal stå i ventilert hylle/skap, ikke ved tennkilder, elektriske tavler eller rømningsveier.", ansvar: "Eier", referanse: { label: "DSB Kap. 3", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Skilting", tekst: "Tydelig merking «Brannfarlig vare» og forbud mot åpen ild og røyking.", ansvar: "Eier", referanse: { label: "DSB Kap. 3", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Større lager", tekst: "Mengder utover grensene skal lagres i eget lagerrom (egen branncelle EI 60) utenfor publikumsareal.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
      {
        brenselType: "fyringsparafin",
        brenselNavn: "Brannfarlig væske kategori 3 (fyringsparafin/diesel)",
        maksLiter: 1000,
        romKrav: [
          { kategori: "Areal < 200 m²", tekst: "Maks 250 liter brannfarlig væske kat. 3 i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Areal 200–1 000 m²", tekst: "Maks 500 liter brannfarlig væske kat. 3 i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Areal > 1 000 m²", tekst: "Maks 1 000 liter brannfarlig væske kat. 3 i salgslokalet.", ansvar: "Eier", referanse: { label: "DSB Temaveiledning", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Emballasje", tekst: "Skal oppbevares i originalemballasje.", ansvar: "Eier", referanse: { label: "DSB Kap. 3", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
          { kategori: "Plassering", tekst: "I ventilert område, ikke ved utganger eller rømningsveier.", ansvar: "Eier", referanse: { label: "DSB Kap. 3", url: "https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/" } },
        ],
      },
      {
        brenselType: "lett_fyringsolje",
        brenselNavn: "Lett fyringsolje (oppvarming av bygget)",
        maksLiter: 4000,
        romKrav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Eget fyrrom – branncellebegrensende bygningsdel utenfor publikumsareal.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S] mot publikumsareal. Selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      },
    ],
  },
];

// Legacy function kept for backward compat
export function getBrensellagringKrav(
  brenselType: BrenselType,
  mengdeLiter: number
): BrensellagringResult {
  if (mengdeLiter <= 0) {
    return { romType: "", krav: [], feilmelding: "Oppgi mengde i liter." };
  }

  if (brenselType === "fyringsparafin") {
    if (mengdeLiter <= 1650) {
      return {
        romType: "Fyrrom / garasje / annet rom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Ståltank.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      };
    } else if (mengdeLiter <= 4000) {
      return {
        romType: "Fyrrom / garasje / annet rom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      };
    } else if (mengdeLiter <= 10000) {
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
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
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      };
    } else if (mengdeLiter <= 10000) {
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
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
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
          { kategori: "Tank", tekst: "Tank i brennbart materiale (f.eks. GUP/polyetylen-HD). Med dokumentert brannmotstand 30 min kan tankrom være EI 30.", ansvar: "ARK", referanse: { label: "VTEK § 11-8", url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/11/11-8" } },
        ],
      };
    } else {
      return { romType: "", krav: [], feilmelding: "Mengden overskrider preaksepterte ytelser i VTEK (maks 6 000 liter for kombinasjon). Krever analyse." };
    }
  }

  return { romType: "", krav: [] };
}

// ---------------------------------------------------------------------------
// 14. Hjelpefunksjon: finn innmeldingsgrense for et stoff
// ---------------------------------------------------------------------------
export function getInnmeldingsStatus(stoffId: string, mengdeLiter: number): { trengerInnmelding: boolean; grenseTekst: string } {
  const stoff = STOFF_KATALOG.find((s) => s.id === stoffId);
  if (!stoff) return { trengerInnmelding: false, grenseTekst: "" };

  let grense: InnmeldingsGrense | undefined;
  if (stoff.kategori === "kat1" || stoff.kategori === "kat2") {
    grense = INNMELDINGS_GRENSER[0];
  } else if (stoff.kategori === "kat3") {
    grense = INNMELDINGS_GRENSER[1];
  } else {
    grense = INNMELDINGS_GRENSER[2];
  }

  return {
    trengerInnmelding: mengdeLiter >= grense.grenseLiter,
    grenseTekst: grense.grenseTekst,
  };
}
