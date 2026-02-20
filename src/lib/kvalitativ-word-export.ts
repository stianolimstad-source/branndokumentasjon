import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

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

interface KvalitativFormData {
  funksjonskrav: string;
  preakseptertYtelse: string;
  hensiktYtelse: string;
  fravikBeskrivelse: string;
  tiltak: {
    id: string;
    beskrivelse: string;
    funksjonalitet: string;
    palitelighet: string;
    robusthet: string;
    vedlikehold: string;
    andreEffekter: string;
  }[];
  fraviketOmrader: string[];
  tiltakOmrader: string[];
  sammenligning: string;
  maleparametre: string;
  referanser: string;
  konklusjon: string;
  begrunnelseKonklusjon: string;
}

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

export async function exportKvalitativWord(formData: KvalitativFormData, dokumentNavn: string) {
  const fraviketLabels = hovedomrader.flatMap(h =>
    h.delomrader.filter(d => formData.fraviketOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
  );
  const tiltakLabels = hovedomrader.flatMap(h =>
    h.delomrader.filter(d => formData.tiltakOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
  );

  const children: Paragraph[] = [];

  // Title
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "FRAVIKSDOKUMENTASJON", bold: true, size: 32, font: "Calibri" })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "Kvalitativ analyse iht. Byggforsk 321.026 kap. 6", size: 20, font: "Calibri", color: "888888" })],
  }));

  // 1. Dokumentasjonsbehov
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "1. Vurdering av dokumentasjonsbehov", font: "Calibri" })] }));

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.1 Funksjonskrav i TEK17", font: "Calibri" })] }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.funksjonskrav || "[Angis]", size: 22, font: "Calibri" })] }));

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.2 Preakseptert ytelse som det fravikes fra", font: "Calibri" })] }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.preakseptertYtelse || "[Angis]", size: 22, font: "Calibri" })] }));

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.3 Opprinnelig hensikt med den preaksepterte ytelsen", font: "Calibri" })] }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.hensiktYtelse || "[Angis]", size: 22, font: "Calibri" })] }));

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.4 Beskrivelse av fraviket", font: "Calibri" })] }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.fravikBeskrivelse || "[Angis]", size: 22, font: "Calibri" })] }));

  // 2. Kompenserende tiltak
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "2. Kompenserende tiltak", font: "Calibri" })] }));

  const tiltakMedBeskrivelse = formData.tiltak.filter(t => t.beskrivelse);

  const sectionElements: (Paragraph | Table)[] = [...children];

  if (tiltakMedBeskrivelse.length > 0) {
    tiltakMedBeskrivelse.forEach((t, i) => {
      sectionElements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `Tiltak ${i + 1}: ${t.beskrivelse}`, font: "Calibri" })],
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
        if (val) {
          rows.push(new TableRow({ children: [makeCell(f.label, true, 35), makeCell(val, false, 65)] }));
        }
      });

      if (rows.length > 0) {
        sectionElements.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        }));
        sectionElements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
      }
    });
  } else {
    sectionElements.push(new Paragraph({ children: [new TextRun({ text: "[Kompenserende tiltak angis]", size: 22, font: "Calibri" })] }));
  }

  // 3. Innvirkningsområder
  sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "3. Fravikets områder for innvirkning", font: "Calibri" })] }));
  sectionElements.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Vurdering basert på tabell 641 i Byggforsk 321.026.", size: 20, font: "Calibri", italics: true })] }));

  const omradeRows = [
    new TableRow({
      children: [
        makeCell("Fravikets innvirkningsområder", true, 50),
        makeCell("Tiltakets innvirkningsområder", true, 50),
      ],
    }),
    new TableRow({
      children: [
        makeCell(fraviketLabels.length > 0 ? fraviketLabels.join("\n") : "[Angis]", false, 50),
        makeCell(tiltakLabels.length > 0 ? tiltakLabels.join("\n") : "[Angis]", false, 50),
      ],
    }),
  ];

  sectionElements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: omradeRows }));

  if (formData.fraviketOmrader.length > 0 && formData.tiltakOmrader.length > 0) {
    const sammeOmrader = formData.fraviketOmrader.every(o => formData.tiltakOmrader.includes(o));
    const vurderingText = sammeOmrader
      ? "Vurdering: Fravik og kompenserende tiltak virker inn på samme område(r). Kvalitativ analyse er vanligvis tilstrekkelig."
      : "Vurdering: Fravik og kompenserende tiltak virker inn på ulike områder. Det kan være behov for mer omfattende analyse.";
    sectionElements.push(new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: vurderingText, size: 20, font: "Calibri", bold: true })] }));
  }

  // 4. Kvalitativ analyse
  sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "4. Kvalitativ analyse", font: "Calibri" })] }));

  sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "4.1 Sammenligning av fravik og kompenserende tiltak", font: "Calibri" })] }));
  sectionElements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.sammenligning || "[Angis]", size: 22, font: "Calibri" })] }));

  sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "4.2 Måleparametre", font: "Calibri" })] }));
  sectionElements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.maleparametre || "[Angis]", size: 22, font: "Calibri" })] }));

  sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "4.3 Referanser og dokumentasjon", font: "Calibri" })] }));
  sectionElements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: formData.referanser || "[Angis]", size: 22, font: "Calibri" })] }));

  // 5. Konklusjon
  sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "5. Konklusjon – behov for videre analyse", font: "Calibri" })] }));

  let konklusjonText = "[Konklusjon angis]";
  if (formData.konklusjon === "tilstrekkelig") konklusjonText = "Den kvalitative analysen vurderes som tilstrekkelig. Beskyttelsesnivået er minst like høyt som den preaksepterte ytelsen.";
  if (formData.konklusjon === "komparativ") konklusjonText = "Det er behov for komparativ analyse for å dokumentere likeverdighet.";
  if (formData.konklusjon === "risikoanalyse") konklusjonText = "Det er behov for risikoanalyse etter NS 3901 for å dokumentere brannsikkerheten.";

  sectionElements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: konklusjonText, size: 22, font: "Calibri" })] }));

  if (formData.begrunnelseKonklusjon) {
    sectionElements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Begrunnelse", font: "Calibri" })] }));
    sectionElements.push(new Paragraph({ children: [new TextRun({ text: formData.begrunnelseKonklusjon, size: 22, font: "Calibri" })] }));
  }

  const doc = new Document({
    sections: [{ children: sectionElements }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${dokumentNavn || "Fraviksdokumentasjon"}.docx`);
}
