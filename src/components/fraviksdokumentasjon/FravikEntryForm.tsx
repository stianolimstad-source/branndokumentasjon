import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface KompenserendeTiltak {
  id: string;
  beskrivelse: string;
  funksjonalitet: string;
  palitelighet: string;
  robusthet: string;
  vedlikehold: string;
  andreEffekter: string;
}

export interface FravikEntry {
  id: string;
  funksjonskrav: string;
  preakseptertYtelse: string;
  hensiktYtelse: string;
  fravikBeskrivelse: string;
  tiltak: KompenserendeTiltak[];
  fraviketOmrader: string[];
  tiltakOmrader: string[];
  sammenligning: string;
  maleparametre: string;
  visReferanser: boolean;
  referanser: string;
  konklusjon: "tilstrekkelig" | "komparativ" | "risikoanalyse" | "";
  begrunnelseKonklusjon: string;
}

export const emptyTiltak = (): KompenserendeTiltak => ({
  id: crypto.randomUUID(),
  beskrivelse: "",
  funksjonalitet: "",
  palitelighet: "",
  robusthet: "",
  vedlikehold: "",
  andreEffekter: "",
});

export const emptyFravik = (): FravikEntry => ({
  id: crypto.randomUUID(),
  funksjonskrav: "",
  preakseptertYtelse: "",
  hensiktYtelse: "",
  fravikBeskrivelse: "",
  tiltak: [emptyTiltak()],
  fraviketOmrader: [],
  tiltakOmrader: [],
  sammenligning: "",
  maleparametre: "",
  visReferanser: true,
  referanser: "",
  konklusjon: "",
  begrunnelseKonklusjon: "",
});

const hovedomrader = [
  {
    id: "A", label: "A – Brannforløp",
    delomrader: [
      { id: "a", label: "a – Antennelse" }, { id: "b", label: "b – Eksplosjon" },
      { id: "c", label: "c – Utvikling av brann" }, { id: "d", label: "d – Spredning av brann" },
      { id: "e", label: "e – Strukturell kollaps" }, { id: "f", label: "f – Spredning til nabobygning" },
    ],
  },
  {
    id: "B", label: "B – Rømning og redning",
    delomrader: [
      { id: "g", label: "g – Deteksjon og varsling" }, { id: "h", label: "h – Reaksjon" },
      { id: "i", label: "i – Forflytning til sikkert sted" }, { id: "j", label: "j – Assistert evakuering" },
    ],
  },
  {
    id: "C", label: "C – Verdier",
    delomrader: [
      { id: "k", label: "k – Mennesker" }, { id: "l", label: "l – Dyr" },
      { id: "m", label: "m – Økonomiske verdier" }, { id: "n", label: "n – Kulturhistoriske verdier" },
      { id: "o", label: "o – Miljøskader" }, { id: "p", label: "p – Samfunnsfunksjon" },
    ],
  },
  {
    id: "D", label: "D – Tilrettelegging og sikkerhet for slokkemannskaper",
    delomrader: [
      { id: "q", label: "q – Innsatstid" }, { id: "r", label: "r – Tilrettelegging rundt bygningen" },
      { id: "s", label: "s – Tilrettelegging i bygningen" }, { id: "t", label: "t – Annet teknisk utstyr for slokkeinnsats" },
      { id: "u", label: "u – Bemanning og kompetanse" },
    ],
  },
];

interface Props {
  fravik: FravikEntry;
  index: number;
  onChange: (updated: FravikEntry) => void;
}

const FravikEntryForm = ({ fravik, index, onChange }: Props) => {
  const [showComments, setShowComments] = React.useState<Record<string, boolean>>({});

  const update = <K extends keyof FravikEntry>(field: K, value: FravikEntry[K]) => {
    onChange({ ...fravik, [field]: value });
  };

  const toggleOmrade = (id: string, type: "fravik" | "tiltak") => {
    const field = type === "fravik" ? "fraviketOmrader" : "tiltakOmrader";
    const current = fravik[field];
    update(field, current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  const addTiltak = () => update("tiltak", [...fravik.tiltak, emptyTiltak()]);
  const removeTiltak = (id: string) => update("tiltak", fravik.tiltak.filter(t => t.id !== id));
  const updateTiltak = (id: string, field: keyof KompenserendeTiltak, value: string) => {
    update("tiltak", fravik.tiltak.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-8">
      {/* Dokumentasjonsbehov */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Fravik {index + 1} – Vurdering av dokumentasjonsbehov</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Funksjonskravet i TEK17</Label>
          <Textarea placeholder="F.eks. § 11-8 (1): Byggverk skal ha bæresystem og brannceller som gjør at bygningen..." value={fravik.funksjonskrav} onChange={(e) => update("funksjonskrav", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Preakseptert ytelse som det fravikes fra</Label>
          <Textarea placeholder="Beskriv den preaksepterte ytelsen i veiledningen til TEK17..." value={fravik.preakseptertYtelse} onChange={(e) => update("preakseptertYtelse", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Opprinnelig hensikt med den preaksepterte ytelsen</Label>
          <Textarea placeholder="Beskriv hensikten/intensjonen bak kravet..." value={fravik.hensiktYtelse} onChange={(e) => update("hensiktYtelse", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Beskrivelse av fraviket</Label>
          <Textarea placeholder="Beskriv det konkrete fraviket fra preakseptert ytelse..." value={fravik.fravikBeskrivelse} onChange={(e) => update("fravikBeskrivelse", e.target.value)} />
        </div>
      </div>

      {/* Kompenserende tiltak */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Kompenserende tiltak</Label>
        </div>
        {fravik.tiltak.map((t, tIndex) => (
          <div key={t.id} className="space-y-3 p-4 border rounded-lg relative">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Tiltak {tIndex + 1}</h4>
              {fravik.tiltak.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeTiltak(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Beskrivelse av tiltaket</Label>
              <Textarea placeholder="F.eks. automatisk slokkeanlegg, branngardin, røykventilasjon..." value={t.beskrivelse} onChange={(e) => updateTiltak(t.id, "beskrivelse", e.target.value)} />
            </div>
            <Collapsible open={showComments[`tiltak-${t.id}`]} onOpenChange={(open) => setShowComments(prev => ({ ...prev, [`tiltak-${t.id}`]: open }))}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  {showComments[`tiltak-${t.id}`] ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  Vurdering av tiltakets egenskaper
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {[
                  { key: "funksjonalitet" as const, label: "Funksjonalitet", placeholder: "Vil tiltaket påvirkes av andre forhold?" },
                  { key: "palitelighet" as const, label: "Pålitelighet", placeholder: "Vil tiltaket fungere når det trengs?" },
                  { key: "robusthet" as const, label: "Robusthet og fleksibilitet", placeholder: "Kan andre forhold hindre tiltakets funksjon?" },
                  { key: "vedlikehold" as const, label: "Behov for oppfølging og vedlikehold", placeholder: "Vil tiltaket fungere ved manglende vedlikehold?" },
                  { key: "andreEffekter" as const, label: "Mulige andre effekter", placeholder: "Kan tiltaket ha utilsiktede negative effekter?" },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <Textarea placeholder={field.placeholder} value={t[field.key]} onChange={(e) => updateTiltak(t.id, field.key, e.target.value)} className="min-h-[60px]" />
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
        <Button variant="outline" onClick={addTiltak} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Legg til tiltak
        </Button>
      </div>

      {/* Innvirkningsområder */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Fravikets områder for innvirkning</Label>
        </div>
        <p className="text-xs text-muted-foreground">Velg hvilke delområder fraviket og tiltaket virker inn på (tabell 641).</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-destructive">Fravikets områder</h4>
            {hovedomrader.map(h => (
              <div key={h.id} className="space-y-1">
                <p className="text-xs font-medium">{h.label}</p>
                <div className="space-y-0.5 pl-2">
                  {h.delomrader.map(d => (
                    <div key={d.id} className="flex items-center gap-2">
                      <Checkbox id={`fravik-${index}-${d.id}`} checked={fravik.fraviketOmrader.includes(d.id)} onCheckedChange={() => toggleOmrade(d.id, "fravik")} />
                      <Label htmlFor={`fravik-${index}-${d.id}`} className="text-xs font-normal cursor-pointer">{d.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-primary">Tiltakets områder</h4>
            {hovedomrader.map(h => (
              <div key={h.id} className="space-y-1">
                <p className="text-xs font-medium">{h.label}</p>
                <div className="space-y-0.5 pl-2">
                  {h.delomrader.map(d => (
                    <div key={d.id} className="flex items-center gap-2">
                      <Checkbox id={`tiltak-${index}-${d.id}`} checked={fravik.tiltakOmrader.includes(d.id)} onCheckedChange={() => toggleOmrade(d.id, "tiltak")} />
                      <Label htmlFor={`tiltak-${index}-${d.id}`} className="text-xs font-normal cursor-pointer">{d.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kvalitativ analyse */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Kvalitativ analyse</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Sammenligning av fravik og kompenserende tiltak</Label>
          <Textarea placeholder="Beskriv hvordan fravik og tiltak sammenliknes mht. brannforløp, rømningsforhold, verdier..." value={fravik.sammenligning} onChange={(e) => update("sammenligning", e.target.value)} className="min-h-[100px]" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Måleparametre</Label>
          <Textarea placeholder="F.eks. avstand (m), rømningstid (min), branneffekt (MW), brannmotstand (min)..." value={fravik.maleparametre} onChange={(e) => update("maleparametre", e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`vis-referanser-${index}`}
              checked={fravik.visReferanser}
              onCheckedChange={(checked) => update("visReferanser", !!checked)}
            />
            <Label htmlFor={`vis-referanser-${index}`} className="text-xs font-medium cursor-pointer">
              Inkluder referanser og dokumentasjon
            </Label>
          </div>
          {fravik.visReferanser && (
            <Textarea placeholder="Testrapporter, forskningsartikler, standarder, fagbøker..." value={fravik.referanser} onChange={(e) => update("referanser", e.target.value)} />
          )}
        </div>
      </div>

      {/* Konklusjon */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Konklusjon – behov for videre analyse</Label>
        </div>
        <div className="space-y-2">
          {[
            { value: "tilstrekkelig" as const, label: "Kvalitativ analyse er tilstrekkelig", desc: "Beskyttelsesnivået er minst like høyt som preakseptert." },
            { value: "komparativ" as const, label: "Behov for komparativ analyse", desc: "Tiltak virker inn på andre områder enn fraviket." },
            { value: "risikoanalyse" as const, label: "Behov for risikoanalyse etter NS 3901", desc: "Fraviket er komplekst eller tiltak har lavere robusthet/pålitelighet." },
          ].map(opt => (
            <div
              key={opt.value}
              onClick={() => update("konklusjon", opt.value)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                fravik.konklusjon === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-medium text-xs">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Begrunnelse</Label>
          <Textarea placeholder="Begrunn konklusjonen..." value={fravik.begrunnelseKonklusjon} onChange={(e) => update("begrunnelseKonklusjon", e.target.value)} className="min-h-[80px]" />
        </div>
      </div>
    </div>
  );
};

export default FravikEntryForm;
