import React from "react";
import {
  BygningsTypeInfo,
  SIKKERHETSAVSTANDER,
  OPPSAMLING_KRAV,
  TANK_KRAV,
  BELIGGENHET_KRAV,
  KONTROLL_KRAV,
  DOKUMENTASJON_KRAV,
} from "@/lib/brensellagring-krav";

interface BrensellagringPreviewProps {
  valgtBygg: BygningsTypeInfo | null;
  prosjektNavn?: string;
  adresse?: string;
}

const pageStyle: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  background: "#fff",
  color: "#1a1a1a",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  fontSize: 11,
  lineHeight: 1.5,
  padding: "20mm 18mm 24mm 18mm",
  boxSizing: "border-box",
  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  marginBottom: 24,
};

const h1: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 4, color: "#1e3a5f" };
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 8, color: "#1e3a5f", borderBottom: "2px solid #1e3a5f", paddingBottom: 4 };
const h3: React.CSSProperties = { fontSize: 12, fontWeight: 600, marginTop: 16, marginBottom: 6, color: "#2d4a6f" };

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  fontSize: 10,
  fontWeight: 600,
  background: "#e8eef5",
  borderBottom: "2px solid #bbc8d9",
  color: "#1e3a5f",
};

const tdStyle: React.CSSProperties = {
  padding: "5px 8px",
  fontSize: 10,
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const BrensellagringPreview: React.FC<BrensellagringPreviewProps> = ({
  valgtBygg,
  prosjektNavn,
  adresse,
}) => {
  if (!valgtBygg) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ingen bygningstype valgt</p>
          <p style={{ fontSize: 12 }}>Velg en bygningstype til venstre for å generere kravdokumentet.</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
  const tillatteBrensler = valgtBygg.grenser.filter(g => g.maksLiter !== null || g.maksKg);

  return (
    <div>
      {/* ===== PAGE 1: Cover + Mengder + Konstruksjonskrav ===== */}
      <div style={pageStyle}>
        {/* Header bar */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "16px 20px", borderRadius: 6, marginBottom: 20 }}>
          <p style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>KRAVDOKUMENT</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Lagring av brannfarlig stoff</p>
          <p style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{valgtBygg.navn}</p>
        </div>

        {/* Project info */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <tbody>
            {prosjektNavn && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, width: 140 }}>Prosjekt</td>
                <td style={tdStyle}>{prosjektNavn}</td>
              </tr>
            )}
            {adresse && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600 }}>Adresse</td>
                <td style={tdStyle}>{adresse}</td>
              </tr>
            )}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 600 }}>Bygningstype</td>
              <td style={tdStyle}>{valgtBygg.navn}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 600 }}>Dato</td>
              <td style={tdStyle}>{today}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 600 }}>Regelverk</td>
              <td style={tdStyle}>VTEK § 11-8, DSB Temaveiledning om oppbevaring av farlig stoff</td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: 10, color: "#64748b", marginBottom: 24 }}>{valgtBygg.beskrivelse}</p>

        {/* 1. Tillatte mengder */}
        <h2 style={h2}>1. Tillatte mengder</h2>
        <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
          Oversikt over maksimalt tillatte mengder brannfarlig stoff for {valgtBygg.navn.toLowerCase()} iht. VTEK § 11-8.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={thStyle}>Brenseltype</th>
              <th style={thStyle}>Maks mengde</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {valgtBygg.grenser.map((g) => (
              <tr key={g.brenselType}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{g.brenselNavn}</td>
                <td style={tdStyle}>
                  {g.maksLiter === null && !g.maksKg
                    ? "—"
                    : g.maksKg
                    ? `${g.maksKg.toLocaleString("nb-NO")} kg`
                    : `${g.maksLiter!.toLocaleString("nb-NO")} liter`}
                </td>
                <td style={tdStyle}>
                  {g.maksLiter === null && !g.maksKg ? (
                    <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 10 }}>Ikke tillatt</span>
                  ) : (
                    <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 10 }}>Tillatt</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2. Konstruksjonskrav per brensel */}
        <h2 style={h2}>2. Konstruksjonskrav</h2>
        {tillatteBrensler.map((g) => (
          <div key={g.brenselType} style={{ marginBottom: 16 }}>
            <h3 style={h3}>
              {g.brenselNavn} – maks {g.maksKg ? `${g.maksKg} kg` : `${g.maksLiter?.toLocaleString("nb-NO")} liter`}
            </h3>
            {g.romKrav.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "20%" }}>Kategori</th>
                    <th style={thStyle}>Krav</th>
                    <th style={{ ...thStyle, width: "10%" }}>Ansvar</th>
                    <th style={{ ...thStyle, width: "15%" }}>Referanse</th>
                  </tr>
                </thead>
                <tbody>
                  {g.romKrav.map((k, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{k.kategori}</td>
                      <td style={tdStyle}>{k.tekst}</td>
                      <td style={{ ...tdStyle, color: "#64748b" }}>{k.ansvar}</td>
                      <td style={{ ...tdStyle, fontSize: 9 }}>{k.referanse?.label || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>Ingen spesifikke konstruksjonskrav definert.</p>
            )}
          </div>
        ))}
      </div>

      {/* ===== PAGE 2: DSB-krav ===== */}
      <div style={pageStyle}>
        {/* 3. Sikkerhetsavstander */}
        <h2 style={h2}>3. Sikkerhetsavstander (§ 15.11)</h2>
        <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
          Veiledende minsteavstander mellom tank og nærliggende objekter.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr>
              <th style={thStyle}>Objekt</th>
              <th style={thStyle}>Kat. 1 & 2</th>
              <th style={thStyle}>Kat. 3</th>
              <th style={thStyle}>Diesel/fyringsolje</th>
            </tr>
          </thead>
          <tbody>
            {SIKKERHETSAVSTANDER.map((rad, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{rad.objekt}</td>
                <td style={tdStyle}>{rad.kat1og2}</td>
                <td style={tdStyle}>{rad.kat3}</td>
                <td style={tdStyle}>{rad.dieselFyringsolje}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Beliggenhet */}
        <h2 style={h2}>4. Beliggenhet og utforming (§ 15.1)</h2>
        {BELIGGENHET_KRAV.map((krav, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
            <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
          </div>
        ))}

        {/* 5. Tankkrav */}
        <h2 style={h2}>5. Krav til tanker (§ 15.2)</h2>
        {TANK_KRAV.map((krav, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
            <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
          </div>
        ))}
      </div>

      {/* ===== PAGE 3: Oppsamling, Kontroll, Dokumentasjon ===== */}
      <div style={pageStyle}>
        {/* 6. Oppsamling */}
        <h2 style={h2}>6. Oppsamling og overfyllingsvern (§ 15.3)</h2>
        {OPPSAMLING_KRAV.map((krav, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
              {krav.paragraf && <span style={{ fontSize: 8, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{krav.paragraf}</span>}
            </div>
            <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
          </div>
        ))}

        {/* 7. Kontroll */}
        <h2 style={h2}>7. Kontroll og tilstandskontroll (§ 9)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={thStyle}>Kontrolltype</th>
              <th style={thStyle}>Beskrivelse</th>
              <th style={{ ...thStyle, width: "15%" }}>Intervall</th>
            </tr>
          </thead>
          <tbody>
            {KONTROLL_KRAV.map((krav, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{krav.tittel}</td>
                <td style={tdStyle}>{krav.beskrivelse}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{krav.intervall || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 8. Dokumentasjon */}
        <h2 style={h2}>8. Dokumentasjonskrav (§ 13)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={thStyle}>Type dokumentasjon</th>
              <th style={{ ...thStyle, width: "15%" }}>Referanse</th>
            </tr>
          </thead>
          <tbody>
            {DOKUMENTASJON_KRAV.map((dok, i) => (
              <tr key={i}>
                <td style={tdStyle}>{dok.type}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{dok.referanse}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #e2e8f0", fontSize: 9, color: "#94a3b8" }}>
          <p>Kilde: DSB Temaveiledning om oppbevaring av farlig stoff og VTEK § 11-8 (TEK17).</p>
          <p>Dokumentet er generert automatisk og skal kvalitetssikres av ansvarlig brannrådgiver.</p>
        </div>
      </div>
    </div>
  );
};

export default BrensellagringPreview;
