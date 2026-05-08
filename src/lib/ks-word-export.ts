import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  Packer,
} from "docx";
import { saveAs } from "file-saver";
import {
  ResolvedTheme,
  buildResolvedTheme,
  buildCoverPage,
  buildHeader,
  buildFooter,
  buildSectionHeading,
  defaultDocStyles,
  fetchLogoBuffer,
  tableHeaderShading,
} from "@/lib/document-templates";

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
  theme?: ResolvedTheme;
}

const statusText = (status: string) => {
  switch (status) {
    case "ok":
      return "OK";
    case "feil":
      return "Feil/mangel";
    default:
      return "Ikke vurdert";
  }
};

export const exportKSToWord = async (options: ExportOptions) => {
  const { conceptName, reviewType, checkpoints, chapters, reviewer, date, logoUrl } = options;
  const theme: ResolvedTheme = options.theme ?? buildResolvedTheme({}, logoUrl ?? null, reviewer.company || null);

  const title = reviewType === "egenkontroll" ? "Egenkontroll" : "Sidemannskontroll";

  const logo = await fetchLogoBuffer(theme.logoUrl ?? logoUrl ?? null);

  const headerCell = (text: string, width?: number): TableCell =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: theme.fontFamily })],
        }),
      ],
      shading: tableHeaderShading(theme),
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    });

  const cell = (text: string, width?: number, bold = false): TableCell =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, size: 20, bold, font: theme.fontFamily })] })],
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    });

  // Cover page
  const cover = buildCoverPage(theme, {
    title: `${title} – ${conceptName}`,
    subtitle: "Kvalitetssikring av brannkonsept",
    projectName: conceptName,
    authorLine: `${reviewer.name || reviewer.email}${reviewer.company ? ` · ${reviewer.company}` : ""}`,
    date,
    logo,
  });

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
    chapterSections.push(buildSectionHeading(theme, chapter.title, 2));

    const rows = [
      new TableRow({
        children: [headerCell("Punkt", 40), headerCell("Status", 20), headerCell("Kommentar", 40)],
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

    chapterSections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  // Summary
  const okCount = Object.values(checkpoints).filter((c) => c.status === "ok").length;
  const feilCount = Object.values(checkpoints).filter((c) => c.status === "feil").length;
  const pendingCount = Object.values(checkpoints).filter(
    (c) => c.status !== "ok" && c.status !== "feil",
  ).length;

  const doc = new Document({
    styles: defaultDocStyles(theme),
    sections: [
      {
        headers: { default: buildHeader(theme, { logo, documentLabel: title }) },
        footers: { default: buildFooter(theme) },
        children: [
          ...cover,
          buildSectionHeading(theme, `${title} – ${conceptName}`),
          new Paragraph({ text: "", spacing: { before: 200 } }),
          infoTable,
          new Paragraph({ text: "", spacing: { before: 300 } }),
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: `Oppsummering: ${okCount} OK, ${feilCount} Feil/mangel, ${pendingCount} Ikke vurdert`,
                bold: true,
                size: 22,
                font: theme.fontFamily,
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

// Re-export AlignmentType / HeadingLevel / ShadingType to avoid unused warnings if tree-shaking complains
export { AlignmentType, HeadingLevel, ShadingType };
