import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  HeadingLevel,
  ShadingType,
  Packer,
  AlignmentType,
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
import { risikoFarge } from "@/components/ros/RosMatriks";
import type { RosContent } from "@/components/ros/RosPreview";

export interface RosSenderInfo {
  full_name?: string | null;
  email?: string | null;
  company?: string | null;
}

interface ExportOptions {
  analyseName: string;
  content: RosContent;
  sender: RosSenderInfo;
  logoUrl?: string | null;
  theme?: ResolvedTheme;
}

const SKALA_S = [
  "1 – Svært lite sannsynlig (sjeldnere enn hvert 50. år)",
  "2 – Lite sannsynlig (hvert 10.–50. år)",
  "3 – Sannsynlig (hvert 1.–10. år)",
  "4 – Meget sannsynlig (årlig)",
  "5 – Svært sannsynlig (flere ganger per år)",
];
const SKALA_K = [
  "1 – Ufarlig (ingen personskade, ubetydelig materiell skade)",
  "2 – En viss fare (mindre personskade, begrenset materiell skade)",
  "3 – Farlig (alvorlig personskade, betydelig materiell skade)",
  "4 – Kritisk (livstruende skade, store materielle tap)",
  "5 – Katastrofal (død, totalskade)",
];

// Hex-farger for risikokoding (matcher preview/matrise)
const FARGE_HEX = {
  gronn: "22A06B", // emerald
  gul: "F5B82E",   // amber
  rod: "DC3545",   // red
};
const FARGE_TEKST = {
  gronn: "FFFFFF",
  gul: "1F2937",
  rod: "FFFFFF",
};

function risikoShading(s: number, k: number) {
  const f = risikoFarge(s, k);
  return { fill: FARGE_HEX[f], type: ShadingType.CLEAR, color: "auto" };
}
function risikoTekstFarge(s: number, k: number) {
  return FARGE_TEKST[risikoFarge(s, k)];
}

export const exportRosToWord = async (options: ExportOptions) => {
  const { analyseName, content, sender, logoUrl } = options;
  const theme: ResolvedTheme =
    options.theme ?? buildResolvedTheme({}, logoUrl ?? null, sender.company || null);
  const logo = await fetchLogoBuffer(theme.logoUrl ?? logoUrl ?? null);
  const font = theme.fontFamily;

  const m = content.metadata;
  const dateStr = m.dato || new Date().toISOString().slice(0, 10);

  const text = (t: string, opts: { bold?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text: t, font, bold: opts.bold, size: opts.size ?? 22, color: opts.color });

  const para = (t: string, opts?: { bold?: boolean; size?: number }) =>
    new Paragraph({ children: [text(t, opts)] });

  const headerCell = (t: string, widthPct?: number): TableCell =>
    new TableCell({
      children: [new Paragraph({ children: [text(t, { bold: true, size: 20, color: "FFFFFF" })] })],
      shading: tableHeaderShading(theme),
      width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    });

  const cell = (t: string, widthPct?: number, bold = false): TableCell =>
    new TableCell({
      children: [new Paragraph({ children: [text(t, { bold, size: 20 })] })],
      width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    });

  // Cover
  const cover = buildCoverPage(theme, {
    title: `ROS-analyse – ${m.prosjektnavn || analyseName}`,
    subtitle: "Brannrelatert risiko- og sårbarhetsanalyse (5×5)",
    projectName: m.prosjektnavn || analyseName,
    authorLine: `${sender.full_name || sender.email || ""}${sender.company ? ` · ${sender.company}` : ""}`,
    date: dateStr,
    logo,
  });

  // Metadata-tabell
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell("Felt", 30), headerCell("Verdi", 70)] }),
      new TableRow({ children: [cell("Prosjekt", 30, true), cell(m.prosjektnavn || "—", 70)] }),
      new TableRow({ children: [cell("Adresse", 30, true), cell(m.adresse || "—", 70)] }),
      new TableRow({ children: [cell("Oppdragsgiver", 30, true), cell(m.oppdragsgiver || "—", 70)] }),
      new TableRow({ children: [cell("Utført av", 30, true), cell(m.utfortAv || sender.full_name || "—", 70)] }),
      new TableRow({ children: [cell("Dato", 30, true), cell(dateStr, 70)] }),
      new TableRow({ children: [cell("Versjon", 30, true), cell(m.versjon || "1.0", 70)] }),
    ],
  });

  // Kap. 1 Innledning
  const innledning: (Paragraph | Table)[] = [
    buildSectionHeading(theme, "1. Innledning"),
    para("1.1 Bakgrunn", { bold: true }),
    para(content.innledning.bakgrunn || "Ikke utfylt."),
    para(""),
    para("1.2 Formål", { bold: true }),
    para(content.innledning.formal || "Ikke utfylt."),
    para(""),
    para("1.3 Omfang", { bold: true }),
    para(content.innledning.omfang || "Ikke utfylt."),
    para(""),
    para("1.4 Avgrensninger", { bold: true }),
    para(content.innledning.avgrensninger || "Ikke utfylt."),
  ];

  // Kap. 2 Metode
  const metodeIntro = new Paragraph({
    children: [
      text(
        "Analysen er utført som en kvalitativ risiko- og sårbarhetsanalyse med en 5×5-matrise der " +
        "sannsynlighet (S) og konsekvens (K) vurderes på en skala fra 1 til 5. Risikoverdien " +
        "(R = S × K) plasseres i fargekodede områder for akseptabel, ALARP/vurderes og ikke " +
        "akseptabel risiko. Brannrelaterte hendelser er identifisert med utgangspunkt i bygningens " +
        "bruk, brannenergi, evakueringsforhold og aktive/passive brannsikringstiltak.",
      ),
    ],
  });

  // 5x5 matrise (Word-tabell, S nedover 5..1, K bortover 1..5)
  const matriseRows: TableRow[] = [];
  // Header-rad: tom + 1..5 (konsekvens)
  matriseRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [text("S \\ K", { bold: true, size: 18 })] })],
          shading: tableHeaderShading(theme),
        }),
        ...[1, 2, 3, 4, 5].map(
          (k) =>
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [text(`K=${k}`, { bold: true, size: 18, color: "FFFFFF" })],
                }),
              ],
              shading: tableHeaderShading(theme),
            }),
        ),
      ],
    }),
  );
  for (const s of [5, 4, 3, 2, 1]) {
    matriseRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(`S=${s}`, { bold: true, size: 18, color: "FFFFFF" })],
              }),
            ],
            shading: tableHeaderShading(theme),
          }),
          ...[1, 2, 3, 4, 5].map((k) => {
            const r = s * k;
            return new TableCell({
              shading: risikoShading(s, k),
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [text(String(r), { bold: true, size: 20, color: risikoTekstFarge(s, k) })],
                }),
              ],
            });
          }),
        ],
      }),
    );
  }
  const matriseTabell = new Table({
    width: { size: 70, type: WidthType.PERCENTAGE },
    rows: matriseRows,
  });

  const metode: (Paragraph | Table)[] = [
    buildSectionHeading(theme, "2. Metode"),
    metodeIntro,
    new Paragraph({ children: [text("")] }),
    para("Sannsynlighetsskala", { bold: true }),
    ...SKALA_S.map((s) => para(s)),
    new Paragraph({ children: [text("")] }),
    para("Konsekvensskala", { bold: true }),
    ...SKALA_K.map((s) => para(s)),
    new Paragraph({ children: [text("")] }),
    para("Risikomatrise (5×5)", { bold: true }),
    matriseTabell,
    new Paragraph({
      children: [
        text("Fargekoding: grønn = akseptabel (R 1–4), gul = vurderes / ALARP (R 5–9), rød = ikke akseptabel (R 10–25).", { size: 18 }),
      ],
    }),
  ];

  // Kap. 3 Hendelsesregister
  const hendelseHeader = new TableRow({
    children: [
      headerCell("Nr", 4),
      headerCell("Tittel", 14),
      headerCell("Beskrivelse", 18),
      headerCell("Årsak", 14),
      headerCell("S", 4),
      headerCell("K", 4),
      headerCell("R", 6),
      headerCell("Tiltak", 18),
      headerCell("Restrisiko", 18),
    ],
  });
  const hendelseRows: TableRow[] = [hendelseHeader];
  content.hendelser.forEach((h, i) => {
    const r = h.sannsynlighet * h.konsekvens;
    hendelseRows.push(
      new TableRow({
        children: [
          cell(String(i + 1), 4),
          cell(h.tittel || "—", 14, true),
          cell(h.beskrivelse || "", 18),
          cell(h.arsak || "", 14),
          cell(String(h.sannsynlighet), 4),
          cell(String(h.konsekvens), 4),
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            shading: risikoShading(h.sannsynlighet, h.konsekvens),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(String(r), { bold: true, size: 20, color: risikoTekstFarge(h.sannsynlighet, h.konsekvens) })],
              }),
            ],
          }),
          cell(h.tiltak || "", 18),
          cell(h.restrisiko || "", 18),
        ],
      }),
    );
  });
  const hendelser: (Paragraph | Table)[] = [
    buildSectionHeading(theme, "3. Hendelsesregister"),
    content.hendelser.length === 0
      ? para("Ingen hendelser registrert.")
      : new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: hendelseRows }),
  ];

  // Kap. 4 Oppsummering
  const oppsummering: Paragraph[] = [
    buildSectionHeading(theme, "4. Oppsummering"),
    ...((content.oppsummering || "Ingen oppsummering registrert.").split("\n").map((line) => para(line))),
  ];

  // Kap. 5 Revisjonshistorikk
  const revRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell("Versjon", 15),
        headerCell("Dato", 20),
        headerCell("Utførende", 25),
        headerCell("Endring", 40),
      ],
    }),
  ];
  content.revisjonshistorikk.forEach((r) => {
    revRows.push(
      new TableRow({
        children: [
          cell(r.versjon, 15),
          cell(r.dato, 20),
          cell(r.utfortAv, 25),
          cell(r.endring, 40),
        ],
      }),
    );
  });
  const revisjonshistorikk: (Paragraph | Table)[] = [
    buildSectionHeading(theme, "5. Revisjonshistorikk"),
    content.revisjonshistorikk.length === 0
      ? para("Ingen revisjoner registrert.")
      : new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: revRows }),
  ];

  const doc = new Document({
    styles: defaultDocStyles(theme),
    sections: [
      {
        headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
        footers: { default: buildFooter(theme) },
        children: [
          ...cover,
          new Paragraph({ text: "", spacing: { before: 200 } }),
          infoTable,
          new Paragraph({ text: "", spacing: { before: 300 } }),
          ...innledning,
          new Paragraph({ text: "", spacing: { before: 200 } }),
          ...metode,
          new Paragraph({ text: "", spacing: { before: 200 } }),
          ...hendelser,
          new Paragraph({ text: "", spacing: { before: 200 } }),
          ...oppsummering,
          new Paragraph({ text: "", spacing: { before: 200 } }),
          ...revisjonshistorikk,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (analyseName || "ros-analyse").replace(/\s+/g, "_");
  saveAs(blob, `ros-analyse_${safeName}_${dateStr}.docx`);
};
