import {
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  BorderStyle,
} from "docx";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------

export type TemplateId = "klassisk" | "moderne" | "minimalistisk";

export const TEMPLATE_OPTIONS: { id: TemplateId; name: string; description: string }[] = [
  { id: "klassisk", name: "Klassisk", description: "Blå/grå, Calibri, enkel forside med logo øverst" },
  { id: "moderne", name: "Moderne", description: "Mørk aksent, Arial, fullsides farget forside" },
  { id: "minimalistisk", name: "Minimalistisk", description: "Sort/hvit, Georgia, ren typografisk forside" },
];

export const FONT_OPTIONS = ["Arial", "Calibri", "Georgia", "Times New Roman", "Verdana"];

export interface TemplateSettings {
  template?: TemplateId;
  primary_color?: string;
  accent_color?: string;
  font_family?: string;
}

export interface ResolvedTheme {
  template: TemplateId;
  primaryColor: string; // hex without #
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  companyName: string | null;
}

const DEFAULTS: Record<TemplateId, Required<Omit<TemplateSettings, "template">>> = {
  klassisk: { primary_color: "1A4D8C", accent_color: "3B82F6", font_family: "Calibri" },
  moderne: { primary_color: "0F172A", accent_color: "F97316", font_family: "Arial" },
  minimalistisk: { primary_color: "111111", accent_color: "555555", font_family: "Georgia" },
};

const stripHash = (c: string) => c.replace(/^#/, "").toUpperCase();

// ---------- Theme resolver ----------

/**
 * Determines the document theme to use for a given project export.
 *
 * Priority:
 *   1. If the project is shared with a contact_group, use that group's template_settings + logo.
 *   2. Otherwise return the default "klassisk" theme with the user's profile logo (legacy fallback).
 */
export async function resolveDocumentTheme(
  projectId: string | null | undefined,
  profileLogoUrl?: string | null,
): Promise<ResolvedTheme> {
  let settings: TemplateSettings = {};
  let logoUrl: string | null = profileLogoUrl ?? null;
  let companyName: string | null = null;

  if (projectId) {
    try {
      const { data: shares } = await supabase
        .from("project_shares")
        .select("group_id")
        .eq("project_id", projectId)
        .not("group_id", "is", null)
        .limit(1);

      const groupId = shares?.[0]?.group_id;
      if (groupId) {
        const { data: group } = await supabase
          .from("contact_groups")
          .select("name, logo_url, template_settings")
          .eq("id", groupId)
          .maybeSingle();
        if (group) {
          settings = ((group as any).template_settings || {}) as TemplateSettings;
          if ((group as any).logo_url) logoUrl = (group as any).logo_url;
          companyName = (group as any).name || null;
        }
      }
    } catch {
      // Ignore — fall back to defaults
    }
  }

  return buildResolvedTheme(settings, logoUrl, companyName);
}

export function buildResolvedTheme(
  settings: TemplateSettings | null | undefined,
  logoUrl: string | null,
  companyName: string | null = null,
): ResolvedTheme {
  const template: TemplateId = settings?.template ?? "klassisk";
  const d = DEFAULTS[template];
  return {
    template,
    primaryColor: stripHash(settings?.primary_color || d.primary_color),
    accentColor: stripHash(settings?.accent_color || d.accent_color),
    fontFamily: settings?.font_family || d.font_family,
    logoUrl,
    companyName,
  };
}

// ---------- Logo fetch helper ----------

export async function fetchLogoBuffer(url: string | null): Promise<{
  buffer: ArrayBuffer;
  width: number;
  height: number;
} | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    // Read intrinsic size to keep aspect ratio
    const blob = new Blob([buffer]);
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 220;
        const maxH = 80;
        const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        resolve({
          width: Math.max(40, Math.round(img.naturalWidth * ratio)),
          height: Math.max(20, Math.round(img.naturalHeight * ratio)),
        });
      };
      img.onerror = () => resolve({ width: 180, height: 60 });
      img.src = URL.createObjectURL(blob);
    });
    return { buffer, ...dims };
  } catch {
    return null;
  }
}

// ---------- Builders consumed by export files ----------

export interface CoverOptions {
  title: string;
  subtitle?: string;
  projectName?: string;
  date?: string;
  authorLine?: string;
  logo?: { buffer: ArrayBuffer; width: number; height: number } | null;
}

export function buildCoverPage(theme: ResolvedTheme, opts: CoverOptions): Paragraph[] {
  const out: Paragraph[] = [];
  const { template, primaryColor, accentColor, fontFamily, companyName } = theme;
  const titleSize = template === "minimalistisk" ? 56 : 48;

  // Logo
  if (opts.logo) {
    out.push(
      new Paragraph({
        alignment: template === "minimalistisk" ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { before: template === "moderne" ? 1200 : 600, after: 400 },
        children: [
          new ImageRun({
            data: opts.logo.buffer,
            transformation: { width: opts.logo.width, height: opts.logo.height },
            type: "png",
          }),
        ],
      }),
    );
  } else {
    out.push(new Paragraph({ spacing: { before: 1600, after: 0 }, children: [] }));
  }

  // Decorative rule for moderne
  if (template === "moderne") {
    out.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: accentColor, space: 1 } },
        children: [],
      }),
    );
  }

  // Title
  out.push(
    new Paragraph({
      alignment: template === "minimalistisk" ? AlignmentType.LEFT : AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: opts.title.toUpperCase(),
          bold: true,
          size: titleSize,
          color: primaryColor,
          font: fontFamily,
        }),
      ],
    }),
  );

  if (opts.subtitle) {
    out.push(
      new Paragraph({
        alignment: template === "minimalistisk" ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: opts.subtitle,
            size: 24,
            color: template === "minimalistisk" ? "555555" : accentColor,
            font: fontFamily,
            italics: template !== "moderne",
          }),
        ],
      }),
    );
  }

  // Project meta block
  const meta: TextRun[] = [];
  if (opts.projectName) meta.push(new TextRun({ text: opts.projectName, bold: true, size: 28, font: fontFamily }));
  if (opts.authorLine) {
    if (meta.length) meta.push(new TextRun({ text: "\n", break: 1 }));
    meta.push(new TextRun({ text: opts.authorLine, size: 22, font: fontFamily }));
  }
  if (opts.date) {
    if (meta.length) meta.push(new TextRun({ text: "\n", break: 1 }));
    meta.push(new TextRun({ text: opts.date, size: 22, font: fontFamily, color: "666666" }));
  }
  if (companyName) {
    if (meta.length) meta.push(new TextRun({ text: "\n", break: 1 }));
    meta.push(new TextRun({ text: companyName, size: 22, font: fontFamily, color: primaryColor, bold: true }));
  }
  if (meta.length) {
    out.push(
      new Paragraph({
        alignment: template === "minimalistisk" ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { before: 800 },
        children: meta,
      }),
    );
  }

  // Page break to start content on a fresh page
  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
}

export function buildHeader(theme: ResolvedTheme, opts: { logo?: { buffer: ArrayBuffer; width: number; height: number } | null; documentLabel?: string }): Header {
  const children: Paragraph[] = [];
  if (opts.logo) {
    // Smaller version for header
    const ratio = opts.logo.height / opts.logo.width;
    const w = Math.min(120, opts.logo.width);
    const h = Math.max(18, Math.round(w * ratio));
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new ImageRun({ data: opts.logo.buffer, transformation: { width: w, height: h }, type: "png" })],
      }),
    );
  } else if (opts.documentLabel) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: opts.documentLabel, size: 18, color: theme.primaryColor, font: theme.fontFamily })],
      }),
    );
  } else {
    children.push(new Paragraph({ children: [] }));
  }
  return new Header({ children });
}

export function buildFooter(theme: ResolvedTheme): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: theme.accentColor, space: 4 } },
        children: [
          new TextRun({
            text: theme.companyName ?? "",
            size: 16,
            color: "888888",
            font: theme.fontFamily,
          }),
        ],
      }),
    ],
  });
}

export function buildSectionHeading(theme: ResolvedTheme, text: string, level: 1 | 2 = 1): Paragraph {
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: level === 1 ? 32 : 26,
        color: theme.primaryColor,
        font: theme.fontFamily,
      }),
    ],
  });
}

export function tableHeaderShading(theme: ResolvedTheme) {
  return { fill: theme.primaryColor, type: ShadingType.SOLID, color: theme.primaryColor };
}

export function defaultDocStyles(theme: ResolvedTheme) {
  return {
    default: {
      document: {
        run: { font: theme.fontFamily, size: 22 },
      },
    },
  };
}
