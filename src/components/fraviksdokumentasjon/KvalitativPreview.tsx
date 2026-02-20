import React from "react";

interface KvalitativFormData {
  funksjonskrav: string;
  preakseptertYtelse: string;
  hensiktYtelse: string;
  fravikBeskrivelse: string;
  tiltak: {
    id: string;
    beskrivelse: string;
    funksjonalitet: string;
    palitelighet: string;
    robusthet: string;
    vedlikehold: string;
    andreEffekter: string;
  }[];
  fraviketOmrader: string[];
  tiltakOmrader: string[];
  sammenligning: string;
  maleparametre: string;
  referanser: string;
  konklusjon: string;
  begrunnelseKonklusjon: string;
}

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

const KvalitativPreview = ({ formData }: { formData: KvalitativFormData }) => {
  const fraviketOmraderLabels = hovedomrader.flatMap(h =>
    h.delomrader.filter(d => formData.fraviketOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
  );
  const tiltakOmraderLabels = hovedomrader.flatMap(h =>
    h.delomrader.filter(d => formData.tiltakOmrader.includes(d.id)).map(d => `${d.id} – ${d.label}`)
  );

  const harTiltak = formData.tiltak.some(t => t.beskrivelse);

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
          <p><span className="font-bold">1.</span> Vurdering av dokumentasjonsbehov</p>
          <p className="ml-4">1.1 Funksjonskrav i TEK17</p>
          <p className="ml-4">1.2 Preakseptert ytelse</p>
          <p className="ml-4">1.3 Hensikt med ytelsen</p>
          <p className="ml-4">1.4 Beskrivelse av fraviket</p>
          <p><span className="font-bold">2.</span> Kompenserende tiltak</p>
          <p><span className="font-bold">3.</span> Fravikets områder for innvirkning</p>
          <p><span className="font-bold">4.</span> Kvalitativ analyse</p>
          <p><span className="font-bold">5.</span> Konklusjon – behov for videre analyse</p>
        </div>
      </section>

      <hr className="my-6 border-gray-300" />

      {/* 1. Dokumentasjonsbehov */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">1. Vurdering av dokumentasjonsbehov</h2>

        <h3 className="font-semibold mb-2">1.1 Funksjonskrav i TEK17</h3>
        <p className="ml-4 mb-3">{formData.funksjonskrav || "[Angis]"}</p>

        <h3 className="font-semibold mb-2">1.2 Preakseptert ytelse som det fravikes fra</h3>
        <p className="ml-4 mb-3">{formData.preakseptertYtelse || "[Angis]"}</p>

        <h3 className="font-semibold mb-2">1.3 Opprinnelig hensikt med den preaksepterte ytelsen</h3>
        <p className="ml-4 mb-3">{formData.hensiktYtelse || "[Angis]"}</p>

        <h3 className="font-semibold mb-2">1.4 Beskrivelse av fraviket</h3>
        <p className="ml-4 mb-3">{formData.fravikBeskrivelse || "[Angis]"}</p>
      </section>

      {/* 2. Kompenserende tiltak */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">2. Kompenserende tiltak</h2>
        {harTiltak ? (
          formData.tiltak.filter(t => t.beskrivelse).map((t, i) => (
            <div key={t.id} className="mb-4">
              <h3 className="font-semibold mb-2">Tiltak {i + 1}: {t.beskrivelse}</h3>
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
      </section>

      {/* 3. Innvirkningsområder */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">3. Fravikets områder for innvirkning</h2>
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

        {formData.fraviketOmrader.length > 0 && formData.tiltakOmrader.length > 0 && (
          <div className="ml-4 text-xs">
            {formData.fraviketOmrader.every(o => formData.tiltakOmrader.includes(o)) ? (
              <p><strong>Vurdering:</strong> Fravik og kompenserende tiltak virker inn på samme område(r). Kvalitativ analyse er vanligvis tilstrekkelig.</p>
            ) : (
              <p><strong>Vurdering:</strong> Fravik og kompenserende tiltak virker inn på ulike områder. Det kan være behov for mer omfattende analyse (komparativ analyse eller risikoanalyse).</p>
            )}
          </div>
        )}
      </section>

      {/* 4. Kvalitativ analyse */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">4. Kvalitativ analyse</h2>

        <h3 className="font-semibold mb-2">4.1 Sammenligning av fravik og kompenserende tiltak</h3>
        <p className="ml-4 mb-3">{formData.sammenligning || "[Angis]"}</p>

        <h3 className="font-semibold mb-2">4.2 Måleparametre</h3>
        <p className="ml-4 mb-3">{formData.maleparametre || "[Angis]"}</p>

        <h3 className="font-semibold mb-2">4.3 Referanser og dokumentasjon</h3>
        <p className="ml-4 mb-3">{formData.referanser || "[Angis]"}</p>
      </section>

      {/* 5. Konklusjon */}
      <section className="mb-6">
        <h2 className="font-bold mb-3">5. Konklusjon – behov for videre analyse</h2>
        <p className="ml-4 mb-2">
          {formData.konklusjon === "tilstrekkelig" && "Den kvalitative analysen vurderes som tilstrekkelig. Beskyttelsesnivået er minst like høyt som den preaksepterte ytelsen."}
          {formData.konklusjon === "komparativ" && "Det er behov for komparativ analyse for å dokumentere likeverdighet."}
          {formData.konklusjon === "risikoanalyse" && "Det er behov for risikoanalyse etter NS 3901 for å dokumentere brannsikkerheten."}
          {!formData.konklusjon && "[Konklusjon angis]"}
        </p>
        {formData.begrunnelseKonklusjon && (
          <>
            <h3 className="font-semibold mb-2">Begrunnelse</h3>
            <p className="ml-4 mb-3">{formData.begrunnelseKonklusjon}</p>
          </>
        )}
      </section>
    </div>
  );
};

export default KvalitativPreview;
