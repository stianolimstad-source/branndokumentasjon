import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import {
  BELIGGENHET_KRAV,
  DOKUMENTASJON_KRAV,
  KONTROLL_KRAV,
  OPPSAMLING_KRAV,
  PUMPE_KRAV,
  ROERLEDNING_KRAV,
  SIKKERHETSAVSTANDER,
  STYKKGODS_GRENSER,
  TANK_KRAV,
  VENTIL_KRAV,
  type BygningsTypeInfo,
} from "@/lib/brensellagring-krav";
import type {
  BranntekniskeTiltakData,
  BrenselSectionKey,
  InnmeldingVurderingData,
  OverskridelseRowData,
  PlannedAmountsData,
} from "@/components/brensellagring/BrensellagringPreview";

export interface BrensellagringWordData {
  valgtBygg: BygningsTypeInfo | null;
  firmaNavn?: string;
  kunde?: string;
  utarbeidetAv?: string;
  ksAnsvarlig?: string;
  logoUrl?: string;
  prosjektNavn?: string;
  adresse?: string;
  visibleSections: Set<BrenselSectionKey>;
  selectedKravIds: Set<string>;
  salgslokaleInkludert?: boolean;
  salgslokaleKommentar?: string;
  salgslokaleTiltakTekst?: string;
  totalInkludert?: boolean;
  totalAmounts?: PlannedAmountsData;
  totalKommentar?: string;
  plannedInkludert?: boolean;
  plannedAmounts?: PlannedAmountsData;
  plannedKommentar?: string;
  overskridelseInkludert?: boolean;
  overskridelseRows?: OverskridelseRowData[];
  overskridelseArealgrunnlag?: string;
  overskridelseVurderingstekst?: string;
  overskridelseKonklusjon?: string;
  overskridelseTiltak?: string;
  brannenergiInkludert?: boolean;
  brannenergiKommentar?: string;
  generellBrannenergiMJm2?: string;
  etasjer?: { id: string; navn: string; lengde: string; bredde: string; hoyde: string }[];
  innledning?: string;
  energitetthet?: Record<keyof PlannedAmountsData, { verdi: number; enhet: "MJ/kg" | "MJ/L"; kilde: string }>;
  innmeldingInkludert?: boolean;
  innmeldingKommentar?: string;
  innmeldingVurdering?: InnmeldingVurderingData;
  branntekniskeTiltakInkludert?: boolean;
  branntekniskeTiltak?: BranntekniskeTiltakData;
  harTankanlegg?: boolean | null;
}

const TABLE_WIDTH = 9026;
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const getImageSize = (buffer: ArrayBuffer, type: "png" | "jpg") => {
  const view = new DataView(buffer);
  if (type === "png") return { width: view.getUint32(16), height: view.getUint32(20) };
  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
    offset += 2 + length;
  }
  return { width: 170, height: 74 };
};

const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString("nb-NO", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

const text = (value: string, options: { bold?: boolean; size?: number; color?: string } = {}) =>
  new TextRun({ text: value, font: "Arial", size: options.size ?? 20, bold: options.bold, color: options.color });

const paragraph = (value: string, options: { bold?: boolean; size?: number; color?: string; after?: number } = {}) =>
  new Paragraph({ spacing: { after: options.after ?? 160 }, children: [text(value, options)] });

const multiline = (value?: string) =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => paragraph(line));

const heading = (title: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1E3A5F", space: 4 } },
    children: [text(title, { bold: true, size: 26, color: "1E3A5F" })],
  });

const note = (title: string, value: string) => [
  new Paragraph({ spacing: { before: 180, after: 80 }, children: [text(title, { bold: true, color: "1E3A5F" })] }),
  ...multiline(value),
];

const cell = (value: string, width: number, options: { header?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bold?: boolean; color?: string } = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: BORDERS,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    shading: options.header ? { fill: "E8EEF5", type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        alignment: options.align,
        children: [text(value, { bold: options.header || options.bold, size: 18, color: options.color || (options.header ? "1E3A5F" : undefined) })],
      }),
    ],
  });

const table = (headers: string[], rows: string[][], widths: number[]) =>
  new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    margins: { top: 70, bottom: 160 },
    rows: [
      new TableRow({ children: headers.map((header, index) => cell(header, widths[index], { header: true })) }),
      ...rows.map((row) => new TableRow({ children: row.map((value, index) => cell(value || "—", widths[index])) })),
    ],
  });

const headerBar = (title: string, subtitle?: string) =>
  new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [TABLE_WIDTH],
    margins: { top: 180, bottom: 180 },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
            margins: { top: 220, bottom: 220, left: 300, right: 300 },
            children: [
              new Paragraph({ spacing: { after: 30 }, children: [text("KRAVDOKUMENT", { size: 16, color: "FFFFFF", bold: true })] }),
              new Paragraph({ spacing: { after: subtitle ? 60 : 0 }, children: [text(title, { size: 32, color: "FFFFFF", bold: true })] }),
              ...(subtitle ? [new Paragraph({ children: [text(subtitle, { size: 20, color: "D7E3F0" })] })] : []),
            ],
          }),
        ],
      }),
    ],
  });

async function logoParagraph(logoUrl?: string): Promise<Paragraph | null> {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    const type = contentType.includes("png") ? "png" : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : null;
    if (!type) return null;
    const imageSize = getImageSize(buffer, type);
    const logoWidth = 220;
    const logoHeight = Math.round((imageSize.height / imageSize.width) * logoWidth);
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
      children: [
        new ImageRun({
          type,
          data: buffer,
          transformation: { width: logoWidth, height: logoHeight },
          altText: { title: "Firmalogo", description: "Firmalogo", name: "Firmalogo" },
        }),
      ],
    });
  } catch {
    return null;
  }
}

const plannedLabels: Record<keyof PlannedAmountsData, { label: string; enhet: string }> = {
  gass_kat1: { label: "Brannfarlig gass, kategori 1", enhet: "kg" },
  gass_kat2: { label: "Brannfarlig gass, kategori 2", enhet: "kg" },
  vaeske_kat1: { label: "Brannfarlig væske, kategori 1 og 2", enhet: "liter" },
  vaeske_kat2: { label: "Brannfarlig væske, kategori 2", enhet: "liter" },
  vaeske_kat3: { label: "Brannfarlig væske, kategori 3", enhet: "liter" },
  diesel_fyringsolje: { label: "Diesel / fyringsolje", enhet: "liter" },
  aerosoler: { label: "Aerosoler", enhet: "liter" },
};

const safeFilename = (value: string) => value.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_").slice(0, 80);

export async function exportBrensellagringToWord(data: BrensellagringWordData) {
  const children: (Paragraph | Table)[] = [];
  const logo = await logoParagraph(data.logoUrl);
  if (logo) children.push(logo);

  children.push(headerBar("Lagring av brannfarlig stoff", data.valgtBygg?.navn));

  children.push(
    new Paragraph({ spacing: { after: 180 }, children: [] }),
    table(
      ["Forhold", "Opplysning"],
      [
        ["Firma", data.firmaNavn || ""],
        ["Kunde", data.kunde || ""],
        ["Prosjekt", data.prosjektNavn || ""],
        ["Adresse", data.adresse || ""],
        ["Bygningstype", data.valgtBygg?.navn || ""],
        ["Utarbeidet av", data.utarbeidetAv || ""],
        ["KS", data.ksAnsvarlig || ""],
        ["Dato", new Date().toLocaleDateString("nb-NO")],
        ["Regelverk", "VTEK § 11-8, DSB Temaveiledning om oppbevaring av farlig stoff"],
      ].filter((row) => row[1]),
      [2400, 6626],
    ),
  );

  if (data.valgtBygg?.beskrivelse) children.push(paragraph(data.valgtBygg.beskrivelse, { color: "64748B", after: 220 }));
  if (data.innledning?.trim()) children.push(heading("Innledning"), ...multiline(data.innledning));

  let sectionNumber = 1;
  const section = (title: string) => heading(`${sectionNumber++}. ${title}`);

  const totalRows = data.totalAmounts
    ? (Object.keys(plannedLabels) as (keyof PlannedAmountsData)[])
        .map((key) => ({ key, ...plannedLabels[key], value: key === "vaeske_kat2" ? "" : (data.totalAmounts?.[key] || "").trim() }))
        .filter((row) => row.value && Number(row.value) > 0)
    : [];

  if (data.totalInkludert && totalRows.length > 0) {
    children.push(
      section("Total mengde brannfarlig stoff"),
      paragraph("Oversikt over samlet mengde brannfarlig stoff i virksomheten/anlegget. Mengder i salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare inngår, og danner grunnlag for vurdering av innmeldingsplikt til DSB.", { color: "64748B" }),
      table(["Kategori", "Total mengde"], totalRows.map((row) => [row.label, `${formatNumber(Number(row.value))} ${row.enhet}`]), [6100, 2926]),
    );
    if (data.totalKommentar?.trim()) children.push(...note("Kommentar", data.totalKommentar));
  }

  const plannedRows = data.plannedAmounts
    ? (Object.keys(plannedLabels) as (keyof PlannedAmountsData)[])
        .map((key) => ({ key, ...plannedLabels[key], value: key === "vaeske_kat2" ? "" : (data.plannedAmounts?.[key] || "").trim() }))
        .filter((row) => row.value && Number(row.value) > 0)
    : [];

  if (data.plannedInkludert && plannedRows.length > 0) {
    children.push(
      section("Planlagt mengde utover DSB sin veiledning i salgslokalet"),
      paragraph("Oversikt over mengder brannfarlig stoff som ønskes plassert i selve salgslokalet utover DSB sin anbefalte mengde. Mengder i brannsikre skap eller egne brannceller/lagerrom beregnet for brannfarlig vare inngår ikke her.", { color: "64748B" }),
      table(["Kategori", "Planlagt mengde"], plannedRows.map((row) => [row.label, `${formatNumber(Number(row.value))} ${row.enhet}`]), [6100, 2926]),
    );
    if (data.plannedKommentar?.trim()) children.push(...note("Kommentar", data.plannedKommentar));
  }

  const energiBidrag = data.plannedAmounts && data.energitetthet
    ? (Object.keys(plannedLabels) as (keyof PlannedAmountsData)[])
        .map((key) => {
          const mengde = Number((data.plannedAmounts?.[key] || "").trim());
          const energi = data.energitetthet?.[key];
          if (!(mengde > 0) || !energi) return null;
          return { key, label: plannedLabels[key].label, mengde, enhetInn: plannedLabels[key].enhet, energi: energi.verdi, enhetEnergi: energi.enhet, totalMJ: mengde * energi.verdi };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
    : [];
  const etasjer = (data.etasjer || []).map((et) => {
    const l = Number(et.lengde) || 0;
    const b = Number(et.bredde) || 0;
    const h = Number(et.hoyde) || 0;
    const gyldig = l > 0 && b > 0 && h > 0;
    return { ...et, l, b, h, gyldig, gulvareal: gyldig ? l * b : 0, omhylling: gyldig ? 2 * (l * b) + 2 * (l * h) + 2 * (b * h) : 0 };
  });
  const gulvareal = etasjer.reduce((sum, et) => sum + et.gulvareal, 0);
  const omhylling = etasjer.reduce((sum, et) => sum + et.omhylling, 0);
  const generellMJm2 = Number(data.generellBrannenergiMJm2) || 0;
  const generellMJ = generellMJm2 * gulvareal;
  const tilleggsMJ = energiBidrag.reduce((sum, row) => sum + row.totalMJ, 0);
  const totalMJ = generellMJ + tilleggsMJ;

  if (data.brannenergiInkludert && energiBidrag.length > 0) {
    children.push(
      section("Brannenergi i salgslokalet"),
      table(
        ["Tillegg fra brannfarlige varer i salgslokalet", "Mengde", "Energi", "Bidrag"],
        energiBidrag.map((row) => [row.label, `${formatNumber(row.mengde)} ${row.enhetInn}`, `${row.energi} ${row.enhetEnergi}`, `${formatNumber(row.totalMJ)} MJ`]),
        [3800, 1700, 1700, 1826],
      ),
    );
    if (omhylling > 0) {
      children.push(
        table(
          ["Beregningsdel", "Total brannenergi", "Spesifikk brannenergi"],
          [
            ["Generell brannenergi i salgslokalet", `${formatNumber(generellMJ)} MJ`, `${formatNumber(generellMJ / omhylling, 1)} MJ/m²`],
            ["Tillegg fra brannfarlige varer i salgslokalet", `${formatNumber(tilleggsMJ)} MJ`, `${formatNumber(tilleggsMJ / omhylling, 1)} MJ/m²`],
            ["Sum for salgslokalet", `${formatNumber(totalMJ)} MJ`, `${formatNumber(totalMJ / omhylling, 1)} MJ/m²`],
          ],
          [4200, 2400, 2426],
        ),
      );
    }
    if (data.brannenergiKommentar?.trim()) children.push(...note("Kommentar", data.brannenergiKommentar));
  }

  const tiltak = data.branntekniskeTiltak;
  const tiltakRows = tiltak
    ? [
        ["Brannalarmanlegg", tiltak.brannalarm.status, [tiltak.brannalarm.beskrivelse, tiltak.brannalarm.kommentar, tiltak.brannalarm.rapporttekst].filter(Boolean).join("\n")],
        ["Røykventilasjon", tiltak.roykventilasjon.status, [tiltak.roykventilasjon.type, tiltak.roykventilasjon.beskrivelse, tiltak.roykventilasjon.rapporttekst].filter(Boolean).join("\n")],
        ["Automatisk slokkeanlegg", tiltak.slokkeanlegg.status, [tiltak.slokkeanlegg.type, tiltak.slokkeanlegg.beskrivelse, tiltak.slokkeanlegg.rapporttekst].filter(Boolean).join("\n")],
      ].filter((row) => row.some((value) => value.trim()))
    : [];
  if (data.branntekniskeTiltakInkludert && tiltak && tiltakRows.length > 0) {
    children.push(section("Branntekniske tiltak i bygget"), table(["Tiltak", "Status", "Beskrivelse og virkning"], tiltakRows, [2200, 2000, 4826]));
    if (tiltak.generellKommentar.trim()) children.push(...note("Felles kommentar", tiltak.generellKommentar));
  }

  if (data.innmeldingInkludert && data.innmeldingVurdering?.harMengder) {
    children.push(
      section("Innmeldingsplikt til DSB"),
      paragraph(data.innmeldingVurdering.trengerInnmelding ? "Anlegget er innmeldingspliktig til DSB." : "Anlegget er ikke innmeldingspliktig.", { bold: true }),
      table(
        ["Stoffgruppe", "Total mengde", "Innmeldingsgrense", "Status", "Margin"],
        data.innmeldingVurdering.grupper.map((g) => [
          g.kategori,
          g.sum > 0 ? `${formatNumber(g.sum)} L` : "—",
          `${formatNumber(g.grenseLiter)} L`,
          g.status === "over" ? "Innmeldingspliktig" : g.status === "under" ? "Under grense" : "Ikke aktuelt",
          g.status === "under" ? `${formatNumber(g.gjenstaende)} L til grensen` : "",
        ]),
        [2600, 1600, 1700, 1700, 1426],
      ),
    );
    if (data.innmeldingKommentar?.trim()) children.push(...note("Kommentar", data.innmeldingKommentar));
  }

  if (data.salgslokaleInkludert) {
    children.push(
      section("Største tillatte mengder i salgslokaler"),
      table(
        ["Salgslokalets areal", "Aerosoler", "Brannfarlig gass", "Br.f. væske kat. 1 og 2", "Br.f. væske kat. 3"],
        STYKKGODS_GRENSER.map((g) => [g.arealBeskrivelse, `${g.aerosoler} L`, g.brannfarligGass, `${g.brannfarligVaeskeKat1og2} L`, `${formatNumber(g.brannfarligVaeskeKat3)} L`]),
        [2300, 1400, 1700, 1900, 1726],
      ),
    );
    if (data.salgslokaleTiltakTekst?.trim()) children.push(...note("Vurdering av høyere mengder / kompenserende tiltak", data.salgslokaleTiltakTekst));
    if (data.salgslokaleKommentar?.trim()) children.push(...note("Kommentar", data.salgslokaleKommentar));
  }

  const selected = data.selectedKravIds;
  const selBeliggenhet = BELIGGENHET_KRAV.filter((_, i) => selected.has(`beliggenhet_${i}`));
  const selTank = TANK_KRAV.filter((_, i) => selected.has(`tank_${i}`));
  const selPumpe = PUMPE_KRAV.filter((_, i) => selected.has(`pumpe_${i}`));
  const selOppsamling = OPPSAMLING_KRAV.filter((_, i) => selected.has(`oppsamling_${i}`));
  const selRoer = ROERLEDNING_KRAV.filter((_, i) => selected.has(`roer_${i}`));
  const selVentil = VENTIL_KRAV.filter((_, i) => selected.has(`ventil_${i}`));
  const selKontroll = KONTROLL_KRAV.map((krav, index) => ({ krav, index })).filter(({ krav, index }) => selected.has(`kontroll_${index}`) && (data.harTankanlegg !== false || krav.gjelder === "alle"));
  const selDok = DOKUMENTASJON_KRAV.filter((_, i) => selected.has(`dok_${i}`));

  if (selBeliggenhet.length > 0) children.push(section("Beliggenhet og utforming"), ...selBeliggenhet.flatMap((krav) => note(krav.tittel, krav.beskrivelse)));
  if (data.visibleSections.has("avstander")) children.push(section("Sikkerhetsavstander"), table(["Objekt", "Kat. 1 og 2", "Kat. 3", "Diesel/fyringsolje"], SIKKERHETSAVSTANDER.map((rad) => [rad.objekt, rad.kat1og2, rad.kat3, rad.dieselFyringsolje]), [3100, 1900, 1900, 2126]));
  if (selTank.length > 0 || selPumpe.length > 0) children.push(section("Krav til tanker"), ...[...selTank, ...selPumpe].flatMap((krav) => note(krav.tittel, krav.beskrivelse)));
  if (selOppsamling.length > 0) children.push(section("Oppsamling og overfyllingsvern"), ...selOppsamling.flatMap((krav) => note(krav.tittel, krav.beskrivelse)));
  if (selRoer.length > 0 || selVentil.length > 0) children.push(section("Rørledninger og ventiler"), ...[...selRoer, ...selVentil].flatMap((krav) => note(krav.tittel, krav.beskrivelse)));
  if (selKontroll.length > 0) children.push(section("Kontroll og tilstandskontroll"), table(["Kontrolltype", "Beskrivelse", "Intervall"], selKontroll.map(({ krav }) => [krav.tittel, krav.beskrivelse, krav.intervall || "—"]), [2600, 4826, 1600]));
  if (selDok.length > 0) children.push(section("Dokumentasjonskrav"), table(["Type dokumentasjon", "Referanse"], selDok.map((dok) => [dok.type, dok.referanse]), [7026, 2000]));

  if (data.visibleSections.has("mengder") && data.valgtBygg) {
    children.push(section("Tillatte mengder"), table(["Brenseltype", "Maks mengde", "Status"], data.valgtBygg.grenser.map((g) => [g.brenselNavn, g.maksLiter === null && !g.maksKg ? "—" : g.maksKg ? `${formatNumber(g.maksKg)} kg` : `${formatNumber(g.maksLiter || 0)} liter`, g.maksLiter === null && !g.maksKg ? "Ikke tillatt" : "Tillatt"]), [4700, 2200, 2126]));
  }
  if (data.visibleSections.has("konstruksjon") && data.valgtBygg) {
    children.push(section("Konstruksjonskrav"));
    data.valgtBygg.grenser.filter((g) => g.maksLiter !== null || g.maksKg).forEach((g) => {
      children.push(paragraph(g.brenselNavn, { bold: true, color: "1E3A5F" }));
      if (g.romKrav.length > 0) children.push(table(["Kategori", "Krav", "Ansvar", "Referanse"], g.romKrav.map((krav) => [krav.kategori, krav.tekst, krav.ansvar, krav.referanse?.label || "—"]), [1600, 5026, 1000, 1400]));
    });
  }

  if (data.overskridelseInkludert && data.overskridelseRows && data.overskridelseRows.length > 0) {
    children.push(
      section("Vurdering av mengde over anbefalt DSB-mengde"),
      paragraph(`Vurderingen sammenligner planlagte mengder med anbefalte mengder i DSB sin temaveiledning.${data.overskridelseArealgrunnlag ? ` Arealgrunnlag for salgslokale: ${data.overskridelseArealgrunnlag} m².` : ""}`, { color: "64748B" }),
      table(
        ["Stoffgruppe", "Anbefalt", "Planlagt", "Overskridelse", "Vurdert tillatt"],
        data.overskridelseRows.map((row) => [
          row.stoffgruppe,
          `${formatNumber(row.anbefaltMengde)} ${row.enhet}`,
          `${formatNumber(row.planlagtMengde)} ${row.enhet}`,
          `${formatNumber(row.overskridelse)} ${row.enhet} (${row.overskridelseProsent.toFixed(0)} %)`,
          row.vurdertTillattMengde || `${formatNumber(row.planlagtMengde)} ${row.enhet}`,
        ]),
        [2400, 1550, 1550, 1900, 1626],
      ),
    );
    if (data.overskridelseTiltak?.trim()) children.push(...note("Prosjektspesifikke tiltak", data.overskridelseTiltak));
    if (data.overskridelseVurderingstekst?.trim()) children.push(...note("Vurdering", data.overskridelseVurderingstekst));
    if (data.overskridelseKonklusjon?.trim()) children.push(...note("Konklusjon og avgrensning", data.overskridelseKonklusjon));
  }

  children.push(
    new Paragraph({ spacing: { before: 360, after: 80 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: "D9E2EC", space: 8 } }, children: [text("Kilde: DSB Temaveiledning om oppbevaring av farlig stoff og VTEK § 11-8 (TEK17).", { size: 16, color: "64748B" })] }),
    new Paragraph({ children: [text("Dokumentet er generert automatisk og skal kvalitetssikres av ansvarlig brannrådgiver.", { size: 16, color: "64748B" })] }),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 1 } },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, right: 1440, bottom: 900, left: 1440 } } },
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [text("Side ", { size: 16, color: "64748B" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "64748B" })] })] }) },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const name = data.prosjektNavn?.trim() ? `Brensellagring_${safeFilename(data.prosjektNavn)}.docx` : "Brensellagring.docx";
  saveAs(blob, name);
}
