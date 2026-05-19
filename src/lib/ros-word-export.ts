import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  WidthType,
  HeadingLevel,
  ShadingType,
  Packer,
  AlignmentType,
  PageOrientation,
  SectionType,
} from "docx";
import rosNivaaIllustrasjon from "@/assets/ros-detaljeringsnivaa.jpg";
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

  let nivaaImageBuffer: ArrayBuffer | null = null;
  try {
    const r = await fetch(rosNivaaIllustrasjon);
    if (r.ok) nivaaImageBuffer = await r.arrayBuffer();
  } catch {
    nivaaImageBuffer = null;
  }

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
    para("Analyseprosess", { bold: true }),
    para(
      "Analysen følger risikoanalyseprosessen beskrevet i Aven, Røed og Wiencke (2008) «Risikoanalyser – prinsipper og metoder, med anvendelser», som igjen bygger på ISO 31000. Prosessen deles i tre hovedfaser:",
    ),
    para("1) Planlegging", { bold: true }),
    para("   • Problemdefinisjon, informasjonsinnhenting og organisering"),
    para("   • Valg av analysemetode"),
    para("2) Risiko- og sårbarhetsvurdering", { bold: true }),
    para("   • Identifikasjon av mulige initierende hendelser (farer, trusler, muligheter)"),
    para("   • Årsaksanalysen og konsekvensanalysen"),
    para("   • Risikobilde"),
    para("3) Risikohåndtering", { bold: true }),
    para("   • Sammenligning av alternativer, identifisering og vurdering av tiltak"),
    para("   • Ledelsens vurdering og beslutning"),
    new Paragraph({ children: [text("")] }),
    para("Detaljeringsnivå", { bold: true }),
    para(
      "Beredskapsforskriften stiller krav om å kartlegge virksomhetens risikopotensiale. Detaljeringsnivået i ROS-analysen tilpasses analysens formål:",
    ),
    para("   • Nivå 1 — Overordnet ROS-analyse (helhetsbilde av virksomheten/anlegget)"),
    para("   • Nivå 2 — ROS-analyse for anlegg og aktiviteter"),
    para("   • Nivå 3 — Detaljert ROS-analyse av delsystem/komponenter"),
    ...(nivaaImageBuffer
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: nivaaImageBuffer,
                transformation: { width: 560, height: 425 },
                type: "jpg",
              }),
            ],
          }),
        ]
      : []),
    ...(content.metadata.nivaa
      ? [
          para(
            `Valgt for denne analysen: Nivå ${content.metadata.nivaa} — ${
              content.metadata.nivaa === 1
                ? "Overordnet ROS-analyse"
                : content.metadata.nivaa === 2
                ? "ROS-analyse for anlegg og aktiviteter"
                : "Detaljert ROS-analyse av delsystem/komponenter"
            }.`,
            { bold: true },
          ),
        ]
      : [para("Nivå er ikke valgt i input.")]),
    new Paragraph({ children: [text("")] }),
    para("Planlegging av analysen", { bold: true }),
    para(
      "God planlegging er avgjørende for resultatet. Det må være tydelig hvorfor og hvordan analysen skal gjennomføres, samt hvilke forskriftskrav som skal tilfredsstilles. Følgende momenter inngår i planleggingen:",
    ),
    para("1. Definere formål og omfang av analysen. Se kap. 1.2 Formål og 1.3 Omfang."),
    para("2. Valg av konsekvens- og sannsynlighetsdimensjon. Se sannsynlighets- og konsekvensskala (5-trinns skala)."),
    para(
      `3. Informasjonsinnhenting: ${
        content.metode?.informasjonsinnhenting?.trim() ||
        "Ikke utfylt (kilder, tegningsgrunnlag, befaringer, intervjuer, statistikk)."
      }`,
    ),
    para(
      `4. Organisering av arbeidet: ${
        content.metode?.organisering?.trim() ||
        "Ikke utfylt (deltakere, roller, ansvar, møtestruktur)."
      }`,
    ),
    para(
      `5. Klargjøring av analyseskjema og sjekklister: ${
        content.metode?.skjemaOgSjekklister?.trim() ||
        "Hendelser registreres i 5×5-skjema (kap. 3) med vurdering før og etter tiltak."
      }`,
    ),
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
  const smallHeader = (t: string, widthPct?: number): TableCell =>
    new TableCell({
      children: [new Paragraph({ children: [text(t, { bold: true, size: 16, color: "FFFFFF" })] })],
      shading: tableHeaderShading(theme),
      width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    });
  const smallCell = (t: string, widthPct?: number, bold = false): TableCell =>
    new TableCell({
      children: [new Paragraph({ children: [text(t, { bold, size: 14 })] })],
      width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    });
  const hendelseHeader = new TableRow({
    children: [
      smallHeader("Nr", 3),
      smallHeader("Sårbarhet", 8),
      smallHeader("Hendelse / scenario", 9),
      smallHeader("Årsak", 7),
      smallHeader("Beskr. sanns. (før)", 8),
      smallHeader("Beskr. risiko (før)", 8),
      smallHeader("S", 3),
      smallHeader("K", 3),
      smallHeader("R", 4),
      smallHeader("Forebyggende tiltak", 9),
      smallHeader("Beskr. etter tiltak", 9),
      smallHeader("S e.", 3),
      smallHeader("K e.", 3),
      smallHeader("R e.", 4),
      smallHeader("Restrisiko", 9),
    ],
  });
  const hendelseRows: TableRow[] = [hendelseHeader];
  content.hendelser.forEach((h, i) => {
    const r = h.sannsynlighet * h.konsekvens;
    const sE = h.sannsynlighetEtter ?? h.sannsynlighet;
    const kE = h.konsekvensEtter ?? h.konsekvens;
    const rE = sE * kE;
    hendelseRows.push(
      new TableRow({
        children: [
          smallCell(String(i + 1), 3),
          smallCell(h.sarbarhet || "", 8),
          smallCell(h.hendelse || h.beskrivelse || h.tittel || "—", 9, true),
          smallCell(h.arsak || "", 7),
          smallCell(h.beskrivelseSannsynlighetFor || "", 8),
          smallCell(h.beskrivelseRisikoFor || "", 8),
          smallCell(String(h.sannsynlighet), 3),
          smallCell(String(h.konsekvens), 3),
          new TableCell({
            width: { size: 4, type: WidthType.PERCENTAGE },
            shading: risikoShading(h.sannsynlighet, h.konsekvens),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(String(r), { bold: true, size: 16, color: risikoTekstFarge(h.sannsynlighet, h.konsekvens) })],
              }),
            ],
          }),
          smallCell(h.tiltak || "", 9),
          smallCell(h.beskrivelseEtter || "", 9),
          smallCell(String(sE), 3),
          smallCell(String(kE), 3),
          new TableCell({
            width: { size: 4, type: WidthType.PERCENTAGE },
            shading: risikoShading(sE, kE),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(String(rE), { bold: true, size: 16, color: risikoTekstFarge(sE, kE) })],
              }),
            ],
          }),
          smallCell(h.restrisiko || "", 9),
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

  // Kap. 4 Bow-tie (kun hvis registrert)
  const harBowTie = !!(content.bowTies && content.bowTies.length > 0);
  const bowTieBlocks: (Paragraph | Table)[] = [];
  if (harBowTie) {
    bowTieBlocks.push(buildSectionHeading(theme, "4. Bow-tie analyse"));
    bowTieBlocks.push(
      para(
        "Bow-tie-analysen knytter registrerte hendelser fra kapittel 3 til overordnede uønskede topphendelser. " +
          "Dette synliggjør hvilke årsaker som kan lede til samme topphendelse, og hvilke tiltak som virker på tvers.",
      ),
    );
    (content.bowTies || []).forEach((bt, idx) => {
      const arsaker = bt.hendelseIds
        .map((id) => content.hendelser.find((h) => h.id === id))
        .filter((h): h is NonNullable<typeof h> => !!h);
      bowTieBlocks.push(new Paragraph({ children: [text("")] }));
      bowTieBlocks.push(para(`4.${idx + 1} ${bt.navn || "Uten navn"}`, { bold: true, size: 24 }));
      if (bt.beskrivelse?.trim()) bowTieBlocks.push(para(bt.beskrivelse));

      // Årsaker-tabell
      const aHeader = new TableRow({
        children: [
          smallHeader("Årsak (hendelse)", 60),
          smallHeader("S", 8),
          smallHeader("K", 8),
          smallHeader("R", 8),
          smallHeader("Tiltak", 16),
        ],
      });
      const aRows: TableRow[] = [aHeader];
      if (arsaker.length === 0) {
        aRows.push(new TableRow({ children: [smallCell("Ingen årsaker knyttet.", 100)] }));
      } else {
        arsaker.forEach((a) => {
          aRows.push(
            new TableRow({
              children: [
                smallCell(a.tittel || a.sarbarhet || a.hendelse || "—", 60, true),
                smallCell(String(a.sannsynlighet), 8),
                smallCell(String(a.konsekvens), 8),
                new TableCell({
                  width: { size: 8, type: WidthType.PERCENTAGE },
                  shading: risikoShading(a.sannsynlighet, a.konsekvens),
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        text(String(a.sannsynlighet * a.konsekvens), {
                          bold: true,
                          size: 16,
                          color: risikoTekstFarge(a.sannsynlighet, a.konsekvens),
                        }),
                      ],
                    }),
                  ],
                }),
                smallCell(a.tiltak || "", 16),
              ],
            }),
          );
        });
      }
      bowTieBlocks.push(para("Årsaker", { bold: true }));
      bowTieBlocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: aRows }));

      // Konsekvenser
      bowTieBlocks.push(new Paragraph({ children: [text("")] }));
      bowTieBlocks.push(para("Konsekvenser", { bold: true }));
      if (bt.konsekvenser.length === 0) {
        bowTieBlocks.push(para("Ingen konsekvenser registrert."));
      } else {
        bt.konsekvenser.forEach((k) => bowTieBlocks.push(para(`• ${k}`)));
      }

      // Felles barrierer (AI/manuelle)
      const fb = (bt.felleseBarrierer || []).filter((b) => b.tekst?.trim());
      if (fb.length > 0) {
        bowTieBlocks.push(new Paragraph({ children: [text("")] }));
        bowTieBlocks.push(para("Felles barrierer (på tvers av årsaker)", { bold: true }));
        fb.forEach((b) => {
          const navn = b.arsakIds
            .map((id) => {
              const a = arsaker.find((x) => x.id === id);
              return a?.tittel || a?.sarbarhet || a?.hendelse || "";
            })
            .filter(Boolean)
            .join(", ");
          const suffix = navn ? ` (dekker: ${navn})` : "";
          const tag = b.kilde === "ai" ? " [AI]" : "";
          bowTieBlocks.push(para(`• ${b.tekst}${tag}${suffix}`));
        });
      }

      // Felles barrierer (fritekst)
      if (bt.fellesBarrierer?.trim()) {
        bowTieBlocks.push(new Paragraph({ children: [text("")] }));
        bowTieBlocks.push(para("Felles barrierer / tiltak (fritekst)", { bold: true }));
        bowTieBlocks.push(para(bt.fellesBarrierer));
      }
    });
  }

  // Oppsummering & revisjon
  const oppsummeringNr = harBowTie ? "5" : "4";
  const revisjonNr = harBowTie ? "6" : "5";

  const oppsummering: Paragraph[] = [
    buildSectionHeading(theme, `${oppsummeringNr}. Oppsummering`),
    ...((content.oppsummering || "Ingen oppsummering registrert.").split("\n").map((line) => para(line))),
  ];

  // Revisjonshistorikk
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
    buildSectionHeading(theme, `${revisjonNr}. Revisjonshistorikk`),
    content.revisjonshistorikk.length === 0
      ? para("Ingen revisjoner registrert.")
      : new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: revRows }),
  ];

  const doc = new Document({
    styles: defaultDocStyles(theme),
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          },
        },
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
        ],
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          },
        },
        headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
        footers: { default: buildFooter(theme) },
        children: [...hendelser],
      },
      ...(harBowTie
        ? [
            {
              properties: {
                type: SectionType.NEXT_PAGE,
                page: {
                  size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
                },
              },
              headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
              footers: { default: buildFooter(theme) },
              children: [...bowTieBlocks],
            },
          ]
        : []),
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          },
        },
        headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
        footers: { default: buildFooter(theme) },
        children: [
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
