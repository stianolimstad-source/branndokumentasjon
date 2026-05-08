import { useEffect, useState } from "react";
import { TemplateId } from "@/lib/document-templates";

interface Props {
  template: TemplateId;
  primary: string;
  accent: string;
  font: string;
  logoUrl: string | null;
  groupName: string;
}

export default function MalForhandsvisning({
  template,
  primary,
  accent,
  font,
  logoUrl,
  groupName,
}: Props) {
  const today = new Date().toLocaleDateString("nb-NO");
  const title = "Brannkonsept";
  const subtitle = "Eksempel på dokumentutseende";
  const projectName = "Demo Prosjekt AS – Kontorbygg";

  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [logoUrl]);
  const showLogo = logoUrl && !imgFailed;

  // Common page wrapper (A4 ratio 1:1.414)
  const Page = ({ children }: { children: React.ReactNode }) => (
    <div
      className="relative mx-auto bg-white text-black shadow-elegant rounded-sm overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 480,
        aspectRatio: "1 / 1.414",
        fontFamily: font,
      }}
    >
      {children}
    </div>
  );

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
        alt=""
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

  const Footer = () => (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 text-[8px]"
      style={{ borderTop: `1px solid ${accent}`, color: "#555" }}
    >
      <span>{groupName}</span>
      <span>Side 1</span>
    </div>
  );

  if (template === "klassisk") {
    return (
      <Page>
        {/* Top color band */}
        <div style={{ background: primary, height: 14 }} />
        <div className="flex flex-col items-center text-center px-8 pt-16">
          <LogoOrPlaceholder className="max-h-16 mb-8" />
          <div
            className="text-[10px] uppercase tracking-[0.3em] mb-3"
            style={{ color: accent }}
          >
            {groupName}
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: primary, fontFamily: font }}
          >
            {title}
          </h1>
          <div className="text-sm italic mb-12" style={{ color: "#444" }}>
            {subtitle}
          </div>
          <div
            className="w-16 h-[2px] mb-6"
            style={{ background: accent }}
          />
          <div className="text-xs space-y-1" style={{ color: "#222" }}>
            <div className="font-semibold">{projectName}</div>
            <div>{today}</div>
          </div>
        </div>
        {/* Body sample */}
        <div className="absolute bottom-12 left-8 right-8">
          <div
            className="text-[11px] font-semibold pb-1 mb-2"
            style={{ color: primary, borderBottom: `2px solid ${primary}` }}
          >
            1. Innledning
          </div>
          <p className="text-[8px] leading-snug" style={{ color: "#222" }}>
            Dette dokumentet beskriver de branntekniske forutsetningene for prosjektet,
            i henhold til TEK17 og veiledning til byggteknisk forskrift.
          </p>
        </div>
        <Footer />
      </Page>
    );
  }

  if (template === "moderne") {
    return (
      <Page>
        {/* Big left color block */}
        <div className="flex h-full">
          <div
            className="w-[35%] h-full flex flex-col justify-between p-5"
            style={{ background: primary, color: "#fff" }}
          >
            <div>
              <LogoOrPlaceholder className="max-h-12 mb-6" onDark />
              <div className="text-[8px] uppercase tracking-widest opacity-80">
                {groupName}
              </div>
            </div>
            <div className="text-[8px] opacity-80">
              <div>{today}</div>
              <div className="mt-1">Versjon 1.0</div>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col">
            <div
              className="w-10 h-1 mb-6"
              style={{ background: accent }}
            />
            <h1
              className="text-3xl font-bold leading-tight mb-2"
              style={{ color: primary }}
            >
              {title}
            </h1>
            <div className="text-sm mb-8" style={{ color: accent }}>
              {subtitle}
            </div>
            <div className="text-xs font-medium mb-12" style={{ color: "#222" }}>
              {projectName}
            </div>

            <div className="mt-auto">
              <div
                className="text-[11px] font-bold uppercase tracking-wide mb-2"
                style={{ color: primary }}
              >
                1 — Innledning
              </div>
              <p className="text-[8px] leading-snug" style={{ color: "#333" }}>
                Brannkonseptet definerer de overordnede strategiene for personsikkerhet,
                verdisikring og slokkeinnsats.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </Page>
    );
  }

  // minimalistisk
  return (
    <Page>
      <div className="px-10 pt-20">
        <LogoOrPlaceholder className="max-h-10 mb-16" />
        <div className="text-[9px] uppercase tracking-[0.4em] mb-4" style={{ color: "#888" }}>
          {groupName}
        </div>
        <h1
          className="text-4xl font-light mb-3 tracking-tight"
          style={{ color: primary }}
        >
          {title}
        </h1>
        <div className="text-sm mb-16" style={{ color: "#666" }}>
          {subtitle}
        </div>
        <div
          className="w-full h-[1px] mb-4"
          style={{ background: accent, opacity: 0.5 }}
        />
        <div className="flex justify-between text-[10px]" style={{ color: "#333" }}>
          <span>{projectName}</span>
          <span>{today}</span>
        </div>
      </div>
      <div className="absolute bottom-12 left-10 right-10">
        <div
          className="text-[11px] font-medium mb-2 pb-1"
          style={{ color: primary }}
        >
          01 / Innledning
        </div>
        <p className="text-[8px] leading-snug" style={{ color: "#444" }}>
          Et rent og redusert uttrykk som lar innholdet stå i fokus. Ideell for
          rådgivningsmiljøer som vektlegger presisjon og lesbarhet.
        </p>
      </div>
      <Footer />
    </Page>
  );
}
