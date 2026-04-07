export type GarasjeKravItem = { kategori: string; tekst: string; ansvar: string };

function getBranncelleMotstand(brannklasse: string): string {
  const krav: Record<string, string> = {
    "BKL1": "EI 30 [B 30]",
    "BKL2": "EI 60 [B 60]",
    "BKL3": "EI 60 A2-s1,d0 [A 60]",
  };
  return krav[brannklasse] || "[Angis]";
}

export function getGarasjeKrav(
  plassering: string,
  areal: string,
  bruksenhet: string,
  brannklasse: string = "",
  erBolig: boolean = false
): GarasjeKravItem[] {
  const krav: GarasjeKravItem[] = [];
  const motstand = getBranncelleMotstand(brannklasse);

  if (plassering === "utenfor_tiltaket") {
    if (areal === "under_50" && bruksenhet === "samme") {
      const tekst = erBolig
        ? "Garasje med bruttoareal til og med 50 m² kan bygges uten brannskille mot annet byggverk i samme bruksenhet, for eksempel inntil en enebolig."
        : "Garasje med bruttoareal til og med 50 m² kan bygges uten brannskille mot annet byggverk i samme bruksenhet.";
      krav.push({ kategori: "Brannskille", tekst, ansvar: "ARK" });
    } else if (areal === "under_50" && bruksenhet === "annen") {
      krav.push({ kategori: "Brannskille", tekst: `Garasje med bruttoareal til og med 50 m² må ha avstand minimum 2,0 meter til byggverk i annen bruksenhet, eller byggverkene må være skilt med bygningsdeler med brannmotstand minst ${motstand} (samme krav som brannceller generelt), jf. § 11-6 annet ledd.`, ansvar: "ARK" });
    } else if (areal === "50_400") {
      krav.push({ kategori: "Brannskille", tekst: `Garasje med bruttoareal over 50 m² til og med 400 m² må ha avstand minimum 8 meter til andre byggverk eller byggverkene må være skilt med bygningsdeler med brannmotstand minst ${motstand}.`, ansvar: "ARK" });
    } else if (areal === "over_400") {
      krav.push({ kategori: "Brannskille", tekst: "Garasjer med større bruttoareal enn 400 m² må ha avstand minimum 8 meter til andre byggverk eller byggverkene må være skilt med bygningsdeler med brannmotstand minst EI 90 A2-s1,d0 [A 90].", ansvar: "ARK" });
    }
  } else if (plassering === "i_tiltaket") {
    // Brannskille
    if (areal === "under_50" && bruksenhet === "samme") {
      const tekst = erBolig
        ? "Garasje med bruttoareal til og med 50 m² i samme bruksenhet, for eksempel garasje i enebolig, må være skilt fra resten av byggverket med bygningsdeler som er så tette at eksos ikke trenger gjennom. En yttervegg med utvendig vindsperre og innvendig dampsperre gir tilstrekkelig tetthet mot en godt ventilert garasje."
        : "Garasje med bruttoareal til og med 50 m² i samme bruksenhet må være skilt fra resten av byggverket med bygningsdeler som er så tette at eksos ikke trenger gjennom.";
      krav.push({ kategori: "Brannskille", tekst, ansvar: "ARK" });
    } else if (areal === "under_50" && bruksenhet === "annen") {
      krav.push({ kategori: "Brannskille", tekst: `Andre garasjer med bruttoareal til og med 50 m² må være skilt fra resten av byggverket med bygningsdeler med brannmotstand minst ${motstand} (samme krav som brannceller generelt).`, ansvar: "ARK" });
    } else if (areal === "50_400") {
      krav.push({ kategori: "Brannskille", tekst: `Garasje med bruttoareal over 50 m² til og med 400 m², må være skilt fra resten av byggverket med bygningsdeler med brannmotstand minst ${motstand}.`, ansvar: "ARK" });
    } else if (areal === "over_400") {
      krav.push({ kategori: "Brannskille", tekst: "Garasjer med større bruttoareal enn 400 m² må være skilt fra resten av byggverket med bygningsdeler med brannmotstand minst EI 90 A2-s1,d0 [A 90].", ansvar: "ARK" });
    }

    // Mellomrom – for garasje over 400 m² dekkes dette av brannsluse-kravene
    if (areal !== "over_400") {
      const mellomromGenerell = erBolig
        ? "For å hindre spredning av eksos og røyk må det være et mellomliggende rom mellom garasje og rømningsvei, og mellom garasje og oppholdsrom (boligrom, husdyrrom og lignende)."
        : "For å hindre spredning av eksos og røyk må det være et mellomliggende rom mellom garasje og rømningsvei, og mellom garasje og oppholdsrom.";
      krav.push({ kategori: "Mellomrom", tekst: mellomromGenerell, ansvar: "ARK" });

      if (areal === "under_50") {
        if (erBolig) {
          krav.push({ kategori: "Mellomrom", tekst: "I bolig med garasje med bruttoareal mindre enn 50 m² kan mellomliggende rom være vaskerom, bod og lignende.", ansvar: "ARK" });
        }
      } else if (areal === "50_400") {
        krav.push({ kategori: "Mellomrom", tekst: `For garasje med bruttoareal over 50 m² til og med 400 m² må mellomliggende rom utføres som egen branncelle med brannmotstand minst ${motstand}.`, ansvar: "ARK" });
      }
    }

    krav.push({ kategori: "Ventilasjon", tekst: "Mellomliggende rom eller garasje må være ventilert slik at brann- og røykgasser fra garasjen ikke kommer inn i andre rom i byggverket.", ansvar: "ARK / RIV" });

    // Brannsluse - kun for >400 m²
    if (areal === "over_400") {
      krav.push({ kategori: "Brannsluse", tekst: "Mellomliggende rom utføres som brannsluse.", ansvar: "ARK / RIBr" });
      krav.push({ kategori: "Brannsluse", tekst: "Brannslusen skal være skilt fra resten av byggverket med bygningsdeler med brannmotstand minst EI 60 A2-s1,d0 [A 60].", ansvar: "ARK / RIBr" });
      krav.push({ kategori: "Brannsluse", tekst: "Dører til brannslusen må ha brannmotstand EI₂ 60-CSₐ [B 60 S].", ansvar: "ARK / RIBr" });
      krav.push({ kategori: "Brannsluse", tekst: "Brannslusen skal ha tilstrekkelig størrelse og være slik utført at den kan passeres uten at mer enn en dør eller luke må åpnes av gangen.", ansvar: "ARK / RIBr" });
      krav.push({ kategori: "Brannsluse", tekst: "Ventilasjon av brannsluser skal ikke foregå gjennom åpninger til de rommene som betjenes av slusen.", ansvar: "ARK / RIBr" });
    }
  }

  return krav;
}
