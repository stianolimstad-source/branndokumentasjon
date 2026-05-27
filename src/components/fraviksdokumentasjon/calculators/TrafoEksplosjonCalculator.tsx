import { useEffect, useState } from "react";
import TrafoEksplosjonTool from "@/components/verktoy/TrafoEksplosjonTool";
import { beregn, type TrafoInput } from "@/lib/trafo-eksplosjon";
import { AttachedCalculation } from "../BeregningSection";

// defaultInput er ikke eksportert fra trafo-eksplosjon-biblioteket; vi dupliserer
// standardverdiene fra TrafoEksplosjonTool for å holde endringsomfanget minimalt.
const defaultInput: TrafoInput = {
  oljevolum_L: 25000,
  tanktype: "conservator",
  oljetype: "mineralolje",
  spenning_kV: 132,
  effekt_MVA: 100,
  buenergi_MJ: 4,
  tankkapasitet_MJ: 5,
  plassering: "innendørs",
  avstand_personell_m: 15,
  avstand_maskinhall_m: 25,
  basseng_areal_m2: 40,
  barrierer: {
    bucholtz: true,
    differensialvern: true,
    dga: false,
    temperaturovervaking: true,
    bristeskive: true,
    aktiv_trykkavlastning: false,
    brannmur_EI: 120,
    deluge_vannspray: false,
    oljegruve: true,
    rom_ventilasjon: false,
  },
  drift: {
    alder_aar: 20,
    maaneder_siden_dga: 12,
    overlast_historisk: false,
  },
};

interface Props {
  onResult?: (calc: AttachedCalculation) => void;
}

const TrafoEksplosjonCalculator = ({ onResult }: Props) => {
  const [input, setInput] = useState<TrafoInput>(defaultInput);

  useEffect(() => {
    if (!onResult) return;
    const t = setTimeout(() => {
      const res = beregn(input);
      onResult({
        id: crypto.randomUUID(),
        type: "trafoeksplosjon",
        label: `Trafoeksplosjon: ${input.oljevolum_L} L olje, buenergi ${input.buenergi_MJ} MJ`,
        inputs: {
          oljevolum_L: input.oljevolum_L,
          tanktype: input.tanktype,
          oljetype: input.oljetype,
          spenning_kV: input.spenning_kV,
          effekt_MVA: input.effekt_MVA,
          buenergi_MJ: input.buenergi_MJ,
          tankkapasitet_MJ: input.tankkapasitet_MJ,
          plassering: input.plassering,
          avstand_personell_m: input.avstand_personell_m,
          avstand_maskinhall_m: input.avstand_maskinhall_m,
          basseng_areal_m2: input.basseng_areal_m2,
        },
        results: {
          tank_status: res.tank.status,
          trykk_peak_kPa: Math.round(res.trykkbolge.peak_kPa),
          trykk_personell_pct: res.trykkbolge.sannsynlighet_personell_pct,
          fragment_p80_m: res.fragmenter.soner.p80_m,
          oljebrann_Q_MW: Math.round(res.oljebrann.Q_MW),
          oljebrann_varighet_min: res.oljebrann.varighet_min,
          bleve_radius_m: Math.round(res.bleve.fatal_radius_m),
          total_aarlig_eskaleringssannsynlighet_pct: res.sannsynlighet.total_eskalering_aarlig_pct,
          total_levetid40_pct: res.sannsynlighet.total_levetid40_pct,
          compliance_prosent: res.compliance.prosent,
        },
        kommentar: "",
      });
    }, 300);
    return () => clearTimeout(t);
  }, [input, onResult]);

  return <TrafoEksplosjonTool input={input} onInputChange={setInput} />;
};

export default TrafoEksplosjonCalculator;
