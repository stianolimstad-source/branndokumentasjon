export interface TrafoCase {
  sted: string;
  aar: string;
  anlegg: string;
  hva: string;
  konsekvens: string;
}

export const TRAFO_CASES: TrafoCase[] = [
  {
    sted: "Sayano-Shushenskaya, Russland",
    aar: "2009",
    anlegg: "Vannkraft, 6 400 MW",
    hva: "Turbinhavari → trafo 1 og 2 ødelagt av eksplosjon og brann. ~40 tonn olje i elven.",
    konsekvens: "75 omkomne. Turbinhall rast sammen. Hele 6 400 MW falt ut.",
  },
  {
    sted: "Indian Point 3, New York",
    aar: "2015",
    anlegg: "Kjernekraft, hovedtrafo",
    hva: "Intern feil → eksplosjon og oljebrann. Reaktor SCRAM.",
    konsekvens: "Ingen personskader. Trafo totalskadet. Brann hindret manuell tilgang i timer.",
  },
  {
    sted: "Con Edison, Astoria (NYC)",
    aar: "2018",
    anlegg: "138 kV transformatorstasjon",
    hva: "Svikt i 138 kV CVT → lysbuefeil, brennende aluminium ga blå-fiolett himmel.",
    konsekvens: "Massivt strømutfall, flyplass evakuert.",
  },
  {
    sted: "Mosjøen trafostasjon, Norge",
    aar: "2017",
    anlegg: "Statnett 132/300 kV",
    hva: "Samleskinnefeil utløste alvorlig trafobrann.",
    konsekvens: "Stort produksjonsbortfall i regionen. Referansecase i norsk fagopplæring.",
  },
  {
    sted: "Røykås, Lørenskog",
    aar: "2001",
    anlegg: "Statnett målespennings-trafoer",
    hva: "Eksplosjonsserie i 6 målespenningstransformatorer + brann.",
    konsekvens: "~20 000 abonnenter uten strøm i 6,5 timer.",
  },
  {
    sted: "Sotra/Øygarden",
    aar: "2014",
    anlegg: "Distribusjonsstasjon",
    hva: "Eksplosjon i trafostasjon.",
    konsekvens: "17 000 abonnenter uten strøm.",
  },
  {
    sted: "Hasle, Sarpsborg",
    aar: "2015",
    anlegg: "Statnett 420 kV",
    hva: "Storbrann i trafo etter feil.",
    konsekvens: "Stor beredskapshendelse.",
  },
  {
    sted: "Viklandet, Sunndalsøra",
    aar: "2020",
    anlegg: "Statnett — mater aluminiumsverk",
    hva: "Brann i trafo, slukket samme kveld.",
    konsekvens: "Rask kontroll med effektiv slokkestrategi.",
  },
  {
    sted: "Mount Ida Hydro, Troy, NY",
    aar: "2024",
    anlegg: "Vannkraft, småskala",
    hva: "Eksplosjon under arbeid på trafo.",
    konsekvens: "3 personer med brannskader. Vedlikehold er høyrisikofase.",
  },
  {
    sted: "Taum Sauk, Missouri",
    aar: "2005",
    anlegg: "Pumpekraft, 408 MW",
    hva: "Trafobrann + målesystemsvikt → overfylling og dambrudd.",
    konsekvens: "Skader nedstrøms, 5 personskader.",
  },
];
