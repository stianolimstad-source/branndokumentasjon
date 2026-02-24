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

interface CheckpointData {
  section_key: string;
  status: string;
  comment: string;
}

interface ReviewerInfo {
  name: string;
  email: string;
  company: string;
}

interface ExportOptions {
  conceptName: string;
  reviewType: "egenkontroll" | "sidemannskontroll";
  checkpoints: Record<string, CheckpointData>;
  sections: { key: string; label: string }[];
  chapters: { title: string; keys: { key: string; label: string }[] }[];
  reviewer: ReviewerInfo;
  date: string;
  logoUrl?: string | null;
}

const statusText = (status: string) => {
  switch (status) {
    case "ok": return "OK";
    case "feil": return "Feil/mangel";
    default: return "Ikke vurdert";
  }
};

const headerCell = (text: string, width?: number): TableCell =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })] })],
    shading: { fill: "2563EB", type: ShadingType.SOLID, color: "2563EB" },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  });

const cell = (text: string, width?: number, bold = false): TableCell =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, bold })] })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  });

export const exportKSToWord = async (options: ExportOptions) => {
  const { conceptName, reviewType, checkpoints, chapters, reviewer, date, logoUrl } = options;

  const title = reviewType === "egenkontroll" ? "Egenkontroll" : "Sidemannskontroll";

  // Fetch logo
  let logoBuffer: ArrayBuffer | null = null;
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) logoBuffer = await res.arrayBuffer();
    } catch {}
  }

  // Info table
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell("Felt", 30), headerCell("Verdi", 70)] }),
      new TableRow({ children: [cell("Kontrolltype", 30, true), cell(title, 70)] }),
      new TableRow({ children: [cell("Brannkonsept", 30, true), cell(conceptName, 70)] }),
      new TableRow({ children: [cell("Kontrollør", 30, true), cell(reviewer.name || reviewer.email, 70)] }),
      new TableRow({ children: [cell("E-post", 30, true), cell(reviewer.email, 70)] }),
      new TableRow({ children: [cell("Firma", 30, true), cell(reviewer.company || "—", 70)] }),
      new TableRow({ children: [cell("Dato", 30, true), cell(date, 70)] }),
    ],
  });

  // Checkpoint tables per chapter
  const chapterSections: (Paragraph | Table)[] = [];

  for (const chapter of chapters) {
    chapterSections.push(
      new Paragraph({ text: "", spacing: { before: 200 } }),
      new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_2 }),
    );

    const rows = [
      new TableRow({
        children: [
          headerCell("Punkt", 40),
          headerCell("Status", 20),
          headerCell("Kommentar", 40),
        ],
      }),
    ];

    for (const section of chapter.keys) {
      const cp = checkpoints[section.key];
      rows.push(
        new TableRow({
          children: [
            cell(section.label, 40),
            cell(statusText(cp?.status || "pending"), 20),
            cell(cp?.comment || "", 40),
          ],
        }),
      );
    }

    chapterSections.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    );
  }

  // Summary
  const okCount = Object.values(checkpoints).filter((c) => c.status === "ok").length;
  const feilCount = Object.values(checkpoints).filter((c) => c.status === "feil").length;
  const pendingCount = Object.values(checkpoints).filter((c) => c.status !== "ok" && c.status !== "feil").length;

  const headerElements: (Paragraph | Table)[] = [];
  if (logoBuffer) {
    headerElements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new ImageRun({ data: logoBuffer, transformation: { width: 200, height: 60 }, type: "png" })],
    }));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Verdana", size: 20 },
        },
      },
    },
    sections: [
      {
        children: [
          ...headerElements,
          new Paragraph({
            text: `${title} – ${conceptName}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "", spacing: { before: 200 } }),
          infoTable,
          new Paragraph({ text: "", spacing: { before: 300 } }),
          new Paragraph({
            text: `Oppsummering: ${okCount} OK, ${feilCount} Feil/mangel, ${pendingCount} Ikke vurdert`,
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: `Oppsummering: ${okCount} OK, ${feilCount} Feil/mangel, ${pendingCount} Ikke vurdert`,
                bold: true,
                size: 22,
              }),
            ],
          }),
          ...chapterSections,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${title.toLowerCase().replace(/\s/g, "-")}_${conceptName.replace(/\s+/g, "_")}_${date}.docx`;
  saveAs(blob, filename);
};
