import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  Packer,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";

export interface QuoteLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface QuoteData {
  quote_number?: string;
  recipient_name?: string;
  recipient_company?: string;
  recipient_address?: string;
  recipient_email?: string;
  validity_date?: string;
  payment_terms?: string;
  conditions?: string;
  include_mva: boolean;
  project_name?: string;
  project_address?: string;
  lines: QuoteLine[];
}

export interface SenderInfo {
  full_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: { fill: "2563EB", type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
  });
}

function dataCell(text: string, width: number, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    margins: cellMargins,
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text, font: "Arial", size: 20 })] })],
  });
}

function totalCell(text: string, width: number, bold = false, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { ...borders, top: { style: BorderStyle.SINGLE, size: 2, color: "333333" } },
    margins: cellMargins,
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, font: "Arial", size: 20 })] })],
  });
}

export async function exportQuoteToWord(data: QuoteData, sender: SenderInfo) {
  const children: Paragraph[] = [];

  // Sender info
  if (sender.company) {
    children.push(new Paragraph({ children: [new TextRun({ text: sender.company, bold: true, font: "Arial", size: 28 })] }));
  }
  if (sender.full_name) children.push(new Paragraph({ children: [new TextRun({ text: sender.full_name, font: "Arial", size: 20 })] }));
  if (sender.phone) children.push(new Paragraph({ children: [new TextRun({ text: `Tlf: ${sender.phone}`, font: "Arial", size: 20 })] }));
  if (sender.email) children.push(new Paragraph({ children: [new TextRun({ text: sender.email, font: "Arial", size: 20 })] }));
  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

  // Title
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `Tilbud${data.quote_number ? ` – ${data.quote_number}` : ""}`, bold: true, font: "Arial", size: 36 })],
  }));

  // Recipient
  if (data.recipient_company || data.recipient_name) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Til:", bold: true, font: "Arial", size: 20 })] }));
    if (data.recipient_company) children.push(new Paragraph({ children: [new TextRun({ text: data.recipient_company, font: "Arial", size: 20 })] }));
    if (data.recipient_name) children.push(new Paragraph({ children: [new TextRun({ text: data.recipient_name, font: "Arial", size: 20 })] }));
    if (data.recipient_address) children.push(new Paragraph({ children: [new TextRun({ text: data.recipient_address, font: "Arial", size: 20 })] }));
    if (data.recipient_email) children.push(new Paragraph({ children: [new TextRun({ text: data.recipient_email, font: "Arial", size: 20 })] }));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  // Project info
  if (data.project_name) {
    children.push(new Paragraph({ children: [new TextRun({ text: `Prosjekt: ${data.project_name}`, bold: true, font: "Arial", size: 20 })] }));
    if (data.project_address) children.push(new Paragraph({ children: [new TextRun({ text: data.project_address, font: "Arial", size: 20 })] }));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  // Date
  children.push(new Paragraph({
    children: [new TextRun({ text: `Dato: ${new Date().toLocaleDateString("nb-NO")}`, font: "Arial", size: 20 })],
  }));
  if (data.validity_date) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `Gyldig til: ${new Date(data.validity_date).toLocaleDateString("nb-NO")}`, font: "Arial", size: 20 })],
    }));
  }
  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

  // Price table
  const colWidths = [3800, 1000, 800, 1800, 1960];
  const headerRow = new TableRow({
    children: [
      headerCell("Beskrivelse", colWidths[0]),
      headerCell("Antall", colWidths[1]),
      headerCell("Enhet", colWidths[2]),
      headerCell("Enhetspris", colWidths[3]),
      headerCell("Sum", colWidths[4]),
    ],
  });

  const lineRows = data.lines.map((l) => {
    const sum = l.quantity * l.unit_price;
    return new TableRow({
      children: [
        dataCell(l.description, colWidths[0]),
        dataCell(String(l.quantity), colWidths[1], AlignmentType.RIGHT),
        dataCell(l.unit, colWidths[2]),
        dataCell(formatCurrency(l.unit_price), colWidths[3], AlignmentType.RIGHT),
        dataCell(formatCurrency(sum), colWidths[4], AlignmentType.RIGHT),
      ],
    });
  });

  const subtotal = data.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const mva = data.include_mva ? subtotal * 0.25 : 0;
  const total = subtotal + mva;

  const summaryRows = [
    new TableRow({
      children: [
        totalCell("", colWidths[0] + colWidths[1] + colWidths[2], false),
        totalCell("Sum eks. mva", colWidths[3], true, AlignmentType.RIGHT),
        totalCell(formatCurrency(subtotal), colWidths[4], false, AlignmentType.RIGHT),
      ],
    }),
  ];

  if (data.include_mva) {
    summaryRows.push(new TableRow({
      children: [
        dataCell("", colWidths[0] + colWidths[1] + colWidths[2]),
        dataCell("MVA 25%", colWidths[3], AlignmentType.RIGHT),
        dataCell(formatCurrency(mva), colWidths[4], AlignmentType.RIGHT),
      ],
    }));
    summaryRows.push(new TableRow({
      children: [
        totalCell("", colWidths[0] + colWidths[1] + colWidths[2], false),
        totalCell("Totalt inkl. mva", colWidths[3], true, AlignmentType.RIGHT),
        totalCell(formatCurrency(total), colWidths[4], true, AlignmentType.RIGHT),
      ],
    }));
  }

  const table = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...lineRows, ...summaryRows],
  });

  // Conditions
  const conditionParagraphs: Paragraph[] = [];
  if (data.payment_terms || data.conditions) {
    conditionParagraphs.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Betingelser", bold: true, font: "Arial", size: 22 })] }));
    if (data.payment_terms) conditionParagraphs.push(new Paragraph({ children: [new TextRun({ text: data.payment_terms, font: "Arial", size: 20 })] }));
    if (data.conditions) conditionParagraphs.push(new Paragraph({ children: [new TextRun({ text: data.conditions, font: "Arial", size: 20 })] }));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [...children, table, ...conditionParagraphs],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Tilbud${data.quote_number ? `_${data.quote_number}` : ""}.docx`);
}
