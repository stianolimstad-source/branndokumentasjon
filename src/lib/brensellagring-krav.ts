// =============================================================================
// Lagring av brannfarlig stoff – basert på DSB Temaveiledning om oppbevaring
// av farlig stoff + VTEK § 11-8
// =============================================================================

export type BrensellagringKravItem = { kategori: string; tekst: string; ansvar: string };

export type BrenselType = "fyringsparafin" | "lett_fyringsolje" | "begge";

export interface BrensellagringResult {
  romType: string;
  krav: BrensellagringKravItem[];
  feilmelding?: string;
}

// ---------------------------------------------------------------------------
// 1. Stoffkategorier iht. DSB / GHS
// ---------------------------------------------------------------------------
export type VaeskeKategori = "kat1" | "kat2" | "kat3" | "diesel_fyringsolje";

export interface StoffInfo {
  id: string;
  navn: string;
  kategori: VaeskeKategori;
  kategoriNavn: string;
  flammepunkt: string;
  densitet: string;
  nedreBrennverdi: string;
  eksempler: string;
}

export const STOFF_KATALOG: StoffInfo[] = [
  {
    id: "bensin",
    navn: "Bensin",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "< −40 °C",
    densitet: "735–765 kg/m³",
    nedreBrennverdi: "43,8 MJ/kg",
    eksempler: "Motorbensin, flybensin",
  },
  {
    id: "etanol",
    navn: "Etanol",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "12 °C",
    densitet: "790 kg/m³",
    nedreBrennverdi: "26,7 MJ/kg",
    eksempler: "Sprit, E85-drivstoff",
  },
  {
    id: "metanol",
    navn: "Metanol",
    kategori: "kat1",
    kategoriNavn: "Brannfarlig væske, kategori 1",
    flammepunkt: "11 °C",
    densitet: "792 kg/m³",
    nedreBrennverdi: "19,9 MJ/kg",
    eksempler: "Industriløsemiddel",
  },
  {
    id: "fyringsparafin",
    navn: "Fyringsparafin",
    kategori: "kat3",
    kategoriNavn: "Brannfarlig væske, kategori 3",
    flammepunkt: "≥ 35 °C",
    densitet: "780–815 kg/m³",
    nedreBrennverdi: "43,2 MJ/kg",
    eksempler: "Parafin, JetA1",
  },
  {
    id: "diesel",
    navn: "Diesel",
    kategori: "diesel_fyringsolje",
    kategoriNavn: "Diesel og fyringsoljer",
    flammepunkt: "≥ 56 °C",
    densitet: "820–845 kg/m³",
    nedreBrennverdi: "42,8 MJ/kg",
    eksempler: "Autodiesel, gassolje",
  },
  {
    id: "lett_fyringsolje",
    navn: "Lett fyringsolje",
    kategori: "diesel_fyringsolje",
    kategoriNavn: "Diesel og fyringsoljer",
    flammepunkt: "≥ 56 °C",
    densitet: "820–870 kg/m³",
    nedreBrennverdi: "42,7 MJ/kg",
    eksempler: "Fyringsolje nr. 1",
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
}

export const OPPSAMLING_KRAV: OppsamlingKrav[] = [
  {
    tittel: "Oppsamlingsbasseng – enkelt tank",
    beskrivelse: "Kapasitet lik tankens totale rominnhold + ca. 15 cm overhøyde for skumslokking.",
  },
  {
    tittel: "Felles oppsamlingsbasseng – flere tanker",
    beskrivelse: "Kapasitet ≥ volumet av største tank + 10 % av summen av øvrige tankers volum + ca. 15 cm overhøyde.",
  },
  {
    tittel: "Drenering",
    beskrivelse: "Bunnen i bassenget skal ha minst 1 % fall bort fra tanken. Dreneringsventiler skal normalt være stengt.",
  },
  {
    tittel: "Overfyllingsvarsel",
    beskrivelse: "Tank med fast tilkobling skal ha overfyllingsvarsel. Alarm ved nivå over høyeste tillatte driftsnivå.",
  },
  {
    tittel: "Overfyllingsvern",
    beskrivelse: "Krav ved stor fyllehastighet eller store konsekvenser. Automatisk stopp av tilførsel ved definert nivå.",
  },
  {
    tittel: "Brannfarlig væske kat. 1 og 2",
    beskrivelse: "Tanker skal ha overfyllingsvern (automatisk stopp).",
  },
  {
    tittel: "Brannfarlig væske kat. 3 / diesel / fyringsolje",
    beskrivelse: "Tanker skal ha overfyllingsvarsel eller overfyllingsvern.",
  },
];

// ---------------------------------------------------------------------------
// 6. Eksisterende VTEK § 11-8 – lagring i bygg
// ---------------------------------------------------------------------------
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
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK" },
          { kategori: "Tank", tekst: "Ståltank.", ansvar: "ARK" },
        ],
      };
    } else if (mengdeLiter <= 4000) {
      return {
        romType: "Fyrrom / garasje / annet rom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK" },
        ],
      };
    } else if (mengdeLiter <= 10000) {
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK" },
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
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S]. Klasse C [S] – selvlukkende.", ansvar: "ARK" },
        ],
      };
    } else if (mengdeLiter <= 10000) {
      return {
        romType: "Tankrom",
        krav: [
          { kategori: "Vegger/etasjeskiller", tekst: "Branncellebegrensende bygningsdel.", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 30-CSₐ [B 30 S].", ansvar: "ARK" },
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
          { kategori: "Vegger/etasjeskiller", tekst: "EI 60 A2-s1,d0 [A 60].", ansvar: "ARK" },
          { kategori: "Overflate", tekst: "B-s1,d0 [In 1].", ansvar: "ARK" },
          { kategori: "Dør", tekst: "EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK" },
          { kategori: "Tank", tekst: "Tank i brennbart materiale (f.eks. GUP/polyetylen-HD). Med dokumentert brannmotstand 30 min kan tankrom være EI 30.", ansvar: "ARK" },
        ],
      };
    } else {
      return { romType: "", krav: [], feilmelding: "Mengden overskrider preaksepterte ytelser i VTEK (maks 6 000 liter for kombinasjon). Krever analyse." };
    }
  }

  return { romType: "", krav: [] };
}

// ---------------------------------------------------------------------------
// 7. Hjelpefunksjon: finn innmeldingsgrense for et stoff
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
