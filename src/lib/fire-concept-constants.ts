// Branncelle-typer basert på VTEK § 11-8 preaksepterte ytelser
export const branncelleTyperListe = [
  { id: "romningsvei", label: "a. Rømningsvei, jf. også § 11-14" },
  { id: "trapperom", label: "b. Trapperom. Gjelder selv om trapperommet ikke er del av rømningsvei." },
  { id: "sykerom", label: "c. Hvert enkelt sykerom i sykehus og pleieinstitusjoner." },
  { id: "gjesterom", label: "d. Hvert enkelt gjesterom i overnattingsbygg." },
  { id: "forsamlingslokale", label: "e. Hvert enkelt forsamlingslokale." },
  { id: "salgslokale", label: "f. Hvert enkelt salgslokale. Når flere salgslokaler ligger med inngang fra et felles overdekket og innelukket torg, gårdsplass, korridor eller lignende, regnes de som ett salgslokale." },
  { id: "boenhet", label: "g. Boenhet. Hybelleilighet og lignende som innehar alle nødvendige funksjoner regnes som egen boenhet." },
  { id: "barnehage", label: "h. Barnehage som utgjør en avdeling." },
  { id: "undervisningsrom", label: "i. Hvert enkelt undervisningsrom med tilhørende birom." },
  { id: "kontorlandskap", label: "j. Kontorer eller kontorlandskap som utgjør en selvstendig bruksenhet." },
  { id: "storkjokken", label: "k. Storkjøkken." },
  { id: "garasje", label: "l. Garasje. Unntatt garasje med bruttoareal til og med 50 m² i enebolig (samme bruksenhet)." },
  { id: "garasje_forbinder", label: "m. Rom som forbinder garasje med andre rom. Unntak gjelder for garasje med bruttoareal til og med 50 m² i enebolig (samme bruksenhet)." },
  { id: "store_hulrom", label: "n. Store hulrom. Store hulrom må deles opp med branncellebegrensende konstruksjoner i areal på høyst 400 m². Dette gjelder for eksempel kalde, ubenyttede loftsrom og hulrom under oppforede tak og gulv. Branncelleoppdelingen må korrespondere med branncelleoppdelingen av bygget for øvrig." },
  { id: "hulrom_himling", label: "o. Hulrom over nedforet himling i rømningsvei hvor det er kabler som utgjør en brannenergi på mer enn 50 MJ per løpemeter hulrom eller korridor." },
  { id: "tekniske_rom", label: "p. Tekniske rom som betjener flere andre brannceller. Dette omfatter blant annet rom for ventilasjonsaggregat, avfallsrom, fyrrom for sentralvarmeanlegg og varmluftsovner fyrt med gass, flytende eller fast brensel. Unntak kan gjøres for ventilasjonsaggregat som er sikret på annen måte mot brannspredning. Sikring på annen måte kan utføres for eksempel ved at aggregatrommet er plassert over et yttertak som har brannmotstand minst som branncellebegrensende bygningsdel." },
  { id: "tavlerom", label: "q. Tavlerom som ligger i tilknytning til rømningsvei." },
  { id: "kulvert", label: "r. Kulvert som underjordisk transportgang, kabelkulvert og lignende." },
  { id: "heissjakt", label: "s. Heissjakter og tekniske installasjonssjakter. Unntak gjelder for heissjakt som ligger i trapperom. Heiser uten sjakt, for eksempel panoramaheiser med frittstående heismaskin, vil være del av den branncellen heisen er montert i. Heis med kabel og maskinromløs heis inngår i samme branncelle som heisjakten. Øvrige heismaskinrom må være egne brannceller." },
  { id: "husdyrrom", label: "t. Husdyrrom." },
];

export const getBrannklasse = (risikoklasse: string, etasjer: string, harTerrengTilgang: string, areal: string): { brannklasse: string; brannklasseUnntak: string | null } => {
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);
  const arealNum = parseFloat(areal) || 0;
  
  if (isNaN(rk) || isNaN(floors) || rk < 1 || rk > 6 || floors < 1) {
    return { brannklasse: "", brannklasseUnntak: null };
  }

  if (rk === 4 && floors === 3 && harTerrengTilgang === "ja") {
    return { 
      brannklasse: "BKL1", 
      brannklasseUnntak: "Boligbygning i risikoklasse 4 med tre etasjer, kan oppføres i brannklasse 1 når hver boenhet har utgang direkte til terreng, uten å måtte rømme via trapp eller trapperom til terreng (jf. VTEK § 11-3, preakseptert ytelse nr. 3)."
    };
  }

  if (rk === 5 && floors === 2 && arealNum > 0 && arealNum < 800) {
    return { 
      brannklasse: "BKL1", 
      brannklasseUnntak: "Forsamlingslokale og salgslokale i risikoklasse 5 med bruksareal under 800 m² i maksimalt 2 etasjer kan oppføres i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 4)."
    };
  }

  if (rk === 6 && floors === 2) {
    return { 
      brannklasse: "BKL1", 
      brannklasseUnntak: "Boligbygning i risikoklasse 6 i to etasjer kan oppføres i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 7)."
    };
  }

  const brannklasseTabell: Record<number, Record<string, string>> = {
    1: { "1": "-", "2": "BKL1", "3-4": "BKL2", "5+": "BKL2" },
    2: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
    3: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
    4: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
    5: { "1": "BKL1", "2": "BKL2", "3-4": "BKL3", "5+": "BKL3" },
    6: { "1": "BKL1", "2": "BKL2", "3-4": "BKL2", "5+": "BKL3" },
  };

  let etasjeKey: string;
  if (floors === 1) etasjeKey = "1";
  else if (floors === 2) etasjeKey = "2";
  else if (floors >= 3 && floors <= 4) etasjeKey = "3-4";
  else etasjeKey = "5+";

  return { brannklasse: brannklasseTabell[rk]?.[etasjeKey] || "", brannklasseUnntak: null };
};

// ============= §11-13 og §11-14 hjelpefunksjoner =============

/** Returnerer unike aktive risikoklasser fra formData (hovedklasse + bygningsdeler). */
export const getAktiveRiskKlasser = (formData: any): string[] => {
  const set = new Set<string>();
  if (formData?.risikoklasse) set.add(formData.risikoklasse);
  if (formData?.harFlereRisikoklasser && Array.isArray(formData?.bygningsdeler)) {
    formData.bygningsdeler.forEach((d: any) => {
      if (d?.risikoklasse) set.add(d.risikoklasse);
    });
  }
  return Array.from(set);
};

/** Maksimal fluktvei (m) iht. § 11-13 Tabell 1 per RK. RK4 har ikke eget krav her. */
export const getFluktveiKrav = (rk: string): number | null => {
  switch (rk) {
    case "RK1":
    case "RK2":
      return 50;
    case "RK3":
    case "RK5":
      return 30;
    case "RK6":
      return 25;
    default:
      return null;
  }
};

/** Strengeste fluktvei-krav (laveste tall) fra aktive RK-er. */
export const getStrengesteFluktvei = (rks: string[]): number | null => {
  const kravs = rks.map(getFluktveiKrav).filter((v): v is number => v !== null);
  return kravs.length > 0 ? Math.min(...kravs) : null;
};

/** Fri bredde-krav (m) iht. § 11-14 punkt 4 per RK + bygningstype. */
export const getFriBreddeKrav = (rk: string, bygningstype?: string): { bredde: number; merknad?: string } => {
  const erBolig = (bygningstype || "").toLowerCase().includes("bolig");
  if (rk === "RK6") {
    if (erBolig) {
      return { bredde: 0.86, merknad: "Boligunntak iht. § 11-2 Tabell 1." };
    }
    return { bredde: 1.16 };
  }
  if (rk === "RK3" || rk === "RK5") return { bredde: 1.16 };
  // RK1, RK2, RK4 (og ukjent)
  return { bredde: 0.86 };
};

/** Strengeste fri bredde-krav (høyeste tall) fra aktive RK-er. */
export const getStrengesteFriBredde = (rks: string[], bygningstype?: string): { bredde: number; merknad?: string } => {
  if (rks.length === 0) return { bredde: 0.86 };
  let max = { bredde: 0, merknad: undefined as string | undefined };
  for (const rk of rks) {
    const k = getFriBreddeKrav(rk, bygningstype);
    if (k.bredde > max.bredde) max = k;
  }
  return max.bredde > 0 ? max : { bredde: 0.86 };
};

/** Persontall basert på areal og kategori (m² per person). */
export const beregnPersontall = (areal: string | number, kategoriFaktor: number): number => {
  const a = typeof areal === "string" ? parseFloat(areal) : areal;
  if (!a || !kategoriFaktor) return 0;
  return Math.floor(a / kategoriFaktor);
};

