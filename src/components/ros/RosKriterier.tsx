import {
  BransjeId,
  KonsekvensDimensjon,
  KONSEKVENS_KRITERIER,
  SANNSYNLIGHET_KRITERIER,
  KriterieTabell,
  nivaaFargeKlasse,
} from "@/lib/ros-risk-criteria";

interface RosKriterierProps {
  bransje?: BransjeId;
  dimensjon?: KonsekvensDimensjon;
}

function Tabell({ tabell }: { tabell: KriterieTabell }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{tabell.tittel}</h4>
      <ul className="space-y-1.5">
        {tabell.rader.map((r) => (
          <li key={r.niva} className="flex items-start gap-2.5 text-xs leading-snug">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${nivaaFargeKlasse(r.niva)}`}
              aria-label={`Nivå ${r.niva}`}
            >
              {r.niva}
            </span>
            <span>
              <span className="font-medium">{r.navn}.</span>{" "}
              <span className="text-muted-foreground">{r.beskrivelse}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RosKriterier({
  bransje = "kraftstasjon",
  dimensjon = "forsyningssikkerhet",
}: RosKriterierProps) {
  const k = KONSEKVENS_KRITERIER[bransje][dimensjon];
  const s = SANNSYNLIGHET_KRITERIER[bransje];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Gjelder kraftstasjoner
        </span>
        <span className="text-[11px] text-muted-foreground">
          Tilpasses den enkelte virksomhet.
        </span>
      </div>
      <Tabell tabell={k} />
      <Tabell tabell={s} />
    </div>
  );
}
