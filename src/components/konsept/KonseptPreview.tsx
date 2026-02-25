import React from "react";
import { branncelleTyperListe, getBrannklasse } from "@/lib/fire-concept-constants";
import { getGarasjeKrav } from "@/lib/garasje-krav";
import { getBrensellagringKrav, BrenselType } from "@/lib/brensellagring-krav";

interface KonseptPreviewProps {
  formData: Record<string, any>;
  logoUrl?: string | null;
  authorInfo?: { name: string; company: string } | null;
}

const KonseptPreview = ({ formData, logoUrl, authorInfo }: KonseptPreviewProps) => {
  // Ensure arrays have defaults
  const bygningsdeler = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
  const grunnlagsdokumenter = Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [];
  const branncelleTyper = Array.isArray(formData.branncelleTyper) ? formData.branncelleTyper : [];
  const baereevneUnntak = Array.isArray(formData.baereevneUnntak) ? formData.baereevneUnntak : [];

  const pageStyle = "bg-white text-black p-10 rounded-lg shadow-md text-sm border border-gray-200 mx-auto relative";
  const pageWidth = { maxWidth: '210mm', minHeight: '297mm', paddingBottom: '40px', fontFamily: 'Verdana, Geneva, sans-serif' };
  const hasSammendrag = !!formData.sammendrag;
  const totalPages = hasSammendrag ? 9 : 8;

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
          BRANNKONSEPT
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

      {/* Innholdsfortegnelse - egen side */}
      <div className={pageStyle} style={pageWidth}>
        <h2 className="text-xl font-bold text-center mb-6 pb-4">
          BRANNKONSEPT
        </h2>
      
      {/* Innholdsfortegnelse */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">Innholdsfortegnelse</h2>
        <div className="space-y-1 text-xs">
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
        </div>
      </section>
      <PageFooter pageNum={hasSammendrag ? 3 : 2} />
      </div>

      {/* Kapittel 1-2 - egen side */}
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
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">Type tiltak</td>
              <td className="border border-gray-400 p-2">{formData.tiltakstype || "[Angis]"}</td>
            </tr>
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
      </section>
      <PageFooter pageNum={hasSammendrag ? 4 : 3} />
      </div>

      {/* Kapittel 2 - egen side */}
      <div className={pageStyle} style={pageWidth}>
      {/* 2. Grunnlag og forutsetninger */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">2. Grunnlag og forutsetninger for brannteknisk prosjektering</h2>
        
        <h3 className="font-semibold mb-2">2.1 Grunnlagsdokumenter</h3>
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
        {formData.harFlereRisikoklasser && bygningsdeler.length > 0 ? (
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
      </section>
      <PageFooter pageNum={hasSammendrag ? 5 : 4} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      {/* 3. Branntekniske ytelseskrav */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">3. Beskrivelse av branntekniske ytelseskrav</h2>
        
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.1 § 11-4 Bæreevne og stabilitet */}
            {formData.harFlereRisikoklasser && bygningsdeler.length > 0 ? (
              <>
                <tr className="bg-blue-100">
                  <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                    3.1 &nbsp;&nbsp; §11-4 Bæreevne og stabilitet
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
                    3.1 &nbsp;&nbsp; §11-4 Bæreevne og stabilitet
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

            {/* 3.2 §11-5 Sikkerhet ved eksplosjon */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                3.2 &nbsp;&nbsp; §11-5 Sikkerhet ved eksplosjon
              </td>
            </tr>
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

            {/* 3.3 §11-6 Brannspredning mellom byggverk */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.3 &nbsp;&nbsp; §11-6 Brannspredning mellom byggverk</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
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
            {formData.brannspredningKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.brannspredningKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}

            {/* 3.4 §11-7 Brannseksjoner */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.4 &nbsp;&nbsp; §11-7 Brannseksjoner</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
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
            {formData.brannseksjonerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.brannseksjonerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}

          </tbody>
        </table>
      </section>
      <PageFooter pageNum={hasSammendrag ? 6 : 5} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 className="font-bold mb-3">3. Beskrivelse av branntekniske ytelseskrav (forts.)</h2>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.5 §11-8 Brannceller */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.5 &nbsp;&nbsp; §11-8 Brannceller</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
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
            {formData.heismaskinromRelevant === "ja" && formData.brannklasse && (
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
            {formData.fyrromRelevant === "ja" && formData.brannklasse && (
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
                <td className="border border-gray-400 p-2">Vindu med brannmotstand må ikke kunne åpnes i vanlig brukstilstand.</td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
            )}
            {/* Heissjakt */}
            {formData.heissjaktkrav && formData.heissjaktkrav.length > 0 && (() => {
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
            {formData.trapperomKrav && formData.trapperomKrav.length > 0 && (() => {
              const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
              const floors = parseInt(formData.etasjer || '0', 10);
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
              };
              const activeKrav = formData.roykKontrollKrav
                .map((id: string, idx: number) => ({ id, text: roykKravMap[id], num: idx + 1 }))
                .filter((k: { text: string }) => k.text);
              if (activeKrav.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Røykkontroll</td>
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
              const vbKravMap: Record<string, string> = {
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
              const vvKravMap: Record<string, string> = {
                vv_branncellebegrensende: "Branncellebegrensende konstruksjoner i et byggverk, eller mellom to lave byggverk, må utføres slik at det blir liten sannsynlighet for brannspredning via vinduer som ligger med liten innbyrdes avstand i innvendig hjørne, eller mellom vinduer i motstående fasader.",
                vv_brannmotstand_vegg: "Vinduer må ha samme brannmotstand som veggen de står i, med unntak som gitt i tabell 3. For motstående parallelle yttervegger gjelder tabell 3 bare når vindusarealet ikke utgjør mer enn 1/3 av veggarealet.",
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
            {formData.branncellerFlerePlanRelevant && (() => {
              const fpKravMap: Record<string, string> = {
                fp_sprinkler: "Det må installeres automatisk sprinkleranlegg når samlet bruttoareal for plan som har åpen forbindelse er over 800 m², jf. også § 11-12 første ledd.",
                fp_romningsvei: "Det må være tilrettelagte rømningsveier fra hvert enkelt plan, jf. også § 11-13 fjerde ledd.",
              };
              const activeKrav = (formData.branncellerFlerePlanKrav || [])
                .map((id: string, idx: number) => ({ id, text: fpKravMap[id], num: idx + 1 }))
                .filter((k: { text: string }) => k.text);
              if (activeKrav.length === 0) return null;
              return (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Brannceller over flere plan</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      <div>Brannceller i risikoklasse 1, 2, 4 og 5 kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte, dersom følgende ytelser er oppfylt:</div>
                      {activeKrav.map((k: { id: string; text: string; num: number }) => (
                        <div key={k.id} className="pl-4">{k.num}. {k.text}</div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              );
            })()}
            {/* Garasje - automatisk genererte krav */}
            {formData.garasjeRelevant && formData.garasjePlassering && formData.garasjeAreal && 
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
            {/* Brensellagring - automatisk genererte krav */}
            {formData.brensellagringRelevant && formData.brenselType && formData.brenselMengde && (() => {
              const result = getBrensellagringKrav(formData.brenselType as BrenselType, parseInt(formData.brenselMengde));
              if (result.feilmelding || result.krav.length === 0) return null;
              return (
                <>
                  <tr className="bg-blue-50">
                    <td className="border border-gray-400 p-2 font-semibold" colSpan={3}>
                      Rom for lagring av flytende brensel ({result.romType})
                    </td>
                  </tr>
                  {result.krav.map((k, i) => (
                    <tr key={`brensel-${i}`}>
                      <td className="border border-gray-400 p-2 align-top">{k.kategori}</td>
                      <td className="border border-gray-400 p-2">{k.tekst}</td>
                      <td className="border border-gray-400 p-2 align-top">{k.ansvar}</td>
                    </tr>
                  ))}
                </>
              );
            })()}
            {formData.branncellerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.branncellerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}

            {/* 3.6 §11-9 Materialer og produkter */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.6 &nbsp;&nbsp; §11-9 Materialer og produkters egenskaper ved brann</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Overflater i brannceller som ikke er rømningsvei</td>
            </tr>
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
            <tr className="bg-blue-100">
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
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Utvendige overflater</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Overflater på ytterkledning</td>
              <td className="border border-gray-400 p-2">
                <span className="text-red-600 font-medium">{formData.brannklasse === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]"}</span>
              </td>
              <td className="border border-gray-400 p-2 align-top">ARK</td>
            </tr>
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Kledninger</td>
            </tr>
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
            <tr className="bg-blue-100">
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
            {formData.materialerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.materialerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}

            {/* 3.7 §11-10 Tekniske installasjoner */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.7 &nbsp;&nbsp; §11-10 Tekniske installasjoner</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            {formData.ventilasjonRelevant && (
              <>
                <tr className="bg-blue-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>A. Ventilasjonsanlegg</td>
                </tr>
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
              </>
            )}
            {formData.vannAvlopRelevant && (
              <>
                <tr className="bg-blue-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>B. Vann- og avløpsrør</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Rørgjennomføringer</td>
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
              </>
            )}
            {formData.elektriskRelevant && (
              <>
                <tr className="bg-blue-100">
                  <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>D. Elektriske installasjoner</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Elektriske installasjoner</td>
                  <td className="border border-gray-400 p-2">
                    <p className="font-medium mb-1">Preaksepterte ytelser</p>
                    <ol className="list-decimal ml-4 space-y-2">
                      <li>Kabler må ikke legges over nedforet himling eller i hulrom i rømningsvei med mindre brannenergien er mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter</span>.</li>
                      <li>Kabler som utgjør liten brannenergi kan føres ubeskyttet gjennom rømningsvei.</li>
                    </ol>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              </>
            )}
            {formData.installasjonerKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.installasjonerKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}

          </tbody>
        </table>
      </section>
      <PageFooter pageNum={hasSammendrag ? 7 : 6} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      <section className="mb-6">
        <h2 className="font-bold mb-3">3. Beskrivelse av branntekniske ytelseskrav (forts.)</h2>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {/* 3.8 §11-11 Generelle krav om rømning */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.8 &nbsp;&nbsp; §11-11 Generelle krav om rømning og redning</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 align-top">Rømning og redning</td>
              <td className="border border-gray-400 p-2">
                <p className="font-medium mb-2">Krav fra TEK17 §11-11</p>
                <ul className="list-disc ml-4 space-y-3">
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
            {formData.romningSikkerhetKommentar && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                <td className="border border-gray-400 p-2 italic">{formData.romningSikkerhetKommentar}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
            )}

            {/* 3.9 §11-12 Tilrettelegging for rømning */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.9 &nbsp;&nbsp; §11-12 Tilrettelegging for rømning og redning</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
              <th className="border border-gray-400 p-2 text-left">Løsning</th>
              <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
            </tr>
            {formData.tilretteleggingLedd2a && (
              <tr>
                <td className="border border-gray-400 p-2 align-top">Brannalarmanlegg</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.</p>
                  <p>Brannalarmanlegg må prosjekteres og utføres i samsvar med NS 3960:2019 og NS-EN 54-serien.</p>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIE</td>
              </tr>
            )}
            {formData.tilretteleggingLedd3 && (
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

            {/* 3.10 §11-13 Utgang fra branncelle */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.10 &nbsp;&nbsp; §11-13 Utgang fra branncelle</td>
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

            {/* 3.11 §11-14 Rømningsvei */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.11 &nbsp;&nbsp; §11-14 Rømningsvei</td>
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

            {/* 3.13 §11-16 Manuell slokking */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.13 &nbsp;&nbsp; §11-16 Tilrettelegging for manuell slokking</td>
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

            {/* 3.14 §11-17 Tilrettelegging for slokkemannskap */}
            <tr className="bg-blue-100">
              <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.14 &nbsp;&nbsp; §11-17 Tilrettelegging for slokkemannskap</td>
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
          </tbody>
        </table>
      </section>
      <PageFooter pageNum={hasSammendrag ? 8 : 7} />
      </div>
      <div className={pageStyle} style={pageWidth}>
      {/* 4. Utførelses- og driftsfasen */}
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
    </div>
  );
};

export default KonseptPreview;
