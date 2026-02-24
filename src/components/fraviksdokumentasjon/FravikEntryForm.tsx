import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ChevronDown, ChevronUp, ListPlus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import BeregningSection, { AttachedCalculation } from "./BeregningSection";

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
  navn: string;
  funksjonskrav: string;
  preakseptertYtelse: string;
  hensiktYtelse: string;
  fravikBeskrivelse: string;
  tiltak: KompenserendeTiltak[];
  fraviketOmrader: string[];
  tiltakOmrader: string[];
  innvirkningBeskrivelse: string;
  sammenligning: string;
  maleparametre: string;
  visReferanser: boolean;
  referanser: string;
  konklusjon: "tilstrekkelig" | "komparativ" | "risikoanalyse" | "egendefinert" | "";
  konklusjonFritekst: string;
  begrunnelseKonklusjon: string;
  beregninger: AttachedCalculation[];
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
  navn: "",
  funksjonskrav: "",
  preakseptertYtelse: "",
  hensiktYtelse: "",
  fravikBeskrivelse: "",
  tiltak: [emptyTiltak()],
  fraviketOmrader: [],
  tiltakOmrader: [],
  innvirkningBeskrivelse: "",
  sammenligning: "",
  maleparametre: "",
  visReferanser: true,
  referanser: "",
  konklusjon: "",
  konklusjonFritekst: "",
  begrunnelseKonklusjon: "",
  beregninger: [],
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

const tek17Paragrafer = [
  { id: "11-1", label: "§ 11-1. Sikkerhet ved brann" },
  { id: "11-2", label: "§ 11-2. Risikoklasser" },
  { id: "11-3", label: "§ 11-3. Brannklasser" },
  { id: "11-4", label: "§ 11-4. Bæreevne og stabilitet" },
  { id: "11-5", label: "§ 11-5. Sikkerhet ved eksplosjon" },
  { id: "11-6", label: "§ 11-6. Tiltak mot brannspredning mellom byggverk" },
  { id: "11-7", label: "§ 11-7. Brannseksjoner" },
  { id: "11-8", label: "§ 11-8. Brannceller" },
  { id: "11-9", label: "§ 11-9. Materialer og produkters egenskaper ved brann" },
  { id: "11-10", label: "§ 11-10. Tekniske installasjoner" },
  { id: "11-11", label: "§ 11-11. Generelle krav om rømning og redning" },
  { id: "11-12", label: "§ 11-12. Tiltak for å påvirke rømnings- og redningstider" },
  { id: "11-13", label: "§ 11-13. Utgang fra branncelle" },
  { id: "11-14", label: "§ 11-14. Rømningsvei" },
  { id: "11-15", label: "§ 11-15. Tilrettelegging for redning av husdyr" },
  { id: "11-16", label: "§ 11-16. Tilrettelegging for manuell slokking" },
  { id: "11-17", label: "§ 11-17. Tilrettelegging for rednings- og slokkemannskap" },
];

const predefinerteTiltak: Omit<KompenserendeTiltak, "id">[] = [
  {
    beskrivelse: "Automatisk slokkeanlegg (sprinkler) iht. NS-EN 12845",
    funksjonalitet: "Sprinkleranlegget detekterer og kontrollerer/slokker brann i tidlig fase. Anlegget aktiveres automatisk ved termisk påvirkning av sprinklerhoder. Kun sprinklerhoder i brannområdet aktiveres, noe som begrenser vannskader. Anlegget gir også automatisk brannvarsling ved vannstrøm.",
    palitelighet: "Sprinkleranlegg har dokumentert høy pålitelighet. Statistikk viser at sprinkleranlegg kontrollerer eller slokker brann i over 90 % av tilfellene. Anlegget prosjekteres og installeres iht. NS-EN 12845 av FG-godkjent foretak, og kontrolleres av akkreditert inspeksjonsorgan.",
    robusthet: "Anlegget er robust mot de fleste brannscenarioer. Vannforsyningen dimensjoneres med tilstrekkelig kapasitet og redundans. Anlegget fungerer uavhengig av strømforsyning (ved bruk av kommunalt vanntrykk eller dieseldrevet pumpe). Anlegget er ikke følsomt for vindforhold eller røyksjiktning.",
    vedlikehold: "Anlegget krever regelmessig vedlikehold iht. NS-EN 12845 og FG-regler. Kvartalsvis kontroll og årlig funksjonstest av akkreditert inspeksjonsorgan. Eier/bruker har ansvar for daglig tilsyn og at anlegget holdes i driftsklar stand.",
    andreEffekter: "Sprinkleranlegg gir økt personsikkerhet ved å begrense brannens utvikling og opprettholde akseptable rømningsforhold lengre. Kan gi forsikringsmessige fordeler. Kan medføre vannskader ved utilsiktet utløsning, men risikoen for dette er svært lav.",
  },
  {
    beskrivelse: "Brannalarmanlegg iht. NS 3960",
    funksjonalitet: "Brannalarmanlegget detekterer brann i tidlig fase ved hjelp av røyk- og/eller varmedetektorer. Anlegget varsler personer i bygningen via alarmsignal og kan gi automatisk varsling til brannvesenet. Anlegget gir tidlig varsling som øker tilgjengelig rømningstid.",
    palitelighet: "Anlegget prosjekteres og installeres iht. NS 3960 av FG-godkjent foretak. Detektorer velges og plasseres basert på rommets bruk, geometri og ventilasjon. Anlegget overvåkes kontinuerlig for feil og har batteribackup ved strømbrudd.",
    robusthet: "Anlegget er robust ved at det har redundans i strømforsyning (nett + batteri) og overvåking av alle kretser. Detektortyper tilpasses omgivelsene for å minimere uønskede alarmer. Feilsignaler genereres automatisk ved kabelfeil, komponentfeil eller strømsvikt.",
    vedlikehold: "Anlegget krever regelmessig vedlikehold iht. NS 3960. Årlig kontroll og funksjonstest utføres av FG-godkjent foretak. Eier/bruker har ansvar for daglig tilsyn, testing av manuell melder kvartalsvis, og utskifting av detektorer etter produsentens anbefalinger.",
    andreEffekter: "Brannalarmanlegget bidrar til tidlig rømning og reduserer risiko for personskade. Gir brannvesenet tidlig varsel som kan redusere materielle skader. Risiko for uønskede alarmer kan håndteres med riktig detektorvalg og vedlikehold.",
  },
  {
    beskrivelse: "Talevarslingsanlegg iht. NS 3960 og NS-EN 54-del 16/24",
    funksjonalitet: "Talevarslingsanlegget gir tydelig, forståelig talebeskjed til alle personer i bygningen ved brannalarm. Systemet kan gi differensiert varsling i ulike soner og kan brukes til evakueringsledelse. Erstatter eller supplerer tradisjonelle alarmsignaler med forhåndsinnspilte eller direktesendte meldinger.",
    palitelighet: "Anlegget prosjekteres iht. NS-EN 54-del 16 (talevarslingssentraler) og del 24 (høyttalere). Talekvaliteten verifiseres ved STI-målinger (Speech Transmission Index) for å sikre forståelighet i alle soner. Anlegget har batteribackup og feilmonitoring.",
    robusthet: "Systemet har redundans i forsterkere og strømforsyning. Høyttalerkretser overvåkes for feil. Systemet er designet for å fungere også ved delvis ødeleggelse av kabelnett (A/B-linjer). Talekvaliteten opprettholdes selv ved høyt bakgrunnsstøy (min. STI 0,50).",
    vedlikehold: "Årlig kontroll og funksjonstest av FG-godkjent foretak. STI-målinger bør utføres ved installasjon og etter endringer. Eier/bruker har ansvar for daglig tilsyn og testing av systemet.",
    andreEffekter: "Talevarsling gir vesentlig bedre forståelse av alarmsituasjonen sammenlignet med tradisjonelle alarmsignaler, spesielt for personer som ikke er kjent i bygningen. Reduserer reaksjonstid og kan gi spesifikke evakueringsinstruksjoner. Særlig viktig i store, komplekse bygninger og bygninger med overnattende personer.",
  },
  {
    beskrivelse: "Røykventilasjon",
    funksjonalitet: "Røykventilasjon fjerner røyk og varme fra brannsoner og/eller rømningsveier, slik at rømningsforholdene opprettholdes og brannvesenets innsatsmuligheter forbedres. Kan utføres som naturlig (røykluker) eller mekanisk røykventilasjon.",
    palitelighet: "Naturlig røykventilasjon er pålitelig da den ikke er avhengig av strøm. Mekanisk røykventilasjon krever redundans i strømforsyning og vifte/motor. Systemet prosjekteres for å håndtere relevante brannscenarioer basert på beregnet branneffekt og røykproduksjon.",
    robusthet: "Naturlige systemer er robuste mot strømsvikt. Mekaniske systemer skal ha nødstrømsforsyning. Kanaler og komponenter dimensjoneres for brannpåkjenning (temperatur). Systemet skal fungere uavhengig av klimatiske forhold (vind, temperatur).",
    vedlikehold: "Regelmessig kontroll av luker, vifter, motorer og styringskomponenter. Funksjonstest minst årlig. Tilluftåpninger må holdes frie for hindringer.",
    andreEffekter: "Røykventilasjon kan gi bedre oversikt for rømning og innsats, reduserer røykskader og kan begrense brannspredning ved å redusere temperaturen i røyklaget. Kan påvirke brannforløpet ved tilførsel av frisk luft – krever helhetlig vurdering.",
  },
  {
    beskrivelse: "Branngardin / brannskjerm",
    funksjonalitet: "Branngardin/brannskjerm fungerer som brannskille som senkes ned eller lukkes automatisk ved brannalarm. Hindrer brannspredning og/eller røykspredning mellom brannceller eller brannseksjoner uten å kreve permanent fysisk skille.",
    palitelighet: "Branngardinen aktiveres automatisk via signal fra brannalarmanlegget eller lokale detektorer. Kan også aktiveres manuelt. Produktet skal ha dokumentert brannmotstand (EI-klassifisering) iht. NS-EN 16034.",
    robusthet: "Gardinen/skjermen lukkes ved hjelp av gravitasjon (failsafe) og krever kun strøm for å holdes åpen. Dette gir høy robusthet ved strømsvikt. Mekanismen er enkel med få bevegelige deler.",
    vedlikehold: "Funksjonstest minimum årlig. Visuell kontroll av gardin/skjerm, føringer og motor kvartalsvis. Smøring og justering iht. produsentens anbefalinger.",
    andreEffekter: "Gir fleksibel planløsning uten permanente brannskiller. Kan kombineres med daglig bruk (innsyn, gjennomgang). Må koordineres med rømningsveier for å sikre at gardinen ikke blokkerer rømning.",
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
  const addPredefinertTiltak = (predefined: Omit<KompenserendeTiltak, "id">) => {
    const firstIsEmpty = fravik.tiltak.length === 1 && !fravik.tiltak[0].beskrivelse && !fravik.tiltak[0].funksjonalitet && !fravik.tiltak[0].palitelighet && !fravik.tiltak[0].robusthet && !fravik.tiltak[0].vedlikehold && !fravik.tiltak[0].andreEffekter;
    if (firstIsEmpty) {
      update("tiltak", [{ ...predefined, id: fravik.tiltak[0].id }]);
    } else {
      update("tiltak", [...fravik.tiltak, { ...predefined, id: crypto.randomUUID() }]);
    }
  };
  const removeTiltak = (id: string) => update("tiltak", fravik.tiltak.filter(t => t.id !== id));
  const updateTiltak = (id: string, field: keyof KompenserendeTiltak, value: string) => {
    update("tiltak", fravik.tiltak.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-8">
      {/* Navn på fravik */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Navn på fravik</Label>
        <input
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder={`f.eks. Avstand mellom bygg A og B`}
          value={fravik.navn || ""}
          onChange={(e) => update("navn", e.target.value)}
        />
      </div>

      {/* Dokumentasjonsbehov */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Fravik {index + 1} – Vurdering av dokumentasjonsbehov</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Funksjonskravet i TEK17</Label>
          <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
            {tek17Paragrafer.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Checkbox
                  id={`tek17-${index}-${p.id}`}
                  checked={fravik.funksjonskrav.includes(p.label)}
                  onCheckedChange={(checked) => {
                    const current = fravik.funksjonskrav ? fravik.funksjonskrav.split("\n").filter(Boolean) : [];
                    if (checked) {
                      update("funksjonskrav", [...current, p.label].join("\n"));
                    } else {
                      update("funksjonskrav", current.filter(l => l !== p.label).join("\n"));
                    }
                  }}
                />
                <Label htmlFor={`tek17-${index}-${p.id}`} className="text-xs font-normal cursor-pointer">{p.label}</Label>
              </div>
            ))}
          </div>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={addTiltak} className="flex-1">
            <Plus className="h-4 w-4 mr-2" /> Tomt tiltak
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1">
                <ListPlus className="h-4 w-4 mr-2" /> Velg ferdig tiltak
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b">
                <p className="text-sm font-semibold">Vanlige kompenserende tiltak</p>
                <p className="text-xs text-muted-foreground">Basert på NS-EN 12845, NS 3960, NS-EN 54</p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {predefinerteTiltak.map((pt, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent text-xs border-b last:border-b-0 transition-colors"
                    onClick={() => addPredefinertTiltak(pt)}
                  >
                    {pt.beskrivelse}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Innvirkningsområder */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Fravikets områder for innvirkning</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Beskrivelse av hvorfor tiltaket påvirker samme område som fraviket</Label>
          <Textarea
            placeholder="Beskriv hvorfor det kompenserende tiltaket virker inn på samme område som fraviket, og hvordan tiltaket adresserer de samme risikoforholdene..."
            value={fravik.innvirkningBeskrivelse || ""}
            onChange={(e) => update("innvirkningBeskrivelse", e.target.value)}
            className="min-h-[120px]"
          />
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

      {/* Beregninger – knapp + vedlagte beregninger */}
      <BeregningSection
        beregninger={fravik.beregninger || []}
        onChange={(beregninger) => update("beregninger", beregninger)}
        fravikIndex={index}
      />

      {/* Konklusjon */}
      <div className="space-y-4">
        <div className="border-b-2 border-foreground/20 pb-2">
          <Label className="text-base font-extrabold text-foreground">Konklusjon</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Bruk ferdig tekst eller egendefinert i tekstboks</Label>
          {(() => {
            const paragrafRefs = fravik.funksjonskrav
              ? fravik.funksjonskrav.split("\n").filter(Boolean)
              : [];
            const tilstrekkeligLabel = paragrafRefs.length > 0
              ? `Funksjonskravene i ${paragrafRefs.join(", ")} er vurdert som tilfredsstillende.`
              : "Funksjonskravene er vurdert som tilfredsstillende.";

            return (
              <div
                onClick={() => update("konklusjon", fravik.konklusjon === "tilstrekkelig" ? "egendefinert" : "tilstrekkelig")}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  fravik.konklusjon === "tilstrekkelig" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-xs">{tilstrekkeligLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Klikk for å bruke denne teksten</p>
              </div>
            );
          })()}
        </div>
        {fravik.konklusjon !== "tilstrekkelig" && (
          <Textarea
            placeholder="Skriv din egen konklusjon..."
            value={fravik.konklusjonFritekst || ""}
            onChange={(e) => { update("konklusjonFritekst", e.target.value); update("konklusjon", "egendefinert"); }}
            className="min-h-[80px]"
          />
        )}
      </div>
    </div>
  );
};

export default FravikEntryForm;
