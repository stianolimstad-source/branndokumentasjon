import React, { useRef, useState } from "react";
import { risikoFarge } from "./RosMatriks";
import rosNivaaIllustrasjon from "@/assets/ros-detaljeringsnivaa.jpg";

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

export interface RosKonsekvensTiltak {
  tekst: string;
  konsekvensIndekser: number[]; // peker inn i bt.konsekvenser[]
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
  konsekvensReduserende?: RosKonsekvensTiltak[];
}

export interface RosContent {
  metadata: {
    prosjektnavn: string;
    adresse: string;
    oppdragsgiver: string;
    utfortAv: string;
    dato: string;
    versjon: string;
    nivaa?: 1 | 2 | 3;
  };
  innledning: {
    bakgrunn: string;
    formal: string;
    omfang: string;
    avgrensninger: string;
  };
  metode?: {
    informasjonsinnhenting?: string;
    organisering?: string;
    deltakere?: { navn: string; stilling: string; bedrift?: string }[];
    skjemaOgSjekklister?: string;
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

          <h3 style={h3}>2.1 Analyseprosess</h3>
          <p style={pStyle}>
            Analysen følger risikoanalyseprosessen beskrevet i Aven, Røed og Wiencke (2008)
            «Risikoanalyser – prinsipper og metoder, med anvendelser», som igjen bygger på
            ISO 31000. Prosessen deles i tre hovedfaser: planlegging, risiko- og
            sårbarhetsvurdering og risikohåndtering.
          </p>
          {(() => {
            const boks: React.CSSProperties = {
              background: "#e8eef7",
              border: "1px solid #6b86b3",
              borderRadius: 4,
              padding: "8px 10px",
              fontSize: 11,
              textAlign: "center",
              lineHeight: 1.3,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            };
            const pil: React.CSSProperties = {
              textAlign: "center",
              color: "#6b86b3",
              fontSize: 14,
              lineHeight: 1,
              margin: "2px 0",
            };
            const gruppeLabel: React.CSSProperties = {
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 10,
              fontWeight: 600,
              color: "#1e3a5f",
              padding: "0 6px",
              borderLeft: "2px solid #94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            };
            const fasekol: React.CSSProperties = {
              display: "flex",
              flexDirection: "column",
              gap: 0,
              flex: 1,
            };
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  maxWidth: 560,
                  margin: "12px auto 6px",
                  pageBreakInside: "avoid",
                }}
              >
                {/* Fase 1 — Planlegging */}
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div style={fasekol}>
                    <div style={boks}>Problemdefinisjon, informasjonsinnhenting og organisering</div>
                    <div style={pil}>▼</div>
                    <div style={boks}>Valg av analysemetode</div>
                  </div>
                  <div style={gruppeLabel}>1) Planlegging</div>
                </div>
                <div style={pil}>▼</div>

                {/* Fase 2 — Risiko- og sårbarhetsvurdering */}
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div style={fasekol}>
                    <div style={boks}>
                      Identifikasjon av mulige initierende hendelser
                      <br />
                      (farer, trusler, muligheter)
                    </div>
                    <div style={pil}>▼</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={boks}>Årsaksanalysen</div>
                      <div style={boks}>Konsekvensanalysen</div>
                    </div>
                    <div style={pil}>▼</div>
                    <div style={boks}>Risikobilde</div>
                  </div>
                  <div style={gruppeLabel}>2) Risiko- og sårbarhetsvurdering</div>
                </div>
                <div style={pil}>▼</div>

                {/* Fase 3 — Risikohåndtering */}
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div style={fasekol}>
                    <div style={boks}>
                      Sammenligning av alternativer, identifisering og vurdering av tiltak
                    </div>
                    <div style={pil}>▼</div>
                    <div style={boks}>Ledelsens vurdering og beslutning</div>
                  </div>
                  <div style={gruppeLabel}>3) Risikohåndtering</div>
                </div>

                <p
                  style={{
                    fontSize: 9,
                    fontStyle: "italic",
                    color: "#64748b",
                    textAlign: "center",
                    margin: "8px 0 0 0",
                  }}
                >
                  Figur: Risiko- og sårbarhetsanalyseprosessens ulike trinn (ref. Aven et al. 2008).
                </p>
              </div>
            );
          })()}

          <h3 style={h3}>2.2 Detaljeringsnivå</h3>
          <p style={pStyle}>
            Beredskapsforskriften stiller krav om å kartlegge virksomhetens risikopotensiale.
            Detaljeringsnivået i ROS-analysen tilpasses analysens formål. Det skilles mellom
            tre nivåer:
          </p>
          <img
            src={rosNivaaIllustrasjon}
            alt="Illustrasjon av de tre detaljeringsnivåene i ROS-analyse"
            style={{ width: "100%", height: "auto", margin: "8px 0 10px", borderRadius: 6, border: "1px solid #d0d7e2" }}
          />
          {(() => {
            const niva = content.metadata.nivaa;
            const nivaer: { n: 1 | 2 | 3; tittel: string; beskrivelse: string }[] = [
              { n: 1, tittel: "Nivå 1 — Overordnet ROS-analyse", beskrivelse: "Helhetsbilde av virksomheten/anlegget." },
              { n: 2, tittel: "Nivå 2 — ROS-analyse for anlegg og aktiviteter", beskrivelse: "Konkretiserer risiko per anlegg og aktivitet." },
              { n: 3, tittel: "Nivå 3 — Detaljert ROS-analyse av delsystem/komponenter", beskrivelse: "Dyptgående analyse av enkeltkomponenter eller delsystemer." },
            ];
            return (
              <div style={{ pageBreakInside: "avoid" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    margin: "10px 0 6px",
                  }}
                >
                  {nivaer.map((x) => {
                    const valgt = niva === x.n;
                    return (
                      <div
                        key={x.n}
                        style={{
                          background: valgt ? "#fff5f6" : "#e8eef7",
                          border: valgt ? "2px solid #DC3545" : "1px solid #6b86b3",
                          borderRadius: 6,
                          padding: "10px 12px",
                          fontSize: 10,
                          lineHeight: 1.35,
                          position: "relative",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4, color: "#1e3a5f" }}>
                          {x.tittel}
                        </div>
                        <div>{x.beskrivelse}</div>
                        {valgt && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#fff",
                              background: "#DC3545",
                              padding: "2px 6px",
                              borderRadius: 3,
                              display: "inline-block",
                              letterSpacing: 0.4,
                              textTransform: "uppercase",
                            }}
                          >
                            Valgt for denne analysen
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!niva && (
                  <p style={{ ...pStyle, fontStyle: "italic", color: "#64748b", fontSize: 10 }}>
                    Nivå er ikke valgt i input.
                  </p>
                )}
                <p
                  style={{
                    fontSize: 9,
                    fontStyle: "italic",
                    color: "#64748b",
                    textAlign: "center",
                    margin: "4px 0 0 0",
                  }}
                >
                  Figur basert på NVE / Proactima — nivåinndeling iht. Beredskapsforskriften.
                </p>
              </div>
            );
          })()}

          <h3 style={h3}>2.3 Planlegging av analysen</h3>
          <p style={pStyle}>
            God planlegging er avgjørende for resultatet. Det må være tydelig
            <em> hvorfor</em> og <em>hvordan</em> analysen skal gjennomføres, samt hvilke
            forskriftskrav som skal tilfredsstilles. Følgende momenter inngår i planleggingen
            (jf. figur under):
          </p>
          {(() => {
            const m = content.metode || {};
            const items = [
              {
                nr: "1",
                tittel: "Definere formål og omfang av analysen",
                tekst: "",
                ref: "Se kap. 1.2 Formål og 1.3 Omfang.",
              },
              {
                nr: "2",
                tittel: "Valg av konsekvens- og sannsynlighetsdimensjon",
                tekst: "",
                ref: "Se kap. 2.4 Sannsynlighetsskala og 2.5 Konsekvensskala (5-trinns skala).",
              },
              {
                nr: "3",
                tittel: "Informasjonsinnhenting",
                tekst:
                  m.informasjonsinnhenting?.trim() ||
                  "Ikke utfylt (kilder, tegningsgrunnlag, befaringer, intervjuer, statistikk).",
              },
              {
                nr: "4",
                tittel: "Organisering av arbeidet",
                tekst:
                  (m.deltakere && m.deltakere.length > 0)
                    ? ""
                    : (m.organisering?.trim() ||
                      "Ikke utfylt (deltakere, roller, ansvar, møtestruktur)."),
                extra: (m.deltakere && m.deltakere.length > 0) ? (
                  <table style={{ borderCollapse: "collapse", marginTop: 6, fontSize: 11, width: "auto" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #cbd5e1", background: "#f1f5f9", padding: "4px 8px", textAlign: "left" }}>Navn</th>
                        <th style={{ border: "1px solid #cbd5e1", background: "#f1f5f9", padding: "4px 8px", textAlign: "left" }}>Stillingstittel</th>
                        <th style={{ border: "1px solid #cbd5e1", background: "#f1f5f9", padding: "4px 8px", textAlign: "left" }}>Bedrift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.deltakere.map((d, i) => (
                        <tr key={i}>
                          <td style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}>{d.navn || "—"}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}>{d.stilling || "—"}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}>{d.bedrift || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : undefined,
              },
              {
                nr: "5",
                tittel: "Klargjøring av analyseskjema og sjekklister",
                tekst:
                  m.skjemaOgSjekklister?.trim() ||
                  "Hendelser registreres i 5×5-skjema (kap. 3) med vurdering før og etter tiltak.",
              },
            ] as Array<{ nr: string; tittel: string; tekst: string; ref?: string; extra?: React.ReactNode }>;
            return (
              <ol style={{ margin: "6px 0 12px 18px", padding: 0 }}>
                {items.map((it) => (
                  <li key={it.nr} style={{ marginBottom: 6, fontSize: 11 }}>
                    <span style={{ fontWeight: 600 }}>{it.tittel}.</span>{" "}
                    {it.tekst && (
                      <span style={{ whiteSpace: "pre-line" }}>{it.tekst}</span>
                    )}
                    {it.ref && (
                      <span style={{ fontStyle: "italic", color: "#64748b" }}> {it.ref}</span>
                    )}
                    {it.extra}
                  </li>
                ))}
              </ol>
            );
          })()}
          {(() => {
            const fase: React.CSSProperties = {
              background: "#1e3a5f",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              minWidth: 160,
            };
            const sub: React.CSSProperties = {
              background: "#e8eef7",
              color: "#1e3a5f",
              border: "1px solid #6b86b3",
              padding: "6px 10px",
              borderRadius: 4,
              fontSize: 10,
              textAlign: "center",
            };
            const pil: React.CSSProperties = { color: "#6b86b3", fontSize: 14, lineHeight: 1, margin: "2px 0" };
            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 18,
                  alignItems: "center",
                  maxWidth: 620,
                  margin: "10px auto 4px",
                  pageBreakInside: "avoid",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
                  <div style={fase}>Planlegging</div>
                  <div style={pil}>▼</div>
                  <div style={{ ...fase, background: "#2d4a6f" }}>Risiko- og sårbarhetsvurdering</div>
                  <div style={pil}>▼</div>
                  <div style={{ ...fase, background: "#3a5a85" }}>Risikohåndtering</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={sub}>Formål og omfang</div>
                  <div style={pil}>▼</div>
                  <div style={sub}>Valg av konsekvens- og sannsynlighetsdimensjon</div>
                  <div style={pil}>▼</div>
                  <div style={sub}>Informasjonsinnhenting</div>
                  <div style={pil}>▼</div>
                  <div style={sub}>Organisering</div>
                  <div style={pil}>▼</div>
                  <div style={sub}>Klargjøring av analyseskjema og sjekklister</div>
                </div>
              </div>
            );
          })()}
          <p style={{ fontSize: 9, fontStyle: "italic", color: "#64748b", textAlign: "center", margin: "4px 0 12px" }}>
            Figur: De ulike stegene i planlegging av ROS-analysen.
          </p>

          <h3 style={h3}>2.4 Sannsynlighetsskala</h3>
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

          <h3 style={h3}>2.5 Konsekvensskala</h3>
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

          <h3 style={h3}>2.6 Risikomatrise (5×5)</h3>


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

                  <BowTieScroll minWidth={1040}>
                  <BowTieDiagram bt={bt} arsaker={arsaker} aiBarrierer={aiBarrierer} harBarrierer={harBarrierer} />


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

// Kvalitativ palett – tydelig adskilte farger per årsak
const CAUSE_COLORS = [
  "#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4338ca",
];
const colorForCause = (i: number) => CAUSE_COLORS[i % CAUSE_COLORS.length];
const dashForCause = (i: number) => (i >= CAUSE_COLORS.length ? "5 3" : undefined);

function BowTieDiagram({
  bt,
  arsaker,
  aiBarrierer,
  harBarrierer,
}: {
  bt: RosBowTie;
  arsaker: RosHendelse[];
  aiBarrierer: RosFellesBarriere[];
  harBarrierer: boolean;
}) {
  const [hover, setHover] = useState<
    { kind: "arsak" | "barriere"; idx: number } | null
  >(null);

  // ----- Sortering av barrierer for å redusere linjekrysninger -----
  const arsakIndex = new Map(arsaker.map((a, i) => [a.id, i] as const));
  const sortedBarrierer = [...aiBarrierer].sort((a, b) => {
    const aMin = a.arsakIds.length
      ? Math.min(...a.arsakIds.map((id) => arsakIndex.get(id) ?? 999))
      : 999;
    const bMin = b.arsakIds.length
      ? Math.min(...b.arsakIds.map((id) => arsakIndex.get(id) ?? 999))
      : 999;
    if (aMin !== bMin) return aMin - bMin;
    return b.arsakIds.length - a.arsakIds.length;
  });

  // ----- Bow-tie geometri -----
  const W = 1040;
  const PAD_TOP = 28;
  const PAD_BOT = 16;
  const ROW_H = 48;
  const ARSAK = { x: 16, w: 180 };
  const BARR = { x: 280, w: 250 };
  const TOPP = harBarrierer ? { x: 570, w: 200 } : { x: 400, w: 240 };
  const KONS = { x: 830, w: 196 };
  const topH = 84;

  const nA = Math.max(arsaker.length, 1);
  const nB = sortedBarrierer.length;
  const nK = Math.max(bt.konsekvenser.length, 1);
  const maxRows = Math.max(nA, nB, nK, 3);
  const H = Math.max(280, PAD_TOP + PAD_BOT + maxRows * ROW_H);

  const yFor = (i: number, n: number) =>
    n <= 1 ? H / 2 : PAD_TOP + (i + 0.5) * ((H - PAD_TOP - PAD_BOT) / n);

  const arsakY = arsaker.map((_, i) => yFor(i, nA));
  const barrY = sortedBarrierer.map((_, i) => yFor(i, nB));
  const konsY = bt.konsekvenser.map((_, i) => yFor(i, nK));
  const toppCy = H / 2;
  const toppY = toppCy - topH / 2;

  const leftAnchorCount = harBarrierer ? nB : nA;
  const leftAnchorY = (i: number) =>
    toppCy +
    (i - (leftAnchorCount - 1) / 2) *
      Math.min(8, (topH - 12) / Math.max(leftAnchorCount, 1));
  const rightAnchorY = (i: number) =>
    toppCy +
    (i - (nK - 1) / 2) * Math.min(8, (topH - 12) / Math.max(nK, 1));

  const bez = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };

  // Bygg linjer med årsaks-tilhørighet (for fargekoding + hover)
  type Line = {
    key: string;
    d: string;
    color: string;
    dash?: string;
    arsakIdx?: number;
    barrIdx?: number;
    konsIdx?: number;
  };
  const lines: Line[] = [];

  if (harBarrierer) {
    // Årsak → relevante barrierer (farge fra årsak)
    arsaker.forEach((a, ai) => {
      const matched = sortedBarrierer
        .map((b, bi) => ({ b, bi }))
        .filter(({ b }) => b.arsakIds.includes(a.id));
      const targets = matched.length
        ? matched
        : sortedBarrierer.map((b, bi) => ({ b, bi })); // fallback
      targets.forEach(({ bi }) => {
        lines.push({
          key: `a${ai}-b${bi}`,
          d: bez(ARSAK.x + ARSAK.w, arsakY[ai], BARR.x, barrY[bi]),
          color: colorForCause(ai),
          dash: dashForCause(ai),
          arsakIdx: ai,
          barrIdx: bi,
        });
      });
    });
    // Barriere → topphendelse (grønn, men tones ned hvis ikke relevant for hover)
    sortedBarrierer.forEach((_, bi) => {
      lines.push({
        key: `b${bi}-t`,
        d: bez(BARR.x + BARR.w, barrY[bi], TOPP.x, leftAnchorY(bi)),
        color: "#10b981",
        barrIdx: bi,
      });
    });
  } else {
    arsaker.forEach((_, ai) => {
      lines.push({
        key: `a${ai}-t`,
        d: bez(ARSAK.x + ARSAK.w, arsakY[ai], TOPP.x, leftAnchorY(ai)),
        color: colorForCause(ai),
        dash: dashForCause(ai),
        arsakIdx: ai,
      });
    });
  }
  // Topphendelse → konsekvenser
  bt.konsekvenser.forEach((_, ki) => {
    lines.push({
      key: `t-k${ki}`,
      d: bez(TOPP.x + TOPP.w, rightAnchorY(ki), KONS.x, konsY[ki]),
      color: "#DC3545",
      konsIdx: ki,
    });
  });

  const isLineActive = (l: Line): boolean => {
    if (!hover) return true;
    if (hover.kind === "arsak") {
      if (l.arsakIdx === hover.idx) return true;
      if (harBarrierer && l.barrIdx !== undefined && l.arsakIdx === undefined) {
        // barriere → topphendelse: aktiv hvis barriere dekker hover-årsaken
        const arsakId = arsaker[hover.idx]?.id;
        return arsakId
          ? sortedBarrierer[l.barrIdx]?.arsakIds.includes(arsakId) === true
          : false;
      }
      return false;
    }
    if (hover.kind === "barriere") {
      return l.barrIdx === hover.idx;
    }
    return true;
  };

  const isArsakActive = (i: number): boolean => {
    if (!hover) return true;
    if (hover.kind === "arsak") return hover.idx === i;
    if (hover.kind === "barriere") {
      const b = sortedBarrierer[hover.idx];
      return b ? b.arsakIds.includes(arsaker[i]?.id) : false;
    }
    return true;
  };

  const isBarriereActive = (i: number): boolean => {
    if (!hover) return true;
    if (hover.kind === "barriere") return hover.idx === i;
    if (hover.kind === "arsak") {
      const arsakId = arsaker[hover.idx]?.id;
      const b = sortedBarrierer[i];
      return arsakId ? b.arsakIds.includes(arsakId) : false;
    }
    return true;
  };

  const colHeader = (color: string): React.CSSProperties => ({
    fontSize: 9,
    fontWeight: 700,
    color,
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  });

  return (
    <>
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          background: "#f7f9fc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        {/* SVG-linjer bak alt: hvit halo + farget linje */}
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
        >
          {/* Halo (hvit understrek for å skille kryssende linjer) */}
          {lines.map((l) => {
            const active = isLineActive(l);
            return (
              <path
                key={`halo-${l.key}`}
                d={l.d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={4}
                opacity={active ? 0.9 : 0.15}
              />
            );
          })}
          {/* Farget linje */}
          {lines.map((l) => {
            const active = isLineActive(l);
            return (
              <path
                key={l.key}
                d={l.d}
                fill="none"
                stroke={l.color}
                strokeWidth={2}
                strokeDasharray={l.dash}
                opacity={active ? 0.95 : 0.12}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Kolonnetitler */}
        <div style={{ position: "absolute", left: ARSAK.x, top: 8, width: ARSAK.w, zIndex: 2 }}>
          <p style={colHeader("#1e3a5f")}>Årsaker</p>
        </div>
        {harBarrierer && (
          <div style={{ position: "absolute", left: BARR.x, top: 8, width: BARR.w, zIndex: 2 }}>
            <p style={colHeader("#065f46")}>Felles barrierer</p>
          </div>
        )}
        <div style={{ position: "absolute", left: KONS.x, top: 8, width: KONS.w, zIndex: 2 }}>
          <p style={colHeader("#1e3a5f")}>Konsekvenser</p>
        </div>

        {/* Årsaker */}
        {arsaker.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: ARSAK.x,
              top: arsakY[0] - 10,
              width: ARSAK.w,
              fontSize: 10,
              fontStyle: "italic",
              color: "#64748b",
              zIndex: 2,
            }}
          >
            Ingen årsaker knyttet.
          </div>
        )}
        {arsaker.map((a, i) => {
          const f = FARGE[risikoFarge(a.sannsynlighet, a.konsekvens)];
          const active = isArsakActive(i);
          const col = colorForCause(i);
          return (
            <div
              key={a.id}
              onMouseEnter={() => setHover({ kind: "arsak", idx: i })}
              onMouseLeave={() => setHover(null)}
              style={{
                position: "absolute",
                left: ARSAK.x,
                top: arsakY[i] - 14,
                width: ARSAK.w,
                display: "flex",
                justifyContent: "flex-end",
                zIndex: 2,
                opacity: active ? 1 : 0.35,
                cursor: "pointer",
                transition: "opacity 120ms",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#fff",
                  border: `1px solid ${active ? col : "#cbd5e1"}`,
                  borderLeft: `4px solid ${col}`,
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  maxWidth: "100%",
                  boxShadow: active
                    ? `0 0 0 2px ${col}33, 0 1px 2px rgba(0,0,0,0.04)`
                    : "0 1px 2px rgba(0,0,0,0.04)",
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
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.tittel || a.sarbarhet || a.hendelse}
                </span>
              </div>
            </div>
          );
        })}

        {/* Felles barrierer */}
        {harBarrierer &&
          sortedBarrierer.map((b, i) => {
            const active = isBarriereActive(i);
            return (
              <div
                key={i}
                onMouseEnter={() => setHover({ kind: "barriere", idx: i })}
                onMouseLeave={() => setHover(null)}
                style={{
                  position: "absolute",
                  left: BARR.x,
                  top: barrY[i] - 20,
                  width: BARR.w,
                  background: "#ecfdf5",
                  border: "1px solid #10b981",
                  borderRadius: 4,
                  padding: "5px 8px",
                  fontSize: 10,
                  color: "#064e3b",
                  boxShadow: active
                    ? "0 0 0 2px #10b98155, 0 1px 2px rgba(0,0,0,0.04)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                  zIndex: 2,
                  opacity: active ? 1 : 0.35,
                  cursor: "pointer",
                  transition: "opacity 120ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#065f46", letterSpacing: 0.4 }}>
                    B{i + 1}
                  </span>
                  {/* Fargeprikker for hver dekket årsak */}
                  <div style={{ display: "flex", gap: 2 }}>
                    {b.arsakIds
                      .map((id) => arsakIndex.get(id))
                      .filter((x): x is number => x !== undefined)
                      .sort((a, b) => a - b)
                      .map((ai) => (
                        <span
                          key={ai}
                          title={arsaker[ai]?.tittel || ""}
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: colorForCause(ai),
                            border: "1px solid #ffffff",
                            boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                          }}
                        />
                      ))}
                  </div>
                </div>
                <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{b.tekst}</div>
              </div>
            );
          })}

        {/* Topphendelse */}
        <div
          style={{
            position: "absolute",
            left: TOPP.x,
            top: toppY,
            width: TOPP.w,
            height: topH,
            background: "#DC3545",
            color: "#fff",
            textAlign: "center",
            padding: "12px 10px",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(220,53,69,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
          }}
        >
          <div style={{ fontSize: 8, opacity: 0.85, letterSpacing: 1, marginBottom: 4 }}>TOPPHENDELSE</div>
          <div>{bt.navn || "Uten navn"}</div>
        </div>

        {/* Konsekvenser */}
        {bt.konsekvenser.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: KONS.x,
              top: konsY[0] - 10,
              width: KONS.w,
              fontSize: 10,
              fontStyle: "italic",
              color: "#64748b",
              zIndex: 2,
            }}
          >
            Ingen konsekvenser registrert.
          </div>
        )}
        {bt.konsekvenser.map((k, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: KONS.x,
              top: konsY[i] - 14,
              width: KONS.w,
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 10,
                maxWidth: "100%",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {k}
            </div>
          </div>
        ))}
      </div>

      {/* Hint / hjelpetekst */}
      {harBarrierer && (
        <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 8px 0", fontStyle: "italic" }}>
          Hver årsak har sin egen farge. Hold musepekeren over en årsak eller barriere for å fremheve koblingene. Fargeprikkene i barriere-kortene viser hvilke årsaker barrieren dekker.
        </p>
      )}

      {/* Dekningsmatrise (årsak × barriere) */}
      {harBarrierer && arsaker.length > 0 && sortedBarrierer.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "#1e3a5f", margin: "10px 0 4px 0" }}>
            Dekningsmatrise – hvilke barrierer som dekker hver årsak
          </p>
          <table style={{ ...tableStyle, fontSize: 9 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left", width: 180 }}>Årsak</th>
                {sortedBarrierer.map((_, bi) => (
                  <th key={bi} style={{ ...thStyle, textAlign: "center", width: 30 }} title={sortedBarrierer[bi].tekst}>
                    B{bi + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arsaker.map((a, ai) => (
                <tr key={a.id}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: colorForCause(ai),
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                    {a.tittel || a.sarbarhet || a.hendelse || "—"}
                  </td>
                  {sortedBarrierer.map((b, bi) => {
                    const dekket = b.arsakIds.includes(a.id);
                    return (
                      <td
                        key={bi}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          background: dekket ? "#ecfdf5" : undefined,
                          color: dekket ? "#065f46" : "#cbd5e1",
                          fontWeight: 700,
                        }}
                      >
                        {dekket ? "●" : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>
            {sortedBarrierer.map((b, bi) => (
              <div key={bi}>
                <strong>B{bi + 1}:</strong> {b.tekst}
              </div>
            ))}
          </div>
        </div>
      )}
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
