/**
 * Strukturerte data over relevante paragrafer i Forskrift om beredskap i
 * kraftforsyningen (BFK). Brukes i ROS-analyse for å dokumentere at
 * forskriftens krav er vurdert.
 */

export type BfkVurderingStatus = "vurdert" | "ikke_aktuell" | "ikke_vurdert";

export type BfkKategori =
  | "ros"
  | "personell"
  | "drift"
  | "sikring"
  | "informasjon";

export interface BfkParagraf {
  /** Kort id som «1-3», «3-5» */
  id: string;
  /** Visningsnavn, f.eks. «§ 1-3 Risiko- og sårbarhetsanalyse» */
  navn: string;
  /** Kort utdrag som forklarer hva paragrafen krever */
  utdrag: string;
  kategori: BfkKategori;
}

/** Vurdering av én paragraf, lagres på `RosContent`. */
export interface BfkVurdering {
  paragrafId: string;
  status: BfkVurderingStatus;
  begrunnelse: string;
  /** Id-er fra `RosContent.hendelser` som dekker paragrafen */
  hendelseIds: string[];
}

export const BFK_KATEGORI_LABEL: Record<BfkKategori, string> = {
  ros: "ROS-krav",
  personell: "Personell og kompetanse",
  drift: "Drift og gjenoppretting",
  sikring: "Fysisk sikring",
  informasjon: "Informasjon og samband",
};

export const BFK_STATUS_LABEL: Record<BfkVurderingStatus, string> = {
  vurdert: "Vurdert",
  ikke_aktuell: "Ikke aktuell",
  ikke_vurdert: "Ikke vurdert",
};

export const BFK_KATEGORI_REKKEFOLGE: BfkKategori[] = [
  "ros",
  "personell",
  "drift",
  "sikring",
  "informasjon",
];

export const BFK_PARAGRAFER: BfkParagraf[] = [
  {
    id: "1-3",
    navn: "§ 1-3 Risiko- og sårbarhetsanalyse",
    utdrag:
      "Alle enheter i KBO skal ha oppdaterte risiko- og sårbarhetsanalyser for å identifisere virksomhetens risikopotensiale.",
    kategori: "ros",
  },
  {
    id: "3-1",
    navn: "§ 3-1 Personell",
    utdrag:
      "Alle enheter i KBO skal kunne dekke personellbehovet som kreves for å holde driften gående i ekstraordinære situasjoner.",
    kategori: "personell",
  },
  {
    id: "3-2",
    navn: "§ 3-2 Kompetanse",
    utdrag:
      "Alle enheter i KBO skal ha personell med den kompetanse som kreves i ulike funksjoner.",
    kategori: "personell",
  },
  {
    id: "3-4",
    navn: "§ 3-4 Drift",
    utdrag:
      "Alle enheter i KBO skal i ekstraordinære situasjoner effektivt kunne drive de kraftforsyningsanlegg enheten har ansvaret for.",
    kategori: "drift",
  },
  {
    id: "3-5",
    navn: "§ 3-5 Gjenoppretting av funksjon",
    utdrag:
      "Alle enheter i KBO skal på kort varsel kunne fremskaffe nødvendig antall egnede og kompetente personer til å gjenopprette nødvendige funksjoner.",
    kategori: "drift",
  },
  {
    id: "3-6",
    navn: "§ 3-6 Transport",
    utdrag:
      "Tilstrekkelig transportberedskap til å håndtere ekstraordinære situasjoner.",
    kategori: "drift",
  },
  {
    id: "3-7",
    navn: "§ 3-7 Informasjon",
    utdrag:
      "Informasjonsplan og effektiv informasjonsberedskap i ekstraordinære situasjoner.",
    kategori: "informasjon",
  },
  {
    id: "3-8",
    navn: "§ 3-8 Samband",
    utdrag:
      "Intern og ekstern sambandsberedskap for daglig drift og ekstraordinære situasjoner.",
    kategori: "informasjon",
  },
  {
    id: "4-5",
    navn: "§ 4-5 Adgangskontroll",
    utdrag:
      "Alle kraftforsyningsanlegg skal være sikret mot adgang for uvedkommende.",
    kategori: "sikring",
  },
  {
    id: "5-1",
    navn: "§ 5-1 Sikringsplikt",
    utdrag:
      "Alle anlegg som omfattes av energilovforskriften § 6-3 skal være sikret mot uønskede hendelser og handlinger.",
    kategori: "sikring",
  },
  {
    id: "5-2",
    navn: "§ 5-2 Meldeplikt",
    utdrag:
      "Meldeplikt til NVE for bygging, utvidelser og ombygging av sikringspliktige anlegg.",
    kategori: "sikring",
  },
  {
    id: "5-4",
    navn: "§ 5-4 Analyse iht. klasse",
    utdrag:
      "Eier skal på bakgrunn av NVEs vedtak om klasse foreta egen ROS-analyse og planlegge anleggene som angitt i forskriften.",
    kategori: "sikring",
  },
  {
    id: "5-5",
    navn: "§ 5-5 Sikringsnivå iht. klasse",
    utdrag:
      "Kraftforsyningsanlegg skal etter sin klasse oppfylle forskriftens krav til sikring.",
    kategori: "sikring",
  },
  {
    id: "5-6",
    navn: "§ 5-6 Vakthold",
    utdrag:
      "Bidra til planlegging og gjennomføring av vakthold i samarbeid med politi og forsvar.",
    kategori: "sikring",
  },
  {
    id: "5-7",
    navn: "§ 5-7 Kontroll og vedlikehold",
    utdrag:
      "Føre kontroll med at pålagte og gjennomførte sikringstiltak er tilstede, fungerer og vedlikeholdes.",
    kategori: "sikring",
  },
  {
    id: "6-1",
    navn: "§ 6-1 Informasjonssikkerhet",
    utdrag:
      "Løpende helhetlig vurdering av informasjonssikkerheten.",
    kategori: "informasjon",
  },
  {
    id: "6-2",
    navn: "§ 6-2 Beskyttelse av informasjon",
    utdrag:
      "Sensitiv informasjon om kraftforsyningen skal ikke offentliggjøres.",
    kategori: "informasjon",
  },
  {
    id: "6-3",
    navn: "§ 6-3 Sikkerhetskopier",
    utdrag:
      "Oppdaterte sikkerhetskopier av informasjon og programvare med fjernlagring.",
    kategori: "informasjon",
  },
  {
    id: "6-4",
    navn: "§ 6-4 Driftskontrollsystemer",
    utdrag:
      "Særlige krav til driftskontrollsystemer, tilgangskontroll, redundans, EMP/EMI-beskyttelse, brannsikkerhet og beredskapsrom.",
    kategori: "informasjon",
  },
  {
    id: "6-5",
    navn: "§ 6-5 Mobile radionett – driftsradio",
    utdrag:
      "Tilgang til mobilt sambandssystem for drift, sikkerhet og gjenoppretting.",
    kategori: "informasjon",
  },
  {
    id: "6-6",
    navn: "§ 6-6 Relésamband – vern av kraftsystem",
    utdrag:
      "Pålitelige og sikre samband for kommunikasjonsbaserte vernsystemer i sentral- og regionalnett.",
    kategori: "informasjon",
  },
];

/**
 * Returnerer en initial liste med én BfkVurdering per paragraf med
 * status "ikke_vurdert" og tom begrunnelse.
 */
export function lagDefaultBfkVurderinger(): BfkVurdering[] {
  return BFK_PARAGRAFER.map((p) => ({
    paragrafId: p.id,
    status: "ikke_vurdert" as BfkVurderingStatus,
    begrunnelse: "",
    hendelseIds: [],
  }));
}

/**
 * Sikrer at lista inneholder én vurdering per paragraf (legger til manglende
 * med default-verdier, beholder eksisterende). Bevarer rekkefølge fra
 * BFK_PARAGRAFER.
 */
export function normaliserBfkVurderinger(
  eksisterende: BfkVurdering[] | undefined,
): BfkVurdering[] {
  const map = new Map<string, BfkVurdering>(
    (eksisterende || []).map((v) => [v.paragrafId, v]),
  );
  return BFK_PARAGRAFER.map((p) => {
    const v = map.get(p.id);
    if (v) {
      return {
        paragrafId: p.id,
        status: (v.status as BfkVurderingStatus) || "ikke_vurdert",
        begrunnelse: typeof v.begrunnelse === "string" ? v.begrunnelse : "",
        hendelseIds: Array.isArray(v.hendelseIds)
          ? v.hendelseIds.filter((x) => typeof x === "string")
          : [],
      };
    }
    return {
      paragrafId: p.id,
      status: "ikke_vurdert" as BfkVurderingStatus,
      begrunnelse: "",
      hendelseIds: [],
    };
  });
}
