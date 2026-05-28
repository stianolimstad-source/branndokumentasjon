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
  Header,
  BorderStyle,
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
import { risikoFarge, tilgjengeligeDimensjoner, byggHendelseIder, tellRisikoSoner, harEtterData } from "@/components/ros/RosMatriks";
import { KONSEKVENS_KRITERIER, SANNSYNLIGHET_KRITERIER, KriterieTabell, DIMENSJON_NAVN, type KonsekvensDimensjon } from "@/lib/ros-risk-criteria";
import { migrerHendelse, byggBeregningIder, type RosBeregning, type RosContent, type RosHendelse } from "@/components/ros/RosPreview";
import {
  TILTAK_STATUS_LABEL,
  TILTAK_STATUS_FILL,
  TILTAK_KATEGORI_LABEL,
  VURDERING_LABEL,
  byggTiltakIder,
  erFristPassert,
  sorterTiltakEtterPrioritet,
  formaterFrist,
} from "@/lib/ros-tiltak";
import {
  BFK_PARAGRAFER,
  BFK_KATEGORI_LABEL,
  BFK_KATEGORI_REKKEFOLGE,
  BFK_STATUS_LABEL,
  normaliserBfkVurderinger,
  type BfkVurderingStatus,
} from "@/lib/ros-beredskapsforskrift";

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

  const text = (t: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) =>
    new TextRun({ text: t, font, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, color: opts.color });

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
    ...((() => {
      const deltakere = content.metode?.deltakere || [];
      if (deltakere.length > 0) {
        return [
          para("4. Organisering av arbeidet — deltakere:"),
          new Table({
            width: { size: 90, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [headerCell("Navn", 34), headerCell("Stillingstittel", 33), headerCell("Bedrift", 33)] }),
              ...deltakere.map((d) =>
                new TableRow({
                  children: [cell(d.navn || "—", 34), cell(d.stilling || "—", 33), cell(d.bedrift || "—", 33)],
                }),
              ),
            ],
          }),
        ] as (Paragraph | Table)[];
      }
      return [
        para(
          `4. Organisering av arbeidet: ${
            content.metode?.organisering?.trim() ||
            "Ikke utfylt (deltakere, roller, ansvar, møtestruktur)."
          }`,
        ),
      ] as (Paragraph | Table)[];
    })()),
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
    new Paragraph({ children: [text("")] }),
    new Paragraph({
      children: [
        text("Kriteriene under gjelder kraftstasjoner og tilpasses den enkelte virksomhet.", { size: 18 }),
      ],
    }),
    para(KONSEKVENS_KRITERIER.kraftstasjon.forsyningssikkerhet.tittel, { bold: true }),
    buildKriterieTabell(KONSEKVENS_KRITERIER.kraftstasjon.forsyningssikkerhet),
    new Paragraph({ children: [text("")] }),
    para(SANNSYNLIGHET_KRITERIER.kraftstasjon.tittel, { bold: true }),
    buildKriterieTabell(SANNSYNLIGHET_KRITERIER.kraftstasjon),
  ];

  function buildKriterieTabell(tab: KriterieTabell): Table {
    const nivaBg = (n: number) =>
      n <= 2 ? "22A06B" : n === 3 ? "F5B82E" : n === 4 ? "F97316" : "DC3545";
    const nivaFg = (n: number) => (n === 3 ? "1F2937" : "FFFFFF");
    const header = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [text("Nivå", { bold: true, size: 18, color: "FFFFFF" })] })],
          shading: tableHeaderShading(theme),
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [text("Betegnelse", { bold: true, size: 18, color: "FFFFFF" })] })],
          shading: tableHeaderShading(theme),
          width: { size: 22, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [text("Beskrivelse", { bold: true, size: 18, color: "FFFFFF" })] })],
          shading: tableHeaderShading(theme),
          width: { size: 68, type: WidthType.PERCENTAGE },
        }),
      ],
    });
    const rows = tab.rader.map(
      (r) =>
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: nivaBg(r.niva), type: ShadingType.CLEAR, color: "auto" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [text(String(r.niva), { bold: true, size: 20, color: nivaFg(r.niva) })],
                }),
              ],
            }),
            new TableCell({
              children: [new Paragraph({ children: [text(r.navn, { bold: true, size: 18 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [text(r.beskrivelse, { size: 18 })] })],
            }),
          ],
        }),
    );
    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] });
  }

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
      smallHeader("Sårbarhet", 7),
      smallHeader("Hendelse / scenario", 8),
      smallHeader("Årsak", 6),
      smallHeader("Beskr. sanns. (før)", 6),
      smallHeader("Beskr. risiko (før)", 6),
      smallHeader("S", 3),
      smallHeader("K", 3),
      smallHeader("R", 4),
      smallHeader("Eksist. barrierer", 5),
      smallHeader("Foreslåtte tiltak", 5),
      smallHeader("Beskr. etter tiltak", 8),
      smallHeader("S e.", 3),
      smallHeader("K e.", 3),
      smallHeader("R e.", 4),
      smallHeader("Restrisiko", 8),
      smallHeader("Usikk.", 4),
      smallHeader("Styrb.", 4),
    ],
  });
  const USIKK_SHADE: Record<string, { fill: string; fg: string }> = {
    "lav":    { fill: "E5E7EB", fg: "374151" },
    "medium": { fill: "FEF3C7", fg: "92400E" },
    "høy":    { fill: "FEE2E2", fg: "991B1B" },
  };
  const STYRB_SHADE: Record<string, { fill: string; fg: string }> = {
    "lav":    { fill: "FEE2E2", fg: "991B1B" },
    "medium": { fill: "FEF3C7", fg: "92400E" },
    "høy":    { fill: "D1FAE5", fg: "065F46" },
  };
  const cap = (v?: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
  const vurderingCell = (v: string | undefined, palette: Record<string, { fill: string; fg: string }>, widthPct: number): TableCell => {
    const p = v ? palette[v] : undefined;
    return new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: p ? { fill: p.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(cap(v), { bold: !!p, size: 14, color: p?.fg || "94A3B8" })] })],
    });
  };
  const BEREGNING_LABELS: Record<string, string> = {
    straling: "Strålingsberegning",
    flammehoyde: "Flammehøyde",
    brannenergi: "Brannenergi",
    persontall: "Persontallsberegning",
    omhyllingsflate: "Omhyllingsflate",
    brannmotstand: "Brannmotstand",
    trafoeksplosjon: "Trafoeksplosjon",
  };
  // Bygger param/verdi-tabell + evt. kommentar for én beregning (uten heading)
  const buildBeregningTabell = (b: any): (Paragraph | Table)[] => {
    const blocks: (Paragraph | Table)[] = [];
    const resultRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: tableHeaderShading(theme),
            children: [new Paragraph({ children: [text("Parameter", { bold: true, size: 16, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: tableHeaderShading(theme),
            children: [new Paragraph({ children: [text("Verdi", { bold: true, size: 16, color: "FFFFFF" })] })],
          }),
        ],
      }),
      ...Object.entries(b.results ?? {}).map(([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [text(k.replace(/_/g, " "), { size: 16 })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [text(String(v), { size: 16 })] })],
            }),
          ],
        }),
      ),
    ];
    blocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: resultRows }));
    if (b.kommentar && String(b.kommentar).trim()) {
      blocks.push(new Paragraph({ children: [text("Kommentar:", { bold: true, size: 16 })] }));
      blocks.push(new Paragraph({ children: [text(String(b.kommentar), { italics: true, size: 16 })] }));
    }
    blocks.push(new Paragraph({ children: [text("")] }));
    return blocks;
  };

  const dimRowShading = (score: number | undefined, s: number) => {
    if (!score) return undefined;
    if (score === 5 || (score === 4 && s > 3)) {
      return { fill: FARGE_HEX.rod, type: ShadingType.CLEAR, color: "auto" };
    }
    if (score === 4) {
      return { fill: FARGE_HEX.gul, type: ShadingType.CLEAR, color: "auto" };
    }
    return undefined;
  };
  const dimTextColor = (score: number | undefined, s: number): string | undefined => {
    if (!score) return undefined;
    if (score === 5 || (score === 4 && s > 3)) return FARGE_TEKST.rod;
    if (score === 4) return FARGE_TEKST.gul;
    return undefined;
  };

  const buildKonsekvensSubTabell = (h: RosHendelse, hm: RosHendelse): Table => {
    const sE = h.sannsynlighetEtter ?? h.sannsynlighet;
    const subHeader = new TableRow({
      children: [
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: tableHeaderShading(theme),
          children: [new Paragraph({ children: [text("Dimensjon", { bold: true, size: 14, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: tableHeaderShading(theme),
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("Score", { bold: true, size: 14, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: tableHeaderShading(theme),
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("R", { bold: true, size: 14, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: tableHeaderShading(theme),
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("Score etter", { bold: true, size: 14, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: tableHeaderShading(theme),
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("R etter", { bold: true, size: 14, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: tableHeaderShading(theme),
          children: [new Paragraph({ children: [text("Begrunnelse", { bold: true, size: 14, color: "FFFFFF" })] })],
        }),
      ],
    });

    const subRows = (hm.konsekvensvurderinger || []).map((kv) => {
      const rowShade = dimRowShading(kv.score, h.sannsynlighet);
      const rowFg = dimTextColor(kv.score, h.sannsynlighet);
      const rDim = h.sannsynlighet * (kv.score || 0);
      const rDimE = kv.scoreEtter ? sE * kv.scoreEtter : null;
      const begrunnelseText = [
        kv.begrunnelse?.trim() || "",
        kv.begrunnelseEtter?.trim() ? `Etter tiltak: ${kv.begrunnelseEtter.trim()}` : "",
      ].filter(Boolean).join("\n");
      const begrunnelseParas = begrunnelseText
        ? begrunnelseText.split("\n").map((line) => new Paragraph({ children: [text(line, { size: 14, color: rowFg })] }))
        : [new Paragraph({ children: [text("", { size: 14 })] })];
      return new TableRow({
        children: [
          new TableCell({
            shading: rowShade,
            children: [new Paragraph({ children: [text(DIMENSJON_NAVN[kv.dimensjon], { bold: true, size: 14, color: rowFg })] })],
          }),
          new TableCell({
            shading: rowShade,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(String(kv.score ?? "—"), { bold: true, size: 14, color: rowFg })] })],
          }),
          new TableCell({
            shading: kv.score ? risikoShading(h.sannsynlighet, kv.score) : rowShade,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(String(rDim || "—"), { bold: true, size: 14, color: kv.score ? risikoTekstFarge(h.sannsynlighet, kv.score) : rowFg })] })],
          }),
          new TableCell({
            shading: rowShade,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(kv.scoreEtter ? String(kv.scoreEtter) : "—", { bold: true, size: 14, color: rowFg })] })],
          }),
          new TableCell({
            shading: rDimE !== null && kv.scoreEtter ? risikoShading(sE, kv.scoreEtter) : rowShade,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(rDimE !== null ? String(rDimE) : "—", { bold: true, size: 14, color: rDimE !== null && kv.scoreEtter ? risikoTekstFarge(sE, kv.scoreEtter) : rowFg })] })],
          }),
          new TableCell({
            shading: rowShade,
            children: begrunnelseParas,
          }),
        ],
      });
    });

    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [subHeader, ...subRows] });
  };

  // Dynamisk kapittelnummerering
  const harBowTie = !!(content.bowTies && content.bowTies.length > 0);
  const hendelseNr = "4";
  const beregningNr = "5";
  const risikobildeNr = "6";
  const tiltakNr = "7";
  const bowTieNr = "8";
  const oppsummeringNr = harBowTie ? "9" : "8";
  const revisjonNr = harBowTie ? "10" : "9";
  const tiltakIder = byggTiltakIder(content.tiltaksplan || []);

  const beregningIder = byggBeregningIder(content);
  const hendelseRows: TableRow[] = [hendelseHeader];
  content.hendelser.forEach((h, i) => {
    const hm0 = migrerHendelse(h);
    const forsyning0 = hm0.konsekvensvurderinger?.find((k) => k.dimensjon === "forsyningssikkerhet");
    const kForsyning = forsyning0?.score;
    const kForsyningEtter = forsyning0?.scoreEtter;
    const sE = h.sannsynlighetEtter ?? h.sannsynlighet;
    const r = kForsyning ? h.sannsynlighet * kForsyning : null;
    const rE = kForsyningEtter ? sE * kForsyningEtter : null;
    const dashCell = (pct: number) =>
      new TableCell({
        width: { size: pct, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("—", { size: 14, color: "94A3B8" })] })],
      });
    hendelseRows.push(
      new TableRow({
        children: [
          smallCell(String(i + 1), 3),
          smallCell(h.sarbarhet || "", 8),
          smallCell(h.hendelse || h.beskrivelse || h.tittel || "—", 9, true),
          smallCell(h.arsak || "", 7),
          smallCell(h.beskrivelseSannsynlighetFor || "", 8),
          smallCell(forsyning0?.begrunnelse || h.beskrivelseRisikoFor || "", 8),
          smallCell(String(h.sannsynlighet), 3),
          kForsyning ? smallCell(String(kForsyning), 3) : dashCell(3),
          kForsyning
            ? new TableCell({
                width: { size: 4, type: WidthType.PERCENTAGE },
                shading: risikoShading(h.sannsynlighet, kForsyning),
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [text(String(r), { bold: true, size: 16, color: risikoTekstFarge(h.sannsynlighet, kForsyning) })],
                  }),
                ],
              })
            : dashCell(4),
          smallCell(h.eksisterendeBarrierer || "", 5),
          smallCell(h.foreslatteTiltak || h.tiltak || "", 5),
          smallCell(h.beskrivelseEtter || "", 9),
          smallCell(String(sE), 3),
          kForsyningEtter ? smallCell(String(kForsyningEtter), 3) : dashCell(3),
          kForsyningEtter
            ? new TableCell({
                width: { size: 4, type: WidthType.PERCENTAGE },
                shading: risikoShading(sE, kForsyningEtter),
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [text(String(rE), { bold: true, size: 16, color: risikoTekstFarge(sE, kForsyningEtter) })],
                  }),
                ],
              })
            : dashCell(4),
          smallCell(h.restrisiko || "", 8),
          vurderingCell(h.usikkerhet, USIKK_SHADE, 4),
          vurderingCell(h.styrbarhet, STYRB_SHADE, 4),
        ],
      }),
    );

    const tilkTiltak = (content.tiltaksplan || []).filter((t) => (t.hendelseIds || []).includes(h.id));
    if (tilkTiltak.length > 0) {
      const liste = tilkTiltak.map((t) => `${tiltakIder.get(t.id) || "T?"} – ${t.tittel} [${TILTAK_STATUS_LABEL[t.status]}]`).join("; ");
      hendelseRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 18,
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: "EEF7FF", type: ShadingType.CLEAR, color: "auto" },
              children: [new Paragraph({ children: [text(`Tiltak: ${liste} – se kapittel ${tiltakNr} Tiltaksplan.`, { italics: true, size: 14 })] })],
            }),
          ],
        }),
      );
    }

    const tilknyttede = (content.beregninger || []).filter((b) => b.hendelseIds.includes(h.id));
    if (tilknyttede.length > 0) {
      const ids = tilknyttede.map((b) => beregningIder.get(b.id) || "B?").join(", ");
      hendelseRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 18,
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: "F7F9FC", type: ShadingType.CLEAR, color: "auto" },
              children: [new Paragraph({ children: [text(`Beregninger: ${ids} – se kapittel ${beregningNr} Beregningsgrunnlag.`, { italics: true, size: 14 })] })],
            }),
          ],
        }),
      );
    } else if (h.kreverBeregning) {
      hendelseRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 18,
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: "FFF3CD", type: ShadingType.CLEAR, color: "auto" },
              children: [new Paragraph({ children: [text(`Krever beregning – ikke registrert ennå${h.beregningTekst ? `: ${h.beregningTekst}` : ""}`, { bold: true, size: 14, color: "7A5A00" })] })],
            }),
          ],
        }),
      );
    }
    const hm = hm0;
    const kvs = hm.konsekvensvurderinger || [];
    const innhold: (Paragraph | Table)[] = kvs.length === 0
      ? [new Paragraph({ children: [text("Ingen konsekvensdimensjoner vurdert", { italics: true, size: 14, color: "64748B" })] })]
      : [
          new Paragraph({ children: [text("Konsekvensvurderinger per dimensjon", { bold: true, size: 16 })] }),
          buildKonsekvensSubTabell(h, hm),
        ];
    hendelseRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 18,
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: "F7F9FC", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 100, bottom: 100, left: 300, right: 100 },
            children: innhold,
          }),
        ],
      }),
    );

  });
  const hendelser: (Paragraph | Table)[] = [
    buildSectionHeading(theme, `${hendelseNr}. Hendelsesregister`),
    content.hendelser.length === 0
      ? para("Ingen hendelser registrert.")
      : new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: hendelseRows }),
  ];

  // Kap. 3 Beredskapsforskriftens krav
  const bfkVurderinger = normaliserBfkVurderinger(content.beredskapsforskrift);
  const bfkVurdMap = new Map(bfkVurderinger.map((v) => [v.paragrafId, v]));
  const hIdxAll = new Map(content.hendelser.map((h, i) => [h.id, i + 1]));
  const bfkStatusFill: Record<BfkVurderingStatus, string> = {
    vurdert: "DCFCE7",
    ikke_aktuell: "E5E7EB",
    ikke_vurdert: "FEE2E2",
  };
  const bfkAntallVurdert = bfkVurderinger.filter((v) => v.status !== "ikke_vurdert").length;
  const beredskapsforskriftBlocks: (Paragraph | Table)[] = [
    buildSectionHeading(theme, "3. Beredskapsforskriftens krav"),
    para(
      "Dokumenterer at relevante paragrafer i Forskrift om beredskap i kraftforsyningen (BFK) " +
        "er vurdert i ROS-analysen. For hver paragraf angis status, begrunnelse og hvilke " +
        "hendelser i kapittel " + hendelseNr + " som dekker kravet.",
    ),
    para(`Status: ${bfkAntallVurdert} av ${bfkVurderinger.length} paragrafer vurdert.`, { bold: true }),
  ];
  BFK_KATEGORI_REKKEFOLGE.forEach((kat) => {
    const ps = BFK_PARAGRAFER.filter((p) => p.kategori === kat);
    if (ps.length === 0) return;
    beredskapsforskriftBlocks.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [text(BFK_KATEGORI_LABEL[kat], { bold: true, size: 20 })],
      }),
    );
    const bfkHeader = new TableRow({
      tableHeader: true,
      children: [
        headerCell("Paragraf", 18),
        headerCell("Krav", 30),
        headerCell("Status", 12),
        headerCell("Begrunnelse", 28),
        headerCell("Hendelser", 12),
      ],
    });
    const bfkRows = ps.map((p) => {
      const v = bfkVurdMap.get(p.id);
      const status = v?.status || "ikke_vurdert";
      const hLabels = (v?.hendelseIds || [])
        .map((id) => hIdxAll.get(id))
        .filter((n): n is number => !!n)
        .map((n) => `H${n}`)
        .join(", ");
      return new TableRow({
        children: [
          cell(p.navn, 18, true),
          cell(p.utdrag, 30),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: { fill: bfkStatusFill[status], type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [text(BFK_STATUS_LABEL[status], { bold: true, size: 16 })] })],
          }),
          cell(v?.begrunnelse || "", 28),
          cell(hLabels || "—", 12),
        ],
      });
    });
    beredskapsforskriftBlocks.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [bfkHeader, ...bfkRows] }),
    );
  });


  // Kap. 4 Beregningsgrunnlag
  const alleBeregninger = content.beregninger || [];
  const grupperBer = new Map<string, RosBeregning[]>();
  alleBeregninger.forEach((b) => {
    const key = b.hendelseIds[0] || "_ikke";
    if (!grupperBer.has(key)) grupperBer.set(key, []);
    grupperBer.get(key)!.push(b);
  });

  const beregningsgrunnlag: (Paragraph | Table)[] = [
    buildSectionHeading(theme, `${beregningNr}. Beregningsgrunnlag`),
  ];
  if (alleBeregninger.length === 0) {
    beregningsgrunnlag.push(
      new Paragraph({
        children: [text("Ingen beregninger er tilknyttet hendelsene i denne analysen.", { italics: true })],
      }),
    );
  } else {
    const pushBeregning = (b: RosBeregning) => {
      const id = beregningIder.get(b.id) || "B?";
      const typeLabel = BEREGNING_LABELS[b.type] ?? String(b.type);
      beregningsgrunnlag.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_4,
          children: [text(`${id} – ${typeLabel}: ${b.label ?? ""}`, { bold: true, size: 18 })],
        }),
      );
      beregningsgrunnlag.push(...buildBeregningTabell(b));
    };
    content.hendelser.forEach((h, i) => {
      const liste = grupperBer.get(h.id);
      if (!liste || liste.length === 0) return;
      beregningsgrunnlag.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [text(
            `${beregningNr}.${i + 1} – Beregninger for hendelse ${i + 1}: ${h.tittel || h.hendelse || "—"}`,
            { bold: true, size: 22 },
          )],
        }),
      );
      liste.forEach(pushBeregning);
    });
    const ikke = grupperBer.get("_ikke");
    if (ikke && ikke.length > 0) {
      beregningsgrunnlag.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [text("Ikke tilknyttet hendelse", { bold: true, size: 22 })],
        }),
      );
      ikke.forEach(pushBeregning);
    }
  }

  // Kap. 6 Risikobilde – én matrise (eller før/etter par) per dimensjon
  const risikobildeBlocks: (Paragraph | Table)[] = [];
  {
    const dims = tilgjengeligeDimensjoner(content.hendelser);
    if (dims.length > 0) {
      const hIder = byggHendelseIder(content.hendelser);
      risikobildeBlocks.push(buildSectionHeading(theme, `${risikobildeNr}. Risikobilde`));
      risikobildeBlocks.push(
        para(
          "Risikobildet vises som en 5×5-matrise per konsekvensdimensjon som er vurdert på minst én hendelse. " +
            "Hver hendelse plottes med sin lesbare ID (H1, H2, …) i cellen som tilsvarer sannsynlighet og konsekvens. " +
            "Hvor «etter tiltak»-data finnes, vises den tilhørende matrisen ved siden av.",
        ),
      );

      const buildMatrise = (dim: KonsekvensDimensjon, bruk: "for" | "etter"): Table => {
        // Grupper hendelser per (s,k)
        const cellMap = new Map<string, string[]>();
        content.hendelser.forEach((h) => {
          const kv = (h.konsekvensvurderinger || []).find((d) => d.dimensjon === dim);
          if (!kv) return;
          const s = bruk === "etter" ? h.sannsynlighetEtter : h.sannsynlighet;
          const k = bruk === "etter" ? kv.scoreEtter : kv.score;
          if (!s || !k) return;
          const key = `${s}-${k}`;
          const arr = cellMap.get(key) || [];
          arr.push(hIder.get(h.id) || "");
          cellMap.set(key, arr);
        });

        const rows: TableRow[] = [];
        // header row
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 12, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("S \\ K", { bold: true, size: 14 })] })],
                shading: tableHeaderShading(theme),
              }),
              ...[1, 2, 3, 4, 5].map((k) =>
                new TableCell({
                  width: { size: 17.6, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(`K=${k}`, { bold: true, size: 14, color: "FFFFFF" })] })],
                  shading: tableHeaderShading(theme),
                }),
              ),
            ],
          }),
        );
        for (const s of [5, 4, 3, 2, 1]) {
          rows.push(
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 12, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text(`S=${s}`, { bold: true, size: 14, color: "FFFFFF" })] })],
                  shading: tableHeaderShading(theme),
                }),
                ...[1, 2, 3, 4, 5].map((k) => {
                  const ids = cellMap.get(`${s}-${k}`) || [];
                  const labelTxt = ids.length > 0 ? ids.join(", ") : String(s * k);
                  return new TableCell({
                    width: { size: 17.6, type: WidthType.PERCENTAGE },
                    shading: risikoShading(s, k),
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [text(labelTxt, { bold: true, size: ids.length > 0 ? 14 : 16, color: risikoTekstFarge(s, k) })],
                      }),
                    ],
                  });
                }),
              ],
            }),
          );
        }
        return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
      };

      dims.forEach((dim) => {
        risikobildeBlocks.push(new Paragraph({ children: [text("")] }));
        risikobildeBlocks.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [text(DIMENSJON_NAVN[dim], { bold: true, size: 22 })],
          }),
        );
        risikobildeBlocks.push(para("Risiko før tiltak", { bold: true }));
        risikobildeBlocks.push(buildMatrise(dim, "for"));
        if (harEtterData(content.hendelser, dim)) {
          risikobildeBlocks.push(new Paragraph({ children: [text("")] }));
          risikobildeBlocks.push(para("Risiko etter tiltak", { bold: true }));
          risikobildeBlocks.push(buildMatrise(dim, "etter"));
        }
        const soner = tellRisikoSoner(content.hendelser, dim, "for");
        risikobildeBlocks.push(
          para(
            `${soner.rod} hendelser i rød sone · ${soner.gul} i gul sone · ${soner.gronn} i grønn sone (før tiltak).`,
            { bold: true },
          ),
        );
      });
    }
  }



  // Tiltaksplan
  const tiltaksplanBlocks: (Paragraph | Table)[] = [
    buildSectionHeading(theme, `${tiltakNr}. Tiltaksplan`),
    para(
      "Strukturert oversikt over tiltak som skal gjennomføres for å redusere risiko. " +
        "Hvert tiltak har ansvarlig person, frist for gjennomføring og status. " +
        "Sortert med besluttede tiltak og høy effekt øverst. Passerte frister er markert.",
    ),
  ];
  const tiltakSortert = sorterTiltakEtterPrioritet(content.tiltaksplan || []);
  if (tiltakSortert.length === 0) {
    tiltaksplanBlocks.push(para("Ingen tiltak registrert."));
  } else {
    const hIdx = new Map(content.hendelser.map((h, i) => [h.id, i + 1]));
    const tHeader = new TableRow({
      tableHeader: true,
      children: [
        headerCell("ID", 5),
        headerCell("Tittel", 18),
        headerCell("Kategori", 11),
        headerCell("Ansvarlig", 10),
        headerCell("Frist", 9),
        headerCell("Status", 10),
        headerCell("Effekt", 7),
        headerCell("Kostnad", 7),
        headerCell("Hendelser", 8),
        headerCell("Kommentar", 15),
      ],
    });
    const tRows = tiltakSortert.map((t) => {
      const passert = erFristPassert(t);
      const hLabels = (t.hendelseIds || [])
        .map((id) => hIdx.get(id))
        .filter((n): n is number => !!n)
        .map((n) => `H${n}`)
        .join(", ");
      return new TableRow({
        children: [
          cell(tiltakIder.get(t.id) || "T?", 5),
          cell(t.tittel || "—", 18),
          cell(TILTAK_KATEGORI_LABEL[t.kategori], 11),
          cell(t.ansvarlig || "—", 10),
          new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            shading: passert ? { fill: "FCE4E4", type: ShadingType.CLEAR, color: "auto" } : undefined,
            children: [new Paragraph({ children: [text(formaterFrist(t.frist), { bold: passert, color: passert ? "B91C1C" : undefined, size: 16 })] })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: TILTAK_STATUS_FILL[t.status], type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [text(TILTAK_STATUS_LABEL[t.status], { bold: true, size: 16 })] })],
          }),
          cell(t.effektVurdering ? VURDERING_LABEL[t.effektVurdering] : "—", 7),
          cell(t.kostnadVurdering ? VURDERING_LABEL[t.kostnadVurdering] : "—", 7),
          cell(hLabels || "—", 8),
          cell(t.kommentar || "", 15),
        ],
      });
    });
    tiltaksplanBlocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [tHeader, ...tRows] }));
  }




  // Bow-tie (kun hvis registrert)
  const bowTieBlocks: (Paragraph | Table)[] = [];
  if (harBowTie) {
    bowTieBlocks.push(buildSectionHeading(theme, `${bowTieNr}. Bow-tie analyse`));
    bowTieBlocks.push(
      para(
        `Bow-tie-analysen knytter registrerte hendelser fra kapittel ${hendelseNr} til overordnede uønskede topphendelser. ` +
          "Dette synliggjør hvilke årsaker som kan lede til samme topphendelse, og hvilke tiltak som virker på tvers.",
      ),
    );
    (content.bowTies || []).forEach((bt, idx) => {
      const arsaker = bt.hendelseIds
        .map((id) => content.hendelser.find((h) => h.id === id))
        .filter((h): h is NonNullable<typeof h> => !!h);
      bowTieBlocks.push(new Paragraph({ children: [text("")] }));
      bowTieBlocks.push(para(`${bowTieNr}.${idx + 1} ${bt.navn || "Uten navn"}`, { bold: true, size: 24 }));
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

      // Eksisterende barrierer (forutsetninger) for de tilknyttede årsakshendelsene
      const arsakerMedBarrierer = arsaker.filter((a) => a.eksisterendeBarrierer && a.eksisterendeBarrierer.trim());
      if (arsakerMedBarrierer.length > 0) {
        bowTieBlocks.push(new Paragraph({ children: [text("")] }));
        bowTieBlocks.push(para("Eksisterende barrierer (forutsetninger for risikovurderingen)", { bold: true }));
        const ebHeader = new TableRow({
          children: [
            smallHeader("Hendelse", 35),
            smallHeader("Eksisterende barrierer", 65),
          ],
        });
        const ebRows: TableRow[] = [ebHeader];
        arsakerMedBarrierer.forEach((a) => {
          ebRows.push(
            new TableRow({
              children: [
                smallCell(a.tittel || a.sarbarhet || a.hendelse || "—", 35, true),
                smallCell(a.eksisterendeBarrierer || "", 65),
              ],
            }),
          );
        });
        bowTieBlocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ebRows }));
      }


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
        fb.forEach((b, bi) => {
          const navn = b.arsakIds
            .map((id) => {
              const a = arsaker.find((x) => x.id === id);
              return a?.tittel || a?.sarbarhet || a?.hendelse || "";
            })
            .filter(Boolean)
            .join(", ");
          const suffix = navn ? ` (dekker: ${navn})` : "";
          const tag = b.kilde === "ai" ? " [AI]" : "";
          bowTieBlocks.push(para(`• B${bi + 1} – ${b.tekst}${tag}${suffix}`));
        });

        // Dekningsmatrise (årsak × barriere)
        if (arsaker.length > 0) {
          bowTieBlocks.push(new Paragraph({ children: [text("")] }));
          bowTieBlocks.push(
            para("Dekningsmatrise – hvilke barrierer som dekker hver årsak", { bold: true }),
          );
          const matrixHeader = new TableRow({
            children: [
              smallHeader("Årsak", 40),
              ...fb.map((_, bi) => smallHeader(`B${bi + 1}`, Math.floor(60 / fb.length))),
            ],
          });
          const matrixRows: TableRow[] = [matrixHeader];
          arsaker.forEach((a) => {
            matrixRows.push(
              new TableRow({
                children: [
                  smallCell(a.tittel || a.sarbarhet || a.hendelse || "—", 40, true),
                  ...fb.map((b) => {
                    const dekket = b.arsakIds.includes(a.id);
                    return new TableCell({
                      width: { size: Math.floor(60 / fb.length), type: WidthType.PERCENTAGE },
                      shading: dekket
                        ? { type: ShadingType.CLEAR, color: "auto", fill: "ECFDF5" }
                        : undefined,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            text(dekket ? "●" : "—", {
                              bold: true,
                              size: 16,
                              color: dekket ? "065F46" : "CBD5E1",
                            }),
                          ],
                        }),
                      ],
                    });
                  }),
                ],
              }),
            );
          });
          bowTieBlocks.push(
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: matrixRows }),
          );
        }
      }

      // Konsekvensreduserende tiltak (AI/manuelle)
      const kt = (bt.konsekvensReduserende || []).filter((t: any) => t.tekst?.trim());
      if (kt.length > 0 && bt.konsekvenser.length > 0) {
        bowTieBlocks.push(new Paragraph({ children: [text("")] }));
        bowTieBlocks.push(para("Konsekvensreduserende tiltak", { bold: true }));
        kt.forEach((t: any, ti: number) => {
          const navn = (t.konsekvensIndekser || [])
            .filter((ki: number) => ki >= 0 && ki < bt.konsekvenser.length)
            .map((ki: number) => `K${ki + 1}`)
            .join(", ");
          const suffix = navn ? ` (dekker: ${navn})` : "";
          const tag = t.kilde === "ai" ? " [AI]" : "";
          bowTieBlocks.push(para(`• T${ti + 1} – ${t.tekst}${tag}${suffix}`));
        });

        // Dekningsmatrise (konsekvens × tiltak)
        bowTieBlocks.push(new Paragraph({ children: [text("")] }));
        bowTieBlocks.push(
          para("Dekningsmatrise – hvilke tiltak som reduserer hver konsekvens", { bold: true }),
        );
        const ktHeader = new TableRow({
          children: [
            smallHeader("Konsekvens", 40),
            ...kt.map((_: any, ti: number) => smallHeader(`T${ti + 1}`, Math.floor(60 / kt.length))),
          ],
        });
        const ktRows: TableRow[] = [ktHeader];
        bt.konsekvenser.forEach((k: string, ki: number) => {
          ktRows.push(
            new TableRow({
              children: [
                smallCell(`K${ki + 1} – ${k}`, 40, true),
                ...kt.map((t: any) => {
                  const dekket = (t.konsekvensIndekser || []).includes(ki);
                  return new TableCell({
                    width: { size: Math.floor(60 / kt.length), type: WidthType.PERCENTAGE },
                    shading: dekket
                      ? { type: ShadingType.CLEAR, color: "auto", fill: "ECFDF5" }
                      : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          text(dekket ? "●" : "—", {
                            bold: true,
                            size: 16,
                            color: dekket ? "065F46" : "CBD5E1",
                          }),
                        ],
                      }),
                    ],
                  });
                }),
              ],
            }),
          );
        });
        bowTieBlocks.push(
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ktRows }),
        );
      }

      // Felles barrierer (fritekst)
      if (bt.fellesBarrierer?.trim()) {
        bowTieBlocks.push(new Paragraph({ children: [text("")] }));
        bowTieBlocks.push(para("Felles barrierer / tiltak (fritekst)", { bold: true }));
        bowTieBlocks.push(para(bt.fellesBarrierer));
      }
    });
  }

  // Oppsummering & revisjon (kapittelnummer beregnet over)


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
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          },
        },
        headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
        footers: { default: buildFooter(theme) },
        children: [...beredskapsforskriftBlocks],
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
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          },
        },
        headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
        footers: { default: buildFooter(theme) },
        children: [...beregningsgrunnlag],
      },
      ...(risikobildeBlocks.length > 0
        ? [
            {
              properties: {
                type: SectionType.NEXT_PAGE,
                page: {
                  size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
                },
              },
              headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
              footers: { default: buildFooter(theme) },
              children: [...risikobildeBlocks],
            },
          ]
        : []),
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          },
        },
        headers: { default: buildHeader(theme, { logo, documentLabel: "ROS-analyse" }) },
        footers: { default: buildFooter(theme) },
        children: [...tiltaksplanBlocks],
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
