import React from "react";
import { FravikEntry } from "./FravikEntryForm";
import { AttachedCalculation } from "./BeregningSection";


const SIGMA = 5.67e-8;

function getBeregningsSteg(calc: AttachedCalculation): string[] {
  if (calc.type === "straling") {
    const eps = Number(calc.inputs.emissivitet) || 0;
    const TfC = Number(calc.inputs.flammetemperatur_C) || 0;
    const TfK = TfC + 273.15;
    const F12 = Number(calc.inputs.siktfaktor) || 0;
    const Ef = eps * SIGMA * Math.pow(TfK, 4);
    const EfKW = Math.round((Ef / 1000) * 100) / 100;
    const q = Ef * F12;
    const qKW = Math.round((q / 1000) * 100) / 100;
    return [
      `Tf = ${TfC} °C + 273.15 = ${TfK.toFixed(1)} K`,
      `Ef = ${eps} × σ × ${TfK.toFixed(1)}⁴ = ${EfKW} kW/m²`,
      `q″rad = ${EfKW} × ${F12} = ${qKW} kW/m²`,
    ];
  }
  if (calc.type === "flammehoyde") {
    const Q = Number(calc.inputs.branneffekt_kW) || 0;
    const D = Number(calc.inputs.diameter_m) || 0;
    const Lf = Math.max(0, 0.235 * Math.pow(Q, 0.4) - 1.02 * D);
    const LfRound = Math.round(Lf * 100) / 100;
    const tip = Math.round(LfRound * 1.5 * 100) / 100;
    return [
      `Lf = 0.235 × ${Q}^0.4 − 1.02 × ${D} = ${LfRound} m`,
      `Flammetipp = 1.5 × ${LfRound} = ${tip} m`,
    ];
  }
  if (calc.type === "brannenergi") {
    try {
      const mats = JSON.parse(String(calc.inputs.materialer || "[]"));
      const lines: string[] = [];
      let sum = 0;
      mats.forEach((m: { name: string; mjPerKg: number; kg: number }) => {
        const q = m.mjPerKg * m.kg;
        sum += q;
        lines.push(`${m.name}: ${m.kg} kg × ${m.mjPerKg} MJ/kg = ${Math.round(q)} MJ`);
      });
      lines.push(`Total: ${Math.round(sum)} MJ`);
      if (calc.inputs.romareal_m2) {
        lines.push(`Spesifikk: ${Math.round(sum)} / ${calc.inputs.romareal_m2} = ${Math.round(sum / Number(calc.inputs.romareal_m2))} MJ/m²`);
      }
      return lines;
    } catch { return []; }
  }
  return [];
}

const formelMap: Record<string, string[]> = {
  straling: ["Ef = ε · σ · Tf⁴", "q″rad = Ef · F₁₂"],
  flammehoyde: ["Lf = 0.235 · Q̇²/⁵ − 1.02 · D"],
  brannenergi: ["Q = Σ (mi · Hc,i)", "q = Q / Arom"],
};

const paramLabels: Record<string, string> = {
  emissivitet: "Emissivitet (ε)", flammetemperatur_C: "Flammetemperatur", siktfaktor: "Siktfaktor (F₁₂)",
  hoyde_m: "Høyde åpning", bredde_m: "Bredde åpning", avstand_m: "Avstand",
  branneffekt_kW: "Branneffekt", diameter_m: "Diameter", romareal_m2: "Romareal",
};

const paramUnits: Record<string, string> = {
  flammetemperatur_C: "°C", siktfaktor: "", emissivitet: "",
  hoyde_m: "m", bredde_m: "m", avstand_m: "m", diameter_m: "m",
  branneffekt_kW: "kW", romareal_m2: "m²",
};

interface KvalitativPreviewProps {
  fravikEntries: FravikEntry[];
  logoUrl?: string | null;
  projectData?: { name?: string; address?: string | null } | null;
  profileData?: { full_name?: string; company?: string; title?: string; education?: string } | null;
}

const KvalitativPreview = ({ fravikEntries, logoUrl, projectData, profileData }: KvalitativPreviewProps) => {
  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-inner font-serif text-sm" style={{ minHeight: '600px' }}>
      {logoUrl && (
        <div className="flex justify-center mb-4">
          <img src={logoUrl} alt="Firmalogo" className="max-h-24 max-w-[300px] object-contain" />
        </div>
      )}
      <h1 className="text-xl font-bold text-center mb-2 pb-2">
        FRAVIKSDOKUMENTASJON
      </h1>
      <p className="text-center text-xs mb-6 text-gray-500">Kvalitativ analyse iht. Byggforsk 321.026 kap. 6</p>

      {/* Sammendrag */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">Sammendrag</h2>
        <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold w-1/3 bg-gray-50">Prosjekt</td>
              <td className="border border-gray-400 p-2">{projectData?.name || "[Prosjektnavn]"}</td>
            </tr>
            {projectData?.address && (
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-50">Adresse</td>
                <td className="border border-gray-400 p-2">{projectData.address}</td>
              </tr>
            )}
            <tr>
              <td className="border border-gray-400 p-2 font-semibold bg-gray-50">Utarbeidet av</td>
              <td className="border border-gray-400 p-2">
                {profileData?.full_name || "[Navn]"}
                {profileData?.title && `, ${profileData.title}`}
              </td>
            </tr>
            {profileData?.company && (
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-50">Firma</td>
                <td className="border border-gray-400 p-2">{profileData.company}</td>
              </tr>
            )}
            <tr>
              <td className="border border-gray-400 p-2 font-semibold bg-gray-50">Antall fravik</td>
              <td className="border border-gray-400 p-2">{fravikEntries.length}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <hr className="my-6 border-gray-300" />

      {/* Innholdsfortegnelse */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">Innholdsfortegnelse</h2>
        <div className="space-y-1 text-xs">
          {fravikEntries.map((fravik, i) => (
            <React.Fragment key={i}>
              <p><span className="font-bold">{i + 1}.</span> Fravik {i + 1}</p>
              <p className="ml-4">{i + 1}.1 Funksjonskrav i TEK17</p>
              <p className="ml-4">{i + 1}.2 Preakseptert ytelse</p>
              <p className="ml-4">{i + 1}.3 Hensikt med ytelsen</p>
              <p className="ml-4">{i + 1}.4 Beskrivelse av fraviket</p>
              <p className="ml-4">{i + 1}.5 Kompenserende tiltak</p>
              <p className="ml-4">{i + 1}.6 Innvirkningsområder</p>
              {(fravik.beregninger?.length ?? 0) > 0 && (
                <p className="ml-4">{i + 1}.7 Beregninger</p>
              )}
              <p className="ml-4">{i + 1}.{(fravik.beregninger?.length ?? 0) > 0 ? 8 : 7} Kvalitativ analyse</p>
              <p className="ml-4">{i + 1}.{(fravik.beregninger?.length ?? 0) > 0 ? 9 : 8} Konklusjon</p>
            </React.Fragment>
          ))}
        </div>
      </section>

      <hr className="my-6 border-gray-300" />

      {fravikEntries.map((fravik, i) => {
        const harTiltak = fravik.tiltak.some(t => t.beskrivelse);
        const harBeregninger = (fravik.beregninger?.length ?? 0) > 0;
        const n = i + 1;
        const analyseNum = harBeregninger ? 8 : 7;
        const konklusjonNum = harBeregninger ? 9 : 8;

        return (
          <React.Fragment key={fravik.id}>
            {i > 0 && <hr className="my-6 border-gray-300" />}

            <section className="mb-6">
              <h2 className="font-bold text-lg mb-4">{n}. Fravik {n}</h2>

              <h3 className="font-semibold mb-2">{n}.1 Funksjonskrav i TEK17</h3>
              <p className="ml-4 mb-3">{fravik.funksjonskrav || "[Angis]"}</p>

              <h3 className="font-semibold mb-2">{n}.2 Preakseptert ytelse som det fravikes fra</h3>
              <p className="ml-4 mb-3">{fravik.preakseptertYtelse || "[Angis]"}</p>

              <h3 className="font-semibold mb-2">{n}.3 Opprinnelig hensikt med den preaksepterte ytelsen</h3>
              <p className="ml-4 mb-3">{fravik.hensiktYtelse || "[Angis]"}</p>

              <h3 className="font-semibold mb-2">{n}.4 Beskrivelse av fraviket</h3>
              <p className="ml-4 mb-3">{fravik.fravikBeskrivelse || "[Angis]"}</p>

              {/* Kompenserende tiltak */}
              <h3 className="font-semibold mb-2">{n}.5 Kompenserende tiltak</h3>
              {harTiltak ? (
                fravik.tiltak.filter(t => t.beskrivelse).map((t, ti) => (
                  <div key={t.id} className="mb-4">
                    <h4 className="font-semibold mb-2 ml-4">Tiltak {ti + 1}: {t.beskrivelse}</h4>
                    <table className="w-full border-collapse border border-gray-400 text-xs mb-2">
                      <tbody>
                        {t.funksjonalitet && (
                          <tr>
                            <td className="border border-gray-400 p-2 font-semibold w-1/3">Funksjonalitet</td>
                            <td className="border border-gray-400 p-2">{t.funksjonalitet}</td>
                          </tr>
                        )}
                        {t.palitelighet && (
                          <tr>
                            <td className="border border-gray-400 p-2 font-semibold">Pålitelighet</td>
                            <td className="border border-gray-400 p-2">{t.palitelighet}</td>
                          </tr>
                        )}
                        {t.robusthet && (
                          <tr>
                            <td className="border border-gray-400 p-2 font-semibold">Robusthet og fleksibilitet</td>
                            <td className="border border-gray-400 p-2">{t.robusthet}</td>
                          </tr>
                        )}
                        {t.vedlikehold && (
                          <tr>
                            <td className="border border-gray-400 p-2 font-semibold">Oppfølging og vedlikehold</td>
                            <td className="border border-gray-400 p-2">{t.vedlikehold}</td>
                          </tr>
                        )}
                        {t.andreEffekter && (
                          <tr>
                            <td className="border border-gray-400 p-2 font-semibold">Andre effekter</td>
                            <td className="border border-gray-400 p-2">{t.andreEffekter}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <p className="ml-4 mb-3">[Kompenserende tiltak angis]</p>
              )}

              {/* Innvirkningsområder */}
              <h3 className="font-semibold mb-2">{n}.6 Fravikets områder for innvirkning</h3>
              <p className="ml-4 mb-3 whitespace-pre-wrap">{fravik.innvirkningBeskrivelse || "[Angis]"}</p>

              {/* Beregninger */}
              {harBeregninger && (
                <>
                  <h3 className="font-semibold mb-2">{n}.7 Beregninger</h3>
                  {fravik.beregninger!.map((calc, ci) => {
                    const typeLabels: Record<string, string> = {
                      straling: "Strålingsberegning (Solid flamme-modell)",
                      flammehoyde: "Flammehøydeberegning (Heskestads korrelasjon)",
                      brannenergi: "Brannenergiberegning",
                    };
                    const formler = formelMap[calc.type] || [];
                    const steg = getBeregningsSteg(calc);
                    return (
                      <div key={calc.id} className="ml-4 mb-4">
                        <h4 className="font-semibold mb-1 text-xs">Beregning {ci + 1}: {typeLabels[calc.type] || calc.type}</h4>

                        {/* Formel */}
                        {formler.length > 0 && (
                          <div className="bg-gray-50 p-2 rounded mb-2 font-mono text-xs">
                            {formler.map((f, fi) => <p key={fi}>{f}</p>)}
                          </div>
                        )}

                        {/* Inngangsparametre */}
                        <table className="w-full border-collapse border border-gray-400 text-xs mb-2">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-400 p-2 text-left w-1/2">Parameter</th>
                              <th className="border border-gray-400 p-2 text-left w-1/2">Verdi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(calc.inputs).filter(([k]) => k !== "materialer").map(([key, val]) => (
                              <tr key={key}>
                                <td className="border border-gray-400 p-2">{paramLabels[key] || key.replace(/_/g, " ")}</td>
                                <td className="border border-gray-400 p-2">{val}{paramUnits[key] ? ` ${paramUnits[key]}` : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Beregningssteg */}
                        {steg.length > 0 && (
                          <div className="bg-gray-50 p-2 rounded mb-2 text-xs font-mono space-y-0.5">
                            <p className="font-semibold font-sans">Beregning:</p>
                            {steg.map((s, si) => <p key={si}>{s}</p>)}
                          </div>
                        )}

                        {/* Resultater */}
                        <table className="w-full border-collapse border border-gray-400 text-xs mb-2">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-400 p-2 text-left w-1/2">Resultat</th>
                              <th className="border border-gray-400 p-2 text-left w-1/2">Verdi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(calc.results).map(([key, val]) => (
                              <tr key={key}>
                                <td className="border border-gray-400 p-2 font-semibold">{paramLabels[key] || key.replace(/_/g, " ")}</td>
                                <td className="border border-gray-400 p-2 font-semibold">{val}{paramUnits[key] ? ` ${paramUnits[key]}` : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {calc.kommentar && <p className="text-xs italic ml-2">{calc.kommentar}</p>}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Kvalitativ analyse */}
              <h3 className="font-semibold mb-2">{n}.{analyseNum} Kvalitativ analyse</h3>
              <h4 className="font-semibold mb-1 ml-4 text-xs">Sammenligning</h4>
              <p className="ml-4 mb-3">{fravik.sammenligning || "[Angis]"}</p>
              <h4 className="font-semibold mb-1 ml-4 text-xs">Måleparametre</h4>
              <p className="ml-4 mb-3">{fravik.maleparametre || "[Angis]"}</p>
              {fravik.visReferanser !== false && (
                <>
                  <h4 className="font-semibold mb-1 ml-4 text-xs">Referanser</h4>
                  <p className="ml-4 mb-3">{fravik.referanser || "[Angis]"}</p>
                </>
              )}

              {/* Konklusjon */}
              <h3 className="font-semibold mb-2">{n}.{konklusjonNum} Konklusjon</h3>
              <p className="ml-4 mb-2">
                {fravik.konklusjon === "tilstrekkelig" && "Den kvalitative analysen vurderes som tilstrekkelig."}
                {fravik.konklusjon === "komparativ" && "Det er behov for komparativ analyse for å dokumentere likeverdighet."}
                {fravik.konklusjon === "risikoanalyse" && "Det er behov for risikoanalyse etter NS 3901."}
                {!fravik.konklusjon && "[Konklusjon angis]"}
              </p>
              {fravik.begrunnelseKonklusjon && (
                <>
                  <h4 className="font-semibold mb-1 ml-4 text-xs">Begrunnelse</h4>
                  <p className="ml-4 mb-3">{fravik.begrunnelseKonklusjon}</p>
                </>
              )}
            </section>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default KvalitativPreview;
