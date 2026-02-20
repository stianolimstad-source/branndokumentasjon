import React from "react";
import { FravikEntry } from "./FravikEntryForm";

const hovedomrader = [
  {
    id: "A", label: "A – Brannforløp",
    delomrader: [
      { id: "a", label: "Antennelse" }, { id: "b", label: "Eksplosjon" },
      { id: "c", label: "Utvikling av brann" }, { id: "d", label: "Spredning av brann" },
      { id: "e", label: "Strukturell kollaps" }, { id: "f", label: "Spredning til nabobygning" },
    ],
  },
  {
    id: "B", label: "B – Rømning og redning",
    delomrader: [
      { id: "g", label: "Deteksjon og varsling" }, { id: "h", label: "Reaksjon" },
      { id: "i", label: "Forflytning til sikkert sted" }, { id: "j", label: "Assistert evakuering" },
    ],
  },
  {
    id: "C", label: "C – Verdier",
    delomrader: [
      { id: "k", label: "Mennesker" }, { id: "l", label: "Dyr" },
      { id: "m", label: "Økonomiske verdier" }, { id: "n", label: "Kulturhistoriske verdier" },
      { id: "o", label: "Miljøskader" }, { id: "p", label: "Samfunnsfunksjon" },
    ],
  },
  {
    id: "D", label: "D – Tilrettelegging og sikkerhet for slokkemannskaper",
    delomrader: [
      { id: "q", label: "Innsatstid" }, { id: "r", label: "Tilrettelegging rundt bygningen" },
      { id: "s", label: "Tilrettelegging i bygningen" }, { id: "t", label: "Annet teknisk utstyr for slokkeinnsats" },
      { id: "u", label: "Bemanning og kompetanse" },
    ],
  },
];

const KvalitativPreview = ({ fravikEntries }: { fravikEntries: FravikEntry[] }) => {
  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-inner font-serif text-sm" style={{ minHeight: '600px' }}>
      <h1 className="text-xl font-bold text-center mb-2 pb-2">
        FRAVIKSDOKUMENTASJON
      </h1>
      <p className="text-center text-xs mb-6 text-gray-500">Kvalitativ analyse iht. Byggforsk 321.026 kap. 6</p>

      {/* Innholdsfortegnelse */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">Innholdsfortegnelse</h2>
        <div className="space-y-1 text-xs">
          {fravikEntries.map((_, i) => (
            <React.Fragment key={i}>
              <p><span className="font-bold">{i + 1}.</span> Fravik {i + 1}</p>
              <p className="ml-4">{i + 1}.1 Funksjonskrav i TEK17</p>
              <p className="ml-4">{i + 1}.2 Preakseptert ytelse</p>
              <p className="ml-4">{i + 1}.3 Hensikt med ytelsen</p>
              <p className="ml-4">{i + 1}.4 Beskrivelse av fraviket</p>
              <p className="ml-4">{i + 1}.5 Kompenserende tiltak</p>
              <p className="ml-4">{i + 1}.6 Innvirkningsområder</p>
              <p className="ml-4">{i + 1}.7 Kvalitativ analyse</p>
              <p className="ml-4">{i + 1}.8 Konklusjon</p>
            </React.Fragment>
          ))}
        </div>
      </section>

      <hr className="my-6 border-gray-300" />

      {fravikEntries.map((fravik, i) => {
        const fraviketOmraderLabels = hovedomrader.flatMap(h =>
          h.delomrader.filter(d => fravik.fraviketOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
        );
        const tiltakOmraderLabels = hovedomrader.flatMap(h =>
          h.delomrader.filter(d => fravik.tiltakOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
        );
        const harTiltak = fravik.tiltak.some(t => t.beskrivelse);
        const n = i + 1;

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
              <p className="ml-4 mb-2 text-xs">Vurdering basert på tabell 641 i Byggforsk 321.026.</p>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left w-1/2">Fravikets innvirkningsområder</th>
                    <th className="border border-gray-400 p-2 text-left w-1/2">Tiltakets innvirkningsområder</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">
                      {fraviketOmraderLabels.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {fraviketOmraderLabels.map(l => <li key={l}>{l}</li>)}
                        </ul>
                      ) : "[Angis]"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">
                      {tiltakOmraderLabels.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {tiltakOmraderLabels.map(l => <li key={l}>{l}</li>)}
                        </ul>
                      ) : "[Angis]"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {fravik.fraviketOmrader.length > 0 && fravik.tiltakOmrader.length > 0 && (
                <div className="ml-4 text-xs mb-3">
                  {fravik.fraviketOmrader.every(o => fravik.tiltakOmrader.includes(o)) ? (
                    <p><strong>Vurdering:</strong> Fravik og kompenserende tiltak virker inn på samme område(r). Kvalitativ analyse er vanligvis tilstrekkelig.</p>
                  ) : (
                    <p><strong>Vurdering:</strong> Fravik og kompenserende tiltak virker inn på ulike områder. Det kan være behov for mer omfattende analyse.</p>
                  )}
                </div>
              )}

              {/* Kvalitativ analyse */}
              <h3 className="font-semibold mb-2">{n}.7 Kvalitativ analyse</h3>
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
              <h3 className="font-semibold mb-2">{n}.8 Konklusjon</h3>
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
