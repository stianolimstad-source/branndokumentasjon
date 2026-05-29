// Bæreevne og stabilitet iht. TEK17 § 11-4.

/** Unntak-tekster for visning i preview/eksport. */
export const baereevneUnntakTekster: Record<string, string> = {
  unntak1: "Brannmotstand til bærende bygningsdeler i byggverk må være i samsvar med tabell 1 med unntak som angitt i nr. 2 til 7.",
  unntak2: "Branncellebegrensende konstruksjoner må understøttes av bærende konstruksjoner med tilsvarende eller høyere brannmotstand.",
  unntak3: "Byggverk i én etasje i risikoklasse 2, 3, og 5 kan ha hoved- og sekundærbæresystem med brannmotstand R 15.",
  unntak4: "Byggverk i brannklasse 1 og risikoklasse 4 kan ha hoved- og sekundærbæresystem med brannmotstand R 15.",
  unntak5: "Byggverk i én etasje i risikoklasse 2 kan oppføres uten spesifisert brannmotstand når bærekonstruksjonen tilfredsstiller klasse A2-s1,d0 [ubrennbart materiale].",
  unntak6: "I byggverk uten loft eller med loft som bare kan benyttes som lager, kan takkonstruksjon oppføres uten spesifisert brannmotstand, forutsatt at denne ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen.",
  unntak7: "Under forutsetning av at nødvendig tid til rømning og sikkerhet for slokkemannskaper er ivaretatt, kan parkeringshus med mer enn 1/3 av veggflatene åpne, oppføres med brannmotstand R 15 A2-s1,d0 [ubrennbart materiale].",
};

/** Tabell for bærende konstruksjoners brannmotstand iht. § 11-4 Tabell 1. */
export const baereevneKravTabell: Record<1 | 2 | 3, { hovedsystem: string; sekundaer: string; trappeloep: string; kjeller: string; utvendig: string }> = {
  1: {
    hovedsystem: "R 30 [B 30]",
    sekundaer: "R 30 [B 30]",
    trappeloep: "-",
    kjeller: "R 60 A2-s1,d0 [A 60]",
    utvendig: "-",
  },
  2: {
    hovedsystem: "R 60 [B 60]",
    sekundaer: "R 60 [B 60]",
    trappeloep: "R 30 [B 30]",
    kjeller: "R 90 A2-s1,d0 [A 90]",
    utvendig: "R 30 [B 30] eller A2-s1,d0 [ubrennbart]",
  },
  3: {
    hovedsystem: "R 90 A2-s1,d0 [A 90]",
    sekundaer: "R 60 A2-s1,d0 [A 60]",
    trappeloep: "R 30 A2-s1,d0 [A 30]",
    kjeller: "R 120 A2-s1,d0 [A 120]",
    utvendig: "A2-s1,d0 [ubrennbart]",
  },
};

/**
 * Genererer bæreevne- og stabilitet-tekst basert på brannklasse,
 * med unntak fra § 11-4 og valgfrie toggles for trappeløp/kjeller/utvendig.
 */
export const getBaereevneTekst = (
  brannklasse: string,
  risikoklasse: string,
  etasjer: string,
  toggles?: { trappeloep: boolean; kjeller: boolean; utvendig: boolean },
): { tekst: string; anvendteUnntak: string[] } => {
  const bkl = parseInt(brannklasse.replace(/\D/g, ''), 10);
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);

  if (isNaN(bkl) || bkl < 1 || bkl > 3) {
    return { tekst: "", anvendteUnntak: [] };
  }

  const anvendteUnntak: string[] = [];
  const k = { ...baereevneKravTabell[bkl as 1 | 2 | 3] };

  // Unntak 3: Byggverk i én etasje i RK2, 3 og 5 kan ha R 15.
  if (floors === 1 && [2, 3, 5].includes(rk)) {
    k.hovedsystem = "R 15";
    k.sekundaer = "R 15";
    anvendteUnntak.push("unntak3");

    // Unntak 5: For RK2 kan det også oppføres uten spesifisert brannmotstand (R 0) med A2-s1,d0.
    if (rk === 2) {
      k.hovedsystem = "R 15 (alternativt uten spesifisert brannmotstand ved bruk av A2-s1,d0 materialer)";
      k.sekundaer = "R 15 (alternativt uten spesifisert brannmotstand ved bruk av A2-s1,d0 materialer)";
      anvendteUnntak.push("unntak5");
    }
  }

  // Unntak 4: Byggverk i BKL1 og RK4 kan ha R 15.
  if (bkl === 1 && rk === 4) {
    k.hovedsystem = "R 15";
    k.sekundaer = "R 15";
    anvendteUnntak.push("unntak4");
  }

  const lines = [
    `Bærende hovedsystem: ${k.hovedsystem}`,
    `Sekundære, bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende: ${k.sekundaer}`,
  ];
  if (toggles?.trappeloep) lines.push(`Trappeløp: ${k.trappeloep}`);
  if (toggles?.kjeller) lines.push(`Bærende bygningsdeler under øverste kjeller: ${k.kjeller}`);
  if (toggles?.utvendig) lines.push(`Utvendig trappeløp, beskyttet mot flammepåvirkning og strålevarme: ${k.utvendig}`);

  return { tekst: lines.join('\n'), anvendteUnntak };
};
