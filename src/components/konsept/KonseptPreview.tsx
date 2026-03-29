import React from "react";
import { branncelleTyperListe, getBrannklasse } from "@/lib/fire-concept-constants";
import { getGarasjeKrav } from "@/lib/garasje-krav";
import { getBrensellagringKrav, BrenselType } from "@/lib/brensellagring-krav";
import { getBaereevneTekstBF85, getBF85BrannveggKravKap34 } from "@/lib/bf85-constants";


interface TilstandBilde {
  url: string;
  beskrivelse: string;
}

interface TilstandData {
  grad: string;
  beskrivelse: string;
  bilder: (TilstandBilde | string)[];
}

const normalizeBilder = (bilder: any[]): TilstandBilde[] =>
  (bilder || []).map((b: any) => typeof b === "string" ? { url: b, beskrivelse: "" } : b);

interface KonseptPreviewProps {
  formData: Record<string, any>;
  logoUrl?: string | null;
  authorInfo?: { name: string; company: string } | null;
  documentType?: "brannkonsept" | "tilstandsvurdering";
}

const gradColors: Record<string, { bg: string; text: string; label: string }> = {
  tg0: { bg: "#dcfce7", text: "#166534", label: "TG 0 – Ingen avvik" },
  tg1: { bg: "#fef9c3", text: "#854d0e", label: "TG 1 – Mindre avvik" },
  tg2: { bg: "#ffedd5", text: "#9a3412", label: "TG 2 – Vesentlige avvik" },
  tg3: { bg: "#fecaca", text: "#991b1b", label: "TG 3 – Store avvik" },
  tgiu: { bg: "#f3f4f6", text: "#374151", label: "TG IU – Ikke undersøkt" },
};

const TilstandBlock = ({ data, sectionLabel }: { data: TilstandData; sectionLabel: string }) => {
  if (!data || (!data.grad && !data.beskrivelse && (!data.bilder || data.bilder.length === 0))) return null;
  const gradInfo = gradColors[data.grad];
  return (
    <div style={{ border: "2px dashed #f59e0b", borderRadius: 8, padding: 12, marginTop: 8, background: "#fffbeb" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 6 }}>
        Tilstandsvurdering – {sectionLabel}
      </p>
      {gradInfo && (
        <span style={{ fontSize: 10, fontWeight: 600, background: gradInfo.bg, color: gradInfo.text, padding: "2px 8px", borderRadius: 12, display: "inline-block", marginBottom: 6 }}>
          {gradInfo.label}
        </span>
      )}
      {data.beskrivelse && <p style={{ fontSize: 10, whiteSpace: "pre-wrap", marginTop: 4 }}>{data.beskrivelse}</p>}
      {data.bilder && data.bilder.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {normalizeBilder(data.bilder).map((bilde, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <img src={bilde.url} alt={bilde.beskrivelse || `Tilstand ${i + 1}`} style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb" }} />
              {bilde.beskrivelse && <p style={{ fontSize: 9, fontStyle: "italic", margin: 0 }}>{bilde.beskrivelse}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TilstandTableRow = ({ data, sectionLabel, colSpan = 3 }: { data: TilstandData; sectionLabel: string; colSpan?: number }) => {
  if (!data || (!data.grad && !data.beskrivelse && (!data.bilder || data.bilder.length === 0))) return null;
  const gradLabel = { tg0: "TG 0", tg1: "TG 1", tg2: "TG 2", tg3: "TG 3", tgiu: "TG IU" }[data.grad] || "";
  return (
    <tr>
      <td className="border border-gray-400 p-2" colSpan={colSpan} style={{ background: "#FEF3C7" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 4 }}>
          TILSTANDSVURDERING – {sectionLabel}
        </p>
        {gradLabel && <p style={{ fontSize: 10, marginBottom: 2 }}>Tilstandsgrad: {gradLabel}</p>}
        {data.beskrivelse && <p style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>Beskrivelse: {data.beskrivelse}</p>}
        {data.bilder && data.bilder.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {normalizeBilder(data.bilder).map((bilde, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <img src={bilde.url} alt={bilde.beskrivelse || `Tilstand ${i + 1}`} style={{ width: 450, maxWidth: "100%", height: "auto", objectFit: "cover", borderRadius: 4, border: "1px solid #d1d5db" }} />
                {bilde.beskrivelse && <p style={{ fontSize: 9, fontStyle: "italic", margin: "4px 0 0 0" }}>Bilde {i + 1}: {bilde.beskrivelse}</p>}
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
};

const KonseptPreview = ({ formData, logoUrl, authorInfo, documentType = "brannkonsept" }: KonseptPreviewProps) => {
  // Ensure arrays have defaults
  const bygningsdeler = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
  const grunnlagsdokumenter = Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [];
  const branncelleTyper = Array.isArray(formData.branncelleTyper) ? formData.branncelleTyper : [];
  const baereevneUnntak = Array.isArray(formData.baereevneUnntak) ? formData.baereevneUnntak : [];

  const pageStyle = "bg-white text-black p-10 rounded-lg shadow-md text-sm border border-gray-200 mx-auto relative";
  const pageWidth = { maxWidth: '210mm', minHeight: '297mm', paddingBottom: '40px', fontFamily: 'Verdana, Geneva, sans-serif' };
  const hasSammendrag = !!formData.sammendrag;
  const isTilstand = documentType === "tilstandsvurdering";
  const isBF85 = isTilstand && formData.regelverk === "BF85";
  const extraPages = (hasSammendrag ? 1 : 0) + (isTilstand ? 1 : 0);
  const totalPages = isTilstand ? 7 + extraPages : 8 + extraPages;
  // Section prefix for chapter 3 (brannkonsept) → chapter 2 (tilstandsvurdering)
  const sp = "3";

  const PageFooter = ({ pageNum }: { pageNum: number }) => (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
      <span className="text-xs text-gray-400">Side {pageNum} av {totalPages}</span>
    </div>
  );

  return (
    <div className="space-y-8 py-4">
      {/* Forside */}
      <div className={pageStyle} style={pageWidth}>
        <div className="flex flex-col items-center justify-center pt-8 pb-8" style={{ minHeight: '260mm' }}>
        {logoUrl && (
          <div className="mb-8">
            <img src={logoUrl} alt="Firmalogo" className="max-h-64 max-w-[600px] object-contain" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-center mb-4 tracking-wide">
          {documentType === "tilstandsvurdering" ? "TILSTANDSVURDERING" : "BRANNKONSEPT"}
        </h1>
        {formData.prosjektnavn && (
          <p className="text-lg text-center text-gray-700 mb-2">{formData.prosjektnavn}</p>
        )}
        {formData.adresse && (
          <p className="text-base text-center text-gray-500 mb-6">{formData.adresse}</p>
        )}
        {authorInfo && (authorInfo.name || authorInfo.company) && (
          <div className="mt-8 text-center text-sm text-gray-600">
            <p className="font-semibold">Utarbeidet av</p>
            {authorInfo.name && <p>{authorInfo.name}</p>}
            {authorInfo.company && <p>{authorInfo.company}</p>}
          </div>
        )}
        <p className="mt-4 text-xs text-gray-400">{new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <PageFooter pageNum={1} />
      </div>

      {/* Sammendrag - egen side */}
      {hasSammendrag && (
        <div className={pageStyle} style={pageWidth}>
          <h2 className="font-bold mb-3">Sammendrag</h2>
          <p className="whitespace-pre-wrap text-xs">{formData.sammendrag}</p>
          <PageFooter pageNum={2} />
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
          <PageFooter pageNum={2 + extraPages} />
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
              <p><span className="font-bold">2.</span> Grunnlag og forutsetninger</p>
              <p className="ml-4">2.1 Bygningsinformasjon</p>
              <p className="ml-4">2.2 Grunnlagsdokumenter</p>
              <p className="ml-4">2.3 Branntekniske forutsetninger</p>
              <p className="ml-4">2.4 Tilleggskrav</p>
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
              <p className="ml-4">3.12 Tilrettelegging for manuell slokking</p>
              <p className="ml-4">3.13 Tilrettelegging for rednings- og slokkemannskap</p>
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
              <p><span className="font-bold">2.</span> Grunnlag og forutsetninger for brannteknisk prosjektering</p>
              <p className="ml-4">2.1 Grunnlagsdokumenter</p>
              <p className="ml-4">2.2 Beskrivelse av bygning og branntekniske forutsetninger</p>
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
              <p className="ml-4">3.12 § 11-16 Tilrettelegging for manuell slokking</p>
              <p className="ml-4">3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap</p>
              <p><span className="font-bold">4.</span> Utførelses- og driftsfasen</p>
              <p className="ml-4">4.1 Utførelsesfasen</p>
              <p className="ml-4">4.2 Driftsfasen</p>
              <p><span className="font-bold">5.</span> Revisjonshistorikk</p>
              <p><span className="font-bold">6.</span> Litteraturhenvisninger</p>
            </>
          )}
        </div>
      </section>
      <PageFooter pageNum={2 + extraPages} />
      </div>

      {/* Kapittel 1 - egen side */}
      <div className={pageStyle} style={pageWidth}>
      {/* 1. Innledning */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">1. Innledning</h2>
        
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

        <h3 className="font-semibold mb-2">1.5 Gjeldende regelverk</h3>
        <ul className="ml-4 mb-3 list-disc list-inside">
          <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
          <li>VTEK17 - Veiledning til teknisk forskrift</li>
        </ul>
        </>
        )}

        {isTilstand && (
        <>
        <h3 className="font-semibold mb-2">1.2 Avgrensning av vurderingen</h3>
        <p className="ml-4 mb-3">{formData.avgrensning || "[Avgrensning beskrives]"}</p>
        </>
        )}
      </section>
      <PageFooter pageNum={3 + extraPages} />
      </div>

      {/* Kapittel 2 / Kap 1 forts. - egen side */}
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        {isTilstand ? (
          <h2 className="font-bold mb-3">2. Grunnlag og forutsetninger</h2>
        ) : (
          <h2 className="font-bold mb-3">2. Grunnlag og forutsetninger for brannteknisk prosjektering</h2>
        )}
        
        <h3 className="font-semibold mb-2">{isTilstand ? "2.1 Bygningsinformasjon" : "2.1 Grunnlagsdokumenter"}</h3>
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
                <td className="border border-gray-400 p-2 font-semibold">Antall etasjer</td>
                <td className="border border-gray-400 p-2">{formData.etasjer || "[Angis]"}</td>
              </tr>
              {isBF85 ? (
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Bygningsbrannklasse</td>
                <td className="border border-gray-400 p-2">{formData.bygningsbrannklasse ? `Bygningsbrannklasse ${formData.bygningsbrannklasse}` : "[Angis]"}</td>
              </tr>
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

          <h3 className="font-semibold mb-2">2.3 Branntekniske forutsetninger</h3>
          <p className="ml-4 mb-3">{formData.tiltaksbeskrivelse || "[Branntekniske forutsetninger beskrives]"}</p>

          <h3 className="font-semibold mb-2">2.4 Tilleggskrav</h3>
          <p className="ml-4 mb-3 whitespace-pre-wrap">{formData.tilleggskrav || "[Eventuelle tilleggskrav beskrives]"}</p>
          </>
        ) : (
          <>
          {/* For brannkonsept: original kap 2 structure */}
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

          <h3 className="font-semibold mb-2">2.2 Beskrivelse av bygning og branntekniske forutsetninger</h3>
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
                <td className="border border-gray-400 p-2 font-semibold">Antall etasjer</td>
                <td className="border border-gray-400 p-2">{formData.etasjer || "[Angis]"}</td>
              </tr>
            </tbody>
          </table>
          {isBF85 ? (
            <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold w-1/3">Bygningsbrannklasse (BF85)</td>
                  <td className="border border-gray-400 p-2">
                    {formData.bygningsbrannklasse ? `Bygningsbrannklasse ${formData.bygningsbrannklasse}` : "[Angis]"}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : formData.harFlereRisikoklasser && bygningsdeler.length > 0 ? (
            <>
              <p className="ml-4 mb-2 text-xs italic">Bygget inneholder flere bygningsdeler med ulike risikoklasser:</p>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left">Bygningsdel</th>
                    <th className="border border-gray-400 p-2 text-left">Bygningstype</th>
                    <th className="border border-gray-400 p-2 text-left">Areal</th>
                    <th className="border border-gray-400 p-2 text-left">Etasjer</th>
                    <th className="border border-gray-400 p-2 text-left">Risikoklasse</th>
                    <th className="border border-gray-400 p-2 text-left">Brannklasse</th>
                  </tr>
                </thead>
                <tbody>
                  {bygningsdeler.map((del: any, index: number) => {
                    const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                    return (
                      <tr key={del.id || index}>
                        <td className="border border-gray-400 p-2">{del.navn || `Del ${index + 1}`}</td>
                        <td className="border border-gray-400 p-2">{del.bygningstype || "-"}</td>
                        <td className="border border-gray-400 p-2">{del.areal ? `${del.areal} m²` : "-"}</td>
                        <td className="border border-gray-400 p-2">{del.etasjer || "-"}</td>
                        <td className="border border-gray-400 p-2">{del.risikoklasse || "-"}</td>
                        <td className="border border-gray-400 p-2">{delBrannklasse || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <table className="w-full border-collapse text-xs mb-3 mt-2">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold w-1/3">Tiltaksklasse</td>
                    <td className="border border-gray-400 p-2" colSpan={5}>
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
                  <td className="border border-gray-400 p-2 font-semibold w-1/3">Risikoklasse</td>
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
              </tbody>
            </table>
          )}

          <h3 className="font-semibold mb-2">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</h3>
          <p className="ml-4 mb-3 whitespace-pre-wrap">{formData.tilleggskrav || "[Eventuelle tilleggskrav beskrives]"}</p>
          </>
        )}
      </section>
      <PageFooter pageNum={4 + extraPages} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      {/* Branntekniske ytelseskrav */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">3. {isTilstand ? "Brannteknisk tilstandsvurdering" : "Beskrivelse av branntekniske ytelseskrav"}</h2>
        
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.1 / 2.1 Bæreevne og stabilitet */}
            {isBF85 ? (
              /* ── BF85: Tabell 30:41 ── */
              <>
                <tr className="bg-blue-100">
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
                <tr className="bg-blue-100">
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
                  // Determine highest brannklasse among bygningsdeler
                  const maxBkl = Math.max(...bygningsdeler.map((del: any) => {
                    const bk = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                    return parseInt(bk?.replace("BKL", "") || "1");
                  }));
                  const genereltTekst = maxBkl >= 3
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
                {bygningsdeler.map((del: any, index: number) => {
                  const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                  const bklNum = delBrannklasse?.replace("BKL", "") || "1";
                  
                  const krav: Record<string, { hovedsystem: string; sekundaer: string; etasjeskiller: string; trappeløp: string; utvendig: string; kjeller: string; tak: string }> = {
                    "1": { hovedsystem: "R 30", sekundaer: "R 30", etasjeskiller: "R 30", trappeløp: "-", utvendig: "-", kjeller: "R 60 A2-s1,d0", tak: "R 30" },
                    "2": { hovedsystem: "R 60", sekundaer: "R 60", etasjeskiller: "R 60", trappeløp: "R 30", utvendig: "R 30 / A2-s1,d0", kjeller: "R 90 A2-s1,d0", tak: "R 60" },
                    "3": { hovedsystem: "R 90 A2-s1,d0", sekundaer: "R 60 A2-s1,d0", etasjeskiller: "R 60 A2-s1,d0", trappeløp: "R 30 A2-s1,d0", utvendig: "A2-s1,d0", kjeller: "R 120 A2-s1,d0", tak: "R 60 A2-s1,d0" },
                    "4": { hovedsystem: "R 120 A2-s1,d0", sekundaer: "R 90 A2-s1,d0", etasjeskiller: "R 90 A2-s1,d0", trappeløp: "R 60 A2-s1,d0", utvendig: "A2-s1,d0", kjeller: "R 120 A2-s1,d0", tak: "R 90 A2-s1,d0" },
                  };
                  
                  const delKrav = krav[bklNum] || krav["1"];
                  const delNavn = del.navn || `Del ${index + 1}`;
                  
                  return (
                    <React.Fragment key={del.id || index}>
                      {index === 0 && (
                        <tr className="bg-blue-50">
                          <td className="border border-gray-400 p-2 font-semibold" colSpan={3}>
                            Krav per bygningsdel:
                          </td>
                        </tr>
                      )}
                      <tr className="bg-blue-100">
                        <td className="border border-gray-400 p-2 font-semibold" colSpan={3}>
                          {delNavn} ({delBrannklasse})
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Bærende hovedsystem</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.hovedsystem}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Sekundære, bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.sekundaer}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Etasjeskiller</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.etasjeskiller}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Trappeløp</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.trappeløp}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Utvendig trapp</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.utvendig}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Plan under øverste kjeller</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.kjeller}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">Takkonstruksjon</td>
                        <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.tak}</td>
                        <td className="border border-gray-400 p-2">RIB</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
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
                <tr className="bg-blue-100">
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
            <tr className="bg-blue-100">
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
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                {sp}.3 &nbsp;&nbsp; {formData.regelverk === "BF85" ? <>Avstand mellom bygninger (Kap. 30:32) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-6 Tiltak mot brannspredning mellom byggverk)</span></> : "§11-6 Brannspredning mellom byggverk"}
              </td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>

            {formData.regelverk === "BF85" ? (
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
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.4 &nbsp;&nbsp; {isBF85 ? <>Brannteknisk oppdeling (Kap. 30:6) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-7 Brannseksjoner)</span></> : "§11-7 Brannseksjoner"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>

            {isBF85 ? (
              <>
                {/* BF85 Kap 30:61 Oppdeling med brannvegg */}
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt (:61)</td>
                  <td className="border border-gray-400 p-2">
                    Største grunnflate etter kap. 31 til 39 kan økes dersom bygningen oppdeles med brannvegg i deler med høyst så store arealer som angitt.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
                {formData.brannseksjoner && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                    <td className="border border-gray-400 p-2">{formData.brannseksjoner}</td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                {/* BF85 Tabell 34:23 – Industri/Kontor/Garasje/Lager */}
                {["Industri", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype) && formData.bf85_34_brannbelastning && (() => {
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
                {/* Gjennomføringer :621 */}
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
                {/* Åpninger i brannvegg - kun når dør/vindu er huket av */}
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

                  if (g && maksAreal !== null && !erPakrevd) {
                    return (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Generelt</td>
                        <td className="border border-gray-400 p-2">
                          Bruttoarealet ({arealNum} m²) er innenfor tillatt areal uten brannseksjonering ({maksAreal === Infinity ? "ubegrenset" : `${maksAreal} m²`}). Det er derfor ikke krav til brannseksjonering for dette byggverket.
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
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
                {formData.brannseksjoner && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                    <td className="border border-gray-400 p-2">{formData.brannseksjoner}</td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                {/* Preaksepterte ytelser for seksjoneringsveggen når seksjonering er påkrevd */}
                {(() => {
                  const arealNum = parseFloat(formData.areal) || 0;
                  const brannenergi = formData.brannseksjonBrannenergi;
                  const tiltak = formData.brannseksjonTiltak || "normalt";
                  if (!brannenergi || arealNum <= 0) return null;
                  const grenser: Record<string, { normalt: number; brannalarm: number; sprinkler: number; roykventilasjon: number }> = {
                    "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
                    "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
                    "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 },
                  };
                  const g = grenser[brannenergi];
                  if (!g) return null;
                  const maksAreal = g[tiltak as keyof typeof g] ?? g.normalt;
                  if (maksAreal === Infinity) return null;
                  if (arealNum <= maksAreal && maksAreal !== 0) return null;
                  return (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Seksjoneringsveggen</td>
                      <td className="border border-gray-400 p-2">
                        <p className="mb-1">Brannseksjonering er påkrevd da bruttoarealet ({arealNum} m²) overskrider tillatt areal uten seksjonering. Seksjoneringsveggen skal oppfylle følgende preaksepterte ytelser:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Takkonstruksjonen må ikke være kontinuerlig over seksjoneringsveggen på en slik måte at en kollaps på den ene siden medfører reduksjon av konstruksjonens bæreevne og brannmotstand på den andre siden.</li>
                          <li>Konstruksjoner som ligger inntil seksjoneringsveggen må kunne bevege seg fritt ved temperaturendringer, uten at veggens branntekniske egenskaper reduseres.</li>
                          <li>Seksjoneringsveggens avslutning mot tak og fasade må være utformet og utført for å hindre brannspredning mellom ulike seksjoner. Størst sikkerhet mot brannspredning oppnås ved å føre seksjoneringsveggen over takflaten og utenfor vegglivet, tilsvarende som for brannvegger, jf. § 11-6.</li>
                          <li>Der seksjoner ligger inntil hverandre i et innvendig hjørne, må det treffes særskilte tiltak for å hindre brannspredning, jf. figur 1a og 1b.</li>
                          <li>Seksjoneringsveggen må ha brannmotstand minst {(() => {
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
                {(formData.seksjonDorRelevant || formData.seksjonVinduRelevant) && (() => {
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

          </tbody>
        </table>
      </section>
      <PageFooter pageNum={5 + extraPages} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 className="font-bold mb-3">{sp}. {isTilstand ? "Brannteknisk tilstandsvurdering" : "Beskrivelse av branntekniske ytelseskrav"} (forts.)</h2>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.5 §11-8 Brannceller */}
            <tr className="bg-blue-100">
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
                      <p className="text-sm">Bygning skal deles inn i brannceller. Områder med ulik bruk eller risiko skal utgjøre egne brannceller.</p>
                      <p className="text-sm mt-1">Branncellebegrensende bygningsdel: <span className="font-semibold text-red-600">{krav.branncellebegrensende}</span></p>
                      <p className="text-sm mt-1">Dør i branncellebegrensende vegg: <span className="font-semibold text-red-600">{krav.dorKrav}</span> (minst halvparten av veggens brannmotstand)</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  {formData.bf85TekniskeRomRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Kap. 30:33 – Tekniske rom</td>
                      <td className="border border-gray-400 p-2">
                        <p className="text-sm">Heismaskinrom, ventilasjonsrom, søppelrom og fyrrom skal utgjøre egne brannceller med brannmotstand <span className="font-semibold text-red-600">{krav.tekniskeRom}</span>.</p>
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
            {formData.brannklasse && (
              <>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Branncellebegrensende bygningsdel - generelt</td>
                  <td className="border border-gray-400 p-2 font-semibold">
                    {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                    {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                    {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Bygningsdel som omslutter trapperom, heissjakt og installasjonssjakter over flere plan</td>
                  <td className="border border-gray-400 p-2 font-semibold">
                    {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                    {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                    {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              </>
            )}
            </>
            )}
            {!isBF85 && formData.heismaskinromRelevant === "ja" && formData.brannklasse && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Heismaskinrom</td>
                <td className="border border-gray-400 p-2 font-semibold">
                  {formData.brannklasse === "BKL1" && "EI 60 [B 60]"}
                  {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                  {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
              </tr>
            )}
            {!isBF85 && formData.fyrromRelevant === "ja" && formData.brannklasse && (
              <>
                {formData.fyrromKw === "fast" && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannklasse === "BKL1" && "EI 60 [B 60]"}
                      {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                      {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                )}
                {formData.fyrromKw === "under50" && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &lt; 50 kW</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannklasse === "BKL1" && "K₂ 10 A2-s1,d0 [K1-A] – kun ytelse for kledning/overflate"}
                      {formData.brannklasse === "BKL2" && "K₂ 10 A2-s1,d0 [K1-A] – kun ytelse for kledning/overflate"}
                      {formData.brannklasse === "BKL3" && "K₂ 10 A2-s1,d0 [K1-A] – kun ytelse for kledning/overflate"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                )}
                {formData.fyrromKw === "50-100" && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, 50 kW ≤ P ≤ 100 kW</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                      {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                      {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                )}
                {formData.fyrromKw === "over100" && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &gt; 100 kW</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannklasse === "BKL1" && "EI 60 A2-s1,d0 [A 60]"}
                      {formData.brannklasse === "BKL2" && "EI 60 A2-s1,d0 [A 60]"}
                      {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                )}
                {formData.fyrromKw === "ukjent" && (
                  <>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel</td>
                      <td className="border border-gray-400 p-2 font-semibold">
                        {formData.brannklasse === "BKL1" && "EI 60 [B 60]"}
                        {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                        {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &lt; 50 kW</td>
                      <td className="border border-gray-400 p-2 font-semibold">
                        {formData.brannklasse === "BKL1" && "K₂ 10 A2-s1,d0 [K1-A]"}
                        {formData.brannklasse === "BKL2" && "K₂ 10 A2-s1,d0 [K1-A]"}
                        {formData.brannklasse === "BKL3" && "K₂ 10 A2-s1,d0 [K1-A]"}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, 50 kW ≤ P ≤ 100 kW</td>
                      <td className="border border-gray-400 p-2 font-semibold">
                        {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                        {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                        {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Fyrrom – flytende/gassformig brensel, P &gt; 100 kW</td>
                      <td className="border border-gray-400 p-2 font-semibold">
                        {formData.brannklasse === "BKL1" && "EI 60 A2-s1,d0 [A 60]"}
                        {formData.brannklasse === "BKL2" && "EI 60 A2-s1,d0 [A 60]"}
                        {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                  </>
                )}
              </>
            )}
            {branncelleTyper.length > 0 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Følgende rom/lokaler skal være egne brannceller</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-none space-y-1">
                    {branncelleTyper.map((typeId: string) => {
                      const type = branncelleTyperListe.find(t => t.id === typeId);
                      return type ? <li key={typeId} className="text-sm">{type.label}</li> : null;
                    })}
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
              </tr>
            )}
            {/* Dørkrav */}
            {formData.dorPlasseringer && formData.dorPlasseringer.length > 0 && formData.brannklasse && (() => {
              const isBF85 = formData.regelverk === "BF85";
              if (isBF85) {
                const bbk = parseInt(formData.bygningsbrannklasse || '0', 10);
                const isBBK12 = bbk <= 2;
                const bf85DorKravMap: Record<string, { label: string; bbk12: string; bbk34: string }> = {
                  bf85_branncelle_aapent: { label: "Branncelle – åpent trapperom (Tr1)", bbk12: "B 30 S (EI 30-CSa)", bbk34: "B 30 S (EI 30-CSa)" },
                  bf85_korridor_lukket: { label: "Korridor – lukket trapperom (Tr2)", bbk12: "B 30 S eller F 30 S (EI 30-CSa eller E 30-CSa)", bbk34: "B 30 S eller F 30 S (EI 30-CSa eller E 30-CSa)" },
                  bf85_korridor_sluse_branntrygt: { label: "Korridor/sluse – branntrygt trapperom (Tr2)", bbk12: "A 60 S (EI 60-A2s1,d0-CSa)", bbk34: "A 60 S (EI 60-A2s1,d0-CSa)" },
                  bf85_roykfritt_fri_luft: { label: "Røykfritt trapperom (Tr3) – fri luft", bbk12: "A 60 S (EI 60-A2s1,d0-CSa)", bbk34: "A 60 S (EI 60-A2s1,d0-CSa)" },
                  bf85_korridor_fri_luft: { label: "Korridor – fri luft (i kombinasjon med røykfritt trapperom (Tr3))", bbk12: "B 30 (EI 30-Sa)", bbk34: "B 30 (EI 30-Sa)" },
                  bf85_branncelle_korridor: { label: "Branncelle – korridor", bbk12: "B 30 (EI 30-Sa)", bbk34: "B 15 (EI 15-Sa)" },
                  bf85_loft_trapperom: { label: "Loft – trapperom", bbk12: "B 30 S (EI 30-CSa)", bbk34: "B 15 S (EI 15-CSa)" },
                  bf85_kjeller_trapperom: { label: "Kjeller – trapperom", bbk12: "B 60 S (EI 60-CSa)", bbk34: "B 30 S (EI 30-CSa)" },
                  bf85_kjeller_under_overste: { label: "Kjeller under øverste kjelleretasje – egen trapp eller annen atkomst", bbk12: "A 60 S (EI 60-A2s1,d0-CSa)", bbk34: "A 60 S (EI 60-A2s1,d0-CSa)" },
                };
                const activeDoors = formData.dorPlasseringer
                  .map((id: string) => bf85DorKravMap[id])
                  .filter(Boolean);
                if (activeDoors.length === 0) return null;
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Dørkrav (Tabell 30:75)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-1">
                        {activeDoors.map((d: { label: string; bbk12: string; bbk34: string }, idx: number) => {
                          const krav = isBBK12 ? d.bbk12 : d.bbk34;
                          return <div key={idx}>{d.label}: <span className="font-semibold">{krav}</span></div>;
                        })}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                );
              }

              // TEK17 logic
              const isBKL1 = formData.brannklasse === "BKL1";
              const dorKravMap: Record<string, { label: string; bkl1: string; bkl23: string }> = {
                branncelle_trapperom_tr1: { label: "Branncelle – trapperom Tr 1", bkl1: "EI₂ 30-CSₐ [B 30 S]", bkl23: "EI₂ 30-CSₐ [B 30 S]" },
                korridor_trapperom_tr2: { label: "Korridor – trapperom Tr 2", bkl1: "E 30-CSₐ [F 30 S]", bkl23: "E 30-CSₐ [F 30 S]" },
                mellomliggende_trapperom_tr3: { label: "Mellomliggende rom – trapperom Tr 3", bkl1: "", bkl23: "EI₂ 60-CSₐ [B 60 S]" },
                garasje_brannsluse: { label: "Garasje – brannsluse", bkl1: "EI₂ 60-CSₐ [B 60 S]", bkl23: "EI₂ 60-CSₐ [B 60 S]" },
                branncelle_korridor: { label: "Branncelle – korridor", bkl1: "EI₂ 30-Sₐ [B 30]", bkl23: "EI₂ 30-Sₐ [B 30]" },
                korridor_det_fri_tr3: { label: "Korridor – det fri (i kombinasjon med trapperom Tr 3)", bkl1: "", bkl23: "EI₂ 30-Sₐ [B 30]" },
              };
              const activeDoors = formData.dorPlasseringer
                .map((id: string) => dorKravMap[id])
                .filter(Boolean)
                .filter((d: { bkl1: string; bkl23: string }) => isBKL1 ? d.bkl1 : d.bkl23);
              if (activeDoors.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Dørkrav</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {activeDoors.map((d: { label: string; bkl1: string; bkl23: string }, idx: number) => {
                        const krav = isBKL1 ? d.bkl1 : d.bkl23;
                        if (!krav) return null;
                        return <div key={idx}>{d.label}: <span className="font-semibold">{krav}</span></div>;
                      })}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
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
            {formData.heissjaktkrav && formData.heissjaktkrav.length > 0 && (() => {
              const isBF85 = formData.regelverk === "BF85";
              if (isBF85) {
                const bf85HeisMap: Record<string, React.ReactNode> = {
                  bf85_heis_ventilasjon: (
                    <div className="space-y-1">
                      <p>Heissjakt skal være ventilert med naturlig avtrekk, mekanisk avtrekk eller frisklufttilførsel:</p>
                      <ul className="list-disc ml-4 space-y-0.5">
                        <li>Naturlig avtrekk: Kanaltverrsnitt 50 cm² pr. m² sjaktareal</li>
                        <li>Mekanisk avtrekk: 30 m³/h pr. m² sjaktareal</li>
                        <li>Frisklufttilførsel: 50 cm² pr. m² sjaktareal</li>
                      </ul>
                    </div>
                  ),
                  bf85_heis_dor_brannmotstand: "Dør til heis må ha samme brannmotstand som veggen den står i, eller F 90 (E 90).",
                  bf85_heis_dor_luftsluse: "Brannmotstand for dør fra tilstøtende rom til luftsluse må minst være B 30 (EI 30 Sₐ).",
                };
                const activeKrav = formData.heissjaktkrav
                  .map((id: string, idx: number) => ({ id, content: bf85HeisMap[id], num: idx + 1 }))
                  .filter((k: { content: React.ReactNode }) => k.content);
                if (activeKrav.length === 0) return null;
                return (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til heissjakt (Kap. 30:33/30:65)</td>
                    <td className="border border-gray-400 p-2">
                      <div className="space-y-2">
                        {activeKrav.map((k: { id: string; content: React.ReactNode; num: number }) => (
                          <div key={k.id}>{k.num}. {k.content}</div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr/RIV</td>
                  </tr>
                );
              }
              // TEK17
              const heisKravMap: Record<string, string> = {
                heis_roykventileres_8: "I byggverk med inntil 8 etasjer må heissjakten røykventileres, eller det må etableres luftsluse (mellomliggende rom) utført som egen, ventilert branncelle, mellom heissjakten og tilstøtende rom.",
                heis_roykventileres_over8: "Heissjakt i byggverk med mer enn 8 etasjer må røykventileres og i tillegg utføres med luftsluse som beskrevet i nr. 1.",
                heis_dor_brannmotstand: "Dør må ha samme brannmotstand som veggen den står i, med unntak som gitt i nr. 4 og 5.",
                heis_dor_ei60: "I heissjakt med brannmotstand EI 60 kan det benyttes heisdør minst E 90 [F 90]. Heisdør kan utføres uten klasse Sₐ.",
                heis_dor_luftsluse: "Brannmotstand for dør fra tilstøtende rom til luftsluse som beskrevet i nr. 1 og 2 må være minst EI 30-Sₐ.",
              };
              const activeKrav = formData.heissjaktkrav
                .map((id: string, idx: number) => ({ id, text: heisKravMap[id], num: idx + 1 }))
                .filter((k: { text: string }) => k.text);
              if (activeKrav.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Krav til heissjakt</td>
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

              // BF85 Industri, Kontor, Lager, Garasje, Skur – vis automatisk krav
              const industriTyper = ["Industri", "Kontor", "Lager", "Garasje", "Skur"];
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
              const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
              const trapperomTypeMap: Record<number, { lav: string; hoy: string }> = {
                1: { lav: "Tr 1", hoy: "Tr 3" },
                2: { lav: "Tr 1", hoy: "Tr 3" },
                3: { lav: "Tr 2", hoy: "Tr 3" },
                4: { lav: "Tr 1", hoy: "Tr 3" },
                5: { lav: "Tr 2", hoy: "Tr 3" },
                6: { lav: "Tr 2", hoy: "Tr 3" },
              };
              const trType = rk >= 1 && rk <= 6 && floors > 0
                ? (floors <= 8 ? trapperomTypeMap[rk].lav : trapperomTypeMap[rk].hoy)
                : null;
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
                  <td className="border border-gray-400 p-2 align-top">Krav til trapperom{trType && ` (${trType})`}</td>
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
            {formData.roykKontrollKrav && formData.roykKontrollKrav.length > 0 && (() => {
              const roykKravMap: Record<string, string> = {
                royk_romningsvei: "Trapperom som er rømningsvei i byggverk med flere enn to etasjer, må røykventileres.",
                royk_luke_vindu: "I byggverk med inntil 8 etasjer med trapperom Tr 1 eller Tr 2, jf. § 11-13 Tabell 2, er det tilstrekkelig med luke eller vindu med fri åpning minimum 1,0 m² øverst i trapperommet.",
                royk_manuell_bryter: "Luke eller vindu skal kunne åpnes manuelt med bryter fra inngangsplanet.",
                royk_mekanisk_ventilasjon: "Mellomliggende rom knyttet til Tr 2 må ha mekanisk balansert ventilasjon.",
                royk_tr3_trykksetting: "I byggverk med mer enn 8 etasjer med trapperom Tr 3, jf. § 11-13 Tabell 2, må det mellomliggende rommet være åpent mot det fri, eller trapperommet må trykksettes og det mellomliggende rommet må ha trykkavlastning (røykventilasjon).",
                royk_overbygde_garder: "Overbygde gårder og gater må ha røykventilasjon for å hindre røykspredning mellom ulike brannceller som ligger ut mot den overbygde gården.",
                // BF85 §:78 – dynamic based on floor count
                bf85_royk_brannventilasjon: (() => {
                  const etasjer = parseInt(formData.etasjer, 10) || 0;
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
                  <td className="border border-gray-400 p-2 align-top">{formData.regelverk === "BF85" ? "Brannventilasjon (Røykventilasjon)" : "Røykkontroll"}</td>
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
            })()}
            {/* Vertikal brannspredning */}
            {formData.vertikalBrannspredningRelevant && (() => {
              const vbKravMap: Record<string, string> = formData.regelverk === "BF85" ? {
                vb_kjolesone: "Kjølesone mellom vinduer i ulike etasjer skal være minst 1,2 meter og utført med brannmotstand minst E 30.",
              } : {
                vb_kjolesone: "Kjølesone (vertikal avstand) mellom vinduer er minst lik høyden til underliggende vindu og utført med brannmotstand minst E 30.",
                vb_fasade_e30: "Annenhver etasje er utført med fasade minst E 30.",
                vb_inntrukne: "Inntrukne fasadepartier er på minimum 1,2 meter, eller utkragede bygningsdeler med samme brannmotstand som etasjeskiller er minimum 1,2 meter ut fra fasadelivet.",
                vb_sprinkler: "Byggverket har automatisk sprinkleranlegg.",
                vb_takfot: "Med mindre byggverket har automatisk sprinkleranlegg, må takfoten – i hele lengden – utføres som branncellebegrensende konstruksjon for brannpåvirkning nedenfra.",
              };
              const selectedKrav = (formData.vertikalBrannspredningKrav || [])
                .map((id: string) => vbKravMap[id])
                .filter(Boolean);
              // Split into main items (1-4) and takfot (item 2)
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
            {/* Brannspredning via vinduer */}
            {formData.vinduBrannspredningRelevant && (() => {
              const isBF85 = formData.regelverk === "BF85";
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
              
              // Calculate distance-based requirements for each placement type
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
            {formData.branncellerFlerePlanRelevant && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Brannceller over flere plan</td>
                <td className="border border-gray-400 p-2">
                  {formData.regelverk === "BF85"
                    ? "Brannceller kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte."
                    : "Brannceller i risikoklasse 1, 2, 4 og 5 kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte."
                  }
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
            )}
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
            {/* Garasje - TEK17 automatisk genererte krav */}
            {formData.garasjeRelevant && formData.regelverk !== "BF85" && formData.garasjePlassering && formData.garasjeAreal && 
             (formData.garasjeAreal !== "under_50" || formData.garasjeBruksenhet) && (() => {
              const krav = getGarasjeKrav(formData.garasjePlassering, formData.garasjeAreal, formData.garasjeBruksenhet, formData.brannklasse || "");
              // Group by kategori
              const grouped: Record<string, { tekst: string; ansvar: string }[]> = {};
              krav.forEach(k => {
                if (!grouped[k.kategori]) grouped[k.kategori] = [];
                grouped[k.kategori].push({ tekst: k.tekst, ansvar: k.ansvar });
              });
              return Object.entries(grouped).map(([kategori, items]) => (
                <tr key={kategori}>
                  <td className="border border-gray-400 p-2 align-top">{kategori}</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i}>{items.length > 1 ? `${i + 1}. ` : ""}{item.tekst}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">{items[0].ansvar}</td>
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
            <tr className="bg-blue-100">
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
                {(formData.bf85_511 || formData.bf85_512 || formData.bf85_513 || formData.bf85_514 || formData.bf85_515) && (
                  <tr className="bg-gray-100">
                    <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Vegger, tak og nedforet himling (:5)</td>
                  </tr>
                )}
                {formData.bf85_511 && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">:511 Generelt</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm">Bærende eller branncellebegrensende vegg skal ha brannmotstand etter Tabell 30:41. For vegger med brennbar isolasjon gjelder dessuten 30:515. For yttervegger i brannceller som kan utsettes for strålevarme gjennom vindu, dør eller annen åpning i annen branncelle i samme bygning, gjelder bestemmelsene i 30:322 tilsvarende.</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                {formData.bf85_512 && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">:512 Ikke-bærende ytterveggers brannmotstand</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm">Ikke-bærende yttervegger unntatt vindu og dør, skal ha brannmotstand som angitt i Tabell 30:512 nedenfor.</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
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
              <>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt</td>
                  <td className="border border-gray-400 p-2">
                    <p className="text-sm">Byggverk skal prosjekteres og utføres slik at det er liten sannsynlighet for at brann skal oppstå, utvikle og spre seg. Det skal tas hensyn til byggverkets bruk og den nødvendige tiden for rømning og redning.</p>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
                {/* Innvendige overflater og kledninger – noter */}
                {(formData.matNote1 || formData.matNote2 || formData.matNote3 || formData.matNote4) && (
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Innvendige overflater og kledninger</td>
                    <td className="border border-gray-400 p-2">
                      <ol className="list-disc ml-4 space-y-1 text-sm">
                        {formData.matNote1 && (
                          <li>Overflater og kledninger er tilfredsstillende når det benyttes produkter med egenskaper som angitt i tabell 1A og 1B, med unntak gitt i nr. 3 og 4.</li>
                        )}
                        {formData.matNote2 && (
                          <li>Overflater i hulrom betraktes på samme måte som innvendig overflate og må ha minst like gode branntekniske egenskaper.</li>
                        )}
                        {formData.matNote3 && (
                          <li>Rom med brannfarlig virksomhet må ha kledning som tilfredsstiller klasse K<sub>2</sub>10 A2-s1,d0 [K1-A]. Eksempel på rom med brannfarlig virksomhet er rom hvor det oppbevares fyrverkeri, brannfarlig væske kategori 1 og 2, eller rom hvor det utføres varme arbeider som sveising, sliping samt rom hvor det arbeides med åpen varme.</li>
                        )}
                        {formData.matNote4 && (
                          <li>Selv om sikkerhet ved brann dokumenteres ved analyse, må innvendige overflater på vegger og i himlinger ha minst klasse D-s2,d0 [In 2]. Lavere ytelse kan gi uakseptabelt bidrag til brannutviklingen. Dette kan utgjøre en fare for personsikkerheten. En meget rask brannutvikling kan også medføre at automatiske slokkeanlegg ikke har den effekten som er forutsatt.</li>
                        )}
                      </ol>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                )}
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Overflater i brannceller som ikke er rømningsvei</td>
                </tr>
                {formData.risikoklasse === "RK6" ? (
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
                        <span className="text-red-600 font-medium">{formData.brannklasse === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]"}</span>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                  </>
                )}
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
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Utvendige overflater</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Overflater på ytterkledning</td>
                  <td className="border border-gray-400 p-2">
                    <span className="text-red-600 font-medium">{formData.brannklasse === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]"}</span>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Utvendige overflater</td>
                  <td className="border border-gray-400 p-2">
                    <p className="font-medium mb-1">Preaksepterte ytelser</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Utvendige overflater er tilfredsstillende når det benyttes produkter med egenskaper som angitt i tabell 1A og 1B, med unntak gitt i nr. 2 til 4.</li>
                      <li>Yttervegg i byggverk i brannklasse 2 og 3 kan ha utvendig overflate som tilfredsstiller klasse <span className="text-red-600 font-medium">D-s3,d0 [Ut 2]</span>, når enten
                        <ol className="list-decimal ml-6 mt-1 space-y-1">
                          <li>ytterveggen er utformet slik at den hindrer brannspredning i fasaden, eller</li>
                          <li>byggverket er i risikoklasse 1, 2 og 4 og har inntil fire etasjer, og det er liten fare for brannspredning til og fra nabobyggverk.</li>
                        </ol>
                      </li>
                      <li>Overflater i hulrom i ytterveggkonstruksjoner betraktes på samme måte som utvendig overflate og må ha minst like gode branntekniske egenskaper.</li>
                      <li>Byggverk i brannklasse 1 og boliger inntil 3 etasjer kan ha uklassifiserte overflater i hulrom.</li>
                    </ol>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Kledninger</td>
                </tr>
                {formData.risikoklasse === "RK6" ? (
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
                        <span className="text-red-600 font-medium">{formData.brannklasse === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]"}</span>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK</td>
                    </tr>
                  </>
                )}
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Taktekning</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Taktekning</td>
                  <td className="border border-gray-400 p-2">
                    <p className="mb-2">Taktekning kan bidra til brannspredning i et byggverk og mellom ulike byggverk.</p>
                    <p className="font-medium mb-1">Preaksepterte ytelser</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Taktekning må tilfredsstille klasse <span className="text-red-600 font-medium">B<sub>ROOF</sub>(t2) [Ta]</span>.</li>
                      <li>Teglstein, betongtakstein, skifertak og metallplater kan uten ytterligere dokumentasjon antas å tilfredsstille klasse B<sub>ROOF</sub>(t2) [Ta].</li>
                      <li>For småhus kan taktekning være uklassifisert der avstanden mellom de enkelte byggverk er minst 8 m.</li>
                      <li>Ett-sjikts tak av duk og folie må tilfredsstille klasse <span className="text-red-600 font-medium">B-s3,d0 (Ut1)</span>.</li>
                    </ol>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
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
                    <p className="mb-2">Isolasjonsmaterialer kan bidra til brannspredning og røykutvikling i et byggverk.</p>
                    <p className="font-medium mb-1">Preaksepterte ytelser</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Isolasjon må tilfredsstille klasse <span className="text-red-600 font-medium">A2-s1,d0</span> med mindre annet er angitt i nr. 2 til 9.</li>
                      {formData.isolasjonSandwich === "relevant" && (
                        <>
                          <li>Produkter (sandwichelementer) som tilfredsstiller klasse B-s1,d0 eller Eurefic-klasse A, kan benyttes i byggverk i risikoklasse 1–4 i brannklasse 1 og i industri- og lagerbygninger i brannklasse 2. For tak gjelder nr. 6 og 7.</li>
                          <li>Produkter (sandwichelementer) som tilfredsstiller klasse D-s2,d0 eller Eurefic-klasse E, kan benyttes i industri- og lagerbygninger i brannklasse 1. For tak gjelder nr. 6 og 7.</li>
                          <li>Produkter (sandwichelementer) som ikke tilfredsstiller A2-s1,d0 må være beskyttet av kledning K<sub>2</sub>10 A2-s1,d0 [K1-A] mot rømningsveier.</li>
                          <li>Produkter (sandwichelementer) for små kjøle- og fryserom i risikoklasse 4 kan ha uspesifisert ytelse.</li>
                        </>
                      )}
                      {formData.isolasjonBrennbar === "relevant" && (
                        <>
                          <li>Brennbar isolasjon kan benyttes på oversiden av etasjeskiller mot oppforet tak eller loft som bare kan benyttes som lager, forutsatt at
                            <ol className="list-decimal ml-6 mt-1 space-y-1">
                              <li>etasjeskilleren mot oppforet tak eller loft er branncellebegrensende bygningsdel dimensjonert for tosidig brannpåkjenning</li>
                              <li>takkonstruksjonen over etasjeskilleren ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen</li>
                            </ol>
                          </li>
                          <li>Brennbar isolasjon kan benyttes i isolerte takflater forutsatt at
                            <ol className="list-decimal ml-6 mt-1 space-y-1">
                              <li>isolasjonen legges på et bærende underlag som tilfredsstiller klasse A2-s1,d0 og som har dokumentert bæreevne under brann (R-klasse i samsvar med § 11–4)</li>
                              <li>det bærende underlaget beskytter isolasjonen mot varmepåkjenning fra undersiden (for eksempel betongdekke). I brannklasse 1 og 2 kan alternativt den brennbare isolasjonen beskyttes på undersiden av isolasjon av klasse A2-s1,d0 med tilstrekkelig tykkelse til å isolere mot varmepåkjenning.</li>
                              <li>den brennbare isolasjonen er beskyttet på oversiden av isolasjon med tykkelse 30 mm og som tilfredsstiller klasse A2-s1,d0. Alternativt til beskyttelse på oversiden kan den brennbare isolasjonen oppdeles i arealer på inntil 400 m².</li>
                            </ol>
                          </li>
                          <li>Brennbar isolasjon kan benyttes som utvendig tilleggsisolering av yttervegger med unntak for i byggverk i brannklasse 3 og i byggverk i risikoklasse 6 forutsatt at
                            <ol className="list-decimal ml-6 mt-1 space-y-1">
                              <li>det benyttes isolasjonssystemer som er dokumentert ved prøving etter <em>SP Fire 105: Large scale testing of facade systems (1994)</em> eller tilsvarende. Med isolasjonssystemer menes systemer som består av isolasjon og fasademateriale som monteres på et eksisterende underlag.</li>
                              <li>fasademateriale og isolasjon må være prøvet som en enhet. Underlaget må ha branntekniske egenskaper som minst tilsvarer det som ble benyttet ved prøving.</li>
                            </ol>
                          </li>
                          <li>Brennbar isolasjon basert på cellulose- eller tekstilfiber og lignende kan benyttes i byggverk i brannklasse 1, og boliger inntil 3 etasjer. Isolasjonen må tilfredsstille Euroklasse E, eller være i samsvar med <em>NT Fire 035: Building products: Flammability and smouldering resistance of loose-fill thermal insulation (1988)</em>. Isolasjonen kan være utildekket i kaldt uinnredet loft og oppforet tak.</li>
                        </>
                      )}
                      {formData.isolasjonSandwich === "ikke_relevant" && formData.isolasjonBrennbar === "ikke_relevant" && (
                        <li className="list-none ml-0 mt-2 italic text-gray-600">Det er ikke planlagt bruk av sandwichelementer eller brennbar isolasjon i tiltaket. Kun hovedkravet om A2-s1,d0 gjelder.</li>
                      )}
                    </ol>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              </>
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
            <tr className="bg-blue-100">
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
                        <p className="font-medium mb-1">Preaksepterte ytelser</p>
                        <ol className="list-decimal ml-4 space-y-2">
                          <li>Ventilasjonskanal som føres gjennom en brannskillende bygningsdel, må utføres slik at bygningsdelens brannmotstand blir opprettholdt.</li>
                          <li>Innfesting og oppheng for kanaler og ventilasjonsutstyr må utføres slik at forutsatt funksjonstid og brannmotstand blir opprettholdt.</li>
                          <li>Avtrekk fra komfyr må føres i egen kanal.</li>
                          <li>Ventilasjonsanlegg må utføres i materialer som tilfredsstiller klasse <span className="text-red-600 font-medium">A2-s1,d0</span>.</li>
                          {formData.ventKrav9 && <li>Kanal som føres gjennom seksjoneringsvægg, må ha lukkeanordning (brannspjeld) med minimum samme brannmotstand som seksjoneringsvegg.</li>}
                        </ol>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                )}
                {formData.vannAvlopRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Vann- og avløpsrør</td>
                      <td className="border border-gray-400 p-2">
                        <p className="font-medium mb-1">Preaksepterte ytelser</p>
                        <ol className="list-decimal ml-4 space-y-2">
                          <li>Rørgjennomføringer i brannskillende konstruksjoner må ha dokumentert brannmotstand.</li>
                          <li>Plastrør med ytre diameter til og med 32 mm kan føres gjennom murte eller støpte konstruksjoner.</li>
                          <li>Støpejernrør med ytre diameter til og med 110 mm kan føres gjennom murte eller støpte konstruksjoner.</li>
                        </ol>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                )}
                {formData.rorIsolasjonRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Rør- og kanalisolasjon</td>
                      <td className="border border-gray-400 p-2">
                        <p className="font-medium mb-1">Preaksepterte ytelser</p>
                        <ol className="list-decimal ml-4 space-y-2">
                          <li>Dersom den samlede eksponerte overflaten av isolasjonen på rør og kanaler utgjør mer enn 20 prosent av tilgrensende vegg- eller himlingsflate, må isolasjonen tilfredsstille klasse <span className="text-red-600 font-medium">A2<sub>L</sub>-s1,d0</span> [ubrennbar eller begrenset brennbar] eller ha minst samme klasse som de tilgrensende overflatene.</li>
                          <li>Dersom den samlede eksponerte overflaten av isolasjonen utgjør mindre enn 20 prosent av tilgrensende vegg- eller himlingsflate, gjelder følgende:
                            <ol className="list-decimal ml-6 mt-1 space-y-1">
                              <li>Isolasjon på rør og kanaler i rømningsveier må minst tilfredsstille klasse <span className="text-red-600 font-medium">B<sub>L</sub>-s1,d0 [PI]</span>. Unntak gjelder isolasjon på enkeltstående rør eller kanal med ytre diameter til og med 200 mm som minst må tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                              <li>Isolasjon på rør og kanaler som er lagt i sjakt, i hulrom og bak nedforet himling med branncellebegrensende funksjon, må minst tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                              <li>Øvrig isolasjon på rør og kanaler i byggverk i risikoklasse 3, 5 og 6, og i byggverk i brannklasse 2 og 3 må minst tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                              <li>Øvrig isolasjon på rør og kanaler i byggverk i risikoklasse 1, 2 og 4 i brannklasse 1 må minst tilfredsstille klasse <span className="text-red-600 font-medium">D<sub>L</sub>-s3,d0 [PIII]</span>.</li>
                            </ol>
                          </li>
                        </ol>
                        <p className="mt-2 text-sm">Den flaten der rør eller kanal er innfestet, regnes som tilgrensede vegg- eller himlingsflate. For vertikale rør og kanaler er det veggflaten som skal legges til grunn.</p>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIV</td>
                    </tr>
                )}
                {formData.elektriskRelevant && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Elektriske installasjoner</td>
                      <td className="border border-gray-400 p-2">
                        <p className="font-medium mb-1">Preaksepterte ytelser</p>
                        <ol className="list-decimal ml-4 space-y-2">
                          <li>Kabler må ikke legges over nedforet himling eller i hulrom i rømningsvei med mindre ett av følgende punkter er oppfylt:
                            <ol className="list-decimal ml-4 mt-1 space-y-1">
                              <li>kablene representerer liten brannenergi, det vil si mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter</span> hulrom</li>
                              <li>kablene er ført i egen sjakt med sjaktvegger som har brannmotstand tilsvarende branncellebegrensende bygningsdel</li>
                              <li>himlingen har brannmotstand tilsvarende branncellebegrensende bygningsdel</li>
                              <li>hulrommet er sprinklet.</li>
                            </ol>
                          </li>
                          <li>Kabler som utgjør liten brannenergi, det vil si mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter</span> korridor eller hulrom, kan føres ubeskyttet gjennom rømningsvei. Dette er et spesifikt unntak som gjelder kabler, og kan ikke brukes som begrunnelse for andre fravik fra preaksepterte ytelser.</li>
                        </ol>
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIE</td>
                    </tr>
                )}
              </>
            )}
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
      </section>
      <PageFooter pageNum={6 + extraPages} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 className="font-bold mb-3">{sp}. {isTilstand ? "Brannteknisk tilstandsvurdering" : "Beskrivelse av branntekniske ytelseskrav"} (forts.)</h2>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.8 §11-11 Generelle krav om rømning */}
            <tr className="bg-blue-100">
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

            {/* 3.9 §11-12 Tilrettelegging for rømning */}
            <tr className="bg-blue-100">
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
                  <p className="mb-2">Byggverk eller del av byggverk i risikoklasse 4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg. Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner.</p>
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
            {!isBF85 && formData.tilretteleggingLedd2a && (() => {
              const bt = (formData.bygningstype || "").toLowerCase();
              const erBolig = bt.includes("bolig") || bt.includes("enebolig") || bt.includes("rekkehus") || bt.includes("kjedehus") || bt.includes("leilighet") || formData.risikoklasse === "RK4";
              return (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Brannalarmanlegg</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.</p>
                  <p className="mb-2">Brannalarmanlegg må prosjekteres og utføres i samsvar med NS 3960:2019 og NS-EN 54-serien.</p>
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
            {!isBF85 && formData.tilretteleggingLedd3 && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Ledesystem</td>
                <td className="border border-gray-400 p-2">
                  Store byggverk, byggverk beregnet for et stort antall personer og byggverk i risikoklasse 5 og 6 skal ha ledesystem.
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
            )}
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
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.10 &nbsp;&nbsp; {isBF85 ? <>Utganger og rømningsveier fra branncelle (Kap. 30:71–73) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-13 Utgang fra branncelle)</span></> : "§11-13 Utgang fra branncelle"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelt</td>
              <td className="border border-gray-400 p-2">
                Fra en branncelle skal det minst være én utgang til sikkert sted, eller utganger til to uavhengige rømningsveier.
              </td>
              <td className="border border-gray-400 p-2 align-top">-</td>
            </tr>
            {/* Boenhet kun ett trapperom */}
            {formData.boenhetKunEttTrapperom && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Trapperom (boenhet)</td>
                <td className="border border-gray-400 p-2">
                  Boenheter har kun tilgang til ett trapperom. Det skal være alternativ rømningsvei, f.eks. via vindu eller balkong.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Brannceller over flere etasjer */}
            {formData.branncelleFlereEtasjer && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Branncelle over flere etasjer</td>
                <td className="border border-gray-400 p-2">
                  Brannceller som strekker seg over flere etasjer eller har mellometasje skal ha utganger som sikrer rømning fra alle plan.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Lavt byggverk med vinduer for rømning */}
            {formData.lavtByggverkVinduerRomning && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Vinduer for rømning</td>
                <td className="border border-gray-400 p-2">
                  Lavt byggverk (RK 1–4) med vinduer som sikrer rømning. Vindu kan benyttes som alternativ rømningsvei i etasjer med gulv inntil 5,0 m over planert terreng.
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Stort antall personer */}
            {formData.branncelleStortAntallPersoner && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Persontall</td>
                <td className="border border-gray-400 p-2">
                  <div className="space-y-1">
                    <p>Branncelle beregnet for stort antall personer.</p>
                    {formData.persontallAreal && formData.persontallKategori && (() => {
                      const arealPerPerson: Record<string, number> = {
                        salgslokaler: 2, kontor: 15, skoler: 2, barnehager: 4, forsamlingslokaler: 0.6, spisesaler: 1.4
                      };
                      const areal = parseFloat(formData.persontallAreal) || 0;
                      const factor = arealPerPerson[formData.persontallKategori] || 1;
                      const persontall = Math.floor(areal / factor);
                      return <p><strong>Beregnet persontall:</strong> {persontall} personer ({areal} m² / {factor} m²/pers)</p>;
                    })()}
                    <ul className="list-disc list-inside text-sm mt-1">
                      {formData.stortAntallUnder600 && <li>Inntil 600 personer: Minst 2 utganger fra branncellen. Dør i rømningsretning, bredde min. 1,16 m.</li>}
                      {formData.stortAntallOver600 && <li>Mer enn 600 personer: Minst 3 utganger, fordelt slik at personbelastningen utjevnes.</li>}
                      {formData.stortAntallUnder150 && <li>Mindre enn 150 personer: Kan ha én utgang dersom rømningsforholdene tilsier det.</li>}
                      {formData.stortAntallFlereEtasjer && <li>Branncelle over flere etasjer: Utganger fra hvert plan branncellen strekker seg over.</li>}
                    </ul>
                  </div>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Dør-krav */}
            {(formData.dorerTilbakerømning || formData.dorerNattlaser || formData.dorerLiteAntallPersoner || formData.dorerStromforsyningBKL1 || formData.dorerStromforsyningBKL2 || formData.dorerStromforsyningBKL3) && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Dører</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {formData.dorerTilbakerømning && <li>Låsesystem skal tillate tilbakerømning (retur gjennom dør etter passering).</li>}
                    {formData.dorerNattlaser && <li>Nattlåser benyttes. Dører med nattlås skal kunne åpnes med én håndgrepsbevegelse uten bruk av nøkkel ved rømning.</li>}
                    {formData.dorerLiteAntallPersoner && <li>Rom med færre enn 10 personer: Dør kan slå mot rømningsretningen.</li>}
                    {formData.dorerStromforsyningBKL1 && <li>Elektriske låsesystemer i BKL1 skal ha reservestrømforsyning (UPS) i minst 30 minutter.</li>}
                    {(formData.dorerStromforsyningBKL2 || formData.dorerStromforsyningBKL3) && <li>Elektriske låsesystemer i BKL2/BKL3 skal ha reservestrømforsyning (UPS) i minst 60 minutter.</li>}
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK / RIE</td>
              </tr>
            )}
            {/* Rømningsvindu */}
            {formData.romningsvinduRelevant && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Evakuering via vindu</td>
                <td className="border border-gray-400 p-2">
                  <div className="space-y-1 text-sm">
                    <p>Vindu benyttes som rømningsvei. Fri åpning min. 0,50 m × 0,60 m.</p>
                    {formData.romningsvinduHoyde && <p>Høyde over terreng: {formData.romningsvinduHoyde} m.</p>}
                    {formData.romningsvinduGulvAvstand && <p>Avstand fra gulv til underkant vindu: {formData.romningsvinduGulvAvstand} m (maks 1,0 m).</p>}
                    <ul className="list-disc list-inside">
                      {formData.romningsvinduHarStige && <li>Fastmontert stige med ryggbøyler er montert til rømningsvindu.</li>}
                      {formData.romningsvinduHarBalkong && <li>Utgang til balkong er tilgjengelig som alternativ rømningsvei.</li>}
                    </ul>
                  </div>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {formData.utgangBranncelle && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Utganger</td>
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

            {/* 3.11 §11-14 Rømningsvei */}
            <tr className="bg-blue-100">
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

            {/* 3.13 §11-16 Manuell slokking */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.12 &nbsp;&nbsp; {isBF85 ? <>Slokkingsredskap og slokkingsvann (Kap. 30:93/31–39) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-16 Tilrettelegging for manuell slokking)</span></> : "§11-16 Tilrettelegging for manuell slokking"}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Generelt</td>
              <td className="border border-gray-400 p-2">Byggverk skal være tilrettelagt for effektiv manuell slokking av brann.</td>
              <td className="border border-gray-400 p-2 align-top">RIV</td>
            </tr>
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
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>{sp}.13 &nbsp;&nbsp; {isBF85 ? <>Atkomst for brannvesenet (Kap. 30:92/94/95) <span style={{fontWeight: 'normal', fontStyle: 'italic'}}>(§11-17 Tilrettelegging for slokkemannskap)</span></> : "§11-17 Tilrettelegging for slokkemannskap"}</td>
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
      <PageFooter pageNum={7 + extraPages} />
      </div>
      


      {documentType !== "tilstandsvurdering" && (
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 className="font-bold mb-3">4. Utførelses- og driftsfasen</h2>
        <h3 className="font-semibold mb-2">4.1 Utførelsesfasen</h3>
        <p className="ml-4 mb-3">{formData.utfoerelse || "[Krav til utførelse beskrives]"}</p>
        <h3 className="font-semibold mb-2">4.2 Driftsfasen</h3>
        <p className="ml-4 mb-3">{formData.drift || "[Krav til drift og vedlikehold beskrives]"}</p>
      </section>

      {/* 5. Revisjonshistorikk */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">5. Revisjonshistorikk</h2>
        <p className="ml-4">{formData.revisjon || "[Revisjonslogg]"}</p>
      </section>

      {/* 6. Litteraturhenvisninger */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">6. Litteraturhenvisninger</h2>
        <ul className="ml-4 list-disc list-inside">
          <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
          <li>VTEK17 - Veiledning til teknisk forskrift</li>
          <li>NS 3901 - Krav til risikovurdering av brann i byggverk</li>
        </ul>
      </section>

      {formData.fravik && (
        <section className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h2 className="font-bold mb-3">Fravik og kompenserende tiltak</h2>
          <p className="ml-4">{formData.fravik}</p>
        </section>
      )}
      <PageFooter pageNum={totalPages} />
      </div>
      )}

      {documentType === "tilstandsvurdering" && (
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 className="font-bold mb-3">3. Revisjonshistorikk</h2>
        <p className="ml-4">{formData.revisjon || "[Revisjonslogg]"}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-bold mb-3">4. Litteraturhenvisninger</h2>
        <ul className="ml-4 list-disc list-inside">
          {isBF85 ? (
            <>
              <li>Byggeforskrift 1985 (BF85) – Del 3 Brannvern</li>
              <li>NS 3424 - Tilstandsanalyse av byggverk</li>
              <li>NS 3901 - Krav til risikovurdering av brann i byggverk</li>
            </>
          ) : (
            <>
              <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
              <li>VTEK17 - Veiledning til teknisk forskrift</li>
              <li>NS 3901 - Krav til risikovurdering av brann i byggverk</li>
              <li>NS 3424 - Tilstandsanalyse av byggverk</li>
            </>
          )}
        </ul>
      </section>

      {formData.fravik && (
        <section className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h2 className="font-bold mb-3">Fravik og kompenserende tiltak</h2>
          <p className="ml-4">{formData.fravik}</p>
        </section>
      )}
      <PageFooter pageNum={totalPages} />
      </div>
      )}
    </div>
  );
};

export default KonseptPreview;
