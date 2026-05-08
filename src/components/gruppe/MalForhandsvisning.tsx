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

  const Page = ({
    children,
    pageNum,
    totalPages,
    showHeader = true,
  }: {
    children: React.ReactNode;
    pageNum: number;
    totalPages: number;
    showHeader?: boolean;
  }) => (
    <div
      className="relative mx-auto bg-white text-black shadow-elegant rounded-sm overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 480,
        aspectRatio: "1 / 1.414",
        fontFamily: font,
      }}
    >
      {showHeader && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-4 pb-2"
          style={{ borderBottom: `1px solid ${accent}` }}
        >
          <LogoOrPlaceholder className="max-h-7" />
          <div className="text-[8px] uppercase tracking-widest" style={{ color: primary }}>
            {title}
          </div>
        </div>
      )}
      {children}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 text-[8px]"
        style={{ borderTop: `1px solid ${accent}`, color: "#666" }}
      >
        <span>{today}</span>
        <span>
          Side {pageNum} av {totalPages}
        </span>
      </div>
    </div>
  );

  // ---------- Cover variants ----------

  const CoverKlassisk = () => (
    <Page pageNum={1} totalPages={4} showHeader={false}>
      <div style={{ background: primary, height: 14 }} />
      <div className="flex flex-col items-center text-center px-8 pt-20">
        <LogoOrPlaceholder className="max-h-20 mb-10" />
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: primary, fontFamily: font }}
        >
          {title}
        </h1>
        <div className="text-sm italic mb-12" style={{ color: "#444" }}>
          {subtitle}
        </div>
        <div className="w-16 h-[2px] mb-6" style={{ background: accent }} />
        <div className="text-xs space-y-1" style={{ color: "#222" }}>
          <div className="font-semibold">{projectName}</div>
          <div>{today}</div>
        </div>
      </div>
    </Page>
  );

  const CoverModerne = () => (
    <Page pageNum={1} totalPages={4} showHeader={false}>
      <div className="flex h-full">
        <div
          className="w-[35%] h-full flex flex-col justify-between p-5"
          style={{ background: primary, color: "#fff" }}
        >
          <LogoOrPlaceholder className="max-h-14" onDark />
          <div className="text-[8px] opacity-80">
            <div>{today}</div>
            <div className="mt-1">Versjon 1.0</div>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col">
          <div className="w-10 h-1 mb-6" style={{ background: accent }} />
          <h1 className="text-3xl font-bold leading-tight mb-2" style={{ color: primary }}>
            {title}
          </h1>
          <div className="text-sm mb-8" style={{ color: accent }}>
            {subtitle}
          </div>
          <div className="text-xs font-medium" style={{ color: "#222" }}>
            {projectName}
          </div>
        </div>
      </div>
    </Page>
  );

  const CoverMinimalistisk = () => (
    <Page pageNum={1} totalPages={4} showHeader={false}>
      <div className="px-10 pt-24">
        <LogoOrPlaceholder className="max-h-12 mb-20" />
        <h1
          className="text-4xl font-light mb-3 tracking-tight"
          style={{ color: primary }}
        >
          {title}
        </h1>
        <div className="text-sm mb-16" style={{ color: "#666" }}>
          {subtitle}
        </div>
        <div className="w-full h-[1px] mb-4" style={{ background: accent, opacity: 0.5 }} />
        <div className="flex justify-between text-[10px]" style={{ color: "#333" }}>
          <span>{projectName}</span>
          <span>{today}</span>
        </div>
      </div>
    </Page>
  );

  const Cover =
    template === "klassisk"
      ? CoverKlassisk
      : template === "moderne"
        ? CoverModerne
        : CoverMinimalistisk;

  // ---------- Shared content pages ----------

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div
      className="text-[12px] font-semibold pb-1 mb-2 mt-4"
      style={{ color: primary, borderBottom: `2px solid ${primary}` }}
    >
      {children}
    </div>
  );

  const SubTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] font-semibold mt-3 mb-1" style={{ color: accent }}>
      {children}
    </div>
  );

  const P = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[8px] leading-snug mb-1.5" style={{ color: "#222" }}>
      {children}
    </p>
  );

  const TocPage = () => (
    <Page pageNum={2} totalPages={4}>
      <div className="px-8 pt-14 pb-12 h-full flex flex-col">
        <SectionTitle>Innhold</SectionTitle>
        <ul className="text-[10px] space-y-2 mt-2" style={{ color: "#222" }}>
          {[
            ["1", "Innledning", "3"],
            ["2", "Forutsetninger og grunnlag", "3"],
            ["3", "Branntekniske ytelser", "4"],
            ["4", "Rømning og redning", "5"],
            ["5", "Slokking og varsling", "6"],
            ["6", "Vedlegg", "7"],
          ].map(([n, t, p]) => (
            <li key={n} className="flex items-baseline gap-2">
              <span className="font-semibold w-4" style={{ color: primary }}>
                {n}
              </span>
              <span className="flex-1 border-b border-dotted border-gray-300 mx-1" />
              <span>{t}</span>
              <span className="flex-1 border-b border-dotted border-gray-300 mx-1" />
              <span className="text-[9px]" style={{ color: "#666" }}>
                {p}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Page>
  );

  const ContentPage1 = () => (
    <Page pageNum={3} totalPages={4}>
      <div className="px-8 pt-14 pb-12 h-full overflow-hidden">
        <SectionTitle>1. Innledning</SectionTitle>
        <P>
          Dette dokumentet beskriver de branntekniske forutsetningene for prosjektet,
          i henhold til TEK17 og veiledning til byggteknisk forskrift (VTEK17).
        </P>
        <P>
          Hensikten er å sikre tilfredsstillende personsikkerhet, verdisikring og
          mulighet for slokkeinnsats i bygningen.
        </P>

        <SectionTitle>2. Forutsetninger og grunnlag</SectionTitle>
        <SubTitle>2.1 Klassifisering</SubTitle>
        <table className="w-full text-[8px] border-collapse mb-2">
          <tbody>
            {[
              ["Risikoklasse", "RK 2"],
              ["Brannklasse", "BKL 2"],
              ["Antall etasjer", "3"],
              ["Bruttoareal", "1 240 m²"],
              ["Sprinkling", "Ja, fullsprinklet"],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: `1px solid ${accent}33` }}>
                <td className="py-1 pr-2 font-medium" style={{ color: "#222" }}>
                  {k}
                </td>
                <td className="py-1" style={{ color: "#222" }}>
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <SubTitle>2.2 Regelverk</SubTitle>
        <P>
          Prosjektet prosjekteres etter preaksepterte ytelser i VTEK17. Eventuelle
          fravik dokumenteres i egen fraviksanalyse iht. SINTEF Byggforsk 321.026.
        </P>
      </div>
    </Page>
  );

  const ContentPage2 = () => (
    <Page pageNum={4} totalPages={4}>
      <div className="px-8 pt-14 pb-12 h-full overflow-hidden">
        <SectionTitle>3. Branntekniske ytelser</SectionTitle>
        <P>
          Tabellen under oppsummerer sentrale ytelser for bærende konstruksjoner,
          seksjonering og brannceller.
        </P>
        <table className="w-full text-[8px] border-collapse mt-2">
          <thead>
            <tr style={{ background: primary, color: "#fff" }}>
              <th className="text-left p-1 font-semibold">Forhold</th>
              <th className="text-left p-1 font-semibold">Løsning</th>
              <th className="text-left p-1 font-semibold">Ansvar</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Bærende hovedsystem", "R 60 A2-s1,d0", "RIB"],
              ["Etasjeskillere", "REI 60 A2-s1,d0", "RIB"],
              ["Branncellebegrensende vegg", "EI 60", "ARK"],
              ["Branndør mot rømningsvei", "EI 60-CSa", "ARK"],
              ["Brannseksjon", "REI 90-M A2-s1,d0", "RIB"],
              ["Tekniske gjennomføringer", "Tettes til samme klasse som bygningsdel", "RIV/RIE"],
            ].map(([f, l, a], i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${accent}33` }}>
                <td className="p-1 align-top" style={{ color: "#222" }}>
                  {f}
                </td>
                <td className="p-1 align-top" style={{ color: "#222" }}>
                  {l}
                </td>
                <td className="p-1 align-top" style={{ color: "#222" }}>
                  {a}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <SubTitle>3.1 Materialer</SubTitle>
        <P>
          Overflater i rømningsveier utføres i klasse B-s1,d0. Gulv i rømningsveier i
          klasse Dfl-s1.
        </P>
      </div>
    </Page>
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <Cover />
      <TocPage />
      <ContentPage1 />
      <ContentPage2 />
    </div>
  );
}
