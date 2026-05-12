import React from "react";
import { branncelleTyperListe, getBrannklasse } from "@/lib/fire-concept-constants";
import { getGarasjeKrav } from "@/lib/garasje-krav";
import { getBrensellagringKrav, BrenselType } from "@/lib/brensellagring-krav";
import { getBaereevneTekstBF85, getBF85BrannveggKravKap34, bf85Tabell3423 } from "@/lib/bf85-constants";


interface TilstandBilde {
  url: string;
  beskrivelse: string;
}

interface TilstandAvvik {
  id?: string;
  grad?: string;
  beskrivelse: string;
  bilder: (TilstandBilde | string)[];
}

interface TilstandKategori {
  beskrivelse: string;
  bilder: (TilstandBilde | string)[];
  avvik?: TilstandAvvik[];
}

interface TilstandData {
  grad: string;
  beskrivelse: string;
  bilder: (TilstandBilde | string)[];
  tiltak?: TilstandKategori;
  fravik?: TilstandKategori;
}

const normalizeBilder = (bilder: any[]): TilstandBilde[] =>
  (bilder || []).map((b: any) => typeof b === "string" ? { url: b, beskrivelse: "" } : b);

const gradLabelMap: Record<string, string> = {
  tg0: "TG 0 – Ingen avvik",
  tg1: "TG 1 – Mindre avvik",
  tg2: "TG 2 – Vesentlige avvik",
  tg3: "TG 3 – Store avvik",
  tgiu: "TG IU – Ikke undersøkt",
};

// Felles seksjonsliste for tilstandsvurdering (samme som tilstandSectionsTEK17 i Konsept.tsx)
export const tilstandSectionList: { key: string; label: string }[] = [
  { key: "3_1", label: "3.1 Bæreevne og stabilitet" },
  { key: "3_2", label: "3.2 Sikkerhet ved eksplosjon" },
  { key: "3_3", label: "3.3 Brannspredning mellom byggverk" },
  { key: "3_4", label: "3.4 Brannseksjoner" },
  { key: "3_5", label: "3.5 Brannceller" },
  { key: "3_6", label: "3.6 Materialer" },
  { key: "3_7", label: "3.7 Tekniske installasjoner" },
  { key: "3_8", label: "3.8 Rømning og redning" },
  { key: "3_9", label: "3.9 Tilrettelegging for rømning" },
  { key: "3_10", label: "3.10 Utgang fra branncelle" },
  { key: "3_11", label: "3.11 Rømningsvei" },
  { key: "3_12", label: "3.12 Redning av husdyr" },
  { key: "3_13", label: "3.13 Manuell slokking" },
  { key: "3_14", label: "3.14 Slokkemannskap" },
];

// Bygger en effektiv liste av avvik for en kategori, med fallback til legacy-felter.
const getAvvikListe = (kategori: TilstandKategori | undefined): TilstandAvvik[] => {
  if (!kategori) return [];
  if (Array.isArray(kategori.avvik) && kategori.avvik.length > 0) return kategori.avvik;
  // Fallback: én avvik-blokk fra legacy beskrivelse/bilder
  if (kategori.beskrivelse || (kategori.bilder && kategori.bilder.length > 0)) {
    return [{ beskrivelse: kategori.beskrivelse || "", bilder: kategori.bilder || [] }];
  }
  return [];
};

// Henter tiltak/fravik – migrerer legacy beskrivelse/bilder til tiltak ved behov
export const getKategorier = (data: TilstandData): { tiltak: TilstandKategori; fravik: TilstandKategori } => {
  const harNye = !!(data?.tiltak || data?.fravik);
  const harLegacy = !!(data?.beskrivelse || (data?.bilder && data.bilder.length > 0));
  if (!harNye && harLegacy) {
    return {
      tiltak: { beskrivelse: data.beskrivelse || "", bilder: data.bilder || [] },
      fravik: { beskrivelse: "", bilder: [] },
    };
  }
  return {
    tiltak: data?.tiltak || { beskrivelse: "", bilder: [] },
    fravik: data?.fravik || { beskrivelse: "", bilder: [] },
  };
};

const tilstandHasContent = (data: TilstandData): boolean => {
  if (!data) return false;
  const { tiltak, fravik } = getKategorier(data);
  return !!data.grad || getAvvikListe(tiltak).length > 0 || getAvvikListe(fravik).length > 0;
};

const tilstandIsActive = (data: TilstandData): boolean => {
  // Panelet regnes som aktivert når brukeren har lagt til avvik ELLER eksplisitt satt en grad.
  if (!data) return false;
  const { tiltak, fravik } = getKategorier(data);
  return !!data.grad || getAvvikListe(tiltak).length > 0 || getAvvikListe(fravik).length > 0;
};

// Farge per tilstandsgrad (for badge)
const gradBadgeColors: Record<string, { bg: string; fg: string }> = {
  tg0: { bg: "#16A34A", fg: "#FFFFFF" },
  tg1: { bg: "#FACC15", fg: "#1F2937" },
  tg2: { bg: "#F97316", fg: "#FFFFFF" },
  tg3: { bg: "#DC2626", fg: "#FFFFFF" },
  tgiu: { bg: "#9CA3AF", fg: "#FFFFFF" },
};

const GradBadge = ({ grad, size = 10 }: { grad: string; size?: number }) => {
  if (!grad) return null;
  const c = gradBadgeColors[grad] || { bg: "#6B7280", fg: "#FFFFFF" };
  const label = { tg0: "TG 0", tg1: "TG 1", tg2: "TG 2", tg3: "TG 3", tgiu: "TG IU" }[grad] || grad.toUpperCase();
  return (
    <span style={{
      display: "inline-block",
      background: c.bg,
      color: c.fg,
      fontSize: size,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 999,
      lineHeight: 1.3,
      letterSpacing: 0.3,
    }}>{label}</span>
  );
};

const KategoriBlokk = ({ tittel, kategori, headerBg, headerFg, accent }: {
  tittel: string;
  kategori: TilstandKategori;
  headerBg: string;
  headerFg: string;
  accent: string;
}) => {
  const liste = getAvvikListe(kategori);
  if (liste.length === 0) return null;
  return (
    <div style={{
      marginTop: 10,
      background: "#FFFFFF",
      border: `1px solid ${accent}`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: 6,
      overflow: "hidden",
    }}>
      <div style={{
        background: headerBg,
        color: headerFg,
        padding: "5px 10px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}>{tittel} <span style={{ fontWeight: 500, opacity: 0.85 }}>({liste.length})</span></div>
      <div style={{ padding: "8px 10px" }}>
        {liste.map((avvik, idx) => {
          const bilder = normalizeBilder(avvik.bilder);
          return (
            <div key={avvik.id || idx} style={{
              marginBottom: idx === liste.length - 1 ? 0 : 10,
              paddingBottom: idx === liste.length - 1 ? 0 : 10,
              borderBottom: idx === liste.length - 1 ? "none" : "1px dashed #E5E7EB",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-block",
                  background: accent,
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  lineHeight: 1.3,
                }}>Avvik {idx + 1}</span>
                {avvik.grad && <GradBadge grad={avvik.grad} />}
              </div>
              {avvik.beskrivelse && <p style={{ fontSize: 11, whiteSpace: "pre-wrap", margin: "2px 0 6px 0", lineHeight: 1.45 }}>{avvik.beskrivelse}</p>}
              {bilder.length > 0 && (
                <div>
                  {bilder.map((bilde, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <img src={bilde.url} alt={bilde.beskrivelse || `Bilde ${i + 1}`} style={{ width: 450, maxWidth: "100%", height: "auto", objectFit: "cover", borderRadius: 4, border: "1px solid #d1d5db" }} />
                      {bilde.beskrivelse && <p style={{ fontSize: 9, fontStyle: "italic", margin: "4px 0 0 0" }}>Bilde {i + 1}: {bilde.beskrivelse}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TilstandTableRow = ({ data, sectionLabel, colSpan = 3 }: { data: TilstandData; sectionLabel: string; colSpan?: number }) => {
  if (!tilstandHasContent(data)) return null;
  const { tiltak, fravik } = getKategorier(data);
  const tiltakListe = getAvvikListe(tiltak);
  const fravikListe = getAvvikListe(fravik);
  const ingenAvvik = tiltakListe.length === 0 && fravikListe.length === 0;
  return (
    <tr>
      <td className="border border-gray-400" colSpan={colSpan} style={{ padding: 0, background: "#FEF3C7" }}>
        {/* Header-bånd */}
        <div style={{
          background: "#FCD34D",
          color: "#78350F",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderBottom: "2px solid #D97706",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Tilstandsvurdering
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#78350F" }}>{sectionLabel}</span>
          </div>
          {ingenAvvik && <GradBadge grad="tg0" size={10} />}
        </div>
        {/* Innhold */}
        <div style={{ padding: "10px 12px 12px 12px" }}>
          {ingenAvvik ? (
            <div style={{
              background: "#D1FAE5",
              border: "1px solid #6EE7B7",
              borderLeft: "4px solid #059669",
              borderRadius: 6,
              padding: "8px 12px",
              color: "#065F46",
              fontSize: 11,
              fontWeight: 500,
            }}>
              Det er ikke funnet noen avvik på dette området.
            </div>
          ) : (
            <>
              <KategoriBlokk
                tittel="Avvik som krever aktive tiltak"
                kategori={tiltak}
                headerBg="#FEE2E2"
                headerFg="#991B1B"
                accent="#991B1B"
              />
              <KategoriBlokk
                tittel="Avvik som kan fraviksbehandles"
                kategori={fravik}
                headerBg="#FFEDD5"
                headerFg="#9A3412"
                accent="#C2410C"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

interface KonseptPreviewProps {
  formData: Record<string, any>;
  logoUrl?: string | null;
  authorInfo?: { name: string; company: string } | null;
  documentType?: "brannkonsept" | "tilstandsvurdering";
  hideCover?: boolean;
  theme?: { template?: "klassisk" | "moderne" | "minimalistisk"; primaryColor: string; accentColor: string; fontFamily: string; companyName?: string | null; extras?: { topbar_height?: "off" | "thin" | "thick" | "extra" } } | null;
}

const KonseptPreview = ({ formData, logoUrl, authorInfo, documentType = "brannkonsept", hideCover = false, theme }: KonseptPreviewProps) => {
  // Ensure arrays have defaults
  const bygningsdeler = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
  const grunnlagsdokumenter = Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [];
  const branncelleTyper = Array.isArray(formData.branncelleTyper) ? formData.branncelleTyper : [];
  const baereevneUnntak = Array.isArray(formData.baereevneUnntak) ? formData.baereevneUnntak : [];

  const themeFont = theme?.fontFamily ? `${theme.fontFamily}, Verdana, Geneva, sans-serif` : 'Verdana, Geneva, sans-serif';
  const themePrimary = theme?.primaryColor ? `#${theme.primaryColor}` : undefined;
  const themeAccent = theme?.accentColor ? `#${theme.accentColor}` : undefined;
  // Soft tinted background derived from accent color, used to theme section header rows
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const sectionRowBg = themeAccent ? hexToRgba(themeAccent, 0.18) : '#DBEAFE';
  const sectionRowStyle = { background: sectionRowBg };
  const chapterHeadingColor = themePrimary ?? '#00a3e0';
  const pageStyle = "bg-white text-black p-10 rounded-lg shadow-md text-sm border border-gray-200 mx-auto relative";
  const pageWidth = { maxWidth: '210mm', minHeight: '297mm', paddingBottom: '40px', fontFamily: themeFont };
  const hasSammendrag = !!formData.sammendrag;
  const isTilstand = documentType === "tilstandsvurdering";
  const isBF85 = isTilstand && formData.regelverk === "BF85";
  // Page numbering: sequential
  let pageCounter = 1;
  const pageForside = pageCounter++;
  const pageSammendrag = hasSammendrag ? pageCounter++ : 0;
  const pageTilstandsgrader = isTilstand ? pageCounter++ : 0;
  const pageInnhold = pageCounter++;
  const pageKap1 = pageCounter++;
  const pageKap2 = pageCounter++;
  const pageKap3a = pageCounter++; // 3.1-3.2
  const pageKap3b = pageCounter++; // 3.3-3.4
  const pageKap3c = pageCounter++; // 3.5 (del 1)
  const pageKap3c2 = pageCounter++; // 3.5 (del 2)
  const pageKap3d = pageCounter++; // 3.6
  const pageKap3d2 = pageCounter++; // 3.7 + 3.8
  const pageKap3e2 = pageCounter++; // 3.9
  const pageKap3f = pageCounter++; // 3.10
  const pageKap3f2 = pageCounter++; // 3.11
  const pageKap3f3 = pageCounter++; // 3.11 (forts.)
  const pageKap3g = pageCounter++; // 3.12-3.14
  const pageKap4 = pageCounter++; // Kap 4+5 (brannkonsept) or revisjon (tilstand)
  const pageLitteratur = pageCounter++;
  const totalPages = pageCounter - 1;
  // Section prefix for chapter 3 (brannkonsept) → chapter 2 (tilstandsvurdering)
  const sp = "3";

  const PageFooter = ({ pageNum }: { pageNum: number }) => null;

  return (
    <div className="space-y-8 py-4">
      {/* Forside */}
      {!hideCover && (() => {
        const tpl = theme?.template ?? "klassisk";
        const primary = themePrimary ?? "#1A4D8C";
        const accent = themeAccent ?? "#3B82F6";
        const font = themeFont;
        const today = new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" });
        const title = documentType === "tilstandsvurdering" ? "Tilstandsvurdering" : "Brannkonsept";
        const subtitle = formData.adresse || "";
        const projectName = formData.prosjektnavn || "";

        const Logo = ({ className, onDark = false }: { className?: string; onDark?: boolean }) =>
          logoUrl ? (
            <img
              src={logoUrl}
              alt="Firmalogo"
              className={`object-contain ${onDark ? "bg-white p-1 rounded" : ""} ${className ?? ""}`}
            />
          ) : null;

        const Footer = () => (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-2 text-[10px]"
            style={{ borderTop: `1px solid ${accent}`, color: "#666" }}
          >
            <span>{today}</span>
            <span>Side {pageForside}</span>
          </div>
        );

        const AuthorBlock = () =>
          authorInfo && (authorInfo.name || authorInfo.company) ? (
            <div className="mt-8 text-center text-sm" style={{ color: "#444" }}>
              <p className="font-semibold">Utarbeidet av</p>
              {authorInfo.name && <p>{authorInfo.name}</p>}
              {authorInfo.company && <p>{authorInfo.company}</p>}
            </div>
          ) : null;

        if (tpl === "moderne") {
          return (
            <div className={pageStyle} style={{ ...pageWidth, padding: 0, overflow: "hidden" }}>
              <div className="flex" style={{ minHeight: "260mm" }}>
                <div className="w-[35%] flex flex-col justify-between p-8" style={{ background: primary, color: "#fff" }}>
                  <Logo className="max-h-24" onDark />
                  <div className="text-[11px] opacity-80">
                    <div>{today}</div>
                    <div className="mt-1">Versjon 1.0</div>
                  </div>
                </div>
                <div className="flex-1 p-10 flex flex-col">
                  <div className="w-14 h-1 mb-8" style={{ background: accent }} />
                  <h1 className="text-5xl font-bold leading-tight mb-3" style={{ color: primary, fontFamily: font }}>{title}</h1>
                  {subtitle && <div className="text-base mb-12" style={{ color: accent }}>{subtitle}</div>}
                  <div className="text-sm font-medium" style={{ color: "#222" }}>{projectName}</div>
                  <AuthorBlock />
                </div>
              </div>
              <Footer />
            </div>
          );
        }

        if (tpl === "minimalistisk") {
          return (
            <div className={pageStyle} style={pageWidth}>
              <div className="px-8 pt-24" style={{ minHeight: "240mm" }}>
                <Logo className="max-h-16 mb-28" />
                <h1 className="text-6xl font-light mb-4 tracking-tight" style={{ color: primary, fontFamily: font }}>{title}</h1>
                {subtitle && <div className="text-base mb-24" style={{ color: "#666" }}>{subtitle}</div>}
                <div className="w-full h-[1px] mb-4" style={{ background: accent, opacity: 0.5 }} />
                <div className="flex justify-between text-[12px]" style={{ color: "#333" }}>
                  <span>{projectName}</span>
                  <span>{today}</span>
                </div>
                <AuthorBlock />
              </div>
              <Footer />
            </div>
          );
        }

        // klassisk (default)
        return (
          <div className={pageStyle} style={{ ...pageWidth, padding: 0, overflow: "hidden" }}>
            {(() => { const tb = ({ off: 0, thin: 18, thick: 36, extra: 54 } as const)[theme?.extras?.topbar_height ?? "thick"]; return tb > 0 ? <div style={{ background: primary, height: tb }} /> : null; })()}
            <div className="flex flex-col items-center text-center px-12 pt-28 pb-24" style={{ minHeight: "calc(260mm - 18px)" }}>
              <Logo className="max-h-28 mb-12" />
              <h1 className="text-5xl font-bold mb-3" style={{ color: primary, fontFamily: font }}>{title}</h1>
              {subtitle && <div className="text-base italic mb-16" style={{ color: "#444" }}>{subtitle}</div>}
              <div className="w-24 h-[2px] mb-8" style={{ background: accent }} />
              <div className="text-sm space-y-1" style={{ color: "#222" }}>
                {projectName && <div className="font-semibold">{projectName}</div>}
                <div>{today}</div>
              </div>
              <AuthorBlock />
            </div>
            <Footer />
          </div>
        );
      })()}

      {/* Sammendrag - egen side */}
      {hasSammendrag && (
        <div className={pageStyle} style={pageWidth}>
          <h2 id="preview-sammendrag" className="font-bold mb-3">Sammendrag</h2>
          <p className="whitespace-pre-wrap text-xs">{formData.sammendrag}</p>
          <PageFooter pageNum={pageSammendrag} />
        </div>
      )}

      {/* Tilstandsgrader - egen side (kun for tilstandsvurdering) */}
      {isTilstand && (
        <div className={pageStyle} style={pageWidth}>
          <h2 className="font-bold mb-3">Tilstandsgrader</h2>
          <p className="text-xs mb-4 whitespace-pre-wrap">
            {"Ved tilstandsvurdering bruker man tilstandsgrader for å prioritere mangler med tanke på oppfølging. Tabellen nedenfor gir oversikt over grader for bruk i brannteknisk tilstandsanalyse. Graderingen er tilpasset tilstandsgradering i NS 3424, slik at den branntekniske tilstandsanalysen kan integreres i flerfaglig teknisk analyse av bygningen.\n\nDenne rapporten er basert på en NS 3424 nivå 1 tilstandsvurdering."}
          </p>
          <p className="font-semibold mb-2" style={{ fontSize: 10 }}>Tilstandsgrader</p>
          <table className="w-full border-collapse border border-gray-400 mb-4" style={{ fontSize: 8 }}>
            <thead>
              <tr>
                <th className="border border-gray-400 p-1 bg-gray-100" rowSpan={2} style={{ width: "10%" }}></th>
                <th className="border border-gray-400 p-1 bg-gray-100 text-center font-bold" colSpan={5}>TILSTANDSGRADER</th>
              </tr>
              <tr>
                <th className="border border-gray-400 p-1 bg-gray-100 text-center" style={{ width: "18%" }}>
                  <span className="font-bold">TG 0</span><br />Ingen avvik
                </th>
                <th className="border border-gray-400 p-1 bg-gray-100 text-center" style={{ width: "18%" }}>
                  <span className="font-bold">TG 1</span><br />Mindre eller moderate avvik
                </th>
                <th className="border border-gray-400 p-1 bg-gray-100 text-center" style={{ width: "18%" }}>
                  <span className="font-bold">TG 2</span><br />Vesentlige avvik
                </th>
                <th className="border border-gray-400 p-1 bg-gray-100 text-center" style={{ width: "18%" }}>
                  <span className="font-bold">TG 3</span><br />Store eller alvorlige avvik
                </th>
                <th className="border border-gray-400 p-1 bg-gray-100 text-center" style={{ width: "18%" }}>
                  <span className="font-bold">TG IU</span><br />Ikke undersøkt
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-1 font-semibold align-top">Teknisk tilstand</td>
                <td className="border border-gray-400 p-1 align-top text-center">Samsvar med referansenivå. Ingen tiltak nødvendig</td>
                <td className="border border-gray-400 p-1 align-top text-center">Tilstrekkelig med fortsatt normalt vedlikehold</td>
                <td className="border border-gray-400 p-1 align-top text-center">Behov for omfattende vedlikehold i form av reparasjon/utbedring</td>
                <td className="border border-gray-400 p-1 align-top text-center">Bygning, bygningsdel eller tiltak har funksjonssvikt eller kan umiddelbart svikte. Behov for omfattende reparasjon eller utskifting</td>
                <td className="border border-gray-400 p-1 align-top text-center">Vesentlige forhold som ikke er dokumentert eller som ikke kan avklares uten omfattende undersøkelser</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 font-semibold align-top">Branntekniske spesifiseringer</td>
                <td className="border border-gray-400 p-1 align-top text-center">Løsning i henhold til referansesikkerhetsnivå eller brannkonsept i henhold til aktuell forskrift</td>
                <td className="border border-gray-400 p-1 align-top text-center">Mindre avvik som ikke har stor betydning for person- og verdisikkerheten</td>
                <td className="border border-gray-400 p-1 align-top text-center">Mangler i tekniske eller organisatoriske forhold, som gir vesentlig dårligere sikkerhet enn forutsatt i referansenivået. Manglene kan skyldes slitasje, byggefeil, ukyndig vedlikehold og dårlige organisatoriske rutiner.</td>
                <td className="border border-gray-400 p-1 align-top text-center">Vesentlige mangler i den tekniske eller organisatoriske sikkerheten i forhold til det forutsatte referansenivået. Har uakseptabel risiko for mennesker, materiell eller miljø</td>
                <td className="border border-gray-400 p-1 align-top text-center">Skjult bærekonstruksjon. Manglende beregninger. Udokumentert utførelse</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 font-semibold align-top">Tiltak</td>
                <td className="border border-gray-400 p-1 align-top text-center">Ingen tiltak er nødvendig</td>
                <td className="border border-gray-400 p-1 align-top text-center">Utbedres innen 5 år</td>
                <td className="border border-gray-400 p-1 align-top text-center">Utbedres innen 2 år</td>
                <td className="border border-gray-400 p-1 align-top text-center">Må utbedres straks</td>
                <td className="border border-gray-400 p-1 align-top text-center">Må føyes til øvrig tilstandsanalyse når utført</td>
              </tr>
            </tbody>
          </table>
          <PageFooter pageNum={pageTilstandsgrader} />
        </div>
      )}

      {/* Innholdsfortegnelse - egen side */}
      <div className={pageStyle} style={pageWidth}>
        <h2 className="text-xl font-bold text-center mb-6 pb-4">
          {isTilstand ? "TILSTANDSVURDERING" : "BRANNKONSEPT"}
        </h2>
      
      {/* Innholdsfortegnelse */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">Innholdsfortegnelse</h2>
        <div className="space-y-1 text-xs">
          {isTilstand ? (
            <>
              <p><span className="font-bold">1.</span> Innledning</p>
              <p className="ml-4">1.1 Informasjon om tiltaket</p>
              <p className="ml-4">1.2 Avgrensning av vurderingen</p>
              <p className="ml-4">1.3 Kvalitetssikring (KS)</p>
              <p><span className="font-bold">2.</span> Grunnlag og forutsetninger</p>
              <p className="ml-4">2.1 Bygningsinformasjon</p>
              <p className="ml-4">2.2 Grunnlagsdokumenter</p>
              <p className="ml-4">2.3 Tilleggskrav</p>
              <p><span className="font-bold">3.</span> Brannteknisk tilstandsvurdering</p>
              <p className="ml-4">3.1 Bæreevne og stabilitet</p>
              <p className="ml-4">3.2 Sikkerhet ved eksplosjon</p>
              <p className="ml-4">3.3 {formData.regelverk === "BF85" ? "Avstand mellom bygninger" : "Tiltak mot brannspredning mellom byggverk"}</p>
              <p className="ml-4">3.4 {formData.regelverk === "BF85" ? "Brannteknisk oppdeling" : "Brannseksjoner"}</p>
              <p className="ml-4">3.5 Brannceller</p>
              <p className="ml-4">3.6 Kledninger og overflater for vegger og tak</p>
              <p className="ml-4">3.7 Tekniske installasjoner</p>
              <p className="ml-4">3.8 Generelle krav om rømning og redning</p>
              <p className="ml-4">3.9 Tiltak for å påvirke rømnings- og redningstider</p>
              <p className="ml-4">3.10 Utgang fra branncelle</p>
              <p className="ml-4">3.11 Rømningsvei</p>
              <p className="ml-4">3.12 Tilrettelegging for redning av husdyr</p>
              <p className="ml-4">3.13 Tilrettelegging for manuell slokking</p>
              <p className="ml-4">3.14 Tilrettelegging for rednings- og slokkemannskap</p>
              <p><span className="font-bold">4.</span> Revisjonshistorikk</p>
              <p><span className="font-bold">5.</span> Litteraturhenvisninger</p>
            </>
          ) : (
            <>
              <p><span className="font-bold">1.</span> Innledning</p>
              <p className="ml-4">1.1 Informasjon om tiltaket</p>
              <p className="ml-4">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</p>
              <p className="ml-4">1.3 Prosjekteringsmetode</p>
              <p className="ml-4">1.4 Avgrensning av tiltak</p>
              <p className="ml-4">1.5 Gjeldende regelverk</p>
              <p className="ml-4">1.6 Kvalitetssikring (KS)</p>
              <p><span className="font-bold">2.</span> Grunnlag og forutsetninger for brannteknisk prosjektering</p>
              <p className="ml-4">2.1 Beskrivelse av bygning og branntekniske forutsetninger</p>
              <p className="ml-4">2.2 Grunnlagsdokumenter</p>
              <p className="ml-4">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</p>
              <p><span className="font-bold">3.</span> Beskrivelse av branntekniske ytelseskrav</p>
              <p className="ml-4">3.1 § 11-4 Bæreevne og stabilitet</p>
              <p className="ml-4">3.2 § 11-5 Sikkerhet ved eksplosjon</p>
              <p className="ml-4">3.3 § 11-6 Tiltak mot brannspredning mellom byggverk</p>
              <p className="ml-4">3.4 § 11-7 Brannseksjoner</p>
              <p className="ml-4">3.5 § 11-8 Brannceller</p>
              <p className="ml-4">3.6 § 11-9 Materialer og produkters egenskaper ved brann</p>
              <p className="ml-4">3.7 § 11-10 Tekniske installasjoner</p>
              <p className="ml-4">3.8 § 11-11 Generelle krav om rømning og redning</p>
              <p className="ml-4">3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider</p>
              <p className="ml-4">3.10 § 11-13 Utgang fra branncelle</p>
              <p className="ml-4">3.11 § 11-14 Rømningsvei</p>
              <p className="ml-4">3.12 § 11-15 Tilrettelegging for redning av husdyr</p>
              <p className="ml-4">3.13 § 11-16 Tilrettelegging for manuell slokking</p>
              <p className="ml-4">3.14 § 11-17 Tilrettelegging for rednings- og slokkemannskap</p>
              <p><span className="font-bold">4.</span> Utførelses- og driftsfasen</p>
              <p className="ml-4">4.1 Utførelsesfasen</p>
              <p className="ml-4">4.2 Driftsfasen</p>
              <p><span className="font-bold">5.</span> Revisjonshistorikk</p>
              <p><span className="font-bold">6.</span> Litteraturhenvisninger</p>
            </>
          )}
        </div>
      </section>
      <PageFooter pageNum={pageInnhold} />
      </div>

      {/* Kapittel 1 - egen side */}
      <div className={pageStyle} style={pageWidth}>
      {/* 1. Innledning */}
      <section className="mb-6">
        <h2 id="preview-kap1" className="font-bold mb-3">1. Innledning</h2>
        
        <h3 className="font-semibold mb-2">1.1 Informasjon om tiltaket</h3>
        <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold w-1/3">Oppdragsgiver</td>
              <td className="border border-gray-400 p-2">{formData.oppdragsgiver || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Prosjektnavn</td>
              <td className="border border-gray-400 p-2">{formData.prosjektnavn || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Adresse</td>
              <td className="border border-gray-400 p-2">{formData.adresse || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Gnr/Bnr</td>
              <td className="border border-gray-400 p-2">{formData.gnr || formData.bnr ? `${formData.gnr || "—"}/${formData.bnr || "—"}` : "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Kommune</td>
              <td className="border border-gray-400 p-2">{formData.kommune || "[Angis]"}</td>
            </tr>
            {!isTilstand && (
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Type tiltak</td>
              <td className="border border-gray-400 p-2">{formData.tiltakstype || "[Angis]"}</td>
            </tr>
            )}
            {isTilstand && (
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Kunde</td>
              <td className="border border-gray-400 p-2">{formData.kunde || "[Angis]"}</td>
            </tr>
            )}
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Beskrivelse av tiltaket</td>
              <td className="border border-gray-400 p-2">{formData.tiltaksbeskrivelse || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Særskilt brannobjekt</td>
              <td className="border border-gray-400 p-2">{formData.saerskiltBrannobjekt || "[Angis]"}</td>
            </tr>
          </tbody>
        </table>

        {!isTilstand && (
        <>
        <h3 className="font-semibold mb-2">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</h3>
        <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold w-1/3">Tiltakshaver</td>
              <td className="border border-gray-400 p-2">{formData.tiltakshaver || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Ansvarlig søker (SØK)</td>
              <td className="border border-gray-400 p-2">{formData.ansvarligSoker || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Kunde</td>
              <td className="border border-gray-400 p-2">{formData.kunde || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">PRO RiBr</td>
              <td className="border border-gray-400 p-2">{formData.proRibr || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">KPR RiBr</td>
              <td className="border border-gray-400 p-2">{formData.kprRibr || "[Angis]"}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-semibold mb-2">1.3 Prosjekteringsmetode</h3>
        <p className="ml-4 mb-2">
          {formData.prosjekteringsmetode === "preakseptert" && "Prosjekteringen er basert på preaksepterte ytelser i henhold til VTEK17."}
          {formData.prosjekteringsmetode === "analyse" && "Prosjekteringen er basert på analyse (fraviksprosjektering)."}
          {formData.prosjekteringsmetode === "blanding" && "Prosjekteringen er basert på en blandingsløsning med preaksepterte ytelser og analyse."}
        </p>
        {(formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") && (
          <div className="ml-4 mb-3">
            <p className="font-medium text-xs mb-1">Beskrivelse av fravik:</p>
            <p className="text-xs">{formData.fravikBeskrivelse || "[Fraviksbeskrivelse angis]"}</p>
            {formData.tiltaksklasse === "Tiltaksklasse 1" && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800">
                <strong>Merk:</strong> Prosjektet er i tiltaksklasse 1. Fravik fra preaksepterte ytelser krever normalt høyere tiltaksklasse.
              </div>
            )}
          </div>
        )}

        <h3 className="font-semibold mb-2">1.4 Avgrensning av tiltak</h3>
        <p className="ml-4 mb-3">{formData.avgrensning || "[Avgrensning beskrives]"}</p>
        {formData.avgrensningBilde && (
          <div className="ml-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Bildestørrelse:</span>
              <input
                type="range"
                min={20}
                max={100}
                value={formData.avgrensningBildeBreddeProsent || 100}
                onChange={(e) => {
                  if (formData.onUpdateField) {
                    formData.onUpdateField("avgrensningBildeBreddeProsent", Number(e.target.value));
                  }
                }}
                className="w-32 h-1.5 accent-primary"
              />
              <span className="text-xs text-muted-foreground">{formData.avgrensningBildeBreddeProsent || 100}%</span>
            </div>
            <img
              src={formData.avgrensningBilde}
              alt="Tiltaksavgrensning"
              style={{ width: `${formData.avgrensningBildeBreddeProsent || 100}%` }}
              className="border border-border rounded"
            />
            <p className="text-xs italic text-muted-foreground mt-1">Figur: Tiltaksavgrensning</p>
          </div>
        )}

        <h3 className="font-semibold mb-2">1.5 Gjeldende regelverk</h3>
        <div className="ml-4 mb-3">
          {(formData.gjeldendeRegelverk || "• TEK17 - Forskrift om tekniske krav til byggverk\n• VTEK17 - Veiledning til teknisk forskrift").split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <h3 className="font-semibold mb-2">1.6 Kvalitetssikring (KS)</h3>
        <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left">Type</th>
              <th className="border border-gray-400 p-2 text-left">Utført av</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Egenkontroll</td>
              <td className="border border-gray-400 p-2">{formData.ksEgenkontrollUtfortAv || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Sidemannskontroll</td>
              <td className="border border-gray-400 p-2">{formData.ksSidemannskontrollUtfortAv || "[Angis]"}</td>
            </tr>
          </tbody>
        </table>
        </>
        )}

        {isTilstand && (
        <>
        <h3 className="font-semibold mb-2">1.2 Avgrensning av vurderingen</h3>
        <p className="ml-4 mb-3">{formData.avgrensning || "[Avgrensning beskrives]"}</p>

        <h3 className="font-semibold mb-2">1.3 Kvalitetssikring (KS)</h3>
        <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left">Type</th>
              <th className="border border-gray-400 p-2 text-left">Utført av</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Egenkontroll</td>
              <td className="border border-gray-400 p-2">{formData.ksEgenkontrollUtfortAv || "[Angis]"}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Sidemannskontroll</td>
              <td className="border border-gray-400 p-2">{formData.ksSidemannskontrollUtfortAv || "[Angis]"}</td>
            </tr>
          </tbody>
        </table>
        </>
        )}
      </section>
      <PageFooter pageNum={pageKap1} />
      </div>

      {/* Kapittel 2 / Kap 1 forts. - egen side */}
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        {isTilstand ? (
           <h2 id="preview-kap2" className="font-bold mb-3">2. Grunnlag og forutsetninger</h2>
         ) : (
           <h2 id="preview-kap2" className="font-bold mb-3">2. Grunnlag og forutsetninger for brannteknisk prosjektering</h2>
        )}
        
        <h3 className="font-semibold mb-2">{isTilstand ? "2.1 Bygningsinformasjon" : "2.1 Beskrivelse av bygning og branntekniske forutsetninger"}</h3>
        {isTilstand ? (
          <>
          {/* For tilstandsvurdering: bygningsinfo først */}
          <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold w-1/3">Bygningstype</td>
                <td className="border border-gray-400 p-2">{formData.bygningstype || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Bruttoareal</td>
                <td className="border border-gray-400 p-2">{formData.areal || "[Angis]"} m²</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Antall etasjer (totalt)</td>
                <td className="border border-gray-400 p-2">{formData.etasjer || "[Angis]"}</td>
              </tr>
              {formData.etasjerUnderBakken && parseInt(formData.etasjerUnderBakken, 10) > 0 && (
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Hvorav under bakken</td>
                <td className="border border-gray-400 p-2">{formData.etasjerUnderBakken}</td>
              </tr>
              )}
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Spesifikk brannenergi</td>
                <td className="border border-gray-400 p-2">
                  {formData.brannseksjonBrannenergi === "over400" ? "Over 400 MJ/m²"
                    : formData.brannseksjonBrannenergi === "50-400" ? "50–400 MJ/m²"
                    : formData.brannseksjonBrannenergi === "under50" ? "Under 50 MJ/m²"
                    : "[Angis]"}
                </td>
              </tr>
              {isBF85 ? (
              <>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Bygningsbrannklasse</td>
                <td className="border border-gray-400 p-2">{formData.bygningsbrannklasse ? `Bygningsbrannklasse ${formData.bygningsbrannklasse}` : "[Angis]"}</td>
              </tr>
              {formData.bygningsbrannklasse && (() => {
                const bklMap: Record<string, string> = { "1": "3", "2": "2", "3": "1", "4": "" };
                const bkl = bklMap[formData.bygningsbrannklasse];
                const rkMap: Record<string, string> = { "Bolig": "RK4", "Boligblokk": "RK4", "Hotell": "RK6", "Sykehus": "RK6", "Sykehjem": "RK6", "Pleieinstitusjon": "RK6", "Kontor": "RK2", "Skole": "RK3", "Barnehage": "RK3", "Forsamlingslokale": "RK5", "Handelsbygg": "RK5", "Industri": "RK2", "Lager": "RK2", "Kraftstasjon": "RK2", "Garasje": "RK2" };
                const rk = rkMap[formData.bygningstype] || "";
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold align-top">Tilsvarende etter TEK17</td>
                    <td className="border border-gray-400 p-2">
                      {formData.bygningsbrannklasse === "4"
                        ? "Ingen direkte tilsvarende brannklasse i TEK17."
                        : <>Brannklasse <strong>BKL {bkl}</strong>{rk && <>, Risikoklasse <strong>{rk}</strong> ({formData.bygningstype})</>}</>}
                      <div className="italic text-gray-600 text-[10px] mt-1">Veiledende mapping – BF85 og TEK17 har ulike inndelingsprinsipper.</div>
                    </td>
                  </tr>
                );
              })()}
              </>
              ) : (
              <>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Risikoklasse</td>
                <td className="border border-gray-400 p-2">{formData.risikoklasse || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Brannklasse</td>
                <td className="border border-gray-400 p-2">{formData.brannklasse || "[Angis]"}</td>
              </tr>
              </>
              )}
            </tbody>
          </table>
          {formData.bygningsinfoKommentar && (
            <p className="text-xs whitespace-pre-wrap mb-3">{formData.bygningsinfoKommentar}</p>
          )}

          <h3 className="font-semibold mb-2">2.2 Grunnlagsdokumenter</h3>
          {grunnlagsdokumenter.length > 0 ? (
            <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Dokument</th>
                  <th className="border border-gray-400 p-2 text-left">Utarbeidet av / firma</th>
                  <th className="border border-gray-400 p-2 text-left">Datert</th>
                </tr>
              </thead>
              <tbody>
                {grunnlagsdokumenter.map((doc: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-2">{doc.navn || "-"}</td>
                    <td className="border border-gray-400 p-2">{doc.utarbeidetAv || "-"}</td>
                    <td className="border border-gray-400 p-2">{doc.dato ? doc.dato.split('-').reverse().join('.') : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="ml-4 mb-3">[Liste over tegninger og dokumenter]</p>
          )}

          <h3 className="font-semibold mb-2">2.3 Tilleggskrav</h3>
          <p className="ml-4 mb-3 whitespace-pre-wrap">{formData.tilleggskrav || "[Eventuelle tilleggskrav beskrives]"}</p>
          </>
        ) : (
          <>
          {/* For brannkonsept: bygningsinfo som 2.1, grunnlagsdokumenter som 2.2 */}
          {isBF85 ? (
            <>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold w-1/3">Bygningstype</td>
                    <td className="border border-gray-400 p-2">{formData.bygningstype || "[Angis]"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold">Bruttoareal</td>
                    <td className="border border-gray-400 p-2">{formData.areal || "[Angis]"} m²</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold">Antall etasjer (totalt)</td>
                    <td className="border border-gray-400 p-2">{formData.etasjer || "[Angis]"}</td>
                  </tr>
                  {formData.etasjerUnderBakken && parseInt(formData.etasjerUnderBakken, 10) > 0 && (
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold">Hvorav under bakken</td>
                    <td className="border border-gray-400 p-2">{formData.etasjerUnderBakken}</td>
                  </tr>
                  )}
                </tbody>
              </table>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold w-1/3">Bygningsbrannklasse (BF85)</td>
                    <td className="border border-gray-400 p-2">
                      {formData.bygningsbrannklasse ? `Bygningsbrannklasse ${formData.bygningsbrannklasse}` : "[Angis]"}
                    </td>
                  </tr>
                  {formData.bygningsbrannklasse && (() => {
                    const bklMap: Record<string, string> = { "1": "3", "2": "2", "3": "1", "4": "" };
                    const bkl = bklMap[formData.bygningsbrannklasse];
                    const rkMap: Record<string, string> = { "Bolig": "RK4", "Boligblokk": "RK4", "Hotell": "RK6", "Sykehus": "RK6", "Sykehjem": "RK6", "Pleieinstitusjon": "RK6", "Kontor": "RK2", "Skole": "RK3", "Barnehage": "RK3", "Forsamlingslokale": "RK5", "Handelsbygg": "RK5", "Industri": "RK2", "Lager": "RK2", "Kraftstasjon": "RK2", "Garasje": "RK2" };
                    const rk = rkMap[formData.bygningstype] || "";
                    return (
                      <tr>
                        <td className="border border-gray-400 p-2 font-semibold align-top">Tilsvarende etter TEK17</td>
                        <td className="border border-gray-400 p-2">
                          {formData.bygningsbrannklasse === "4"
                            ? "Ingen direkte tilsvarende brannklasse i TEK17."
                            : <>Brannklasse <strong>BKL {bkl}</strong>{rk && <>, Risikoklasse <strong>{rk}</strong> ({formData.bygningstype})</>}</>}
                          <div className="italic text-gray-600 text-[10px] mt-1">Veiledende mapping – BF85 og TEK17 har ulike inndelingsprinsipper.</div>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
              {formData.bygningsinfoKommentar && (
                <p className="text-xs whitespace-pre-wrap mb-3">{formData.bygningsinfoKommentar}</p>
              )}
            </>
          ) : formData.harFlereRisikoklasser && bygningsdeler.length > 0 ? (
            <>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left">Bygningsdel</th>
                    <th className="border border-gray-400 p-2 text-left">Bygningstype</th>
                    <th className="border border-gray-400 p-2 text-left">Areal</th>
                    <th className="border border-gray-400 p-2 text-left">Etasjer</th>
                    <th className="border border-gray-400 p-2 text-left">Risikoklasse</th>
                    <th className="border border-gray-400 p-2 text-left">Brannklasse</th>
                    <th className="border border-gray-400 p-2 text-left">Brannenergi</th>
                    {formData.regelverk !== "BF85" && (
                      <th className="border border-gray-400 p-2 text-left">Univ. utforming</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const del1Brannklasse = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                    const del1BrannenergiLabel = formData.brannseksjonBrannenergi === "over400" ? "Over 400 MJ/m²" 
                      : formData.brannseksjonBrannenergi === "50-400" ? "50-400 MJ/m²" 
                      : formData.brannseksjonBrannenergi === "under50" ? "Under 50 MJ/m²" 
                      : "-";
                    return (
                      <tr>
                        <td className="border border-gray-400 p-2">Bygningsdel 1</td>
                        <td className="border border-gray-400 p-2">{formData.bygningstype || "-"}</td>
                        <td className="border border-gray-400 p-2">{formData.areal ? `${formData.areal} m²` : "-"}</td>
                        <td className="border border-gray-400 p-2">{formData.etasjer || "-"}</td>
                        <td className="border border-gray-400 p-2">{formData.risikoklasse || "-"}</td>
                        <td className="border border-gray-400 p-2">{del1Brannklasse || "-"}</td>
                        <td className="border border-gray-400 p-2">{del1BrannenergiLabel}</td>
                        {formData.regelverk !== "BF85" && (
                          <td className="border border-gray-400 p-2">{formData.universellUtforming ? "Ja" : "Nei"}</td>
                        )}
                      </tr>
                    );
                  })()}
                  {bygningsdeler.map((del: any, index: number) => {
                    const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                    const brannenergiLabel = del.spesifikkBrannenergi === "over400" ? "Over 400 MJ/m²" 
                      : del.spesifikkBrannenergi === "50-400" ? "50-400 MJ/m²" 
                      : del.spesifikkBrannenergi === "under50" ? "Under 50 MJ/m²" 
                      : "-";
                    return (
                      <tr key={del.id || index}>
                        <td className="border border-gray-400 p-2">{`Bygningsdel ${index + 2}`}</td>
                        <td className="border border-gray-400 p-2">{del.bygningstype || "-"}</td>
                        <td className="border border-gray-400 p-2">{del.areal ? `${del.areal} m²` : "-"}</td>
                        <td className="border border-gray-400 p-2">{del.etasjer || "-"}</td>
                        <td className="border border-gray-400 p-2">{del.risikoklasse || "-"}</td>
                        <td className="border border-gray-400 p-2">{delBrannklasse || "-"}</td>
                        <td className="border border-gray-400 p-2">{brannenergiLabel}</td>
                        {formData.regelverk !== "BF85" && (
                          <td className="border border-gray-400 p-2">{del.universellUtforming ? "Ja" : "Nei"}</td>
                        )}
                      </tr>
                    );
                  })}
                   <tr>
                    <td className="border border-gray-400 p-2 font-semibold" colSpan={2}>Tiltaksklasse</td>
                    <td className="border border-gray-400 p-2" colSpan={formData.regelverk === "BF85" ? 5 : 6}>
                      {formData.tiltaksklasse || "[Angis]"}
                      {formData.tiltaksklasseBegrunnelse && (
                        <p className="text-xs italic mt-1">Begrunnelse: {formData.tiltaksklasseBegrunnelse}</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold w-1/3">Bygningstype</td>
                  <td className="border border-gray-400 p-2">{formData.bygningstype || "[Angis]"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Bruttoareal</td>
                  <td className="border border-gray-400 p-2">{formData.areal || "[Angis]"} m²</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Antall etasjer (totalt)</td>
                  <td className="border border-gray-400 p-2">{formData.etasjer || "[Angis]"}</td>
                </tr>
                {formData.etasjerUnderBakken && parseInt(formData.etasjerUnderBakken, 10) > 0 && (
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Hvorav under bakken</td>
                  <td className="border border-gray-400 p-2">{formData.etasjerUnderBakken}</td>
                </tr>
                )}
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Risikoklasse</td>
                  <td className="border border-gray-400 p-2">{formData.risikoklasse || "[Angis]"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Brannklasse</td>
                  <td className="border border-gray-400 p-2">
                    {formData.brannklasse || "[Angis]"}
                    {formData.brannklasseUnntak && (
                      <span className="block text-blue-600 text-xs mt-1 italic">{formData.brannklasseUnntak}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Tiltaksklasse</td>
                  <td className="border border-gray-400 p-2">
                    {formData.tiltaksklasse || "[Angis]"}
                    {formData.tiltaksklasseBegrunnelse && (
                      <p className="text-xs italic mt-1">Begrunnelse: {formData.tiltaksklasseBegrunnelse}</p>
                    )}
                  </td>
                </tr>
                {formData.regelverk !== "BF85" && (
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Universell utforming</td>
                  <td className="border border-gray-400 p-2">
                    {formData.universellUtforming ? "Ja" : "Nei"}
                  </td>
                </tr>
                )}
              </tbody>
            </table>
          )}
          {formData.bygningsinfoKommentar && (
            <p className="text-xs whitespace-pre-wrap mb-3">{formData.bygningsinfoKommentar}</p>
          )}

          <h3 className="font-semibold mb-2">2.2 Grunnlagsdokumenter</h3>
          {grunnlagsdokumenter.length > 0 ? (
            <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Dokument</th>
                  <th className="border border-gray-400 p-2 text-left">Utarbeidet av / firma</th>
                  <th className="border border-gray-400 p-2 text-left">Datert</th>
                </tr>
              </thead>
              <tbody>
                {grunnlagsdokumenter.map((doc: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-2">{doc.navn || "-"}</td>
                    <td className="border border-gray-400 p-2">{doc.utarbeidetAv || "-"}</td>
                    <td className="border border-gray-400 p-2">{doc.dato ? doc.dato.split('-').reverse().join('.') : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="ml-4 mb-3">[Liste over tegninger og dokumenter]</p>
          )}

          <h3 className="font-semibold mb-2">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</h3>
          <p className="ml-4 mb-3 whitespace-pre-wrap">{formData.tilleggskrav || "[Eventuelle tilleggskrav beskrives]"}</p>
          </>
        )}
      </section>
      <PageFooter pageNum={pageKap2} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      {/* Branntekniske ytelseskrav */}
      <section className="mb-6">
        <h2 id="preview-kap3" className="font-bold mb-3">3. {isTilstand ? "Brannteknisk tilstandsvurdering" : "Beskrivelse av branntekniske ytelseskrav"}</h2>
        
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.1 / 2.1 Bæreevne og stabilitet */}
            {isBF85 ? (
              /* ── BF85: Tabell 30:41 ── */
              <>
                <tr id="preview-3-1" style={sectionRowStyle}>
                  <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                    {sp}.1 &nbsp;&nbsp; Kap. 30:41 Bæreevne og stabilitet (Bygningsbrannklasse) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-4 Bæreevne og stabilitet)</span>
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left" style={{width: '35%'}}>Bygningsdel</th>
                  <th className="border border-gray-400 p-2 text-left">Brannmotstand (BF85 Tabell 30:41)</th>
                  <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
                </tr>
                {(() => {
                  const bf85 = getBaereevneTekstBF85(formData.bygningsbrannklasse || "");
                  if (!bf85.kravTabell) {
                    return (
                      <tr>
                        <td className="border border-gray-400 p-2 italic" colSpan={3}>
                          Bygningsbrannklasse ikke fastsatt – krav kan ikke beregnes.
                        </td>
                      </tr>
                    );
                  }
                  const k = bf85.kravTabell;
                  const rows = [
                    { label: "Bærende hovedsystem", value: k.hovedsystem },
                    { label: "Sekundære bærende deler, etasjeskiller (ikke stabiliserende)", value: k.sekundaer },
                    { label: "Ikke-bærende branncellebegrensende bygningsdel (unntatt yttervegg)", value: k.branncellebegrensende },
                    { label: "Bygningsdel under øverste kjellergolv", value: k.kjeller },
                    { label: "Bygningsdel som omgir trapperom og heissjakt", value: k.trapperomOgHeissjakt },
                    { label: "Trappeløp", value: k.trappeloep },
                  ];
                  return rows.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-gray-400 p-2">{r.label}</td>
                      <td className="border border-gray-400 p-2 text-red-600 font-medium">{r.value}</td>
                      <td className="border border-gray-400 p-2">RIB</td>
                    </tr>
                  ));
                })()}
                {formData.balkongRelevant && (
                  <tr>
                    <td className="border border-gray-400 p-2">Balkonger / utkragede deler</td>
                    <td className="border border-gray-400 p-2">Balkonger og utkragede bygningsdeler skal ha forsvarlig innfesting for å hindre nedfall under brann.</td>
                    <td className="border border-gray-400 p-2">RIB</td>
                  </tr>
                )}
                {formData.baereevneKommentar && (
                  <tr>
                    <td className="border border-gray-400 p-2 italic text-sm" colSpan={3}>
                      Kommentar: {formData.baereevneKommentar}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="border border-gray-400 p-2 italic text-xs text-gray-600" colSpan={3}>
                    I bygning uten loft eller med loft som ikke kan nyttes som lager, behøver kravene ikke oppfylles for takkonstruksjoner av ubrennbare materialer. For bygning i 1–2 etasjer gjelder lempninger for takkonstruksjoner av brennbare materialer med kledning K1 og ubrennbart isolasjonsmateriale.
                  </td>
                </tr>
              </>
            ) : formData.harFlereRisikoklasser && bygningsdeler.length > 0 ? (
              <>
                <tr id="preview-3-1" style={sectionRowStyle}>
                  <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                    {sp}.1 &nbsp;&nbsp; §11-4 Bæreevne og stabilitet
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                  <th className="border border-gray-400 p-2 text-left">Løsning</th>
                  <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
                </tr>
                {(() => {
                  const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                  const alleDeler = [
                    { id: 'del1', navn: formData.bygningstype || 'Bygningsdel 1', brannklasse: del1Bkl, index: 1 },
                    ...bygningsdeler.map((del: any, i: number) => ({
                      id: del.id || `del${i+2}`,
                      navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`,
                      brannklasse: del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse,
                      index: i + 2,
                    }))
                  ];
                  const maxBkl = Math.max(...alleDeler.map(d => parseInt(d.brannklasse?.replace("BKL", "") || "1")));
                  const genereltTekst = maxBkl >= 3
                    ? "Det bærende hovedsystemet i byggverk i brannklasse 3 og 4 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet gjennom et fullstendig brannforløp, slik dette kan modelleres."
                    : "Bæresystemet i byggverk i brannklasse 1 og 2 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet i minimum den tiden som er nødvendig for å rømme og redde personer og husdyr i og på byggverket.";

                  // Parse baereevne textarea into sections per bygningsdel
                  const baereevneTekst = formData.baereevne || "";
                  const sectionBlocks = baereevneTekst.split(/\[Bygningsdel \d+/).filter((s: string) => s.trim());
                  
                  // Parse each section block into label:value pairs
                  const parsedSections = sectionBlocks.map((block: string) => {
                    const lines = block.split('\n').filter((l: string) => l.trim());
                    // First line contains the header like "– Bolig (BKL2)]"
                    const header = lines[0]?.replace(/^[^–]*–\s*/, '').replace(/\]$/, '').trim() || '';
                    const kravLines = lines.slice(1).filter((l: string) => l.includes(':'));
                    return { header, kravLines };
                  });

                  // Collect unique krav labels across all sections
                  const allLabels: string[] = [];
                  parsedSections.forEach((section: any) => {
                    section.kravLines.forEach((line: string) => {
                      const label = line.split(':')[0]?.trim();
                      if (label && !allLabels.includes(label)) allLabels.push(label);
                    });
                  });

                  return (
                    <>
                      <tr>
                        <td className="border border-gray-400 p-2">Generelt</td>
                        <td className="border border-gray-400 p-2">
                          <p>{genereltTekst}</p>
                          {formData.balkongRelevant && (
                            <p className="mt-2">Balkonger, utkragede bygningsdeler og lignende må ha forsvarlig innfesting for å hindre nedfall som kan skade rednings- og slokkemannskapene og deres materiell under førsteinnsatsen. Tyngre bygningsdeler, som for eksempel balkonger, må forankres i byggverkets hovedbæresystem.</p>
                          )}
                        </td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      {allLabels.map((label, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-400 p-2">{label}</td>
                          <td className="border border-gray-400 p-2">
                            {alleDeler.map((del, delIdx) => {
                              const section = parsedSections[delIdx];
                              const matchLine = section?.kravLines.find((l: string) => l.startsWith(label + ':'));
                              const value = matchLine ? matchLine.split(':').slice(1).join(':').trim() : '-';
                              return (
                                <p key={del.id} className={delIdx > 0 ? "mt-1" : ""}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.brannklasse}):</span>{" "}
                                  <span className="text-red-600 font-medium">{value}</span>
                                </p>
                              );
                            })}
                          </td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
                {formData.baereevneKommentar && (
                  <tr>
                    <td className="border border-gray-400 p-2 italic text-sm" colSpan={3}>
                      Kommentar: {formData.baereevneKommentar}
                    </td>
                  </tr>
                )}
              </>
            ) : (
              <>
                <tr id="preview-3-1" style={sectionRowStyle}>
                  <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                    {sp}.1 &nbsp;&nbsp; §11-4 Bæreevne og stabilitet
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                  <th className="border border-gray-400 p-2 text-left">Løsning</th>
                  <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
                </tr>
                {(() => {
                  const bklNum = parseInt(formData.brannklasse?.replace("BKL", "") || "1");
                  const genereltTekst = bklNum >= 3
                    ? "Det bærende hovedsystemet i byggverk i brannklasse 3 og 4 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet gjennom et fullstendig brannforløp, slik dette kan modelleres."
                    : "Bæresystemet i byggverk i brannklasse 1 og 2 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet i minimum den tiden som er nødvendig for å rømme og redde personer og husdyr i og på byggverket.";
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2">Generelt</td>
                      <td className="border border-gray-400 p-2">
                        <p>{genereltTekst}</p>
                        {formData.balkongRelevant && (
                          <p className="mt-2">Balkonger, utkragede bygningsdeler og lignende må ha forsvarlig innfesting for å hindre nedfall som kan skade rednings- og slokkemannskapene og deres materiell under førsteinnsatsen. Tyngre bygningsdeler, som for eksempel balkonger, må forankres i byggverkets hovedbæresystem.</p>
                        )}
                      </td>
                      <td className="border border-gray-400 p-2">RIB</td>
                    </tr>
                  );
                })()}
                {(() => {
                  const lines = (formData.baereevne || "").split("\n").filter((l: string) => l.trim());
                  if (lines.length >= 2) {
                    return lines.map((line: string, idx: number) => {
                      const parts = line.split(":");
                      const label = parts[0]?.trim() || `Krav ${idx + 1}`;
                      const value = parts.slice(1).join(":").trim() || "-";
                      return (
                        <tr key={idx}>
                          <td className="border border-gray-400 p-2">{label}</td>
                          <td className="border border-gray-400 p-2 font-medium">{value}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                      );
                    });
                  }
                  if (formData.baereevne) {
                    return (
                      <tr>
                        <td className="border border-gray-400 p-2">Generelt</td>
                        <td className="border border-gray-400 p-2">{formData.baereevne}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                    );
                  }
                  return null;
                })()}
                {formData.baereevneKommentar && (
                  <tr>
                    <td className="border border-gray-400 p-2 italic text-sm" colSpan={3}>
                      Kommentar: {formData.baereevneKommentar}
                    </td>
                  </tr>
                )}
              </>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_1"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_1"]} sectionLabel="3.1 Bæreevne og stabilitet" />
            )}

            {/* 3.2 §11-5 Sikkerhet ved eksplosjon */}
            <tr id="preview-3-2" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                {sp}.2 &nbsp;&nbsp; {formData.regelverk === "BF85" ? <>Sikkerhet ved eksplosjon <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-5 Sikkerhet ved eksplosjon)</span></> : "§11-5 Sikkerhet ved eksplosjon"}
              </td>
            </tr>
            {formData.regelverk === "BF85" && (
              <tr>
                <td className="border border-gray-400 p-2 italic text-muted-foreground" colSpan={3}>
                  Sikkerhet ved eksplosjon er ikke spesifikt kravsatt i BF85, men må likevel vurderes i en tilstandsvurdering.
                </td>
              </tr>
            )}
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelt</td>
              <td className="border border-gray-400 p-2">
                Byggverk der den forutsatte bruken kan medføre fare for eksplosjon, skal prosjekteres og utføres med avlastningsflater slik at personsikkerheten og bæreevnen opprettholdes på et tilfredsstillende nivå.
              </td>
              <td className="border border-gray-400 p-2 align-top">RIBr</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Eksplosjonsfare</td>
              <td className="border border-gray-400 p-2">
                {formData.eksplosjonRelevant === "ikke_relevant" ? (
                  "RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket."
                ) : formData.eksplosjonRelevant === "relevant" ? (
                  <div className="space-y-2">
                    {formData.eksplosjonBeskrivelse && (
                      <p>{formData.eksplosjonBeskrivelse}</p>
                    )}
                    <p className="font-semibold">Preaksepterte ytelser (jf. VTEK § 11-5):</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Rom hvor det kan forekomme fare for eksplosjon, må utgjøre en egen branncelle.</li>
                      <li>Rom hvor det kan forekomme fare for eksplosjon, må ha minst én trykkavlastningsflate.</li>
                      <li>Avlastet trykk må ledes bort i sikker retning.</li>
                      <li>Trykkavlastningsflater må ikke plasseres i takflater med mindre snølast ikke hindrer funksjon.</li>
                      <li>Bærende og branncellebegrensende bygningsdeler må forsterkes ved behov.</li>
                    </ol>
                    <p className="mt-2">Farlige stoffer skal håndteres og lagres i henhold til relevante standarder, herunder forskrift om håndtering av farlig stoff og forskrift om elektriske forsyningsanlegg.</p>
                  </div>
                ) : "[Vurdering av eksplosjonsfare]"}
                {formData.eksplosjonKommentar && <><br/><br/><span className="italic">Kommentar: {formData.eksplosjonKommentar}</span></>}
              </td>
              <td className="border border-gray-400 p-2 align-top">RIBr</td>
            </tr>
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_2"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_2"]} sectionLabel="3.2 Sikkerhet ved eksplosjon" />
            )}

            {/* 3.3 §11-6 / BF85 :32 Brannspredning mellom byggverk */}
            <tr id="preview-3-3" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                {sp}.3 &nbsp;&nbsp; {formData.regelverk === "BF85" ? <>Avstand mellom bygninger (Kap. 30:32) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-6 Tiltak mot brannspredning mellom byggverk)</span></> : "§11-6 Brannspredning mellom byggverk"}
              </td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>

            {formData.nabobyggIkkeRelevant ? (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Nabobygg</td>
                <td className="border border-gray-400 p-2">
                  Nabobygg ligger så langt unna at det er vurdert som ikke relevant. Krav til avstand og branncellevegg/brannvegg mot nabobygg er ikke aktuelt.
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            ) : formData.regelverk === "BF85" ? (
              <>
                {/* BF85 Kap 30:32 */}
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt</td>
                  <td className="border border-gray-400 p-2">
                    Krav til avstand mellom bygninger og mellom grupper av bygninger vurderes iht. BF85 Kap. 30:32. Gesimshøyde måles bare på motstående vegger.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>

                {formData.bf85SkiltMedBrannvegg === "ja" ? (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">:321 Brannvegg</td>
                    <td className="border border-gray-400 p-2">
                      Bygningene er skilt med brannvegg. Det stilles ingen krav til avstand mellom bygninger som er skilt med brannvegg.
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                ) : (
                  <>
                    {/* Gesimshøyde og avstand */}
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Gesimshøyde</td>
                      <td className="border border-gray-400 p-2">
                        Egen bygning: {formData.gesimshoydeEgen ? `${formData.gesimshoydeEgen} m` : "[Ikke angitt]"}
                        {" · "}
                        Nabobygning: {formData.gesimshoydeNabo ? `${formData.gesimshoydeNabo} m` : "[Ikke angitt]"}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">-</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Faktisk avstand</td>
                      <td className="border border-gray-400 p-2">{formData.avstandNabobygg ? `${formData.avstandNabobygg} m` : "[Ikke angitt]"}</td>
                      <td className="border border-gray-400 p-2 align-top">-</td>
                    </tr>

                    {/* Beregnet minsteavstand */}
                    {(() => {
                      const hEgen = parseFloat(formData.gesimshoydeEgen) || 0;
                      const hNabo = parseFloat(formData.gesimshoydeNabo) || 0;
                      const faktisk = parseFloat(formData.avstandNabobygg) || 0;
                      if (hEgen > 0 && hNabo > 0) {
                        const gjennomsnitt = (hEgen + hNabo) / 2;
                        const beregnet = gjennomsnitt / 2;
                        const minsteAvstand = Math.max(beregnet, 8);
                        const oppfylt = faktisk >= minsteAvstand;
                        return (
                          <tr>
                            <td className="border border-gray-400 p-2 align-top font-semibold">:322 Minsteavstand</td>
                            <td className="border border-gray-400 p-2">
                              <p>Gjennomsnittlig gesimshøyde: ({hEgen} + {hNabo}) / 2 = {gjennomsnitt.toFixed(1)} m. Halvparten: {beregnet.toFixed(1)} m{beregnet < 8 ? " → minimum 8,0 m" : ""}</p>
                              <p className="font-semibold mt-1">Krav: {minsteAvstand.toFixed(1)} m</p>
                              {faktisk > 0 && (
                                <p className={`mt-1 font-semibold ${oppfylt ? "text-green-700" : "text-red-700"}`}>
                                  {oppfylt
                                    ? `✓ Faktisk avstand (${faktisk} m) oppfyller kravet.`
                                    : `✗ Faktisk avstand (${faktisk} m) er mindre enn minsteavstanden (${minsteAvstand.toFixed(1)} m).`
                                  }
                                </p>
                              )}
                            </td>
                            <td className="border border-gray-400 p-2 align-top">RIBr</td>
                          </tr>
                        );
                      }
                      return null;
                    })()}

                    {/* Gruppe-unntak */}
                    {formData.bf85ErGruppe === "ja" && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">:3221 Unntak – bygninger i gruppe</td>
                        <td className="border border-gray-400 p-2">
                          <p>Bygningene inngår i en gruppe. To eller flere bygninger i gruppe kan ha mindre innbyrdes avstand enn angitt i :322, forutsatt at bruttoareal i en gruppe er som angitt i kap. 31–39.</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Yttervegg som kan bli utsatt for strålevarme, skal ha samme brannmotstand som branncellbegrensende bygningsdel i vedkommende bygningsbrannklasse (jf. Tabell 30:41) og være uten vindu, dør eller andre åpninger.</li>
                            <li>Kravene gjelder bare den delen av veggen som ligger nærmere nabobygningen enn minsteavstanden.</li>
                          </ul>
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* TEK17 – eksisterende logikk */}
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt</td>
                  <td className="border border-gray-400 p-2">
                    Brannspredning mellom byggverk skal forebygges slik at sikkerheten for personer og husdyr ivaretas, og at brann ikke kan føre til urimelige store økonomiske tap eller samfunnsmessige konsekvenser.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Avstand til nabobygg</td>
                  <td className="border border-gray-400 p-2">{formData.avstandNabobygg ? `${formData.avstandNabobygg} meter` : "[Ikke angitt]"}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Bygningshøyde</td>
                  <td className="border border-gray-400 p-2">{formData.bygningshoyde ? `${formData.bygningshoyde} meter` : "[Ikke angitt]"}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
                {parseFloat(formData.bygningshoyde) > 9 && parseFloat(formData.avstandNabobygg || "0") < 8 ? (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til brannvegg</td>
                    <td className="border border-gray-400 p-2">
                      <p>Brannvegg (bygning over 9 meter, avstand til nabobygg under 8 meter).</p>
                      {formData.spesifikkBrannenergi && (
                        <div className="mt-2">
                          <p className="font-semibold">Brannmotstand basert på spesifikk brannenergi:</p>
                          <p className="mt-1">
                            {formData.spesifikkBrannenergi === "inntil400" && "Inntil 400 MJ/m² → REI 120-M A2-s1,d0 [A 120]"}
                            {formData.spesifikkBrannenergi === "400-600" && "400-600 MJ/m² → REI 180-M A2-s1,d0 [A 180]"}
                            {formData.spesifikkBrannenergi === "600-800" && "600-800 MJ/m² → REI 240-M A2-s1,d0 [A 240]"}
                          </p>
                        </div>
                      )}
                      <ol className="list-decimal list-inside space-y-1 mt-2">
                        <li>Takkonstruksjonen må ikke være kontinuerlig over brannveggen.</li>
                        <li>Konstruksjoner inntil brannveggen må kunne bevege seg fritt ved temperaturendringer.</li>
                        <li>Brannveggens avslutning mot tak og fasade må hindre brannspredning.</li>
                        <li>Brannveggen må ha brannmotstand minst som angitt i tabell 1.</li>
                        <li>Brannveggen må bestå av materialer i klasse A2-s1,d0 [ubrennbare].</li>
                        <li>Uten dokumentert mekanisk motstandsevne (M): tunge materialer som mur/betong.</li>
                        <li>Brannveggen må føres min. 0,5 m over høyeste tilstøtende tak.</li>
                        <li>Brannveggen må bli stående selv om byggverket på én side raser sammen.</li>
                      </ol>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIB</td>
                  </tr>
                ) : (parseFloat(formData.bygningshoyde) > 9 && parseFloat(formData.avstandNabobygg || "0") >= 8) ? (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til skillevegg</td>
                    <td className="border border-gray-400 p-2">
                      Avstand til nabobygg er 8 meter eller mer. Krav til brannvegg gjelder ikke. Branncellebegrensende bygningsdel benyttes i stedet.
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIB</td>
                  </tr>
                ) : parseFloat(formData.bygningshoyde) > 0 && parseFloat(formData.bygningshoyde) <= 9 ? (
                  <>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Krav til skillevegg</td>
                      <td className="border border-gray-400 p-2">
                        Branncellevegg (bygning under eller lik 9 meter). Avstanden mellom lave byggverk kan være mindre enn 8,0 meter når byggverkene er skilt med branncellebegrensende bygningsdel.
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIB</td>
                    </tr>
                    {formData.risikoklasse === "RK1" && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Unntak RK1</td>
                        <td className="border border-gray-400 p-2">
                          Byggverk i risikoklasse 1 med bruttoareal ≤ 50 m² og liten/middel brannenergi kan plasseres nærmere uten særlige tiltak.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    )}
                  </>
                ) : (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Generelt</td>
                    <td className="border border-gray-400 p-2">[Krav til brannspredning vurderes etter bygningshøyde]</td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
              </>
            )}
            {formData.brannspredningKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.brannspredningKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_3"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_3"]} sectionLabel="3.3 Brannspredning mellom byggverk" />
            )}

            {/* 3.4 §11-7 Brannseksjoner / BF85 Kap 30:6 Brannteknisk oppdeling */}
            <tr id="preview-3-4" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.4 &nbsp;&nbsp; {isBF85 ? <>Brannteknisk oppdeling (Kap. 30:6) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-7 Brannseksjoner)</span></> : "§11-7 Brannseksjoner"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>

            {formData.manglerSeksjonering && formData.etablererSeksjoneringLikevel && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-semibold">
                  Nytt tiltak – {isBF85 ? "brannvegg" : "seksjoneringsvegg"}
                </td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-1">
                    {isBF85
                      ? "Brannvegg er ikke etablert i bygget i dag, men etableres som nytt tiltak iht. BF85 Kap. 30:6."
                      : "Seksjoneringsvegg er ikke etablert i bygget i dag, men etableres som nytt tiltak iht. TEK17 § 11-7."}
                  </p>
                  {formData.manglerSeksjoneringKommentar && (
                    <p className="italic">{formData.manglerSeksjoneringKommentar}</p>
                  )}
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            )}

            {formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-semibold">
                  Fravik – {isBF85 ? "brannvegg" : "seksjoneringsvegg"} mangler
                </td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-1">
                    {isBF85
                      ? "Brannvegg er ikke etablert i bygget iht. BF85 Kap. 30:6. Forholdet dokumenteres som fravik i tilstandsvurderingen."
                      : "Seksjoneringsvegg er ikke etablert i bygget iht. TEK17 § 11-7. Forholdet dokumenteres som fravik i tilstandsvurderingen."}
                  </p>
                  {formData.manglerSeksjoneringKommentar && (
                    <p className="italic">{formData.manglerSeksjoneringKommentar}</p>
                  )}
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            )}

            {isBF85 ? (
              <>
                {/* BF85 Kap 30:61 Oppdeling med brannvegg – generelt */}
                {(() => {
                  const erIK = formData.bygningstype === "Industri" || formData.bygningstype === "Kraftstasjon";
                  if (erIK) {
                    const bb = parseFloat(formData.bf85_34_brannbelastning) || 0;
                    const tiltak = formData.bf85_34_tiltak || "ingen";
                    const row = bf85Tabell3423.find((r) => bb >= r.brannbelastningMin && bb < r.brannbelastningMax);
                    let tekst: string;
                    if (!row || bb <= 0) {
                      tekst = "Største tillatt bruttoareal pr. etasje uten oppdeling med brannvegg fastsettes etter BF85 Tabell 34:23 ut fra spesifikk brannbelastning og evt. brannventilasjon/sprinkleranlegg. Velg brannbelastning på inputsiden for å hente relevant verdi.";
                    } else {
                      const maks = tiltak === "sprinkler" ? row.medSprinkler : tiltak === "brannventilasjon" ? row.medBrannventilasjon : row.utenTiltak;
                      const tiltakTekst = tiltak === "sprinkler" ? "med sprinkleranlegg" : tiltak === "brannventilasjon" ? "med brannventilasjon" : "uten brannventilasjon og sprinkleranlegg";
                      if (maks == null) {
                        tekst = `Iht. BF85 Tabell 34:23 er det for ${formData.bygningstype.toLowerCase()} med spesifikk brannbelastning ${row.brannbelastningLabel} MJ/m² ${tiltakTekst} ingen krav til oppdeling med brannvegg.`;
                      } else {
                        tekst = `Iht. BF85 Tabell 34:23 tillates inntil ${maks} m² bruttoareal pr. etasje for ${formData.bygningstype.toLowerCase()} med spesifikk brannbelastning ${row.brannbelastningLabel} MJ/m² ${tiltakTekst}, før oppdeling med brannvegg er påkrevd.`;
                      }
                    }
                    return (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Generelt (:61)</td>
                        <td className="border border-gray-400 p-2">{tekst}</td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    );
                  }
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Generelt (:61)</td>
                      <td className="border border-gray-400 p-2">
                        Største grunnflate etter kap. 31 til 39 kan økes dersom bygningen oppdeles med brannvegg i deler med høyst så store arealer som angitt.
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIBr</td>
                    </tr>
                  );
                })()}
                {formData.brannseksjoner && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                    <td className="border border-gray-400 p-2">{formData.brannseksjoner}</td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                {/* BF85 Tabell 34:23 – Industri/Kraftstasjon/Kontor/Garasje/Lager */}
                {["Industri", "Kraftstasjon", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype) && formData.bf85_34_brannbelastning && (() => {
                  const areal = parseFloat(formData.areal) || 0;
                  const brannbelastning = parseFloat(formData.bf85_34_brannbelastning) || 0;
                  const tiltak = formData.bf85_34_tiltak || "ingen";
                  const krav = brannbelastning > 0 ? getBF85BrannveggKravKap34(areal, brannbelastning, tiltak) : null;
                  const tiltakTekst = tiltak === "sprinkler" ? "med sprinkleranlegg" : tiltak === "brannventilasjon" ? "med brannventilasjon" : "uten brannventilasjon og sprinkleranlegg";
                  return krav ? (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Tabell 34:23</td>
                      <td className="border border-gray-400 p-2">
                        <p>Gjennomsnittlig spesifikk brannbelastning: <strong>{formData.bf85_34_brannbelastning} MJ/m²</strong> – {tiltakTekst}.</p>
                        <p className="mt-1">
                          {krav.ingenKrav
                            ? "Ingen krav til oppdeling med brannvegg."
                            : krav.krevBrannvegg
                              ? `Bruttoareal pr. etasje (${areal} m²) overstiger maks tillatt areal (${krav.maksAreal} m²). Oppdeling med brannvegg er påkrevd.`
                              : `Bruttoareal pr. etasje (${areal} m²) er innenfor maks tillatt areal (${krav.maksAreal} m²). Oppdeling med brannvegg er ikke påkrevd.`
                          }
                        </p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIBr</td>
                    </tr>
                  ) : null;
                })()}
                {(() => {
                  // Avgjør om kravradene til brannvegg skal vises.
                  // Hvis Tabell 34:23-vurdering tilsier "ingen krav" eller areal innenfor maks → ikke krav.
                  // Brukerens eksplisitte valg om å etablere brannvegg som nytt tiltak overstyrer.
                  let kreverBrannvegg = true;
                  const harTabellVurdering =
                    ["Industri", "Kraftstasjon", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype) &&
                    formData.bf85_34_brannbelastning;
                  if (harTabellVurdering) {
                    const arealLocal = parseFloat(formData.areal) || 0;
                    const bbLocal = parseFloat(formData.bf85_34_brannbelastning) || 0;
                    const tiltakLocal = formData.bf85_34_tiltak || "ingen";
                    const kravLocal = bbLocal > 0 ? getBF85BrannveggKravKap34(arealLocal, bbLocal, tiltakLocal) : null;
                    if (kravLocal && (kravLocal.ingenKrav || !kravLocal.krevBrannvegg)) {
                      kreverBrannvegg = false;
                    }
                  }
                  if (formData.manglerSeksjonering && formData.etablererSeksjoneringLikevel) {
                    kreverBrannvegg = true;
                  }
                  if (formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel) {
                    kreverBrannvegg = false;
                  }
                  if (!kreverBrannvegg) return null;
                  return (
                    <>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Brannvegg (:62)</td>
                        <td className="border border-gray-400 p-2">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Vegg minst A 120, uten åpninger, og på fundament med minst samme brannmotstand.</li>
                            <li>Ved spesifikk brannbelastning over 400 MJ/m² kreves så høy brannmotstand at veggen bibeholder de egenskaper som kreves av den under brannen.</li>
                            <li>Branndekke og brannvegg skal fra fundament bæres av bygningsdel i minst samme klasse.</li>
                            <li>Konstruksjoner på eller inntil branndekke og brannvegg må gis bevegelsesfrihet slik at deformasjoner under brann ikke skader branndekket eller brannveggen.</li>
                            <li>Der tak er utført i A 60, føres brannvegg opp under tak. Er det forskjell i takhøyden, føres brannveggen opp under høyeste tilstøtende del av tak.</li>
                            <li>Er takene ikke utført i A 60, skal brannvegg føres minst 500 mm over høyeste tilstøtende tak.</li>
                            <li>Brennbart materiale skal ikke føres forbi eller gjennom branndekke og brannvegg.</li>
                          </ul>
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr / ARK</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Gjennomføringer (:621)</td>
                        <td className="border border-gray-400 p-2">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Gjennomføringer av rør og kanaler (sjakter) skal utføres slik at bygningsdelens brannskillende funksjon opprettholdes. Se også kap. 47.</li>
                            <li>I branndekke og brannvegg kan det være 150 mm brede slisser eller kanaler som har brannmotstand halvparten av bygningsdelens.</li>
                          </ul>
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr / RIV</td>
                      </tr>
                      {(formData.seksjonDorRelevant || formData.seksjonVinduRelevant) && (
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Åpninger i brannvegg</td>
                          <td className="border border-gray-400 p-2">
                            <div className="space-y-1 text-sm">
                              <p>Bygningsrådet kan i enkelte tilfeller tillate åpninger i branndekke og brannvegg. Åpningene skal kunne stenges automatisk ved brann. Lukkeanordningene skal minst ha halvparten av dekkets eller veggens brannmotstand.</p>
                              {formData.seksjonDorRelevant && <p>Dører i brannvegg skal ha lukkeanordning med minst halvparten av veggens brannmotstand. Dører må stenges automatisk ved brann.</p>}
                              {formData.seksjonVinduRelevant && <p>Vinduer i brannvegg skal ha tilsvarende brannmotstand som veggen.</p>}
                            </div>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {/* TEK17 content */}
                {(() => {
                  const arealNum = parseFloat(formData.areal) || 0;
                  const brannenergi = formData.brannseksjonBrannenergi;
                  const tiltak = formData.brannseksjonTiltak || "normalt";
                  const grenser: Record<string, { normalt: number; brannalarm: number; sprinkler: number; roykventilasjon: number }> = {
                    "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
                    "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
                    "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 },
                  };
                  const g = brannenergi ? grenser[brannenergi] : null;
                  const maksAreal = g ? (g[tiltak as keyof typeof g] ?? g.normalt) : null;
                  const erPakrevd = g && maksAreal !== null && maksAreal !== Infinity && arealNum > maksAreal;
                  const erPakrevdInstitusjon = formData.risikoklasse === "RK6" && formData.erSykehusPleieinstitusjon;

                  if (g && maksAreal !== null && !erPakrevd && !erPakrevdInstitusjon) {
                    return (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Generelt</td>
                          <td className="border border-gray-400 p-2">
                            Bruttoarealet ({arealNum} m²) er innenfor tillatt areal uten brannseksjonering ({maksAreal === Infinity ? "ubegrenset" : `${maksAreal} m²`}). Det er derfor ikke krav til brannseksjonering for dette byggverket.
                          </td>
                          <td className="border border-gray-400 p-2 align-top">RIBr</td>
                        </tr>
                        {formData.innvendigHjorne === "ja" && !(formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel) && (
                          <tr>
                            <td className="border border-gray-400 p-2 align-top">Innvendig hjørne</td>
                            <td className="border border-gray-400 p-2">
                              {formData.innvendigHjorneAlternativ === "alt1"
                                ? "For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 8,0 meter forbi innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 1)."
                                : "For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 5,0 meter på hver side av innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 2)."}
                            </td>
                            <td className="border border-gray-400 p-2 align-top">RIBr / ARK</td>
                          </tr>
                        )}
                      </>
                    );
                  }

                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Generelt</td>
                      <td className="border border-gray-400 p-2">Byggverk skal deles opp i brannseksjoner for å sikre liv og helse der rømning og redning kan ta lang tid, hindre urimelig store økonomiske eller materielle tap, og bidra til at en brann, med påregnelig slokkeinnsats, begrenses til den brannseksjonen der den startet.</td>
                      <td className="border border-gray-400 p-2 align-top">RIBr</td>
                    </tr>
                  );
                })()}
                {/* RKL6 vertikal seksjonering for sykehus/pleieinstitusjon */}
                {formData.risikoklasse === "RK6" && formData.erSykehusPleieinstitusjon && !(formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel) && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Vertikal oppdeling</td>
                    <td className="border border-gray-400 p-2">
                      Byggverk i risikoklasse 6 beregnet for sykehus, sykehjem og andre pleieinstitusjoner må deles vertikalt i minst to brannseksjoner (jf. VTEK § 11-7).
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                {formData.brannseksjoner && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                    <td className="border border-gray-400 p-2">{formData.brannseksjoner}</td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                {/* Preaksepterte ytelser for seksjoneringsveggen når seksjonering er påkrevd */}
                {(() => {
                  if (formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel) return null;
                  const arealNum = parseFloat(formData.areal) || 0;
                  const brannenergi = formData.brannseksjonBrannenergi;
                  const tiltak = formData.brannseksjonTiltak || "normalt";
                  const grenser: Record<string, { normalt: number; brannalarm: number; sprinkler: number; roykventilasjon: number }> = {
                    "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
                    "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
                    "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 },
                  };
                  const g = brannenergi ? grenser[brannenergi] : null;
                  const maksAreal = g ? (g[tiltak as keyof typeof g] ?? g.normalt) : null;
                  const erPakrevdAreal = g && maksAreal !== null && maksAreal !== Infinity && arealNum > maksAreal;
                  const erPakrevdInstitusjon = formData.risikoklasse === "RK6" && formData.erSykehusPleieinstitusjon;
                  
                  if (!erPakrevdAreal && !erPakrevdInstitusjon) return null;
                  
                  const intro = erPakrevdAreal
                    ? `Brannseksjonering er påkrevd da bruttoarealet (${arealNum} m²) overskrider tillatt areal uten seksjonering. Seksjoneringsveggen skal oppfylle følgende preaksepterte ytelser:`
                    : "Brannseksjonering er påkrevd for dette byggverket. Seksjoneringsveggen skal oppfylle følgende preaksepterte ytelser:";
                  
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Seksjoneringsveggen</td>
                      <td className="border border-gray-400 p-2">
                        <p className="mb-1">{intro}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Seksjoneringsveggen må ha brannmotstand minst {(() => {
                            if (erPakrevdInstitusjon && !erPakrevdAreal) {
                              const bkl = formData.brannklasse;
                              if (bkl === "BKL1") return "REI 90-M A2-s1,d0 [A 90]";
                              return "REI 120-M A2-s1,d0 [A 120]";
                            }
                            const bkl = formData.brannklasse;
                            const be = formData.seksjoneringsvegBrannenergi;
                            const tabell: Record<string, Record<string, string>> = {
                              "BKL1": { "under400": "REI 90-M A2-s1,d0 [A 90]", "400-600": "REI 120-M A2-s1,d0 [A 120]", "600-800": "REI 180-M A2-s1,d0 [A 180]" },
                              "BKL2": { "under400": "REI 120-M A2-s1,d0 [A 120]", "400-600": "REI 180-M A2-s1,d0 [A 180]", "600-800": "REI 240-M A2-s1,d0 [A 240]" },
                              "BKL3": { "under400": "REI 120-M A2-s1,d0 [A 120]", "400-600": "REI 180-M A2-s1,d0 [A 180]", "600-800": "REI 240-M A2-s1,d0 [A 240]" },
                            };
                            return tabell[bkl]?.[be] || "[Brannklasse og/eller brannenergi ikke angitt]";
                          })()} (jf. VTEK § 11-7, tabell 2).</li>
                          <li>Seksjoneringsveggen må i sin helhet bestå av materialer som tilfredsstiller klasse A2-s1,d0 [ubrennbare] og må kunne motstå mekanisk påkjenning.</li>
                          <li>Dersom mekanisk motstandsevne (M) ikke er dokumentert ved prøvning, må seksjoneringsveggen utføres i tunge materialer som mur, betong eller lignende.</li>
                          <li>Takkonstruksjonen må ikke være kontinuerlig over seksjoneringsveggen på en slik måte at en kollaps på den ene siden medfører reduksjon av konstruksjonens bæreevne og brannmotstand på den andre siden.</li>
                          <li>Konstruksjoner som ligger inntil seksjoneringsveggen må kunne bevege seg fritt ved temperaturendringer, uten at veggens branntekniske egenskaper reduseres.</li>
                          <li>Seksjoneringsveggens avslutning mot tak og fasade må være utformet og utført for å hindre brannspredning mellom ulike seksjoner. Størst sikkerhet mot brannspredning oppnås ved å føre seksjoneringsveggen over takflaten og utenfor vegglivet, tilsvarende som for brannvegger, jf. § 11-6.</li>
                          <li>Der seksjoner ligger inntil hverandre i et innvendig hjørne, må det treffes særskilte tiltak for å hindre brannspredning, jf. figur 1a og 1b.</li>
                          <li>Seksjoneringsveggen må føres minimum 0,5 meter over høyeste tilstøtende tak, med mindre taket har brannmotstand minst EI 60 A2-s1,d0 [A 60].</li>
                          <li>Seksjoneringsveggen må være slik utført at den blir stående selv om byggverket på den ene eller andre siden raser sammen.</li>
                          {formData.innvendigHjorne === "ja" && (
                            <li>
                              {formData.innvendigHjorneAlternativ === "alt1"
                                ? "For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 8,0 meter forbi innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 1)."
                                : "For å hindre brannsmitte fra vegg til vegg i innvendige hjørner skal seksjoneringsveggen forlenges minimum 5,0 meter på hver side av innvendig hjørne (jf. VTEK § 11-7, figur 1a, alternativ 2)."}
                            </li>
                          )}
                        </ul>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIBr / ARK</td>
                    </tr>
                  );
                })()}
                {/* Dører og vinduer i seksjoneringsvegg */}
                {(formData.seksjonDorRelevant || formData.seksjonVinduRelevant) && !(formData.manglerSeksjonering && !formData.etablererSeksjoneringLikevel) && (() => {
                  const lines: string[] = [];
                  const dorOgVindu = formData.seksjonDorRelevant && formData.seksjonVinduRelevant;
                  const kunDor = formData.seksjonDorRelevant && !formData.seksjonVinduRelevant;
                  const kunVindu = !formData.seksjonDorRelevant && formData.seksjonVinduRelevant;
                  let nr = 1;
                  if (dorOgVindu) {
                    lines.push(`${nr++}. Vinduer og dører må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.`);
                    lines.push(`${nr++}. Vinduer og dører må ha tilsvarende brannmotstand som veggen.`);
                  } else if (kunDor) {
                    lines.push(`${nr++}. Dører må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.`);
                    lines.push(`${nr++}. Dører må ha tilsvarende brannmotstand som veggen.`);
                  } else if (kunVindu) {
                    lines.push(`${nr++}. Vinduer må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.`);
                    lines.push(`${nr++}. Vinduer må ha tilsvarende brannmotstand som veggen.`);
                  }
                  if (formData.seksjonDorRelevant) {
                    lines.push(`${nr++}. Dør som er klassifisert etter NS 3919:1997 [A 120 osv.] må ha anslag, terskel og tettelister på alle sider for å oppnå tilstrekkelig røyktetthet. Dette gjelder ikke dører og luker som er testet og oppfyller kriteriene for Sₐ-klassifisering etter NS-EN 1634-3:2004 (inklusiv rettelsesblad AC:2006).`);
                    lines.push(`${nr++}. Dører må være lukket i en brukssituasjon eller ha automatikk som lukker døren ved deteksjon av røyk.`);
                  }
                  if (formData.seksjonVinduRelevant) {
                    lines.push(`${nr++}. Vinduer må ikke kunne åpnes i vanlig brukstilstand.`);
                  }
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Dører og vinduer i seksjoneringsvegg</td>
                      <td className="border border-gray-400 p-2">
                        <div className="space-y-1">
                          {lines.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                  );
                })()}
              </>
            )}
            {formData.brannseksjonerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.brannseksjonerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_4"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_4"]} sectionLabel={isBF85 ? "2.4 Brannteknisk oppdeling" : "3.4 Brannseksjoner"} />
            )}

            {/* 3.5 §11-8 Brannceller */}
            <tr id="preview-3-5" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.5 &nbsp;&nbsp; {isBF85 ? <>Branncelleinndeling (Kap. 30:63–65) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-8 Brannceller)</span></> : "§11-8 Brannceller"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            {isBF85 ? (() => {
              const klasse = formData.bygningsbrannklasse || "";
              const bf85KravMap: Record<string, { branncellebegrensende: string; dorKrav: string; tekniskeRom: string }> = {
                "1": { branncellebegrensende: "A 60", dorKrav: "A 30", tekniskeRom: "A 60" },
                "2": { branncellebegrensende: "B 60", dorKrav: "B 30", tekniskeRom: "A 60" },
                "3": { branncellebegrensende: "B 30", dorKrav: "B 15", tekniskeRom: "A 60" },
                "4": { branncellebegrensende: "B 30", dorKrav: "B 15", tekniskeRom: "A 60" },
              };
              const krav = bf85KravMap[klasse];
              if (!krav) return null;
              return (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Kap. 30:63 – Branncelleinndeling</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm">Bygning skal inndeles på hensiktsmessig måte i brannceller med konstruksjon etter Tabell 30:41. Ikke-bærende branncellebegrensende bygningsdel: <span className="font-semibold">{krav.branncellebegrensende}</span>.</p>
                      <ul className="text-sm mt-1 ml-4 list-disc space-y-0.5">
                        <li>Brannceller må ikke ha form eller innredning som gjør varsling og rømning ved brann vanskelig.</li>
                        <li>Sjakter som ikke ligger i tilknytning til trapperom skal utføres som egne brannceller.</li>
                        <li>Dører i branncellebegrensende vegger skal ha minst 1/2 av veggens brannmotstand – dvs. minst <span className="font-semibold">{krav.dorKrav}</span>.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  {formData.bf85TekniskeRomRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Kap. 30:33 – Tekniske rom</td>
                      <td className="border border-gray-400 p-2">
                        <p className="text-sm">Heismaskinrom, ventilasjonsrom, søppelrom og fyrrom skal utgjøre egne brannceller med brannmotstand <span className="font-semibold">{krav.tekniskeRom}</span>.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                  )}
                  {formData.bf85LoftKjellerRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Kap. 30:64 – Rom på loft og i kjeller</td>
                      <td className="border border-gray-400 p-2">
                        <p className="text-sm">Lofts- og kjellerrom som ikke er del av en bruksenhet, skal skilles fra øvrige deler av bygningen med branncellebegrensende bygningsdel.</p>
                        <p className="text-sm mt-1">Uinnredet loft/kjeller og hulrom med brennbar isolasjon skal oppdeles for hver 400 m².</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                  )}
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Kap. 30:65 – Takflater</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm">Takflater med brennbar isolasjon skal oppdeles med brannskiller for hver 400 m².</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                </>
              );
            })() : (
            <>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelt</td>
              <td className="border border-gray-400 p-2">
                Byggverk skal deles opp i brannceller på en hensiktsmessig måte. Områder med ulik risiko for liv og helse eller ulik fare for at brann oppstår, skal være egne brannceller med mindre andre tiltak gir likeverdig sikkerhet.
                <br /><br />
                Brannceller skal være utført slik at de forhindrer spredning av brann og branngasser til andre brannceller i den tiden som er nødvendig for rømning og redning.
              </td>
              <td className="border border-gray-400 p-2 align-top">RIBr</td>
            </tr>
            {(() => {
              const getBrannmotstand = (bkl: string) => {
                if (bkl === "BKL1") return "EI 30 [B 30]";
                if (bkl === "BKL2") return "EI 60 [B 60]";
                if (bkl === "BKL3") return "EI 60 A2-s1,d0 [A 60]";
                return "";
              };

              // Build list of all building parts with their BKL
              const alleDeler: { index: number; navn: string; bkl: string }[] = [];
              if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                if (del1Bkl) {
                  alleDeler.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', bkl: del1Bkl });
                }
                formData.bygningsdeler.forEach((del: any, i: number) => {
                  const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer || formData.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                  if (delBkl) {
                    alleDeler.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, bkl: delBkl });
                  }
                });
              }
              // Fallback single
              if (alleDeler.length === 0 && formData.brannklasse) {
                alleDeler.push({ index: 1, navn: "", bkl: formData.brannklasse });
              }
              if (alleDeler.length === 0) return null;
              const showLabel = alleDeler.length > 1;

              return (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Branncellebegrensende bygningsdel - generelt</td>
                    <td className="border border-gray-400 p-2">
                      {showLabel ? alleDeler.map((del) => (
                        <p key={del.index} className={del.index > 1 ? "mt-1" : ""}>
                          <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                          <span className="text-red-600 font-semibold">{getBrannmotstand(del.bkl)}</span>
                        </p>
                      )) : (
                        <span className="font-semibold">{getBrannmotstand(alleDeler[0].bkl)}</span>
                      )}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Bygningsdel som omslutter trapperom, heissjakt og installasjonssjakter over flere plan</td>
                    <td className="border border-gray-400 p-2">
                      {showLabel ? alleDeler.map((del) => (
                        <p key={del.index} className={del.index > 1 ? "mt-1" : ""}>
                          <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                          <span className="text-red-600 font-semibold">{getBrannmotstand(del.bkl)}</span>
                        </p>
                      )) : (
                        <span className="font-semibold">{getBrannmotstand(alleDeler[0].bkl)}</span>
                      )}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                </>
              );
            })()}
            </>
            )}
            {!isBF85 && formData.heismaskinromRelevant === "ja" && (formData.brannklasse || (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0)) && (() => {
              const getHeismaskinromKrav = (bkl: string) => {
                if (bkl === "BKL3") return "EI 60 A2-s1,d0 [A 60]";
                return "EI 60 [B 60]";
              };
              const alleDeler: { index: number; navn: string; bkl: string }[] = [];
              if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                if (del1Bkl) alleDeler.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', bkl: del1Bkl });
                formData.bygningsdeler.forEach((del: any, i: number) => {
                  const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer || formData.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                  if (delBkl) alleDeler.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, bkl: delBkl });
                });
              }
              if (alleDeler.length === 0 && formData.brannklasse) alleDeler.push({ index: 1, navn: "", bkl: formData.brannklasse });
              const showLabel = alleDeler.length > 1;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Heismaskinrom</td>
                  <td className="border border-gray-400 p-2">
                    {showLabel ? alleDeler.map((del) => (
                      <p key={del.index} className={del.index > 1 ? "mt-1" : ""}>
                        <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                        <span className="text-red-600 font-semibold">{getHeismaskinromKrav(del.bkl)}</span>
                      </p>
                    )) : (
                      <span className="font-semibold">{getHeismaskinromKrav(alleDeler[0].bkl)}</span>
                    )}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              );
            })()}
            {!isBF85 && formData.fyrromRelevant === "ja" && (formData.brannklasse || (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0)) && (() => {
              const getBrannmotstand = (bkl: string) => {
                if (bkl === "BKL1") return "EI 30 [B 30]";
                if (bkl === "BKL2") return "EI 60 [B 60]";
                if (bkl === "BKL3") return "EI 60 A2-s1,d0 [A 60]";
                return "";
              };
              const getEI60 = (bkl: string) => bkl === "BKL3" ? "EI 60 A2-s1,d0 [A 60]" : "EI 60 [B 60]";
              const alleDeler: { index: number; navn: string; bkl: string }[] = [];
              if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                if (del1Bkl) alleDeler.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', bkl: del1Bkl });
                formData.bygningsdeler.forEach((del: any, i: number) => {
                  const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer || formData.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                  if (delBkl) alleDeler.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, bkl: delBkl });
                });
              }
              if (alleDeler.length === 0 && formData.brannklasse) alleDeler.push({ index: 1, navn: "", bkl: formData.brannklasse });
              const showLabel = alleDeler.length > 1;

              const renderValue = (getValue: (bkl: string) => string) => {
                if (showLabel) {
                  return alleDeler.map((del) => (
                    <p key={del.index} className={del.index > 1 ? "mt-1" : ""}>
                      <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                      <span className="text-red-600 font-semibold">{getValue(del.bkl)}</span>
                    </p>
                  ));
                }
                return <span className="font-semibold">{getValue(alleDeler[0].bkl)}</span>;
              };

              const fyrKw = formData.fyrromKw;
              if (fyrKw === "fast") return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel</td>
                  <td className="border border-gray-400 p-2">{renderValue(getEI60)}</td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              );
              if (fyrKw === "under50") return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &lt; 50 kW</td>
                  <td className="border border-gray-400 p-2 font-semibold">K₂ 10 A2-s1,d0 [K1-A] – kun ytelse for kledning/overflate</td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              );
              if (fyrKw === "50-100") return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, 50 kW ≤ P ≤ 100 kW</td>
                  <td className="border border-gray-400 p-2">{renderValue(getBrannmotstand)}</td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              );
              if (fyrKw === "over100") return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &gt; 100 kW</td>
                  <td className="border border-gray-400 p-2 font-semibold">EI 60 A2-s1,d0 [A 60]</td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              );
              if (fyrKw === "ukjent") return (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel</td>
                    <td className="border border-gray-400 p-2">{renderValue(getEI60)}</td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &lt; 50 kW</td>
                    <td className="border border-gray-400 p-2 font-semibold">K₂ 10 A2-s1,d0 [K1-A]</td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, 50 kW ≤ P ≤ 100 kW</td>
                    <td className="border border-gray-400 p-2">{renderValue(getBrannmotstand)}</td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &gt; 100 kW</td>
                    <td className="border border-gray-400 p-2 font-semibold">EI 60 A2-s1,d0 [A 60]</td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                </>
              );
              return null;
            })()}
            {branncelleTyper.length > 0 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Følgende rom/lokaler skal være egne brannceller</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-none space-y-1">
                    {branncelleTyper.map((typeId: string) => {
                      const type = branncelleTyperListe.find(t => t.id === typeId);
                      if (!type) return null;
                      const label = formData.regelverk === "BF85" && type.id === "tekniske_rom" ? "p. Tekniske rom og ventilasjonsrom" : type.label;
                      return <li key={typeId} className="text-sm">{label}</li>;
                    })}
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
              </tr>
            )}
            {/* Dørkrav */}
            {formData.dorPlasseringer && formData.dorPlasseringer.length > 0 && (formData.brannklasse || formData.bygningsbrannklasse || (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0)) && (() => {
              const isBF85 = formData.regelverk === "BF85";
              if (isBF85) {
                const bbk = parseInt(formData.bygningsbrannklasse || '0', 10);
                type BF85DorKrav = { label: string; bbk1: string; bbk2: string; bbk3: string; bbk4: string };
                const bf85DorKravMap: Record<string, BF85DorKrav> = {
                  bf85_branncelle_aapent: { label: "Branncelle – åpent trapperom (Tr1)", bbk1: "A 30 S (EI 30-A2s1,d0-CSa)", bbk2: "A 30 S (EI 30-A2s1,d0-CSa)", bbk3: "B 30 S (EI 30-CSa)", bbk4: "B 30 S (EI 30-CSa)" },
                  bf85_korridor_lukket: { label: "Korridor – lukket trapperom (Tr2)", bbk1: "A 30 S (EI 30-A2s1,d0-CSa)", bbk2: "A 30 S (EI 30-A2s1,d0-CSa)", bbk3: "B 30 S eller F 30 S (EI 30-CSa eller E 30-CSa)", bbk4: "B 30 S eller F 30 S (EI 30-CSa eller E 30-CSa)" },
                  bf85_korridor_sluse_branntrygt: { label: "Korridor/sluse – branntrygt trapperom (Tr2)", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 60 S (EI 60-A2s1,d0-CSa)", bbk4: "A 60 S (EI 60-A2s1,d0-CSa)" },
                  bf85_roykfritt_fri_luft: { label: "Røykfritt trapperom (Tr3) – fri luft", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 60 S (EI 60-A2s1,d0-CSa)", bbk4: "A 60 S (EI 60-A2s1,d0-CSa)" },
                  bf85_korridor_fri_luft: { label: "Korridor – fri luft (i kombinasjon med røykfritt trapperom (Tr3))", bbk1: "A 30 (EI 30-A2s1,d0-Sa)", bbk2: "A 30 (EI 30-A2s1,d0-Sa)", bbk3: "B 30 (EI 30-Sa)", bbk4: "B 30 (EI 30-Sa)" },
                  bf85_branncelle_korridor: { label: "Branncelle – korridor", bbk1: "A 30 (EI 30-A2s1,d0-Sa)", bbk2: "A 30 (EI 30-A2s1,d0-Sa)", bbk3: "B 30 (EI 30-Sa)", bbk4: "B 15 (EI 15-Sa)" },
                  bf85_branncelle_branncelle: { label: "Branncelle – branncelle", bbk1: "A 30 (EI 30-A2s1,d0-Sa)", bbk2: "A 30 (EI 30-A2s1,d0-Sa)", bbk3: "B 30 (EI 30-Sa)", bbk4: "B 15 (EI 15-Sa)" },
                  bf85_loft_trapperom: { label: "Loft – trapperom", bbk1: "A 30 S (EI 30-A2s1,d0-CSa)", bbk2: "A 30 S (EI 30-A2s1,d0-CSa)", bbk3: "B 30 S (EI 30-CSa)", bbk4: "B 15 S (EI 15-CSa)" },
                  bf85_kjeller_trapperom: { label: "Kjeller – trapperom", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 30 S (EI 30-A2s1,d0-CSa)", bbk4: "A 30 S (EI 30-A2s1,d0-CSa)" },
                  bf85_kjeller_under_overste: { label: "Kjeller under øverste kjelleretasje – egen trapp eller annen atkomst", bbk1: "A 60 S (EI 60-A2s1,d0-CSa)", bbk2: "A 60 S (EI 60-A2s1,d0-CSa)", bbk3: "A 60 S (EI 60-A2s1,d0-CSa)", bbk4: "A 60 S (EI 60-A2s1,d0-CSa)" },
                };
                const bbkKey = (bbk >= 1 && bbk <= 4 ? `bbk${bbk}` : 'bbk2') as 'bbk1' | 'bbk2' | 'bbk3' | 'bbk4';
                const activeDoors = formData.dorPlasseringer
                  .map((id: string) => bf85DorKravMap[id])
                  .filter(Boolean);
                if (activeDoors.length === 0) return null;
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Dørkrav (Tabell 30:75)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        {activeDoors.map((d: BF85DorKrav, idx: number) => (
                          <div key={idx}>{d.label}: <span className="font-semibold">{d[bbkKey]}</span></div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                );
              }

              // TEK17 logic – handle multiple BKLs
              const dorKravMap: Record<string, { label: string; bkl1: string; bkl23: string }> = {
                branncelle_trapperom_tr1: { label: "Branncelle – trapperom Tr 1", bkl1: "EI₂ 30-CSₐ [B 30 S]", bkl23: "EI₂ 30-CSₐ [B 30 S]" },
                korridor_trapperom_tr2: { label: "Korridor – trapperom Tr 2", bkl1: "E 30-CSₐ [F 30 S]", bkl23: "E 30-CSₐ [F 30 S]" },
                mellomliggende_trapperom_tr3: { label: "Mellomliggende rom – trapperom Tr 3", bkl1: "", bkl23: "EI₂ 60-CSₐ [B 60 S]" },
                garasje_brannsluse: { label: "Garasje – brannsluse", bkl1: "EI₂ 60-CSₐ [B 60 S]", bkl23: "EI₂ 60-CSₐ [B 60 S]" },
                branncelle_korridor: { label: "Branncelle – korridor", bkl1: "EI₂ 30-Sₐ [B 30]", bkl23: "EI₂ 30-Sₐ [B 30]" },
                korridor_det_fri_tr3: { label: "Korridor – det fri (i kombinasjon med trapperom Tr 3)", bkl1: "", bkl23: "EI₂ 30-Sₐ [B 30]" },
              };

              const alleDeler: { index: number; navn: string; bkl: string; rk?: string }[] = [];
              if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                if (del1Bkl) alleDeler.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', bkl: del1Bkl, rk: formData.risikoklasse?.replace(/\D/g, '') });
                formData.bygningsdeler.forEach((del: any, i: number) => {
                  const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer || formData.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                  if (delBkl) alleDeler.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, bkl: delBkl, rk: del.risikoklasse?.replace(/\D/g, '') });
                });
              }
              if (alleDeler.length === 0 && formData.brannklasse) alleDeler.push({ index: 1, navn: "", bkl: formData.brannklasse, rk: formData.risikoklasse?.replace(/\D/g, '') });
              const showLabel = alleDeler.length > 1;

              // Get all active door types
              const allActiveDoors = formData.dorPlasseringer
                .map((id: string) => dorKravMap[id])
                .filter(Boolean);
              if (allActiveDoors.length === 0) return null;

              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Dørkrav</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-2">
                      {allActiveDoors.map((d: { label: string; bkl1: string; bkl23: string }, idx: number) => {
                        // Helper: For bolig (RK4) branncelle to Tr1, remove C (selvlukker) requirement
                        const getKravForDel = (del: { index: number; navn: string; bkl: string; rk?: string }, doorId: string, kravStr: string) => {
                          if (doorId === "branncelle_trapperom_tr1") {
                            const rk = del.rk || "";
                            if (rk === "4") {
                              // Remove C from requirement: CSₐ -> Sₐ, CSa -> Sa
                              return kravStr.replace("CSₐ", "Sₐ").replace("CSa", "Sa").replace("C-S", "S");
                            }
                          }
                          return kravStr;
                        };
                        // Find the door ID from the map
                        const doorId = formData.dorPlasseringer.find((id: string) => dorKravMap[id] === d) || "";

                        if (showLabel) {
                          // Show per building part
                          const lines = alleDeler.map((del) => {
                            const isBKL1 = del.bkl === "BKL1";
                            let krav = isBKL1 ? d.bkl1 : d.bkl23;
                            if (!krav) return null;
                            krav = getKravForDel(del, doorId, krav);
                            return (
                              <p key={del.index} className={del.index > 1 ? "mt-1" : ""}>
                                <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                <span className="text-red-600 font-semibold">{krav}</span>
                              </p>
                            );
                          }).filter(Boolean);
                          if (lines.length === 0) return null;
                          return (
                            <div key={idx}>
                              <p className="font-medium text-sm">{d.label}:</p>
                              {lines}
                            </div>
                          );
                        } else {
                          const isBKL1 = alleDeler[0].bkl === "BKL1";
                          let krav = isBKL1 ? d.bkl1 : d.bkl23;
                          if (!krav) return null;
                          krav = getKravForDel(alleDeler[0], doorId, krav);
                          return <div key={idx}>{d.label}: <span className="font-semibold">{krav}</span></div>;
                        }
                      })}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* Dører i rømningsvei – kraftstasjon */}
            {(() => {
              const erKraftstasjonDor = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjonDor) return null;
              return (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Dører i rømningsvei – kraftstasjon</td>
                    <td className="border border-gray-400 p-2">For dører i rømningsvei anbefales det dører med vindu for å kunne oppdage personell, røyk eller brann.</td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Dør til rom for høyspenningsanlegg – kraftstasjon</td>
                    <td className="border border-gray-400 p-2">Dører til rom for høyspenningsanlegg skal ha selvlukker.</td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Dører til teknisk rom – kraftstasjon</td>
                    <td className="border border-gray-400 p-2">Dører til teknisk rom skal være utadslående for å sikre rømningsveier.</td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                </>
              );
            })()}
            {/* Vinduskrav */}
            {formData.vinduskravRelevant && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Vinduskrav</td>
                <td className="border border-gray-400 p-2">
                  {formData.regelverk === "BF85"
                    ? "Vindu skal ha samme brannmotstand som veggen det står i."
                    : "Vindu med brannmotstand må ikke kunne åpnes i vanlig brukstilstand."}
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Heissjakt */}
            {formData.heissjaktkravTekst && formData.heissjaktkravTekst.trim() && (formData.regelverk !== "BF85" || formData.heissjaktRelevantBF85 === "ja") && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">
                  {formData.regelverk === "BF85" ? "Krav til heissjakt (Kap. 30:33/30:65)" : "Krav til heissjakt"}
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="space-y-1 whitespace-pre-line">
                    {formData.heissjaktkravTekst}
                  </div>
                </td>
                <td className="border border-gray-400 p-2 align-top">{formData.regelverk === "BF85" ? "ARK/RIBr/RIV" : "ARK/RIBr"}</td>
              </tr>
            )}
            {/* Trapperom */}
            {(() => {
              const isBF85 = formData.regelverk === "BF85";
              const floors = parseInt(formData.etasjer || '0', 10);

              // BF85 auto-set for skole/barnehage
              if (isBF85 && ["Skole", "Barnehage"].includes(formData.bygningstype) && floors > 0) {
                let autoType = "";
                let autoDesc = "";
                if (floors <= 2) {
                  autoType = "Åpent trapperom (Tr1)";
                  autoDesc = "Bygning med inntil 2 etasjer: Åpent trapperom (Tr1) – trapperom som har direkte forbindelse gjennom dør til bruksenheten.";
                } else if (floors <= 4) {
                  autoType = "Lukket trapperom (Tr2)";
                  autoDesc = "Bygning med 3–4 etasjer: Lukket trapperom (Tr2) – trapperom som har forbindelse til bruksenhet bare gjennom lukket korridor, og som er lukket med dør B 30 eller F 30 mot korridor.";
                } else {
                  autoType = "Røykfritt trapperom (Tr3)";
                  autoDesc = "Bygning med flere enn 4 etasjer: Røykfritt trapperom (Tr3) – branntrygt trapperom med forbindelse til bruksenheten bare gjennom rom åpent mot det fri.";
                }
                return (
                  <>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Krav til trapperom (Kap. 30:7)</td>
                      <td className="border border-gray-400 p-2">
                        <div className="space-y-1">
                          <div><span className="font-semibold">{autoType}:</span> {autoDesc}</div>
                          {formData.trapperomBeskrivelse && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <span className="font-semibold">Beskrivelse:</span> {formData.trapperomBeskrivelse}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                  </>
                );
              }

              // BF85 Bolig – vis valgte trapperomløsninger
              if (isBF85 && formData.bygningstype === "Bolig" && floors >= 1) {
                const boligTrapperomMap: Record<string, string> = {
                  bf85_bolig_2_aapne: "2 åpne trapperom (Tr1)",
                  bf85_bolig_lukket: "Et lukket trapperom (Tr2)",
                  bf85_bolig_aapent_brannvesen: "Et åpent trapperom (Tr1) med brannvesenet som alternativ rømningsvei (maks 5 m til underkant vindu/balkong)",
                  bf85_bolig_2_branntrygge: "2 branntrygge trapperom (Tr2)",
                  bf85_bolig_roykfritt: "Et røykfritt trapperom (Tr3)",
                };
                const valgte = (formData.trapperomKrav || [])
                  .map((id: string) => boligTrapperomMap[id])
                  .filter(Boolean);
                if (valgte.length > 0 || formData.trapperomBeskrivelse) {
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Krav til trapperom (Kap. 30:7)</td>
                      <td className="border border-gray-400 p-2">
                        <div className="space-y-1">
                          {valgte.length > 0 && (
                            <ul className="list-disc list-inside">
                              {valgte.map((v: string, i: number) => <li key={i}>{v}</li>)}
                            </ul>
                          )}
                          <div className="mt-2 pt-2 border-t border-gray-300" style={{backgroundColor: '#fffbeb', padding: '8px', borderRadius: '4px'}}>
                            <span className="font-semibold" style={{color: '#92400e'}}>⚠ Fravik fra BF85:</span>{' '}
                            <span style={{color: '#92400e'}}>Løsningen med ett åpent trapperom (Tr1) og brannvesenets stigemateriell som alternativ rømningsvei er en preakseptert ytelse etter TEK17, men utgjør et fravik fra BF85 Kap. 30:7. Dette er den vanligste løsningen for moderne boligbygg. Fraviket må dokumenteres særskilt.</span>
                          </div>
                          {formData.trapperomBeskrivelse && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <span className="font-semibold">Beskrivelse:</span> {formData.trapperomBeskrivelse}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                  );
                }
                return null;
              }

              // BF85 Forsamlingslokale – vis automatisk krav
              if (isBF85 && formData.bygningstype === "Forsamlingslokale" && floors >= 1) {
                const kravTekst = floors > 8
                  ? "Forsamlingslokale over 8. etasje eller med gulv mer enn 22 m over terreng skal ha minst to branntrygge trapperom."
                  : "Forsamlingslokale i høyst 8. etasje og med gulv inntil 2 m over terreng skal ha minst to lukkede trapperom.";
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til trapperom (Kap. 30:7)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        <p>{kravTekst}</p>
                        {formData.trapperomBeskrivelse && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <span className="font-semibold">Beskrivelse:</span> {formData.trapperomBeskrivelse}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                );
              }

              // BF85 Industri, Kraftstasjon, Kontor, Lager, Garasje, Skur – vis automatisk krav
              const industriTyper = ["Industri", "Kraftstasjon", "Kontor", "Lager", "Garasje", "Skur"];
              if (isBF85 && industriTyper.includes(formData.bygningstype) && floors >= 1) {
                const kravTekst = floors > 8
                  ? "Bygning med flere enn 8 etasjer eller med gulv mer enn 22 m over terreng skal ha minst to branntrygge trapperom."
                  : "Bygninger med inntil 8 etasjer og med gulv inntil 22 m over terreng kan ha åpne trapperom.";
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til trapperom (Kap. 30:7)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        <p>{kravTekst}</p>
                        {formData.trapperomBeskrivelse && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <span className="font-semibold">Beskrivelse:</span> {formData.trapperomBeskrivelse}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                );
              }

              // BF85 Sykehus / pleieanstalt – vis automatisk krav
              if (isBF85 && formData.bygningstype === "Sykehus" && floors >= 1) {
                const kravTekst = floors > 8
                  ? "Bygning med flere enn 8 etasjer eller med gulv mer enn 22 m over terreng skal ha minst to branntrygge trapperom."
                  : "Bygning med inntil 8 etasjer og med gulv inntil 22 m over terreng skal ha minst to lukkede trapperom.";
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til trapperom (Kap. 30:7)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        <p>{kravTekst}</p>
                        <p className="font-semibold">Trappene skal utformes slik at båretransport kan foregå uhindret.</p>
                        {formData.trapperomBeskrivelse && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <span className="font-semibold">Beskrivelse:</span> {formData.trapperomBeskrivelse}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                );
              }

              // If trapperomKravTekst exists, show it directly
              if (formData.trapperomKravTekst) {
                const trapperomTypeMap: Record<number, { lav: string; hoy: string }> = {
                  1: { lav: "Tr 1", hoy: "Tr 3" }, 2: { lav: "Tr 1", hoy: "Tr 3" },
                  3: { lav: "Tr 2", hoy: "Tr 3" }, 4: { lav: "Tr 1", hoy: "Tr 3" },
                  5: { lav: "Tr 2", hoy: "Tr 3" }, 6: { lav: "Tr 2", hoy: "Tr 3" },
                };
                const getTrTypeLocal = (rkNum: number, floorCount: number) => {
                  return rkNum >= 1 && rkNum <= 6 && floorCount > 0
                    ? (floorCount <= 8 ? trapperomTypeMap[rkNum].lav : trapperomTypeMap[rkNum].hoy)
                    : null;
                };
                // Build multi-part label
                const trLabels: string[] = [];
                if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                  const rk1 = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                  const tr1 = getTrTypeLocal(rk1, floors);
                  if (tr1) trLabels.push(`${formData.bygningstype || 'Bygningsdel 1'}: ${tr1}`);
                  formData.bygningsdeler.forEach((del: any, i: number) => {
                    const rkD = parseInt(del.risikoklasse?.replace(/\D/g, '') || '0', 10);
                    const flD = parseInt(del.etasjer || formData.etasjer, 10) || 0;
                    const trD = getTrTypeLocal(rkD, flD);
                    if (trD) trLabels.push(`${del.navn || del.bygningstype || `Bygningsdel ${i + 2}`}: ${trD}`);
                  });
                } else {
                  const rk1 = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                  const tr1 = getTrTypeLocal(rk1, floors);
                  if (tr1) trLabels.push(tr1);
                }
                const uniqueTr = [...new Set(trLabels)];
                const trTypeHeader = uniqueTr.length > 1 ? uniqueTr.join(", ") : (uniqueTr[0] || null);
                
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til trapperom{trTypeHeader && ` (${trTypeHeader})`}</td>
                    <td className="border border-gray-400 p-2 whitespace-pre-wrap">{formData.trapperomKravTekst}</td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                );
              }

              // Manual BF85 or TEK17 trapperomKrav
              if (!formData.trapperomKrav || formData.trapperomKrav.length === 0) return null;

              if (isBF85) {
                const bf85TrapperomMap: Record<string, { title: string; desc: string }> = {
                  bf85_tr_aapent: { title: "Åpent trapperom (Tr1)", desc: "Trapperom som har direkte forbindelse gjennom dør til bruksenheten." },
                  bf85_tr_lukket: { title: "Lukket trapperom (Tr2)", desc: "Trapperom som har forbindelse til bruksenhet bare gjennom lukket korridor, og som er lukket med dør B 30 eller F 30 mot korridor." },
                  bf85_tr_branntrygt: { title: "Branntrygt trapperom (Tr2)", desc: "Lukket trapperom utført som branntrygt rom uten forbindelse til kjeller." },
                  bf85_tr_roykfritt: { title: "Røykfritt trapperom (Tr3)", desc: "Branntrygt trapperom med forbindelse til bruksenheten bare gjennom rom åpent mot det fri (f.eks. balkong)." },
                };
                const activeKrav = formData.trapperomKrav
                  .map((id: string) => ({ id, ...bf85TrapperomMap[id] }))
                  .filter((k: { title?: string }) => k.title);
                if (activeKrav.length === 0) return null;
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til trapperom (Kap. 30:7)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        {activeKrav.map((k: { id: string; title: string; desc: string }) => (
                          <div key={k.id}><span className="font-semibold">{k.title}:</span> {k.desc}</div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                );
              }

              // TEK17 logic
              const trapperomTypeMap: Record<number, { lav: string; hoy: string }> = {
                1: { lav: "Tr 1", hoy: "Tr 3" },
                2: { lav: "Tr 1", hoy: "Tr 3" },
                3: { lav: "Tr 2", hoy: "Tr 3" },
                4: { lav: "Tr 1", hoy: "Tr 3" },
                5: { lav: "Tr 2", hoy: "Tr 3" },
                6: { lav: "Tr 2", hoy: "Tr 3" },
              };
              const getTrType = (rkNum: number, floorCount: number) => {
                return rkNum >= 1 && rkNum <= 6 && floorCount > 0
                  ? (floorCount <= 8 ? trapperomTypeMap[rkNum].lav : trapperomTypeMap[rkNum].hoy)
                  : null;
              };

              // Build per-building-part Tr types
              const trapperomDeler: { index: number; navn: string; trType: string | null }[] = [];
              if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                const rk1 = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                const fl1 = parseInt(formData.etasjer, 10) || 0;
                trapperomDeler.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', trType: getTrType(rk1, fl1) });
                formData.bygningsdeler.forEach((del: any, i: number) => {
                  const rkDel = parseInt(del.risikoklasse?.replace(/\D/g, '') || '0', 10);
                  const flDel = parseInt(del.etasjer || formData.etasjer, 10) || 0;
                  trapperomDeler.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, trType: getTrType(rkDel, flDel) });
                });
              }
              if (trapperomDeler.length === 0) {
                const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                trapperomDeler.push({ index: 1, navn: "", trType: getTrType(rk, floors) });
              }

              const uniqueTrTypes = [...new Set(trapperomDeler.map(d => d.trType).filter(Boolean))];
              const showMultipleTr = trapperomDeler.length > 1 && uniqueTrTypes.length > 1;

              // Header label
              const trTypeLabel = showMultipleTr
                ? uniqueTrTypes.join(" / ")
                : (uniqueTrTypes[0] || null);

              const trapperomKravMap: Record<string, string> = {
                tr_forbinder_brannceller: "Trapperom som forbinder ulike brannceller, må utføres som egen branncelle selv om trapperommet ikke er en del av en rømningsvei.",
                tr_romningsvei_videre: "Dersom trapperommet ikke leder direkte til det fri eller sikkert sted, må rømningsveien videre utføres som trapperom med hensyn til omsluttende konstruksjoner, mellomliggende rom, dører mv.",
                tr_mellomliggende_rom: "Mellomliggende rom må ha tilstrekkelig størrelse, og må kunne passeres ved å åpne bare én dør om gangen.",
                tr1_dor_bruksenhet: "Trapperom Tr 1 kan ha dør direkte fra trapperom til bruksenhet, for eksempel leilighet eller kontor. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 2.",
                tr2_eget_rom: "Trapperom Tr 2 må ha et rom utført som egen branncelle mellom trapperommet og branncellen det skal rømmes fra. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 3. Trapperom Tr 2 kan gå til kjeller når det er brannsluse mellom de øvrige branncellene i kjelleren og trapperommet.",
                tr3_mellomliggende: "Trapperom Tr 3 må ha et mellomliggende rom utført som egen branncelle mellom trapperommet og bruksenheten det skal rømmes fra. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 4. Trapperom Tr 3 kan ikke ha forbindelse til kjeller. Hensikten er å hindre at personer rømmer ned til kjelleren, og å hindre blokkering av trapperommet ved brann i kjeller.",
                tr_roykspredning: "Det må treffes tiltak for å begrense eller hindre røykspredning til trapperom Tr 2 og Tr 3 i samsvar med preaksepterte ytelser under G. Røykkontroll.",
              };
              const activeKrav = formData.trapperomKrav
                .map((id: string, idx: number) => ({ id, text: trapperomKravMap[id], num: idx + 1 }))
                .filter((k: { text: string }) => k.text);
              if (activeKrav.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">
                    Krav til trapperom{trTypeLabel && ` (${trTypeLabel})`}
                    {showMultipleTr && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {trapperomDeler.map(d => (
                          <div key={d.index}>Bygningsdel {d.index} ({d.navn}): {d.trType}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {activeKrav.map((k: { id: string; text: string; num: number }) => (
                        <div key={k.id}>{k.num}. {k.text}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              );
            })()}
            {formData.interntrappBeskrivelse && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Interntrapp</td>
                <td className="border border-gray-400 p-2 whitespace-pre-wrap">{formData.interntrappBeskrivelse}</td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Røykkontroll */}
            {(() => {
              const isBF85 = formData.regelverk === "BF85";
              const etasjer = parseInt(formData.etasjer, 10) || 0;
              const bf85KravAktivt = formData.roykKontrollKrav?.includes("bf85_royk_brannventilasjon");
              const harFritekst = !!formData.roykKontrollKravTekst;

              // New textarea-based approach
              if (harFritekst) {
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">{isBF85 ? "Brannventilasjon (Røykventilasjon)" : "Røykkontroll"}</td>
                    <td className="border border-gray-400 p-2 whitespace-pre-wrap">{formData.roykKontrollKravTekst}</td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIV</td>
                  </tr>
                );
              }
              // BF85: marker som avvik når kravet ikke er huket av men bygget har > 2 etasjer
              if (isBF85 && etasjer > 2 && !bf85KravAktivt) {
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Brannventilasjon (Røykventilasjon)</td>
                    <td className="border border-gray-400 p-2 text-destructive font-medium">
                      Avvik: Bygget har flere enn 2 etasjer. Etter BF85 §78 skal trapperom ha brannventilasjon. Vurdering er beskrevet i tilstandsvurderingen i slutten av kapittelet.
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIV</td>
                  </tr>
                );
              }
              // Legacy checkbox-based approach
              if (formData.roykKontrollKrav && formData.roykKontrollKrav.length > 0) {
                const roykKravMap: Record<string, string> = {
                  royk_romningsvei: "Trapperom som er rømningsvei i byggverk med flere enn to etasjer, må røykventileres.",
                  royk_luke_vindu: "I byggverk med inntil 8 etasjer med trapperom Tr 1 eller Tr 2, jf. § 11-13 Tabell 2, er det tilstrekkelig med luke eller vindu med fri åpning minimum 1,0 m² øverst i trapperommet.",
                  royk_manuell_bryter: "Luke eller vindu skal kunne åpnes manuelt med bryter fra inngangsplanet.",
                  royk_mekanisk_ventilasjon: "Mellomliggende rom knyttet til Tr 2 må ha mekanisk balansert ventilasjon.",
                  royk_tr3_trykksetting: "I byggverk med mer enn 8 etasjer med trapperom Tr 3, jf. § 11-13 Tabell 2, må det mellomliggende rommet være åpent mot det fri, eller trapperommet må trykksettes og det mellomliggende rommet må ha trykkavlastning (røykventilasjon).",
                  royk_overbygde_garder: "Overbygde gårder og gater må ha røykventilasjon for å hindre røykspredning mellom ulike brannceller som ligger ut mot den overbygde gården.",
                  bf85_royk_brannventilasjon: (() => {
                    if (etasjer > 8) {
                      return "I bygning med flere enn 2 etasjer skal trapperom ha brannventilasjon. Bygningen har over 8 etasjer og skal ha en røyksjakt som er skilt fra loft i minst A 30 og som har et tverrsnitt på minst 1 m². Sjakten skal gå 20 cm over takflaten.";
                    }
                    return "I bygning med flere enn 2 etasjer skal trapperom ha brannventilasjon. For bygninger med inntil 8 etasjer kan brannventilasjonen skje gjennom vindu i trapperom.";
                  })(),
                };
                const activeKrav = formData.roykKontrollKrav
                  .map((id: string, idx: number) => ({ id, text: roykKravMap[id], num: idx + 1 }))
                  .filter((k: { text: string }) => k.text);
                if (activeKrav.length === 0) return null;
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">{isBF85 ? "Brannventilasjon (Røykventilasjon)" : "Røykkontroll"}</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        {activeKrav.map((k: { id: string; text: string; num: number }) => (
                          <div key={k.id}>{k.num}. {k.text}</div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIV</td>
                  </tr>
                );
              }
              return null;
            })()}
            {/* Vertikal brannspredning */}
            {formData.vertikalBrannspredningRelevant && (() => {
              // Check if sprinkler is required based on risk class
              const rk = formData.risikoklasse;
              const etasjerNum = parseInt(formData.etasjer, 10) || 0;
              const erRK6 = rk === "RK6";
              const erRK4MedHeis = rk === "RK4" && etasjerNum > 3;
              const harSprinklerKrav = (erRK6 || erRK4MedHeis || formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && formData.regelverk !== "BF85";

              if (harSprinklerKrav) {
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Vertikal brannspredning</td>
                    <td className="border border-gray-400 p-2">
                      Byggverket har krav om automatisk sprinkleranlegg, og krav til vertikal brannspredning er dermed ivaretatt.
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                );
              }

              const vbKravMap: Record<string, string> = formData.regelverk === "BF85" ? {
                vb_kjolesone: "Kjølesone mellom vinduer i ulike etasjer skal være minst 1,2 meter og utført med brannmotstand minst E 30.",
              } : {
                vb_kjolesone: "Kjølesone (vertikal avstand) mellom vinduer er minst lik høyden til underliggende vindu og utført med brannmotstand minst E 30.",
                vb_fasade_e30: "Annenhver etasje er utført med fasade minst E 30.",
                vb_inntrukne: "Inntrukne fasadepartier er på minimum 1,2 meter, eller utkragede bygningsdeler med samme brannmotstand som etasjeskiller er minimum 1,2 meter ut fra fasadelivet.",
                vb_sprinkler: "Byggverket har automatisk sprinkleranlegg.",
                vb_takfot: "Med mindre byggverket har automatisk sprinkleranlegg, må takfoten – i hele lengden – utføres som branncellebegrensende konstruksjon for brannpåvirkning nedenfra.",
              };
              const mainItems = (formData.vertikalBrannspredningKrav || [])
                .filter((id: string) => id !== "vb_takfot")
                .map((id: string) => vbKravMap[id])
                .filter(Boolean);
              const hasTakfot = (formData.vertikalBrannspredningKrav || []).includes("vb_takfot");
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Vertikal brannspredning</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {mainItems.length > 0 && (
                        <>
                          <div>Sannsynligheten for brannspredning mellom brannceller i ulike plan, må reduseres på en av følgende måter:</div>
                          {mainItems.map((text: string, idx: number) => (
                            <div key={idx} className="pl-4">{idx + 1}. {text}</div>
                          ))}
                        </>
                      )}
                      {hasTakfot && (
                        <div className={mainItems.length > 0 ? "mt-2" : ""}>{vbKravMap.vb_takfot}</div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* Horisontal brannspredning */}
            {formData.vinduBrannspredningRelevant && (() => {
              const isBF85 = formData.regelverk === "BF85";
              
              // Check sprinkler requirement
              const rk = formData.harFlereRisikoklasser
                ? (formData.bygningsdeler || []).map((d: any) => d.risikoklasse).filter(Boolean)[0] || ""
                : formData.risikoklasse || "";
              const etasjerNum = parseInt(formData.etasjer, 10) || 0;
              const erRK6 = rk === "RK6";
              const erRK4MedHeis = rk === "RK4" && etasjerNum > 3;
              const harSprinklerKrav = !isBF85 && (erRK6 || erRK4MedHeis || formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b);

              if (harSprinklerKrav) {
                const bklNum = formData.harFlereRisikoklasser
                  ? (() => { const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)); return nums.length > 0 ? Math.max(...nums) : 0; })()
                  : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
                const ewKrav = bklNum === 1 ? "EW 30" : "EW 60";
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Horisontal brannspredning</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        <div>Byggverket har krav om automatisk sprinkleranlegg. Krav til horisontal brannspredning via vinduer er dermed ivaretatt gjennom sprinkleranlegget.</div>
                        {formData.vinduMotRomningsvei && (
                          <div className="mt-2">Vinduer mot utvendig rømningsvei skal ha brannmotstand {ewKrav} (brannklasse {bklNum === 1 ? "1" : "2 og 3"}).</div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                );
              }

              const vvKravMap: Record<string, string> = isBF85 ? {
                vv_brannmotstand_vegg: "Vinduer skal ha samme brannklasse som veggen de står i.",
              } : {
                vv_branncellebegrensende: "Branncellebegrensende konstruksjoner i et byggverk, eller mellom to lave byggverk, må utføres slik at det blir liten sannsynlighet for brannspredning via vinduer som ligger med liten innbyrdes avstand i innvendig hjørne, eller mellom vinduer i motstående fasader.",
                vv_brannmotstand_vegg: "Vinduer må ha samme brannmotstand som veggen de står i. For motstående parallelle yttervegger gjelder dette bare når vindusarealet ikke utgjør mer enn 1/3 av veggarealet.",
                vv_sprinkler_unntak: "Hvis byggverket eller byggverkene har automatisk sprinkleranlegg kan det benyttes vinduer uten spesifisert brannmotstand, med unntak for vinduer mot rømningsvei.",
                vv_sprinkler_romningsvei: "Hvis byggverket eller byggverkene har automatisk sprinkleranlegg kan vindu mot utvendig rømningsvei ha brannmotstand EW 30 i brannklasse 1 og EW 60 i brannklasse 2 og 3.",
                vv_enkeltvinduer: "Enkeltvinduer i mindre rom i bolighus (for eksempel i vaskerom, bad og soverom) opp til 0,20 m² glassflate, kan være uten spesifisert brannmotstand når avstanden til uklassifisert bygningsdel er minimum 5 meter.",
              };
              const activeKrav = (formData.vinduBrannspredningKrav || [])
                .map((id: string, idx: number) => ({ id, text: vvKravMap[id], num: idx + 1 }))
                .filter((k: { text: string }) => k.text);
              
              const plasseringer = formData.horisontaltPlasseringer || [];
              const bklNum = formData.harFlereRisikoklasser
                ? (() => {
                    const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n));
                    return nums.length > 0 ? Math.max(...nums) : 0;
                  })()
                : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
              const erBKL1 = bklNum === 1;
              const bklTekst = erBKL1 ? "BKL 1" : "BKL 2 og 3";
              const avstandKravList: string[] = [];
              if (plasseringer.includes("parallelle")) {
                (formData.horisontaltParallelleVinduer || []).forEach((v: { avstand: string }, i: number) => {
                  const avstand = parseFloat(v.avstand);
                  if (!isNaN(avstand)) {
                    let krav = "";
                    if (avstand < 3.0) krav = erBKL1 ? "Ett vindu EI 30 eller begge EI 15" : "Ett vindu EI 60 eller begge EI 30";
                    else if (avstand < 6.0) krav = erBKL1 ? "Ett vindu E 30 [F 30] eller begge EI 15" : "Ett vindu E 60 [F 60] eller begge E 30 [F 30]";
                    else krav = "Uspesifisert";
                    avstandKravList.push(`Motstående parallelle yttervegger – vindu ${i + 1} i ${bklTekst}: Avstand L = ${v.avstand} m. Nødvendig brannmotstand: ${krav}.`);
                  }
                });
              }
              if (plasseringer.includes("hjorne")) {
                (formData.horisontaltHjorneVinduer || []).forEach((v: { avstand: string }, i: number) => {
                  const avstand = parseFloat(v.avstand);
                  if (!isNaN(avstand)) {
                    let krav = "";
                    if (avstand < 2.0) krav = erBKL1 ? "Ett vindu EI 30 eller begge EI 15" : "Ett vindu EI 60 eller begge EI 30";
                    else if (avstand < 4.0) krav = erBKL1 ? "Ett vindu E 30 [F 30] eller begge EI 15" : "Ett vindu E 60 [F 60] eller begge E 30 [F 30]";
                    else krav = "Uspesifisert";
                    avstandKravList.push(`Innvendige hjørner – vindu ${i + 1} i ${bklTekst}: Avstand L = ${v.avstand} m. Nødvendig brannmotstand: ${krav}.`);
                  }
                });
              }

              if (activeKrav.length === 0 && avstandKravList.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Horisontal brannspredning</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {activeKrav.map((k: { id: string; text: string; num: number }) => (
                        <div key={k.id}>{k.num}. {k.text}</div>
                      ))}
                      {avstandKravList.map((krav, idx) => (
                        <div key={`avstand-${idx}`} className={activeKrav.length > 0 || idx > 0 ? "mt-2 font-medium" : "font-medium"}>{krav}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* Brannceller over flere plan */}
            {formData.branncellerFlerePlanRelevant && (() => {
              const rkList = formData.harFlereRisikoklasser
                ? (formData.bygningsdeler || []).map((d: any) => parseInt((d.risikoklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n))
                : [parseInt((formData.risikoklasse || "").replace(/\D/g, ''), 10)].filter((n) => !isNaN(n));
              const harUgyldigRK = rkList.some((rk: number) => rk === 3 || rk === 6);
              const ugyldigeRK = rkList.filter((rk: number) => rk === 3 || rk === 6);
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Brannceller over flere plan</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-2">
                      <div>
                        {formData.regelverk === "BF85"
                          ? "Brannceller kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte."
                          : "Brannceller i risikoklasse 1, 2, 4 og 5 kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte."
                        }
                      </div>
                      {harUgyldigRK && formData.regelverk !== "BF85" && (
                        <div className="text-red-600 font-medium">
                          ⚠ Fravik: Preakseptert ytelse for brannceller over flere plan gjelder kun risikoklasse 1, 2, 4 og 5. Prosjektet inneholder risikoklasse {ugyldigeRK.map((rk: number) => `RK ${rk}`).join(" og ")}, som ikke dekkes av denne ytelsen. Dette er et fravik som må dokumenteres.
                        </div>
                      )}
                      {harUgyldigRK && formData.regelverk === "BF85" && (
                        <div className="text-red-600 font-medium">
                          ⚠ Fravik: Krav til brannceller over flere plan gjelder ikke for {ugyldigeRK.flatMap((rk: number) => rk === 3 ? ["skole", "barnehage"] : ["sykehjem", "sykehus", "omsorgshjem"]).join(", ")}. Dette er et fravik som må dokumenteres.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              );
            })()}



            {/* Garasje - BF85 krav */}
            {formData.garasjeRelevant && formData.regelverk === "BF85" && (formData.garasjeBF85Krav || []).length > 0 && (() => {
              const bf85Labels: Record<string, string> = {
                bf85_garasje_eksos: "Garasje skal være skilt fra resten av bygningen med bygningsdeler som er så tette at eksos ikke trenger gjennom.",
                bf85_garasje_over50: "Garasje over 50 m² bruttoareal skal være skilt fra resten av bygningen med brannvegg eller branndekke.",
                bf85_garasje_under50: "Garasje inntil 50 m² bruttoareal skal være skilt fra resten av bygningen med bygningsdeler i B 30.",
              };
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Garasje – :44 Skille mot rom for annet formål</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {(formData.garasjeBF85Krav as string[]).map((id: string, i: number) => (
                        <div key={i}>{bf85Labels[id] || id}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK / RIBr</td>
                </tr>
              );
            })()}
            {/* Garasje - TEK17 redigerbar tekst */}
            {formData.garasjeRelevant && formData.regelverk !== "BF85" && formData.garasjeKravTekst && (() => {
              const lines = (formData.garasjeKravTekst as string).split("\n").filter((l: string) => l.trim());
              // Group by kategori prefix
              const grouped: Record<string, string[]> = {};
              lines.forEach((line: string) => {
                const match = line.match(/^(.+?):\s*(.+)$/);
                if (match) {
                  const [, kategori, tekst] = match;
                  if (!grouped[kategori]) grouped[kategori] = [];
                  grouped[kategori].push(tekst);
                } else {
                  if (!grouped["Garasje"]) grouped["Garasje"] = [];
                  grouped["Garasje"].push(line);
                }
              });
              return Object.entries(grouped).map(([kategori, items]) => (
                <tr key={kategori}>
                  <td className="border border-gray-400 p-2 align-top">{kategori}</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i}>{items.length > 1 ? `${i + 1}. ` : ""}{item}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK / RIBr</td>
                </tr>
              ));
            })()}
            {/* Oljelagring BF85 */}
            {isBF85 && formData.oljelagringRelevant && (() => {
              const items: string[] = [];
              // :341 alltid med
              items.push(":341 Generelt – Bestemmelsene gjelder lagring på tank tilknyttet oljeovn eller oljefyringsanlegg. Brenseltank skal tåle mekaniske påkjenninger og beskyttes mot korrosjon.");
              const krav = formData.oljelagringBF85Krav || [];
              if (krav.includes("bf85_olje_jord_fjell")) {
                items.push(":342 Oljelager i jord eller i fjell – Nedgravd tank skal være dekket av et minst 0,5 m tykt lag av jord eller med betryggande betongplate.");
              }
              if (krav.includes("bf85_olje_fri_over_jord")) {
                items.push(":343 Oljelager fri over jord – Tank skal plasseres slik i forhold til bygning og opplag at det ikke er fare for at tanken kan bli antent ved brann i disse.");
              }
              if (krav.includes("bf85_olje_innendors")) {
                items.push(":344 Oljelager innendørs – Olje i mengde over 20 liter må bare lagres i tankrom, fyrrom eller garasje som tilfredsstiller kravene til branncellebegrensning. Vegger og golv skal være tette, og rommet skal være slik innredet at olje ved lekkasje fra tanken samles opp og ikke kan trenge inn i andre rom eller i ildsted eller røykkanal. Rommet skal ha elektrisk belysning. Tank for fyringsolje må plasseres minst 1,0 m fra kjele, brenner eller røykkanal. For petroleumstank må tilsvarende avstand være 2,0 m. Tank på inntil 600 liter kan plasseres på brakett på vegg i A 60-konstruksjon. Tank av brennbart materiale skal plasseres i tankrom med branncellebegrensende bygningsdel minst A 60.");
                const mengdeLabels: Record<string, string> = {
                  bf85_olje_fyringsparafin_a: ":345a Fyringssolje – På tank som utgjør en del av typegodkjent ildsted: Høyst 20 liter.",
                  bf85_olje_fyringsparafin_b: ":345a Fyringssolje – På vegg-/tankovn med forgassingsbrenner plassert minst 0,6 m fra ildsted: Høyst 20 liter.",
                  bf85_olje_fyringsparafin_c: ":345a Fyringssolje – På tank i fyrrom eller garasje med grunnflate høyst 50 m² med branncellebegrensende bygningsdel minst B 30: Inntil 4 000 liter.",
                  bf85_olje_fyringsparafin_d: ":345a Fyringssolje – På tank i tankrom eller i fyrrom med branncellebegrensende bygningsdel h.h.v minst B 30 og A 60: Inntil 10 000 liter.",
                  bf85_olje_fyringsparafin_e: ":345a Fyringssolje – På tank i tankrom med branncellebegrensende bygningsdel minst A 60: Over 10 000 liter (avhengig av brannstyrets godkjenning).",
                  bf85_olje_fyringsparafin_f: ":345a Fyringssolje – På nedgravd tank: Ingen begrensning.",
                  bf85_olje_petroleum: ":345b Petroleum – Petroleum i mengde inntil 1 650 liter kan lagres som fyringssolje. Ved fellesanlegg for rekkehus, leiegårder o.l. kan brannstyret tillate inntil 1 000 liter petroleum pr. boligenhet, dog ikke over 6 000 liter.",
                };
                Object.entries(mengdeLabels).forEach(([id, label]) => {
                  if (krav.includes(id)) items.push(label);
                });
              }
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Lagring av olje (:34)</td>
                  <td className="border border-gray-400 p-2">
                    <ul className="list-disc pl-4 space-y-1">
                      {items.map((text, i) => (
                        <li key={i}>{text}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* Brensellagring TEK17 - automatisk genererte krav */}
            {!isBF85 && formData.brensellagringRelevant && formData.brenselType && formData.brenselMengde && (() => {
              const result = getBrensellagringKrav(formData.brenselType as BrenselType, parseInt(formData.brenselMengde));
              if (result.feilmelding || result.krav.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Rom for lagring av olje</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      <div className="font-medium text-xs mb-1">Romtype: {result.romType}</div>
                      {result.krav.map((k, i) => (
                        <div key={i}>{k.kategori}: {k.tekst}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* Husdyrrom */}
            {formData.branncelleTyper?.includes("husdyrrom") && formData.husdyrromAreal && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Husdyrrom</td>
                <td className="border border-gray-400 p-2">
                  {formData.husdyrromAreal === "under_300"
                    ? "Husdyrrom med bruttoareal mindre enn 300 m² må være avgrenset fra resten av byggverket med bygningsdeler med brannmotstand minst EI 30 [B 30]."
                    : "Husdyrrom med bruttoareal større enn 300 m² må være avgrenset fra resten av byggverket med bygningsdeler med brannmotstand minst EI 60 [B 60]."}
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.branncellerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.branncellerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_5"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_5"]} sectionLabel="3.5 Brannceller" />
            )}

            {/* 3.6 §11-9 Materialer og produkter */}
            <tr id="preview-3-6" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.6 &nbsp;&nbsp; {isBF85 ? <>Kledninger og overflater for vegger og tak (:42) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-9 Materialer og produkters egenskaper ved brann)</span></> : "§11-9 Materialer og produkters egenskaper ved brann"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>

            {isBF85 ? (
              <>
                {/* BF85 :42 Generelt */}
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt (:42)</td>
                  <td className="border border-gray-400 p-2">
                    <p className="text-sm mb-2">Kledninger og overflater for vegger og tak skal være i brannteknisk klasse som angitt i Tabell 30:42.</p>
                    <p className="text-sm mb-2">Brannceller inntil 200 m², unntatt bygninger etter kap. 36 (overnattingssteder) og kap. 37 (sykehus og pleieanstalter), kan ha kledning K2 og overflate In3, forutsatt at brannvesenet med det stigemateriell det rår over kan komme til bygningens fasader.</p>
                    <p className="text-sm">Små atskilte rom, overstykker og brystning til vinduer, samt overstykker til dører kan ha overflate In3.</p>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
                {/* Krav basert på bygningsbrannklasse fra Tabell 30:42 */}
                {formData.bygningsbrannklasse && (() => {
                  const bkl = parseInt(formData.bygningsbrannklasse, 10);
                  const krav = {
                    innvOverflate: bkl === 1 ? "In1 (B-s1,d0)" : "In2 (D-s2,d0)",
                    utvOverflate: bkl <= 2 ? "Ut1 (B-s3,d0)" : "Ut2 (D-s3,d0)",
                    innvKledning: bkl <= 2 ? "K1 (K₂10 B-s1,d0)" : "K2 (K₂10 D-s2,d0)",
                    utvKledning: bkl <= 2 ? "K1 (K₂10 B-s1,d0)" : "K2 (K₂10 D-s2,d0)",
                    saerInnvOverflate: "In1 (B-s1,d0)",
                    saerInnvKledning: bkl <= 2 ? "K1-A (K₂10 A2-s1,d0)" : "K1 (K₂10 B-s1,d0)",
                  };
                  return (
                    <>
                      <tr className="bg-gray-100">
                        <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Krav iht. Tabell 30:42 – Bygningsbrannklasse {formData.bygningsbrannklasse}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Innvendig overflate</td>
                        <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">{krav.innvOverflate}</span></td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Utvendig overflate</td>
                        <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">{krav.utvOverflate}</span></td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Innvendig kledning</td>
                        <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">{krav.innvKledning}</span></td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Utvendig kledning</td>
                        <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">{krav.utvKledning}</span></td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Særkrav for rømningsveg</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Innvendig overflate (rømningsveg)</td>
                        <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">{krav.saerInnvOverflate}</span></td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Innvendig kledning (rømningsveg)</td>
                        <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">{krav.saerInnvKledning}</span></td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                      {(formData.bygningstype === "Overnattingssted" || formData.bygningstype === "Sykehus") && (
                        <tr>
                          <td className="border border-gray-400 p-2 italic text-xs text-red-600" colSpan={3}>
                            ⚠️ Bygningen er {formData.bygningstype === "Overnattingssted" ? "overnattingssted (Kap. 36)" : "sykehus/pleieanstalt (Kap. 37)"} – unntaket for brannceller inntil 200 m² (K2/In3) gjelder ikke.
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
                {/* BF85 :5 Vegger, tak og nedforet himling */}
                {(formData.bf85_513 || formData.bf85_514 || formData.bf85_515) && (
                  <tr className="bg-gray-100">
                    <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Vegger, tak og nedforet himling (:5)</td>
                  </tr>
                )}
                {formData.bf85_513 && (() => {
                  const bkl = parseInt(formData.bygningsbrannklasse, 10);
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">:513 Yttervegger i B-konstruksjon</td>
                      <td className="border border-gray-400 p-2">
                        <p className="text-sm mb-1">I bygninger i bygningsbrannklasse 1 og 2 gjelder følgende:</p>
                        <p className="text-sm mb-1">Isolasjon skal være ubrennbar. Brennbare materialer skal være beskyttet utvendig og innvendig med kledning K1.</p>
                        {bkl <= 2 && (
                          <>
                            <p className="text-sm mb-1">I bygning i inntil 2 etasjer kan det brukes kledning K2 med overflate Ut2.</p>
                            <p className="text-sm mb-1">Bygning i inntil 4 etasjer kan ha fasademateriale K2/Ut2. Slik kledning må ikke være sammenhengende mere enn 20 m i horisontalretningen. Flere slike felt må ha en innbyrdes avstand på minst 10 m med K1/Ut1. Felt mellom direkte overliggende vinduer må likevel ha kledning K1/Ut1.</p>
                          </>
                        )}
                        <p className="text-sm">Hvor utvendig kledning er utlektet, skal det utenpå bindingsverk, isolasjon og eventuell vindsperre være kledning K1.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                  );
                })()}
                {formData.bf85_514 && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">:514 Fasademateriale på vegg i A-konstruksjon</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm mb-1">I bygning i inntil 2 etasjer kan det brukes fasademateriale K2/Ut2.</p>
                      <p className="text-sm mb-1">I bygning i 3 til 8 etasjer og der brannvesenet kan komme til hele fasaden for slokking kan fasademateriale være K2/Ut2. Slik kledning må ikke være sammenhengende mere enn 20 m i horisontalretningen. Flere slike felt må ha en innbyrdes avstand på minst 10 m med K1/Ut1. I bygning med flere enn 4 etasjer må kledning dessuten ved hver etasjeskiller være brutt av ubrennbar flammesperre som stikker minst 1 m ut fra fasaden.</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                )}
                {formData.bf85_515 && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">:515 Brennbar isolasjon</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm">Brennbar isolasjon i vegger og dekker i bygning inntil 2 etasjer i bygningsbrannklasse 3 og 4 skal ha kledning på begge sider, med mindre isolasjonen pga sine egenskaper eller sin bruk ikke bidrar til spredning av brann.</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                )}
              </>
            ) : (
              (() => {
                // Build list of all building parts with their RK and BKL
                const materialDeler: { index: number; navn: string; rk: string; bkl: string }[] = [];
                if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                  // Add primary part (del 1)
                  const del1Rk = formData.risikoklasse || "";
                  const del1Bkl = formData.brannklasse || getBrannklasse(del1Rk, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                  if (del1Rk && del1Bkl) materialDeler.push({ index: 1, navn: formData.bygningstype || "Bygningsdel 1", rk: del1Rk, bkl: del1Bkl });
                  // Add additional parts
                  formData.bygningsdeler.forEach((del: any, i: number) => {
                    const delRk = del.risikoklasse || "";
                    const delBkl = del.brannklasse || getBrannklasse(delRk, del.etasjer || formData.etasjer, del.harTerrengTilgang || "nei", del.areal || "0").brannklasse;
                    if (delRk && delBkl) materialDeler.push({ index: i + 2, navn: del.navn || `Bygningsdel ${i + 2}`, rk: delRk, bkl: delBkl });
                  });
                } else {
                  const rk = formData.risikoklasse || "";
                  const bkl = formData.brannklasse || "";
                  if (rk && bkl) materialDeler.push({ index: 1, navn: formData.bygningstype || "Bygningsdel 1", rk, bkl });
                }
                const harFlereDeler = materialDeler.length > 1;
                const harRK6 = materialDeler.some(d => d.rk === "RK6");
                const harIkkeRK6 = materialDeler.some(d => d.rk !== "RK6");

                // Helper: get BKL number
                const bklNum = (bkl: string) => parseInt(bkl.replace(/\D/g, ''), 10) || 0;

                // Determine strictest BKL for shared sections
                const maxBklNum = Math.max(...materialDeler.map(d => bklNum(d.bkl)), 0);

                return (
                  <>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Generelt</td>
                      <td className="border border-gray-400 p-2">
                        <p className="text-sm">Byggverk skal prosjekteres og utføres slik at det er liten sannsynlighet for at brann skal oppstå, utvikle og spre seg. Det skal tas hensyn til byggverkets bruk og den nødvendige tiden for rømning og redning.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIBr</td>
                    </tr>
                    {formData.matNote2 && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Overflater i hulrom</td>
                        <td className="border border-gray-400 p-2 text-sm">
                          Overflater i hulrom betraktes på samme måte som innvendig overflate og må ha minst like gode branntekniske egenskaper.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    )}
                    {formData.matNote3 && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Rom med brannfarlig virksomhet</td>
                        <td className="border border-gray-400 p-2 text-sm">
                          Rom med brannfarlig virksomhet må ha kledning som tilfredsstiller klasse K<sub>2</sub>10 A2-s1,d0 [K1-A]. Eksempel på rom med brannfarlig virksomhet er rom hvor det oppbevares fyrverkeri, brannfarlig væske kategori 1 og 2, eller rom hvor det utføres varme arbeider som sveising, sliping samt rom hvor det arbeides med åpen varme.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    )}
                    {formData.matNote4 && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Innvendige overflater og kledninger (generelt)</td>
                        <td className="border border-gray-400 p-2 text-sm">
                          Selv om sikkerhet ved brann dokumenteres ved analyse, må innvendige overflater på vegger og i himlinger ha minst klasse D-s2,d0 [In 2]. Lavere ytelse kan gi uakseptabelt bidrag til brannutviklingen. Dette kan utgjøre en fare for personsikkerheten. En meget rask brannutvikling kan også medføre at automatiske slokkeanlegg ikke har den effekten som er forutsatt.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    )}

                    {/* Overflater i brannceller som ikke er rømningsvei */}
                    <tr className="bg-gray-100">
                      <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Overflater i brannceller som ikke er rømningsvei</td>
                    </tr>
                    {harFlereDeler && harRK6 && harIkkeRK6 ? (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle inntil 200 m²</td>
                          <td className="border border-gray-400 p-2">
                            <div className="space-y-1">
                              {materialDeler.map((del) => (
                                <div key={`ovfl200-${del.index}`}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                  <span className="text-red-600 font-medium">{del.rk === "RK6" ? "B-s1,d0 [In 1]" : "D-s2,d0 [In 2]"}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle over 200 m²</td>
                          <td className="border border-gray-400 p-2">
                            <div className="space-y-1">
                              {materialDeler.map((del) => (
                                <div key={`ovfl200p-${del.index}`}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                  <span className="text-red-600 font-medium">{(del.rk === "RK6" || del.bkl !== "BKL1") ? "B-s1,d0 [In 1]" : "D-s2,d0 [In 2]"}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        {materialDeler.some(d => d.rk === "RK6") && (
                          <tr>
                            <td className="border border-gray-400 p-2 align-top">Overflater på gulv</td>
                            <td className="border border-gray-400 p-2">
                              <div className="space-y-1">
                                {materialDeler.filter(d => d.rk === "RK6").map((del) => (
                                  <div key={`ovflg-${del.index}`}>
                                    <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                    <span className="text-red-600 font-medium">D<sub>fl</sub>-s1 [G]</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-400 p-2 align-top">ARK</td>
                          </tr>
                        )}
                      </>
                    ) : harFlereDeler ? (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">{harRK6 ? "Overflater på vegger og i himling/tak, og i sjakter og hulrom" : "Overflater på vegger og i himling/tak i branncelle inntil 200 m²"}</td>
                          <td className="border border-gray-400 p-2">
                            <div className="space-y-1">
                              {materialDeler.map((del) => (
                                <div key={`ovfl200-${del.index}`}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                  <span className="text-red-600 font-medium">{harRK6 ? "B-s1,d0 [In 1]" : "D-s2,d0 [In 2]"}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        {harRK6 ? (
                          <tr>
                            <td className="border border-gray-400 p-2 align-top">Overflater på gulv</td>
                            <td className="border border-gray-400 p-2">
                              <div className="space-y-1">
                                {materialDeler.map((del) => (
                                  <div key={`ovflg-${del.index}`}>
                                    <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                    <span className="text-red-600 font-medium">D<sub>fl</sub>-s1 [G]</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-400 p-2 align-top">ARK</td>
                          </tr>
                        ) : (
                          <tr>
                            <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle over 200 m²</td>
                            <td className="border border-gray-400 p-2">
                              <div className="space-y-1">
                                {materialDeler.map((del) => (
                                  <div key={`ovfl200p-${del.index}`}>
                                    <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                    <span className="text-red-600 font-medium">{del.bkl === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]"}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-400 p-2 align-top">ARK</td>
                          </tr>
                        )}
                      </>
                    ) : harRK6 ? (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak, og i sjakter og hulrom</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">B-s1,d0 [In 1]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Overflater på gulv</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">D<sub>fl</sub>-s1 [G]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle inntil 200 m²</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">D-s2,d0 [In 2]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle over 200 m²</td>
                          <td className="border border-gray-400 p-2">
                            <span className="text-red-600 font-medium">{materialDeler[0]?.bkl === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]"}</span>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                      </>
                    )}

                    {/* Overflater i brannceller som er rømningsvei */}
                    <tr className="bg-gray-100">
                      <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Overflater i brannceller som er rømningsvei</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak</td>
                      <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">B-s1,d0 [In 1]</span></td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Overflater på gulv</td>
                      <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">D<sub>fl</sub>-s1 [G]</span></td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>

                    {/* Utvendige overflater */}
                    <tr className="bg-gray-100">
                      <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Utvendige overflater</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Overflater på ytterkledning</td>
                      <td className="border border-gray-400 p-2">
                        {harFlereDeler ? (
                          <div className="space-y-1">
                            {materialDeler.map((del) => {
                              const isYtterkledningD = formData.ytterkledningDKrav && (del.bkl === "BKL2" || del.bkl === "BKL3");
                              return (
                                <div key={`ytterkl-${del.index}`}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                  {isYtterkledningD ? (
                                    <span className="text-red-600 font-medium">D-s3,d0 [Ut 2]</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">{del.bkl === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]"}</span>
                                  )}
                                </div>
                              );
                            })}
                            {formData.ytterkledningDKrav && materialDeler.some(d => d.bkl === "BKL2" || d.bkl === "BKL3") && (
                              <p className="text-sm mt-1">Yttervegg er utformet slik at den hindrer brannspredning i fasaden.</p>
                            )}
                          </div>
                        ) : (
                          <>
                            {formData.ytterkledningDKrav && (materialDeler[0]?.bkl === "BKL2" || materialDeler[0]?.bkl === "BKL3") ? (
                              <>
                                <span className="text-red-600 font-medium">D-s3,d0 [Ut 2]</span>
                                <p className="text-sm mt-1">Yttervegg er utformet slik at den hindrer brannspredning i fasaden.</p>
                              </>
                            ) : (
                              <span className="text-red-600 font-medium">{materialDeler[0]?.bkl === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]"}</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Overflater i hulrom</td>
                      <td className="border border-gray-400 p-2">
                        <ul className="list-disc ml-4 space-y-2 text-sm">
                          {harFlereDeler ? (
                            <>
                              {materialDeler.some(d => (d.bkl === "BKL2" || d.bkl === "BKL3") && !formData.ytterkledningDKrav) && (
                                <li>Yttervegg kan ha utvendig overflate som tilfredsstiller klasse <span className="text-red-600 font-medium">D-s3,d0 [Ut 2]</span>, når{materialDeler.some(d => ["RK1","RK2","RK4"].includes(d.rk)) ? " enten" : ""}
                                  <ul className="list-disc ml-6 mt-1 space-y-1">
                                    <li>ytterveggen er utformet slik at den hindrer brannspredning i fasaden{materialDeler.some(d => ["RK1","RK2","RK4"].includes(d.rk)) ? ", eller" : "."}</li>
                                    {materialDeler.some(d => ["RK1","RK2","RK4"].includes(d.rk)) && (
                                      <li>byggverket har inntil fire etasjer, og det er liten fare for brannspredning til og fra nabobyggverk.</li>
                                    )}
                                  </ul>
                                </li>
                              )}
                              <li>Overflater i hulrom i ytterveggkonstruksjoner betraktes på samme måte som utvendig overflate og må ha minst like gode branntekniske egenskaper.</li>
                              {materialDeler.some(d => (d.bkl === "BKL1" || d.rk === "RK4") && parseInt(formData.etasjer) <= 3) && (
                                <li>Byggverk i brannklasse 1{materialDeler.some(d => d.rk === "RK4") ? " og boliger" : ""} inntil 3 etasjer kan ha uklassifiserte overflater i hulrom.</li>
                              )}
                            </>
                          ) : (
                            <>
                              {(materialDeler[0]?.bkl === "BKL2" || materialDeler[0]?.bkl === "BKL3") && !formData.ytterkledningDKrav && (
                                <li>Yttervegg kan ha utvendig overflate som tilfredsstiller klasse <span className="text-red-600 font-medium">D-s3,d0 [Ut 2]</span>, når{(["RK1","RK2","RK4"].includes(materialDeler[0]?.rk)) ? " enten" : ""}
                                  <ul className="list-disc ml-6 mt-1 space-y-1">
                                    <li>ytterveggen er utformet slik at den hindrer brannspredning i fasaden{(["RK1","RK2","RK4"].includes(materialDeler[0]?.rk)) ? ", eller" : "."}</li>
                                    {(["RK1","RK2","RK4"].includes(materialDeler[0]?.rk)) && (
                                      <li>byggverket har inntil fire etasjer, og det er liten fare for brannspredning til og fra nabobyggverk.</li>
                                    )}
                                  </ul>
                                </li>
                              )}
                              <li>Overflater i hulrom i ytterveggkonstruksjoner betraktes på samme måte som utvendig overflate og må ha minst like gode branntekniske egenskaper.</li>
                              {(materialDeler[0]?.bkl === "BKL1" || materialDeler[0]?.rk === "RK4") && parseInt(formData.etasjer) <= 3 && (
                                <li>Byggverk i brannklasse 1{materialDeler[0]?.rk === "RK4" ? " og boliger" : ""} inntil 3 etasjer kan ha uklassifiserte overflater i hulrom.</li>
                              )}
                            </>
                          )}
                        </ul>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>

                    {/* Kledninger */}
                    <tr className="bg-gray-100">
                      <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Kledninger</td>
                    </tr>
                    {harFlereDeler ? (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledning i branncelle inntil 200 m²</td>
                          <td className="border border-gray-400 p-2">
                            <div className="space-y-1">
                              {materialDeler.map((del) => (
                                <div key={`kled200-${del.index}`}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                  <span className="text-red-600 font-medium">{del.rk === "RK6" ? <>K<sub>2</sub>10 B-s1,d0 [K1]</> : <>K<sub>2</sub>10 D-s2,d0 [K2]</>}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledning i branncelle som er rømningsvei</td>
                          <td className="border border-gray-400 p-2">
                            <div className="space-y-1">
                              {materialDeler.map((del) => (
                                <div key={`kledrom-${del.index}`}>
                                  <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                  <span className="text-red-600 font-medium">{(del.rk === "RK6" || del.bkl !== "BKL1") ? <>K<sub>2</sub>10 A2-s1,d0 [K1-A]</> : <>K<sub>2</sub>10 B-s1,d0 [K1]</>}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        {materialDeler.some(d => d.rk === "RK6") && (
                          <tr>
                            <td className="border border-gray-400 p-2 align-top">Kledning i sjakter og hulrom</td>
                            <td className="border border-gray-400 p-2">
                              <div className="space-y-1">
                                {materialDeler.filter(d => d.rk === "RK6").map((del) => (
                                  <div key={`kledsjakt-${del.index}`}>
                                    <span className="font-medium">Bygningsdel {del.index} ({del.navn}, {del.bkl}):</span>{" "}
                                    <span className="text-red-600 font-medium">K<sub>2</sub>10 A2-s1,d0 [K1-A]</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-400 p-2 align-top">ARK</td>
                          </tr>
                        )}
                      </>
                    ) : harRK6 ? (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledning i brannceller</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">K<sub>2</sub>10 B-s1,d0 [K1]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledninger i branncelle som er rømningsvei</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">K<sub>2</sub>10 A2-s1,d0 [K1-A]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledning i sjakter og hulrom</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">K<sub>2</sub>10 A2-s1,d0 [K1-A]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledning i branncelle inntil 200 m²</td>
                          <td className="border border-gray-400 p-2"><span className="text-red-600 font-medium">K<sub>2</sub>10 D-s2,d0 [K2]</span></td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Kledning i branncelle som er rømningsvei</td>
                          <td className="border border-gray-400 p-2">
                            <span className="text-red-600 font-medium">{materialDeler[0]?.bkl === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]"}</span>
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK</td>
                        </tr>
                      </>
                    )}

                    {/* Taktekning */}
                    <tr className="bg-gray-100">
                      <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Taktekning</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Taktekning</td>
                      <td className="border border-gray-400 p-2">
                        {(() => {
                          const isSmahusRelevant = materialDeler.some(d => d.rk === "RK4" || (d.rk === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig")));
                          return (
                            <>
                              <p className="mb-2">Taktekning kan bidra til brannspredning i et byggverk og mellom ulike byggverk.</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Taktekning må tilfredsstille klasse <span className="text-red-600 font-medium">B<sub>ROOF</sub>(t2) [Ta]</span>.</li>
                                <li>Teglstein, betongtakstein, skifertak og metallplater kan uten ytterligere dokumentasjon antas å tilfredsstille klasse B<sub>ROOF</sub>(t2) [Ta].</li>
                                {isSmahusRelevant && (
                                  <li>For småhus kan taktekning være uklassifisert der avstanden mellom de enkelte byggverk er minst 8 m.</li>
                                )}
                                <li>Ett-sjikts tak av duk og folie må tilfredsstille klasse <span className="text-red-600 font-medium">B-s3,d0 (Ut1)</span>.</li>
                              </ul>
                            </>
                          );
                        })()}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>

                    {/* Nedforet himling */}
                    {(formData.himlingNote1 || formData.himlingNote2) && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Nedforet himling i rømningsvei</td>
                        <td className="border border-gray-400 p-2">
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {formData.himlingNote1 && (
                              <li>Himlingen må tilfredsstille klasse A2-s1,d0 [In 1 på begrenset brennbart underlag] og ha et opphengsystem med dokumentert brannmotstand minst 10 minutter for den aktuelle eksponering, eller himlingen må bestå av kledning som tilfredsstiller klasse K<sub>2</sub>10 A2-s1,d0 [K1-A].</li>
                            )}
                            {formData.himlingNote2 && (
                              <li>Overflater og kledninger i hulrom over himlingen må ha minst like gode branntekniske egenskaper som overflatene og kledningene i rømningsveien for øvrig.</li>
                            )}
                          </ol>
                        </td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                    )}

                    {/* Isolasjon */}
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Isolasjon</td>
                      <td className="border border-gray-400 p-2">
                        {(() => {
                          const hasSandwich = formData.isolasjonSandwich === "relevant";
                          const hasBrennbar = formData.isolasjonBrennbar === "relevant";

                          // Check across all building parts
                          const alleRk = materialDeler.map(d => d.rk);
                          const alleBkl = materialDeler.map(d => d.bkl);
                          const bygType = (formData.bygningstype || "").toLowerCase();
                          const isIndustri = bygType.includes("industri") || bygType.includes("lager") || bygType.includes("kraftstasjon") || materialDeler.some(d => { const n = (d.navn || "").toLowerCase(); return n.includes("industri") || n.includes("lager") || n.includes("kraftstasjon"); });
                          const isBoligType = bygType.includes("bolig") || materialDeler.some(d => (d.navn || "").toLowerCase().includes("bolig"));

                          // Sandwich filtering - check if any part qualifies
                          const sandwichBsd = hasSandwich && (
                            materialDeler.some(d => ["RK1","RK2","RK3","RK4"].includes(d.rk) && d.bkl === "BKL1") ||
                            (isIndustri && alleBkl.includes("BKL2"))
                          );
                          const sandwichDsd = hasSandwich && isIndustri && alleBkl.includes("BKL1");
                          const sandwichBeskyttelse = hasSandwich;
                          const sandwichKjole = hasSandwich && alleRk.includes("RK4");

                          // Brennbar filtering
                          const brennbarUtvendig = hasBrennbar && !alleBkl.includes("BKL3") && !alleRk.includes("RK6");
                          const brennbarCellulose = hasBrennbar && (alleBkl.includes("BKL1") || alleRk.includes("RK4") || (alleRk.includes("RK6") && isBoligType));

                          const hasFilteredItems = sandwichBsd || sandwichDsd || sandwichBeskyttelse || sandwichKjole || hasBrennbar;

                          return (
                            <>
                              <p className="mb-2">Isolasjonsmaterialer kan bidra til brannspredning og røykutvikling i et byggverk.</p>
                              <ul className="list-disc list-inside space-y-2 text-sm">
                                <li>Isolasjon må tilfredsstille klasse <span className="text-red-600 font-medium">A2-s1,d0</span>{hasFilteredItems ? " med mindre annet er angitt nedenfor." : "."}</li>
                                {sandwichBsd && (
                                  <li>Produkter (sandwichelementer) som tilfredsstiller klasse B-s1,d0 eller Eurefic-klasse A, kan benyttes i byggverk i risikoklasse 1–4 i brannklasse 1{isIndustri && alleBkl.includes("BKL2") ? " og i industri- og lagerbygninger i brannklasse 2" : ""}.</li>
                                )}
                                {sandwichDsd && (
                                  <li>Produkter (sandwichelementer) som tilfredsstiller klasse D-s2,d0 eller Eurefic-klasse E, kan benyttes i industri- og lagerbygninger i brannklasse 1.</li>
                                )}
                                {sandwichBeskyttelse && (
                                  <li>Produkter (sandwichelementer) som ikke tilfredsstiller A2-s1,d0 må være beskyttet av kledning K<sub>2</sub>10 A2-s1,d0 [K1-A] mot rømningsveier.</li>
                                )}
                                {sandwichKjole && (
                                  <li>Produkter (sandwichelementer) for små kjøle- og fryserom i risikoklasse 4 kan ha uspesifisert ytelse.</li>
                                )}
                                {hasBrennbar && (
                                  <>
                                    <li>Brennbar isolasjon kan benyttes på oversiden av etasjeskiller mot oppforet tak eller loft som bare kan benyttes som lager, forutsatt at
                                      <ul className="list-disc ml-6 mt-1 space-y-1">
                                        <li>etasjeskilleren mot oppforet tak eller loft er branncellebegrensende bygningsdel dimensjonert for tosidig brannpåkjenning</li>
                                        <li>takkonstruksjonen over etasjeskilleren ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen</li>
                                      </ul>
                                    </li>
                                    <li>Brennbar isolasjon kan benyttes i isolerte takflater forutsatt at
                                      <ul className="list-disc ml-6 mt-1 space-y-1">
                                        <li>isolasjonen legges på et bærende underlag som tilfredsstiller klasse A2-s1,d0 og som har dokumentert bæreevne under brann (R-klasse i samsvar med § 11–4)</li>
                                        <li>det bærende underlaget beskytter isolasjonen mot varmepåkjenning fra undersiden (for eksempel betongdekke){alleBkl.includes("BKL1") || alleBkl.includes("BKL2") ? " I brannklasse 1 og 2 kan alternativt den brennbare isolasjonen beskyttes på undersiden av isolasjon av klasse A2-s1,d0 med tilstrekkelig tykkelse til å isolere mot varmepåkjenning." : ""}</li>
                                        <li>den brennbare isolasjonen er beskyttet på oversiden av isolasjon med tykkelse 30 mm og som tilfredsstiller klasse A2-s1,d0. Alternativt til beskyttelse på oversiden kan den brennbare isolasjonen oppdeles i arealer på inntil 400 m².</li>
                                      </ul>
                                    </li>
                                    {brennbarUtvendig && (
                                      <li>Brennbar isolasjon kan benyttes som utvendig tilleggsisolering av yttervegger forutsatt at
                                        <ul className="list-disc ml-6 mt-1 space-y-1">
                                          <li>det benyttes isolasjonssystemer som er dokumentert ved prøving etter <em>SP Fire 105: Large scale testing of facade systems (1994)</em> eller tilsvarende.</li>
                                          <li>fasademateriale og isolasjon må være prøvet som en enhet. Underlaget må ha branntekniske egenskaper som minst tilsvarer det som ble benyttet ved prøving.</li>
                                        </ul>
                                      </li>
                                    )}
                                    {brennbarCellulose && (
                                      <li>Brennbar isolasjon basert på cellulose- eller tekstilfiber og lignende kan benyttes i byggverk i brannklasse 1{alleRk.includes("RK4") || (alleRk.includes("RK6") && isBoligType) ? ", og boliger inntil 3 etasjer" : ""}. Isolasjonen må tilfredsstille Euroklasse E, eller være i samsvar med <em>NT Fire 035</em>. Isolasjonen kan være utildekket i kaldt uinnredet loft og oppforet tak.</li>
                                    )}
                                  </>
                                )}
                              </ul>
                            </>
                          );
                        })()}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                  </>
                );
              })()
            )}
            {formData.materialerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.materialerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_6"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_6"]} sectionLabel="3.6 Materialer og produkter" />
            )}


            {/* 3.7 §11-10 Tekniske installasjoner */}
            <tr id="preview-3-7" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.7 &nbsp;&nbsp; {isBF85 ? <>Ventilasjon og installasjoner (Kap. 47) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-10 Tekniske installasjoner)</span></> : "§11-10 Tekniske installasjoner"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            {isBF85 ? (
              <>
                {formData.bf85_1332_avtrekk && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">:1332 Avtrekk</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-2">
                        <li>Avtrekk fra kjøkken og WC skal føres i egne kanaler.</li>
                        <li>Avtrekk fra forskjellige leiligheter skal føres i egne kanaler minst en full etasjehøyde opp, før de eventuelt føres sammen i felles kanal. Alle rom som knyttes til felles kanal, skal ha friskluftstilførsel i samme fasade.</li>
                        <li>Oppholdsrom, soverom og arbeidsrom i bygninger med naturlig avtrekk skal ha vindu eller ytterdør som gir mulighet for rask utlufting.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIV</td>
                  </tr>
                )}
              </>
            ) : (
              <>
                {formData.ventilasjonRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Ventilasjonsanlegg</td>
                      <td className="border border-gray-400 p-2">
                        <ul className="list-disc ml-4 space-y-2">
                          <li>Ventilasjonskanal som føres gjennom en brannskillende bygningsdel, må utføres slik at bygningsdelens brannmotstand blir opprettholdt.</li>
                          <li>Innfesting og oppheng for kanaler og ventilasjonsutstyr må utføres slik at forutsatt funksjonstid og brannmotstand blir opprettholdt.</li>
                          <li>Avtrekk fra komfyr må føres i egen kanal.</li>
                          <li>Ventilasjonsanlegg må utføres i materialer som tilfredsstiller klasse <span className="text-red-600 font-medium">A2-s1,d0</span>.</li>
                          {formData.ventKrav5 && <li>Avtrekkskanal fra storkjøkken og frityrkoker må ha brannmotstand minst <span className="text-red-600 font-medium">EI 30 A2-s1,d0</span>.</li>}
                          {formData.ventKrav6 && <li>Avtrekkskanal fra kjøkken i boenhet må ha brannmotstand minst <span className="text-red-600 font-medium">EI 15 A2-s1,d0</span>.</li>}
                          {formData.ventKrav7 && (formData.risikoklasse === "RK4" || (formData.risikoklasse === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig"))) && <li>I småhus kan avtrekk fra komfyr føres i kanal av stål eller aluminium.</li>}
                          {formData.ventKrav8 && (formData.risikoklasse === "RK4" || (formData.risikoklasse === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig"))) && <li>I småhus kan kanal som tilfredsstiller klasse <span className="text-red-600 font-medium">E</span> benyttes.</li>}
                          {formData.ventKrav9 && <li>Kanal som føres gjennom seksjoneringsvægg, må ha lukkeanordning (brannspjeld) med minimum samme brannmotstand som seksjoneringsvegg.</li>}
                        </ul>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                )}
                {formData.vannAvlopRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Vann- og avløpsrør</td>
                      <td className="border border-gray-400 p-2">
                        <ul className="list-disc ml-4 space-y-2">
                          <li>Rørgjennomføringer i brannskillende konstruksjoner må ha dokumentert brannmotstand.</li>
                          <li>Plastrør med ytre diameter til og med 32 mm kan føres gjennom murte eller støpte konstruksjoner.</li>
                          <li>Støpejernrør med ytre diameter til og med 110 mm kan føres gjennom murte eller støpte konstruksjoner.</li>
                        </ul>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                )}
                {formData.rorIsolasjonRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Rør- og kanalisolasjon</td>
                      <td className="border border-gray-400 p-2">
                        <ul className="list-disc ml-4 space-y-2">
                          <li>Dersom den samlede eksponerte overflaten av isolasjonen på rør og kanaler utgjør mer enn 20 prosent av tilgrensende vegg- eller himlingsflate, må isolasjonen tilfredsstille klasse <span className="text-red-600 font-medium">A2<sub>L</sub>-s1,d0</span> [ubrennbar eller begrenset brennbar] eller ha minst samme klasse som de tilgrensende overflatene.</li>
                          <li>Dersom den samlede eksponerte overflaten av isolasjonen utgjør mindre enn 20 prosent av tilgrensende vegg- eller himlingsflate, gjelder følgende:
                            <ul className="list-disc ml-6 mt-1 space-y-1">
                              <li>Isolasjon på rør og kanaler i rømningsveier må minst tilfredsstille klasse <span className="text-red-600 font-medium">B<sub>L</sub>-s1,d0 [PI]</span>. Unntak gjelder isolasjon på enkeltstående rør eller kanal med ytre diameter til og med 200 mm som minst må tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                              <li>Isolasjon på rør og kanaler som er lagt i sjakt, i hulrom og bak nedforet himling med branncellebegrensende funksjon, må minst tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                              {(() => {
                                const allParts: { label: string; rk: string; bkl: string }[] = [];
                                if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length) {
                                  formData.bygningsdeler.forEach((d: any, i: number) => {
                                    if (d.risikoklasse) allParts.push({ label: `Bygningsdel ${i + 1} (${d.navn || d.bygningstype || ''}, ${d.brannklasse || ''})`, rk: d.risikoklasse, bkl: d.brannklasse || '' });
                                  });
                                } else {
                                  allParts.push({ label: '', rk: formData.risikoklasse, bkl: formData.brannklasse });
                                }
                                const isMulti = formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0;
                                if (!isMulti) {
                                  // Single part – show one line
                                  const isPII = ["RK3","RK5","RK6"].includes(allParts[0].rk) || ["BKL2","BKL3"].includes(allParts[0].bkl);
                                  return (
                                    <li>Øvrig isolasjon på rør og kanaler må minst tilfredsstille klasse <span className="text-red-600 font-medium">{isPII ? <>C<sub>L</sub>-s3,d0 [PII]</> : <>D<sub>L</sub>-s3,d0 [PIII]</>}</span>.</li>
                                  );
                                }
                                // Multiple parts – show per part
                                return (
                                  <li>Øvrig isolasjon på rør og kanaler:
                                    <ul className="list-disc ml-6 mt-1 space-y-1">
                                      {allParts.map((p, idx) => {
                                        const isPII = ["RK3","RK5","RK6"].includes(p.rk) || ["BKL2","BKL3"].includes(p.bkl);
                                        return (
                                          <li key={idx}>{p.label}: klasse <span className="text-red-600 font-medium">{isPII ? <>C<sub>L</sub>-s3,d0 [PII]</> : <>D<sub>L</sub>-s3,d0 [PIII]</>}</span></li>
                                        );
                                      })}
                                    </ul>
                                  </li>
                                );
                              })()}
                            </ul>
                          </li>
                        </ul>
                        <p className="mt-2 text-sm">Den flaten der rør eller kanal er innfestet, regnes som tilgrensede vegg- eller himlingsflate. For vertikale rør og kanaler er det veggflaten som skal legges til grunn.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                )}
                {formData.elektriskRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Elektriske installasjoner</td>
                      <td className="border border-gray-400 p-2">
                        <ul className="list-disc ml-4 space-y-2">
                          <li>Kabler må ikke legges over nedforet himling eller i hulrom i rømningsvei med mindre ett av følgende punkter er oppfylt:
                            <ul className="list-disc ml-4 mt-1 space-y-1">
                              <li>kablene representerer liten brannenergi, det vil si mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter</span> hulrom</li>
                              <li>kablene er ført i egen sjakt med sjaktvegger som har brannmotstand tilsvarende branncellebegrensende bygningsdel</li>
                              <li>himlingen har brannmotstand tilsvarende branncellebegrensende bygningsdel</li>
                              <li>hulrommet er sprinklet.</li>
                            </ul>
                          </li>
                          <li>Kabler som utgjør liten brannenergi, det vil si mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter</span> korridor eller hulrom, kan føres ubeskyttet gjennom rømningsvei. Dette er et spesifikt unntak som gjelder kabler, og kan ikke brukes som begrunnelse for andre fravik fra preaksepterte ytelser.</li>
                        </ul>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIE</td>
                    </tr>
                )}
              </>
            )}
            {(() => {
              const erKraftstasjon37 = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjon37) return null;
              return (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Rom for høyspenningsanlegg</td>
                    <td className="border border-gray-400 p-2">
                      <p>Foran spenningsførende deler i apparatanlegg skal det anbringes dør, plate eller lignende beskyttelse, (jf. FEA-F § 39).</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIE</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Kabler (kulverter, sjakter og kabeltunneler) – kraftstasjon</td>
                    <td className="border border-gray-400 p-2">
                      <p>Kabler skal være forlagt slik at de er beskyttet mot skade fra brann, trykkpåkjenninger mv.</p>
                      <p className="mt-2">Kabler for nødkraftanlegg, styringsanlegg og samband mellom stasjonsinngang og redningsrom skal være forlagt adskilt fra hverandre og adskilt fra andre kabler. Med adskilt menes et lysbuebeskyttende mekanisk skille. Likeverdig med dette godtas "brannsikker" kabel (jf. FEA-F §26).</p>
                      <p className="mt-2">Nedenfor er listet eksempler på sannsynlighet og/eller konsekvensreduserende tiltak:</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li>Ulike kabeltyper bør skilles på forskjellige kabelstiger for å unngå at brann i en kraftkabel skader andre kabler</li>
                        <li>Kabelforlegning i kabelkanaler/kabeltunneler som brukes som rømningsveier og/eller friskluftinntak bør seksjoneres</li>
                      </ul>
                      <p className="mt-2">Unngå å legge viktige kabler nærmest taket da temperaturen ved brann normalt blir høyest der. Hovedregelen ved plassering av ulike kabeltyper på forskjellige kabelstiger over hverandre er at man legger kraftkabler på øverste stige og styre-/kontrollkabler på nederste stige. I kabelkulverter/-kanaler og andre større forlegninger med mange kabelstiger over hverandre, bør man sørge for at man har en avstand på minst 300 mm mellom stigene.</p>
                      <ul className="list-disc pl-4 mt-1">
                        <li>Det legges bare ett lag kraftkabler på hyller og kabelbroer. Mellom kraftkablene bør det dessuten være en avstand på ca. halvparten av kabelens diameter</li>
                        <li>Horisontale avskjerminger med en plate av samme bredde som kabelstigen og plassert like under</li>
                        <li>Store og høye vertikale forlegninger bør seksjoneres. I tillegg må det fokuseres mot god festing</li>
                        <li>Kabelstiger bør kuttes på begge sider av gjennomføringer for å unngå varmegjennomgang og bevegelse gjennom brannskillet</li>
                        <li>Kabler bør føres utenom brannfarlige områder</li>
                        <li>Lange kabelkulverter bør deles opp ved hjelp av brannsikre vegger og brannklassifiserte gjennomføringer. Dersom ventilasjon av rom eller forhold gjør det nødvendig, kan branndører settes i åpen stilling på holdemagnet tilkoblet brannalarmanlegg</li>
                        <li>Kablers brannmotstand kan økes ved å påføre kabler brannhemmende maling</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIE</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Ventilasjonsanlegg – kraftstasjon</td>
                    <td className="border border-gray-400 p-2">I ventilasjonsanlegget skal det ikke benyttes brannspjeld med smeltesikring. Det skal brukes automatiske spjeld som sikrer rask avstengning og hindrer røykspredning før temperaturen er blitt høy.</td>
                    <td className="border border-gray-400 p-2 align-top">RIV</td>
                  </tr>
                </>
              );
            })()}
            {formData.installasjonerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.installasjonerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_7"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_7"]} sectionLabel="3.7 Tekniske installasjoner" />
            )}
          </tbody>
        </table>

        <table className="w-full border-collapse border border-gray-400 text-xs mt-4">
          <tbody>
            {/* 3.8 §11-11 Generelle krav om rømning */}
            <tr id="preview-3-8" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.8 &nbsp;&nbsp; {isBF85 ? <>Rømningsvei – generelle krav (Kap. 30:7) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-11 Generelle krav om rømning og redning)</span></> : "§11-11 Generelle krav om rømning og redning"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelle krav</td>
              <td className="border border-gray-400 p-2">
                <ul className="list-disc pl-4 text-sm space-y-1">
                  <li>Byggverk skal prosjekteres og utføres for rask og sikker rømning og redning.</li>
                  <li>Den tiden som er tilgjengelig for rømning, skal være større enn den tiden som er nødvendig for rømning.</li>
                  <li>Brannceller skal utformes slik at varsling, rømning og redning kan skje på en rask og effektiv måte.</li>
                  <li>Fluktvei fra oppholdssted til utgang fra en branncelle skal være oversiktlig.</li>
                  <li>I den tiden en branncelle eller rømningsvei skal benyttes til rømning, skal det ikke forekomme temperaturer, røykgasskonsentrasjoner eller andre forhold som hindrer rømning.</li>
                  <li>Skilt, symbol og tekst som viser rømningsveier og sikkerhetsutstyr skal kunne leses under rømning.</li>
                </ul>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
            </tr>
            {formData.romningSikkerhet && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-semibold">Beskrivelse av evakueringen</td>
                <td className="border border-gray-400 p-2 italic text-sm" style={{whiteSpace: 'pre-wrap'}}>{formData.romningSikkerhet}</td>
                <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
              </tr>
            )}
            {formData.romningSikkerhetKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.romningSikkerhetKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_8"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_8"]} sectionLabel="3.8 Rømning og redning" />
            )}
            {(() => {
              const erKraftstasjon38 = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjon38) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Arrangement og besøk – kraftstasjon</td>
                  <td className="border border-gray-400 p-2">
                    Ved større besøk fra grupper, skoleelever, konserter eller lignende arrangement i fjellhall/kraftstasjon skal godkjenning fra lokalt brannvesen foreligge før arrangementet avholdes.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">Tiltakshaver/Driftsansvarlig</td>
                </tr>
              );
            })()}


            {/* 3.9 §11-12 Tilrettelegging for rømning */}
            <tr id="preview-3-9" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.9 &nbsp;&nbsp; {isBF85 ? <>Brannalarmanlegg og røykvarsler (Kap. 31–39) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-12 Tiltak for å påvirke rømnings- og redningstider)</span></> : "§11-12 Tilrettelegging for rømning og redning"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            {isBF85 && formData.bf85_16_brannalarmanlegg && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">:16 Brannalarmanlegg</td>
                <td className="border border-gray-400 p-2">
                  Bygningsrådet kan kreve Brannalarmanlegg.
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
            )}
            {isBF85 && formData.bf85_sprinkler_installert && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Sprinkleranlegg</td>
                <td className="border border-gray-400 p-2">
                  Det er installert sprinkleranlegg i bygget. Sprinkleranlegget kan benyttes som kompenserende tiltak for å fravike andre krav i BF85 der forholdene tilsier det.
                </td>
                <td className="border border-gray-400 p-2 align-top">RIV</td>
              </tr>
            )}
            {!isBF85 && formData.tilretteleggingLedd1a && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Automatisk brannslokkeanlegg (RK4)</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">
                    {formData.harFlereRisikoklasser && !formData.skilleSpinkletUsprinklet
                      ? "Hele byggverket skal ha automatisk brannslokkeanlegg da det ikke skilles mellom sprinklet og usprinklet areal med brannseksjonering."
                      : "Byggverk eller del av byggverk i risikoklasse 4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg. Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner."
                    }
                  </p>
                  <ol className="list-decimal ml-4 space-y-1 text-sm">
                    <li>Forskriftens krav til automatisk brannslokkeanlegg i byggverk i risikoklasse 4 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019. I byggverk med både næringsvirksomhet og boliger gjelder følgende:
                      <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                        <li>NS-EN 12845:2015+A1:2019 kan benyttes i arealer avsatt for næring.</li>
                        <li>Arealer avsatt for boligformål sprinklet etter NS-EN 12845:2015 må ha hurtigutløsende (QR–quick response) sprinklere.</li>
                        <li>Arealer avsatt for boligformål og tilhørende rømningsveier definert i NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019 kan prosjekteres og utføres etter denne standarden.</li>
                      </ol>
                    </li>
                    <li>Dersom ulike deler av et byggverk ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.</li>
                  </ol>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIV</td>
              </tr>
            )}
            {!isBF85 && formData.tilretteleggingLedd1b && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Automatisk brannslokkeanlegg (RK6)</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Byggverk i risikoklasse 6 skal ha automatisk brannslokkeanlegg.</p>
                  <ol className="list-decimal ml-4 space-y-1 text-sm">
                    <li>Forskriftens krav til automatisk slokkeanlegg i byggverk i risikoklasse 6 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 12845:2015+A1:2019. Boligsprinkleranlegg i samsvar med NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019 kan benyttes der dette er angitt i tabell NA.2 i standarden.</li>
                    <li>Dersom byggverket også har virksomhet i andre risikoklasser, må deler av byggverket med og uten automatisk sprinkleranlegg være ulike brannseksjoner.</li>
                    <li>Dersom virksomhet i ulike risikoklasser ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.</li>
                  </ol>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIV</td>
              </tr>
            )}
            {!isBF85 && formData.tilretteleggingLedd1c && (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Alternativt tiltak for slokkeanlegg</td>
                <td className="border border-gray-400 p-2">
                  <p>Der det er krav om automatisk brannslokkeanlegg, kan det likevel benyttes andre tiltak som gir tilsvarende sikkerhet ved å hindre, begrense eller kontrollere en brann lokalt der den oppstår.</p>
                  {formData.tilretteleggingLedd1cBeskrivelse && (
                    <p className="mt-2"><strong>Valgt tiltak:</strong> {formData.tilretteleggingLedd1cBeskrivelse}</p>
                  )}
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            )}
            {/* Skille mellom sprinklet og usprinklet areal */}
            {!isBF85 && (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && formData.harFlereRisikoklasser && (() => {
              const alleParts: { label: string; rk: string; etasjer: number }[] = [];
              if (formData.risikoklasse) alleParts.push({ label: `Bygningsdel 1 (${formData.bygningstype || ''}, ${formData.risikoklasse})`, rk: formData.risikoklasse, etasjer: parseInt(formData.etasjer) || 1 });
              bygningsdeler.forEach((d: any, i: number) => {
                if (d.risikoklasse) alleParts.push({ label: `Bygningsdel ${i + 2} (${d.navn || d.bygningstype || ''}, ${d.risikoklasse})`, rk: d.risikoklasse, etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer) || 1 });
              });
              const delerMedKrav = alleParts.filter(p => p.rk === "RK6" || (p.rk === "RK4" && p.etasjer > 3));
              const delerUtenKrav = alleParts.filter(p => !(p.rk === "RK6" || (p.rk === "RK4" && p.etasjer > 3)));
              if (delerMedKrav.length === 0 || delerUtenKrav.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Sprinklet/usprinklet areal</td>
                  <td className="border border-gray-400 p-2">
                    {formData.skilleSpinkletUsprinklet ? (
                      <p>Sprinklet og usprinklet areal skilles med brannseksjonering. Kun bygningsdeler med krav om automatisk slokkeanlegg sprinkles.</p>
                    ) : (
                      <p>Hele byggverket sprinkles da det ikke skilles mellom sprinklet og usprinklet areal med brannseksjonering (jf. VTEK § 11-12).</p>
                    )}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              );
            })()}
            {!isBF85 && (formData.tilretteleggingLedd2a || formData.alarmValg === "brannalarm") && (() => {
              const bt = (formData.bygningstype || "").toLowerCase();
              const erBolig = bt.includes("bolig") || bt.includes("enebolig") || bt.includes("rekkehus") || bt.includes("kjedehus") || bt.includes("leilighet") || formData.risikoklasse === "RK4";
              
              // Bygg opp allParts for å beregne kategori per del
              const allParts39: { label: string; rk: string; etasjer: number }[] = [];
              if (formData.harFlereRisikoklasser && bygningsdeler.length > 0) {
                bygningsdeler.forEach((d: any, i: number) => {
                  if (d.risikoklasse) allParts39.push({
                    label: `Bygningsdel ${i + 1} (${d.navn || d.bygningstype || ''}, ${d.risikoklasse})`,
                    rk: d.risikoklasse,
                    etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer) || 1
                  });
                });
              }
              if (allParts39.length === 0) {
                allParts39.push({ label: '', rk: formData.risikoklasse, etasjer: parseInt(formData.etasjer) || 1 });
              }
              const isMulti39 = allParts39.length > 1;
              
              const beregnKat = (p: typeof allParts39[0]) => {
                if (p.rk === "RK5" || p.rk === "RK6") return 2;
                if ((p.rk === "RK2" || p.rk === "RK3" || p.rk === "RK4") && p.etasjer >= 2) return 2;
                return 1;
              };
              const brannalarmkategori = Math.max(...allParts39.map(beregnKat));
              const harUlikeKat = isMulti39 && new Set(allParts39.map(beregnKat)).size > 1;
              
              return (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Brannalarmanlegg</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.</p>
                  <p className="mb-2">Brannalarmanlegg må prosjekteres og utføres i samsvar med NS 3960:2019 og NS-EN 54-serien.</p>
                  {isMulti39 && harUlikeKat ? (
                    <>
                      {allParts39.map((p, idx) => (
                        <p key={idx} className="mb-1">• {p.label}: Brannalarmkategori {beregnKat(p)} – {beregnKat(p) === 1 ? "Optiske røykdetektorer i rømningsveier og fellesarealer." : "Heldekkende brannalarmanlegg med optiske røykdetektorer i alle områder."}</p>
                      ))}
                      <p className="mb-2 mt-1"><strong>Strengeste krav: Brannalarmkategori {brannalarmkategori}</strong></p>
                    </>
                  ) : (
                    <>
                      <p className="mb-2"><strong>Brannalarmkategori: {brannalarmkategori}</strong></p>
                      <p className="mb-2">{brannalarmkategori === 1
                        ? "Brannalarmkategori 1: Optiske røykdetektorer i rømningsveier og fellesarealer."
                        : "Brannalarmkategori 2: Heldekkende brannalarmanlegg med optiske røykdetektorer i alle områder."}</p>
                    </>
                  )}
                  {erBolig && (
                    <>
                      <p className="mb-1">• Detektorer i leiligheter må dekke kjøkken, stue og sone utenfor soverom. Det må være minst én detektor per etasje.</p>
                      <p className="mb-1">• Akustiske alarmorganer må plasseres slik at alarmstyrken er minst 60 dB i oppholdsrom og soverom når mellomliggende dører er lukket.</p>
                      <p className="mb-1">• Detektorer og akustiske alarmorganer må installeres i trapperom, kjeller og loft.</p>
                      <p className="mb-1">• Manuell melder må installeres i trapperom ved hovedinngang.</p>
                      <p className="mb-1">• Alarmorganer både i leiligheter og i fellesarealer må aktiveres ved alarm utløst i leilighet som ikke er kvittert ut i løpet av 2 minutter, alarm utløst i fellesarealer, eller utløst slokkeanlegg.</p>
                    </>
                  )}
                  {formData.brannalarmParkering && (
                    <p className="mb-1">• Parkeringskjeller/garasje større enn 1 200 m² – skal ha brannalarmanlegg.</p>
                  )}
                  {formData.brannalarmPublikum && (
                    <p className="mb-1">• I byggverk for publikum og arbeidsbygninger må akustiske alarmorganer suppleres med optiske i de deler som er åpent for publikum og fellesarealer i arbeidsbygninger.</p>
                  )}
                  {formData.brannalarmUniversell && (
                    <p className="mb-1">• I byggverk med krav om universell utforming må rom som er universelt utformet ha optiske alarmorganer i tillegg til akustiske. I bad og toalettrom som er universelt utformet må akustiske alarmorganer suppleres med optiske.</p>
                  )}
                  {formData.brannalarmTalevarsling && (
                    <p className="mb-1">• Branncelle over flere plan beregnet for flere enn 1 000 personer må ha talevarslingssanlegg.</p>
                  )}
                  {formData.brannalarmTakterrasse && (
                    <p className="mb-1">• Takterrasse beregnet for personopphold må ha utstyr for varsling av brann.</p>
                  )}
                  <p className="mt-2">Brannalarmanlegg må ha alarmoverføring til nødmeldesentral, alarmstasjon, vaktselskap eller til sted lokalt i byggverket med personell som har ansvar for å iverksette aksjon i henhold til alarmorganisering.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
              );
            })()}
            {!isBF85 && (formData.tilretteleggingLedd2b || formData.alarmValg === "roykvarsler") && (() => {
              const rk = formData.risikoklasse;
              const areal = parseFloat(formData.areal) || 0;
              const bygningstype = (formData.bygningstype || "").toLowerCase();
              
              const erRK2IndustriLager = rk === "RK2" && areal <= 1200 && 
                (bygningstype.includes("industri") || bygningstype.includes("lager") || bygningstype.includes("kraftstasjon"));
              const erRK2Kontor = rk === "RK2" && areal <= 1200 && bygningstype.includes("kontor");
              const erRK4Bolig = rk === "RK4" && 
                (bygningstype.includes("enebolig") || bygningstype.includes("rekkehus") || 
                 bygningstype.includes("kjedehus") || bygningstype.includes("fritidsbolig") ||
                 bygningstype.includes("bolig"));
              const erRK5Liten = rk === "RK5" && areal <= 600;
              
              return (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Røykvarslere</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">I byggverk beregnet for få personer og byggverk av mindre størrelse kan det brukes røykvarslere dersom rømningsforholdene er særlig enkle og oversiktlige.</p>
                  <p className="mb-2">Røykvarslere skal være tilknyttet strømforsyningen og ha batteri som reserveløsning. I branncelle med behov for flere røykvarslere skal varslerne være seriekoblet. I byggverk uten strømforsyning kan det benyttes batteridrevne røykvarslere.</p>
                  {erRK2IndustriLager && (
                    <p className="mb-1">• Industri- og lagerbygninger i RK2 med samlet bruttoareal inntil 1 200 m², og hvor rømningsforholdene er enkle og oversiktlige. Røykvarslere må plasseres i alle rømningsveier, fellesarealer og arealer med arbeidsplasser.</p>
                  )}
                  {erRK2Kontor && (
                    <p className="mb-1">• Kontorbygninger i RK2 med samlet bruttoareal inntil 1 200 m², og hvor rømningsforholdene er enkle og oversiktlige. Røykvarslere må plasseres i alle rømningsveier, fellesarealer og arealer med arbeidsplasser.</p>
                  )}
                  {erRK4Bolig && (
                    <>
                      <p className="mb-1">• Eneboliger, to- til firemannsboliger, rekkehus, kjedehus og fritidsbolig med én boenhet i risikoklasse 4.</p>
                      <p className="mb-1">• Røykvarslerne må dekke områdene kjøkken, stue, sone utenfor soverom og tekniske rom. Det må være minst én røykvarsler per etasje.</p>
                      <p className="mb-1">• Røykvarslere må plasseres slik at alarmstyrken er minst 60 desibel i oppholdsrom og soverom når mellomliggende dører er lukket.</p>
                    </>
                  )}
                  {erRK5Liten && (
                    <p className="mb-1">• Byggverk i RK5 med samlet bruttoareal inntil 600 m², og hvor rømningsveiene er oversiktlige og fører direkte til terreng. Røykvarslere må plasseres i alle rømningsveier og fellesarealer.</p>
                  )}
                  <p className="mt-2">Røykvarslere må oppfylle kravene i NS-EN 14604:2005, eller ha detektor i samsvar med NS-EN 54-7:2018 og lydgiver i samsvar med NS-EN 14604:2005.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
              );
            })()}
            {!isBF85 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Markeringsskilt</td>
                <td className="border border-gray-400 p-2">
                  <p>Alle byggverk må ha markeringsskilt plassert over alle utganger til og i rømningsvei. Unntak kan gjøres for utgang fra boenheter og fra små rom der slike skilt åpenbart er unødvendige.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
            )}
            {!isBF85 && formData.tilretteleggingLedd3 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Ledesystem</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">I byggverk hvor flukt- og rømningsveiene er lange og har retningsendringer eller skal benyttes av mange personer, skal flukt- og rømningsveiene ha god belysning og være merket slik at rømning kan skje på en rask og effektiv måte. Store byggverk, byggverk beregnet for et stort antall personer og byggverk beregnet for virksomhet i risikoklasse 5 og 6 skal ha ledesystem.</p>
                  <ul className="list-disc list-inside space-y-1">
                    {formData.ledesystemLedelinjer && (
                      <li>Ledesystem i fluktveier og rømningsveier må omfatte ledelinjer som oppfattes kontinuerlig, i form av komponenter på gulv eller lavt plasserte på vegg.</li>
                    )}
                    {formData.ledesystemRomningsmerking && (
                      <li>Rømningsmerking må være synlig og lesbar fra alle steder i fluktveien og rømningsveien.</li>
                    )}
                    {formData.ledesystemBoligRomningsveier && (
                      <li>Rømningsveier i store boligbygninger med flere boenheter i mer enn 2 etasjer må ha ledesystem.</li>
                    )}
                    <li>I byggverk der forskriften stiller krav om ledesystem vil dette gjelde rømningsveiene, samt fluktveier i større, uoversiktlige brannceller.</li>
                    {formData.ledesystemKontorSkole && (
                      <li>Kontorbygninger med store kontorlandskap, skoler med store undervisningsbaser og byggverk eller del av byggverk som er offentlig tilgjengelig og ligger under terreng, må ha ledesystem i fluktveier og rømningsveier.</li>
                    )}
                    {formData.ledesystemStoreBrannceller && (
                      <li>
                        I store brannceller der det ikke er spesielt tilrettelagte fluktveier i branncellen fram til rømningsveiene, må det vurderes om hele branncellen må utstyres med ledesystem tilsvarende som for rømningsveiene. Det kan være nødvendig at ledesystemet omfatter automatisk taleinformasjon.
                        {formData.ledesystemStoreBranncellerBeskrivelse && (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ fontWeight: 600, fontSize: '1em', marginBottom: 4 }}>Beskrivelse av aktuelle brannceller:</p>
                            <p style={{ fontStyle: 'italic' }}>{formData.ledesystemStoreBranncellerBeskrivelse}</p>
                          </div>
                        )}
                      </li>
                    )}
                    {formData.ledesystemBKL1Varighet && (
                      <li>Ledesystem i byggverk i brannklasse 1 må fungere i den tiden som er nødvendig for rømning og redning, og i minst 30 minutter etter utløst brannalarm eller bortfall av kunstig belysning (strømbrudd).</li>
                    )}
                    {formData.ledesystemBKL23Varighet && (
                      <li>Ledesystem i byggverk i brannklasse 2 og 3 må fungere i den tiden som er nødvendig for rømning og redning, og i minst 60 minutter etter utløst brannalarm eller bortfall av kunstig belysning (strømbrudd).</li>
                    )}
                  </ul>
                  <p className="mt-2">For prosjektering og utførelse av ledesystem vises til NS 3926-1:2017.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
            )}
            {!isBF85 && formData.tilretteleggingLedd4 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Evakueringsplaner</td>
                <td className="border border-gray-400 p-2">
                  <p>For byggverk i risikoklasse 5 og 6, øvrige byggverk for publikum og for arbeidsbygninger, skal det foreligge evakueringsplaner før byggverket tas i bruk.</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                    <li>Evakueringsplanen må være tilpasset det enkelte byggverk ut fra bruk, virksomhet og enkeltpersoner som har behov for assistanse.</li>
                    <li>En evakueringsplan må blant annet omfatte:
                      <ul className="list-disc ml-5 mt-1 space-y-0.5">
                        <li>Prosedyrer for rapportering av brann og andre situasjoner som krever evakuering.</li>
                        <li>Beskrivelse av hvilke omstendigheter eller situasjoner som krever evakuering.</li>
                        <li>Beskrivelse av kommandolinjer for intern organisasjon.</li>
                        <li>Oppgavebeskrivelser for personer som har en rolle under evakueringen, inklusiv de som skal assistere personer som har behov for hjelp til å komme ut av byggverket.</li>
                        <li>Plan for øvelser. Øvelsene må være realistiske med hensyn til assistert rømning.</li>
                        <li>Rømningsplaner som viser planlagte fluktveier og rømningsveier og utganger, og plassering av slokkeutstyr og manuelle brannmeldere.</li>
                      </ul>
                    </li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">BH/Eier</td>
              </tr>
            )}
            {!isBF85 && formData.tilretteleggingLedd5 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Merking av installasjoner</td>
                <td className="border border-gray-400 p-2">
                  <p>Plasseringen av branntekniske installasjoner som har betydning for rømnings- og redningsinnsatsen skal være tydelig merket{formData.tilretteleggingLedd5EnBruksenhet ? ", med mindre installasjonene bare er beregnet for personer i én bruksenhet og personene må forventes å være godt kjent med plasseringen." : "."}</p>
                  {formData.tilretteleggingLedd5EnBruksenhet && formData.tilretteleggingLedd5EnBruksenhetBeskrivelse && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: '1em', marginBottom: 4 }}>Beskrivelse av forholdet:</p>
                      <p style={{ fontStyle: 'italic' }}>{formData.tilretteleggingLedd5EnBruksenhetBeskrivelse}</p>
                    </div>
                  )}
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {(() => {
              const erKS = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKS || formData.documentType !== "tilstandsvurdering" || formData.regelverk !== "BF85") return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Brannalarmanlegg – kraftstasjon</td>
                  <td className="border border-gray-400 p-2">
                    <p>Det skal være brannalarmanlegg i alle kraftforsyningsanlegg i fjell og under dagen (jf. FOBTOT § 2.1 jf. FEA-F § 25.3). Automatisk brannalarm skal installeres i alle rom i den delen av bygget hvor driftssentralen med tilbehør er installert. Denne skal også varsle eventuell hjemmevakt (jf. Beredskapsforskriften § 6.4, pkt. e).</p>
                    <p className="mt-2">Vedlikehold og periodisk tilstandskontroll av brannalarmanlegg skal utføres av kvalifisert personell (kan ivaretas av egne ansatte som er kvalifisert for dette, for eksempel ved FG-godkjenning eller lignende).</p>
                    <p className="mt-2">Konsekvensreduserende tiltak kan være:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Å montere brannalarmanlegg som varsler både personell som kan befinne seg i stasjonen og vaktpersonell på driftssentralen, samt eventuelt direkte til brannvesen.</li>
                      <li>Å koble brannalarmanlegget mot røyk- og brannspjeld samt dører/luker slik at spredning av røyk og brann unngås (se Ventilasjonsanlegg, kap. 3.7).</li>
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              );
            })()}
            {(() => {
              const erKraftstasjon39 = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjon39) return null;
              const underFjell = !!formData.kraftstasjonUnderFjell;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Nødbelysning – kraftstasjon</td>
                  <td className="border border-gray-400 p-2">
                    {underFjell && (
                      <p>Stasjoner i fjell og under dagen skal ha nødlysanlegg, (jf. FEA-F § 26).</p>
                    )}
                    <p className={underFjell ? "mt-2" : ""}>Kraftstasjoner og andre større stasjoner med høyspenningsanlegg skal være forsynt med nødbelysning som forsynes fra en kilde som er uavhengig av høyspenningsanlegget (nødstrøm), (jf. FEA-F § 25).</p>
                    <p className="mt-2">Nødbelysning basert på kraftforsyning fra sentral batteribank eller aggregat er ikke tilfredsstillende alene. Det anbefales derfor i tillegg å montere nødbelysning bestående av håndlykter med batterier under kontinuerlig ladning, opphengt på sentrale steder. Disse vil også være praktiske ved innsats i anlegget.</p>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              );
            })()}
            {(() => {
              const erKraftstasjonRR = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjonRR) return null;
              const underFjell = !!formData.kraftstasjonUnderFjell;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Redningsrom – kraftstasjon</td>
                  <td className="border border-gray-400 p-2">
                    {underFjell && (
                      <>
                        <p>I kraft-, transformator- og omformerstasjoner i fjell og under dagen hvor det ikke er anordnet minst to uavhengige rømningsveier, skal det være innredet redningsrom. I store kraftstasjoner og/eller når forholdene ligger til rette for det, bør det innredes ett eller flere redningsrom (jf. FEA-F § 26).</p>
                        <p className="mt-2">Redningsrommet må være et reelt alternativ til hovedrømningsvei, det forutsettes derfor at selskapet nøye vurderer plassering og utforming.</p>
                      </>
                    )}
                    <p className={underFjell ? "mt-3 font-semibold" : "font-semibold"}>Plassering</p>
                    <p>Redningsrommene gis en hensiktsmessig og sikker plassering i forhold til mulige skadesteder, og fortrinnsvis slik at det er tilfredsstillende adkomst med skadet personell på båre.</p>
                    <p className="mt-2">Plassering i forhold til transformatorer og koblingsanlegg bør veie tungt i vurderingen ved valg av plassering av redningsrom.</p>
                    <p className="mt-3 font-semibold">Utforming</p>
                    <p>Redningsrom skal være røyktett og egen branncelle, og utformet slik at det er intakt etter en eksplosjon (jf. FEA-F § 26).</p>
                    <p className="mt-2">For å minimere personellets eksponering for røyk og gasser, anbefales det å alltid ha døren til redningsrommet lukket, eventuelt med selvlukkende dør koblet til brannalarmanlegget.</p>
                    <p className="mt-3 font-semibold">Utstyr</p>
                    <p>Redningsrommene (jf. FEA-F § 26) skal være utstyrt med:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Luftbeholdning som dekker minst 4 timers forbruk for det antall personer som rommet er dimensjonert for. Det skal tas hensyn til lokale forhold som lengde på adkomsttunnel, rommets plassering i stasjonen, forventet tid før hjelp når frem mv.</li>
                      <li>Førstehjelpsutstyr og båre.</li>
                      <li>Samband til utenforliggende bemannet vaktsted (f.eks. driftssentral) og til inngangen/portalbygg. Sambandsmidlene skal være uavhengig av stasjonsstrømforsyningen og må være beskyttet mot skade fra brann, overspenning mv.</li>
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              );
            })()}
            {(() => {
              const erKraftstasjonTR = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjonTR) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Transformatorrom – kraftstasjon</td>
                  <td className="border border-gray-400 p-2">
                    <p>Rom med oljefylte transformatorer, slokkespoler og lignende skal være utført med terskel, steinfilter, oljekum eller lignende, slik at oljen ikke kan renne ut av rommet. Rom med mineraloljefylte transformatorer med samlet ytelse over 1600 kVA, skal ha effektivt automatisk brannslokkingsanlegg eller oljegrube eller annen utførelse med samme brannslokkende effekt.</p>
                    <p className="mt-2">Oljegrube utføres med steinfilter med tykkelse min. 400 millimeter. Det bør nyttes renvasket stein med størrelse 60–90 millimeter, fortrinnsvis elvestein. Oljekum og eventuell tilleggstank skal romme hele oljemengden og eventuell slokkevæske. Dette innebærer at det må være kontroll over hvor mye slokkevæske som kan bli benyttet, særlig i automatiske slokkeanlegg. Det anbefales å tilrettelegge for tømming av oljegrube fra sikkert område, for eksempel rør (OBS! ikke plastrør) som føres ut av anlegget til tank/sluk for oppsug til tankbiler. I anlegg i fjell/under dagen kan en mulig løsning være å plassere oppsamlingstank lavt i anlegget, for eksempel i turbinkjelleren. Der hvor flere transformatorer har felles oljegrube, er det tilstrekkelig at volumet dekker den største transformatoren, dersom en brann ikke kan spre seg mellom transformatorene (jf. FEA-F § 25).</p>
                    <p className="mt-2">For å unngå at olje sprer seg utenfor transformatorcellen i tilfeller hvor transformatorkassen sprenges, bør transformatorcellen ha så høy terskel eller andre avgrensninger at rommet over steinfilteret kan oppta minst halvparten av transformatorens oljemengde. Dette er særlig viktig hvor en utblåsing kan skje i retning mot utganger, nødutganger eller steder hvor personer oppholder seg.</p>
                    <p className="mt-2">Dører inn til transformatorcellene og mellom cellene skal minimum være selvlukkende branndører. Der transformatorcellen er adskilt fra resten av anlegget med store porter, bør det monteres dør i porten.</p>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              );
            })()}
            {formData.tilretteleggingKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.tilretteleggingKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_9"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_9"]} sectionLabel="3.9 Tilrettelegging for rømning" />
            )}


            {/* 3.10 §11-13 Utgang fra branncelle */}
            <tr id="preview-3-10" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.10 &nbsp;&nbsp; {isBF85 ? <>Utganger og rømningsveier fra branncelle (Kap. 30:71–73) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-13 Utgang fra branncelle)</span></> : "§11-13 Utgang fra branncelle"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top font-medium">Generelt</td>
              <td className="border border-gray-400 p-2">
                Fra en branncelle skal det minst være én utgang til sikkert sted, eller utganger til to uavhengige rømningsveier, eller én utgang til rømningsvei som har to alternative rømningsretninger som fører videre til uavhengige rømningsveier eller sikre steder.
              </td>
              <td className="border border-gray-400 p-2 align-top">-</td>
            </tr>
            {/* Krav til trapperom - § 11-13 (2) - automatisk basert på RK og etasjer */}
            {(() => {
              const trapperomTypeMap310: Record<number, { lav: string; hoy: string }> = {
                1: { lav: "Tr 1", hoy: "Tr 3" }, 2: { lav: "Tr 1", hoy: "Tr 3" },
                3: { lav: "Tr 2", hoy: "Tr 3" }, 4: { lav: "Tr 1", hoy: "Tr 3" },
                5: { lav: "Tr 2", hoy: "Tr 3" }, 6: { lav: "Tr 2", hoy: "Tr 3" },
              };
              const getTrType310 = (rk: number, etasjer: number) => {
                if (!trapperomTypeMap310[rk]) return "Tr 1";
                return etasjer <= 8 ? trapperomTypeMap310[rk].lav : trapperomTypeMap310[rk].hoy;
              };
              const trRank: Record<string, number> = { "Tr 3": 3, "Tr 2": 2, "Tr 1": 1 };

              // Build per-building-part entries
              const trapperomDeler: { index: number; navn: string; rk: number; etasjer: number; trType: string }[] = [];
              const rk1 = parseInt((formData.risikoklasse || "").replace(/\D/g, ''), 10);
              const fl1 = parseInt(formData.etasjer || "0", 10);
              if (rk1 && fl1 >= 1) trapperomDeler.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', rk: rk1, etasjer: fl1, trType: getTrType310(rk1, fl1) });
              if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                formData.bygningsdeler.forEach((del: any, i: number) => {
                  const rkDel = parseInt((del.risikoklasse || "").replace(/\D/g, ''), 10);
                  const flDel = parseInt(del.etasjer || formData.etasjer || "0", 10);
                  if (rkDel && flDel >= 1) trapperomDeler.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, rk: rkDel, etasjer: flDel, trType: getTrType310(rkDel, flDel) });
                });
              }

              if (trapperomDeler.length === 0) return null;
              const showMultiple = trapperomDeler.length > 1;
              const uniqueTrTypes = [...new Set(trapperomDeler.map(d => d.trType))];
              const harUlikeTrKrav = uniqueTrTypes.length > 1;
              const strengesteTr = trapperomDeler.reduce((prev, curr) => (trRank[curr.trType] || 0) > (trRank[prev] || 0) ? curr.trType : prev, "Tr 1");
              const brukStrengestePgaGjennomgang = showMultiple && harUlikeTrKrav && formData.trapperomGarGjennomAlleDeler;

              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Trapperom<br/><span className="text-xs text-muted-foreground">§ 11-13 (2)</span></td>
                  <td className="border border-gray-400 p-2">
                    <ul className="list-disc ml-4 space-y-1">
                      {brukStrengestePgaGjennomgang ? (
                        <>
                          <li className="font-medium">
                            Trapperommene går gjennom flere bygningsdeler med ulike krav. Strengeste krav gjelder: {strengesteTr}.
                          </li>
                          {trapperomDeler.some(d => d.rk === 4) && (
                            <li style={{whiteSpace: 'pre-wrap'}}>
                              {formData.rk4TrapperomTekst || (formData.brannvesenTilgangRK4 !== false 
                                ? `Det er tilstrekkelig med ett trapperom da brannvesenet har tilkomst til hver boenhet med høydemateriell.`
                                : `Brannvesenet har ikke tilkomst til alle boenheter med høydemateriell. Byggverket må derfor ha minst to trapperom med separat atkomst fra alle tilknyttede brannceller.`)}
                            </li>
                          )}
                          {formData.tilstrekkeligeUtgangerUtenToTrapperom && !trapperomDeler.every(d => d.rk === 4) && (
                            <li>Det er bekreftet at utgangene er tilstrekkelige uten krav om to trapperom, da deler av bygget har direkte tilgang til det fri.</li>
                          )}
                          {!formData.tilstrekkeligeUtgangerUtenToTrapperom && !trapperomDeler.every(d => d.rk === 4) && (
                            <li>Byggverk må ha minst to trapperom av type {strengesteTr}.</li>
                          )}
                        </>
                      ) : (
                        <>
                          {trapperomDeler.map((del) => {
                            const isRK4 = del.rk === 4;
                            if (isRK4) {
                              return (
                                <li key={del.index} style={{whiteSpace: 'pre-wrap'}}>
                                  {showMultiple && <span className="font-medium">Bygningsdel {del.index} ({del.navn}): </span>}
                                  {formData.rk4TrapperomTekst || (formData.brannvesenTilgangRK4 !== false 
                                    ? `For risikoklasse ${del.rk} med ${del.etasjer} etasjer kreves ${del.trType}. Det er tilstrekkelig med ett trapperom da brannvesenet har tilkomst til hver boenhet med høydemateriell.`
                                    : `For risikoklasse ${del.rk} med ${del.etasjer} etasjer kreves ${del.trType}. Brannvesenet har ikke tilkomst til alle boenheter med høydemateriell. Byggverket må derfor ha minst to trapperom med separat atkomst fra alle tilknyttede brannceller.`)}
                                </li>
                              );
                            }
                            if (formData.tilstrekkeligeUtgangerUtenToTrapperom) {
                              return (
                                <li key={del.index}>
                                  {showMultiple && <span className="font-medium">Bygningsdel {del.index} ({del.navn}): </span>}
                                  For risikoklasse {del.rk} med {del.etasjer} etasjer kreves {del.trType}. Det er bekreftet at utgangene er tilstrekkelige uten krav om to trapperom, da deler av bygget har direkte tilgang til det fri.
                                </li>
                              );
                            }
                            return (
                              <li key={del.index}>
                                {showMultiple && <span className="font-medium">Bygningsdel {del.index} ({del.navn}): </span>}
                                Byggverk må ha minst to trapperom. For risikoklasse {del.rk} med {del.etasjer} etasjer kreves {del.trType}.
                              </li>
                            );
                          })}
                          {trapperomDeler.some(d => d.rk === 2) && !formData.tilstrekkeligeUtgangerUtenToTrapperom && (
                            <li>Unntak gjelder parkeringshus og garasje i risikoklasse 2 med inntil 8 etasjer, som må ha minst to trapperom Tr 2 dersom det ikke er utgang fra hver etasje til sikkert sted.</li>
                          )}
                          {trapperomDeler.some(d => (d.rk === 1 || d.rk === 2) && d.etasjer <= 8) && !formData.tilstrekkeligeUtgangerUtenToTrapperom && (
                            <li>I byggverk med to trapperom Tr 1 må trappene være uavhengige av hverandre. Det må være separat atkomst til hvert av trapperommene fra alle de tilknyttede branncellene.</li>
                          )}
                        </>
                      )}
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* RK6 - maks 7m avstand § 11-13 (4) */}
            {(() => {
              const rk = formData.risikoklasse || "";
              const harRK6 = rk === "RK6" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK6");
              if (!harRK6) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Avstand til trapperom/utgang<br/><span className="text-xs text-muted-foreground">§ 11-13 (4)</span></td>
                  <td className="border border-gray-400 p-2">
                    I byggverk i risikoklasse 6 må dører fra branncelle ligge mellom trapperommene eller utgangene. Unntak gjelder når avstand til nærmeste trapperom eller utgang er mindre enn 7,0 meter.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {/* Takterrasse - § 11-13 (5) */}
            {formData.takterrasseRelevant && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Takterrasse<br/><span className="text-xs text-muted-foreground">§ 11-13 (5)</span></td>
                <td className="border border-gray-400 p-2">
                  Takterrasse beregnet for personopphold må ha utganger minst tilsvarende brannceller i byggverket. Utgangene må ha tilstrekkelig bredde for det dimensjonerende persontallet.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Boenhet kun ett trapperom - §11-13 (2) */}
            {formData.boenhetKunEttTrapperom && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Utgang fra branncelle (leiligheter)</td>
                <td className="border border-gray-400 p-2">
                  Brannceller i byggverk i risikoklasse 4 med inntil 8 etasjer kan ha utgang til ett trapperom utført som rømningsvei. Dette forutsetter at hver boenhet har minst ett vindu eller balkong som er tilgjengelig for rednings- og slokkeinnsats, jf. § 11–17.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Brannceller over flere etasjer */}
            {formData.branncelleFlereEtasjer && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Branncelle over flere etasjer</td>
                <td className="border border-gray-400 p-2">
                  Brannceller som strekker seg over flere etasjer eller har mellometasje skal ha utganger som sikrer rømning fra alle plan.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Lavt byggverk - én rømningsretning §11-13(4) */}
            {formData.lavtByggverkEnRomningsretning && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Én rømningsretning (lavt byggverk)</td>
                <td className="border border-gray-400 p-2">
                  I lave byggverk beregnet for virksomhet i risikoklasse 1, 2, 3 og 4 kan utgangen fra branncelle enten føre til sikkert sted, eller til rømningsvei som bare har én rømningsretning, forutsatt at hver branncelle har vinduer som er utformet og tilrettelagt for sikker rømning.
                  <p className="mt-2 text-xs italic">Preaksepterte ytelser angitt for rømningsvindu under tredje ledd, må være oppfylt.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Lavt byggverk med vinduer for rømning */}
            {formData.lavtByggverkVinduerRomning && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Vinduer for rømning</td>
                <td className="border border-gray-400 p-2">
                  Lavt byggverk (RK 1–4) med vinduer som sikrer rømning. Vindu kan benyttes som alternativ rømningsvei i etasjer med gulv inntil 5,0 m over planert terreng.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            
            {/* Rømningsvindu - § 11-13 (3) */}
            {formData.romningsvinduRelevant && (() => {
              const alleRK = formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0
                ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                : formData.risikoklasse ? [formData.risikoklasse] : [];
              const kunRK1234 = alleRK.length > 0 && alleRK.every((rk: string) => ["RK1","RK2","RK3","RK4"].includes(rk));
              if (!kunRK1234) return null;
              const harRK124 = alleRK.some((rk: string) => ["RK1","RK2","RK4"].includes(rk));
              const harRK3 = alleRK.includes("RK3");
              const harRK123 = alleRK.some((rk: string) => ["RK1","RK2","RK3"].includes(rk));
              const harRK4 = alleRK.includes("RK4");
              const erBolig = harRK4;
              return (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Rømningsvindu<br/><span className="text-xs text-muted-foreground">§ 11-13 (3)</span></td>
                <td className="border border-gray-400 p-2">
                  <div className="space-y-2">
                    <p>Brannceller som består av flere etasjer, eller har mellometasje, skal ha minst én utgang fra hver etasje. I byggverk i risikoklasse {alleRK.map((rk: string) => rk.replace("RK","")).join(", ")} kan utgangen fra disse planene, utenom inngangsplanet, være vindu som er tilrettelagt for sikker rømning.</p>
                    <ul className="list-disc ml-4 space-y-1">
                      {harRK124 && (
                        <li>I byggverk i risikoklasse {["RK1","RK2","RK4"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")} kan utgangen være rømningsvindu som har underkant til og med 5,0 meter over planert terreng, eller til og med 7,5 meter over planert terreng dersom det er atkomst til fastmontert stige med ryggbøyler. Ved større høyder må det være atkomst fra rømningsvindu til utvendig trapp. Stige eller trapp må ha avstand minimum 2,0 meter fra vindu, eller være skjermet mot flammer og strålevarme.</li>
                      )}
                      {harRK3 && (
                        <li>I byggverk i risikoklasse 3 kan utgangen være rømningsvindu som har underkant til og med 2,0 meter over terreng. Ved større høyder må det være atkomst fra rømningsvindu til utvendig trapp. Trappen må ha avstand minimum 2,0 meter fra vindu, eller være skjermet mot flammer og strålevarme.</li>
                      )}
                      {harRK123 && (
                        <li>I risikoklasse {["RK1","RK2","RK3"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")} må etasjer som er beregnet for 15 personer eller mindre, ha minst ett rømningsvindu. Etasjer som er beregnet for mer enn 15 personer, må ha ett ekstra rømningsvindu per 15 personer. Vinduene må være hensiktsmessig fordelt i etasjen. Avstanden til nærmeste rømningsvindu må ikke være større enn angitt i tabell 1.</li>
                      )}
                      {harRK4 && (
                        <li>I risikoklasse 4 må minst annethvert rom for varig opphold ha rømningsvindu.</li>
                      )}
                      {harRK123 && (
                        <li>Fra mellometasje beregnet for maksimum ti personer i byggverk i risikoklasse {["RK1","RK2","RK3"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")}, kan utgangen være interntrapp til underliggende plan.</li>
                      )}
                      <li>Rømningsvindu må ha høyde 0,6 meter og bredde minimum 0,5 meter. Summen av høyde og bredde må være minimum 1,5 meter, jf. figur 5. Svingvinduer med dreieakse, må ha tilsvarende effektiv åpning.</li>
                      <li>Avstanden fra gulv til underkant av vindusåpningen må være maksimalt 1,0 meter med mindre det er truffet tiltak for å lette rømning.</li>
                      <li>Rømningsvindu må være lett å åpne uten bruk av spesialverktøy og må være hengslet slik at det er lett å komme ut av vinduet.</li>
                      {!erBolig && (
                        <li>Rømningsvindu, unntatt i boenheter, må ha markeringsskilt.</li>
                      )}
                      <li>Rømningsvindu må være tilgjengelig for brannvesenets høyderedskap. {(harRK123 || erBolig) && <>I etasjer beregnet for inntil 15 personer, og i boenheter, er det tilstrekkelig at ett rømningsvindu er tilgjengelig for brannvesenets høyderedskap.</>}</li>
                      <li>Utgang til balkong anses likeverdig med rømningsvindu når tilhørende ytelser for å lette rømning er oppfylt.</li>
                      {harRK4 && (
                        <li>Forskriftens krav til automatisk slokkeanlegg i byggverk i risikoklasse 4 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med § 11-12 første ledd bokstav a.</li>
                      )}
                    </ul>
                    {formData.romningsvinduHoyde && (
                      <p className="mt-2"><strong>Høyde over terreng (underkant vindu):</strong> {
                        formData.romningsvinduHoyde === "2.0" ? "≤ 2,0 meter" :
                        formData.romningsvinduHoyde === "5.0" ? "≤ 5,0 meter" :
                        formData.romningsvinduHoyde === "7.5" ? "≤ 7,5 meter (med fastmontert stige med ryggbøyler)" :
                        formData.romningsvinduHoyde === "over_7.5" ? "Over 7,5 meter (krever atkomst til utvendig trapp)" :
                        formData.romningsvinduHoyde + " m"
                      }</p>
                    )}
                    {(formData.romningsvinduHarStige || formData.romningsvinduHarBalkong) && (
                      <div className="mt-1">
                        <ul className="list-disc ml-4">
                          {formData.romningsvinduHarStige && <li>Fastmontert stige med ryggbøyler er montert til rømningsvindu.</li>}
                          {formData.romningsvinduHarBalkong && <li>Utgang til balkong er tilgjengelig som alternativ rømningsvei.</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              );
            })()}
            {/* Stort antall personer */}
            {formData.branncelleStortAntallPersoner && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Branncelle for stort antall personer</td>
                <td className="border border-gray-400 p-2">
                  <div className="space-y-2">
                    <p>Branncelle beregnet for stort antall personer.</p>
                    {formData.persontallAreal && formData.persontallKategori && (() => {
                      const arealPerPerson: Record<string, number> = {
                        salgslokaler: 2, kontor: 15, skoler: 2, barnehager: 4, forsamlingslokaler: 0.6, spisesaler: 1.4
                      };
                      const kategoriLabel: Record<string, string> = {
                        salgslokaler: "Salgslokaler", kontor: "Kontor", skoler: "Skoler", barnehager: "Barnehager/fritidshjem", forsamlingslokaler: "Forsamlingslokaler", spisesaler: "Spisesaler"
                      };
                      const areal = parseFloat(formData.persontallAreal) || 0;
                      const factor = arealPerPerson[formData.persontallKategori] || 1;
                      const persontall = Math.floor(areal / factor);
                      return <p><strong>Beregnet persontall:</strong> {persontall} personer – kategori: {kategoriLabel[formData.persontallKategori] || formData.persontallKategori} ({areal} m² / {factor} m²/pers)</p>;
                    })()}
                    <ul className="list-disc ml-4 space-y-1 mt-2">
                      <li>Antall personer i en branncelle uten faste sitteplasser bestemmes av tabell 3.{formData.persontallKategori === 'salgslokaler' && <> I salgslokale legges alle de områder som er tilgjengelig for publikum til grunn for dimensjonering av fri bredde. Det gjøres ikke fradrag for inventar.</>}</li>
                      <li>Samlet fri bredde i utgangene bestemmes ut fra det antall personer branncellen er beregnet for. Dessuten gjelder:
                        <ul className="list-disc ml-8 mt-1 space-y-1">
                          <li>Utgangene må være hensiktsmessig fordelt i lokalet.</li>
                          <li>For dimensjoneringen av fri bredde benyttes 1 cm per person.</li>
                        </ul>
                      </li>
                      {formData.stortAntallUnder600 && (
                        <li>Brannceller må ha minst én utgang per 300 personer.</li>
                      )}
                      {formData.stortAntallOver600 && (
                        <li>Brannceller beregnet for inntil 600 personer må ha minst to utganger. Med mindre utgangene fører til sikkert sted, må de fordeles på minst to uavhengige rømningsveier eller på ulike deler av rømningsvei som er skilt med bygningsdel og dør minst klasse E 30-CS<sub>a</sub> [F 30S].</li>
                      )}
                      {formData.stortAntallUnder150 && (
                        <li>Brannceller beregnet for mindre enn 150 personer kan ha bare én utgang dersom denne går til sikkert sted.</li>
                      )}
                      {formData.stortAntallFlereEtasjer && (
                        <li>Branncelle som har åpen forbindelse over flere etasjer, eller har mellometasje, må ha tilsvarende antall utganger fra hver etasje. Interntrapp kan anses likeverdig med en utgang. Det skal likevel være minst én utgang til rømningsvei eller sikkert sted fra hver etasje, jf. tredje ledd.</li>
                      )}
                    </ul>
                  </div>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Sporadisk personopphold §11-13(6) */}
            {formData.sporadiskOpphold && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Branncelle for sporadisk personopphold</td>
                <td className="border border-gray-400 p-2">
                  <p>Fra brannceller som bare er beregnet for sporadisk personopphold kan utgang gå gjennom annen branncelle.</p>
                  <p className="mt-2">Med branncelle som bare er beregnet for sporadisk opphold, menes branncelle der personer oppholder seg av og til i kortere tid. Dette kan for eksempel være lagerrom og tekniske rom uten faste arbeidsplasser.</p>
                  <p className="mt-2">Maksimal avstand fra et hvilket som helst sted i denne branncellen til sikkert sted eller til nærmeste rømningsvei, må være som angitt i tabell 1.</p>
                  <p className="mt-2">For å ivareta generelle krav om tilrettelegging for rask og sikker rømning, jf. § 11-11, må fluktveien være oversiktlig og ha god belysning og merking. Det må heller ikke foregå brannfarlig aktivitet i nabobranncellen det skal rømmes gjennom.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Dør-krav til rømningsvei - alltid vist */}
            {(() => {
              const alleRK = formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0
                ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                : formData.risikoklasse ? [formData.risikoklasse] : [];
              const harRK3 = alleRK.includes("RK3");
              const harRK5 = alleRK.includes("RK5");
              const harRK6 = alleRK.includes("RK6");
              
              const bk = formData.brannklasse || "";
              const erBKL1 = bk === "BKL1";
              const erBKL2ellerBKL3 = bk === "BKL2" || bk === "BKL3";
              const strømTid = erBKL1 ? "30 minutter" : erBKL2ellerBKL3 ? "60 minutter" : null;
              const strømBKL = erBKL1 ? "brannklasse 1" : erBKL2ellerBKL3 ? "brannklasse 2 og 3" : null;

              // Bredde basert på risikoklasse – dører følger samme krav som fri bredde i rømningsvei
              // RK6 bolig har unntak: 0,86 m (som RK1/2/4)
              const erRK6Bolig = harRK6 && formData.erRKL6Boligbygning;
              const erBredDørRK = harRK3 || harRK5 || (harRK6 && !erRK6Bolig);
              const smalRKer = alleRK.filter((rk: string) => {
                if (rk === "RK6") return erRK6Bolig;
                return ["RK1", "RK2", "RK4"].includes(rk);
              });
              const bredeRKer = alleRK.filter((rk: string) => {
                if (rk === "RK6") return !erRK6Bolig;
                return ["RK3", "RK5"].includes(rk);
              });
              
              let breddeTekst = "";
              if (smalRKer.length > 0 && bredeRKer.length > 0) {
                breddeTekst = `I byggverk i risikoklasse ${smalRKer.map(r => r.replace("RK", "")).join(", ")} må fri bredde på dør til rømningsvei være minimum 0,86 meter. I byggverk i risikoklasse ${bredeRKer.map(r => r.replace("RK", "")).join(", ")} må fri bredde på dør til rømningsvei være minimum 1,16 meter.`;
              } else if (bredeRKer.length > 0) {
                breddeTekst = `I byggverk i risikoklasse ${bredeRKer.map(r => r.replace("RK", "")).join(", ")} må fri bredde på dør til rømningsvei være minimum 1,16 meter.`;
              } else {
                breddeTekst = `I byggverk i risikoklasse ${smalRKer.map(r => r.replace("RK", "")).join(", ")} må fri bredde på dør til rømningsvei være minimum 0,86 meter.`;
              }

              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Dører til rømningsvei</td>
                  <td className="border border-gray-400 p-2">
                    <ul className="list-disc ml-4 space-y-1">
                       <li>Dører som er beregnet for manuell åpning til og i atkomst- og rømningsveier, skal kunne åpnes med åpningskraft på maksimum {formData.universellUtforming ? "30 N" : "67 N"}.</li>
                      <li>{breddeTekst}</li>
                      {(harRK6) && <li>I byggverk hvor det er nødvendig med transport i seng, må dørbredden tilpasses dette.</li>}
                      <li>Samlet fri bredde på dører fra branncelle til rømningsvei bestemmes ut fra det antall personer som branncellen er beregnet for, jf. femte ledd.</li>
                      <li>Dør til rømningsvei må ha fri høyde på minimum 2,0 meter. Unntak gjelder for fritidsbolig med én boenhet.</li>
                      <li>Dør til rømningsvei må lett kunne åpnes slik at den er enkel å bruke for alle personer.</li>
                       <li>Selvlukkende dør, benevnt C [S], kan settes i åpen stilling ved hjelp av elektromagnetiske holdere som utløses og lukker døren ved brannalarm. Døren må kunne åpnes igjen med dørautomatikk eller manuelt med åpningskraft i samsvar med § 12-13.</li>
                       {(() => {
                         if (!formData.universellUtforming) return null;
                         const bt = (formData.bygningstype || "").toLowerCase();
                         const erBolig = bt.includes("bolig") || bt.includes("enebolig") || bt.includes("rekkehus") || bt.includes("kjedehus") || bt.includes("leilighet") || (formData.risikoklasse === "RK4");
                         if (!erBolig) return <li>Alle selvlukkende dører til og i rømningsvei skal ha dørautomatikk for å sikre at åpningskraften ikke overstiger 30 N.</li>;
                         return null;
                       })()}
                      {formData.dorerTilbakerømning && <li>Dør til rømningsvei må ha et låsesystem som gjør det mulig å vende tilbake dersom rømningsveien skulle være blokkert, med mindre andre tiltak gir tilsvarende sikkerhet.</li>}
                      <li>Dør til rømningsvei kan være låst når byggverket har brannalarmanlegg og låsesystemet åpnes automatisk ved alarm. I tillegg må det være tydelig merket knapp for manuell åpning av døren. Det kan aksepteres inntil 10 sekunder tidsforsinkelse på den manuelle åpningsmekanismen.</li>
                      {formData.dorerNattlaser && <li>Nattlåser må utføres slik at de ikke kommer i strid med kravene til sikker rømning.</li>}
                      {(() => {
                        const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                          || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                        if (erKraftstasjon) {
                          return <li>For kraftstasjon: alle dører til og i rømningsvei skal slå ut i rømningsretning.</li>;
                        }
                        return formData.dorerLiteAntallPersoner ? <li>Dør til rømningsvei fra branncelle beregnet for et lite antall personer kan slå mot rømningsretning. Med et lite antall personer menes inntil 10. Brannceller med et lite antall personer kan for eksempel være boenhet, sykerom, hotellrom, og mindre kontorlokaler og salgslokaler.</li> : null;
                      })()}
                      <li>Utadslående dør i yttervegg som er utgang eller rømningsvei, må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.</li>
                      {strømTid && <li>Avbruddsfri strømforsyning må fungere i minst {strømTid} i byggverk i {strømBKL}.</li>}
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK / RIE</td>
                </tr>
              );
            })()}
            {(() => {
              const erKraftstasjon310 = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!erKraftstasjon310) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Kraftstasjon – utganger fra rom med høyspentanlegg</td>
                  <td className="border border-gray-400 p-2">
                    <p>Inneholder rommet både mineraloljefylte apparater og betjeningsorganer for høyspenning, kreves det utgangsmulighet som beskrevet ovenfor fra begge ender av rommet (vanligvis endene av betjeningsgangen).</p>
                    <p className="mt-2">Det kreves bare én utgang hvis avstanden fra ethvert av betjeningsorganene til utgangen har en samlet lengde på maks 4 m. I den samlede lengde skal kun medregnes de deler av gangen hvor den frie gangbredden ut for felt med mineraloljefylte apparater er mindre enn 2 m.</p>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK / RIE</td>
                </tr>
              );
            })()}
            {formData.utgangBranncelle && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Utganger</td>
                <td className="border border-gray-400 p-2">{formData.utgangBranncelle}</td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.utgangBranncelleKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.utgangBranncelleKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_10"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_10"]} sectionLabel="3.10 Utgang fra branncelle" />
            )}
            {/* Maksimal lengde på fluktvei */}
            {(() => {
              const rk = formData.risikoklasse || "";
              const rkNum = parseInt(rk.replace(/\D/g, ''), 10);
              const harFlereRK = formData.bygningsdeler && formData.bygningsdeler.length > 0;
              
              const getLengde = (rkVal: number) => {
                if (rkVal === 1 || rkVal === 2) return 50;
                if (rkVal === 3 || rkVal === 5) return 30;
                if (rkVal === 6) return 25;
                return null;
              };

              if (harFlereRK) {
                const alleRK = [rkNum, ...(formData.bygningsdeler || []).map((d: any) => parseInt((d.risikoklasse || "").replace(/\D/g, ''), 10))].filter(Boolean);
                const unikeRK = [...new Set(alleRK)];
                const lengder = unikeRK.map(r => ({ rk: r, lengde: getLengde(r) })).filter(l => l.lengde !== null);
                if (lengder.length === 0) return null;
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Maksimal lengde på fluktvei</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">

                        {lengder.map((l, i) => (
                          <li key={i}>Risikoklasse {l.rk}: Maksimal lengde på fluktvei er {l.lengde} meter.</li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                );
              }

              const lengde = getLengde(rkNum);
              if (!lengde) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Maksimal lengde på fluktvei</td>
                  <td className="border border-gray-400 p-2">
                    Maksimal lengde på fluktvei er {lengde} meter for byggverk i risikoklasse {rkNum}.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}

            {/* 3.11 §11-14 Rømningsvei */}
            <tr id="preview-3-11" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.11 &nbsp;&nbsp; {isBF85 ? <>Trapperom og heissjakt (Kap. 30:7/30:41) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-14 Rømningsvei)</span></> : "§11-14 Rømningsvei"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top font-medium">Generelt</td>
              <td className="border border-gray-400 p-2">
                Rømningsvei skal på en oversiktlig og lettfattelig måte føre til et sikkert sted. Den skal ha tilstrekkelig bredde og høyde og være utført som egen branncelle tilrettelagt for rask og effektiv rømning.
              </td>
              <td className="border border-gray-400 p-2 align-top">-</td>
            </tr>
            {formData.romningsveiRomMaks20 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Rom i rømningsvei inntil 20 m²</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Rom for resepsjon, vaktrom og lignende med areal inntil 20 m² kan ligge i rømningsvei, forutsatt at rommet ikke reduserer fri bredde eller hindrer fri rømning.</li>
                    <li>Rommet må ikke inneholde brennbart materiale utover vanlig møblering.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.romningsveiRom50E30 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Oppholdsrom inntil 50 m²</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Oppholdsrom med areal inntil 50 m² kan ha åpning mot rømningsvei når rommet har automatisk slokkeanlegg og åpningen kan lukkes med dør med brannmotstand minimum E 30.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {(() => {
              const tv: string[] = Array.isArray(formData.romningsveiTrappeValg) ? formData.romningsveiTrappeValg : (formData.romningsveiTrappeValg ? [formData.romningsveiTrappeValg] : []);
              return (<>
                {tv.includes("en_trapp") && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Én trapp</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">
                        <li>For boligbygninger kan det være tilstrekkelig med én trapp der brannvesenet utgjør sekundær rømningsvei.</li>
                        <li>Gangavstand fra dør i branncelle til nærmeste trapperom eller utgang skal ikke overstige 15 m.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                )}
                {tv.includes("sammenfallende") && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Sammenfallende rømningsretning</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Gangavstand i sammenfallende rømningsretning fra dør i branncelle til det punkt hvor rømning kan skje i to uavhengige retninger, skal ikke overstige 15 m.</li>
                        <li>Fra dette punktet skal gangavstand til nærmeste trapperom eller utgang til det fri ikke overstige 30 m.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                )}
                {tv.includes("flere_trapper") && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Flere trapper og utganger</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Bygget har flere trapperom og utganger slik at rømning kan skje i minst to uavhengige retninger.</li>
                        <li>Gangavstand fra dør i branncelle til nærmeste trapperom eller utgang til det fri skal ikke overstige 30 m.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                )}
              </>);
            })()}
            {(() => {
              const rk = formData.risikoklasse || "";
              const harRK3 = rk === "RK3" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK3");
              const harRK5 = rk === "RK5" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK5");
              const harRK6 = rk === "RK6" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK6");
              const erRK6Bolig = harRK6 && formData.erRKL6Boligbygning;
              const erBredRK = harRK3 || harRK5 || (harRK6 && !erRK6Bolig);
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Fri bredde i rømningsvei</td>
                  <td className="border border-gray-400 p-2">
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Samlet fri bredde i rømningsvei må minimum være 1 cm per person, men uansett minst som angitt nedenfor. For dimensjonerende persontall vises til § 11-13 Tabell 3.</li>
                      {erBredRK ? (
                        <li>I byggverk i risikoklasse {[harRK3 && "3", harRK5 && "5", (harRK6 && !erRK6Bolig) && "6"].filter(Boolean).join(", ")} må fri bredde i rømningsvei være minimum 1,16 meter.{erRK6Bolig ? " Unntak gjelder boliger i risikoklasse 6 i samsvar med § 11-2 Tabell 1, hvor fri bredde kan være minimum 0,86 meter." : ""}</li>
                      ) : (
                        <li>I byggverk i risikoklasse {["1", "2", "4", erRK6Bolig && "6"].filter(Boolean).join(", ")} må fri bredde i rømningsvei være minimum 0,86 meter.</li>
                      )}
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {formData.romningsveiSengeliggende && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Transport av sengeliggende</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>I byggverk hvor det er nødvendig med transport av sengeliggende personer, må bredden av rømningsveien tilpasses dette.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.romningsveiSamtidigRomning && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Samtidig rømning fra flere etasjer</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>I byggverk med flere etasjer må rømningsveiene dimensjoneres for samtidig rømning fra to etasjer. Det må dimensjoneres for de to etasjene som ligger over hverandre og til sammen har det største persontallet. Persontallet settes lik det største antallet personer som branncellen er beregnet for.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {(() => {
              const rk = formData.risikoklasse || "";
              const harBredRK = rk === "RK3" || rk === "RK5" || rk === "RK6" || formData.bygningsdeler?.some((d: any) => ["RK3","RK5","RK6"].includes(d.risikoklasse));
              const breddeKrav = harBredRK ? "1,16 m" : "0,86 m";
              return (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Ingen innsnevring</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Rømningsvei må ikke ha innsnevring. Rekkverk, håndløper mv. i rømningsvei kan stikke inntil 10 cm ut fra vegg uten at den frie bredden må økes.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top font-medium">Fri bredde i trapp</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Fri bredde i trapp skal være minimum {breddeKrav}, tilsvarende kravet til fri bredde i rømningsvei.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                </>
              );
            })()}



            {formData.romningsveiSvalgang && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Svalganger og altanganger som rømningsvei</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Svalgang er en utvendig atkomstvei over bakkeplan langs fasade som er overbygd eller inntrukket. Dersom atkomstveien ikke er overbygd (øverste etasje) kalles den altangang. Svalgang og altangang kan være rømningsvei eller del av rømningsvei dersom følgende ytelser er oppfylt:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Med mindre branncellene også har direkte utgang til sikkert sted, må svalgang og altangang utføres slik at de tilfredsstiller forutsetningene om to uavhengige rømningsveier. Svalgang og altangang må derfor ha minst to trapper til terreng, en i hver ende. Avstanden mellom trappene må ikke være over 60 meter.</li>
                    <li>Svalgang som er lengre enn 30 meter må oppdeles med branncellebegrensende bygningsdeler med innbyrdes avstand på maksimum 30 meter for å begrense den horisontale brannspredningen.</li>
                    <li>I byggverk i brannklasse 1 hvor det er tilrettelagt for bruk av vindu som rømningsvei, er det tilstrekkelig med én trapp. Dette gjelder under forutsetning av at avstanden fra dør i branncelle til trappen er maksimalt 15 meter, og at det ikke må rømmes forbi uklassifisert vindu i annen branncelle.</li>
                    <li>Svalgangen må være mest mulig åpen slik at røyk- og branngasser kan unnslippe. Om den åpne delen er 50 prosent av den totale «veggflaten», antas dette å være tilfredsstillende. Det er den øverste delen av veggflatene som må være åpen. Åpning i rekkverk er ikke å anse som åpent areal.</li>
                    <li>Gulvet i svalgang og altangang må være utført som branncellebegrensende konstruksjon med overflate D<sub>fl</sub>-s1 (G). Kledning på vegg og tak må være som for rømningsvei. Overflaten kan være B-s3,d0 (Ut 1). I byggverk med mer enn to etasjer må rekkverk og øvrige konstruksjoner bestå av ubrennbare eller begrenset brennbare materialer, det vil si klasse A2-s1,d0.</li>
                    <li>Svalgang og altangang må være minimum 1,20 meter bred for at den skal fungere som flammeskjerm.</li>
                    <li>Dekke og takutstikk over svalgang må utføres horisontalt og tett (mot for eksempel oppforet tak eller kaldt loft) slik at røyk- og branngasser kan slippe uhindret ut til det fri.</li>
                    <li>Trappene må være beskyttet mot strålevarme fra en eventuell brann i byggverket. Derfor må enten trapperomveggene som vender mot byggverket eller byggverkets yttervegg mot trappen og 5,0 meter til hver side for denne, være utført som branncellebegrensende konstruksjon.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.romningsveiKorridorOver30m && (
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Korridor lengre enn 30 meter</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Rømningsvei som har to rømningsretninger, skal deles opp i hensiktsmessige enheter slik at røyk og branngasser ikke blokkerer begge rømningsretningene.</li>
                    <li>Korridor som er lengre enn 30 meter må deles med bygningsdel og dør minst klasse E 30-CS<sub>a</sub> [F 30S] med innbyrdes avstand på høyst 30 meter.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            <tr>
              <td className="border border-gray-400 p-2 align-top font-medium">Hovedatkomst</td>
              <td className="border border-gray-400 p-2">
                Hovedatkomst til byggverk eller del av byggverk for større personantall, skal være tilrettelagt for sikker rømning.
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            {(() => {
              const rk = formData.risikoklasse || "";
              const harRK5 = rk === "RK5" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK5");
              const harRK6 = rk === "RK6" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK6");
              const erRK6IkkeBolig = harRK6 && !formData.erRKL6Boligbygning;
              const bredde = (harRK5 || erRK6IkkeBolig) ? "1,16 meter" : "0,86 meter";
              const bk = formData.brannklasse || "";
              const strømTid = bk === "BKL1" ? "30 minutter" : (bk === "BKL2" || bk === "BKL3") ? "60 minutter" : null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Dør i rømningsvei</td>
                  <td className="border border-gray-400 p-2">
                    <p className="mb-2">Dør til rømningsvei skal prosjekteres og utføres slik at den sikrer rask rømning og slik at det ikke oppstår fare for oppstuving. Følgende krav må minst være oppfylt:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Dører som er beregnet for manuell åpning til og i atkomst- og rømningsveier, skal kunne åpnes med åpningskraft på maksimum {formData.universellUtforming ? "30 N" : "67 N"}.</li>
                      <li>Dør til rømningsvei må ha fri bredde minimum {bredde}.</li>
                      <li>Dør til rømningsvei må ha fri høyde på minimum 2,0 meter.</li>
                      <li>Dør til rømningsvei må lett kunne åpnes slik at den er enkel å bruke for alle personer.</li>
                       <li>Selvlukkende dør, benevnt C [S], kan settes i åpen stilling ved hjelp av elektromagnetiske holdere som utløses og lukker døren ved brannalarm. Døren må kunne åpnes igjen med dørautomatikk eller manuelt med åpningskraft i samsvar med § 12-13.</li>
                       {(() => {
                         if (!formData.universellUtforming) return null;
                         const bt = (formData.bygningstype || "").toLowerCase();
                         const erBoligBygg = bt.includes("bolig") || bt.includes("enebolig") || bt.includes("rekkehus") || bt.includes("kjedehus") || bt.includes("leilighet") || (formData.risikoklasse === "RK4");
                         if (!erBoligBygg) return <li>Alle selvlukkende dører til og i rømningsvei skal ha dørautomatikk for å sikre at åpningskraften ikke overstiger 30 N.</li>;
                         return null;
                       })()}
                      {(() => {
                        const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                          || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                        return erKraftstasjon ? <li>For kraftstasjon: alle dører til og i rømningsvei skal slå ut i rømningsretning.</li> : null;
                      })()}
                      <li>Utadslående dør i yttervegg som er utgang eller rømningsvei, må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.</li>
                      {strømTid && (
                        <li>Avbruddsfri strømforsyning må fungere i minst {strømTid} i byggverk i {bk === "BKL1" ? "brannklasse 1" : `brannklasse ${bk.replace("BKL", "")}`}.</li>
                      )}
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK / RIE</td>
                </tr>
              );
            })()}
            {(() => {
              const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
              if (!formData.romningsveiPanikkbeslag && !erKraftstasjon) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Panikkbeslag</td>
                  <td className="border border-gray-400 p-2">
                    {erKraftstasjon
                      ? "For kraftstasjon må dør i rømningsvei være utført for sikker rømning ved at døren kan åpnes manuelt med ett grep og uten bruk av nøkkel (panikkbeslag iht. NS-EN 1125). For rom med høyspentanlegg skal beslaget være utformet slik at det kan betjenes med kne, albue eller annen kroppsdel, slik at dør kan åpnes uten bruk av hender. Beslaget skal også kunne benyttes av personer som åler eller kryper, og må derfor være vertikalmontert slik at det kan betjenes uansett høyde."
                      : "Dør i rømningsvei i byggverk i risikoklasse 5 og 6 må være utført for sikker rømning ved at døren må kunne åpnes manuelt med ett grep og uten bruk av nøkkel, jf. figur 6."}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              );
            })()}
            {formData.romningsvei && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                <td className="border border-gray-400 p-2">{formData.romningsvei}</td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.romningsveiKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.romningsveiKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_11"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_11"]} sectionLabel="3.11 Rømningsvei" />
            )}


            {/* 3.12 §11-15 Tilrettelegging for redning av husdyr */}
            <tr id="preview-3-12" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.12 &nbsp;&nbsp; {isBF85 ? <>Tilrettelegging for redning av husdyr <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-15)</span></> : "§11-15 Tilrettelegging for redning av husdyr"}</td>
            </tr>
            {formData.husdyrRedningRelevant ? (
              <>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                  <th className="border border-gray-400 p-2 text-left">Løsning</th>
                  <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt</td>
                  <td className="border border-gray-400 p-2">
                    Byggverk beregnet for husdyrhold skal ha tilfredsstillende rømningsforhold og tilrettelegging for redning av husdyr ved brann.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Utganger</td>
                  <td className="border border-gray-400 p-2">
                    Husdyrrom må ha minst to utganger uavhengig av størrelsen på rommet. Én av utgangene kan gå via annen branncelle eller annet rom.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
                {(() => {
                  const typer: string[] = Array.isArray(formData.husdyrTyper) ? formData.husdyrTyper : [];
                  const harStore = typer.includes("storfe_hest");
                  const harSmaa = typer.includes("gris_sau_geit");
                  if (!harStore && !harSmaa) return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top font-medium">Fri bredde</td>
                      <td className="border border-gray-400 p-2">
                        Utganger eller rømningsveier må ha fri bredde på minimum 1,6 meter fra rom for okse, ku og hest, og minimum 1,0 meter fra rom for gris, sau og geit.
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                  );
                  return (<>
                    {harStore && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top font-medium">Fri bredde</td>
                        <td className="border border-gray-400 p-2">
                          Utganger eller rømningsveier må ha fri bredde på minimum 1,6 meter fra rom for okse, ku og hest.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                    )}
                    {harSmaa && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top font-medium">{harStore ? "" : "Fri bredde"}</td>
                        <td className="border border-gray-400 p-2">
                          Utganger eller rømningsveier må ha fri bredde på minimum 1,0 meter fra rom for gris, sau og geit.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">ARK</td>
                      </tr>
                    )}
                  </>);
                })()}
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Rømningsvei</td>
                  <td className="border border-gray-400 p-2">
                    Avstand fra et hvert oppholdssted til nærmeste utgang i husdyrrom må ikke være mer enn 30 meter.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Dør i yttervegg</td>
                  <td className="border border-gray-400 p-2">
                    Utadslående dør i yttervegg som er utgang eller rømningsvei må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
                {formData.husdyrRedningKommentar && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                    <td className="border border-gray-400 p-2 italic">{formData.husdyrRedningKommentar}</td>
                    <td className="border border-gray-400 p-2 align-top">-</td>
                  </tr>
                )}
              </>
            ) : (
              <tr>
                <td className="border border-gray-400 p-2" colSpan={3} style={{fontStyle: 'italic'}}>
                  Tilrettelegging for redning av husdyr er ikke relevant for dette tiltaket.
                </td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_12"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_12"]} sectionLabel="3.12 Redning av husdyr" />
            )}

            {/* 3.13 §11-16 Manuell slokking */}
            <tr id="preview-3-13" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.13 &nbsp;&nbsp; {isBF85 ? <>Slokkingsredskap og slokkingsvann (Kap. 30:93/31–39) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-16 Tilrettelegging for manuell slokking)</span></> : "§11-16 Tilrettelegging for manuell slokking"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelt</td>
              <td className="border border-gray-400 p-2">
                <p>Byggverk skal være tilrettelagt for effektiv manuell slokking av brann.</p>
                <p className="mt-2">I eller på alle byggverk der brann kan oppstå, skal det være manuelt brannslokkeutstyr for effektiv slokkeinnsats i startfasen av brannen. Dette kommer i tillegg til et eventuelt automatisk brannslokkeanlegg.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">RIV</td>
            </tr>
            {(() => {
              const alleRK = formData.bygningsdeler?.length
                ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                : formData.risikoklasse ? [formData.risikoklasse] : [];
              const harRK356 = alleRK.some((rk: string) => ["RK3","RK5","RK6"].includes(rk));
              const harRK124 = alleRK.some((rk: string) => ["RK1","RK2","RK4"].includes(rk));
              const harRK4 = alleRK.includes("RK4");
              return (
                <>
                  {formData.slokkeBrannslange && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Brannslange</td>
                      <td className="border border-gray-400 p-2">
                        {harRK356
                          ? <>Byggverk i risikoklasse {["RK3","RK5","RK6"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")} hvor det er trykkvann, må ha brannslange. Dersom det ikke er tilgang på tilstrekkelig mengde vann, må byggverket ha håndslokkeapparater.</>
                          : <>Det er prosjektert med brannslange i bygget. Brannslange skal rekke inn i alle rom.</>
                        }
                        {harRK4 && <p className="mt-2">I bolig kan det benyttes formstabil brannslange med innvendig diameter på minimum 10 mm.</p>}
                        <p className="mt-2 text-xs">Ref. NS-EN 671-1:2012 Faste brannslokkesystemer – Slangesystemer – Del 1: Slangetromler med formstabil slange</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                  )}
                  {formData.slokkeHandslukker && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Håndslokker</td>
                      <td className="border border-gray-400 p-2">
                        {harRK124 && !harRK356
                          ? <p>Byggverk i risikoklasse {["RK1","RK2","RK4"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")} må ha enten håndslokkeapparat eller egnet brannslange som rekker inn i alle rom.</p>
                          : <p>Det er prosjektert med håndslokkeapparater i tillegg til øvrig slokkeutstyr.</p>
                        }
                        <p className="mt-2">Håndslokkeapparater kan være pulverapparater på minimum 6 kg med ABC-pulver, eller skum- og vannapparater på minimum 9 liter eller på minimum 6 liter og med effektivitetsklasse minst 21A etter NS-EN 3-7:2004+A1:2007.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                  )}
                </>
              );
            })()}
            {(formData.slokkeBrannslange || formData.slokkeHandslukker) && (
              <>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Antall og dekningsområde</td>
                  <td className="border border-gray-400 p-2">
                    Antall og dekningsområde av brannslanger og håndslokkeapparater må være slik at alle rom i hele byggverket dekkes.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIV</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Plassering</td>
                  <td className="border border-gray-400 p-2">
                    Brannslokkeutstyr må være plassert slik at brukerne lett kan finne fram til det og kunne ha mulighet til å slokke branntilløp i startfasen før det utvikler seg til en større brann. Plasseringen må vurderes i hvert enkelt tilfelle ut fra virksomheten og behovet for rask slokkeinnsats for å ivareta liv, helse og materielle verdier.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIV</td>
                </tr>
                {formData.slokkeBrannslange && (
                  <>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Brannslange i trapperom</td>
                      <td className="border border-gray-400 p-2">
                        Brannslangeskap må ikke plasseres i trapperom. Dører som blir stående i åpen stilling på grunn av at brannslanger trekkes gjennom, kan føre til at røyk og branngasser sprer seg til resten av byggverket.
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Slangelengde</td>
                      <td className="border border-gray-400 p-2">
                        Brannslange må ikke være lengre enn 30 meter ved fullt uttrekk.
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Merking av slokkeutstyr</td>
                      <td className="border border-gray-400 p-2">
                        <p>Stedene hvor manuelt slokkeutstyr er plassert, skal være tydelig markert med skilt.</p>
                        <p className="mt-1">Skiltene må være etterlysende (fotoluminiscerende) eller belyst med nødlys.</p>
                        <p className="mt-1">Tilvisningsskilt for slokkeutstyr må stå på tvers av ferdselsretningen.</p>
                        <p className="mt-1">For materiell som krever bruksanvisning, må denne finnes på eller ved materiellet, også på de mest aktuelle fremmedspråk.</p>
                        <p className="mt-2 text-xs">Plasseringen av brannslokkeutstyret skal være tydelig merket med mindre det bare er beregnet for personer i én bruksenhet og personene må forventes å være godt kjent med plasseringen.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIBr</td>
                    </tr>
                  </>
                )}
              </>
            )}
            {formData.manuellSlokking && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                <td className="border border-gray-400 p-2">{formData.manuellSlokking}</td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            )}
            {formData.manuellSlokkingKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.manuellSlokkingKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_13"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_13"]} sectionLabel="3.13 Manuell slokking" />
            )}

            {/* 3.14 §11-17 Tilrettelegging for slokkemannskap */}
            <tr id="preview-3-14" style={sectionRowStyle}>
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.14 &nbsp;&nbsp; {isBF85 ? <>Atkomst for brannvesenet (Kap. 30:92/94/95) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-17 Tilrettelegging for slokkemannskap)</span></> : "§11-17 Tilrettelegging for slokkemannskap"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelt</td>
              <td className="border border-gray-400 p-2">
                <ul className="list-disc ml-4 space-y-1">
                  <li>Byggverk skal plasseres og utformes slik at rednings- og slokkemannskap har brukbar tilgjengelighet.</li>
                  <li>Byggverk skal tilrettelegges slik at en brann lett kan lokaliseres og bekjempes.</li>
                  <li>Branntekniske installasjoner som har betydning for rednings- og slokkeinnsatsen skal være tydelig merket.</li>
                </ul>
              </td>
              <td className="border border-gray-400 p-2 align-top">RIBr</td>
            </tr>
            {formData.hoyderedskapRelevant && !formData.byggOver23m && (
            <tr>
              <td className="border border-gray-400 p-2 align-top font-medium">Tilgjengelighet for høyderedskap</td>
              <td className="border border-gray-400 p-2">
                <p>Byggverk inntil 8 etasjer må ha tilgjengelighet for brannvesenets høyderedskap (brannbil utstyrt med maskinstige eller snorkel) slik at alle etasjer og brannseksjoner kan nås.</p>
                {parseInt(formData.etasjer) <= 3 && (
                  <p className="mt-1">I lave byggverk kan det tilrettelegges for bruk av bærbare stiger.</p>
                )}
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            )}
            {formData.byggOver23m && (
            <tr>
              <td className="border border-gray-400 p-2 align-top font-medium">Tilgjengelighet for høyderedskap</td>
              <td className="border border-gray-400 p-2">
                <p>Øverste gulv må ikke være høyere enn 23 meter over laveste punkt på oppstillingsplasser for brannvesenets høyderedskap.</p>
                <p className="mt-1">Det må tilrettelegges for brannvesenets høyderedskap (brannbil utstyrt med maskinstige eller snorkel) slik at alle etasjer og brannseksjoner kan nås.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            )}
            <tr>
              <td className="border border-gray-400 p-2 align-top">Kjørbar atkomst</td>
              <td className="border border-gray-400 p-2">
                <p>Det må være tilrettelagt for kjørbar atkomst helt fram til hovedinngangen og brannvesenets angrepsvei i bygget.</p>
                <p className="mt-1">For mindre byggverk i risikoklasse 4 og brannklasse 1 kan det aksepteres avstand på inntil 50 meter.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            {formData.romningsvinduRelevant && (
            <tr>
              <td className="border border-gray-400 p-2 align-top">Vindu/balkong som rømningsvei</td>
              <td className="border border-gray-400 p-2">
                <p>I byggverk hvor vindu eller balkong utgjør en av rømningsveiene, må det være tilgjengelighet for brannvesenets høyderedskap i samsvar med ytelser angitt i § 11-13.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            )}
            {formData.stortAntallPersonerSlokke && (
            <tr>
              <td className="border border-gray-400 p-2 align-top">Stort antall personer</td>
              <td className="border border-gray-400 p-2">
                <p>I byggverk med et stort antall personer (vanligvis risikoklasse 5 og 6), må atkomsten som forutsettes benyttet for rednings- og slokkeinnsats, lett kunne åpnes av brannvesenet.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            )}
            {formData.harUniversalnokkel && (
            <tr>
              <td className="border border-gray-400 p-2 align-top">Universalnøkkel</td>
              <td className="border border-gray-400 p-2">
                <p>I byggverk hvor brannvesenet vil måtte søke gjennom et større antall rom (mer enn 50 rom), må inngangsdør og dører til de enkelte rommene lett kunne åpnes ved hjelp av universalnøkkel som plasseres slik at den er lett tilgjengelig for brannvesenet.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            )}
            {formData.harRadiokommunikasjon && (
            <tr>
              <td className="border border-gray-400 p-2 align-top">Radiokommunikasjon</td>
              <td className="border border-gray-400 p-2">
                <p>For å sikre radiokommunikasjon for rednings- og slokkemannskap, må det i byggverk uten tilfredsstillende innvendig radiodekning og hvor det kan bli behov for redningsinnsats, tilrettelegges med teknisk installasjon slik at rednings- og slokkemannskap kan benytte eget samband.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">RIE</td>
            </tr>
            )}
            {formData.slangeutlegg50m && (
            <tr>
              <td className="border border-gray-400 p-2 align-top">Slangeutlegg</td>
              <td className="border border-gray-400 p-2">
                <p>Alle deler av en etasje må kunne nås med maksimalt 50 m slangeutlegg. Avstand regnes fra nærmeste brannskille.</p>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            )}
            {(() => {
              const kjoreveiTekst = formData.kjoreveiKrav ?? "Følgende legges til grunn ved utforming av kjørevei for kjøretøy:\n- Kjørebredde, minst: 4,0 meter\n- Stigningsforhold, maksimalt: 1:8 (12,5 %)\n- Fri kjørehøyde, minst: 4 meter\n- Svingradius, ytterkant vei, minst: 12 meter\n- Akseltrykk, minst: 10 tonn\n- Boggitrykk, minst: 16 tonn";
              return kjoreveiTekst ? (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Utforming av kjørevei</td>
                  <td className="border border-gray-400 p-2 whitespace-pre-line">{kjoreveiTekst}</td>
                  <td className="border border-gray-400 p-2 align-top">LARK</td>
                </tr>
              ) : null;
            })()}
            {(formData.hoyderedskapRelevant || formData.byggOver23m) && (() => {
              const oppstillingsTekst = formData.oppstillingsplassKrav ?? "Følgende legges til grunn ved utforming av oppstillingsplasser for høyderedskaper:\n- Bredde på oppstillingsplass, minst: 7 meter\n- Lengde på oppstillingsplass, minst: 12 meter\n- Stigningsforhold på oppstillingsplass, maksimalt: 3,5 %\n- Punktbelastning støtteben: Maks. jordtrykk u/markplate 11,7 kg/cm²";
              return oppstillingsTekst ? (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Utforming av oppstillingsplasser</td>
                  <td className="border border-gray-400 p-2 whitespace-pre-line">{oppstillingsTekst}</td>
                  <td className="border border-gray-400 p-2 align-top">LARK</td>
                </tr>
              ) : null;
            })()}
            {formData.redningsmannskap && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                <td className="border border-gray-400 p-2">{formData.redningsmannskap}</td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            )}
            {formData.redningsmannskapKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.redningsmannskapKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}
            {documentType === "tilstandsvurdering" && formData.tilstandsvurderinger?.["3_14"] && (
              <TilstandTableRow data={formData.tilstandsvurderinger["3_14"]} sectionLabel="3.14 Slokkemannskap" />
            )}
          </tbody>
        </table>
      </section>
      <PageFooter pageNum={pageKap3g} />
      </div>

      {/* Oppsummering av avvik – kun for tilstandsvurdering */}
      {isTilstand && (() => {
        const tv: Record<string, TilstandData> = formData.tilstandsvurderinger || {};
        type AvvikRad = { sectionLabel: string; sectionKey: string; idx: number; grad: string; beskrivelse: string };
        const samleAvvik = (kind: "tiltak" | "fravik"): AvvikRad[] => {
          const ut: AvvikRad[] = [];
          tilstandSectionList.forEach(s => {
            const data = tv[s.key] || ({} as TilstandData);
            const k = getKategorier(data);
            const liste = getAvvikListe(kind === "tiltak" ? k.tiltak : k.fravik);
            liste.forEach((a, i) => {
              if (a.beskrivelse && a.beskrivelse.trim()) {
                ut.push({
                  sectionLabel: s.label,
                  sectionKey: s.key,
                  idx: i,
                  grad: a.grad || data.grad || "",
                  beskrivelse: a.beskrivelse,
                });
              }
            });
          });
          return ut;
        };
        const tiltakRows = samleAvvik("tiltak");
        const fravikRows = samleAvvik("fravik");

        if (tiltakRows.length === 0 && fravikRows.length === 0) return null;

        const renderTabell = (rader: AvvikRad[], tomTekst: string) => {
          if (rader.length === 0) {
            return <p className="ml-4 text-xs italic text-gray-600">{tomTekst}</p>;
          }
          return (
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1.5 text-left font-semibold w-40">Kapittel</th>
                  <th className="border border-gray-400 p-1.5 text-left font-semibold w-20">TG</th>
                  <th className="border border-gray-400 p-1.5 text-left font-semibold">Beskrivelse av avvik</th>
                </tr>
              </thead>
              <tbody>
                {rader.map((r, n) => {
                  const gradLabel = { tg0: "TG 0", tg1: "TG 1", tg2: "TG 2", tg3: "TG 3", tgiu: "TG IU" }[r.grad] || "—";
                  return (
                    <tr key={`${r.sectionKey}-${r.idx}-${n}`}>
                      <td className="border border-gray-400 p-1.5 align-top font-medium">{r.sectionLabel}</td>
                      <td className="border border-gray-400 p-1.5 align-top">{gradLabel}</td>
                      <td className="border border-gray-400 p-1.5 align-top whitespace-pre-wrap">{r.beskrivelse}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        };

        return (
          <div className={pageStyle} style={pageWidth}>
            <h2 id="preview-oppsummering-avvik" className="font-bold mb-3" style={{ color: chapterHeadingColor }}>
              Oppsummering av avvik
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Samlet oversikt over avvik fra tilstandsvurderingen, fordelt på avvik som krever aktive tiltak og avvik som kan fraviksbehandles.
            </p>

            <section className="mb-6">
              <h3 className="font-semibold mb-2" style={{ color: "#991B1B" }}>Avvik som krever aktive tiltak</h3>
              {renderTabell(tiltakRows, "Ingen avvik registrert som krever aktive tiltak.")}
            </section>

            <section className="mb-6">
              <h3 className="font-semibold mb-2" style={{ color: "#92400E" }}>Avvik som kan fraviksbehandles</h3>
              {renderTabell(fravikRows, "Ingen avvik registrert som kan fraviksbehandles.")}
            </section>
          </div>
        );
      })()}

      {/* Kap 4+5 (brannkonsept) eller revisjon (tilstand) - egen side */}
      <div className={pageStyle} style={pageWidth}>

      {documentType !== "tilstandsvurdering" && (
      <>
      <section className="mb-6">
        <h2 id="preview-kap4" className="font-bold mb-3" style={{ color: chapterHeadingColor }}>4. Utførelses- og driftsfasen</h2>
        
        <h3 className="font-semibold mb-2">4.1 Utførelsesfasen</h3>
        <p className="ml-4 mb-1 font-semibold">Til innkjøpsfasen</p>
        <p className="ml-4 mb-3" style={{ whiteSpace: "pre-wrap" }}>
          {formData.utfoerelsInnkjop || "Materialer og produkter skal tilfredsstille dokumentasjonskrav i VTEK §2. Det henvises også til 321.028 Brannsikkerhet. Dokumentasjon av utførelse."}
        </p>
        <p className="ml-4 mb-1 font-semibold">Til utførelsesfasen</p>
        <p className="ml-4 mb-3" style={{ whiteSpace: "pre-wrap" }}>
          {formData.utfoerelse || "Midlertidige branntekniske tiltak i utførelsesfasen, for eksempel endringer i rømningssituasjon, og atkomst for redningsmannskap, behandles som et kapittel i en egen SHA-plan ift. krav i byggherreforskriften. Ansvar for etablering og ajourføring av SHA-planen ligger til SHA-koordinator for prosjekteringsfasen og utførelsesfasen."}
        </p>

        <h3 className="font-semibold mb-2">4.2 Driftsfasen</h3>
        <p className="ml-4 mb-3" style={{ whiteSpace: "pre-wrap" }}>
          {formData.drift || "Det henvises til Brann- og eksplosjonsvernloven og forskrift om brannforebygging for krav som gjelder under driftsfasen. Dersom forutsetninger som er lagt til grunn endres under driften av bygg, må dette tas i betraktning. Det kan være behov for ny vurdering av brannkrav."}
        </p>
      </section>

      {/* 5. Revisjonshistorikk */}
      <section className="mb-6">
        <h2 id="preview-kap5" className="font-bold mb-3">5. Revisjonshistorikk</h2>
        {formData.revisjoner && formData.revisjoner.length > 0 ? (
          <table className="w-full border-collapse border border-gray-400 text-xs ml-0">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1.5 text-left font-semibold w-12">Rev.</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold w-24">Dato</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">Prosjekterende</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">KS</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">Kommentar</th>
              </tr>
            </thead>
            <tbody>
              {formData.revisjoner.map((rev: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-1.5">{rev.nummer}</td>
                  <td className="border border-gray-400 p-1.5">{rev.dato}</td>
                  <td className="border border-gray-400 p-1.5">{rev.prosjekterende || "—"}</td>
                  <td className="border border-gray-400 p-1.5">{rev.ks || "—"}</td>
                  <td className="border border-gray-400 p-1.5">{rev.kommentar || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="ml-4">{formData.revisjon || "[Revisjonslogg]"}</p>
        )}
      </section>
      </>
      )}

      {documentType === "tilstandsvurdering" && (
      <>
      <section className="mb-6">
        <h2 id="preview-kap5" className="font-bold mb-3">3. Revisjonshistorikk</h2>
        {formData.revisjoner && formData.revisjoner.length > 0 ? (
          <table className="w-full border-collapse border border-gray-400 text-xs ml-0">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1.5 text-left font-semibold w-12">Rev.</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold w-24">Dato</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">Prosjekterende</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">KS</th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">Kommentar</th>
              </tr>
            </thead>
            <tbody>
              {formData.revisjoner.map((rev: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-1.5">{rev.nummer}</td>
                  <td className="border border-gray-400 p-1.5">{rev.dato}</td>
                  <td className="border border-gray-400 p-1.5">{rev.prosjekterende || "—"}</td>
                  <td className="border border-gray-400 p-1.5">{rev.ks || "—"}</td>
                  <td className="border border-gray-400 p-1.5">{rev.kommentar || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="ml-4">{formData.revisjon || "[Revisjonslogg]"}</p>
        )}
      </section>
      </>
      )}

      {formData.fravik && (
        <section id="preview-fravik" className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h2 className="font-bold mb-3">Fravik og kompenserende tiltak</h2>
          <p className="ml-4">{formData.fravik}</p>
        </section>
      )}
      <PageFooter pageNum={pageKap4} />
      </div>

      {/* Litteraturhenvisninger - egen side */}
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 id="preview-kap6" className="font-bold mb-3">{isTilstand ? "4" : "6"}. Litteraturhenvisninger</h2>
        <ul className="ml-4 list-disc list-inside">
          {(formData.litteratur || "").split("\n").filter((r: string) => r.trim()).map((ref: string, i: number) => (
            <li key={i}>{ref}</li>
          ))}
        </ul>
      </section>
      <PageFooter pageNum={pageLitteratur} />
      </div>
    </div>
  );
};

export default KonseptPreview;
