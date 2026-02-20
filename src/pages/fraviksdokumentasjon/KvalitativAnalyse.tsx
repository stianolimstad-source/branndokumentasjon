import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FileWarning, Plus, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const hovedomrader = [
  {
    id: "A",
    label: "A – Brannforløp",
    delomrader: [
      { id: "a", label: "a – Antennelse" },
      { id: "b", label: "b – Eksplosjon" },
      { id: "c", label: "c – Utvikling av brann" },
      { id: "d", label: "d – Spredning av brann" },
      { id: "e", label: "e – Strukturell kollaps" },
      { id: "f", label: "f – Spredning til nabobygning" },
    ],
  },
  {
    id: "B",
    label: "B – Rømning og redning",
    delomrader: [
      { id: "g", label: "g – Deteksjon og varsling" },
      { id: "h", label: "h – Reaksjon" },
      { id: "i", label: "i – Forflytning til sikkert sted" },
      { id: "j", label: "j – Assistert evakuering" },
    ],
  },
  {
    id: "C",
    label: "C – Verdier",
    delomrader: [
      { id: "k", label: "k – Mennesker" },
      { id: "l", label: "l – Dyr" },
      { id: "m", label: "m – Økonomiske verdier" },
      { id: "n", label: "n – Kulturhistoriske verdier" },
      { id: "o", label: "o – Miljøskader" },
      { id: "p", label: "p – Samfunnsfunksjon" },
    ],
  },
  {
    id: "D",
    label: "D – Tilrettelegging og sikkerhet for slokkemannskaper",
    delomrader: [
      { id: "q", label: "q – Innsatstid" },
      { id: "r", label: "r – Tilrettelegging rundt bygningen" },
      { id: "s", label: "s – Tilrettelegging i bygningen" },
      { id: "t", label: "t – Annet teknisk utstyr for slokkeinnsats" },
      { id: "u", label: "u – Bemanning og kompetanse" },
    ],
  },
];

interface KompenserendeTiltak {
  id: string;
  beskrivelse: string;
  funksjonalitet: string;
  palitelighet: string;
  robusthet: string;
  vedlikehold: string;
  andreEffekter: string;
}

const emptyTiltak = (): KompenserendeTiltak => ({
  id: crypto.randomUUID(),
  beskrivelse: "",
  funksjonalitet: "",
  palitelighet: "",
  robusthet: "",
  vedlikehold: "",
  andreEffekter: "",
});

const KvalitativAnalyse = () => {
  // 6.1 & 6.2 fields
  const [funksjonskrav, setFunksjonskrav] = useState("");
  const [preakseptertYtelse, setPreakseptertYtelse] = useState("");
  const [hensiktYtelse, setHensiktYtelse] = useState("");
  const [fravikBeskrivelse, setFravikBeskrivelse] = useState("");

  // 6.3 Kompenserende tiltak
  const [tiltak, setTiltak] = useState<KompenserendeTiltak[]>([emptyTiltak()]);

  // 6.4 Innvirkningsområder
  const [fraviketOmrader, setFraviketOmrader] = useState<string[]>([]);
  const [tiltakOmrader, setTiltakOmrader] = useState<string[]>([]);

  // 6.5 Kvalitativ analyse
  const [sammenligning, setSammenligning] = useState("");
  const [maleparametre, setMaleparametre] = useState("");
  const [referanser, setReferanser] = useState("");

  // 6.6 Konklusjon
  const [konklusjon, setKonklusjon] = useState<"tilstrekkelig" | "komparativ" | "risikoanalyse" | "">("");
  const [begrunnelseKonklusjon, setBegrunnelseKonklusjon] = useState("");

  // Comment visibility toggles
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const toggleOmrade = (id: string, type: "fravik" | "tiltak") => {
    const setter = type === "fravik" ? setFraviketOmrader : setTiltakOmrader;
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addTiltak = () => setTiltak((prev) => [...prev, emptyTiltak()]);
  const removeTiltak = (id: string) => setTiltak((prev) => prev.filter((t) => t.id !== id));
  const updateTiltak = (id: string, field: keyof KompenserendeTiltak, value: string) => {
    setTiltak((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PageHeader
        title="Kvalitativ analyse"
        subtitle="Fraviksdokumentasjon iht. Byggforsk 321.026 kap. 6"
        icon={<FileWarning className="h-6 w-6 text-primary-foreground" />}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* 6.1 / 6.2 Dokumentasjonsbehov */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">6.2 Vurdering av dokumentasjonsbehov</CardTitle>
              <CardDescription>
                Beskriv funksjonskravet, preakseptert ytelse, hensikten bak ytelsen og selve fraviket.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="funksjonskrav">Funksjonskravet i TEK17 som er relevant for fraviket</Label>
                <Textarea
                  id="funksjonskrav"
                  placeholder="F.eks. § 11-8 (1): Byggverk skal ha bæresystem og brannceller som gjør at bygningen..."
                  value={funksjonskrav}
                  onChange={(e) => setFunksjonskrav(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preakseptert">Preakseptert ytelse som det fravikes fra</Label>
                <Textarea
                  id="preakseptert"
                  placeholder="Beskriv den preaksepterte ytelsen i veiledningen til TEK17..."
                  value={preakseptertYtelse}
                  onChange={(e) => setPreakseptertYtelse(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hensikt">Opprinnelig hensikt med den preaksepterte ytelsen</Label>
                <Textarea
                  id="hensikt"
                  placeholder="Beskriv hensikten/intensjonen bak kravet..."
                  value={hensiktYtelse}
                  onChange={(e) => setHensiktYtelse(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fravik">Beskrivelse av fraviket</Label>
                <Textarea
                  id="fravik"
                  placeholder="Beskriv det konkrete fraviket fra preakseptert ytelse..."
                  value={fravikBeskrivelse}
                  onChange={(e) => setFravikBeskrivelse(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 6.3 Kompenserende tiltak */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">6.3 Kompenserende tiltak</CardTitle>
              <CardDescription>
                Beskriv kompenserende tiltak og vurder deres egenskaper. Tiltakene skal gjøre at brannsikkerheten er minst like god som den preaksepterte ytelsen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {tiltak.map((t, index) => (
                <div key={t.id} className="space-y-4 p-4 border rounded-lg relative">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Tiltak {index + 1}</h4>
                    {tiltak.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTiltak(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Beskrivelse av tiltaket</Label>
                    <Textarea
                      placeholder="F.eks. automatisk slokkeanlegg, branngardin, røykventilasjon..."
                      value={t.beskrivelse}
                      onChange={(e) => updateTiltak(t.id, "beskrivelse", e.target.value)}
                    />
                  </div>

                  <Collapsible open={showComments[`tiltak-detaljer-${t.id}`]} onOpenChange={(open) => setShowComments(prev => ({ ...prev, [`tiltak-detaljer-${t.id}`]: open }))}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        {showComments[`tiltak-detaljer-${t.id}`] ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        Vurdering av tiltakets egenskaper
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Funksjonalitet</Label>
                        <Textarea
                          placeholder="Vil tiltaket påvirkes av andre forhold? (f.eks. lufthastighet, plassering...)"
                          value={t.funksjonalitet}
                          onChange={(e) => updateTiltak(t.id, "funksjonalitet", e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Pålitelighet</Label>
                        <Textarea
                          placeholder="Vil tiltaket fungere når det trengs? (f.eks. ved brannalarm)"
                          value={t.palitelighet}
                          onChange={(e) => updateTiltak(t.id, "palitelighet", e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Robusthet og fleksibilitet</Label>
                        <Textarea
                          placeholder="Kan andre forhold hindre tiltakets funksjon? (f.eks. møbler, endringer i bruk)"
                          value={t.robusthet}
                          onChange={(e) => updateTiltak(t.id, "robusthet", e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Behov for oppfølging og vedlikehold</Label>
                        <Textarea
                          placeholder="Vil tiltaket fungere ved manglende vedlikehold?"
                          value={t.vedlikehold}
                          onChange={(e) => updateTiltak(t.id, "vedlikehold", e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Mulige andre effekter</Label>
                        <Textarea
                          placeholder="Kan tiltaket ha utilsiktede negative effekter? (f.eks. sperre rømningsvei)"
                          value={t.andreEffekter}
                          onChange={(e) => updateTiltak(t.id, "andreEffekter", e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}

              <Button variant="outline" onClick={addTiltak} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Legg til tiltak
              </Button>
            </CardContent>
          </Card>

          {/* 6.4 Innvirkningsområder (Tabell 641) */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">6.4 Fravikets områder for innvirkning</CardTitle>
              <CardDescription>
                Velg hvilke hoved- og delområder fraviket og kompenserende tiltak virker inn på. Bruk tabell 641 som grunnlag.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Fraviket */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-destructive">Fravikets innvirkningsområder</h4>
                  {hovedomrader.map((h) => (
                    <div key={h.id} className="space-y-2">
                      <p className="text-sm font-medium">{h.label}</p>
                      <div className="space-y-1 pl-2">
                        {h.delomrader.map((d) => (
                          <div key={d.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`fravik-${d.id}`}
                              checked={fraviketOmrader.includes(d.id)}
                              onCheckedChange={() => toggleOmrade(d.id, "fravik")}
                            />
                            <Label htmlFor={`fravik-${d.id}`} className="text-sm font-normal cursor-pointer">
                              {d.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tiltak */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-primary">Tiltakets innvirkningsområder</h4>
                  {hovedomrader.map((h) => (
                    <div key={h.id} className="space-y-2">
                      <p className="text-sm font-medium">{h.label}</p>
                      <div className="space-y-1 pl-2">
                        {h.delomrader.map((d) => (
                          <div key={d.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`tiltak-${d.id}`}
                              checked={tiltakOmrader.includes(d.id)}
                              onCheckedChange={() => toggleOmrade(d.id, "tiltak")}
                            />
                            <Label htmlFor={`tiltak-${d.id}`} className="text-sm font-normal cursor-pointer">
                              {d.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sammenstilling */}
              {(fraviketOmrader.length > 0 || tiltakOmrader.length > 0) && (
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <Info className="h-4 w-4" /> Vurdering av overlapp
                  </p>
                  {fraviketOmrader.every((o) => tiltakOmrader.includes(o)) && fraviketOmrader.length > 0 ? (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      ✓ Fravik og tiltak virker inn på samme område(r). Kvalitativ analyse er vanligvis tilstrekkelig.
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      ⚠ Fravik og tiltak virker inn på ulike områder. Det kan være behov for mer omfattende analyse.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6.5 Kvalitativ analyse */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">6.5 Kvalitativ analyse</CardTitle>
              <CardDescription>
                Sammenlign fravik og kompenserende tiltak gjennom felles måleparametre. Analysens grundighet må tilpasses fravikets kompleksitet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sammenligning">Sammenligning av fravik og kompenserende tiltak</Label>
                <Textarea
                  id="sammenligning"
                  placeholder="Beskriv hvordan fravik og tiltak sammenliknes mht. brannforløp, rømningsforhold, verdier og sikkerhet for slokkemannskaper..."
                  value={sammenligning}
                  onChange={(e) => setSammenligning(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maleparametre">Måleparametre</Label>
                <Textarea
                  id="maleparametre"
                  placeholder="F.eks. avstand (m), rømningstid (min), breddre rømningsvei (m), branneffekt (MW), røykfylling, brannmotstand (min)..."
                  value={maleparametre}
                  onChange={(e) => setMaleparametre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referanser">Referanser og dokumentasjon</Label>
                <Textarea
                  id="referanser"
                  placeholder="Testrapporter, forskningsartikler, standarder, fagbøker som underbygger analysens troverdighet..."
                  value={referanser}
                  onChange={(e) => setReferanser(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 6.6 Behov for videre analyse / Konklusjon */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">6.6 Konklusjon – behov for videre analyse?</CardTitle>
              <CardDescription>
                Basert på vurderingene i pkt. 6.1–6.5, konkluder om den kvalitative analysen er tilstrekkelig eller om det er behov for videre analyse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {[
                  { value: "tilstrekkelig" as const, label: "Kvalitativ analyse er tilstrekkelig", desc: "Beskyttelsesnivået er minst like høyt som preakseptert. Dokumentasjonen er troverdig og akseptabel." },
                  { value: "komparativ" as const, label: "Behov for komparativ analyse", desc: "Tiltak virker inn på andre områder enn fraviket, eller det er behov for mer systematisk sammenstilling." },
                  { value: "risikoanalyse" as const, label: "Behov for risikoanalyse etter NS 3901", desc: "Fraviket er komplekst, tiltak har lavere robusthet/pålitelighet, eller det er flere funksjonsområder berørt." },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setKonklusjon(opt.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      konklusjon === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="begrunnelse">Begrunnelse for konklusjonen</Label>
                <Textarea
                  id="begrunnelse"
                  placeholder="Begrunn hvorfor den kvalitative analysen er tilstrekkelig, eller hvorfor det er behov for videre analyse..."
                  value={begrunnelseKonklusjon}
                  onChange={(e) => setBegrunnelseKonklusjon(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default KvalitativAnalyse;
