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

export interface OverskridelseRowData {
  id: string;
  stoffgruppe: string;
  anbefaltMengde: number;
  planlagtMengde: number;
  enhet: string;
  overskridelse: number;
  overskridelseProsent: number;
  vurdertTillattMengde: string;
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

export interface BranntekniskeTiltakData {
  brannalarm: { status: string; beskrivelse: string; kommentar: string; rapporttekst?: string };
  roykventilasjon: { status: string; type: string; beskrivelse: string; rapporttekst?: string };
  slokkeanlegg: { status: string; type: string; beskrivelse: string; rapporttekst?: string };
  generellKommentar: string;
}

interface BrensellagringPreviewProps {
  valgtBygg: BygningsTypeInfo | null;
  firmaNavn?: string;
  kunde?: string;
  utarbeidetAv?: string;
  ksAnsvarlig?: string;
  logoUrl?: string;
  prosjektNavn?: string;
  adresse?: string;
  visibleSections: Set<BrenselSectionKey>;
  selectedKravIds?: Set<string>;
  salgslokaleInkludert?: boolean;
  salgslokaleKommentar?: string;
  salgslokaleTiltakTekst?: string;
  totalInkludert?: boolean;
  totalAmounts?: PlannedAmountsData;
  totalKommentar?: string;
  plannedInkludert?: boolean;
  plannedAmounts?: PlannedAmountsData;
  plannedKommentar?: string;
  overskridelseInkludert?: boolean;
  overskridelseRows?: OverskridelseRowData[];
  overskridelseArealgrunnlag?: string;
  overskridelseVurderingstekst?: string;
  overskridelseKonklusjon?: string;
  overskridelseTiltak?: string;
  brannenergiInkludert?: boolean;
  brannenergiKommentar?: string;
  generellBrannenergiMJm2?: string;
  byggBrannenergiInkludert?: boolean;
  byggBrannenergiGrenseMJm2?: string;
  byggBrannenergiEtasjer?: { id: string; navn: string; lengde: string; bredde: string; hoyde: string }[];
  byggBrannenergiGulvarealM2?: string;
  byggBrannenergiOmhyllingsflateM2?: string;
  byggBrannenergiKommentar?: string;
  etasjer?: { id: string; navn: string; lengde: string; bredde: string; hoyde: string }[];
  innledning?: string;
  energitetthet?: Record<keyof PlannedAmountsData, { verdi: number; enhet: "MJ/kg" | "MJ/L"; kilde: string }>;
  innmeldingInkludert?: boolean;
  innmeldingKommentar?: string;
  innmeldingVurdering?: InnmeldingVurderingData;
  branntekniskeTiltakInkludert?: boolean;
  branntekniskeTiltak?: BranntekniskeTiltakData;
  harTankanlegg?: boolean | null;
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
  firmaNavn,
  kunde,
  utarbeidetAv,
  ksAnsvarlig,
  logoUrl,
  prosjektNavn,
  adresse,
  visibleSections,
  selectedKravIds = new Set(),
  salgslokaleInkludert = false,
  salgslokaleKommentar = "",
  salgslokaleTiltakTekst = "",
  totalInkludert = false,
  totalAmounts,
  totalKommentar = "",
  plannedInkludert = false,
  plannedAmounts,
  plannedKommentar = "",
  overskridelseInkludert = false,
  overskridelseRows = [],
  overskridelseArealgrunnlag = "",
  overskridelseVurderingstekst = "",
  overskridelseKonklusjon = "",
  overskridelseTiltak = "",
  brannenergiInkludert = false,
  brannenergiKommentar = "",
  generellBrannenergiMJm2 = "730",
  byggBrannenergiInkludert = false,
  byggBrannenergiGrenseMJm2 = "",
  byggBrannenergiEtasjer = [],
  byggBrannenergiGulvarealM2 = "",
  byggBrannenergiOmhyllingsflateM2 = "",
  byggBrannenergiKommentar = "",
  etasjer = [],
  innledning = "",
  energitetthet,
  innmeldingInkludert = false,
  innmeldingKommentar = "",
  innmeldingVurdering,
  branntekniskeTiltakInkludert = false,
  branntekniskeTiltak,
  harTankanlegg = null,
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
  const selKontroll = KONTROLL_KRAV
    .map((krav, index) => ({ krav, index }))
    .filter(({ krav, index }) => selectedKravIds.has(`kontroll_${index}`) && (harTankanlegg !== false || krav.gjelder === "alle"));
  const selDok = DOKUMENTASJON_KRAV.filter((_, i) => selectedKravIds.has(`dok_${i}`));
  const kontrollGenerelt = harTankanlegg === false
    ? [
        "Visuell kontroll av emballasje, merking og hylleinnredning",
        "Kontroll av brannskap, oppsamlingskar og håndtering av lekkasjer",
        "Kontroll av ventilasjon i lagerrom",
        "Tilgjengelighet til slokkeutstyr og rømningsveier",
        "Kontrollrapport med avvik og nødvendige tiltak",
      ]
    : [
        "Visuell kontroll av tanker og rørføringer",
        "Korrosjonskontroll",
        "Tetthetsprøving, evt. trykkprøving",
        "Kontroll av viktige komponenter",
        "Testing av sikkerhetsfunksjoner og -kritisk utstyr",
        "Gjennomgang av dokumentasjon om reparasjoner og endringer",
        "Kontrollrapport med avvik, tiltak og tidspunkt for neste kontroll",
      ];

  // Planlagte mengder – bygg liste over felt med faktisk innfylte verdier
  const PLANNED_LABELS: Record<keyof PlannedAmountsData, { label: string; enhet: string }> = {
    gass_kat1: { label: "Brannfarlig gass, kategori 1", enhet: "kg" },
    gass_kat2: { label: "Brannfarlig gass, kategori 2", enhet: "kg" },
    vaeske_kat1: { label: "Brannfarlig væske, kategori 1 og 2", enhet: "liter" },
    vaeske_kat2: { label: "Brannfarlig væske, kategori 2", enhet: "liter" },
    vaeske_kat3: { label: "Brannfarlig væske, kategori 3", enhet: "liter" },
    diesel_fyringsolje: { label: "Diesel / fyringsolje", enhet: "liter" },
    aerosoler: { label: "Aerosoler", enhet: "liter" },
  };
  const totalRows = totalAmounts
    ? (Object.keys(PLANNED_LABELS) as (keyof PlannedAmountsData)[])
        .map((k) => ({
          key: k,
          label: PLANNED_LABELS[k].label,
          enhet: PLANNED_LABELS[k].enhet,
          verdi: k === "vaeske_kat2" ? "" : (totalAmounts[k] || "").trim(),
        }))
        .filter((r) => r.verdi !== "" && parseFloat(r.verdi) > 0)
    : [];
  const visTotal = totalInkludert && totalRows.length > 0;
  const plannedRows = plannedAmounts
    ? (Object.keys(PLANNED_LABELS) as (keyof PlannedAmountsData)[])
        .map((k) => ({
          key: k,
          label: PLANNED_LABELS[k].label,
          enhet: PLANNED_LABELS[k].enhet,
          verdi: k === "vaeske_kat2" ? "" : (plannedAmounts[k] || "").trim(),
        }))
        .filter((r) => r.verdi !== "" && parseFloat(r.verdi) > 0)
    : [];
  const visPlanlagt = plannedInkludert && plannedRows.length > 0;
  const visOverskridelse = overskridelseInkludert && overskridelseRows.length > 0;

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
  const tilleggsMJ = energiBidrag.reduce((s, b) => s + b.totalMJ, 0);
  const byggEnergiBidrag = (totalAmounts && energitetthet)
    ? (Object.keys(PLANNED_LABELS) as (keyof PlannedAmountsData)[])
        .map((k) => {
          const m = parseFloat((totalAmounts[k] || "").trim());
          if (!(m > 0)) return null;
          const e = energitetthet[k];
          if (!e) return null;
          return { key: k, label: PLANNED_LABELS[k].label, enhetInn: PLANNED_LABELS[k].enhet, mengde: m, energi: e.verdi, enhetEnergi: e.enhet, totalMJ: m * e.verdi };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : [];
  const byggTilleggsMJ = byggEnergiBidrag.reduce((s, b) => s + b.totalMJ, 0);
  const byggGulvareal = parseFloat(byggBrannenergiGulvarealM2) || 0;
  const byggOmhylling = parseFloat(byggBrannenergiOmhyllingsflateM2) || 0;
  const generellMJm2 = parseFloat(generellBrannenergiMJm2) || 0;
  const etasjerBeregnet = etasjer.map((et) => {
    const L = parseFloat(et.lengde || "");
    const B = parseFloat(et.bredde || "");
    const H = parseFloat(et.hoyde || "");
    const gyldig = L > 0 && B > 0 && H > 0;
    const gulvareal = gyldig ? L * B : 0;
    const omh = gyldig ? 2 * (L * B) + 2 * (L * H) + 2 * (B * H) : 0;
    return { ...et, L, B, H, gyldig, gulvareal, omh };
  });
  const gulvareal = etasjerBeregnet.reduce((s, e) => s + e.gulvareal, 0);
  const omhylling = etasjerBeregnet.reduce((s, e) => s + e.omh, 0);
  const dimGyldig = etasjerBeregnet.some((e) => e.gyldig);
  const generellMJ = generellMJm2 * gulvareal;
  const totalMedTilleggMJ = generellMJ + tilleggsMJ;
  const byggGenerellMJ = generellMJm2 * byggGulvareal;
  const byggTotalMedTilleggMJ = byggGenerellMJ + byggTilleggsMJ;
  const spesifikkGenerell = dimGyldig && omhylling > 0 ? generellMJ / omhylling : null;
  const spesifikkTillegg = dimGyldig && omhylling > 0 ? tilleggsMJ / omhylling : null;
  const spesifikkTotal = dimGyldig && omhylling > 0 ? totalMedTilleggMJ / omhylling : null;
  const byggDimGyldig = byggGulvareal > 0 && byggOmhylling > 0;
  const byggSpesifikkGenerell = byggDimGyldig ? byggGenerellMJ / byggOmhylling : null;
  const byggSpesifikkTillegg = byggDimGyldig ? byggTilleggsMJ / byggOmhylling : null;
  const byggSpesifikkTotal = byggDimGyldig ? byggTotalMedTilleggMJ / byggOmhylling : null;
  const byggGrense = parseFloat(byggBrannenergiGrenseMJm2) || 0;
  const okningProsent = generellMJ > 0 ? (tilleggsMJ / generellMJ) * 100 : null;
  const visBrannenergi = brannenergiInkludert && energiBidrag.length > 0;
  const visByggBrannenergi = byggBrannenergiInkludert && byggEnergiBidrag.length > 0;
  const visInnmelding = innmeldingInkludert && !!innmeldingVurdering && innmeldingVurdering.harMengder;
  const branntekniskeTiltakRows = branntekniskeTiltak
    ? [
        {
          tiltak: "Brannalarmanlegg",
          status: branntekniskeTiltak.brannalarm.status,
          beskrivelse: [branntekniskeTiltak.brannalarm.beskrivelse, branntekniskeTiltak.brannalarm.kommentar].filter(Boolean).join("\n"),
          rapporttekst: branntekniskeTiltak.brannalarm.rapporttekst || "",
        },
        {
          tiltak: "Røykventilasjon",
          status: branntekniskeTiltak.roykventilasjon.status,
          beskrivelse: [branntekniskeTiltak.roykventilasjon.type, branntekniskeTiltak.roykventilasjon.beskrivelse].filter(Boolean).join("\n"),
          rapporttekst: branntekniskeTiltak.roykventilasjon.rapporttekst || "",
        },
        {
          tiltak: "Automatisk slokkeanlegg",
          status: branntekniskeTiltak.slokkeanlegg.status,
          beskrivelse: [branntekniskeTiltak.slokkeanlegg.type, branntekniskeTiltak.slokkeanlegg.beskrivelse].filter(Boolean).join("\n"),
          rapporttekst: branntekniskeTiltak.slokkeanlegg.rapporttekst || "",
        },
      ].filter((row) => row.status.trim() || row.beskrivelse.trim() || row.rapporttekst.trim())
    : [];
  const visBranntekniskeTiltak = branntekniskeTiltakInkludert && branntekniskeTiltakRows.length > 0;
  const formatMJ = (v: number) => {
    const r = v >= 10000 ? Math.round(v / 100) * 100 : Math.round(v);
    return r.toLocaleString("nb-NO");
  };

  // Build visible sections dynamically based on selected items
  const sections: { key: string; label: string }[] = [];
  if (visTotal) sections.push({ key: "total", label: "Total mengde brannfarlig stoff" });
  if (visPlanlagt) sections.push({ key: "planlagt", label: "Planlagt mengde utover DSB sin veiledning i salgslokalet" });
  if (visByggBrannenergi) sections.push({ key: "byggBrannenergi", label: "Brannenergi i hele bygget" });
  if (visBrannenergi) sections.push({ key: "brannenergi", label: "Brannenergi i salgslokalet" });
  if (visBranntekniskeTiltak) sections.push({ key: "branntekniskeTiltak", label: "Branntekniske tiltak i bygget" });
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
  if (visOverskridelse) sections.push({ key: "overskridelse", label: "Vurdering av mengde over anbefalt DSB-mengde" });

  const secNum = (key: string) => sections.findIndex(s => s.key === key) + 1;
  const hasAnySections = sections.length > 0;
  const logoWidth = 220;
  const logoHeight = 96;

  return (
    <div>
      <div style={pageStyle}>
        {logoUrl && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-10mm", marginBottom: 8 }}>
            <div style={{ width: logoWidth, height: logoHeight, background: "#fff", borderRadius: 4, padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={logoUrl} alt="Firmalogo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          </div>
        )}
        {/* Header bar */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "16px 20px", borderRadius: 6, marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>KRAVDOKUMENT</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Lagring av brannfarlig stoff</p>
            {valgtBygg && <p style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{valgtBygg.navn}</p>}
          </div>
        </div>

        {/* Project info */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <tbody>
            {firmaNavn && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, width: 140 }}>Firma</td>
                <td style={tdStyle}>{firmaNavn}</td>
              </tr>
            )}
            {kunde && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, width: 140 }}>Kunde</td>
                <td style={tdStyle}>{kunde}</td>
              </tr>
            )}
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
            {utarbeidetAv && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600 }}>Utarbeidet av</td>
                <td style={tdStyle}>{utarbeidetAv}</td>
              </tr>
            )}
            {ksAnsvarlig && (
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600 }}>KS (kvalitetssikret)</td>
                <td style={tdStyle}>{ksAnsvarlig}</td>
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

        {visTotal && (
          <>
            <h2 style={h2}>{secNum("total")}. Total mengde brannfarlig stoff</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Oversikt over samlet mengde brannfarlig stoff i virksomheten/anlegget. Mengder i salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare inngår, og danner grunnlag for vurdering av innmeldingsplikt til DSB.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Kategori</th>
                  <th style={{ ...thStyle, width: "30%" }}>Total mengde</th>
                </tr>
              </thead>
              <tbody>
                {totalRows.map((r) => (
                  <tr key={r.key}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{r.label}</td>
                    <td style={tdStyle}>
                      {Number(r.verdi).toLocaleString("nb-NO")} {r.enhet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalKommentar.trim() && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{totalKommentar}</p>
              </div>
            )}
          </>
        )}

        {visPlanlagt && (
          <>
            <h2 style={h2}>{secNum("planlagt")}. Planlagt mengde utover DSB sin veiledning i salgslokalet</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Oversikt over mengder brannfarlig stoff som ønskes plassert i selve salgslokalet utover DSB sin anbefalte mengde. Mengder i brannsikre skap eller egne brannceller/lagerrom beregnet for brannfarlig vare inngår ikke her.
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

        {visByggBrannenergi && (
          <>
            <h2 style={h2}>{secNum("byggBrannenergi")}. Brannenergi i hele bygget</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Beregningen tar utgangspunkt i total mengde brannfarlig stoff i virksomheten/anlegget, inkludert mengder i salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare. Beregningen benyttes til kontroll mot forutsatt brannenerginivå i brannkonseptet.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Brannfarlige stoffer i hele bygget</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Mengde</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Energi</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Bidrag</th>
                </tr>
              </thead>
              <tbody>
                {byggEnergiBidrag.map((b) => (
                  <tr key={b.key}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{b.label}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{b.mengde.toLocaleString("nb-NO")} {b.enhetInn}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#64748b" }}>{b.energi} {b.enhetEnergi}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatMJ(b.totalMJ)} MJ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {byggDimGyldig ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead><tr><th style={thStyle}>Beregningsdel</th><th style={{ ...thStyle, textAlign: "right" }}>Total brannenergi</th><th style={{ ...thStyle, textAlign: "right" }}>Spesifikk brannenergi per m² omhyllingsflate</th></tr></thead>
                <tbody>
                  <tr><td style={{ ...tdStyle, fontWeight: 500 }}>Generell brannenergi i bygget</td><td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatMJ(byggGenerellMJ)} MJ</td><td style={{ ...tdStyle, textAlign: "right" }}>{byggSpesifikkGenerell?.toFixed(1)} MJ/m²</td></tr>
                  <tr><td style={{ ...tdStyle, fontWeight: 500 }}>Brannfarlige stoffer i hele bygget</td><td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatMJ(byggTilleggsMJ)} MJ</td><td style={{ ...tdStyle, textAlign: "right" }}>{byggSpesifikkTillegg?.toFixed(1)} MJ/m²</td></tr>
                  <tr><td style={{ ...tdStyle, fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>Sum for hele bygget</td><td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>{formatMJ(byggTotalMedTilleggMJ)} MJ</td><td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>{byggSpesifikkTotal?.toFixed(1)} MJ/m²</td></tr>
                </tbody>
              </table>
            ) : <p style={{ fontSize: 10, color: "#b91c1c", marginBottom: 12 }}>Byggets gulvareal og omhyllingsflate må fylles inn for å kunne vurdere brannenergi for hele bygget.</p>}
            {byggGrense > 0 && byggSpesifikkTotal !== null && <div style={{ marginBottom: 12, padding: "10px 12px", background: byggSpesifikkTotal <= byggGrense ? "#f0fdf4" : "#fef2f2", borderLeft: `3px solid ${byggSpesifikkTotal <= byggGrense ? "#15803d" : "#b91c1c"}`, borderRadius: 4 }}><p style={{ fontSize: 10, fontWeight: 700, color: byggSpesifikkTotal <= byggGrense ? "#15803d" : "#b91c1c" }}>{byggSpesifikkTotal <= byggGrense ? `Beregnet brannenergi (${byggSpesifikkTotal.toFixed(1)} MJ/m²) ligger innenfor angitt nivå i brannkonseptet (${byggGrense.toLocaleString("nb-NO")} MJ/m²).` : `Beregnet brannenergi (${byggSpesifikkTotal.toFixed(1)} MJ/m²) overstiger angitt nivå i brannkonseptet (${byggGrense.toLocaleString("nb-NO")} MJ/m²) og kan kreve ny vurdering av branncellebegrensende konstruksjoner/brannvegger.`}</p></div>}
            {byggBrannenergiKommentar.trim() && <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}><p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar til samlet brannenergi / kontroll mot brannkonsept</p><p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{byggBrannenergiKommentar}</p></div>}
          </>
        )}

        {visBrannenergi && (
          <>
            <h2 style={h2}>{secNum("brannenergi")}. Brannenergi i salgslokalet</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              For salgslokale/kjøpesenter er generell brannenergi satt til {generellMJm2.toLocaleString("nb-NO")} MJ/m² gulvareal iht. Byggforsk 321.051 Brannenergi i bygninger. Beregninger og statistiske verdier. Brannfarlige varer i salgslokalet utenfor brannskap/egne brannceller er vurdert som et tillegg til den statistiske brannenergien i salgslokalet. Begge verdier er omregnet til spesifikk brannenergi per m² omhyllingsflate.
            </p>

            {dimGyldig && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Etasje</th>
                    <th style={thStyle}>Lengde</th>
                    <th style={thStyle}>Bredde</th>
                    <th style={thStyle}>Høyde</th>
                    <th style={thStyle}>Gulvareal</th>
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
                      <td style={tdStyle}>{e.gulvareal.toFixed(1)} m²</td>
                      <td style={tdStyle}>{e.omh.toFixed(1)} m²</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#f1f5f9" }}>
                      Sum
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, background: "#f1f5f9" }}>{gulvareal.toFixed(1)} m²</td>
                    <td style={{ ...tdStyle, fontWeight: 700, background: "#f1f5f9" }}>{omhylling.toFixed(1)} m²</td>
                  </tr>
                </tbody>
              </table>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Tillegg fra brannfarlige varer i salgslokalet</th>
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
              </tbody>
            </table>

            {dimGyldig ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Beregningsdel</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Total brannenergi</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Spesifikk brannenergi per m² omhyllingsflate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>Generell brannenergi i salgslokalet</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatMJ(generellMJ)} MJ</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{spesifikkGenerell?.toFixed(1)} MJ/m²</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>Tillegg fra brannfarlige varer i salgslokalet</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatMJ(tilleggsMJ)} MJ</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{spesifikkTillegg?.toFixed(1)} MJ/m²</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdStyle, fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>Sum for salgslokalet</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>{formatMJ(totalMedTilleggMJ)} MJ</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, background: "#e8eef5", color: "#1e3a5f" }}>{spesifikkTotal?.toFixed(1)} MJ/m²</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 10, color: "#b91c1c", marginBottom: 12 }}>
                Lengde, bredde og høyde må fylles inn for å kunne vurdere brannenergi per m² omhyllingsflate.
              </p>
            )}

            {okningProsent !== null && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, color: "#334155" }}>
                  Økning som følge av brannfarlige varer: <strong>{okningProsent.toFixed(1)} %</strong>
                </p>
              </div>
            )}

            {brannenergiKommentar.trim() && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{brannenergiKommentar}</p>
              </div>
            )}

            <p style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic", marginBottom: 16 }}>
              Energitettheter for brannfarlige varer er sjablongverdier hentet fra SFPE Handbook of Fire Protection Engineering og NS-EN 1991-1-2. Beregningen brukes kun til indikativ vurdering av brannenergi i salgslokalet.
            </p>
          </>
        )}

        {visBranntekniskeTiltak && branntekniskeTiltak && (
          <>
            <h2 style={h2}>{secNum("branntekniskeTiltak")}. Branntekniske tiltak i bygget</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Oversikt over branntekniske tiltak som er lagt til grunn for vurderingen av lagring av brannfarlig stoff.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "24%" }}>Tiltak</th>
                  <th style={{ ...thStyle, width: "20%" }}>Status</th>
                  <th style={thStyle}>Beskrivelse og virkning på rømningstid</th>
                </tr>
              </thead>
              <tbody>
                {branntekniskeTiltakRows.map((row) => (
                  <tr key={row.tiltak}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.tiltak}</td>
                    <td style={tdStyle}>{row.status || "—"}</td>
                    <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }}>
                      {row.beskrivelse && <p style={{ margin: 0, marginBottom: row.rapporttekst ? 6 : 0 }}>{row.beskrivelse}</p>}
                      {row.rapporttekst && <p style={{ margin: 0 }}>{row.rapporttekst}</p>}
                      {!row.beskrivelse && !row.rapporttekst && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {branntekniskeTiltak.generellKommentar.trim() && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Felles kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{branntekniskeTiltak.generellKommentar}</p>
              </div>
            )}
          </>
        )}

        {visInnmelding && innmeldingVurdering && (
          <>
            <h2 style={h2}>{secNum("innmelding")}. Innmeldingsplikt til DSB</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Vurdering av innmeldingsplikt etter Forskrift om håndtering av brannfarlig, reaksjonsfarlig og trykksatt stoff (FBRT) § 12, basert på total mengde brannfarlig stoff i virksomheten/anlegget.
            </p>

            {/* Konklusjon */}
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                background: innmeldingVurdering.trengerInnmelding ? "#fef2f2" : "#f0fdf4",
                borderLeft: `3px solid ${innmeldingVurdering.trengerInnmelding ? "#b91c1c" : "#15803d"}`,
                borderRadius: 4,
              }}
            >
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: innmeldingVurdering.trengerInnmelding ? "#b91c1c" : "#15803d",
                }}
              >
                {innmeldingVurdering.trengerInnmelding
                  ? "Anlegget er innmeldingspliktig til DSB"
                  : "Anlegget er ikke innmeldingspliktig"}
              </p>
              {innmeldingVurdering.trengerInnmelding ? (
                <>
                  <p style={{ fontSize: 10, color: "#334155", marginBottom: 4 }}>
                    Følgende stoffgruppe(r) overskrider innmeldingsgrensen iht. § 12:
                  </p>
                  <ul style={{ fontSize: 10, color: "#334155", margin: 0, paddingLeft: 18 }}>
                    {innmeldingVurdering.grupper
                      .filter((g) => g.status === "over")
                      .map((g) => (
                        <li key={g.id}>
                          {g.kategori} – total mengde {g.sum.toLocaleString("nb-NO")} L (grense{" "}
                          {g.grenseLiter.toLocaleString("nb-NO")} L)
                        </li>
                      ))}
                  </ul>
                </>
              ) : (
                <p style={{ fontSize: 10, color: "#334155" }}>
                  Totalmengdene ligger under grensene i § 12.
                </p>
              )}
            </div>

            {/* Vurderingstabell */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Stoffgruppe</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Total mengde</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Innmeldingsgrense</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {innmeldingVurdering.grupper.map((g) => (
                  <tr key={g.id}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{g.kategori}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {g.sum > 0 ? `${g.sum.toLocaleString("nb-NO")} L` : "—"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#64748b" }}>
                      {g.grenseLiter.toLocaleString("nb-NO")} L
                    </td>
                    <td style={tdStyle}>
                      {g.status === "over" && (
                        <span style={{ color: "#b91c1c", fontWeight: 600 }}>Innmeldingspliktig</span>
                      )}
                      {g.status === "under" && (
                        <span style={{ color: "#15803d", fontWeight: 600 }}>Under grense</span>
                      )}
                      {g.status === "ingen" && <span style={{ color: "#94a3b8" }}>Ikke aktuelt</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#64748b" }}>
                      {g.status === "under" ? `${g.gjenstaende.toLocaleString("nb-NO")} L til grensen` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {innmeldingKommentar.trim() && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  background: "#f8fafc",
                  borderLeft: "3px solid #1e3a5f",
                  borderRadius: 4,
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Kommentar</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{innmeldingKommentar}</p>
              </div>
            )}

            <p style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic", marginBottom: 16 }}>
              Kilde: Forskrift om håndtering av brannfarlig, reaksjonsfarlig og trykksatt stoff (FBRT) § 12. Gass og
              aerosoler vurderes ikke mot væskegrensene i denne tabellen.
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
            <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
              <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>
                DSB sin temaveiledning angir anbefalte mengder for salgslokaler, men legger opp til at mengdene kan økes noe dersom det er gjort særskilte tiltak og det fremgår av risikovurderingen at en begrenset økning er akseptabel. Tabellverdiene benyttes derfor som utgangspunkt for vurderingen.
              </p>
            </div>
            {salgslokaleTiltakTekst.trim() && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Vurdering av høyere mengder / kompenserende tiltak</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{salgslokaleTiltakTekst}</p>
              </div>
            )}
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
                {selKontroll.map(({ krav, index }) => (
                  <tr key={index}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{krav.tittel}</td>
                    <td style={tdStyle}>{krav.beskrivelse}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{krav.intervall || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Generelt skal systematisk tilstandskontroll omfatte:</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", fontSize: 10 }}>
                {kontrollGenerelt.map((punkt) => <li key={punkt}>{punkt}</li>)}
              </ul>
            </div>
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

        {visOverskridelse && (
          <>
            <h2 style={h2}>{secNum("overskridelse")}. Vurdering av mengde over anbefalt DSB-mengde</h2>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
              Vurderingen sammenligner planlagte mengder med anbefalte mengder i DSB sin temaveiledning. Høyere mengder må begrunnes konkret for bygget, tiltakene og driftsforutsetningene.
              {overskridelseArealgrunnlag && ` Arealgrunnlag for salgslokale: ${overskridelseArealgrunnlag} m².`}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Stoffgruppe</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Anbefalt mengde</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Planlagt mengde</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Overskridelse</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Vurdert tillatt mengde</th>
                </tr>
              </thead>
              <tbody>
                {overskridelseRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.stoffgruppe}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{row.anbefaltMengde.toLocaleString("nb-NO")} {row.enhet}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{row.planlagtMengde.toLocaleString("nb-NO")} {row.enhet}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#b91c1c", fontWeight: 600 }}>{row.overskridelse.toLocaleString("nb-NO")} {row.enhet} ({row.overskridelseProsent.toFixed(0)} %)</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{row.vurdertTillattMengde || `${row.planlagtMengde.toLocaleString("nb-NO")} ${row.enhet}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overskridelseTiltak.trim() && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Prosjektspesifikke tiltak</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{overskridelseTiltak}</p>
              </div>
            )}
            {overskridelseVurderingstekst.trim() && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Vurdering</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{overskridelseVurderingstekst}</p>
              </div>
            )}
            {overskridelseKonklusjon.trim() && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f8fafc", borderLeft: "3px solid #1e3a5f", borderRadius: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "#1e3a5f" }}>Konklusjon og avgrensning</p>
                <p style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{overskridelseKonklusjon}</p>
              </div>
            )}
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
