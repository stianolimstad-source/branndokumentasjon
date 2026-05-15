import RosMatriks, { risikoFarge } from "./RosMatriks";

export interface RosHendelse {
  id: string;
  tittel: string;
  beskrivelse: string;
  arsak: string;
  sannsynlighet: number; // 1–5
  konsekvens: number;    // 1–5
  tiltak: string;
  restrisiko: string;
}

export interface RosRevisjon {
  versjon: string;
  dato: string;
  utfortAv: string;
  endring: string;
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
  oppsummering: string;
  revisjonshistorikk: RosRevisjon[];
}

interface Props {
  content: RosContent;
}

const SKALA_S = [
  "1 – Svært lite sannsynlig (sjeldnere enn hvert 50. år)",
  "2 – Lite sannsynlig (hvert 10.–50. år)",
  "3 – Sannsynlig (hvert 1.–10. år)",
  "4 – Meget sannsynlig (årlig)",
  "5 – Svært sannsynlig (flere ganger per år)",
];
const SKALA_K = [
  "1 – Ufarlig (ingen personskade, ubetydelig materiell skade)",
  "2 – En viss fare (mindre personskade, begrenset materiell skade)",
  "3 – Farlig (alvorlig personskade, betydelig materiell skade)",
  "4 – Kritisk (livstruende skade, store materielle tap)",
  "5 – Katastrofal (død, totalskade)",
];

export default function RosPreview({ content }: Props) {
  const m = content.metadata;
  return (
    <div className="bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-8 space-y-10">
        <header className="border-b pb-6">
          <p className="text-sm text-muted-foreground">ROS-analyse (brann)</p>
          <h1 className="text-3xl font-bold mt-1">{m.prosjektnavn || "Uten navn"}</h1>
          {m.adresse && <p className="text-muted-foreground">{m.adresse}</p>}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 text-sm">
            {m.oppdragsgiver && (<><dt className="text-muted-foreground">Oppdragsgiver</dt><dd>{m.oppdragsgiver}</dd></>)}
            {m.utfortAv && (<><dt className="text-muted-foreground">Utført av</dt><dd>{m.utfortAv}</dd></>)}
            {m.dato && (<><dt className="text-muted-foreground">Dato</dt><dd>{m.dato}</dd></>)}
            {m.versjon && (<><dt className="text-muted-foreground">Versjon</dt><dd>{m.versjon}</dd></>)}
          </dl>
        </header>

        <section id="kap-1" className="space-y-3">
          <h2 className="text-2xl font-semibold">1. Innledning</h2>
          <Field label="1.1 Bakgrunn" value={content.innledning.bakgrunn} />
          <Field label="1.2 Formål" value={content.innledning.formal} />
          <Field label="1.3 Omfang" value={content.innledning.omfang} />
          <Field label="1.4 Avgrensninger" value={content.innledning.avgrensninger} />
        </section>

        <section id="kap-2" className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Metode</h2>
          <p className="text-sm leading-relaxed">
            Analysen er utført som en kvalitativ risiko- og sårbarhetsanalyse med en 5×5-matrise der
            sannsynlighet (S) og konsekvens (K) vurderes på en skala fra 1 til 5. Risikoverdien
            (R = S × K) plasseres i fargekodede områder for akseptabel, ALARP/vurderes og ikke
            akseptabel risiko. Brannrelaterte hendelser er identifisert med utgangspunkt i bygningens
            bruk, brannenergi, evakueringsforhold og aktive/passive brannsikringstiltak.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Sannsynlighet</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {SKALA_S.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm">Konsekvens</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {SKALA_K.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
          <div className="pt-2"><RosMatriks /></div>
        </section>

        <section id="kap-3" className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Hendelsesregister</h2>
          {content.hendelser.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Ingen hendelser registrert ennå.</p>
          ) : (
            <div className="space-y-4">
              {content.hendelser.map((h, i) => {
                const r = h.sannsynlighet * h.konsekvens;
                const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
                const fargeKlasse = farge === "rod"
                  ? "bg-red-500/85 text-white"
                  : farge === "gul"
                    ? "bg-amber-400/90 text-foreground"
                    : "bg-emerald-500/80 text-white";
                return (
                  <div key={h.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">3.{i + 1} {h.tittel || "Uten tittel"}</h3>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${fargeKlasse}`}>
                        S{h.sannsynlighet} × K{h.konsekvens} = {r}
                      </span>
                    </div>
                    {h.beskrivelse && <p className="text-sm"><span className="text-muted-foreground">Beskrivelse: </span>{h.beskrivelse}</p>}
                    {h.arsak && <p className="text-sm"><span className="text-muted-foreground">Årsak: </span>{h.arsak}</p>}
                    {h.tiltak && <p className="text-sm"><span className="text-muted-foreground">Tiltak: </span>{h.tiltak}</p>}
                    {h.restrisiko && <p className="text-sm"><span className="text-muted-foreground">Restrisiko: </span>{h.restrisiko}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section id="kap-4" className="space-y-3">
          <h2 className="text-2xl font-semibold">4. Oppsummering</h2>
          {content.oppsummering ? (
            <p className="text-sm whitespace-pre-line">{content.oppsummering}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Ingen oppsummering registrert.</p>
          )}
        </section>

        <section id="kap-5" className="space-y-3">
          <h2 className="text-2xl font-semibold">5. Revisjonshistorikk</h2>
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Versjon</th>
                <th className="text-left p-2 border">Dato</th>
                <th className="text-left p-2 border">Utførende</th>
                <th className="text-left p-2 border">Endring</th>
              </tr>
            </thead>
            <tbody>
              {content.revisjonshistorikk.length === 0 ? (
                <tr><td colSpan={4} className="p-2 border text-muted-foreground italic">Ingen revisjoner registrert.</td></tr>
              ) : content.revisjonshistorikk.map((r, i) => (
                <tr key={i}>
                  <td className="p-2 border">{r.versjon}</td>
                  <td className="p-2 border">{r.dato}</td>
                  <td className="p-2 border">{r.utfortAv}</td>
                  <td className="p-2 border">{r.endring}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="font-semibold text-sm mb-1">{label}</h3>
      {value ? <p className="text-sm whitespace-pre-line">{value}</p> : <p className="text-sm text-muted-foreground italic">Ikke utfylt.</p>}
    </div>
  );
}
