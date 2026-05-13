import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun } from "docx";
import { branncelleTyperListe, getBrannklasse } from "./fire-concept-constants";
import { getGarasjeKrav } from "./garasje-krav";
import { getBrensellagringKrav, BrenselType } from "./brensellagring-krav";
import { getYtterveggBrannmotstandBF85 } from "./bf85-constants";

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
};

// Shading matching preview: bg-blue-100 = #DBEAFE, bg-blue-50 = #EFF6FF, bg-gray-100 = #F3F4F6
// These are mutated by setChapter3Theme() before each export so that section/sub-section
// rows reflect the current company template's accent color.
let sectionShading = { type: ShadingType.SOLID, color: "DBEAFE", fill: "DBEAFE" };
let subSectionShading = { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" };
const headerShading = { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" };

// Convert hex like "F97316" to a lighter pastel hex string (no #) by mixing toward white.
function tintHex(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "DBEAFE";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return (mix(r) + mix(g) + mix(b)).toUpperCase();
}

/**
 * Apply the company template's accent color to chapter-3 section/sub-section row shading.
 * Pass the accent hex (with or without leading #). If null/undefined, falls back to default blue.
 */
export function setChapter3Theme(accentHex: string | null | undefined) {
  if (!accentHex) {
    sectionShading = { type: ShadingType.SOLID, color: "DBEAFE", fill: "DBEAFE" };
    subSectionShading = { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" };
    return;
  }
  const section = tintHex(accentHex, 0.78);
  const sub = tintHex(accentHex, 0.9);
  sectionShading = { type: ShadingType.SOLID, color: section, fill: section };
  subSectionShading = { type: ShadingType.SOLID, color: sub, fill: sub };
}

function cell(text: string, bold = false, width?: number, shading?: typeof sectionShading): TableCell {
  return new TableCell({
    borders: tableBorders,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text, bold, size: 20 })] })],
  });
}

function multiLineCell(lines: string[], width?: number, shading?: typeof sectionShading): TableCell {
  return new TableCell({
    borders: tableBorders,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: lines.map((line, i) => new Paragraph({
      spacing: { before: i === 0 ? 40 : 20, after: i === lines.length - 1 ? 40 : 20 },
      children: [new TextRun({ text: line, size: 20 })],
    })),
  });
}

function sectionHeaderRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: tableBorders,
        shading: sectionShading,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: title, bold: true, size: 20 })] })],
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
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: title, bold: true, size: 20 })] })],
      }),
    ],
  });
}

function graySubSectionHeaderRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: tableBorders,
        shading: headerShading,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: title, bold: true, size: 20 })] })],
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

const tilstandGradLabels: Record<string, string> = {
  tg0: "TG 0 – Ingen avvik",
  tg1: "TG 1 – Mindre avvik",
  tg2: "TG 2 – Vesentlige avvik",
  tg3: "TG 3 – Store avvik",
  tgiu: "TG IU – Ikke undersøkt",
};

async function fetchImageAsBuffer(url: string): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    // Load image into an HTMLImageElement – the browser automatically
    // applies EXIF orientation when drawing to canvas, which fixes
    // rotated photos taken on mobile devices.
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
    );
    if (!blob) return null;
    const buffer = await blob.arrayBuffer();
    return { buffer, width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  }
}

interface TilstandAvvikExport {
  id?: string;
  grad?: string;
  beskrivelse: string;
  bilder: { url: string; beskrivelse: string }[];
}

interface TilstandKategoriExport {
  beskrivelse: string;
  bilder: { url: string; beskrivelse: string }[];
  avvik: TilstandAvvikExport[];
}

const normBilder = (b: any[]) => (b || []).map((x: any) => (typeof x === "string" ? { url: x, beskrivelse: "" } : x));

const buildKategoriExport = (k: any): TilstandKategoriExport => {
  if (!k) return { beskrivelse: "", bilder: [], avvik: [] };
  const avvik: TilstandAvvikExport[] = Array.isArray(k.avvik)
    ? k.avvik.map((a: any) => ({
        id: a.id,
        grad: a.grad,
        beskrivelse: a.beskrivelse || "",
        bilder: normBilder(a.bilder),
      }))
    : [];
  // Fallback: legacy beskrivelse/bilder på kategori-nivå
  if (avvik.length === 0 && (k.beskrivelse || (k.bilder && k.bilder.length > 0))) {
    avvik.push({ beskrivelse: k.beskrivelse || "", bilder: normBilder(k.bilder) });
  }
  return { beskrivelse: k.beskrivelse || "", bilder: normBilder(k.bilder), avvik };
};

export function getTilstandKategorier(tilstandData: any): { tiltak: TilstandKategoriExport; fravik: TilstandKategoriExport } {
  if (!tilstandData) return { tiltak: { beskrivelse: "", bilder: [], avvik: [] }, fravik: { beskrivelse: "", bilder: [], avvik: [] } };
  const harNye = !!(tilstandData.tiltak || tilstandData.fravik);
  const harLegacy = !!(tilstandData.beskrivelse || (tilstandData.bilder && tilstandData.bilder.length > 0));
  if (!harNye && harLegacy) {
    return {
      tiltak: {
        beskrivelse: "",
        bilder: [],
        avvik: [{ grad: tilstandData.grad, beskrivelse: tilstandData.beskrivelse || "", bilder: normBilder(tilstandData.bilder) }],
      },
      fravik: { beskrivelse: "", bilder: [], avvik: [] },
    };
  }
  return {
    tiltak: buildKategoriExport(tilstandData.tiltak),
    fravik: buildKategoriExport(tilstandData.fravik),
  };
}

async function tilstandRow(formData: Record<string, any>, sectionKey: string, sectionLabel: string): Promise<TableRow[]> {
  const tilstandData = formData.tilstandsvurderinger?.[sectionKey];
  if (!tilstandData) return [];
  const { tiltak, fravik } = getTilstandKategorier(tilstandData);
  const harTiltak = tiltak.avvik.length > 0;
  const harFravik = fravik.avvik.length > 0;
  const harKommentar = !!(tilstandData.kommentar && String(tilstandData.kommentar).trim());
  if (!tilstandData.grad && !harTiltak && !harFravik && !harKommentar) return [];

  const ingenAvvik = !harTiltak && !harFravik;
  const tilstandShading = { type: ShadingType.SOLID, color: "FEF3C7", fill: "FEF3C7" };
  const headerShading = { type: ShadingType.SOLID, color: "FCD34D", fill: "FCD34D" };

  const children: Paragraph[] = [];

  // Header-bånd
  children.push(new Paragraph({
    spacing: { before: 0, after: 60 },
    shading: headerShading,
    children: [
      new TextRun({ text: `TILSTANDSVURDERING `, bold: true, size: 22, color: "78350F" }),
      new TextRun({ text: `– ${sectionLabel}`, bold: true, size: 20, color: "78350F" }),
      ...(ingenAvvik ? [new TextRun({ text: `   [TG 0 – Ingen avvik]`, bold: true, size: 20, color: "78350F" })] : []),
    ],
  }));

  if (ingenAvvik) {
    children.push(new Paragraph({
      spacing: { before: 80, after: 40 },
      shading: { type: ShadingType.SOLID, color: "D1FAE5", fill: "D1FAE5" },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: "059669", space: 4 } },
      children: [new TextRun({ text: "Det er ikke funnet noen avvik på dette området.", size: 20, color: "065F46" })],
    }));
  }

  if (harKommentar) {
    children.push(new Paragraph({
      spacing: { before: 100, after: 20 },
      shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: "D97706", space: 4 } },
      children: [new TextRun({ text: "KOMMENTAR", bold: true, size: 18, color: "78350F" })],
    }));
    const linjer = String(tilstandData.kommentar).split(/\r?\n/);
    linjer.forEach((linje, i) => {
      children.push(new Paragraph({
        spacing: { before: i === 0 ? 20 : 0, after: i === linjer.length - 1 ? 40 : 0 },
        shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: "D97706", space: 4 } },
        children: [new TextRun({ text: linje, size: 20, color: "78350F" })],
      }));
    });
  }

  const renderKategori = async (
    tittel: string,
    headerColor: string,
    headerBg: string,
    accentColor: string,
    kat: TilstandKategoriExport,
  ) => {
    if (kat.avvik.length === 0) return;
    children.push(new Paragraph({
      spacing: { before: 140, after: 40 },
      shading: { type: ShadingType.SOLID, color: headerBg, fill: headerBg },
      children: [new TextRun({ text: `${tittel.toUpperCase()} (${kat.avvik.length})`, bold: true, size: 20, color: headerColor })],
    }));
    for (let idx = 0; idx < kat.avvik.length; idx++) {
      const avvik = kat.avvik[idx];
      const gTekst = avvik.grad ? tilstandGradLabels[avvik.grad] || "" : "";
      const overskrift = `Avvik ${idx + 1}${gTekst ? `  –  ${gTekst}` : ""}`;
      children.push(new Paragraph({
        spacing: { before: 80, after: 20 },
        shading: { type: ShadingType.SOLID, color: "FFFFFF", fill: "FFFFFF" },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: accentColor, space: 4 } },
        children: [new TextRun({ text: overskrift, bold: true, size: 20, color: accentColor })],
      }));
      if (avvik.beskrivelse) {
        children.push(new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: avvik.beskrivelse, size: 20 })],
        }));
      }
      for (let i = 0; i < avvik.bilder.length; i++) {
        const bilde = avvik.bilder[i];
        const imageResult = await fetchImageAsBuffer(bilde.url);
        if (imageResult) {
          const maxW = 450;
          const scale = Math.min(maxW / imageResult.width, 1);
          const w = Math.round(imageResult.width * scale);
          const h = Math.round(imageResult.height * scale);
          children.push(new Paragraph({
            spacing: { before: 80, after: 20 },
            children: [
              new ImageRun({
                data: imageResult.buffer,
                transformation: { width: w, height: h },
                type: "jpg",
              }),
            ],
          }));
        }
        if (bilde.beskrivelse) {
          children.push(new Paragraph({
            spacing: { before: 10, after: 60 },
            children: [new TextRun({ text: `Bilde ${i + 1}: ${bilde.beskrivelse}`, size: 18, italics: true })],
          }));
        }
      }
    }
  };

  await renderKategori("Avvik som krever aktive tiltak", "991B1B", "FEE2E2", "991B1B", tiltak);
  await renderKategori("Avvik som kan fraviksbehandles", "9A3412", "FFEDD5", "C2410C", fravik);

  return [new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: tableBorders,
        shading: tilstandShading,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children,
      }),
    ],
  })];
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

export async function buildChapter3Table(formData: Record<string, any>): Promise<Table> {
  const rows: TableRow[] = [];
  const bygningsdeler = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
  const branncelleTyper = Array.isArray(formData.branncelleTyper) ? formData.branncelleTyper : [];

  // ===== 3.1 Bæreevne og stabilitet =====
  rows.push(sectionHeaderRow("3.1   §11-4 Bæreevne og stabilitet"));
  rows.push(columnHeaderRow());

  if (formData.harFlereRisikoklasser && bygningsdeler.length > 0) {
    // Determine highest brannklasse among bygningsdeler
    const maxBkl = Math.max(...bygningsdeler.map((del: any) => {
      const bk = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
      return parseInt(bk?.replace("BKL", "") || "1");
    }));
    const balkongTekst = formData.balkongRelevant
      ? "\n\nBalkonger, utkragede bygningsdeler og lignende må ha forsvarlig innfesting for å hindre nedfall som kan skade rednings- og slokkemannskapene og deres materiell under førsteinnsatsen. Tyngre bygningsdeler, som for eksempel balkonger, må forankres i byggverkets hovedbæresystem."
      : "";
    const genereltTekst = maxBkl >= 3
      ? "Det bærende hovedsystemet i byggverk i brannklasse 3 og 4 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet gjennom et fullstendig brannforløp, slik dette kan modelleres." + balkongTekst
      : "Bæresystemet i byggverk i brannklasse 1 og 2 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet i minimum den tiden som er nødvendig for å rømme og redde personer og husdyr i og på byggverket." + balkongTekst;
    rows.push(contentRow("Generelt", genereltTekst, "RIB"));
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
    // Add brannklasse-dependent Generelt row
    const bklNum = parseInt(formData.brannklasse?.replace("BKL", "") || "1");
    const balkongTekst = formData.balkongRelevant
      ? "\n\nBalkonger, utkragede bygningsdeler og lignende må ha forsvarlig innfesting for å hindre nedfall som kan skade rednings- og slokkemannskapene og deres materiell under førsteinnsatsen. Tyngre bygningsdeler, som for eksempel balkonger, må forankres i byggverkets hovedbæresystem."
      : "";
    const genereltTekst = bklNum >= 3
      ? "Det bærende hovedsystemet i byggverk i brannklasse 3 og 4 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet gjennom et fullstendig brannforløp, slik dette kan modelleres." + balkongTekst
      : "Bæresystemet i byggverk i brannklasse 1 og 2 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet i minimum den tiden som er nødvendig for å rømme og redde personer og husdyr i og på byggverket." + balkongTekst;
    rows.push(contentRow("Generelt", genereltTekst, "RIB"));

    const lines = (formData.baereevne || "").split("\n").filter((l: string) => l.trim());
    if (lines.length >= 2) {
      lines.forEach((line: string) => {
        const parts = line.split(":");
        const label = parts[0]?.trim() || "Krav";
        const value = parts.slice(1).join(":").trim() || "-";
        rows.push(contentRow(label, value, "RIB"));
      });
    } else if (formData.baereevne) {
      rows.push(contentRow("Generelt", formData.baereevne, "RIB"));
    }
  }
  if (formData.baereevneKommentar) {
    rows.push(contentRow("Kommentar", formData.baereevneKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_1", "3.1 Bæreevne og stabilitet"));

  // ===== 3.2 Sikkerhet ved eksplosjon =====
  rows.push(sectionHeaderRow("3.2   §11-5 Sikkerhet ved eksplosjon"));
  rows.push(columnHeaderRow());
  rows.push(contentRow("Generelt", "Byggverk der den forutsatte bruken kan medføre fare for eksplosjon, skal prosjekteres og utføres med avlastningsflater slik at personsikkerheten og bæreevnen opprettholdes på et tilfredsstillende nivå.", "RIBr"));

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
  rows.push(...await tilstandRow(formData, "3_2", "3.2 Sikkerhet ved eksplosjon"));

  // ===== 3.3 Brannspredning mellom byggverk =====
  rows.push(sectionHeaderRow("3.3   §11-6 Brannspredning mellom byggverk"));
  rows.push(columnHeaderRow());
  if (formData.nabobyggIkkeRelevant) {
    rows.push(contentRow("Nabobygg", "Nabobygg ligger så langt unna at det er vurdert som ikke relevant. Krav til avstand og branncellevegg/brannvegg mot nabobygg er ikke aktuelt.", "RIBr"));
    rows.push(...await tilstandRow(formData, "3_3", "3.3 Brannspredning mellom byggverk"));
  } else {
  rows.push(contentRow("Generelt", "Brannspredning mellom byggverk skal forebygges slik at sikkerheten for personer og husdyr ivaretas, og at brann ikke kan føre til urimelige store økonomiske tap eller samfunnsmessige konsekvenser.", "RIBr"));
  rows.push(contentRow("Avstand til nabobygg", formData.avstandNabobygg ? `${formData.avstandNabobygg} meter` : "[Ikke angitt]", "-"));
  rows.push(contentRow("Bygningshøyde", formData.bygningshoyde ? `${formData.bygningshoyde} meter` : "[Ikke angitt]", "-"));

  const hoyde = parseFloat(formData.bygningshoyde) || 0;
  const avstand = parseFloat(formData.avstandNabobygg || "0");

  if (hoyde > 9 && avstand < 8) {
    const lines: string[] = [];
    lines.push("Brannvegg (bygning over 9 meter, avstand til nabobygg under 8 meter).");
    if (formData.spesifikkBrannenergi) {
      const energiMap: Record<string, string> = {
        "inntil400": "Inntil 400 MJ/m² → REI 120-M A2-s1,d0 [A 120]",
        "400-600": "400-600 MJ/m² → REI 180-M A2-s1,d0 [A 180]",
        "600-800": "600-800 MJ/m² → REI 240-M A2-s1,d0 [A 240]",
      };
      lines.push("", "Brannmotstand basert på spesifikk brannenergi:", energiMap[formData.spesifikkBrannenergi] || "");
    }
    lines.push(
      "",
      "1. Takkonstruksjonen må ikke være kontinuerlig over brannveggen.",
      "2. Konstruksjoner inntil brannveggen må kunne bevege seg fritt ved temperaturendringer.",
      "3. Brannveggens avslutning mot tak og fasade må hindre brannspredning.",
      "4. Brannveggen må ha brannmotstand minst som angitt i tabell 1.",
      "5. Brannveggen må bestå av materialer i klasse A2-s1,d0 [ubrennbare].",
      "6. Uten dokumentert mekanisk motstandsevne (M): tunge materialer som mur/betong.",
      "7. Brannveggen må føres min. 0,5 m over høyeste tilstøtende tak.",
      "8. Brannveggen må bli stående selv om byggverket på én side raser sammen.",
    );
    rows.push(contentRowMultiLine("Krav til brannvegg", lines, "RIB"));
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
  rows.push(...await tilstandRow(formData, "3_3", "3.3 Brannspredning mellom byggverk"));
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
    if (formData.innvendigHjorne === "ja") {
      rows.push(contentRow("Innvendig hjørne",
        formData.innvendigHjorneAlternativ === "alt1"
          ? "For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 8,0 meter forbi innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 1)."
          : "For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 5,0 meter på hver side av innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 2).",
        "RIBr / ARK"));
    }
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
  // Dører og vinduer i seksjoneringsvegg
  if (formData.seksjonDorRelevant || formData.seksjonVinduRelevant) {
    const lines: string[] = [];
    const dorOgVindu = formData.seksjonDorRelevant && formData.seksjonVinduRelevant;
    const kunDor = formData.seksjonDorRelevant && !formData.seksjonVinduRelevant;
    const kunVindu = !formData.seksjonDorRelevant && formData.seksjonVinduRelevant;
    let nr = 1;
    if (dorOgVindu) {
      lines.push(`${nr++}. Vinduer og dører må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.`);
      lines.push(`${nr++}. Vinduer og dører må ha tilsvarende brannmotstand som veggen.`);
    } else if (kunDor) {
      lines.push(`${nr++}. Dører må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.`);
      lines.push(`${nr++}. Dører må ha tilsvarende brannmotstand som veggen.`);
    } else if (kunVindu) {
      lines.push(`${nr++}. Vinduer må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.`);
      lines.push(`${nr++}. Vinduer må ha tilsvarende brannmotstand som veggen.`);
    }
    if (formData.seksjonDorRelevant) {
      lines.push(`${nr++}. Dør som er klassifisert etter NS 3919:1997 [A 120 osv.] må ha anslag, terskel og tettelister på alle sider for å oppnå tilstrekkelig røyktetthet. Dette gjelder ikke dører og luker som er testet og oppfyller kriteriene for Sₐ-klassifisering etter NS-EN 1634-3:2004 (inklusiv rettelsesblad AC:2006).`);
      lines.push(`${nr++}. Dører må være lukket i en brukssituasjon eller ha automatikk som lukker døren ved deteksjon av røyk.`);
    }
    if (formData.seksjonVinduRelevant) {
      lines.push(`${nr++}. Vinduer må ikke kunne åpnes i vanlig brukstilstand.`);
    }
    rows.push(contentRowMultiLine("Dører og vinduer i seksjoneringsvegg", lines, "ARK"));
  }

  if (formData.brannseksjonerKommentar) {
    rows.push(contentRow("Kommentar", formData.brannseksjonerKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_4", "3.4 Brannseksjoner"));

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

    // Heismaskinrom
    if (formData.heismaskinromRelevant === "ja") {
      const heisKrav: Record<string, string> = {
        "BKL1": "EI 60 [B 60]",
        "BKL2": "EI 60 [B 60]",
        "BKL3": "EI 60 A2-s1,d0 [A 60]",
      };
      rows.push(contentRow("Heismaskinrom", heisKrav[formData.brannklasse] || "[Angis]", "ARK/RIBr"));
    }

    // Fyrrom
    if (formData.fyrromRelevant === "ja") {
      const fyrromFast: Record<string, string> = {
        "BKL1": "EI 60 [B 60]",
        "BKL2": "EI 60 [B 60]",
        "BKL3": "EI 60 A2-s1,d0 [A 60]",
      };
      const fyrromUnder50 = "K₂ 10 A2-s1,d0 [K1-A] – kun ytelse for kledning/overflate";
      const fyrrom50_100: Record<string, string> = {
        "BKL1": "EI 30 [B 30]",
        "BKL2": "EI 60 [B 60]",
        "BKL3": "EI 60 A2-s1,d0 [A 60]",
      };
      const fyrromOver100 = "EI 60 A2-s1,d0 [A 60]";

      if (formData.fyrromKw === "fast") {
        rows.push(contentRow("Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel", fyrromFast[formData.brannklasse] || "[Angis]", "ARK/RIBr"));
      } else if (formData.fyrromKw === "under50") {
        rows.push(contentRow("Fyrrom – flytende/gassformig brensel, P < 50 kW", fyrromUnder50, "ARK/RIBr"));
      } else if (formData.fyrromKw === "50-100") {
        rows.push(contentRow("Fyrrom – flytende/gassformig brensel, 50 kW ≤ P ≤ 100 kW", fyrrom50_100[formData.brannklasse] || "[Angis]", "ARK/RIBr"));
      } else if (formData.fyrromKw === "over100") {
        rows.push(contentRow("Fyrrom – flytende/gassformig brensel, P > 100 kW", fyrromOver100, "ARK/RIBr"));
      } else if (formData.fyrromKw === "ukjent") {
        rows.push(contentRow("Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel", fyrromFast[formData.brannklasse] || "[Angis]", "ARK/RIBr"));
        rows.push(contentRow("Fyrrom – flytende/gassformig brensel, P < 50 kW", "K₂ 10 A2-s1,d0 [K1-A]", "ARK/RIBr"));
        rows.push(contentRow("Fyrrom – flytende/gassformig brensel, 50 kW ≤ P ≤ 100 kW", fyrrom50_100[formData.brannklasse] || "[Angis]", "ARK/RIBr"));
        rows.push(contentRow("Fyrrom – flytende/gassformig brensel, P > 100 kW", fyrromOver100, "ARK/RIBr"));
      }
    }
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

  // Dørkrav
  if (formData.dorPlasseringer && formData.dorPlasseringer.length > 0 && (formData.brannklasse || formData.bygningsbrannklasse)) {
    const isBF85 = formData.regelverk === "BF85";
    if (isBF85) {
      const bbk = parseInt(formData.bygningsbrannklasse || '0', 10);
      type BF85DorKrav = { label: string; bbk1: string; bbk2: string; bbk3: string; bbk4: string };
      const bf85DorKravMap: Record<string, BF85DorKrav> = {
        bf85_branncelle_aapent: { label: "Branncelle – åpent trapperom (Tr1)", bbk1: "A 30 S (EI 30-A2s1,d0-CSa)", bbk2: "A 30 S (EI 30-A2s1,d0-CSa)", bbk3: "B 30 S (EI 30-CSa)", bbk4: "B 30 S (EI 30-CSa)" },
        bf85_korridor_lukket: { label: "Korridor – lukket trapperom (Tr2)", bbk1: "A 30 S (EI 30-A2s1,d0-CSa)", bbk2: "A 30 S (EI 30-A2s1,d0-CSa)", bbk3: "B 30 S eller F 30 S (EI 30-CSa eller E 30-CSa)", bbk4: "B 30 S eller F 30 S (EI 30-CSa eller E 30-CSa)" },
        bf85_korridor_sluse_branntrygt: { label: "Korridor/sluse – branntrygt trapperom (Tr2)", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 60 S (EI 60-A2s1,d0-CSa)", bbk4: "A 60 S (EI 60-A2s1,d0-CSa)" },
        bf85_roykfritt_fri_luft: { label: "Røykfritt trapperom (Tr3) – fri luft", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 60 S (EI 60-A2s1,d0-CSa)", bbk4: "A 60 S (EI 60-A2s1,d0-CSa)" },
        bf85_korridor_fri_luft: { label: "Korridor – fri luft (i kombinasjon med røykfritt trapperom (Tr3))", bbk1: "A 30 (EI 30-A2s1,d0-Sa)", bbk2: "A 30 (EI 30-A2s1,d0-Sa)", bbk3: "B 30 (EI 30-Sa)", bbk4: "B 30 (EI 30-Sa)" },
        bf85_branncelle_korridor: { label: "Branncelle – korridor", bbk1: "A 30 (EI 30-A2s1,d0-Sa)", bbk2: "A 30 (EI 30-A2s1,d0-Sa)", bbk3: "B 30 (EI 30-Sa)", bbk4: "B 15 (EI 15-Sa)" },
        bf85_branncelle_branncelle: { label: "Branncelle – branncelle", bbk1: "A 30 (EI 30-A2s1,d0-Sa)", bbk2: "A 30 (EI 30-A2s1,d0-Sa)", bbk3: "B 30 (EI 30-Sa)", bbk4: "B 15 (EI 15-Sa)" },
        bf85_loft_trapperom: { label: "Loft – trapperom", bbk1: "A 30 S (EI 30-A2s1,d0-CSa)", bbk2: "A 30 S (EI 30-A2s1,d0-CSa)", bbk3: "B 30 S (EI 30-CSa)", bbk4: "B 15 S (EI 15-CSa)" },
        bf85_kjeller_trapperom: { label: "Kjeller – trapperom", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 30 S (EI 30-A2s1,d0-CSa)", bbk4: "A 30 S (EI 30-A2s1,d0-CSa)" },
        bf85_kjeller_under_overste: { label: "Kjeller under øverste kjelleretasje – egen trapp eller annen atkomst", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 60 S (EI 60-A2s1,d0-CSa)", bbk4: "A 60 S (EI 60-A2s1,d0-CSa)" },
      };
      const bbkKey = (bbk >= 1 && bbk <= 4 ? `bbk${bbk}` : 'bbk2') as 'bbk1' | 'bbk2' | 'bbk3' | 'bbk4';
      const activeDoors = formData.dorPlasseringer
        .map((id: string) => bf85DorKravMap[id])
        .filter(Boolean);
      if (activeDoors.length > 0) {
        const lines = activeDoors.map((d: BF85DorKrav) => `${d.label}: ${d[bbkKey]}`);
        rows.push(contentRowMultiLine("Dørkrav (Tabell 30:75)", lines, "ARK"));
      }
    } else if (formData.brannklasse) {
      const isBKL1 = formData.brannklasse === "BKL1";
      const dorKravMap: Record<string, { label: string; bkl1: string; bkl23: string }> = {
        branncelle_trapperom_tr1: { label: "Branncelle – trapperom Tr 1", bkl1: "EI₂ 30-CSₐ [B 30 S]", bkl23: "EI₂ 30-CSₐ [B 30 S]" },
        korridor_trapperom_tr2: { label: "Korridor – trapperom Tr 2", bkl1: "E 30-CSₐ [F 30 S]", bkl23: "E 30-CSₐ [F 30 S]" },
        mellomliggende_trapperom_tr3: { label: "Mellomliggende rom – trapperom Tr 3", bkl1: "", bkl23: "EI₂ 60-CSₐ [B 60 S]" },
        garasje_brannsluse: { label: "Garasje – brannsluse", bkl1: "EI₂ 60-CSₐ [B 60 S]", bkl23: "EI₂ 60-CSₐ [B 60 S]" },
        branncelle_korridor: { label: "Branncelle – korridor", bkl1: "EI₂ 30-Sₐ [B 30]", bkl23: "EI₂ 30-Sₐ [B 30]" },
        korridor_det_fri_tr3: { label: "Korridor – det fri (i kombinasjon med trapperom Tr 3)", bkl1: "", bkl23: "EI₂ 30-Sₐ [B 30]" },
      };
      const activeDoors = formData.dorPlasseringer
        .map((id: string) => dorKravMap[id])
        .filter(Boolean)
        .filter((d: { bkl1: string; bkl23: string }) => isBKL1 ? d.bkl1 : d.bkl23);
      if (activeDoors.length > 0) {
        const lines = activeDoors
          .map((d: { label: string; bkl1: string; bkl23: string }) => {
            const krav = isBKL1 ? d.bkl1 : d.bkl23;
            return krav ? `${d.label}: ${krav}` : null;
          })
          .filter(Boolean) as string[];
        rows.push(contentRowMultiLine("Dørkrav", lines, "ARK"));
      }
    }
  }

  // Dører i rømningsvei – kraftstasjon
  {
    const erKraftstasjonDor = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
      || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
    if (erKraftstasjonDor) {
      rows.push(contentRow("Dører i rømningsvei – kraftstasjon", "For dører i rømningsvei anbefales det dører med vindu for å kunne oppdage personell, røyk eller brann.", "ARK"));
      rows.push(contentRow("Dør til rom for høyspenningsanlegg – kraftstasjon", "Dører til rom for høyspenningsanlegg skal ha selvlukker.", "ARK"));
      rows.push(contentRow("Dører til teknisk rom – kraftstasjon", "Dører til teknisk rom skal være utadslående for å sikre rømningsveier.", "ARK"));
    }
  }

  // Vinduskrav
  if (formData.vinduskravRelevant) {
    rows.push(contentRow("Vinduskrav", "Vindu med brannmotstand må ikke kunne åpnes i vanlig brukstilstand.", "ARK"));
  }

  // Heissjakt
  {
    const isBF85 = formData.regelverk === "BF85";
    const bf85Skip = isBF85 && formData.heissjaktRelevantBF85 !== "ja";
    if (!bf85Skip) {
      if (formData.heissjaktkravTekst && formData.heissjaktkravTekst.trim()) {
        const label = isBF85 ? "Krav til heissjakt (Kap. 30:33/30:65)" : "Krav til heissjakt";
        const ansvar = isBF85 ? "ARK/RIBr/RIV" : "ARK/RIBr";
        rows.push(contentRowMultiLine(label, formData.heissjaktkravTekst.split(/\n+/).filter((l: string) => l.trim()), ansvar));
      } else if (formData.heissjaktkrav && formData.heissjaktkrav.length > 0) {
        const heisKravMap: Record<string, string> = {
          heis_roykventileres_8: "I byggverk med inntil 8 etasjer må heissjakten røykventileres, eller det må etableres luftsluse (mellomliggende rom) utført som egen, ventilert branncelle, mellom heissjakten og tilstøtende rom.",
          heis_roykventileres_over8: "Heissjakt i byggverk med mer enn 8 etasjer må røykventileres og i tillegg utføres med luftsluse som beskrevet i nr. 1.",
          heis_dor_brannmotstand: "Dør må ha samme brannmotstand som veggen den står i, med unntak som gitt i nr. 4 og 5.",
          heis_dor_ei60: "I heissjakt med brannmotstand EI 60 kan det benyttes heisdør minst E 90 [F 90]. Heisdør kan utføres uten klasse Sₐ.",
          heis_dor_luftsluse: "Brannmotstand for dør fra tilstøtende rom til luftsluse som beskrevet i nr. 1 og 2 må være minst EI 30-Sₐ.",
        };
        const lines = formData.heissjaktkrav
          .map((id: string, idx: number) => heisKravMap[id] ? `${idx + 1}. ${heisKravMap[id]}` : null)
          .filter(Boolean) as string[];
        if (lines.length > 0) {
          rows.push(contentRowMultiLine("Krav til heissjakt", lines, "ARK/RIBr"));
        }
      }
    }
  }

  // Trapperom
  if (formData.trapperomKrav && formData.trapperomKrav.length > 0) {
    const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
    const floors = parseInt(formData.etasjer || '0', 10);
    const trapperomTypeMap: Record<number, { lav: string; hoy: string }> = {
      1: { lav: "Tr 1", hoy: "Tr 3" },
      2: { lav: "Tr 1", hoy: "Tr 3" },
      3: { lav: "Tr 2", hoy: "Tr 3" },
      4: { lav: "Tr 1", hoy: "Tr 3" },
      5: { lav: "Tr 2", hoy: "Tr 3" },
      6: { lav: "Tr 2", hoy: "Tr 3" },
    };
    const trType = rk >= 1 && rk <= 6 && floors > 0
      ? (floors <= 8 ? trapperomTypeMap[rk].lav : trapperomTypeMap[rk].hoy)
      : null;
    const trapperomKravMap: Record<string, string> = {
      tr_forbinder_brannceller: "Trapperom som forbinder ulike brannceller, må utføres som egen branncelle selv om trapperommet ikke er en del av en rømningsvei.",
      tr_romningsvei_videre: "Dersom trapperommet ikke leder direkte til det fri eller sikkert sted, må rømningsveien videre utføres som trapperom med hensyn til omsluttende konstruksjoner, mellomliggende rom, dører mv.",
      tr_mellomliggende_rom: "Mellomliggende rom må ha tilstrekkelig størrelse, og må kunne passeres ved å åpne bare én dør om gangen.",
      tr1_dor_bruksenhet: "Trapperom Tr 1 kan ha dør direkte fra trapperom til bruksenhet, for eksempel leilighet eller kontor. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 2.",
      tr2_eget_rom: "Trapperom Tr 2 må ha et rom utført som egen branncelle mellom trapperommet og branncellen det skal rømmes fra. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 3. Trapperom Tr 2 kan gå til kjeller når det er brannsluse mellom de øvrige branncellene i kjelleren og trapperommet.",
      tr3_mellomliggende: "Trapperom Tr 3 må ha et mellomliggende rom utført som egen branncelle mellom trapperommet og bruksenheten det skal rømmes fra. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 4. Trapperom Tr 3 kan ikke ha forbindelse til kjeller. Hensikten er å hindre at personer rømmer ned til kjelleren, og å hindre blokkering av trapperommet ved brann i kjeller.",
      tr_roykspredning: "Det må treffes tiltak for å begrense eller hindre røykspredning til trapperom Tr 2 og Tr 3 i samsvar med preaksepterte ytelser under G. Røykkontroll.",
    };
    const lines = formData.trapperomKrav
      .map((id: string, idx: number) => trapperomKravMap[id] ? `${idx + 1}. ${trapperomKravMap[id]}` : null)
      .filter(Boolean) as string[];
    if (lines.length > 0) {
      const forhold = trType ? `Krav til trapperom (${trType})` : "Krav til trapperom";
      rows.push(contentRowMultiLine(forhold, lines, "ARK/RIBr"));
    }
  }

  // Interntrapp
  if (formData.interntrappBeskrivelse) {
    rows.push(contentRow("Interntrapp", formData.interntrappBeskrivelse, "ARK"));
  }

  // Røykkontroll / BF85 brannventilasjon
  {
    const isBF85 = formData.regelverk === "BF85";
    const etasjer = parseInt(formData.etasjer, 10) || 0;
    const bf85KravAktivt = formData.roykKontrollKrav?.includes("bf85_royk_brannventilasjon");
    const label = isBF85 ? "Brannventilasjon (Røykventilasjon)" : "Røykkontroll";

    if (formData.roykKontrollKravTekst) {
      rows.push(contentRow(label, formData.roykKontrollKravTekst, "ARK/RIV"));
    } else if (isBF85 && etasjer > 2 && !bf85KravAktivt) {
      rows.push(contentRow(
        label,
        "Avvik: Bygget har flere enn 2 etasjer. Etter BF85 §78 skal trapperom ha brannventilasjon. Vurdering er beskrevet i tilstandsvurderingen i slutten av kapittelet.",
        "ARK/RIV"
      ));
    } else if (formData.roykKontrollKrav && formData.roykKontrollKrav.length > 0) {
      const roykKravMap: Record<string, string> = {
        royk_romningsvei: "Trapperom som er rømningsvei i byggverk med flere enn to etasjer, må røykventileres.",
        royk_luke_vindu: "I byggverk med inntil 8 etasjer med trapperom Tr 1 eller Tr 2, jf. § 11-13 Tabell 2, er det tilstrekkelig med luke eller vindu med fri åpning minimum 1,0 m² øverst i trapperommet.",
        royk_manuell_bryter: "Luke eller vindu skal kunne åpnes manuelt med bryter fra inngangsplanet.",
        royk_mekanisk_ventilasjon: "Mellomliggende rom knyttet til Tr 2 må ha mekanisk balansert ventilasjon.",
        royk_tr3_trykksetting: "I byggverk med mer enn 8 etasjer med trapperom Tr 3, jf. § 11-13 Tabell 2, må det mellomliggende rommet være åpent mot det fri, eller trapperommet må trykksettes og det mellomliggende rommet må ha trykkavlastning (røykventilasjon).",
        royk_overbygde_garder: "Overbygde gårder og gater må ha røykventilasjon for å hindre røykspredning mellom ulike brannceller som ligger ut mot den overbygde gården.",
        bf85_royk_brannventilasjon: etasjer > 8
          ? "I bygning med flere enn 2 etasjer skal trapperom ha brannventilasjon. Bygningen har over 8 etasjer og skal ha en røyksjakt som er skilt fra loft i minst A 30 og som har et tverrsnitt på minst 1 m². Sjakten skal gå 20 cm over takflaten."
          : "I bygning med flere enn 2 etasjer skal trapperom ha brannventilasjon. For bygninger med inntil 8 etasjer kan brannventilasjonen skje gjennom vindu i trapperom.",
      };
      const lines = formData.roykKontrollKrav
        .map((id: string, idx: number) => roykKravMap[id] ? `${idx + 1}. ${roykKravMap[id]}` : null)
        .filter(Boolean) as string[];
      if (lines.length > 0) {
        rows.push(contentRowMultiLine(label, lines, "ARK/RIV"));
      }
    }
  }

  // Vertikal brannspredning
  if (formData.vertikalBrannspredningRelevant) {
    const vbKravMap: Record<string, string> = {
      vb_kjolesone: "Kjølesone (vertikal avstand) mellom vinduer er minst lik høyden til underliggende vindu og utført med brannmotstand minst E 30.",
      vb_fasade_e30: "Annenhver etasje er utført med fasade minst E 30.",
      vb_inntrukne: "Inntrukne fasadepartier er på minimum 1,2 meter, eller utkragede bygningsdeler med samme brannmotstand som etasjeskiller er minimum 1,2 meter ut fra fasadelivet.",
      vb_sprinkler: "Byggverket har automatisk sprinkleranlegg.",
      vb_takfot: "Med mindre byggverket har automatisk sprinkleranlegg, må takfoten – i hele lengden – utføres som branncellebegrensende konstruksjon for brannpåvirkning nedenfra.",
    };
    const mainItems = (formData.vertikalBrannspredningKrav || [])
      .filter((id: string) => id !== "vb_takfot")
      .map((id: string, idx: number) => vbKravMap[id] ? `${idx + 1}. ${vbKravMap[id]}` : null)
      .filter(Boolean) as string[];
    const hasTakfot = (formData.vertikalBrannspredningKrav || []).includes("vb_takfot");
    const lines: string[] = [];
    if (mainItems.length > 0) {
      lines.push("Sannsynligheten for brannspredning mellom brannceller i ulike plan, må reduseres på en av følgende måter:");
      lines.push(...mainItems);
    }
    if (hasTakfot) {
      lines.push(vbKravMap.vb_takfot);
    }
    if (lines.length > 0) {
      rows.push(contentRowMultiLine("Vertikal brannspredning", lines, "ARK"));
    }
  }


  // Horisontal brannspredning
  if (formData.vinduBrannspredningRelevant && formData.vinduBrannspredningKrav && formData.vinduBrannspredningKrav.length > 0) {
    const vvKravMap: Record<string, string> = {
      vv_branncellebegrensende: "Branncellebegrensende konstruksjoner i et byggverk, eller mellom to lave byggverk, må utføres slik at det blir liten sannsynlighet for brannspredning via vinduer som ligger med liten innbyrdes avstand i innvendig hjørne, eller mellom vinduer i motstående fasader.",
      vv_brannmotstand_vegg: "Vinduer må ha samme brannmotstand som veggen de står i, med unntak som gitt i tabell 3. For motstående parallelle yttervegger gjelder tabell 3 bare når vindusarealet ikke utgjør mer enn 1/3 av veggarealet.",
      vv_sprinkler_unntak: "Hvis byggverket eller byggverkene har automatisk sprinkleranlegg kan det benyttes vinduer uten spesifisert brannmotstand, med unntak for vinduer mot rømningsvei.",
      vv_sprinkler_romningsvei: "Hvis byggverket eller byggverkene har automatisk sprinkleranlegg kan vindu mot utvendig rømningsvei ha brannmotstand EW 30 i brannklasse 1 og EW 60 i brannklasse 2 og 3.",
      vv_enkeltvinduer: "Enkeltvinduer i mindre rom i bolighus (for eksempel i vaskerom, bad og soverom) opp til 0,20 m² glassflate, kan være uten spesifisert brannmotstand når avstanden til uklassifisert bygningsdel er minimum 5 meter.",
    };
    const lines = formData.vinduBrannspredningKrav
      .map((id: string, idx: number) => vvKravMap[id] ? `${idx + 1}. ${vvKravMap[id]}` : null)
      .filter(Boolean) as string[];
    
    // Add distance-based requirements for each placement type
    const plasseringer = formData.horisontaltPlasseringer || [];
    const bklNum = formData.harFlereRisikoklasser
      ? (() => {
          const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n));
          return nums.length > 0 ? Math.max(...nums) : 0;
        })()
      : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
    const erBKL1 = bklNum === 1;
    const bklTekst = erBKL1 ? "BKL 1" : "BKL 2 og 3";
    if (plasseringer.includes("parallelle")) {
      (formData.horisontaltParallelleVinduer || []).forEach((v: any, i: number) => {
        const avstand = parseFloat(v.avstand);
        if (!isNaN(avstand)) {
          let krav = "";
          if (avstand < 3.0) krav = erBKL1 ? "Ett vindu EI 30 eller begge EI 15" : "Ett vindu EI 60 eller begge EI 30";
          else if (avstand < 6.0) krav = erBKL1 ? "Ett vindu E 30 [F 30] eller begge EI 15" : "Ett vindu E 60 [F 60] eller begge E 30 [F 30]";
          else krav = "Uspesifisert";
          lines.push(`Motstående parallelle yttervegger – vindu ${i + 1} i ${bklTekst}: Avstand L = ${v.avstand} m. Nødvendig brannmotstand: ${krav}.`);
        }
      });
    }
    if (plasseringer.includes("hjorne")) {
      (formData.horisontaltHjorneVinduer || []).forEach((v: any, i: number) => {
        const avstand = parseFloat(v.avstand);
        if (!isNaN(avstand)) {
          let krav = "";
          if (avstand < 2.0) krav = erBKL1 ? "Ett vindu EI 30 eller begge EI 15" : "Ett vindu EI 60 eller begge EI 30";
          else if (avstand < 4.0) krav = erBKL1 ? "Ett vindu E 30 [F 30] eller begge EI 15" : "Ett vindu E 60 [F 60] eller begge E 30 [F 30]";
          else krav = "Uspesifisert";
          lines.push(`Innvendige hjørner – vindu ${i + 1} i ${bklTekst}: Avstand L = ${v.avstand} m. Nødvendig brannmotstand: ${krav}.`);
        }
      });
    }
    
    if (lines.length > 0) {
      rows.push(contentRowMultiLine("Horisontal brannspredning", lines, "ARK"));
    }
  }

  // Brannceller over flere plan
  if (formData.branncellerFlerePlanRelevant && formData.branncellerFlerePlanKrav && formData.branncellerFlerePlanKrav.length > 0) {
    const fpKravMap: Record<string, string> = {
      fp_sprinkler: "Det må installeres automatisk sprinkleranlegg når samlet bruttoareal for plan som har åpen forbindelse er over 800 m², jf. også § 11-12 første ledd.",
      fp_romningsvei: "Det må være tilrettelagte rømningsveier fra hvert enkelt plan, jf. også § 11-13 fjerde ledd.",
    };
    const lines = [
      "Brannceller i risikoklasse 1, 2, 4 og 5 kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte, dersom følgende ytelser er oppfylt:",
      ...formData.branncellerFlerePlanKrav
        .map((id: string, idx: number) => fpKravMap[id] ? `${idx + 1}. ${fpKravMap[id]}` : null)
        .filter(Boolean) as string[]
    ];
    rows.push(contentRowMultiLine("Brannceller over flere plan", lines, "RIBr"));
  }

  // Garasje - automatisk genererte krav
  if (formData.garasjeRelevant && formData.garasjePlassering && formData.garasjeAreal &&
      (formData.garasjeAreal !== "under_50" || formData.garasjeBruksenhet)) {
    const krav = getGarasjeKrav(formData.garasjePlassering, formData.garasjeAreal, formData.garasjeBruksenhet, formData.brannklasse || "");
    const grouped: Record<string, { tekst: string; ansvar: string }[]> = {};
    krav.forEach((k: { kategori: string; tekst: string; ansvar: string }) => {
      if (!grouped[k.kategori]) grouped[k.kategori] = [];
      grouped[k.kategori].push({ tekst: k.tekst, ansvar: k.ansvar });
    });
    Object.entries(grouped).forEach(([kategori, items]) => {
      const lines = items.map((item, i) => items.length > 1 ? `${i + 1}. ${item.tekst}` : item.tekst);
      rows.push(contentRowMultiLine(kategori, lines, items[0].ansvar));
    });
  }

  // Brensellagring
  if (formData.brensellagringRelevant && formData.brenselType && formData.brenselMengde) {
    const result = getBrensellagringKrav(formData.brenselType as BrenselType, parseInt(formData.brenselMengde));
    if (result.krav.length > 0) {
      const lines = [
        `Romtype: ${result.romType}`,
        ...result.krav.map(k => `${k.kategori}: ${k.tekst}`)
      ];
      rows.push(contentRowMultiLine("Rom for lagring av flytende brensel", lines, "ARK"));
    }
  }


  // Husdyrrom
  if (formData.branncelleTyper?.includes("husdyrrom") && formData.husdyrromAreal) {
    const tekst = formData.husdyrromAreal === "under_300"
      ? "Husdyrrom med bruttoareal mindre enn 300 m² må være avgrenset fra resten av byggverket med bygningsdeler med brannmotstand minst EI 30 [B 30]."
      : "Husdyrrom med bruttoareal større enn 300 m² må være avgrenset fra resten av byggverket med bygningsdeler med brannmotstand minst EI 60 [B 60].";
    rows.push(contentRow("Husdyrrom", tekst, "ARK"));
  }

  if (formData.branncellerKommentar) {
    rows.push(contentRow("Kommentar", formData.branncellerKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_5", "3.5 Brannceller"));

  // ===== 3.6 Materialer og produkters egenskaper ved brann =====
  rows.push(sectionHeaderRow("3.6   §11-9 Materialer og produkters egenskaper ved brann"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Byggverk skal prosjekteres og utføres slik at det er liten sannsynlighet for at brann skal oppstå, utvikle og spre seg. Det skal tas hensyn til byggverkets bruk og den nødvendige tiden for rømning og redning.",
    "RIBr"
  ));
  // Overflater i hulrom – egen rad
  if (formData.matNote2) {
    rows.push(contentRow(
      "Overflater i hulrom",
      "Overflater i hulrom betraktes på samme måte som innvendig overflate og må ha minst like gode branntekniske egenskaper.",
      "RIBr"
    ));
  }
  // Rom med brannfarlig virksomhet – egen rad
  if (formData.matNote3) {
    rows.push(contentRow(
      "Rom med brannfarlig virksomhet",
      "Rom med brannfarlig virksomhet må ha kledning som tilfredsstiller klasse K₂10 A2-s1,d0 [K1-A]. Eksempel på rom med brannfarlig virksomhet er rom hvor det oppbevares fyrverkeri, brannfarlig væske kategori 1 og 2, eller rom hvor det utføres varme arbeider som sveising, sliping samt rom hvor det arbeides med åpen varme.",
      "RIBr"
    ));
  }
  // Innvendige overflater og kledninger – øvrig
  if (formData.matNote4) {
    rows.push(contentRow(
      "Innvendige overflater og kledninger (generelt)",
      "Selv om sikkerhet ved brann dokumenteres ved analyse, må innvendige overflater på vegger og i himlinger ha minst klasse D-s2,d0 [In 2]. Lavere ytelse kan gi uakseptabelt bidrag til brannutviklingen. Dette kan utgjøre en fare for personsikkerheten. En meget rask brannutvikling kan også medføre at automatiske slokkeanlegg ikke har den effekten som er forutsatt.",
      "RIBr"
    ));
  }
  
  // Sub-section: Overflater i brannceller som ikke er rømningsvei
  const isRK6 = formData.risikoklasse === "RK6";
  rows.push(graySubSectionHeaderRow("Overflater i brannceller som ikke er rømningsvei"));
  if (isRK6) {
    rows.push(contentRow("Overflater på vegger og i himling/tak, og i sjakter og hulrom", "B-s1,d0 [In 1]", "ARK"));
    rows.push(contentRow("Overflater på gulv", "Dfl-s1 [G]", "ARK"));
  } else {
    rows.push(contentRow("Overflater på vegger og i himling/tak i branncelle inntil 200 m²", "D-s2,d0 [In 2]", "ARK"));
    rows.push(contentRow(
      "Overflater på vegger og i himling/tak i branncelle over 200 m²",
      formData.brannklasse === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]",
      "ARK"
    ));
    rows.push(contentRow("Overflater i sjakter og hulrom", "B-s1,d0 [In 1]", "ARK"));
  }

  // Sub-section: Overflater i brannceller som er rømningsvei
  rows.push(graySubSectionHeaderRow("Overflater i brannceller som er rømningsvei"));
  rows.push(contentRow("Overflater på vegger og i himling/tak", "B-s1,d0 [In 1]", "ARK"));
  rows.push(contentRow("Overflater på gulv", "Dfl-s1 [G]", "ARK"));

  // Sub-section: Utvendige overflater
  rows.push(graySubSectionHeaderRow("Utvendige overflater"));
  rows.push(contentRow("Overflater på ytterkledning", formData.brannklasse === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]", "ARK"));
  const utvOverflaterLines: string[] = [];
  if (formData.brannklasse === "BKL2" || formData.brannklasse === "BKL3") {
    const hasEtasjeUnntak = ["RK1", "RK2", "RK4"].includes(formData.risikoklasse);
    if (hasEtasjeUnntak) {
      utvOverflaterLines.push("Yttervegg kan ha utvendig overflate som tilfredsstiller klasse D-s3,d0 [Ut 2], når enten ytterveggen er utformet slik at den hindrer brannspredning i fasaden, eller byggverket har inntil fire etasjer, og det er liten fare for brannspredning til og fra nabobyggverk.");
    } else {
      utvOverflaterLines.push("Yttervegg kan ha utvendig overflate som tilfredsstiller klasse D-s3,d0 [Ut 2], når ytterveggen er utformet slik at den hindrer brannspredning i fasaden.");
    }
  }
  utvOverflaterLines.push("Overflater i hulrom i ytterveggkonstruksjoner betraktes på samme måte som utvendig overflate og må ha minst like gode branntekniske egenskaper.");
  if (formData.brannklasse === "BKL1" || formData.risikoklasse === "RK4") {
    const boligTekst = formData.risikoklasse === "RK4" ? " og boliger" : "";
    utvOverflaterLines.push(`Byggverk i brannklasse 1${boligTekst} inntil 3 etasjer kan ha uklassifiserte overflater i hulrom.`);
  }
  rows.push(contentRowMultiLine("Utvendige overflater", utvOverflaterLines, "ARK"));

  // Sub-section: Kledninger
  rows.push(graySubSectionHeaderRow("Kledninger"));
  if (isRK6) {
    rows.push(contentRow("Kledning i brannceller", "K₂10 B-s1,d0 [K1]", "ARK"));
    rows.push(contentRow("Kledninger i branncelle som er rømningsvei", "K₂10 A2-s1,d0 [K1-A]", "ARK"));
    rows.push(contentRow("Kledning i sjakter og hulrom", "K₂10 A2-s1,d0 [K1-A]", "ARK"));
  } else {
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
  }

  // Sub-section: Taktekning
  rows.push(graySubSectionHeaderRow("Taktekning"));
  const isSmahusRelevant = formData.risikoklasse === "RK4" || 
    (formData.risikoklasse === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig"));
  const taktekningLines = [
    "Taktekning kan bidra til brannspredning i et byggverk og mellom ulike byggverk.",
    "",
    "Taktekning må tilfredsstille klasse BROOF(t2) [Ta].",
    "Teglstein, betongtakstein, skifertak og metallplater kan uten ytterligere dokumentasjon antas å tilfredsstille klasse BROOF(t2) [Ta].",
    ...(isSmahusRelevant ? ["For småhus kan taktekning være uklassifisert der avstanden mellom de enkelte byggverk er minst 8 m."] : []),
    "Ett-sjikts tak av duk og folie må tilfredsstille klasse B-s3,d0 (Ut1).",
  ];
  rows.push(contentRowMultiLine("Taktekning", taktekningLines, "ARK"));

  // Nedforet himling i rømningsvei
  const himlingNotes: string[] = [];
  if (formData.himlingNote1) himlingNotes.push("1. Himlingen må tilfredsstille klasse A2-s1,d0 [In 1 på begrenset brennbart underlag] og ha et opphengsystem med dokumentert brannmotstand minst 10 minutter for den aktuelle eksponering, eller himlingen må bestå av kledning som tilfredsstiller klasse K₂10 A2-s1,d0 [K1-A].");
  if (formData.himlingNote2) himlingNotes.push("2. Overflater og kledninger i hulrom over himlingen må ha minst like gode branntekniske egenskaper som overflatene og kledningene i rømningsveien for øvrig.");
  if (himlingNotes.length > 0) {
    rows.push(contentRowMultiLine("Nedforet himling i rømningsvei", himlingNotes, "ARK"));
  }

  // Sub-section: Isolasjon
  const hasSandwich = formData.isolasjonSandwich === "relevant";
  const hasBrennbar = formData.isolasjonBrennbar === "relevant";
  const isoRk = formData.risikoklasse || "";
  const isoBkl = formData.brannklasse || "";
  const isoBygType = (formData.bygningstype || "").toLowerCase();
  const isoIsIndustri = isoBygType.includes("industri") || isoBygType.includes("lager") || isoBygType.includes("kraftstasjon");
  const isoIsBolig = isoBygType.includes("bolig");

  const sandwichBsd = hasSandwich && (
    (["RK1","RK2","RK3","RK4"].includes(isoRk) && isoBkl === "BKL1") ||
    (isoIsIndustri && isoBkl === "BKL2")
  );
  const sandwichDsd = hasSandwich && isoIsIndustri && isoBkl === "BKL1";
  const sandwichKjole = hasSandwich && isoRk === "RK4";
  const brennbarUtvendig = hasBrennbar && isoBkl !== "BKL3" && isoRk !== "RK6";
  const brennbarCellulose = hasBrennbar && (isoBkl === "BKL1" || isoRk === "RK4" || (isoRk === "RK6" && isoIsBolig));

  const hasFilteredIso = sandwichBsd || sandwichDsd || hasSandwich || sandwichKjole || hasBrennbar;
  const isolasjonLines: string[] = [
    "Isolasjonsmaterialer kan bidra til brannspredning og røykutvikling i et byggverk.",
    "",
    `Isolasjon må tilfredsstille klasse A2-s1,d0${hasFilteredIso ? " med mindre annet er angitt nedenfor." : "."}`,
  ];
  if (sandwichBsd) {
    isolasjonLines.push("", `Produkter (sandwichelementer) som tilfredsstiller klasse B-s1,d0 eller Eurefic-klasse A, kan benyttes i byggverk i risikoklasse 1–4 i brannklasse 1${isoIsIndustri && isoBkl === "BKL2" ? " og i industri- og lagerbygninger i brannklasse 2" : ""}.`);
  }
  if (sandwichDsd) {
    isolasjonLines.push("Produkter (sandwichelementer) som tilfredsstiller klasse D-s2,d0 eller Eurefic-klasse E, kan benyttes i industri- og lagerbygninger i brannklasse 1.");
  }
  if (hasSandwich) {
    isolasjonLines.push("Produkter (sandwichelementer) som ikke tilfredsstiller A2-s1,d0 må være beskyttet av kledning K₂10 A2-s1,d0 [K1-A] mot rømningsveier.");
  }
  if (sandwichKjole) {
    isolasjonLines.push("Produkter (sandwichelementer) for små kjøle- og fryserom i risikoklasse 4 kan ha uspesifisert ytelse.");
  }
  if (hasBrennbar) {
    isolasjonLines.push(
      "",
      "Brennbar isolasjon kan benyttes på oversiden av etasjeskiller mot oppforet tak eller loft som bare kan benyttes som lager, forutsatt at",
      "   - etasjeskilleren mot oppforet tak eller loft er branncellebegrensende bygningsdel dimensjonert for tosidig brannpåkjenning",
      "   - takkonstruksjonen over etasjeskilleren ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen",
      "",
      "Brennbar isolasjon kan benyttes i isolerte takflater forutsatt at",
      "   - isolasjonen legges på et bærende underlag som tilfredsstiller klasse A2-s1,d0 og som har dokumentert bæreevne under brann (R-klasse i samsvar med § 11–4)",
      `   - det bærende underlaget beskytter isolasjonen mot varmepåkjenning fra undersiden (for eksempel betongdekke).${isoBkl === "BKL1" || isoBkl === "BKL2" ? " I brannklasse 1 og 2 kan alternativt den brennbare isolasjonen beskyttes på undersiden av isolasjon av klasse A2-s1,d0 med tilstrekkelig tykkelse til å isolere mot varmepåkjenning." : ""}`,
      "   - den brennbare isolasjonen er beskyttet på oversiden av isolasjon med tykkelse 30 mm og som tilfredsstiller klasse A2-s1,d0. Alternativt til beskyttelse på oversiden kan den brennbare isolasjonen oppdeles i arealer på inntil 400 m².",
    );
    if (brennbarUtvendig) {
      isolasjonLines.push(
        "",
        "Brennbar isolasjon kan benyttes som utvendig tilleggsisolering av yttervegger forutsatt at",
        "   - det benyttes isolasjonssystemer som er dokumentert ved prøving etter SP Fire 105: Large scale testing of facade systems (1994) eller tilsvarende.",
        "   - fasademateriale og isolasjon må være prøvet som en enhet. Underlaget må ha branntekniske egenskaper som minst tilsvarer det som ble benyttet ved prøving.",
      );
    }
    if (brennbarCellulose) {
      isolasjonLines.push(
        "",
        `Brennbar isolasjon basert på cellulose- eller tekstilfiber og lignende kan benyttes i byggverk i brannklasse 1${isoRk === "RK4" || (isoRk === "RK6" && isoIsBolig) ? ", og boliger inntil 3 etasjer" : ""}. Isolasjonen må tilfredsstille Euroklasse E, eller være i samsvar med NT Fire 035. Isolasjonen kan være utildekket i kaldt uinnredet loft og oppforet tak.`,
      );
    }
  }
  rows.push(contentRowMultiLine("Isolasjon", isolasjonLines, "ARK"));

  if (formData.materialerKommentar) {
    rows.push(contentRow("Kommentar", formData.materialerKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_6", "3.6 Materialer og produkter"));

  // ===== 3.7 Tekniske installasjoner =====
  rows.push(sectionHeaderRow("3.7   §11-10 Tekniske installasjoner"));
  rows.push(columnHeaderRow());

  if (formData.ventilasjonRelevant) {
    const ventLines = [
      "Ventilasjonskanal som føres gjennom en brannskillende bygningsdel, må utføres slik at bygningsdelens brannmotstand blir opprettholdt.",
      "Innfesting og oppheng for kanaler og ventilasjonsutstyr må utføres slik at forutsatt funksjonstid og brannmotstand blir opprettholdt.",
      "Avtrekk fra komfyr må føres i egen kanal.",
      "Ventilasjonsanlegg må utføres i materialer som tilfredsstiller klasse A2-s1,d0.",
    ];
    if (formData.ventKrav5) ventLines.push("Avtrekkskanal fra storkjøkken og frityrkoker må ha brannmotstand minst EI 30 A2-s1,d0.");
    if (formData.ventKrav6) ventLines.push("Avtrekkskanal fra kjøkken i boenhet må ha brannmotstand minst EI 15 A2-s1,d0.");
    const isBoligVent = formData.risikoklasse === "RK4" || (formData.risikoklasse === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig"));
    if (formData.ventKrav7 && isBoligVent) ventLines.push("I småhus kan avtrekk fra komfyr føres i kanal av stål eller aluminium.");
    if (formData.ventKrav8 && isBoligVent) ventLines.push("I småhus kan kanal som tilfredsstiller klasse E benyttes.");
    if (formData.ventKrav9) {
      const erKraftstasjonVent = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
        || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
      ventLines.push(erKraftstasjonVent
        ? "Kanal som føres gjennom seksjoneringsvegg/brannvegg, må ha automatisk lukkende brannspjeld med minimum samme brannmotstand som seksjoneringsveggen. Spjeld med smeltesikring er ikke tillatt i kraftstasjoner – det skal benyttes automatiske spjeld som sikrer rask avstengning og hindrer røykspredning før temperaturen er blitt høy."
        : "Kanal som føres gjennom seksjoneringsvægg, må ha lukkeanordning (brannspjeld) med minimum samme brannmotstand som seksjoneringsvegg.");
    }
    rows.push(contentRowMultiLine("Ventilasjonsanlegg", ventLines, "RIV"));
    {
      const erKraftstasjonVentRow = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
        || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
      if (erKraftstasjonVentRow) {
        rows.push(contentRow("Ventilasjonsanlegg – kraftstasjon", "I ventilasjonsanlegget skal det ikke benyttes brannspjeld med smeltesikring. Det skal brukes automatiske spjeld som sikrer rask avstengning og hindrer røykspredning før temperaturen er blitt høy. Dersom det benyttes steng-inne-prinsipp for ventilasjonsanlegget, må det benyttes automatiske brannspjeld. Brannspjeld med smeltesikring er ikke tillatt. Jf. DSB sin veiledning om brannvern i kraftstasjoner.", "RIV"));
      }
    }
  } else if (formData.regelverk === "BF85") {
    rows.push(contentRow("Ventilasjonsanlegg", "Ventilasjonsanlegg er ikke installert.", "RIV"));
  }

  if (formData.vannAvlopRelevant) {
    rows.push(contentRowMultiLine("Vann- og avløpsrør", [
      "Rørgjennomføringer i brannskillende konstruksjoner må ha dokumentert brannmotstand.",
      "Plastrør med ytre diameter til og med 32 mm kan føres gjennom murte eller støpte konstruksjoner.",
      "Støpejernrør med ytre diameter til og med 110 mm kan føres gjennom murte eller støpte konstruksjoner.",
    ], "RIV"));
  }

  if (formData.rorIsolasjonRelevant) {
    const rorLines: string[] = [
      "Dersom den samlede eksponerte overflaten av isolasjonen på rør og kanaler utgjør mer enn 20 prosent av tilgrensende vegg- eller himlingsflate, må isolasjonen tilfredsstille klasse A2L-s1,d0 [ubrennbar eller begrenset brennbar] eller ha minst samme klasse som de tilgrensende overflatene.",
      "Dersom den samlede eksponerte overflaten av isolasjonen utgjør mindre enn 20 prosent av tilgrensende vegg- eller himlingsflate, gjelder følgende:",
      "   Isolasjon på rør og kanaler i rømningsveier må minst tilfredsstille klasse BL-s1,d0 [PI]. Unntak gjelder isolasjon på enkeltstående rør eller kanal med ytre diameter til og med 200 mm som minst må tilfredsstille klasse CL-s3,d0 [PII].",
      "   Isolasjon på rør og kanaler som er lagt i sjakt, i hulrom og bak nedforet himling med branncellebegrensende funksjon, må minst tilfredsstille klasse CL-s3,d0 [PII].",
    ];
    // Check all building parts for øvrig isolasjon requirements
    const rorParts: { label: string; rk: string; bkl: string }[] = [];
    if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length) {
      formData.bygningsdeler.forEach((d: any, i: number) => {
        if (d.risikoklasse) rorParts.push({ label: `Bygningsdel ${i + 1} (${d.navn || d.bygningstype || ''}, ${d.brannklasse || ''})`, rk: d.risikoklasse, bkl: d.brannklasse || '' });
      });
    } else {
      rorParts.push({ label: '', rk: formData.risikoklasse, bkl: formData.brannklasse });
    }
    const isMultiRor = rorParts.length > 1;
    if (!isMultiRor) {
      // Single part
      const isPII = ["RK3","RK5","RK6"].includes(rorParts[0].rk) || ["BKL2","BKL3"].includes(rorParts[0].bkl);
      rorLines.push(`   Øvrig isolasjon på rør og kanaler må minst tilfredsstille klasse ${isPII ? 'CL-s3,d0 [PII]' : 'DL-s3,d0 [PIII]'}.`);
    } else {
      // Multiple parts – list per part
      rorLines.push("   Øvrig isolasjon på rør og kanaler:");
      rorParts.forEach(p => {
        const isPII = ["RK3","RK5","RK6"].includes(p.rk) || ["BKL2","BKL3"].includes(p.bkl);
        rorLines.push(`      ${p.label}: klasse ${isPII ? 'CL-s3,d0 [PII]' : 'DL-s3,d0 [PIII]'}`);
      });
    }
    rorLines.push("");
    rorLines.push("Den flaten der rør eller kanal er innfestet, regnes som tilgrensede vegg- eller himlingsflate. For vertikale rør og kanaler er det veggflaten som skal legges til grunn.");
    rows.push(contentRowMultiLine("Rør- og kanalisolasjon", rorLines, "RIV"));
  }

  if (formData.elektriskRelevant) {
    const elektriskLines: string[] = [];
    if (formData.regelverk === "BF85") {
      elektriskLines.push("BF85 viser kun til gjeldende forskrifter for elektriske anlegg. Som vurderingsgrunnlag legges preaksepterte ytelser fra TEK17 §11-10 til grunn:");
    }
    elektriskLines.push("Kabler må ikke legges over nedforet himling eller i hulrom i rømningsvei med mindre ett av følgende punkter er oppfylt:",
      "   kablene representerer liten brannenergi, det vil si mindre enn ca. 50 MJ/løpemeter hulrom",
      "   kablene er ført i egen sjakt med sjaktvegger som har brannmotstand tilsvarende branncellebegrensende bygningsdel",
      "   himlingen har brannmotstand tilsvarende branncellebegrensende bygningsdel",
      "   hulrommet er sprinklet.",
      "Kabler som utgjør liten brannenergi, det vil si mindre enn ca. 50 MJ/løpemeter korridor eller hulrom, kan føres ubeskyttet gjennom rømningsvei. Dette er et spesifikt unntak som gjelder kabler, og kan ikke brukes som begrunnelse for andre fravik fra preaksepterte ytelser.");
    rows.push(contentRowMultiLine("Elektriske installasjoner", elektriskLines, "RIE"));
  }

  if (!formData.ventilasjonRelevant && !formData.vannAvlopRelevant && !formData.elektriskRelevant) {
    rows.push(contentRow("Generelt", formData.installasjoner || "[Installasjoner beskrives]", "RIV"));
  }

  {
    const erKraftstasjon37 = ((formData.bygningstype || "") as string).toLowerCase().includes("kraftstasjon")
      || ((formData.bygningsdeler || []) as any[]).some((d: any) => ((d.bygningstype || "") as string).toLowerCase().includes("kraftstasjon"));
    if (erKraftstasjon37) {
      rows.push(contentRow(
        "Rom for høyspenningsanlegg",
        "Foran spenningsførende deler i apparatanlegg skal det anbringes dør, plate eller lignende beskyttelse, (jf. FEA-F § 39).",
        "RIE"
      ));
      rows.push(contentRowMultiLine("Kabler (kulverter, sjakter og kabeltunneler) – kraftstasjon", [
        "Kabler skal være forlagt slik at de er beskyttet mot skade fra brann, trykkpåkjenninger mv.",
        "",
        "Kabler for nødkraftanlegg, styringsanlegg og samband mellom stasjonsinngang og redningsrom skal være forlagt adskilt fra hverandre og adskilt fra andre kabler. Med adskilt menes et lysbuebeskyttende mekanisk skille. Likeverdig med dette godtas \"brannsikker\" kabel (jf. FEA-F §26).",
        "",
        "Nedenfor er listet eksempler på sannsynlighet og/eller konsekvensreduserende tiltak:",
        "• Ulike kabeltyper bør skilles på forskjellige kabelstiger for å unngå at brann i en kraftkabel skader andre kabler",
        "• Kabelforlegning i kabelkanaler/kabeltunneler som brukes som rømningsveier og/eller friskluftinntak bør seksjoneres",
        "",
        "Unngå å legge viktige kabler nærmest taket da temperaturen ved brann normalt blir høyest der. Hovedregelen ved plassering av ulike kabeltyper på forskjellige kabelstiger over hverandre er at man legger kraftkabler på øverste stige og styre-/kontrollkabler på nederste stige. I kabelkulverter/-kanaler og andre større forlegninger med mange kabelstiger over hverandre, bør man sørge for at man har en avstand på minst 300 mm mellom stigene.",
        "• Det legges bare ett lag kraftkabler på hyller og kabelbroer. Mellom kraftkablene bør det dessuten være en avstand på ca. halvparten av kabelens diameter",
        "• Horisontale avskjerminger med en plate av samme bredde som kabelstigen og plassert like under",
        "• Store og høye vertikale forlegninger bør seksjoneres. I tillegg må det fokuseres mot god festing",
        "• Kabelstiger bør kuttes på begge sider av gjennomføringer for å unngå varmegjennomgang og bevegelse gjennom brannskillet",
        "• Kabler bør føres utenom brannfarlige områder",
        "• Lange kabelkulverter bør deles opp ved hjelp av brannsikre vegger og brannklassifiserte gjennomføringer. Dersom ventilasjon av rom eller forhold gjør det nødvendig, kan branndører settes i åpen stilling på holdemagnet tilkoblet brannalarmanlegg",
        "• Kablers brannmotstand kan økes ved å påføre kabler brannhemmende maling",
      ], "RIE"));
    }
  }

  if (formData.installasjonerKommentar) {
    rows.push(contentRow("Kommentar", formData.installasjonerKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_7", "3.7 Tekniske installasjoner"));

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
  rows.push(...await tilstandRow(formData, "3_8", "3.8 Rømning og redning"));
  {
    const erKraftstasjon38 = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
      || (Array.isArray(formData.bygningsdeler) && formData.bygningsdeler.some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon")));
    if (erKraftstasjon38) {
      rows.push(contentRow(
        "Arrangement og besøk – kraftstasjon",
        "Ved større besøk fra grupper, skoleelever, konserter eller lignende arrangement i fjellhall/kraftstasjon skal godkjenning fra lokalt brannvesen foreligge før arrangementet avholdes.",
        "Tiltakshaver/Driftsansvarlig"
      ));
    }
  }

  // ===== 3.9 Tilrettelegging for rømning og redning =====
  rows.push(sectionHeaderRow(formData.regelverk === "BF85" ? "3.9   Tiltak for å påvirke rømnings- og redningstider" : "3.9   §11-12 Tilrettelegging for rømning og redning"));
  rows.push(columnHeaderRow());

  // Tilstandsvurdering: faktisk installerte anlegg (kompenserende tiltak)
  if (formData.documentType === "tilstandsvurdering") {
    if (formData.tilstand_39_brannalarm_installert) {
      rows.push(contentRow("Brannalarmanlegg (installert)", "Bygget har installert brannalarmanlegg. Anlegget kan benyttes som kompenserende tiltak for andre avvik fra regelverket der forholdene tilsier det.", "RIE"));
    }
    if (formData.tilstand_39_slokkeanlegg_installert) {
      rows.push(contentRow("Automatisk slokkeanlegg (installert)", "Bygget har installert automatisk slokkeanlegg (sprinkler). Anlegget kan benyttes som kompenserende tiltak for andre avvik fra regelverket der forholdene tilsier det.", "RIV"));
    }
    if (formData.tilstand_39_roykventilasjon_installert) {
      rows.push(contentRow("Røykventilasjon (installert)", "Bygget har installert røykventilasjon. Anlegget kan benyttes som kompenserende tiltak for andre avvik fra regelverket der forholdene tilsier det.", "RIV"));
    }
  }

  // BF85-spesifikke rader for 3.9
  if (formData.regelverk === "BF85") {
    if (formData.bf85_16_brannalarmanlegg) {
      rows.push(contentRow(":16 Brannalarmanlegg", "Bygningsrådet kan kreve Brannalarmanlegg.", "RIE"));
    }
    if (formData.bf85_sprinkler_installert) {
      rows.push(contentRow("Sprinkleranlegg", "Det er installert sprinkleranlegg i bygget. Sprinkleranlegget kan benyttes som kompenserende tiltak for å fravike andre krav i BF85 der forholdene tilsier det.", "RIV"));
    }
    if (formData.bf85_39_kontor_brannalarm) {
      rows.push(contentRow("Brannalarm – kontor (risikobasert)", "Det er ikke generelt krav til brannalarmanlegg etter BF85. For kontorbygg der brannalarm kreves ut fra risikovurdering, skal alarmen varsle alle personer i bygget.", "RIE"));
    }
    if (formData.bf85_39_industri_slokkeanlegg) {
      const erIndustri = (formData.bygningstype || "").toLowerCase().includes("industri")
        || (Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("industri"));
      const flerePlanOver800 = !!formData.branncellerFlerePlanRelevant && formData.branncellerFlerePlanAreal === "over800";
      const tekst = erIndustri && flerePlanOver800
        ? "Industribygg som er åpne over flere plan med samlet areal > 800 m² skal ha automatisk slokkeanlegg. Bekreftet i kap. 3.5: branncelle over flere plan har samlet areal > 800 m²."
        : flerePlanOver800
          ? "Branncelle over flere plan har samlet areal > 800 m² (jf. kap. 3.5) – det kreves automatisk slokkeanlegg."
          : "Industribygg som er åpne over flere plan med samlet areal > 800 m² skal ha automatisk slokkeanlegg.";
      rows.push(contentRow("Automatisk slokkeanlegg", tekst, "RIV"));
    }
  }

  // Sprinklet/usprinklet areal ved flere bygningsdeler
  if ((formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && formData.harFlereRisikoklasser) {
    const bygningsdeler39s = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
    const alleParts: { label: string; rk: string; etasjer: number }[] = [];
    if (formData.risikoklasse) alleParts.push({ label: `Bygningsdel 1 (${formData.bygningstype || ''}, ${formData.risikoklasse})`, rk: formData.risikoklasse, etasjer: parseInt(formData.etasjer) || 1 });
    bygningsdeler39s.forEach((d: any, i: number) => {
      if (d.risikoklasse) alleParts.push({ label: `Bygningsdel ${i + 2} (${d.navn || d.bygningstype || ''}, ${d.risikoklasse})`, rk: d.risikoklasse, etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer) || 1 });
    });
    const delerMedKrav = alleParts.filter(p => p.rk === "RK6" || (p.rk === "RK4" && p.etasjer > 3));
    const delerUtenKrav = alleParts.filter(p => !(p.rk === "RK6" || (p.rk === "RK4" && p.etasjer > 3)));
    if (delerMedKrav.length > 0 && delerUtenKrav.length > 0) {
      const tekst = formData.skilleSpinkletUsprinklet
        ? "Sprinklet og usprinklet areal skilles med brannseksjonering. Kun bygningsdeler med krav om automatisk slokkeanlegg sprinkles."
        : "Hele byggverket sprinkles da det ikke skilles mellom sprinklet og usprinklet areal med brannseksjonering (jf. VTEK § 11-12).";
      rows.push(contentRow("Sprinklet/usprinklet areal", tekst, "RIBr"));
    }
  }

  if (formData.tilretteleggingLedd1a) {
    const rk4Tekst = formData.harFlereRisikoklasser && !formData.skilleSpinkletUsprinklet
      ? "Hele byggverket skal ha automatisk brannslokkeanlegg da det ikke skilles mellom sprinklet og usprinklet areal med brannseksjonering.\n\n1. Forskriftens krav til automatisk brannslokkeanlegg i byggverk i risikoklasse 4 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019.\n2. Dersom ulike deler av et byggverk ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg."
      : "Byggverk eller del av byggverk i risikoklasse 4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg. Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner.\n\n1. Forskriftens krav til automatisk brannslokkeanlegg i byggverk i risikoklasse 4 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019.\n2. Dersom ulike deler av et byggverk ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.";
    rows.push(contentRow("Automatisk brannslokkeanlegg (RK4)", rk4Tekst, "RIV"));
  }

  if (formData.tilretteleggingLedd1b) {
    rows.push(contentRow("Automatisk brannslokkeanlegg (RK6)", "Byggverk i risikoklasse 6 skal ha automatisk brannslokkeanlegg.\n\n1. Forskriftens krav til automatisk slokkeanlegg i byggverk i risikoklasse 6 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 12845:2015+A1:2019.\n2. Dersom byggverket også har virksomhet i andre risikoklasser, må deler av byggverket med og uten automatisk sprinkleranlegg være ulike brannseksjoner.\n3. Dersom virksomhet i ulike risikoklasser ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.", "RIV"));
  }

  if (formData.tilretteleggingLedd1c && (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b)) {
    let altTekst = "Der det er krav om automatisk brannslokkeanlegg, kan det likevel benyttes andre tiltak som gir tilsvarende sikkerhet ved å hindre, begrense eller kontrollere en brann lokalt der den oppstår.";
    if (formData.tilretteleggingLedd1cBeskrivelse) {
      altTekst += `\n\nValgt tiltak: ${formData.tilretteleggingLedd1cBeskrivelse}`;
    }
    rows.push(contentRow("Alternativt tiltak for slokkeanlegg", altTekst, "RIBr"));
  }

  if (formData.tilretteleggingLedd2a || formData.alarmValg === "brannalarm") {
    // Beregn kategori per bygningsdel
    const bygningsdeler39 = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
    const allParts39: { label: string; rk: string; etasjer: number }[] = [];
    if (formData.harFlereRisikoklasser && bygningsdeler39.length > 0) {
      bygningsdeler39.forEach((d: any, i: number) => {
        if (d.risikoklasse) allParts39.push({
          label: `Bygningsdel ${i + 1} (${d.navn || d.bygningstype || ''}, ${d.risikoklasse})`,
          rk: d.risikoklasse,
          etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer) || 1
        });
      });
    }
    if (allParts39.length === 0) {
      allParts39.push({ label: '', rk: formData.risikoklasse, etasjer: parseInt(formData.etasjer) || 1 });
    }
    const beregnKat39 = (p: typeof allParts39[0]) => {
      if (p.rk === "RK5" || p.rk === "RK6") return 2;
      if ((p.rk === "RK2" || p.rk === "RK3" || p.rk === "RK4") && p.etasjer >= 2) return 2;
      return 1;
    };
    const brannalarmkat = Math.max(...allParts39.map(beregnKat39));
    const isMulti39 = allParts39.length > 1;
    const harUlikeKat39 = isMulti39 && new Set(allParts39.map(beregnKat39)).size > 1;

    let alarmText = "Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.\n\nBrannalarmanlegg må prosjekteres og utføres i samsvar med NS 3960:2019 og NS-EN 54-serien.\n\n";
    if (isMulti39 && harUlikeKat39) {
      allParts39.forEach(p => {
        alarmText += `• ${p.label}: Brannalarmkategori ${beregnKat39(p)} – ${beregnKat39(p) === 1 ? "Optiske røykdetektorer i rømningsveier og fellesarealer." : "Heldekkende brannalarmanlegg med optiske røykdetektorer i alle områder."}\n`;
      });
      alarmText += `\nStrengeste krav: Brannalarmkategori ${brannalarmkat}`;
    } else {
      alarmText += `Brannalarmkategori: ${brannalarmkat}\n${brannalarmkat === 1 ? "Brannalarmkategori 1: Optiske røykdetektorer i rømningsveier og fellesarealer." : "Brannalarmkategori 2: Heldekkende brannalarmanlegg med optiske røykdetektorer i alle områder."}`;
    }
    rows.push(contentRow("Brannalarmanlegg", alarmText, "RIE"));
  }
  if (formData.tilretteleggingLedd3) {
    rows.push(contentRow(
      "Ledesystem",
      "Store byggverk, byggverk beregnet for et stort antall personer og byggverk i risikoklasse 5 og 6 skal ha ledesystem.",
      "RIE"
    ));
  }
  {
    const erKraftstasjon39 = ((formData.bygningstype || "") as string).toLowerCase().includes("kraftstasjon")
      || ((formData.bygningsdeler || []) as any[]).some((d: any) => ((d.bygningstype || "") as string).toLowerCase().includes("kraftstasjon"));
    if (erKraftstasjon39) {
      // Brannalarmanlegg – kun for tilstandsvurdering etter BF85
      if (formData.documentType === "tilstandsvurdering" && formData.regelverk === "BF85") {
        rows.push(contentRowMultiLine("Brannalarmanlegg – kraftstasjon", [
          "Det skal være brannalarmanlegg i alle kraftforsyningsanlegg i fjell og under dagen (jf. FOBTOT § 2.1 jf. FEA-F § 25.3). Automatisk brannalarm skal installeres i alle rom i den delen av bygget hvor driftssentralen med tilbehør er installert. Denne skal også varsle eventuell hjemmevakt (jf. Beredskapsforskriften § 6.4, pkt. e).",
          "",
          "Vedlikehold og periodisk tilstandskontroll av brannalarmanlegg skal utføres av kvalifisert personell (kan ivaretas av egne ansatte som er kvalifisert for dette, for eksempel ved FG-godkjenning eller lignende).",
          "",
          "Konsekvensreduserende tiltak kan være:",
          "• Å montere brannalarmanlegg som varsler både personell som kan befinne seg i stasjonen og vaktpersonell på driftssentralen, samt eventuelt direkte til brannvesen.",
          "• Å koble brannalarmanlegget mot røyk- og brannspjeld samt dører/luker slik at spredning av røyk og brann unngås (se Ventilasjonsanlegg, kap. 3.7).",
        ], "RIE"));
      }
      const lines: string[] = [];
      if (formData.kraftstasjonUnderFjell) {
        lines.push("Stasjoner i fjell og under dagen skal ha nødlysanlegg, (jf. FEA-F § 26).");
      }
      lines.push("Kraftstasjoner og andre større stasjoner med høyspenningsanlegg skal være forsynt med nødbelysning som forsynes fra en kilde som er uavhengig av høyspenningsanlegget (nødstrøm), (jf. FEA-F § 25).");
      lines.push("Nødbelysning basert på kraftforsyning fra sentral batteribank eller aggregat er ikke tilfredsstillende alene. Det anbefales derfor i tillegg å montere nødbelysning bestående av håndlykter med batterier under kontinuerlig ladning, opphengt på sentrale steder. Disse vil også være praktiske ved innsats i anlegget.");
      rows.push(contentRowMultiLine("Nødbelysning – kraftstasjon", lines, "RIE"));

      const rrLines: string[] = [];
      if (formData.kraftstasjonUnderFjell) {
        rrLines.push("I kraft-, transformator- og omformerstasjoner i fjell og under dagen hvor det ikke er anordnet minst to uavhengige rømningsveier, skal det være innredet redningsrom. I store kraftstasjoner og/eller når forholdene ligger til rette for det, bør det innredes ett eller flere redningsrom (jf. FEA-F § 26).");
        rrLines.push("");
        rrLines.push("Redningsrommet må være et reelt alternativ til hovedrømningsvei, det forutsettes derfor at selskapet nøye vurderer plassering og utforming.");
        rrLines.push("");
      }
      rrLines.push("Plassering");
      rrLines.push("Redningsrommene gis en hensiktsmessig og sikker plassering i forhold til mulige skadesteder, og fortrinnsvis slik at det er tilfredsstillende adkomst med skadet personell på båre.");
      rrLines.push("");
      rrLines.push("Plassering i forhold til transformatorer og koblingsanlegg bør veie tungt i vurderingen ved valg av plassering av redningsrom.");
      rrLines.push("");
      rrLines.push("Utforming");
      rrLines.push("Redningsrom skal være røyktett og egen branncelle, og utformet slik at det er intakt etter en eksplosjon (jf. FEA-F § 26).");
      rrLines.push("");
      rrLines.push("For å minimere personellets eksponering for røyk og gasser, anbefales det å alltid ha døren til redningsrommet lukket, eventuelt med selvlukkende dør koblet til brannalarmanlegget.");
      rrLines.push("");
      rrLines.push("Utstyr");
      rrLines.push("Redningsrommene (jf. FEA-F § 26) skal være utstyrt med:");
      rrLines.push("• Luftbeholdning som dekker minst 4 timers forbruk for det antall personer som rommet er dimensjonert for. Det skal tas hensyn til lokale forhold som lengde på adkomsttunnel, rommets plassering i stasjonen, forventet tid før hjelp når frem mv.");
      rrLines.push("• Førstehjelpsutstyr og båre.");
      rrLines.push("• Samband til utenforliggende bemannet vaktsted (f.eks. driftssentral) og til inngangen/portalbygg. Sambandsmidlene skal være uavhengig av stasjonsstrømforsyningen og må være beskyttet mot skade fra brann, overspenning mv.");
      rows.push(contentRowMultiLine("Redningsrom – kraftstasjon", rrLines, "RIE"));

      const trLines: string[] = [];
      trLines.push("Rom med oljefylte transformatorer, slokkespoler og lignende skal være utført med terskel, steinfilter, oljekum eller lignende, slik at oljen ikke kan renne ut av rommet. Rom med mineraloljefylte transformatorer med samlet ytelse over 1600 kVA, skal ha effektivt automatisk brannslokkingsanlegg eller oljegrube eller annen utførelse med samme brannslokkende effekt.");
      trLines.push("");
      trLines.push("Oljegrube utføres med steinfilter med tykkelse min. 400 millimeter. Det bør nyttes renvasket stein med størrelse 60–90 millimeter, fortrinnsvis elvestein. Oljekum og eventuell tilleggstank skal romme hele oljemengden og eventuell slokkevæske. Dette innebærer at det må være kontroll over hvor mye slokkevæske som kan bli benyttet, særlig i automatiske slokkeanlegg. Det anbefales å tilrettelegge for tømming av oljegrube fra sikkert område, for eksempel rør (OBS! ikke plastrør) som føres ut av anlegget til tank/sluk for oppsug til tankbiler. I anlegg i fjell/under dagen kan en mulig løsning være å plassere oppsamlingstank lavt i anlegget, for eksempel i turbinkjelleren. Der hvor flere transformatorer har felles oljegrube, er det tilstrekkelig at volumet dekker den største transformatoren, dersom en brann ikke kan spre seg mellom transformatorene (jf. FEA-F § 25).");
      trLines.push("");
      trLines.push("For å unngå at olje sprer seg utenfor transformatorcellen i tilfeller hvor transformatorkassen sprenges, bør transformatorcellen ha så høy terskel eller andre avgrensninger at rommet over steinfilteret kan oppta minst halvparten av transformatorens oljemengde. Dette er særlig viktig hvor en utblåsing kan skje i retning mot utganger, nødutganger eller steder hvor personer oppholder seg.");
      trLines.push("");
      trLines.push("Dører inn til transformatorcellene og mellom cellene skal minimum være selvlukkende branndører. Der transformatorcellen er adskilt fra resten av anlegget med store porter, bør det monteres dør i porten.");
      rows.push(contentRowMultiLine("Transformatorrom – kraftstasjon", trLines, "RIE"));
    }
  }
  if (formData.tilretteleggingKommentar) {
    rows.push(contentRow("Kommentar", formData.tilretteleggingKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_9", formData.regelverk === "BF85" ? "3.9 Tiltak for å påvirke rømnings- og redningstider" : "3.9 Tilrettelegging for rømning"));

  // ===== 3.10 Utgang fra branncelle / BF85 §7 Rømningsveg =====
  const isBF85Tilstand310 = formData.documentType === "tilstandsvurdering" && formData.regelverk === "BF85";
  if (isBF85Tilstand310) {
    rows.push(sectionHeaderRow("3.10   Rømningsveg (BF85 §7)"));
    rows.push(columnHeaderRow());
    const bf85RomningPunkter: { title: string; field: string; text: string }[] = [
      { title: "§:71 Generelt", field: "bf85_romning_71_generelt", text: "Rømningsveg skal på en oversiktlig måte føre til det fri uten lommer, retningsforandringer e.l. som kan hindre personer fra å komme ut under brann. Rømningsveg skal være egen branncelle. Heis og rulletrapp skal ikke regnes som rømningsveg. Rullebånd for personbefordring kan inngå i rømningsveg dersom det beveger seg i rømningsretningen eller stoppes automatisk ved brannalarm." },
      { title: "§:72 Antall rømningsveger", field: "bf85_romning_72_antall", text: "Antall rømningsveger er avhengig av bygningens bruk, antall etasjer og antall mennesker." },
      { title: "§:73 Bredde i rømningsveg", field: "bf85_romning_73_bredde", text: "Fri bredde i rømningsveg skal minst være 10 mm pr. person og ikke mindre enn 900 mm." },
      { title: "§:74 Golvbelegg", field: "bf85_romning_74_golvbelegg", text: "Golvbelegg skal være klasse G." },
      { title: "§:75 Dør i rømningsveg", field: "bf85_romning_75_dor", text: "Dør i rømningsveg i bygning skal slå ut i rømningsretningen. Dette krav gjelder ikke dør til boenhet. Dør skal utføres som angitt i Tabell 30:75. Kravene gjelder ikke for utgangsdør til det fri." },
    ];
    for (const p of bf85RomningPunkter) {
      const vurdering = ((formData as any)[p.field] || "").toString().trim();
      const body = vurdering ? `${p.text}\n\nVurdering: ${vurdering}` : p.text;
      rows.push(contentRow(p.title, body, "RIBr"));
    }
    rows.push(...await tilstandRow(formData, "3_10", "3.10 Rømningsveg (BF85 §7)"));
  } else {
  rows.push(sectionHeaderRow("3.10   §11-13 Utgang fra branncelle"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Fra en branncelle skal det minst være én utgang til sikkert sted, eller utganger til to uavhengige rømningsveier.",
    "-"
  ));
  if (formData.sporadiskOpphold) {
    rows.push(contentRowMultiLine("Branncelle for sporadisk personopphold", [
      "Fra brannceller som bare er beregnet for sporadisk personopphold kan utgang gå gjennom annen branncelle.",
      "",
      "Med branncelle som bare er beregnet for sporadisk opphold, menes branncelle der personer oppholder seg av og til i kortere tid. Dette kan for eksempel være lagerrom og tekniske rom uten faste arbeidsplasser.",
      "",
      "Maksimal avstand fra et hvilket som helst sted i denne branncellen til sikkert sted eller til nærmeste rømningsvei, må være som angitt i tabell 1.",
      "",
      "For å ivareta generelle krav om tilrettelegging for rask og sikker rømning, jf. § 11-11, må fluktveien være oversiktlig og ha god belysning og merking. Det må heller ikke foregå brannfarlig aktivitet i nabobranncellen det skal rømmes gjennom.",
    ], "ARK"));
  }
  // Trapperom - § 11-13 (2) - automatisk basert på RK og etasjer (synkronisert med 3.5)
  {
    const trapperomTypeMap310: Record<number, { lav: string; hoy: string }> = {
      1: { lav: "Tr 1", hoy: "Tr 3" }, 2: { lav: "Tr 1", hoy: "Tr 3" },
      3: { lav: "Tr 2", hoy: "Tr 3" }, 4: { lav: "Tr 1", hoy: "Tr 3" },
      5: { lav: "Tr 2", hoy: "Tr 3" }, 6: { lav: "Tr 2", hoy: "Tr 3" },
    };
    const getTrType310 = (rk: number, etasjer: number) => {
      if (!trapperomTypeMap310[rk]) return "Tr 1";
      return etasjer <= 8 ? trapperomTypeMap310[rk].lav : trapperomTypeMap310[rk].hoy;
    };
    const trRank: Record<string, number> = { "Tr 3": 3, "Tr 2": 2, "Tr 1": 1 };

    const trapperomDeler310: { index: number; navn: string; rk: number; etasjer: number; trType: string }[] = [];
    const rkPri = parseInt((formData.risikoklasse || "").replace(/\D/g, ''), 10);
    const flPri = parseInt(formData.etasjer || "0", 10);
    if (rkPri && flPri >= 1) trapperomDeler310.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', rk: rkPri, etasjer: flPri, trType: getTrType310(rkPri, flPri) });
    if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
      formData.bygningsdeler.forEach((del: any, i: number) => {
        const rkDel = parseInt((del.risikoklasse || "").replace(/\D/g, ''), 10);
        const flDel = parseInt(del.etasjer || formData.etasjer || "0", 10);
        if (rkDel && flDel >= 1) trapperomDeler310.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, rk: rkDel, etasjer: flDel, trType: getTrType310(rkDel, flDel) });
      });
    }

    if (trapperomDeler310.length > 0) {
      const showMultiple = trapperomDeler310.length > 1;
      const uniqueTrTypes = [...new Set(trapperomDeler310.map(d => d.trType))];
      const harUlikeTrKrav = uniqueTrTypes.length > 1;
      const strengesteTr = trapperomDeler310.reduce((prev, curr) => (trRank[curr.trType] || 0) > (trRank[prev] || 0) ? curr.trType : prev, "Tr 1");
      const brukStrengeste = showMultiple && harUlikeTrKrav && formData.trapperomGarGjennomAlleDeler;

      const lines: string[] = [];
      if (brukStrengeste) {
        lines.push(`Trapperommene går gjennom flere bygningsdeler med ulike krav. Strengeste krav gjelder: ${strengesteTr}.`);
        if (trapperomDeler310.some(d => d.rk === 4)) {
          if (formData.rk4TrapperomTekst) {
            lines.push(formData.rk4TrapperomTekst);
          } else if (formData.brannvesenTilgangRK4 !== false) {
            lines.push(`Det er tilstrekkelig med ett trapperom da brannvesenet har tilkomst til hver boenhet med høydemateriell.`);
          } else {
            lines.push(`Brannvesenet har ikke tilkomst til alle boenheter med høydemateriell. Byggverket må derfor ha minst to trapperom med separat atkomst fra alle tilknyttede brannceller.`);
          }
        }
        if (formData.tilstrekkeligeUtgangerUtenToTrapperom && !trapperomDeler310.every(d => d.rk === 4)) {
          lines.push(`Det er bekreftet at utgangene er tilstrekkelige uten krav om to trapperom.`);
        } else if (!trapperomDeler310.every(d => d.rk === 4)) {
          lines.push(`Byggverk må ha minst to trapperom av type ${strengesteTr}.`);
        }
      } else {
        trapperomDeler310.forEach(del => {
          const prefix = showMultiple ? `Bygningsdel ${del.index} (${del.navn}): ` : "";
          if (del.rk === 4) {
            if (formData.rk4TrapperomTekst) {
              lines.push(formData.rk4TrapperomTekst);
            } else if (formData.brannvesenTilgangRK4 !== false) {
              lines.push(`${prefix}For risikoklasse ${del.rk} med ${del.etasjer} etasjer kreves ${del.trType}. Det er tilstrekkelig med ett trapperom da brannvesenet har tilkomst til hver boenhet med høydemateriell.`);
            } else {
              lines.push(`${prefix}For risikoklasse ${del.rk} med ${del.etasjer} etasjer kreves ${del.trType}. Brannvesenet har ikke tilkomst til alle boenheter med høydemateriell. Byggverket må derfor ha minst to trapperom med separat atkomst fra alle tilknyttede brannceller.`);
            }
          } else if (formData.tilstrekkeligeUtgangerUtenToTrapperom) {
            lines.push(`${prefix}For risikoklasse ${del.rk} med ${del.etasjer} etasjer kreves ${del.trType}. Det er bekreftet at utgangene er tilstrekkelige uten krav om to trapperom.`);
          } else {
            lines.push(`${prefix}Byggverk må ha minst to trapperom. For risikoklasse ${del.rk} med ${del.etasjer} etasjer kreves ${del.trType}.`);
          }
        });
      }
      rows.push(contentRowMultiLine("Trapperom – § 11-13 (2)", lines, "ARK"));
    }
  }
  {
    const alleRK: string[] = formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0
      ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))] as string[]
      : formData.risikoklasse ? [formData.risikoklasse] : [];
    const harRK5 = alleRK.includes("RK5");
    const harRK6 = alleRK.includes("RK6");
    const bk = formData.brannklasse || "";
    const erBKL1 = bk === "BKL1";
    const erBKL2ellerBKL3 = bk === "BKL2" || bk === "BKL3";

    const lines: string[] = [
      "• Åpningskraft for dører til rømningsvei må være maksimalt 67 Newton dersom det ikke følger andre krav av § 12-13.",
    ];
    if (harRK5 && alleRK.some(rk => rk !== "RK5")) {
      lines.push("• Dør til rømningsvei i byggverk i risikoklasse 1, 2, 3, 4 og 6 må ha fri bredde minimum 0,86 meter. Unntak gjelder for fritidsbolig med én boenhet.");
      lines.push("• Dør til rømningsvei i byggverk i risikoklasse 5 må ha fri bredde minimum 1,16 meter.");
    } else if (harRK5) {
      lines.push("• Dør til rømningsvei i byggverk i risikoklasse 5 må ha fri bredde minimum 1,16 meter.");
    } else {
      lines.push("• Dør til rømningsvei i byggverk i risikoklasse 1, 2, 3, 4 og 6 må ha fri bredde minimum 0,86 meter. Unntak gjelder for fritidsbolig med én boenhet.");
    }
    if (harRK6) {
      lines.push("• I byggverk hvor det er nødvendig med transport i seng, må dørbredden tilpasses dette.");
    }
    lines.push(
      "• Samlet fri bredde på dører fra branncelle til rømningsvei bestemmes ut fra det antall personer som branncellen er beregnet for, jf. femte ledd.",
      "• Dør til rømningsvei må ha fri høyde på minimum 2,0 meter. Unntak gjelder for fritidsbolig med én boenhet.",
      "• Dør til rømningsvei må lett kunne åpnes slik at den er enkel å bruke for alle personer.",
      "• Selvlukkende dør, benevnt C [S], kan settes i åpen stilling ved hjelp av elektromagnetiske holdere som utløses og lukker døren ved brannalarm. Døren må kunne åpnes igjen med dørautomatikk eller manuelt med åpningskraft i samsvar med § 12-13.",
    );
    if (formData.dorerTilbakerømning) {
      lines.push("• Dør til rømningsvei må ha et låsesystem som gjør det mulig å vende tilbake dersom rømningsveien skulle være blokkert, med mindre andre tiltak gir tilsvarende sikkerhet.");
    }
    lines.push(
      "• Dør til rømningsvei kan være låst når byggverket har brannalarmanlegg og låsesystemet åpnes automatisk ved alarm. I tillegg må det være tydelig merket knapp for manuell åpning av døren. Det kan aksepteres inntil 10 sekunder tidsforsinkelse på den manuelle åpningsmekanismen.",
    );
    if (formData.dorerNattlaser) {
      lines.push("• Nattlåser må utføres slik at de ikke kommer i strid med kravene til sikker rømning.");
    }
    const erKraftstasjonDor = ((formData.bygningstype || "") as string).toLowerCase().includes("kraftstasjon")
      || ((formData.bygningsdeler || []) as any[]).some((d: any) => ((d.bygningstype || "") as string).toLowerCase().includes("kraftstasjon"));
    if (erKraftstasjonDor) {
      lines.push("• For kraftstasjon: alle dører til og i rømningsvei skal slå ut i rømningsretning.");
    } else if (formData.dorerLiteAntallPersoner) {
      lines.push("• Dør til rømningsvei fra branncelle beregnet for et lite antall personer kan slå mot rømningsretning. Med et lite antall personer menes inntil 10. Brannceller med et lite antall personer kan for eksempel være boenhet, sykerom, hotellrom, og mindre kontorlokaler og salgslokaler.");
    }
    lines.push(
      "• Utadslående dør i yttervegg som er utgang eller rømningsvei, må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.",
      "• Utadslående dør i yttervegg som er utgang eller rømningsvei, må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.",
    );
    if (erBKL1) {
      lines.push("• Avbruddsfri strømforsyning må fungere i minst 30 minutter i byggverk i brannklasse 1.");
    } else if (erBKL2ellerBKL3) {
      lines.push("• Avbruddsfri strømforsyning må fungere i minst 60 minutter i byggverk i brannklasse 2 og 3.");
    }
    rows.push(contentRowMultiLine("Dører til rømningsvei", lines, "ARK / RIE"));
  }
  {
    const erKraftstasjon310 = ((formData.bygningstype || "") as string).toLowerCase().includes("kraftstasjon")
      || ((formData.bygningsdeler || []) as any[]).some((d: any) => ((d.bygningstype || "") as string).toLowerCase().includes("kraftstasjon"));
    if (erKraftstasjon310) {
      rows.push(contentRowMultiLine(
        "Kraftstasjon – utganger fra rom med høyspentanlegg",
        [
          "Inneholder rommet både mineraloljefylte apparater og betjeningsorganer for høyspenning, kreves det utgangsmulighet som beskrevet ovenfor fra begge ender av rommet (vanligvis endene av betjeningsgangen).",
          "Det kreves bare én utgang hvis avstanden fra ethvert av betjeningsorganene til utgangen har en samlet lengde på maks 4 m. I den samlede lengde skal kun medregnes de deler av gangen hvor den frie gangbredden ut for felt med mineraloljefylte apparater er mindre enn 2 m.",
        ],
        "ARK / RIE"
      ));
    }
  }
  if (formData.utgangBranncelle) {
    rows.push(contentRow("Utganger", formData.utgangBranncelle, "ARK"));
  }
  if (formData.utgangBranncelleKommentar) {
    rows.push(contentRow("Kommentar", formData.utgangBranncelleKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_10", "3.10 Utgang fra branncelle"));
  }

  // ===== 3.11 Rømningsvei (skjules for BF85-tilstand) =====
  if (!isBF85Tilstand310) {
  rows.push(sectionHeaderRow("3.11   §11-14 Rømningsvei"));
  rows.push(columnHeaderRow());
  rows.push(contentRow(
    "Generelt",
    "Rømningsvei skal på en oversiktlig og lettfattelig måte føre til et sikkert sted. Den skal ha tilstrekkelig bredde og høyde og være utført som egen branncelle tilrettelagt for rask og effektiv rømning.",
    "-"
  ));
  {
    const erKraftstasjonRV = ((formData.bygningstype || "") as string).toLowerCase().includes("kraftstasjon")
      || ((formData.bygningsdeler || []) as any[]).some((d: any) => ((d.bygningstype || "") as string).toLowerCase().includes("kraftstasjon"));
    if (formData.romningsveiPanikkbeslag || erKraftstasjonRV) {
      rows.push(contentRow(
        "Panikkbeslag",
        erKraftstasjonRV
          ? "For kraftstasjon må dør i rømningsvei være utført for sikker rømning ved at døren kan åpnes manuelt med ett grep og uten bruk av nøkkel (panikkbeslag iht. NS-EN 1125). For rom med høyspentanlegg skal beslaget være utformet slik at det kan betjenes med kne, albue eller annen kroppsdel, slik at dør kan åpnes uten bruk av hender. Beslaget skal også kunne benyttes av personer som åler eller kryper, og må derfor være vertikalmontert slik at det kan betjenes uansett høyde."
          : "Dør i rømningsvei i byggverk i risikoklasse 5 og 6 må være utført for sikker rømning ved at døren må kunne åpnes manuelt med ett grep og uten bruk av nøkkel, jf. figur 6.",
        "ARK"
      ));
    }
  }
  if (formData.romningsvei) {
    rows.push(contentRow("Beskrivelse", formData.romningsvei, "ARK"));
  }
  if (formData.romningsveiKommentar) {
    rows.push(contentRow("Kommentar", formData.romningsveiKommentar, "-"));
  }
  rows.push(...await tilstandRow(formData, "3_11", "3.11 Rømningsvei"));
  }

  // ===== 3.13 / BF85 3.12 Manuell slokking =====
  rows.push(sectionHeaderRow(isBF85Tilstand310 ? "3.12   Tilrettelegging for manuell slokking" : "3.13   §11-16 Tilrettelegging for manuell slokking"));
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
  rows.push(...await tilstandRow(formData, "3_13", isBF85Tilstand310 ? "3.12 Manuell slokking" : "3.13 Manuell slokking"));

  // ===== 3.14 / BF85 3.13 Tilrettelegging for slokkemannskap =====
  rows.push(sectionHeaderRow(isBF85Tilstand310 ? "3.13   Tilrettelegging for slokkemannskap" : "3.14   §11-17 Tilrettelegging for slokkemannskap"));
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
  if (formData.regelverk === "BF85") {
    const ytter = getYtterveggBrannmotstandBF85(formData.bygningsbrannklasse || "");
    if (ytter) {
      rows.push(contentRow("Ikke-bærende ytterveggers brannmotstand (Tabell 30:512)", ytter.tekst, "ARK"));
    }
  }
  rows.push(...await tilstandRow(formData, "3_14", isBF85Tilstand310 ? "3.13 Slokkemannskap" : "3.14 Slokkemannskap"));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}
