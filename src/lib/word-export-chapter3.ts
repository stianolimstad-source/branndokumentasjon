import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from "docx";
import { branncelleTyperListe, getBrannklasse } from "./fire-concept-constants";

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
};

// Shading matching preview: bg-blue-100 = #DBEAFE, bg-blue-50 = #EFF6FF, bg-gray-100 = #F3F4F6
const sectionShading = { type: ShadingType.SOLID, color: "DBEAFE", fill: "DBEAFE" };
const subSectionShading = { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" };
const headerShading = { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" };

function cell(text: string, bold = false, width?: number, shading?: typeof sectionShading): TableCell {
  return new TableCell({
    borders: tableBorders,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading,
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })],
  });
}

function multiLineCell(lines: string[], width?: number, shading?: typeof sectionShading): TableCell {
  return new TableCell({
    borders: tableBorders,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading,
    children: lines.map(line => new Paragraph({ children: [new TextRun({ text: line, size: 20 })] })),
  });
}

function sectionHeaderRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: tableBorders,
        shading: sectionShading,
        children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: title, bold: true, size: 20 })] })],
      }),
    ],
  });
}

function columnHeaderRow(): TableRow {
  return new TableRow({
    children: [
      cell("Forhold", true, 25, headerShading),
      cell("Løsning", true, undefined, headerShading),
      cell("Ansvar", true, 10, headerShading),
    ],
  });
}

function subSectionHeaderRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: tableBorders,
        shading: subSectionShading,
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 20 })] })],
      }),
    ],
  });
}

function contentRow(forhold: string, losning: string, ansvar: string): TableRow {
  return new TableRow({
    children: [cell(forhold, false, 25), cell(losning), cell(ansvar, false, 10)],
  });
}

function contentRowMultiLine(forhold: string, losningLines: string[], ansvar: string): TableRow {
  return new TableRow({
    children: [cell(forhold, false, 25), multiLineCell(losningLines), cell(ansvar, false, 10)],
  });
}

// Grenser for brannseksjonering (VTEK § 11-7, tabell 1)
const seksjoneringsGrenser: Record<string, { normalt: number; brannalarm: number; sprinkler: number; roykventilasjon: number }> = {
  "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
  "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
  "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 },
};

const isSeksjoneringRequired = (areal: string, brannenergi: string, tiltak: string): boolean => {
  const arealNum = parseFloat(areal) || 0;
  if (!brannenergi || arealNum <= 0) return false;
  const g = seksjoneringsGrenser[brannenergi];
  if (!g) return false;
  const maksAreal = g[tiltak as keyof typeof g] ?? g.normalt;
  if (maksAreal === 0) return true;
  return arealNum > maksAreal && maksAreal !== Infinity;
};

export function buildChapter3Table(formData: Record<string, any>): Table {
  const rows: TableRow[] = [];
  const bygningsdeler = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
  const branncelleTyper = Array.isArray(formData.branncelleTyper) ? formData.branncelleTyper : [];

  // ===== 3.1 Bæreevne og stabilitet =====
  rows.push(sectionHeaderRow("3.1   §11-4 Bæreevne og stabilitet"));
  rows.push(columnHeaderRow());

  if (formData.harFlereRisikoklasser && bygningsdeler.length > 0) {
    // Generelt row
    rows.push(contentRow(
      "Generelt",
      "Balkonger og utkragede bygningsdeler o.l. må ha forsvarlig innfesting for å hindre nedfall som kan skade rednings- og slokkemannskapene og deres materiell under førsteinnsatsen.",
      "RIB"
    ));
    rows.push(subSectionHeaderRow("Krav per bygningsdel:"));
    
    bygningsdeler.forEach((del: any, index: number) => {
      const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
      const bklNum = delBrannklasse?.replace("BKL", "") || "1";
      const krav: Record<string, { hovedsystem: string; sekundaer: string; trappeløp: string; utvendig: string; kjeller: string }> = {
        "1": { hovedsystem: "R 30 [B 30]", sekundaer: "R 30 [B 30]", trappeløp: "-", utvendig: "-", kjeller: "R 60 A2-s1,d0 [A 60]" },
        "2": { hovedsystem: "R 60 [B 60]", sekundaer: "R 60 [B 60]", trappeløp: "R 30 [B 30]", utvendig: "R 30 / A2-s1,d0", kjeller: "R 90 A2-s1,d0 [A 90]" },
        "3": { hovedsystem: "R 90 A2-s1,d0 [A 90]", sekundaer: "R 60 A2-s1,d0 [A 60]", trappeløp: "R 30 A2-s1,d0 [A 30]", utvendig: "A2-s1,d0", kjeller: "R 120 A2-s1,d0 [A 120]" },
      };
      const delKrav = krav[bklNum] || krav["1"];
      const delNavn = del.navn || `Del ${index + 1}`;

      rows.push(subSectionHeaderRow(`${delNavn} (${delBrannklasse})`));
      rows.push(contentRow("Bærende hovedsystem", delKrav.hovedsystem, "RIB"));
      rows.push(contentRow("Sekundære, bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende", delKrav.sekundaer, "RIB"));
      rows.push(contentRow("Trappeløp", delKrav.trappeløp, "RIB"));
      rows.push(contentRow("Utvendig trapp", delKrav.utvendig, "RIB"));
      rows.push(contentRow("Plan under øverste kjeller", delKrav.kjeller, "RIB"));
    });
  } else {
    const lines = (formData.baereevne || "").split("\n").filter((l: string) => l.trim());
    if (lines.length >= 2) {
      lines.forEach((line: string) => {
        const parts = line.split(":");
        const label = parts[0]?.trim() || "Krav";
        const value = parts.slice(1).join(":").trim() || "-";
        rows.push(contentRow(label, value, "RIB"));
      });
    } else {
      rows.push(contentRow("Generelt", formData.baereevne || "[Angis]", "RIB"));
    }
  }
  if (formData.baereevneKommentar) {
    rows.push(contentRow("Kommentar", formData.baereevneKommentar, "-"));
  }

  // ===== 3.2 Sikkerhet ved eksplosjon =====
  rows.push(sectionHeaderRow("3.2   §11-5 Sikkerhet ved eksplosjon"));
  rows.push(columnHeaderRow());
  
  if (formData.eksplosjonRelevant === "ikke_relevant") {
    rows.push(contentRow("Eksplosjonsfare", "RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket.", "RIBr"));
  } else if (formData.eksplosjonRelevant === "relevant") {
    const lines: string[] = [];
    if (formData.eksplosjonBeskrivelse) {
      lines.push(formData.eksplosjonBeskrivelse, "");
    }
    lines.push(
      "Preaksepterte ytelser (jf. VTEK § 11-5):",
      "1. Rom hvor det kan forekomme fare for eksplosjon, må utgjøre en egen branncelle.",
      "2. Rom hvor det kan forekomme fare for eksplosjon, må ha minst én trykkavlastningsflate for å sikre mot skader på personer og byggverket forøvrig.",
      "3. Avlastet trykk må ledes bort i sikker retning.",
      "4. Trykkavlastningsflater må ikke plasseres i takflater og lignende med mindre det dokumenteres at snølast ikke er til hinder for avlastningsflatens funksjon.",
      "5. Bærende og branncellebegrensende bygningsdeler må om nødvendig forsterkes for å opprettholde rømningsveiers funksjon og forhindre spredning av brann til andre brannceller.",
      "",
      "Farlige stoffer skal håndteres og lagres i henhold til relevante standarder, herunder forskrift om håndtering av farlig stoff og forskrift om elektriske forsyningsanlegg.",
    );
    rows.push(contentRowMultiLine("Eksplosjonsfare", lines, "RIBr"));
  } else {
    rows.push(contentRow("Eksplosjonsfare", "[Vurdering av eksplosjonsfare]", "RIBr"));
  }
  if (formData.eksplosjonKommentar) {
    rows.push(contentRow("Kommentar", formData.eksplosjonKommentar, "-"));
  }

  // ===== 3.3 Brannspredning mellom byggverk =====
  rows.push(sectionHeaderRow("3.3   §11-6 Brannspredning mellom byggverk"));
  rows.push(columnHeaderRow());
  rows.push(contentRow("Avstand til nabobygg", formData.avstandNabobygg ? `${formData.avstandNabobygg} meter` : "[Ikke angitt]", "-"));
  rows.push(contentRow("Bygningshøyde", formData.bygningshoyde ? `${formData.bygningshoyde} meter` : "[Ikke angitt]", "-"));

  const hoyde = parseFloat(formData.bygningshoyde) || 0;
  const avstand = parseFloat(formData.avstandNabobygg || "0");

  if (hoyde > 9 && avstand < 8) {
    let brannveggTekst = "Brannvegg (bygning over 9 meter, avstand til nabobygg under 8 meter)";
    if (formData.spesifikkBrannenergi) {
      const energiMap: Record<string, string> = {
        "inntil400": "Inntil 400 MJ/m² → REI 120-M A2-s1,d0 [A 120]",
        "400-600": "400-600 MJ/m² → REI 180-M A2-s1,d0 [A 180]",
        "600-800": "600-800 MJ/m² → REI 240-M A2-s1,d0 [A 240]",
      };
      brannveggTekst += "\n\nBrannmotstand basert på spesifikk brannenergi:\n" + (energiMap[formData.spesifikkBrannenergi] || "");
    }
    rows.push(contentRow("Krav til brannvegg", brannveggTekst, "RIB"));
    rows.push(contentRowMultiLine("Preaksepterte ytelser", [
      "1. Takkonstruksjonen må ikke være kontinuerlig over brannveggen.",
      "2. Konstruksjoner inntil brannveggen må kunne bevege seg fritt ved temperaturendringer.",
      "3. Brannveggens avslutning mot tak og fasade må hindre brannspredning.",
      "4. Brannveggen må ha brannmotstand minst som angitt i tabell 1.",
      "5. Brannveggen må bestå av materialer i klasse A2-s1,d0 [ubrennbare].",
      "6. Uten dokumentert mekanisk motstandsevne (M): tunge materialer som mur/betong.",
      "7. Brannveggen må føres min. 0,5 m over høyeste tilstøtende tak.",
      "8. Brannveggen må bli stående selv om byggverket på én side raser sammen.",
    ], "RIB"));
  } else if (hoyde > 9 && avstand >= 8) {
    rows.push(contentRow("Krav til skillevegg", "Avstand til nabobygg er 8 meter eller mer. Krav til brannvegg gjelder ikke. Branncellebegrensende bygningsdel benyttes i stedet.", "RIB"));
  } else if (hoyde > 0 && hoyde <= 9) {
    rows.push(contentRow("Krav til skillevegg", "Branncellevegg (bygning under eller lik 9 meter). Avstanden mellom lave byggverk kan være mindre enn 8,0 meter når byggverkene er skilt med branncellebegrensende bygningsdel.", "RIB"));
    if (formData.risikoklasse === "RK1") {
      rows.push(contentRow("Unntak RK1", "Byggverk i risikoklasse 1 med bruttoareal ≤ 50 m² og liten/middel brannenergi kan plasseres nærmere uten særlige tiltak.", "RIBr"));
    }
  } else {
    rows.push(contentRow("Generelt", "[Krav til brannspredning vurderes etter bygningshøyde]", "RIBr"));
  }
  if (formData.brannspredningKommentar) {
    rows.push(contentRow("Kommentar", formData.brannspredningKommentar, "-"));
  }

  // ===== 3.4 Brannseksjoner =====
  rows.push(sectionHeaderRow("3.4   §11-7 Brannseksjoner"));
  rows.push(columnHeaderRow());

  const arealNum = parseFloat(formData.areal) || 0;
  const brannenergi = formData.brannseksjonBrannenergi;
  const tiltak = formData.brannseksjonTiltak || "normalt";
  const g = brannenergi ? seksjoneringsGrenser[brannenergi] : null;
  const maksAreal = g ? (g[tiltak as keyof typeof g] ?? g.normalt) : null;
  const erPakrevd = isSeksjoneringRequired(formData.areal, brannenergi, tiltak);

  if (g && maksAreal !== null && !erPakrevd) {
    rows.push(contentRow("Seksjonering", `Bruttoarealet (${arealNum} m²) er innenfor tillatt areal uten brannseksjonering (${maksAreal === Infinity ? "ubegrenset" : maksAreal + " m²"}). Det er derfor ikke krav til brannseksjonering for dette byggverket.`, "RIBr"));
  } else {
    rows.push(contentRow("Generelt", "Byggverk skal deles opp i brannseksjoner for å sikre liv og helse der rømning og redning kan ta lang tid, hindre urimelig store økonomiske eller materielle tap, og bidra til at en brann, med påregnelig slokkeinnsats, begrenses til den brannseksjonen der den startet.", "RIBr"));

    if (erPakrevd) {
      const brannmotstandTabell: Record<string, Record<string, string>> = {
        "BKL1": { "under400": "REI 90-M A2-s1,d0 [A 90]", "400-600": "REI 120-M A2-s1,d0 [A 120]", "600-800": "REI 180-M A2-s1,d0 [A 180]" },
        "BKL2": { "under400": "REI 120-M A2-s1,d0 [A 120]", "400-600": "REI 180-M A2-s1,d0 [A 180]", "600-800": "REI 240-M A2-s1,d0 [A 240]" },
        "BKL3": { "under400": "REI 120-M A2-s1,d0 [A 120]", "400-600": "REI 180-M A2-s1,d0 [A 180]", "600-800": "REI 240-M A2-s1,d0 [A 240]" },
      };
      const bkl = formData.brannklasse || "BKL1";
      const be = formData.seksjoneringsvegBrannenergi || "under400";
      const brannmotstand = brannmotstandTabell[bkl]?.[be] || "[Brannklasse og/eller brannenergi ikke angitt]";

      const ytelser = [
        `Brannseksjonering er påkrevd da bruttoarealet (${formData.areal} m²) overskrider tillatt areal uten seksjonering.`,
        "",
        "Seksjoneringsveggen skal oppfylle følgende preaksepterte ytelser:",
        "• Takkonstruksjonen må ikke være kontinuerlig over seksjoneringsveggen på en slik måte at en kollaps på den ene siden medfører reduksjon av konstruksjonens bæreevne og brannmotstand på den andre siden.",
        "• Konstruksjoner som ligger inntil seksjoneringsveggen må kunne bevege seg fritt ved temperaturendringer, uten at veggens branntekniske egenskaper reduseres.",
        "• Seksjoneringsveggens avslutning mot tak og fasade må være utformet og utført for å hindre brannspredning mellom ulike seksjoner.",
        "• Der seksjoner ligger inntil hverandre i et innvendig hjørne, må det treffes særskilte tiltak for å hindre brannspredning, jf. figur 1a og 1b.",
        `• Seksjoneringsveggen må ha brannmotstand minst ${brannmotstand} (jf. VTEK § 11-7, tabell 2).`,
        "• Seksjoneringsveggen må i sin helhet bestå av materialer som tilfredsstiller klasse A2-s1,d0 [ubrennbare] og må kunne motstå mekanisk påkjenning.",
        "• Dersom mekanisk motstandsevne (M) ikke er dokumentert ved prøvning, må seksjoneringsveggen utføres i tunge materialer som mur, betong eller lignende.",
        "• Seksjoneringsveggen må føres minimum 0,5 meter over høyeste tilstøtende tak, med mindre taket har brannmotstand minst EI 60 A2-s1,d0 [A 60].",
        "• Seksjoneringsveggen må være slik utført at den blir stående selv om byggverket på den ene eller andre siden raser sammen.",
      ];

      if (formData.innvendigHjorne === "ja") {
        ytelser.push(
          formData.innvendigHjorneAlternativ === "alt1"
            ? "• For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 8,0 meter forbi innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 1)."
            : "• For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 5,0 meter på hver side av innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 2)."
        );
      }

      rows.push(contentRowMultiLine("Seksjoneringsveggen", ytelser, "RIBr / ARK"));
    }
  }
  if (formData.brannseksjonerKommentar) {
    rows.push(contentRow("Kommentar", formData.brannseksjonerKommentar, "-"));
  }

  // ===== 3.5 Brannceller =====
  rows.push(sectionHeaderRow("3.5   §11-8 Brannceller"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Byggverk skal deles opp i brannceller på en hensiktsmessig måte. Områder med ulik risiko for liv og helse eller ulik fare for at brann oppstår, skal være egne brannceller med mindre andre tiltak gir likeverdig sikkerhet.\n\nBrannceller skal være utført slik at de forhindrer spredning av brann og branngasser til andre brannceller i den tiden som er nødvendig for rømning og redning.",
    "RIBr"
  ));

  if (formData.brannklasse) {
    const branncelleKrav: Record<string, string> = {
      "BKL1": "EI 30 [B 30]",
      "BKL2": "EI 60 [B 60]",
      "BKL3": "EI 60 A2-s1,d0 [A 60]",
    };
    const kravVerdi = branncelleKrav[formData.brannklasse] || "[Angis]";
    rows.push(contentRow("Branncellebegrensende bygningsdel - generelt", kravVerdi, "ARK/RIBr"));
    rows.push(contentRow("Bygningsdel som omslutter trapperom, heissjakt og installasjonssjakter over flere plan", kravVerdi, "ARK/RIBr"));
  }

  if (branncelleTyper.length > 0) {
    const typeLabels = branncelleTyper
      .map((typeId: string) => {
        const type = branncelleTyperListe.find(t => t.id === typeId);
        return type ? type.label : null;
      })
      .filter(Boolean) as string[];
    rows.push(contentRowMultiLine("Følgende rom/lokaler skal være egne brannceller", typeLabels, "ARK/RIBr"));
  }

  if (formData.branncellerKommentar) {
    rows.push(contentRow("Kommentar", formData.branncellerKommentar, "-"));
  }

  // ===== 3.6 Materialer og produkters egenskaper ved brann =====
  rows.push(sectionHeaderRow("3.6   §11-9 Materialer og produkters egenskaper ved brann"));
  rows.push(columnHeaderRow());
  
  // Sub-section: Overflater i brannceller som ikke er rømningsvei
  rows.push(subSectionHeaderRow("Overflater i brannceller som ikke er rømningsvei"));
  rows.push(contentRow("Overflater på vegger og i himling/tak i branncelle inntil 200 m²", "D-s2,d0 [In 2]", "ARK"));
  rows.push(contentRow(
    "Overflater på vegger og i himling/tak i branncelle over 200 m²",
    formData.brannklasse === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]",
    "ARK"
  ));
  rows.push(contentRow("Overflater i sjakter og hulrom", "B-s1,d0 [In 1]", "ARK"));

  // Sub-section: Overflater i brannceller som er rømningsvei
  rows.push(subSectionHeaderRow("Overflater i brannceller som er rømningsvei"));
  rows.push(contentRow("Overflater på vegger og i himling/tak", "B-s1,d0 [In 1]", "ARK"));
  rows.push(contentRow("Overflater på gulv", "Dfl-s1 [G]", "ARK"));

  // Sub-section: Utvendige overflater
  rows.push(subSectionHeaderRow("Utvendige overflater"));
  rows.push(contentRow("Overflater på ytterkledning", formData.brannklasse === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]", "ARK"));
  rows.push(contentRow("Overflater i hulrom i ytterveggkonstruksjoner", "Som utvendig overflate", "ARK"));

  // Sub-section: Kledninger
  rows.push(subSectionHeaderRow("Kledninger"));
  rows.push(contentRow("Kledning i branncelle inntil 200 m²", "K₂10 D-s2,d0 [K2]", "ARK"));
  rows.push(contentRow(
    "Kledning i branncelle over 200 m²",
    formData.brannklasse === "BKL1" ? "K₂10 D-s2,d0 [K2]" : "K₂10 B-s1,d0 [K1]",
    "ARK"
  ));
  rows.push(contentRow(
    "Kledning i branncelle som er rømningsvei",
    formData.brannklasse === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]",
    "ARK"
  ));

  // Sub-section: Taktekning
  rows.push(subSectionHeaderRow("Taktekning"));
  rows.push(contentRowMultiLine("Taktekning", [
    "Taktekning kan bidra til brannspredning i et byggverk og mellom ulike byggverk.",
    "",
    "Preaksepterte ytelser:",
    "1. Taktekning må tilfredsstille klasse BROOF(t2) [Ta].",
    "2. Teglstein, betongtakstein, skifertak og metallplater kan uten ytterligere dokumentasjon antas å tilfredsstille klasse BROOF(t2) [Ta].",
    "3. For småhus kan taktekning være uklassifisert der avstanden mellom de enkelte byggverk er minst 8 m.",
    "4. Ett-sjikts tak av duk og folie må tilfredsstille klasse B-s3,d0 (Ut1).",
  ], "ARK"));

  // Sub-section: Isolasjon
  rows.push(subSectionHeaderRow("Isolasjon"));
  const isolasjonLines = [
    "Isolasjonsmaterialer kan bidra til brannspredning og røykutvikling i et byggverk.",
    "",
    "Preaksepterte ytelser:",
    "1. Isolasjon må tilfredsstille klasse A2-s1,d0 med mindre annet er angitt i nr. 2 til 9.",
  ];
  if (formData.isolasjonSandwich !== "ikke_relevant" && formData.isolasjonBrennbar !== "ikke_relevant") {
    // Default: don't add specific sandwich/brennbar rules unless explicitly relevant
  }
  if (formData.isolasjonSandwich === "ikke_relevant" && formData.isolasjonBrennbar === "ikke_relevant") {
    isolasjonLines.push("", "Det er ikke planlagt bruk av sandwichelementer eller brennbar isolasjon i tiltaket. Kun hovedkravet om A2-s1,d0 gjelder.");
  }
  rows.push(contentRowMultiLine("Isolasjon", isolasjonLines, "ARK"));

  if (formData.materialerKommentar) {
    rows.push(contentRow("Kommentar", formData.materialerKommentar, "-"));
  }

  // ===== 3.7 Tekniske installasjoner =====
  rows.push(sectionHeaderRow("3.7   §11-10 Tekniske installasjoner"));
  rows.push(columnHeaderRow());

  if (formData.ventilasjonRelevant) {
    rows.push(subSectionHeaderRow("A. Ventilasjonsanlegg"));
    const ventLines = [
      "Preaksepterte ytelser:",
      "1. Ventilasjonskanal som føres gjennom en brannskillende bygningsdel, må utføres slik at bygningsdelens brannmotstand blir opprettholdt.",
      "2. Innfesting og oppheng for kanaler og ventilasjonsutstyr må utføres slik at forutsatt funksjonstid og brannmotstand blir opprettholdt.",
      "3. Avtrekk fra komfyr må føres i egen kanal.",
      "4. Ventilasjonsanlegg må utføres i materialer som tilfredsstiller klasse A2-s1,d0.",
    ];
    if (formData.ventKrav9) {
      ventLines.push("5. Kanal som føres gjennom seksjoneringsvægg, må ha lukkeanordning (brannspjeld) med minimum samme brannmotstand som seksjoneringsvegg.");
    }
    rows.push(contentRowMultiLine("Ventilasjonsanlegg", ventLines, "RIV"));
  }

  if (formData.vannAvlopRelevant) {
    rows.push(subSectionHeaderRow("B. Vann- og avløpsrør"));
    rows.push(contentRowMultiLine("Rørgjennomføringer", [
      "Preaksepterte ytelser:",
      "1. Rørgjennomføringer i brannskillende konstruksjoner må ha dokumentert brannmotstand.",
      "2. Plastrør med ytre diameter til og med 32 mm kan føres gjennom murte eller støpte konstruksjoner.",
      "3. Støpejernrør med ytre diameter til og med 110 mm kan føres gjennom murte eller støpte konstruksjoner.",
    ], "RIV"));
  }

  if (formData.elektriskRelevant) {
    rows.push(subSectionHeaderRow("D. Elektriske installasjoner"));
    rows.push(contentRowMultiLine("Elektriske installasjoner", [
      "Preaksepterte ytelser:",
      "1. Kabler må ikke legges over nedforet himling eller i hulrom i rømningsvei med mindre brannenergien er mindre enn ca. 50 MJ/løpemeter.",
      "2. Kabler som utgjør liten brannenergi kan føres ubeskyttet gjennom rømningsvei.",
    ], "RIE"));
  }

  if (!formData.ventilasjonRelevant && !formData.vannAvlopRelevant && !formData.elektriskRelevant) {
    rows.push(contentRow("Generelt", formData.installasjoner || "[Installasjoner beskrives]", "RIV"));
  }

  if (formData.installasjonerKommentar) {
    rows.push(contentRow("Kommentar", formData.installasjonerKommentar, "-"));
  }

  // ===== 3.8 Generelle krav om rømning og redning =====
  rows.push(sectionHeaderRow("3.8   §11-11 Generelle krav om rømning og redning"));
  rows.push(columnHeaderRow());
  rows.push(contentRowMultiLine("Rømning og redning", [
    "Krav fra TEK17 §11-11:",
    "• Byggverk skal prosjekteres og utføres for rask og sikker rømning og redning.",
    "• Den tiden som er tilgjengelig for rømning, skal være større enn den tiden som er nødvendig for rømning.",
    "• Brannceller skal utformes slik at varsling, rømning og redning kan skje på en rask og effektiv måte.",
    "• Fluktvei fra oppholdssted til utgang fra en branncelle skal være oversiktlig.",
    "• I den tiden en branncelle eller rømningsvei skal benyttes til rømning, skal det ikke forekomme temperaturer, røykgasskonsentrasjoner eller andre forhold som hindrer rømning.",
    "• Skilt, symbol og tekst som viser rømningsveier og sikkerhetsutstyr skal kunne leses under rømning.",
  ], "ARK/RIBr"));
  if (formData.romningSikkerhetKommentar) {
    rows.push(contentRow("Kommentar", formData.romningSikkerhetKommentar, "-"));
  }

  // ===== 3.9 Tilrettelegging for rømning og redning =====
  rows.push(sectionHeaderRow("3.9   §11-12 Tilrettelegging for rømning og redning"));
  rows.push(columnHeaderRow());
  if (formData.tilretteleggingLedd2a) {
    rows.push(contentRow(
      "Brannalarmanlegg",
      "Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.\n\nBrannalarmanlegg må prosjekteres og utføres i samsvar med NS 3960:2019 og NS-EN 54-serien.",
      "RIE"
    ));
  }
  if (formData.tilretteleggingLedd3) {
    rows.push(contentRow(
      "Ledesystem",
      "Store byggverk, byggverk beregnet for et stort antall personer og byggverk i risikoklasse 5 og 6 skal ha ledesystem.",
      "RIE"
    ));
  }
  if (formData.tilretteleggingKommentar) {
    rows.push(contentRow("Kommentar", formData.tilretteleggingKommentar, "-"));
  }

  // ===== 3.10 Utgang fra branncelle =====
  rows.push(sectionHeaderRow("3.10   §11-13 Utgang fra branncelle"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Fra en branncelle skal det minst være én utgang til sikkert sted, eller utganger til to uavhengige rømningsveier.",
    "-"
  ));
  if (formData.utgangBranncelle) {
    rows.push(contentRow("Utganger", formData.utgangBranncelle, "ARK"));
  }
  if (formData.utgangBranncelleKommentar) {
    rows.push(contentRow("Kommentar", formData.utgangBranncelleKommentar, "-"));
  }

  // ===== 3.11 Rømningsvei =====
  rows.push(sectionHeaderRow("3.11   §11-14 Rømningsvei"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Rømningsvei skal på en oversiktlig og lettfattelig måte føre til et sikkert sted. Den skal ha tilstrekkelig bredde og høyde og være utført som egen branncelle tilrettelagt for rask og effektiv rømning.",
    "-"
  ));
  if (formData.romningsvei) {
    rows.push(contentRow("Beskrivelse", formData.romningsvei, "ARK"));
  }
  if (formData.romningsveiKommentar) {
    rows.push(contentRow("Kommentar", formData.romningsveiKommentar, "-"));
  }

  // ===== 3.13 Manuell slokking =====
  rows.push(sectionHeaderRow("3.13   §11-16 Tilrettelegging for manuell slokking"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Byggverk skal være tilrettelagt for effektiv manuell slokking av brann.",
    "RIV"
  ));
  if (formData.manuellSlokking) {
    rows.push(contentRow("Beskrivelse", formData.manuellSlokking, "RIBr"));
  }
  if (formData.manuellSlokkingKommentar) {
    rows.push(contentRow("Kommentar", formData.manuellSlokkingKommentar, "-"));
  }

  // ===== 3.14 Tilrettelegging for slokkemannskap =====
  rows.push(sectionHeaderRow("3.14   §11-17 Tilrettelegging for slokkemannskap"));
  rows.push(columnHeaderRow());
  rows.push(contentRowMultiLine("Generelt", [
    "• Byggverk skal plasseres og utformes slik at rednings- og slokkemannskap har brukbar tilgjengelighet.",
    "• Byggverk skal tilrettelegges slik at en brann lett kan lokaliseres og bekjempes.",
    "• Branntekniske installasjoner som har betydning for rednings- og slokkeinnsatsen skal være tydelig merket.",
  ], "RIBr"));
  if (formData.redningsmannskap) {
    rows.push(contentRow("Beskrivelse", formData.redningsmannskap, "RIBr"));
  }
  if (formData.redningsmannskapKommentar) {
    rows.push(contentRow("Kommentar", formData.redningsmannskapKommentar, "-"));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}
