import React from "react";
import {
  BygningsTypeInfo,
  SIKKERHETSAVSTANDER,
  OPPSAMLING_KRAV,
  TANK_KRAV,
  BELIGGENHET_KRAV,
  KONTROLL_KRAV,
  DOKUMENTASJON_KRAV,
  PUMPE_KRAV,
  ROERLEDNING_KRAV,
  VENTIL_KRAV,
  STYKKGODS_GRENSER,
} from "@/lib/brensellagring-krav";

export type BrenselSectionKey =
  | "mengder"
  | "konstruksjon"
  | "avstander"
  | "beliggenhet"
  | "tankkrav"
  | "oppsamling"
  | "kontroll"
  | "dokumentasjon";

export const BRENSEL_SECTIONS: { key: BrenselSectionKey; label: string }[] = [
  { key: "mengder", label: "Tillatte mengder" },
  { key: "konstruksjon", label: "Konstruksjonskrav" },
  { key: "avstander", label: "Sikkerhetsavstander" },
  { key: "beliggenhet", label: "Beliggenhet og utforming" },
  { key: "tankkrav", label: "Krav til tanker" },
  { key: "oppsamling", label: "Oppsamling og overfyllingsvern" },
  { key: "kontroll", label: "Kontroll og tilstandskontroll" },
  { key: "dokumentasjon", label: "Dokumentasjonskrav" },
];

export interface PlannedAmountsData {
  gass_kat1: string;
  gass_kat2: string;
  vaeske_kat1: string;
  vaeske_kat2: string;
  vaeske_kat3: string;
  diesel_fyringsolje: string;
  aerosoler: string;
}

export type InnmeldingGruppeData = {
  id: string;
  kategori: string;
  sum: number;
  grenseLiter: number;
  grenseTekst: string;
  status: "over" | "under" | "ingen";
  gjenstaende: number;
};

export interface InnmeldingVurderingData {
  grupper: InnmeldingGruppeData[];
  trengerInnmelding: boolean;
  harMengder: boolean;
}

interface BrensellagringPreviewProps {
  valgtBygg: BygningsTypeInfo | null;
  prosjektNavn?: string;
  adresse?: string;
  visibleSections: Set<BrenselSectionKey>;
  selectedKravIds?: Set<string>;
  salgslokaleInkludert?: boolean;
  salgslokaleKommentar?: string;
  plannedInkludert?: boolean;
  plannedAmounts?: PlannedAmountsData;
  plannedKommentar?: string;
  brannenergiInkludert?: boolean;
  brannenergiKommentar?: string;
  etasjer?: { id: string; navn: string; lengde: string; bredde: string; hoyde: string }[];
  innledning?: string;
  energitetthet?: Record<keyof PlannedAmountsData, { verdi: number; enhet: "MJ/kg" | "MJ/L"; kilde: string }>;
  innmeldingInkludert?: boolean;
  innmeldingKommentar?: string;
  innmeldingVurdering?: InnmeldingVurderingData;
}

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
  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  marginBottom: 24,
};

const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginTop: 28, marginBottom: 10, color: "#1e3a5f", borderBottom: "2px solid #1e3a5f", paddingBottom: 5 };
const h3: React.CSSProperties = { fontSize: 12, fontWeight: 600, marginTop: 20, marginBottom: 8, color: "#2d4a6f" };

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

const BrensellagringPreview: React.FC<BrensellagringPreviewProps> = ({
  valgtBygg,
  prosjektNavn,
  adresse,
  visibleSections,
  selectedKravIds = new Set(),
  salgslokaleInkludert = false,
  salgslokaleKommentar = "",
  plannedInkludert = false,
  plannedAmounts,
  plannedKommentar = "",
  brannenergiInkludert = false,
  brannenergiKommentar = "",
  etasjer = [],
  innledning = "",
  energitetthet,
  innmeldingInkludert = false,
  innmeldingKommentar = "",
  innmeldingVurdering,
}) => {
  if (!valgtBygg) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ingen data valgt</p>
          <p style={{ fontSize: 12 }}>Velg en bygningstype for å generere dokumentet.</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
  const tillatteBrensler = valgtBygg ? valgtBygg.grenser.filter(g => g.maksLiter !== null || g.maksKg) : [];

  // Filter krav items by selectedKravIds
  const selBeliggenhet = BELIGGENHET_KRAV.filter((_, i) => selectedKravIds.has(`beliggenhet_${i}`));
  const selTank = TANK_KRAV.filter((_, i) => selectedKravIds.has(`tank_${i}`));
  const selPumpe = PUMPE_KRAV.filter((_, i) => selectedKravIds.has(`pumpe_${i}`));
  const selOppsamling = OPPSAMLING_KRAV.filter((_, i) => selectedKravIds.has(`oppsamling_${i}`));
  const selRoer = ROERLEDNING_KRAV.filter((_, i) => selectedKravIds.has(`roer_${i}`));
  const selVentil = VENTIL_KRAV.filter((_, i) => selectedKravIds.has(`ventil_${i}`));
  const selKontroll = KONTROLL_KRAV.filter((_, i) => selectedKravIds.has(`kontroll_${i}`));
  const selDok = DOKUMENTASJON_KRAV.filter((_, i) => selectedKravIds.has(`dok_${i}`));

  // Planlagte mengder – bygg liste over felt med faktisk innfylte verdier
  const PLANNED_LABELS: Record<keyof PlannedAmountsData, { label: string; enhet: string }> = {
    gass_kat1: { label: "Brannfarlig gass, kategori 1", enhet: "kg" },
    gass_kat2: { label: "Brannfarlig gass, kategori 2", enhet: "kg" },
    vaeske_kat1: { label: "Brannfarlig væske, kategori 1", enhet: "liter" },
    vaeske_kat2: { label: "Brannfarlig væske, kategori 2", enhet: "liter" },
    vaeske_kat3: { label: "Brannfarlig væske, kategori 3", enhet: "liter" },
    diesel_fyringsolje: { label: "Diesel / fyringsolje", enhet: "liter" },
    aerosoler: { label: "Aerosoler", enhet: "liter" },
  };
  const plannedRows = plannedAmounts
    ? (Object.keys(PLANNED_LABELS) as (keyof PlannedAmountsData)[])
        .map((k) => ({
          key: k,
          label: PLANNED_LABELS[k].label,
          enhet: PLANNED_LABELS[k].enhet,
          verdi: (plannedAmounts[k] || "").trim(),
        }))
        .filter((r) => r.verdi !== "" && parseFloat(r.verdi) > 0)
    : [];
  const visPlanlagt = plannedInkludert && plannedRows.length > 0;

  // Brannenergi – beregning
  const energiBidrag = (plannedAmounts && energitetthet)
    ? (Object.keys(PLANNED_LABELS) as (keyof PlannedAmountsData)[])
        .map((k) => {
          const m = parseFloat((plannedAmounts[k] || "").trim());
          if (!(m > 0)) return null;
          const e = energitetthet[k];
          if (!e) return null;
          return {
            key: k,
            label: PLANNED_LABELS[k].label,
            enhetInn: PLANNED_LABELS[k].enhet,
            mengde: m,
            energi: e.verdi,
            enhetEnergi: e.enhet,
            totalMJ: m * e.verdi,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : [];
  const totalMJ = energiBidrag.reduce((s, b) => s + b.totalMJ, 0);
  const etasjerBeregnet = etasjer.map((et) => {
    const L = parseFloat(et.lengde || "");
    const B = parseFloat(et.bredde || "");
    const H = parseFloat(et.hoyde || "");
    const gyldig = L > 0 && B > 0 && H > 0;
    const omh = gyldig ? 2 * (L * B) + 2 * (L * H) + 2 * (B * H) : 0;
    return { ...et, L, B, H, gyldig, omh };
  });
  const omhylling = etasjerBeregnet.reduce((s, e) => s + e.omh, 0);
  const dimGyldig = etasjerBeregnet.some((e) => e.gyldig);
  const spesifikkMJm2 = dimGyldig && omhylling > 0 ? totalMJ / omhylling : null;
  const visBrannenergi = brannenergiInkludert && energiBidrag.length > 0;
  const visInnmelding = innmeldingInkludert && !!innmeldingVurdering && innmeldingVurdering.harMengder;
  const formatMJ = (v: number) => {
    const r = v >= 10000 ? Math.round(v / 100) * 100 : Math.round(v);
    return r.toLocaleString("nb-NO");
  };

  // Build visible sections dynamically based on selected items
  const sections: { key: string; label: string }[] = [];
  if (visPlanlagt) sections.push({ key: "planlagt", label: "Planlagt lagret mengde i bygget" });
  if (visBrannenergi) sections.push({ key: "brannenergi", label: "Brannenergi i bygget" });
  if (visInnmelding) sections.push({ key: "innmelding", label: "Innmeldingsplikt til DSB" });
  if (salgslokaleInkludert) sections.push({ key: "salgslokale", label: "Største tillatte mengder i salgslokaler" });
  if (selBeliggenhet.length > 0) sections.push({ key: "beliggenhet", label: "Beliggenhet og utforming" });
  if (visibleSections.has("avstander")) sections.push({ key: "avstander", label: "Sikkerhetsavstander" });
  if (selTank.length > 0 || selPumpe.length > 0) sections.push({ key: "tankkrav", label: "Krav til tanker" });
  if (selOppsamling.length > 0) sections.push({ key: "oppsamling", label: "Oppsamling og overfyllingsvern" });
  if (selRoer.length > 0 || selVentil.length > 0) sections.push({ key: "roer", label: "Rørledninger og ventiler" });
  if (selKontroll.length > 0) sections.push({ key: "kontroll", label: "Kontroll og tilstandskontroll" });
  if (selDok.length > 0) sections.push({ key: "dokumentasjon", label: "Dokumentasjonskrav" });
  if (visibleSections.has("mengder") && valgtBygg) sections.push({ key: "mengder", label: "Tillatte mengder" });
  if (visibleSections.has("konstruksjon") && valgtBygg) sections.push({ key: "konstruksjon", label: "Konstruksjonskrav" });

  const secNum = (key: string) => sections.findIndex(s => s.key === key) + 1;
  const hasAnySections = sections.length > 0;

  return (
    <div>
      <div style={pageStyle}>
        {/* Header bar */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "16px 20px", borderRadius: 6, marginBottom: 20 }}>
          <p style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>KRAVDOKUMENT</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Lagring av brannfarlig stoff</p>
          {valgtBygg && <p style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{valgtBygg.navn}</p>}
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
            {valgtBygg && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600 }}>Bygningstype</td>
                <td style={tdStyle}>{valgtBygg.navn}</td>
              </tr>
            )}
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

        {valgtBygg && <p style={{ fontSize: 10, color: "#64748b", marginBottom: 24 }}>{valgtBygg.beskrivelse}</p>}

        {innledning.trim() && (
          <>
            <h2 style={h2}>Innledning</h2>
            <p style={{ fontSize: 11, color: "#1a1a1a", whiteSpace: "pre-wrap", marginBottom: 16 }}>
              {innledning}
            </p>
          </>
        )}

        {!hasAnySections && (
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 40 }}>
            Ingen seksjoner valgt. Velg relevante krav i panelet til venstre.
          </p>
        )}

        {visPlanlagt && (
          <>
            <h2 style={h2}>{secNum("planlagt")}. Planlagt lagret mengde i bygget</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Oversikt over planlagt lagrede mengder brannfarlig stoff i bygget, fordelt på kategori.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Kategori</th>
                  <th style={{ ...thStyle, width: "30%" }}>Planlagt mengde</th>
                </tr>
              </thead>
              <tbody>
                {plannedRows.map((r) => (
                  <tr key={r.key}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{r.label}</td>
                    <td style={tdStyle}>
                      {Number(r.verdi).toLocaleString("nb-NO")} {r.enhet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plannedKommentar.trim() && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{plannedKommentar}</p>
              </div>
            )}
          </>
        )}

        {visBrannenergi && (
          <>
            <h2 style={h2}>{secNum("brannenergi")}. Brannenergi i bygget</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Sjablong-beregning av total og spesifikk brannenergi basert på planlagte mengder. Energitettheter er hentet fra SFPE Handbook of Fire Protection Engineering og NS-EN 1991-1-2.
            </p>

            {dimGyldig && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Etasje</th>
                    <th style={thStyle}>Lengde</th>
                    <th style={thStyle}>Bredde</th>
                    <th style={thStyle}>Høyde</th>
                    <th style={thStyle}>Omhyllingsflate</th>
                  </tr>
                </thead>
                <tbody>
                  {etasjerBeregnet.filter((e) => e.gyldig).map((e) => (
                    <tr key={e.id}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{e.navn || "Etasje"}</td>
                      <td style={tdStyle}>{e.L.toLocaleString("nb-NO")} m</td>
                      <td style={tdStyle}>{e.B.toLocaleString("nb-NO")} m</td>
                      <td style={tdStyle}>{e.H.toLocaleString("nb-NO")} m</td>
                      <td style={tdStyle}>{e.omh.toFixed(1)} m²</td>
                    </tr>
                  ))}
                  {etasjerBeregnet.filter((e) => e.gyldig).length > 1 && (
                    <tr>
                      <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#f1f5f9" }}>
                        Total omhyllingsflate A<sub>t</sub>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, background: "#f1f5f9" }}>{omhylling.toFixed(1)} m²</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Kategori</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Mengde</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Energi</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Bidrag</th>
                </tr>
              </thead>
              <tbody>
                {energiBidrag.map((b) => (
                  <tr key={b.key}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{b.label}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {b.mengde.toLocaleString("nb-NO")} {b.enhetInn}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#64748b" }}>
                      {b.energi} {b.enhetEnergi}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                      {formatMJ(b.totalMJ)} MJ
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#f1f5f9" }}>
                    Total brannenergi
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#f1f5f9" }}>
                    {formatMJ(totalMJ)} MJ
                  </td>
                </tr>
                {spesifikkMJm2 !== null && (
                  <tr>
                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>
                      Spesifikk brannenergi (per m² omhyllingsflate)
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>
                      {spesifikkMJm2.toFixed(1)} MJ/m²
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {brannenergiKommentar.trim() && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{brannenergiKommentar}</p>
              </div>
            )}

            <p style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic", marginBottom: 16 }}>
              Sjablongverdier ivaretar ikke fuktinnhold, sammensetning eller emballasje. Beregningen brukes kun til indikativ vurdering av brannenergi i bygget.
            </p>
          </>
        )}

        {salgslokaleInkludert && (
          <>
            <h2 style={h2}>{secNum("salgslokale")}. Største tillatte mengder i salgslokaler</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Mengdegrensene avhenger av salgslokalets areal iht. DSB Temaveiledning Kap. 3 – Oppbevaring av brannfarlig stoff i transport- og brukeremballasje (stykkgods), § 6.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Salgslokalets areal</th>
                  <th style={thStyle}>Aerosoler</th>
                  <th style={thStyle}>Brannfarlig gass</th>
                  <th style={thStyle}>Br.f. væske kat. 1 og 2</th>
                  <th style={thStyle}>Br.f. væske kat. 3</th>
                </tr>
              </thead>
              <tbody>
                {STYKKGODS_GRENSER.map((g, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{g.arealBeskrivelse}</td>
                    <td style={tdStyle}>{g.aerosoler} L</td>
                    <td style={tdStyle}>{g.brannfarligGass}</td>
                    <td style={tdStyle}>{g.brannfarligVaeskeKat1og2} L</td>
                    <td style={tdStyle}>{g.brannfarligVaeskeKat3.toLocaleString("nb-NO")} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {salgslokaleKommentar.trim() && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{salgslokaleKommentar}</p>
              </div>
            )}
          </>
        )}

        {visibleSections.has("mengder") && valgtBygg && (
          <>
            <h2 style={h2}>{secNum("mengder")}. Tillatte mengder</h2>
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
          </>
        )}

        {/* 2. Konstruksjonskrav */}
        {visibleSections.has("konstruksjon") && (
          <>
            <h2 style={h2}>{secNum("konstruksjon")}. Konstruksjonskrav</h2>
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
          </>
        )}

        {/* Sikkerhetsavstander */}
        {visibleSections.has("avstander") && (
          <>
            <h2 style={h2}>{secNum("avstander")}. Sikkerhetsavstander (§ 15.11)</h2>
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
          </>
        )}

        {/* Beliggenhet – filtered */}
        {selBeliggenhet.length > 0 && (
          <>
            <h2 style={h2}>{secNum("beliggenhet")}. Beliggenhet og utforming (§ 15.1)</h2>
            {selBeliggenhet.map((krav, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
                <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
              </div>
            ))}
          </>
        )}

        {/* Tankkrav – filtered */}
        {(selTank.length > 0 || selPumpe.length > 0) && (
          <>
            <h2 style={h2}>{secNum("tankkrav")}. Krav til tanker (§ 15.2)</h2>
            {selTank.map((krav, i) => (
              <div key={`t${i}`} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
                <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
              </div>
            ))}
            {selPumpe.length > 0 && (
              <>
                <h3 style={h3}>Pumper og pumperom (§ 15.6)</h3>
                {selPumpe.map((krav, i) => (
                  <div key={`p${i}`} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
                    <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Oppsamling – filtered */}
        {selOppsamling.length > 0 && (
          <>
            <h2 style={h2}>{secNum("oppsamling")}. Oppsamling og overfyllingsvern (§ 15.3)</h2>
            {selOppsamling.map((krav, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
                  {krav.paragraf && <span style={{ fontSize: 8, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{krav.paragraf}</span>}
                </div>
                <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
              </div>
            ))}
          </>
        )}

        {/* Rørledninger & ventiler – filtered */}
        {(selRoer.length > 0 || selVentil.length > 0) && (
          <>
            <h2 style={h2}>{secNum("roer")}. Rørledninger og ventiler</h2>
            {selRoer.length > 0 && (
              <>
                <h3 style={h3}>Rørledninger (§ 15.4)</h3>
                {selRoer.map((krav, i) => (
                  <div key={`r${i}`} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
                    <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
                  </div>
                ))}
              </>
            )}
            {selVentil.length > 0 && (
              <>
                <h3 style={h3}>Ventiler (§ 15.5)</h3>
                {selVentil.map((krav, i) => (
                  <div key={`v${i}`} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{krav.tittel}</p>
                    <p style={{ fontSize: 10, color: "#475569" }}>{krav.beskrivelse}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Kontroll – filtered */}
        {selKontroll.length > 0 && (
          <>
            <h2 style={h2}>{secNum("kontroll")}. Kontroll og tilstandskontroll (§ 9)</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Kontrolltype</th>
                  <th style={thStyle}>Beskrivelse</th>
                  <th style={{ ...thStyle, width: "15%" }}>Intervall</th>
                </tr>
              </thead>
              <tbody>
                {selKontroll.map((krav, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{krav.tittel}</td>
                    <td style={tdStyle}>{krav.beskrivelse}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{krav.intervall || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Dokumentasjon – filtered */}
        {selDok.length > 0 && (
          <>
            <h2 style={h2}>{secNum("dokumentasjon")}. Dokumentasjonskrav (§ 13)</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Type dokumentasjon</th>
                  <th style={{ ...thStyle, width: "15%" }}>Referanse</th>
                </tr>
              </thead>
              <tbody>
                {selDok.map((dok, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{dok.type}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{dok.referanse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Footer */}
        {hasAnySections && (
          <div style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #e2e8f0", fontSize: 9, color: "#94a3b8" }}>
            <p>Kilde: DSB Temaveiledning om oppbevaring av farlig stoff og VTEK § 11-8 (TEK17).</p>
            <p>Dokumentet er generert automatisk og skal kvalitetssikres av ansvarlig brannrådgiver.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrensellagringPreview;
