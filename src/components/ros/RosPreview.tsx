import React, { useRef } from "react";
import { risikoFarge } from "./RosMatriks";

export interface RosHendelse {
  id: string;
  tittel: string;
  /** @deprecated bruk `hendelse` i stedet – beholdt for bakoverkompatibilitet */
  beskrivelse?: string;
  sarbarhet?: string;
  hendelse?: string;
  arsak: string;
  beskrivelseSannsynlighetFor?: string;
  beskrivelseRisikoFor?: string;
  sannsynlighet: number;
  konsekvens: number;
  tiltak: string;
  beskrivelseEtter?: string;
  sannsynlighetEtter?: number;
  konsekvensEtter?: number;
  restrisiko: string;
}

export interface RosRevisjon {
  versjon: string;
  dato: string;
  utfortAv: string;
  endring: string;
}

export interface RosFellesBarriere {
  tekst: string;
  arsakIds: string[];
  kilde?: "ai" | "manuell";
}

export interface RosBowTie {
  id: string;
  navn: string;
  beskrivelse?: string;
  hendelseIds: string[];
  konsekvenser: string[];
  fellesBarrierer?: string;
  felleseBarrierer?: RosFellesBarriere[];
}

export interface RosContent {
  metadata: {
    prosjektnavn: string;
    adresse: string;
    oppdragsgiver: string;
    utfortAv: string;
    dato: string;
    versjon: string;
  };
  innledning: {
    bakgrunn: string;
    formal: string;
    omfang: string;
    avgrensninger: string;
  };
  hendelser: RosHendelse[];
  bowTies?: RosBowTie[];
  oppsummering: string;
  revisjonshistorikk: RosRevisjon[];
}

interface Props {
  content: RosContent;
  logoUrl?: string | null;
  firmaNavn?: string | null;
  utarbeidetAv?: string | null;
}

const SKALA_S: { trinn: number; tekst: string }[] = [
  { trinn: 1, tekst: "Svært lite sannsynlig (sjeldnere enn hvert 50. år)" },
  { trinn: 2, tekst: "Lite sannsynlig (hvert 10.–50. år)" },
  { trinn: 3, tekst: "Sannsynlig (hvert 1.–10. år)" },
  { trinn: 4, tekst: "Meget sannsynlig (årlig)" },
  { trinn: 5, tekst: "Svært sannsynlig (flere ganger per år)" },
];
const SKALA_K: { trinn: number; tekst: string }[] = [
  { trinn: 1, tekst: "Ufarlig (ingen personskade, ubetydelig materiell skade)" },
  { trinn: 2, tekst: "En viss fare (mindre personskade, begrenset materiell skade)" },
  { trinn: 3, tekst: "Farlig (alvorlig personskade, betydelig materiell skade)" },
  { trinn: 4, tekst: "Kritisk (livstruende skade, store materielle tap)" },
  { trinn: 5, tekst: "Katastrofal (død, totalskade)" },
];

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "210mm",
  minHeight: "297mm",
  background: "#fff",
  color: "#1a1a1a",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  fontSize: 11,
  lineHeight: 1.6,
  padding: "20mm 18mm 24mm 18mm",
  boxSizing: "border-box",
  boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
  marginInline: "auto",
};
const landscapePageStyle: React.CSSProperties = {
  ...pageStyle,
  maxWidth: "297mm",
  minHeight: "210mm",
  padding: "16mm 14mm 18mm 14mm",
};

const h2: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginTop: 0,
  marginBottom: 10,
  color: "#1e3a5f",
  borderBottom: "2px solid #1e3a5f",
  paddingBottom: 5,
};
const chapterDivider: React.CSSProperties = {
  marginTop: 64,
  paddingTop: 40,
  borderTop: "2px dashed #c8d2df",
  position: "relative",
};
const h3: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  marginTop: 16,
  marginBottom: 6,
  color: "#2d4a6f",
};
const pStyle: React.CSSProperties = {
  fontSize: 11,
  margin: "0 0 8px 0",
  whiteSpace: "pre-line",
};
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 10,
  fontWeight: 600,
  background: "#e8eef5",
  borderBottom: "2px solid #bbc8d9",
  color: "#1e3a5f",
};
const tdStyle: React.CSSProperties = {
  padding: "7px 10px",
  fontSize: 10,
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 10,
  border: "1px solid #e2e8f0",
};

const FARGE = {
  gronn: { bg: "#22A06B", fg: "#ffffff" },
  gul: { bg: "#F5B82E", fg: "#1F2937" },
  rod: { bg: "#DC3545", fg: "#ffffff" },
} as const;

function riskCellStyle(s: number, k: number): React.CSSProperties {
  const f = FARGE[risikoFarge(s, k)];
  return {
    ...tdStyle,
    background: f.bg,
    color: f.fg,
    fontWeight: 700,
    textAlign: "center",
  };
}

export default function RosPreview({ content, logoUrl, firmaNavn, utarbeidetAv }: Props) {
  const m = content.metadata;
  const dato = m.dato || new Date().toISOString().slice(0, 10);
  const utfort = m.utfortAv || utarbeidetAv || "";

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const proxyScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const handleTableScroll = () => {
    if (syncingRef.current || !proxyScrollRef.current || !tableScrollRef.current) return;
    syncingRef.current = true;
    proxyScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    requestAnimationFrame(() => { syncingRef.current = false; });
  };
  const handleProxyScroll = () => {
    if (syncingRef.current || !proxyScrollRef.current || !tableScrollRef.current) return;
    syncingRef.current = true;
    tableScrollRef.current.scrollLeft = proxyScrollRef.current.scrollLeft;
    requestAnimationFrame(() => { syncingRef.current = false; });
  };

  return (
    <div className="bg-muted/20 p-4 md:p-8">
      <style>{`
        .ros-h-scroll::-webkit-scrollbar { height: 16px; }
        .ros-h-scroll::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 8px; }
        .ros-h-scroll::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 8px; border: 2px solid #e2e8f0; }
        .ros-h-scroll::-webkit-scrollbar-thumb:hover { background: #2d4a6f; }
        .ros-h-scroll { scrollbar-color: #1e3a5f #e2e8f0; scrollbar-width: auto; }
        .ros-h-scroll-hidden { scrollbar-width: none; -ms-overflow-style: none; }
        .ros-h-scroll-hidden::-webkit-scrollbar { display: none; width: 0; height: 0; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 56 }}>
      <div style={pageStyle}>
        {/* Logo */}
        {logoUrl && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-10mm", marginBottom: 8 }}>
            <div
              style={{
                width: 220,
                height: 96,
                background: "#fff",
                borderRadius: 4,
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={logoUrl} alt="Firmalogo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          </div>
        )}

        {/* Header bar */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "16px 20px", borderRadius: 6, marginBottom: 20 }}>
          <p style={{ fontSize: 10, opacity: 0.8, margin: 0, letterSpacing: 1 }}>RISIKO- OG SÅRBARHETSANALYSE</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0 0" }}>{m.prosjektnavn || "Uten navn"}</p>
          {m.adresse && <p style={{ fontSize: 12, opacity: 0.85, margin: "4px 0 0 0" }}>{m.adresse}</p>}
        </div>

        {/* Project info */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, border: "1px solid #e2e8f0" }}>
          <tbody>
            {firmaNavn && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, width: 160, background: "#f7f9fc" }}>Firma</td>
                <td style={tdStyle}>{firmaNavn}</td>
              </tr>
            )}
            {m.oppdragsgiver && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, width: 160, background: "#f7f9fc" }}>Oppdragsgiver</td>
                <td style={tdStyle}>{m.oppdragsgiver}</td>
              </tr>
            )}
            {m.prosjektnavn && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, width: 160, background: "#f7f9fc" }}>Prosjekt</td>
                <td style={tdStyle}>{m.prosjektnavn}</td>
              </tr>
            )}
            {m.adresse && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, background: "#f7f9fc" }}>Adresse</td>
                <td style={tdStyle}>{m.adresse}</td>
              </tr>
            )}
            {utfort && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, background: "#f7f9fc" }}>Utført av</td>
                <td style={tdStyle}>{utfort}</td>
              </tr>
            )}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 600, background: "#f7f9fc" }}>Dato</td>
              <td style={tdStyle}>{dato}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 600, background: "#f7f9fc" }}>Versjon</td>
              <td style={tdStyle}>{m.versjon || "1.0"}</td>
            </tr>
          </tbody>
        </table>

        {/* Kap. 1 Innledning */}
        <section id="kap-1">
          <h2 style={h2}>1. Innledning</h2>
          <SubField nummer="1.1" tittel="Bakgrunn" value={content.innledning.bakgrunn} />
          <SubField nummer="1.2" tittel="Formål" value={content.innledning.formal} />
          <SubField nummer="1.3" tittel="Omfang" value={content.innledning.omfang} />
          <SubField nummer="1.4" tittel="Avgrensninger" value={content.innledning.avgrensninger} />
        </section>

        {/* Kap. 2 Metode */}
        <section id="kap-2" style={chapterDivider}>
          <h2 style={h2}>2. Metode</h2>
          <p style={pStyle}>
            Analysen er utført som en kvalitativ risiko- og sårbarhetsanalyse med en 5×5-matrise der
            sannsynlighet (S) og konsekvens (K) vurderes på en skala fra 1 til 5. Risikoverdien
            (R = S × K) plasseres i fargekodede områder for akseptabel, ALARP/vurderes og ikke
            akseptabel risiko. Brannrelaterte hendelser er identifisert med utgangspunkt i bygningens
            bruk, brannenergi, evakueringsforhold og aktive/passive brannsikringstiltak.
          </p>

          <h3 style={h3}>2.1 Sannsynlighetsskala</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 70 }}>Trinn</th>
                <th style={thStyle}>Beskrivelse</th>
              </tr>
            </thead>
            <tbody>
              {SKALA_S.map((s) => (
                <tr key={s.trinn}>
                  <td style={{ ...tdStyle, fontWeight: 600, textAlign: "center" }}>{s.trinn}</td>
                  <td style={tdStyle}>{s.tekst}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3}>2.2 Konsekvensskala</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 70 }}>Trinn</th>
                <th style={thStyle}>Beskrivelse</th>
              </tr>
            </thead>
            <tbody>
              {SKALA_K.map((s) => (
                <tr key={s.trinn}>
                  <td style={{ ...tdStyle, fontWeight: 600, textAlign: "center" }}>{s.trinn}</td>
                  <td style={tdStyle}>{s.tekst}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3}>2.3 Risikomatrise (5×5)</h3>
          <table style={{ ...tableStyle, width: "auto", marginInline: "auto" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "center", width: 60 }}>S \ K</th>
                {[1, 2, 3, 4, 5].map((k) => (
                  <th key={k} style={{ ...thStyle, textAlign: "center", width: 56 }}>
                    K={k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((s) => (
                <tr key={s}>
                  <td style={{ ...tdStyle, background: "#e8eef5", fontWeight: 700, textAlign: "center", color: "#1e3a5f" }}>
                    S={s}
                  </td>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <td key={k} style={riskCellStyle(s, k)}>
                      {s * k}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ ...pStyle, fontSize: 10, color: "#475569", marginTop: 6 }}>
            Fargekoding: grønn = akseptabel (R 1–4), gul = vurderes / ALARP (R 5–9), rød = ikke akseptabel (R 10–25).
          </p>
        </section>
      </div>

      {/* Ark 2 — liggende A4 for kap. 3 */}
      <div style={landscapePageStyle}>
        {/* Kap. 3 Hendelsesregister */}
        <section id="kap-3">
          <h2 style={h2}>3. Hendelsesregister</h2>
          {content.hendelser.length === 0 ? (
            <p style={{ ...pStyle, fontStyle: "italic", color: "#64748b" }}>Ingen hendelser registrert ennå.</p>
          ) : (
            <>
              <div
                ref={tableScrollRef}
                onScroll={handleTableScroll}
                className="ros-h-scroll-hidden"
                style={{ overflowX: "auto" }}
              >
              <table style={{ ...tableStyle, fontSize: 9, minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 26, textAlign: "center", fontSize: 9 }}>Nr</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Sårbarhet</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Hendelse / scenario</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Årsak</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Beskr. sanns. (før)</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Beskr. risiko (før)</th>
                    <th style={{ ...thStyle, width: 24, textAlign: "center", fontSize: 9 }}>S</th>
                    <th style={{ ...thStyle, width: 24, textAlign: "center", fontSize: 9 }}>K</th>
                    <th style={{ ...thStyle, width: 30, textAlign: "center", fontSize: 9 }}>R</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Forebyggende tiltak</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Beskr. etter tiltak</th>
                    <th style={{ ...thStyle, width: 24, textAlign: "center", fontSize: 9 }}>S etter</th>
                    <th style={{ ...thStyle, width: 24, textAlign: "center", fontSize: 9 }}>K etter</th>
                    <th style={{ ...thStyle, width: 30, textAlign: "center", fontSize: 9 }}>R etter</th>
                    <th style={{ ...thStyle, fontSize: 9 }}>Restrisiko</th>
                  </tr>
                </thead>
                <tbody>
                  {content.hendelser.map((h, i) => {
                    const sE = h.sannsynlighetEtter ?? h.sannsynlighet;
                    const kE = h.konsekvensEtter ?? h.konsekvens;
                    const td = { ...tdStyle, fontSize: 9 };
                    return (
                      <tr key={h.id}>
                        <td style={{ ...td, textAlign: "center", fontWeight: 600 }}>{i + 1}</td>
                        <td style={td}>{h.sarbarhet || ""}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{h.hendelse || h.beskrivelse || h.tittel || "—"}</td>
                        <td style={td}>{h.arsak}</td>
                        <td style={td}>{h.beskrivelseSannsynlighetFor || ""}</td>
                        <td style={td}>{h.beskrivelseRisikoFor || ""}</td>
                        <td style={{ ...td, textAlign: "center" }}>{h.sannsynlighet}</td>
                        <td style={{ ...td, textAlign: "center" }}>{h.konsekvens}</td>
                        <td style={{ ...riskCellStyle(h.sannsynlighet, h.konsekvens), fontSize: 9 }}>{h.sannsynlighet * h.konsekvens}</td>
                        <td style={td}>{h.tiltak}</td>
                        <td style={td}>{h.beskrivelseEtter || ""}</td>
                        <td style={{ ...td, textAlign: "center" }}>{sE}</td>
                        <td style={{ ...td, textAlign: "center" }}>{kE}</td>
                        <td style={{ ...riskCellStyle(sE, kE), fontSize: 9 }}>{sE * kE}</td>
                        <td style={td}>{h.restrisiko}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              <div
                ref={proxyScrollRef}
                onScroll={handleProxyScroll}
                className="ros-h-scroll"
                style={{
                  position: "sticky",
                  bottom: 16,
                  overflowX: "scroll",
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  boxShadow: "0 -4px 12px -4px rgba(0,0,0,0.15)",
                  zIndex: 5,
                  marginTop: 8,
                }}
              >
                <div style={{ width: 1100, height: 1 }} />
              </div>
            </>
          )}
        </section>
      </div>

      {/* Ark 3 — bow-tie (hvis registrert) */}
      {content.bowTies && content.bowTies.length > 0 && (
        <div style={landscapePageStyle}>
          <section id="kap-4">
            <h2 style={h2}>4. Bow-tie analyse</h2>
            <p style={pStyle}>
              Bow-tie-analysen knytter registrerte hendelser fra kapittel 3 til overordnede uønskede topphendelser.
              Dette synliggjør hvilke årsaker som kan lede til samme topphendelse, og hvilke tiltak som virker på tvers.
            </p>
            {content.bowTies.map((bt, idx) => {
              const arsaker = bt.hendelseIds
                .map((id) => content.hendelser.find((h) => h.id === id))
                .filter((h): h is RosHendelse => !!h);
              const aiBarrierer = (bt.felleseBarrierer || []).filter((b) => b.tekst?.trim());
              const tiltakSamlet = [
                ...aiBarrierer.map((b) => ({
                  kilde:
                    "Felles barriere" +
                    (b.kilde === "ai" ? " (AI)" : "") +
                    (b.arsakIds.length
                      ? " · " +
                        b.arsakIds
                          .map((id) => {
                            const a = arsaker.find((x) => x.id === id);
                            return a?.tittel || a?.sarbarhet || a?.hendelse || "";
                          })
                          .filter(Boolean)
                          .join(", ")
                      : ""),
                  tekst: b.tekst,
                })),
                ...arsaker
                  .map((a) => ({ kilde: a.tittel || a.sarbarhet || a.hendelse || "Hendelse", tekst: a.tiltak }))
                  .filter((t) => t.tekst?.trim()),
                ...(bt.fellesBarrierer?.trim()
                  ? [{ kilde: "Felles barriere", tekst: bt.fellesBarrierer }]
                  : []),
              ];
              const harBarrierer = aiBarrierer.length > 0;
              return (
                <div key={bt.id} style={{ marginTop: idx === 0 ? 6 : 28, pageBreakInside: "avoid" }}>
                  <h3 style={{ ...h3, fontSize: 13 }}>
                    4.{idx + 1} {bt.navn || "Uten navn"}
                  </h3>
                  {bt.beskrivelse && <p style={pStyle}>{bt.beskrivelse}</p>}

                  <BowTieScroll>
                  {/* Bow-tie diagram */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: harBarrierer
                        ? "minmax(160px, 240px) 200px 220px minmax(160px, 240px)"
                        : "minmax(160px, 240px) 240px minmax(160px, 240px)",
                      gap: 10,
                      alignItems: "start",
                      background: "#f7f9fc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    {/* Årsaker */}
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#1e3a5f", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Årsaker
                      </p>
                      {arsaker.length === 0 ? (
                        <p style={{ ...pStyle, fontSize: 10, fontStyle: "italic", color: "#64748b" }}>
                          Ingen årsaker knyttet.
                        </p>
                      ) : (
                        arsaker.map((a) => {
                          const f = FARGE[risikoFarge(a.sannsynlighet, a.konsekvens)];
                          return (
                            <div key={a.id} style={{ marginBottom: 4 }}>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#fff",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: 10,
                                  width: "fit-content",
                                  maxWidth: "100%",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    minWidth: 22,
                                    textAlign: "center",
                                    background: f.bg,
                                    color: f.fg,
                                    borderRadius: 3,
                                    padding: "1px 4px",
                                    fontWeight: 700,
                                    fontSize: 9,
                                  }}
                                >
                                  {a.sannsynlighet * a.konsekvens}
                                </span>
                                <span>{a.tittel || a.sarbarhet || a.hendelse}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Felles barrierer (kun hvis registrert) */}
                    {harBarrierer && (
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, color: "#065f46", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Felles barrierer
                        </p>
                        {aiBarrierer.map((b, i) => {
                          const navn = b.arsakIds
                            .map((id) => {
                              const a = arsaker.find((x) => x.id === id);
                              return a?.tittel || a?.sarbarhet || a?.hendelse || "";
                            })
                            .filter(Boolean);
                          return (
                            <div
                              key={i}
                              style={{
                                background: "#ecfdf5",
                                border: "1px solid #10b981",
                                borderRadius: 4,
                                padding: "5px 8px",
                                marginBottom: 5,
                                fontSize: 10,
                                color: "#064e3b",
                                width: "fit-content",
                                maxWidth: "100%",
                              }}
                            >
                              <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{b.tekst}</div>
                              {navn.length > 0 && (
                                <div style={{ fontSize: 8, color: "#047857", marginTop: 2, fontStyle: "italic" }}>
                                  Dekker: {navn.join(", ")}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Topphendelse */}
                    <div
                      style={{
                        background: "#DC3545",
                        color: "#fff",
                        textAlign: "center",
                        padding: "16px 10px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12,
                        boxShadow: "0 2px 6px rgba(220,53,69,0.3)",
                      }}
                    >
                      <div style={{ fontSize: 8, opacity: 0.85, letterSpacing: 1, marginBottom: 4 }}>TOPPHENDELSE</div>
                      {bt.navn || "Uten navn"}
                    </div>

                    {/* Konsekvenser */}
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#1e3a5f", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Konsekvenser
                      </p>
                      {bt.konsekvenser.length === 0 ? (
                        <p style={{ ...pStyle, fontSize: 10, fontStyle: "italic", color: "#64748b" }}>
                          Ingen konsekvenser registrert.
                        </p>
                      ) : (
                        bt.konsekvenser.map((k, i) => (
                          <div key={i} style={{ marginBottom: 4 }}>
                            <div
                              style={{
                                display: "inline-block",
                                background: "#fff",
                                border: "1px solid #cbd5e1",
                                borderRadius: 4,
                                padding: "4px 8px",
                                fontSize: 10,
                                width: "fit-content",
                                maxWidth: "100%",
                              }}
                            >
                              {k}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Aggregerte tiltak / barrierer */}
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#1e3a5f", margin: "10px 0 4px 0" }}>
                    Barrierer / tiltak
                  </p>
                  <table style={{ ...tableStyle, fontSize: 10 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: "30%" }}>Kilde</th>
                        <th style={thStyle}>Tiltak / barriere</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiltakSamlet.length === 0 ? (
                        <tr>
                          <td colSpan={2} style={{ ...tdStyle, fontStyle: "italic", color: "#64748b" }}>
                            Ingen tiltak registrert.
                          </td>
                        </tr>
                      ) : (
                        tiltakSamlet.map((t, i) => (
                          <tr key={i}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{t.kilde}</td>
                            <td style={tdStyle}>{t.tekst}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </BowTieScroll>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {/* Ark 4 — stående A4 for oppsummering & revisjonshistorikk */}
      <div style={pageStyle}>
        <section id="kap-5">
          <h2 style={h2}>{content.bowTies && content.bowTies.length > 0 ? "5" : "4"}. Oppsummering</h2>
          {content.oppsummering ? (
            <p style={pStyle}>{content.oppsummering}</p>
          ) : (
            <p style={{ ...pStyle, fontStyle: "italic", color: "#64748b" }}>Ingen oppsummering registrert.</p>
          )}
        </section>

        {/* Revisjonshistorikk */}
        <section id="kap-6" style={chapterDivider}>
          <h2 style={h2}>{content.bowTies && content.bowTies.length > 0 ? "6" : "5"}. Revisjonshistorikk</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "15%" }}>Versjon</th>
                <th style={{ ...thStyle, width: "20%" }}>Dato</th>
                <th style={{ ...thStyle, width: "25%" }}>Utførende</th>
                <th style={thStyle}>Endring</th>
              </tr>
            </thead>
            <tbody>
              {content.revisjonshistorikk.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, fontStyle: "italic", color: "#64748b" }}>
                    Ingen revisjoner registrert.
                  </td>
                </tr>
              ) : (
                content.revisjonshistorikk.map((r, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{r.versjon}</td>
                    <td style={tdStyle}>{r.dato}</td>
                    <td style={tdStyle}>{r.utfortAv}</td>
                    <td style={tdStyle}>{r.endring}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 10,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            color: "#64748b",
          }}
        >
          <span>{firmaNavn || ""}</span>
          <span>ROS-analyse · {m.prosjektnavn || ""}</span>
          <span>{dato}</span>
        </div>
      </div>
      </div>
    </div>
  );
}

function BowTieScroll({ children, minWidth = 900 }: { children: React.ReactNode; minWidth?: number }) {
  const tableRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const onTable = () => {
    if (syncing.current || !proxyRef.current || !tableRef.current) return;
    syncing.current = true;
    proxyRef.current.scrollLeft = tableRef.current.scrollLeft;
    requestAnimationFrame(() => { syncing.current = false; });
  };
  const onProxy = () => {
    if (syncing.current || !proxyRef.current || !tableRef.current) return;
    syncing.current = true;
    tableRef.current.scrollLeft = proxyRef.current.scrollLeft;
    requestAnimationFrame(() => { syncing.current = false; });
  };
  return (
    <>
      <div
        ref={tableRef}
        onScroll={onTable}
        className="ros-h-scroll-hidden"
        style={{ overflowX: "auto" }}
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
      <div
        ref={proxyRef}
        onScroll={onProxy}
        className="ros-h-scroll"
        style={{
          position: "sticky",
          bottom: 16,
          overflowX: "scroll",
          background: "#fff",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          boxShadow: "0 -4px 12px -4px rgba(0,0,0,0.15)",
          zIndex: 5,
          marginTop: 8,
        }}
      >
        <div style={{ width: minWidth, height: 1 }} />
      </div>
    </>
  );
}

function SubField({ nummer, tittel, value }: { nummer: string; tittel: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h3 style={h3}>
        {nummer} {tittel}
      </h3>
      {value ? (
        <p style={pStyle}>{value}</p>
      ) : (
        <p style={{ ...pStyle, fontStyle: "italic", color: "#64748b" }}>Ikke utfylt.</p>
      )}
    </div>
  );
}
