import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { FravikEntry } from "@/components/fraviksdokumentasjon/FravikEntryForm";

const hovedomrader = [
  {
    id: "A", label: "A – Brannforløp",
    delomrader: [
      { id: "a", label: "Antennelse" }, { id: "b", label: "Eksplosjon" },
      { id: "c", label: "Utvikling av brann" }, { id: "d", label: "Spredning av brann" },
      { id: "e", label: "Strukturell kollaps" }, { id: "f", label: "Spredning til nabobygning" },
    ],
  },
  {
    id: "B", label: "B – Rømning og redning",
    delomrader: [
      { id: "g", label: "Deteksjon og varsling" }, { id: "h", label: "Reaksjon" },
      { id: "i", label: "Forflytning til sikkert sted" }, { id: "j", label: "Assistert evakuering" },
    ],
  },
  {
    id: "C", label: "C – Verdier",
    delomrader: [
      { id: "k", label: "Mennesker" }, { id: "l", label: "Dyr" },
      { id: "m", label: "Økonomiske verdier" }, { id: "n", label: "Kulturhistoriske verdier" },
      { id: "o", label: "Miljøskader" }, { id: "p", label: "Samfunnsfunksjon" },
    ],
  },
  {
    id: "D", label: "D – Tilrettelegging og sikkerhet for slokkemannskaper",
    delomrader: [
      { id: "q", label: "Innsatstid" }, { id: "r", label: "Tilrettelegging rundt bygningen" },
      { id: "s", label: "Tilrettelegging i bygningen" }, { id: "t", label: "Annet teknisk utstyr for slokkeinnsats" },
      { id: "u", label: "Bemanning og kompetanse" },
    ],
  },
];

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

export async function exportKvalitativWord(fravikEntries: FravikEntry[], dokumentNavn: string) {
  const elements: (Paragraph | Table)[] = [];

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

    const fraviketLabels = hovedomrader.flatMap(h =>
      h.delomrader.filter(d => fravik.fraviketOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
    );
    const tiltakLabels = hovedomrader.flatMap(h =>
      h.delomrader.filter(d => fravik.tiltakOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
    );

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

    elements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [makeCell("Fravikets innvirkningsområder", true, 50), makeCell("Tiltakets innvirkningsområder", true, 50)] }),
        new TableRow({ children: [makeCell(fraviketLabels.length > 0 ? fraviketLabels.join("\n") : "[Angis]", false, 50), makeCell(tiltakLabels.length > 0 ? tiltakLabels.join("\n") : "[Angis]", false, 50)] }),
      ],
    }));

    if (fravik.fraviketOmrader.length > 0 && fravik.tiltakOmrader.length > 0) {
      const sammeOmrader = fravik.fraviketOmrader.every(o => fravik.tiltakOmrader.includes(o));
      elements.push(new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [new TextRun({
          text: sammeOmrader
            ? "Vurdering: Fravik og kompenserende tiltak virker inn på samme område(r)."
            : "Vurdering: Fravik og kompenserende tiltak virker inn på ulike områder.",
          size: 20, font: "Calibri", bold: true,
        })],
      }));
    }

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

        // Inputs table
        const inputEntries = Object.entries(calc.inputs).filter(([k]) => k !== "materialer");
        if (inputEntries.length > 0) {
          elements.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [makeCell("Parameter", true, 50), makeCell("Verdi", true, 50)] }),
              ...inputEntries.map(([key, val]) =>
                new TableRow({ children: [makeCell(key.replace(/_/g, " "), false, 50), makeCell(String(val), false, 50)] })
              ),
            ],
          }));
        }

        // Results table
        const resultEntries = Object.entries(calc.results);
        if (resultEntries.length > 0) {
          elements.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [makeCell("Resultat", true, 50), makeCell("Verdi", true, 50)] }),
              ...resultEntries.map(([key, val]) =>
                new TableRow({ children: [makeCell(key.replace(/_/g, " "), true, 50), makeCell(String(val), true, 50)] })
              ),
            ],
          }));
        }

        if (calc.kommentar) {
          elements.push(new Paragraph({ spacing: { before: 50, after: 200 }, children: [new TextRun({ text: calc.kommentar, size: 20, font: "Calibri", italics: true })] }));
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
