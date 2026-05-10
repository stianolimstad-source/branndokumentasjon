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

export type TopbarHeight = "off" | "thin" | "thick" | "extra";
export type LogoPosition = "left" | "center" | "right" | "hidden";
export type DateFormat = "no-short" | "no-long" | "iso";
export type CoverSpacing = "small" | "standard" | "large";

export interface TemplateExtras {
  topbar_height?: TopbarHeight;
  logo_position?: LogoPosition;
  footer_show_company?: boolean;
  footer_show_page?: boolean;
  footer_show_date?: boolean;
  date_format?: DateFormat;
  cover_spacing?: CoverSpacing;
}

export const DEFAULT_EXTRAS: Required<TemplateExtras> = {
  topbar_height: "thick",
  logo_position: "right",
  footer_show_company: true,
  footer_show_page: true,
  footer_show_date: true,
  date_format: "no-short",
  cover_spacing: "standard",
};

export interface TemplateSettings {
  template?: TemplateId;
  primary_color?: string;
  accent_color?: string;
  font_family?: string;
  extras?: TemplateExtras;
}

export interface ResolvedTheme {
  template: TemplateId;
  primaryColor: string; // hex without #
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  companyName: string | null;
  extras: Required<TemplateExtras>;
}

const DEFAULTS: Record<TemplateId, Required<Omit<TemplateSettings, "template" | "extras">>> = {
  klassisk: { primary_color: "1A4D8C", accent_color: "3B82F6", font_family: "Calibri" },
  moderne: { primary_color: "0F172A", accent_color: "F97316", font_family: "Arial" },
  minimalistisk: { primary_color: "111111", accent_color: "555555", font_family: "Georgia" },
};

export const TOPBAR_PX: Record<TopbarHeight, number> = {
  off: 0,
  thin: 18,
  thick: 36,
  extra: 54,
};

export function formatDate(d: Date, fmt: DateFormat): string {
  if (fmt === "iso") return d.toISOString().slice(0, 10);
  if (fmt === "no-long") return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("nb-NO");
}

export function getTemplateDefaults(template: TemplateId) {
  const d = DEFAULTS[template];
  return {
    primary_color: `#${d.primary_color}`,
    accent_color: `#${d.accent_color}`,
    font_family: d.font_family,
  };
}

const stripHash = (c: string) => c.replace(/^#/, "").toUpperCase();

// ---------- Theme resolver ----------

/**
 * Determines the document theme to use for a given project export.
 *
 * Priority:
 *   1. If the project is shared with a contact_group, use that group's template_settings + logo.
 *   2. Else if user has a `default_template_group_id` and is member of that group, use it.
 *   3. Else if user is member of exactly one group with template_settings, use it automatically.
 *   4. Otherwise return the default "klassisk" theme with the user's profile logo.
 */
export async function resolveDocumentTheme(
  projectId: string | null | undefined,
  profileLogoUrl?: string | null,
  userId?: string | null,
): Promise<ResolvedTheme> {
  let settings: TemplateSettings = {};
  let logoUrl: string | null = profileLogoUrl ?? null;
  let companyName: string | null = null;
  let resolvedFromGroup = false;

  // Helper: pick the group's default custom template if it exists, else fall back to template_settings
  const fetchGroupSettings = async (groupId: string): Promise<{ name: string | null; logo_url: string | null; settings: TemplateSettings } | null> => {
    const { data: group } = await supabase
      .from("contact_groups")
      .select("name, logo_url, template_settings")
      .eq("id", groupId)
      .maybeSingle();
    if (!group) return null;

    // Look for a custom default template
    try {
      const { data: customDefault } = await supabase
        .from("group_templates" as any)
        .select("base_template, primary_color, accent_color, font_family, settings")
        .eq("group_id", groupId)
        .eq("is_default", true)
        .maybeSingle();
      if (customDefault) {
        const c = customDefault as any;
        return {
          name: (group as any).name ?? null,
          logo_url: (group as any).logo_url ?? null,
          settings: {
            template: c.base_template as TemplateId,
            primary_color: c.primary_color,
            accent_color: c.accent_color,
            font_family: c.font_family,
            extras: (c.settings || {}) as TemplateExtras,
          },
        };
      }
    } catch {
      // table may not exist yet in some envs — fall back
    }

    return {
      name: (group as any).name ?? null,
      logo_url: (group as any).logo_url ?? null,
      settings: ((group as any).template_settings || {}) as TemplateSettings,
    };
  };

  const applyGroup = (g: { name: string | null; logo_url: string | null; settings: TemplateSettings } | null) => {
    if (!g) return;
    settings = g.settings;
    if (g.logo_url) logoUrl = g.logo_url;
    companyName = g.name;
    resolvedFromGroup = true;
  };

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
        applyGroup(await fetchGroupSettings(groupId));
      }
    } catch {
      // Ignore — fall back to defaults
    }
  }

  if (!resolvedFromGroup && userId) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_template_group_id")
        .eq("id", userId)
        .maybeSingle();
      const defaultGroupId = (profile as any)?.default_template_group_id as string | null;

      if (defaultGroupId) {
        applyGroup(await fetchGroupSettings(defaultGroupId));
      }

      if (!resolvedFromGroup) {
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", userId);
        const groupIds = (memberships ?? []).map((m: any) => m.group_id);
        if (groupIds.length === 1) {
          applyGroup(await fetchGroupSettings(groupIds[0]));
        } else if (groupIds.length > 1) {
          // Pick any group with non-empty template_settings
          const { data: groups } = await supabase
            .from("contact_groups")
            .select("id, template_settings")
            .in("id", groupIds);
          const themed = (groups ?? []).filter(
            (g: any) => g.template_settings && Object.keys(g.template_settings).length > 0,
          );
          if (themed.length === 1) applyGroup(await fetchGroupSettings((themed[0] as any).id));
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
    extras: { ...DEFAULT_EXTRAS, ...(settings?.extras ?? {}) },
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
  const { template, primaryColor, accentColor, fontFamily, companyName, extras } = theme;
  const titleSize = template === "minimalistisk" ? 56 : 48;

  // Decorative top bar (configurable via extras.topbar_height)
  const topbarPx = TOPBAR_PX[extras.topbar_height];
  if (topbarPx > 0) {
    // Convert px ~ to docx border size (eighths of a point). 1px ≈ 0.75pt → size = px * 6
    out.push(
      new Paragraph({
        spacing: { before: 0, after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: Math.max(6, Math.round(topbarPx * 6)), color: primaryColor, space: 1 },
        },
        children: [],
      }),
    );
  }

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
  const pos = theme.extras.logo_position;
  const align =
    pos === "left" ? AlignmentType.LEFT : pos === "center" ? AlignmentType.CENTER : AlignmentType.RIGHT;

  if (pos !== "hidden" && opts.logo) {
    const ratio = opts.logo.height / opts.logo.width;
    const w = Math.min(120, opts.logo.width);
    const h = Math.max(18, Math.round(w * ratio));
    children.push(
      new Paragraph({
        alignment: align,
        children: [new ImageRun({ data: opts.logo.buffer, transformation: { width: w, height: h }, type: "png" })],
      }),
    );
  } else if (pos !== "hidden" && opts.documentLabel) {
    children.push(
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: opts.documentLabel, size: 18, color: theme.primaryColor, font: theme.fontFamily })],
      }),
    );
  } else {
    children.push(new Paragraph({ children: [] }));
  }
  return new Header({ children });
}

export function buildFooter(theme: ResolvedTheme): Footer {
  const { footer_show_company, footer_show_page, footer_show_date, date_format } = theme.extras;
  const left = footer_show_date ? formatDate(new Date(), date_format) : "";
  const center = footer_show_company ? (theme.companyName ?? "") : "";
  const right = footer_show_page ? "Side " : "";

  // Single centered line if only one element, otherwise three-column with tabs
  const runs: TextRun[] = [];
  if (left) runs.push(new TextRun({ text: left, size: 16, color: "888888", font: theme.fontFamily }));
  if (center) {
    if (runs.length) runs.push(new TextRun({ text: "   •   ", size: 16, color: "AAAAAA", font: theme.fontFamily }));
    runs.push(new TextRun({ text: center, size: 16, color: "888888", font: theme.fontFamily }));
  }
  if (right) {
    if (runs.length) runs.push(new TextRun({ text: "   •   ", size: 16, color: "AAAAAA", font: theme.fontFamily }));
    runs.push(new TextRun({ text: right, size: 16, color: "888888", font: theme.fontFamily }));
  }

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: theme.accentColor, space: 4 } },
        children: runs.length ? runs : [new TextRun({ text: "", font: theme.fontFamily })],
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
