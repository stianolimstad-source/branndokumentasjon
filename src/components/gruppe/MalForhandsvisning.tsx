import { useEffect, useState } from "react";
import { TemplateId, TemplateExtras, DEFAULT_EXTRAS, TOPBAR_PX, formatDate } from "@/lib/document-templates";
import KonseptPreview from "@/components/konsept/KonseptPreview";

interface Props {
  template: TemplateId;
  primary: string;
  accent: string;
  font: string;
  logoUrl: string | null;
  groupName: string;
  extras?: TemplateExtras;
}

export default function MalForhandsvisning({
  template,
  primary,
  accent,
  font,
  logoUrl,
  groupName,
  extras: extrasProp,
}: Props) {
  const extras = { ...DEFAULT_EXTRAS, ...(extrasProp ?? {}) };
  const today = formatDate(new Date(), extras.date_format);
  const title = "Brannkonsept";
  const subtitle = "Eksempel på dokumentutseende";
  const projectName = "Demo Prosjekt AS – Kontorbygg";

  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [logoUrl]);
  const showLogo = !!logoUrl && !imgFailed;

  const LogoOrPlaceholder = ({
    className,
    onDark = false,
  }: {
    className?: string;
    onDark?: boolean;
  }) =>
    showLogo ? (
      <img
        src={logoUrl!}
        alt={groupName}
        onError={() => setImgFailed(true)}
        className={`object-contain ${onDark ? "bg-white p-1 rounded" : ""} ${className ?? ""}`}
      />
    ) : (
      <div
        className={`flex items-center justify-center text-[8px] uppercase tracking-widest border border-dashed rounded ${
          onDark ? "border-white/40 text-white/70" : "border-gray-300 text-gray-400"
        } ${className ?? ""}`}
        style={{ minHeight: 28, minWidth: 80 }}
      >
        Logo
      </div>
    );

  // ---------- Cover page (themed by template) ----------

  const footerParts = [
    extras.footer_show_date ? today : null,
    extras.footer_show_company ? groupName : null,
    extras.footer_show_page ? "Side 1" : null,
  ].filter(Boolean) as string[];

  const CoverWrap = ({ children }: { children: React.ReactNode }) => (
    <div
      className="relative mx-auto bg-white text-black shadow-elegant rounded-sm overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 800,
        aspectRatio: "1 / 1.414",
        fontFamily: font,
      }}
    >
      {children}
      {footerParts.length > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-8 py-2 text-[10px]"
          style={{ borderTop: `1px solid ${accent}`, color: "#666" }}
        >
          {footerParts.map((p, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span style={{ color: "#bbb" }}>•</span>}
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const topbarPx = TOPBAR_PX[extras.topbar_height];
  const coverTopPad = extras.cover_spacing === "small" ? 56 : extras.cover_spacing === "large" ? 160 : 112;

  const CoverKlassisk = () => (
    <CoverWrap>
      {topbarPx > 0 && <div style={{ background: primary, height: topbarPx }} />}
      <div className="flex flex-col items-center text-center px-12" style={{ paddingTop: coverTopPad }}>
        <LogoOrPlaceholder className="max-h-28 mb-12" />
        <h1 className="text-5xl font-bold mb-3" style={{ color: primary, fontFamily: font }}>
          {title}
        </h1>
        <div className="text-base italic mb-16" style={{ color: "#444" }}>
          {subtitle}
        </div>
        <div className="w-24 h-[2px] mb-8" style={{ background: accent }} />
        <div className="text-sm space-y-1" style={{ color: "#222" }}>
          <div className="font-semibold">{projectName}</div>
          <div>{today}</div>
        </div>
      </div>
    </CoverWrap>
  );

  const CoverModerne = () => (
    <CoverWrap>
      <div className="flex h-full">
        <div
          className="w-[35%] h-full flex flex-col justify-between p-8"
          style={{ background: primary, color: "#fff" }}
        >
          <LogoOrPlaceholder className="max-h-20" onDark />
          <div className="text-[11px] opacity-80">
            <div>{today}</div>
            <div className="mt-1">Versjon 1.0</div>
          </div>
        </div>
        <div className="flex-1 p-10 flex flex-col">
          <div className="w-14 h-1 mb-8" style={{ background: accent }} />
          <h1 className="text-5xl font-bold leading-tight mb-3" style={{ color: primary }}>
            {title}
          </h1>
          <div className="text-base mb-12" style={{ color: accent }}>
            {subtitle}
          </div>
          <div className="text-sm font-medium" style={{ color: "#222" }}>
            {projectName}
          </div>
        </div>
      </div>
    </CoverWrap>
  );

  const CoverMinimalistisk = () => (
    <CoverWrap>
      <div className="px-16 pt-32">
        <LogoOrPlaceholder className="max-h-16 mb-28" />
        <h1 className="text-6xl font-light mb-4 tracking-tight" style={{ color: primary }}>
          {title}
        </h1>
        <div className="text-base mb-24" style={{ color: "#666" }}>
          {subtitle}
        </div>
        <div className="w-full h-[1px] mb-4" style={{ background: accent, opacity: 0.5 }} />
        <div className="flex justify-between text-[12px]" style={{ color: "#333" }}>
          <span>{projectName}</span>
          <span>{today}</span>
        </div>
      </div>
    </CoverWrap>
  );

  const Cover =
    template === "klassisk"
      ? CoverKlassisk
      : template === "moderne"
        ? CoverModerne
        : CoverMinimalistisk;

  return (
    <div className="flex flex-col items-center gap-6 w-full" style={{ fontFamily: font }}>
      <Cover />
      <div
        className="bg-white text-black shadow-elegant rounded-sm w-full"
        style={{ maxWidth: 800, padding: 32 }}
      >
        <KonseptPreview
          formData={{}}
          logoUrl={logoUrl}
          hideCover
          theme={{
            template,
            primaryColor: primary.replace(/^#/, ""),
            accentColor: accent.replace(/^#/, ""),
            fontFamily: font,
          }}
        />
      </div>
    </div>
  );
}
