import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from "docx";
import { saveAs } from "file-saver";
import { FravikEntry } from "@/components/fraviksdokumentasjon/FravikEntryForm";


const borderStyle = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
};

function makeCell(text: string, bold = false, width?: number): TableCell {
  return new TableCell({
    borders: borderStyle,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20, font: "Calibri" })] })],
  });
}

const SIGMA = 5.67e-8;

const paramLabels: Record<string, string> = {
  emissivitet: "Emissivitet (ε)",
  flammetemperatur_C: "Flammetemperatur",
  siktfaktor: "Siktfaktor (F₁₂)",
  hoyde_m: "Høyde åpning (Hv)",
  bredde_m: "Bredde åpning (Bv)",
  avstand_m: "Avstand (R)",
  branneffekt_kW: "Branneffekt (Q̇)",
  diameter_m: "Diameter (D)",
  romareal_m2: "Romareal",
  straling_kW_m2: "Mottatt stråling (q″rad)",
  Ef_kW_m2: "Emissiv kraft (Ef)",
  flammehoyde_m: "Gjennomsnittlig flammehøyde (Lf)",
  flammetipp_m: "Flammetipp (intermittent)",
  total_MJ: "Total brannenergi",
  spesifikk_MJ_m2: "Spesifikk brannenergi",
};

const paramUnits: Record<string, string> = {
  emissivitet: "[-]",
  flammetemperatur_C: "°C",
  siktfaktor: "[-]",
  hoyde_m: "m", bredde_m: "m", avstand_m: "m", diameter_m: "m",
  branneffekt_kW: "kW",
  romareal_m2: "m²",
  straling_kW_m2: "kW/m²", Ef_kW_m2: "kW/m²",
  flammehoyde_m: "m", flammetipp_m: "m",
  total_MJ: "MJ", spesifikk_MJ_m2: "MJ/m²",
};

function formatParamLabel(key: string): string {
  return paramLabels[key] || key.replace(/_/g, " ");
}

function formatParamValue(key: string, val: string | number): string {
  const unit = paramUnits[key] || "";
  return `${val}${unit ? " " + unit : ""}`;
}

interface CalcRef { type: string; inputs: Record<string, string | number>; results: Record<string, string | number> }

function getFormelBeskrivelse(calc: CalcRef): string[] {
  if (calc.type === "straling") {
    return [
      "Solid flamme-modell iht. SFPE Handbook:",
      "  Ef = ε · σ · Tf⁴",
      "  q″rad = Ef · F₁₂",
      `  der σ = 5.67 × 10⁻⁸ W/(m²·K⁴)`,
    ];
  }
  if (calc.type === "flammehoyde") {
    return [
      "Heskestads korrelasjon:",
      "  Lf = 0.235 · Q̇²/⁵ − 1.02 · D",
      "  Flammetipp ≈ 1.5 × Lf",
    ];
  }
  if (calc.type === "brannenergi") {
    return [
      "Brannenergiberegning iht. NS-EN 1991-1-2:",
      "  Q = Σ (mi · Hc,i)",
      "  q = Q / Arom",
    ];
  }
  return [];
}

function getBeregningsSteg(calc: CalcRef): string[] {
  if (calc.type === "straling") {
    const eps = Number(calc.inputs.emissivitet) || 0;
    const TfC = Number(calc.inputs.flammetemperatur_C) || 0;
    const TfK = TfC + 273.15;
    const F12 = Number(calc.inputs.siktfaktor) || 0;
    const Ef = eps * SIGMA * Math.pow(TfK, 4);
    const EfKW = Math.round((Ef / 1000) * 100) / 100;
    const q = Ef * F12;
    const qKW = Math.round((q / 1000) * 100) / 100;
    return [
      `  Tf = ${TfC} °C + 273.15 = ${TfK.toFixed(1)} K`,
      `  Ef = ${eps} × 5.67×10⁻⁸ × ${TfK.toFixed(1)}⁴ = ${EfKW} kW/m²`,
      `  q″rad = ${EfKW} × ${F12} = ${qKW} kW/m²`,
    ];
  }
  if (calc.type === "flammehoyde") {
    const Q = Number(calc.inputs.branneffekt_kW) || 0;
    const D = Number(calc.inputs.diameter_m) || 0;
    const Lf = 0.235 * Math.pow(Q, 0.4) - 1.02 * D;
    const LfRound = Math.round(Math.max(0, Lf) * 100) / 100;
    const tip = Math.round(LfRound * 1.5 * 100) / 100;
    return [
      `  Lf = 0.235 × ${Q}^0.4 − 1.02 × ${D}`,
      `  Lf = 0.235 × ${Math.pow(Q, 0.4).toFixed(2)} − ${(1.02 * D).toFixed(2)} = ${LfRound} m`,
      `  Flammetipp = 1.5 × ${LfRound} = ${tip} m`,
    ];
  }
  if (calc.type === "brannenergi") {
    try {
      const mats = JSON.parse(String(calc.inputs.materialer || "[]"));
      const lines: string[] = [];
      let sum = 0;
      mats.forEach((m: { name: string; mjPerKg: number; kg: number }) => {
        const q = m.mjPerKg * m.kg;
        sum += q;
        lines.push(`  ${m.name}: ${m.kg} kg × ${m.mjPerKg} MJ/kg = ${Math.round(q)} MJ`);
      });
      lines.push(`  Total: ${Math.round(sum)} MJ`);
      if (calc.inputs.romareal_m2) {
        const a = Number(calc.inputs.romareal_m2);
        lines.push(`  Spesifikk: ${Math.round(sum)} / ${a} = ${Math.round(sum / a)} MJ/m²`);
      }
      return lines;
    } catch { return []; }
  }
  return [];
}

async function fetchLogoData(logoUrl: string | null): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  if (!logoUrl) return null;
  try {
    const [res, dims] = await Promise.all([
      fetch(logoUrl).then(r => r.ok ? r.arrayBuffer() : null),
      new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 400;
          const ratio = img.naturalWidth / img.naturalHeight;
          const w = Math.min(img.naturalWidth, maxWidth);
          resolve({ width: w, height: Math.round(w / ratio) });
        };
        img.onerror = () => resolve({ width: 200, height: 60 });
        img.src = logoUrl;
      }),
    ]);
    if (!res) return null;
    return { buffer: res, ...dims };
  } catch { return null; }
}

export async function exportKvalitativWord(fravikEntries: FravikEntry[], dokumentNavn: string, logoUrl?: string | null) {
  const elements: (Paragraph | Table)[] = [];
  const logoData = await fetchLogoData(logoUrl || null);

  // Logo
  if (logoData) {
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new ImageRun({ data: logoData.buffer, transformation: { width: logoData.width, height: logoData.height }, type: "png" })],
    }));
  }

  // Title
  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "FRAVIKSDOKUMENTASJON", bold: true, size: 32, font: "Calibri" })],
  }));
  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "Kvalitativ analyse iht. Byggforsk 321.026 kap. 6", size: 20, font: "Calibri", color: "888888" })],
  }));

  fravikEntries.forEach((fravik, i) => {
    const n = i + 1;

    // Section header
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: `${n}. Fravik ${n}`, font: "Calibri" })] }));

    // Dokumentasjonsbehov
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.1 Funksjonskrav i TEK17`, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: fravik.funksjonskrav || "[Angis]", size: 22, font: "Calibri" })] }));

    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.2 Preakseptert ytelse`, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: fravik.preakseptertYtelse || "[Angis]", size: 22, font: "Calibri" })] }));

    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.3 Hensikt med ytelsen`, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: fravik.hensiktYtelse || "[Angis]", size: 22, font: "Calibri" })] }));

    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.4 Beskrivelse av fraviket`, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: fravik.fravikBeskrivelse || "[Angis]", size: 22, font: "Calibri" })] }));

    // Kompenserende tiltak
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.5 Kompenserende tiltak`, font: "Calibri" })] }));

    const tiltakMedBeskrivelse = fravik.tiltak.filter(t => t.beskrivelse);
    if (tiltakMedBeskrivelse.length > 0) {
      tiltakMedBeskrivelse.forEach((t, ti) => {
        elements.push(new Paragraph({
          spacing: { before: 100 },
          children: [new TextRun({ text: `Tiltak ${ti + 1}: ${t.beskrivelse}`, bold: true, size: 22, font: "Calibri" })],
        }));

        const rows: TableRow[] = [];
        const fields = [
          { key: "funksjonalitet", label: "Funksjonalitet" },
          { key: "palitelighet", label: "Pålitelighet" },
          { key: "robusthet", label: "Robusthet og fleksibilitet" },
          { key: "vedlikehold", label: "Oppfølging og vedlikehold" },
          { key: "andreEffekter", label: "Andre effekter" },
        ] as const;

        fields.forEach(f => {
          const val = t[f.key];
          if (val) rows.push(new TableRow({ children: [makeCell(f.label, true, 35), makeCell(val, false, 65)] }));
        });

        if (rows.length > 0) {
          elements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
          elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
        }
      });
    } else {
      elements.push(new Paragraph({ children: [new TextRun({ text: "[Kompenserende tiltak angis]", size: 22, font: "Calibri" })] }));
    }

    // Innvirkningsområder
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.6 Innvirkningsområder`, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: (fravik as any).innvirkningBeskrivelse || "[Angis]", size: 22, font: "Calibri" })] }));

    // Beregninger
    const harBeregninger = (fravik.beregninger?.length ?? 0) > 0;
    let sectionCounter = 7;

    if (harBeregninger) {
      elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.${sectionCounter} Beregninger`, font: "Calibri" })] }));
      sectionCounter++;

      const typeLabels: Record<string, string> = {
        straling: "Strålingsberegning (Solid flamme-modell)",
        flammehoyde: "Flammehøydeberegning (Heskestads korrelasjon)",
        brannenergi: "Brannenergiberegning",
      };

      fravik.beregninger!.forEach((calc, ci) => {
        elements.push(new Paragraph({
          spacing: { before: 100 },
          children: [new TextRun({ text: `Beregning ${ci + 1}: ${typeLabels[calc.type] || calc.type}`, bold: true, size: 22, font: "Calibri" })],
        }));

        // Formula description
        const formelLines = getFormelBeskrivelse(calc);
        if (formelLines.length > 0) {
          elements.push(new Paragraph({ spacing: { before: 50 }, children: [new TextRun({ text: "Beregningsmetode:", bold: true, size: 20, font: "Calibri" })] }));
          formelLines.forEach(line => {
            elements.push(new Paragraph({ children: [new TextRun({ text: line, size: 20, font: "Calibri" })] }));
          });
        }

        // Inputs table
        const inputEntries = Object.entries(calc.inputs).filter(([k]) => k !== "materialer");
        if (inputEntries.length > 0) {
          elements.push(new Paragraph({ spacing: { before: 50 }, children: [new TextRun({ text: "Inngangsparametre:", bold: true, size: 20, font: "Calibri" })] }));
          elements.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [makeCell("Parameter", true, 50), makeCell("Verdi", true, 50)] }),
              ...inputEntries.map(([key, val]) =>
                new TableRow({ children: [makeCell(formatParamLabel(key), false, 50), makeCell(formatParamValue(key, val), false, 50)] })
              ),
            ],
          }));
        }

        // Calculation steps
        const stegLines = getBeregningsSteg(calc);
        if (stegLines.length > 0) {
          elements.push(new Paragraph({ spacing: { before: 50 }, children: [new TextRun({ text: "Beregning:", bold: true, size: 20, font: "Calibri" })] }));
          stegLines.forEach(line => {
            elements.push(new Paragraph({ children: [new TextRun({ text: line, size: 20, font: "Calibri" })] }));
          });
        }

        // Results table
        const resultEntries = Object.entries(calc.results);
        if (resultEntries.length > 0) {
          elements.push(new Paragraph({ spacing: { before: 50 }, children: [new TextRun({ text: "Resultater:", bold: true, size: 20, font: "Calibri" })] }));
          elements.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [makeCell("Resultat", true, 50), makeCell("Verdi", true, 50)] }),
              ...resultEntries.map(([key, val]) =>
                new TableRow({ children: [makeCell(formatParamLabel(key), true, 50), makeCell(formatParamValue(key, val), true, 50)] })
              ),
            ],
          }));
        }

        if (calc.kommentar) {
          elements.push(new Paragraph({ spacing: { before: 50, after: 200 }, children: [new TextRun({ text: `Kommentar: ${calc.kommentar}`, size: 20, font: "Calibri", italics: true })] }));
        } else {
          elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
        }
      });
    }

    // Kvalitativ analyse
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.${sectionCounter} Kvalitativ analyse`, font: "Calibri" })] }));
    elements.push(new Paragraph({ children: [new TextRun({ text: "Sammenligning:", bold: true, size: 22, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fravik.sammenligning || "[Angis]", size: 22, font: "Calibri" })] }));
    elements.push(new Paragraph({ children: [new TextRun({ text: "Måleparametre:", bold: true, size: 22, font: "Calibri" })] }));
    elements.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: fravik.maleparametre || "[Angis]", size: 22, font: "Calibri" })] }));
    if (fravik.visReferanser !== false) {
      elements.push(new Paragraph({ children: [new TextRun({ text: "Referanser:", bold: true, size: 22, font: "Calibri" })] }));
      elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: fravik.referanser || "[Angis]", size: 22, font: "Calibri" })] }));
    }

    // Konklusjon
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${n}.${sectionCounter + 1} Konklusjon`, font: "Calibri" })] }));

    let konklusjonText = "[Konklusjon angis]";
    if (fravik.konklusjon === "tilstrekkelig") konklusjonText = "Den kvalitative analysen vurderes som tilstrekkelig.";
    if (fravik.konklusjon === "komparativ") konklusjonText = "Det er behov for komparativ analyse.";
    if (fravik.konklusjon === "risikoanalyse") konklusjonText = "Det er behov for risikoanalyse etter NS 3901.";

    elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: konklusjonText, size: 22, font: "Calibri" })] }));

    if (fravik.begrunnelseKonklusjon) {
      elements.push(new Paragraph({ children: [new TextRun({ text: "Begrunnelse:", bold: true, size: 22, font: "Calibri" })] }));
      elements.push(new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: fravik.begrunnelseKonklusjon, size: 22, font: "Calibri" })] }));
    }
  });

  const doc = new Document({ sections: [{ children: elements }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${dokumentNavn || "Fraviksdokumentasjon"}.docx`);
}
