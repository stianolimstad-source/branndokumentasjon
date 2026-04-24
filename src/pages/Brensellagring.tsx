import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Flame, AlertTriangle, Info, Shield, Ruler, FileText, Save,
  Droplets, ChevronDown, Cylinder, PipetteIcon, Gauge, ClipboardCheck, FolderOpen, ExternalLink, Eye, Building, Check, Plus, Search, FileDown, FilePlus2, Warehouse, Trash2, CheckCircle2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getBrensellagringKrav,
  BrenselType,
  INNMELDINGS_GRENSER,
  SIKKERHETSAVSTANDER,
  INTERNE_AVSTANDER_KAT12,
  OPPSAMLING_KRAV,
  TANK_KRAV,
  BELIGGENHET_KRAV,
  ROERLEDNING_KRAV,
  VENTIL_KRAV,
  KONTROLL_KRAV,
  DOKUMENTASJON_KRAV,
  PUMPE_KRAV,
  BYGNINGSTYPER,
  BygningsType,
  STYKKGODS_GRENSER,
  getStykkgodsGrense,
} from "@/lib/brensellagring-krav";
import BrensellagringPreview, { BRENSEL_SECTIONS, BrenselSectionKey } from "@/components/brensellagring/BrensellagringPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { useCanDownload } from "@/hooks/useCanDownload";
import { exportBrensellagringToWord } from "@/lib/brensellagring-word-export";

interface ProjectOption {
  id: string;
  name: string;
  address: string | null;
}

interface ProfileInfo {
  company: string | null;
  full_name: string | null;
  email: string | null;
  title: string | null;
  logo_url: string | null;
}

const Brensellagring = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const conceptIdFromUrl = searchParams.get("concept");
  const bygningstypeFromUrl = searchParams.get("bygningstype") as BygningsType | null;
  const { user } = useAuth();
  const { toast } = useToast();
  const canDownload = useCanDownload();

  // Project selection (driven by URL param)
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);

  // Redirect to home if no project or document is selected
  useEffect(() => {
    if (!projectIdFromUrl && !conceptIdFromUrl) {
      navigate("/", { replace: true });
    }
  }, [projectIdFromUrl, conceptIdFromUrl, navigate]);


  // VTEK byggkrav (bygningstype kommer fra URL — valgt på forsiden)
  const [valgtBygningstype, setValgtBygningstype] = useState<BygningsType | "">(bygningstypeFromUrl || "");
  const [brenselType, setBrenselType] = useState<BrenselType | "">("");
  const [mengde, setMengde] = useState("");
  const [innledning, setInnledning] = useState("");
  const [kunde, setKunde] = useState("");
  const [ksAnsvarlig, setKsAnsvarlig] = useState("");

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const firmaNavn = profile?.company?.trim() || "";
  const logoUrl = profile?.logo_url || "";
  const prosjektNavn = selectedProject?.name || "";
  const adresse = selectedProject?.address || "";
  const utarbeidetAv = profile?.full_name?.trim() || user?.email || "";

  const valgtBygg = BYGNINGSTYPER.find((b) => b.id === valgtBygningstype) || null;
  const [expandedBrensel, setExpandedBrensel] = useState<string | null>(null);

  // ===== Tab-relevans per bygningstype =====
  // Bygg som typisk har tankanlegg (innendørs eller utendørs)
  const TANK_BYGG: BygningsType[] = ["verksted", "fyrrom", "tankrom", "lager"];
  // Bygg som kan utløse innmeldingsplikt til DSB
  const INNMELDING_BYGG: BygningsType[] = ["verksted", "fyrrom", "tankrom", "lager", "salgslokale", "forretning"];

  type TabKey = "beliggenhet" | "tanker" | "oppsamling" | "roer" | "kontroll" | "innmelding" | "dokumentasjon";

  const isTabRelevant = (tab: TabKey): boolean => {
    // Ingen bygg valgt → vis alt (uendret oppførsel)
    if (!valgtBygningstype) return true;
    switch (tab) {
      case "kontroll":
        return true;
      case "beliggenhet":
      case "dokumentasjon":
      case "tanker":
      case "oppsamling":
      case "roer":
        return TANK_BYGG.includes(valgtBygningstype as BygningsType);
      case "innmelding":
        return INNMELDING_BYGG.includes(valgtBygningstype as BygningsType);
      default:
        return true;
    }
  };

  const visTankBeliggenhet = !valgtBygningstype || TANK_BYGG.includes(valgtBygningstype as BygningsType);
  const IKKE_TANK_BYGG: BygningsType[] = ["forretning", "salgslokale"];
  const harTankanlegg = !valgtBygningstype
    ? null
    : TANK_BYGG.includes(valgtBygningstype as BygningsType)
      ? true
      : IKKE_TANK_BYGG.includes(valgtBygningstype as BygningsType)
        ? false
        : null;
  const kontrollKravVisning = KONTROLL_KRAV
    .map((krav, index) => ({ krav, index }))
    .filter(({ krav }) => harTankanlegg !== false || krav.gjelder === "alle");
  const kontrollGenerelt = harTankanlegg === false
    ? [
        "Visuell kontroll av emballasje, merking og hylleinnredning",
        "Kontroll av brannskap, oppsamlingskar og håndtering av lekkasjer",
        "Kontroll av ventilasjon i lagerrom",
        "Tilgjengelighet til slokkeutstyr og rømningsveier",
        "Kontrollrapport med avvik og nødvendige tiltak",
      ]
    : [
        "Visuell kontroll av tanker og rørføringer",
        "Korrosjonskontroll",
        "Tetthetsprøving, evt. trykkprøving",
        "Kontroll av viktige komponenter",
        "Testing av sikkerhetsfunksjoner og -kritisk utstyr",
        "Gjennomgang av dokumentasjon om reparasjoner og endringer",
        "Kontrollrapport med avvik, tiltak og tidspunkt for neste kontroll",
      ];

  const [activeTab, setActiveTab] = useState<TabKey>("kontroll");
  // Hvis valgt fane blir irrelevant ved bytte av bygningstype → fall tilbake til kontroll
  useEffect(() => {
    if (!isTabRelevant(activeTab)) {
      setActiveTab("kontroll");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valgtBygningstype]);

  // DSB stykkgods – salgslokale
  const [salgslokaleInkludert, setSalgslokaleInkludert] = useState(false);
  const [salgslokaleKommentar, setSalgslokaleKommentar] = useState("");
  const getOriginalSalgslokaleTiltakTekst = () =>
    "Ovennevnte krav til avstander og mengder bør kunne økes noe for brannfarlige væsker, under forutsetning av at salgslokalet er sprinklet og at det fremgår av risikovurderingen at en slik begrenset økning er akseptabel.\n\nVurderingen gjelder kun de angitte mengdene og forutsetningene. Dersom det ønskes lagret mengder utover dette, må mengdene enten plasseres i brannsikre skap/avlukke eller underlegges en ny særskilt risikovurdering. Økning gjelder ikke brannfarlig gass uten særskilt vurdering, da DSB sin anbefalte gassmengde ikke øker tilsvarende med salgslokalets areal.";
  const [salgslokaleTiltakTekst, setSalgslokaleTiltakTekst] = useState(getOriginalSalgslokaleTiltakTekst);

  // Planlagt mengde utover DSB sin veiledning – per kategori
  type PlannedAmounts = {
    gass_kat1: string;
    gass_kat2: string;
    vaeske_kat1: string;
    vaeske_kat2: string;
    vaeske_kat3: string;
    diesel_fyringsolje: string;
    aerosoler: string;
  };
  const TOMME_MENGDER: PlannedAmounts = {
    gass_kat1: "",
    gass_kat2: "",
    vaeske_kat1: "",
    vaeske_kat2: "",
    vaeske_kat3: "",
    diesel_fyringsolje: "",
    aerosoler: "",
  };
  const [totalAmounts, setTotalAmounts] = useState<PlannedAmounts>(TOMME_MENGDER);
  const [totalKommentar, setTotalKommentar] = useState("");
  const [totalInkludert, setTotalInkludert] = useState(false);
  const [plannedAmounts, setPlannedAmounts] = useState<PlannedAmounts>(TOMME_MENGDER);
  const [plannedKommentar, setPlannedKommentar] = useState("");
  const [plannedInkludert, setPlannedInkludert] = useState(false);

  type OverskridelseTillattMengde = Record<string, string>;
  const [overskridelseInkludert, setOverskridelseInkludert] = useState(false);
  const [overskridelseArealgrunnlag, setOverskridelseArealgrunnlag] = useState("");
  const [overskridelseVurdertTillattMengde, setOverskridelseVurdertTillattMengde] = useState<OverskridelseTillattMengde>({});
  const [overskridelseTiltak, setOverskridelseTiltak] = useState("");
  const [overskridelseVurderingstekst, setOverskridelseVurderingstekst] = useState("");
  const [overskridelseKonklusjon, setOverskridelseKonklusjon] = useState("");

  // Brannenergi – etasjer (flere mulig, hver med egne mål) og inkludering
  type Etasje = { id: string; navn: string; lengde: string; bredde: string; hoyde: string };
  const lagEtasje = (navn = "Etasje 1"): Etasje => ({
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    navn,
    lengde: "",
    bredde: "",
    hoyde: "",
  });
  const [etasjer, setEtasjer] = useState<Etasje[]>([lagEtasje("Etasje 1")]);
  const [brannenergiInkludert, setBrannenergiInkludert] = useState(false);
  const [brannenergiKommentar, setBrannenergiKommentar] = useState("");
  const [generellBrannenergiMJm2, setGenerellBrannenergiMJm2] = useState("730");
  const [byggBrannenergiInkludert, setByggBrannenergiInkludert] = useState(false);
  const [byggBrannenergiGrenseMJm2, setByggBrannenergiGrenseMJm2] = useState("");
  const [byggBrannenergiGulvarealM2, setByggBrannenergiGulvarealM2] = useState("");
  const [byggBrannenergiOmhyllingsflateM2, setByggBrannenergiOmhyllingsflateM2] = useState("");
  const [byggBrannenergiKommentar, setByggBrannenergiKommentar] = useState("");

  type BranntekniskeTiltakData = {
    brannalarm: { status: string; beskrivelse: string; kommentar: string; rapporttekst: string };
    roykventilasjon: { status: string; type: string; beskrivelse: string; rapporttekst: string };
    slokkeanlegg: { status: string; type: string; beskrivelse: string; rapporttekst: string };
    generellKommentar: string;
  };
  const TOMME_BRANNTEKNISKE_TILTAK: BranntekniskeTiltakData = {
    brannalarm: { status: "", beskrivelse: "", kommentar: "", rapporttekst: "" },
    roykventilasjon: { status: "", type: "", beskrivelse: "", rapporttekst: "" },
    slokkeanlegg: { status: "", type: "", beskrivelse: "", rapporttekst: "" },
    generellKommentar: "",
  };
  const TILTAK_STATUS = ["Ikke aktuelt", "Ikke installert", "Installert / forutsatt", "Eksisterende anlegg beholdes"];
  const ROYKVENTILASJON_TYPER = ["Naturlig røykventilasjon", "Mekanisk røykventilasjon", "Luker/vinduer/åpninger", "Annet"];
  const SLOKKEANLEGG_TYPER = ["Sprinkleranlegg", "Vanntåkeanlegg", "Skum-/gassanlegg", "Annet"];
  const [branntekniskeTiltakInkludert, setBranntekniskeTiltakInkludert] = useState(false);
  const [branntekniskeTiltak, setBranntekniskeTiltak] = useState<BranntekniskeTiltakData>(TOMME_BRANNTEKNISKE_TILTAK);

  const getOriginalTiltakTekst = (tiltak: "brannalarm" | "roykventilasjon" | "slokkeanlegg") => {
    if (tiltak === "brannalarm") {
      return "Brannalarmanlegg bidrar til tidlig deteksjon og varsling ved branntilløp. Tidlig varsling reduserer normalt nødvendig rømningstid, fordi personer i bygget kan starte evakuering tidligere. Tiltaket øker dermed sikkerhetsmarginen mellom tilgjengelig rømningstid og nødvendig rømningstid.";
    }
    if (tiltak === "roykventilasjon") {
      return "Røykventilasjon har som formål å begrense røykoppbygging og bidra til bedre sikt- og temperaturforhold i bygget ved brann. Tiltaket kan bidra til å opprettholde tilgjengelig rømningstid ved at røyk- og varmebelastningen i rømningsfasen reduseres.";
    }
    return "Automatisk slokkeanlegg kan bidra til å kontrollere eller slokke brannen i en tidlig fase. Dette reduserer brannutvikling, røykproduksjon og temperaturpåvirkning, og kan dermed øke tilgjengelig rømningstid sammenlignet med et bygg uten automatisk slokkeanlegg.";
  };

  const withRapporttekst = <T extends "brannalarm" | "roykventilasjon" | "slokkeanlegg">(
    tiltak: T,
    value: BranntekniskeTiltakData[T]
  ): BranntekniskeTiltakData[T] => ({
    ...value,
    rapporttekst: value.rapporttekst.trim() ? value.rapporttekst : getOriginalTiltakTekst(tiltak),
  });

  const updateBranntekniskTiltak = <T extends keyof BranntekniskeTiltakData>(
    tiltak: T,
    value: BranntekniskeTiltakData[T]
  ) => setBranntekniskeTiltak((prev) => ({ ...prev, [tiltak]: value }));

  // Energitetthet (MJ per kg/L) – kilder: SFPE Handbook og NS-EN 1991-1-2
  const ENERGITETTHET: Record<keyof PlannedAmounts, { verdi: number; enhet: "MJ/kg" | "MJ/L"; kilde: string }> = {
    gass_kat1: { verdi: 46, enhet: "MJ/kg", kilde: "Propan/butan/hydrogen" },
    gass_kat2: { verdi: 22, enhet: "MJ/kg", kilde: "Ammoniakk (konservativ)" },
    vaeske_kat1: { verdi: 32, enhet: "MJ/L", kilde: "Brannfarlig væske kategori 1 og 2 (konservativ sjablong)" },
    vaeske_kat2: { verdi: 36, enhet: "MJ/L", kilde: "Parafin / Jet A-1" },
    vaeske_kat3: { verdi: 36, enhet: "MJ/L", kilde: "Smøreolje / terpentin" },
    diesel_fyringsolje: { verdi: 36, enhet: "MJ/L", kilde: "Diesel (42,5 MJ/kg × 0,84 kg/L)" },
    aerosoler: { verdi: 20, enhet: "MJ/L", kilde: "Drivgass + innhold (sjablong)" },
  };

  const PLANNED_FELT: { key: keyof PlannedAmounts; label: string; enhet: string; eksempler: string }[] = [
    { key: "gass_kat1", label: "Brannfarlig gass, kategori 1", enhet: "kg", eksempler: "Propan, butan, hydrogen, acetylen" },
    { key: "gass_kat2", label: "Brannfarlig gass, kategori 2", enhet: "kg", eksempler: "Ammoniakk" },
    { key: "vaeske_kat1", label: "Brannfarlig væske, kategori 1 og 2", enhet: "liter", eksempler: "Bensin, bioetanol, aceton, Jet A-1, parafin" },
    { key: "vaeske_kat3", label: "Brannfarlig væske, kategori 3", enhet: "liter", eksempler: "Terpentin, dieselolje > 60 °C, smøreolje" },
    { key: "diesel_fyringsolje", label: "Diesel / fyringsolje", enhet: "liter", eksempler: "Anleggsdiesel, autodiesel, lett fyringsolje" },
    { key: "aerosoler", label: "Aerosoler", enhet: "liter", eksempler: "Spraybokser: maling, smøremiddel, hårspray" },
  ];

  // Innmelding til DSB – inkludering i dokument
  const [innmeldingInkludert, setInnmeldingInkludert] = useState(false);
  const [innmeldingKommentar, setInnmeldingKommentar] = useState("");

  // Section visibility for preview
  const [visibleSections, setVisibleSections] = useState<Set<BrenselSectionKey>>(
    new Set()
  );

  // Selected individual krav items per category (index-based keys like "beliggenhet_0")
  const [selectedKravIds, setSelectedKravIds] = useState<Set<string>>(new Set());

  const toggleKrav = (id: string) => {
    setSelectedKravIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isKravSelected = (id: string) => selectedKravIds.has(id);

  const KravItemButton = ({ id }: { id: string }) => {
    const selected = isKravSelected(id);
    return (
      <Button
        variant={selected ? "default" : "ghost"}
        size="sm"
        className={`h-6 w-6 p-0 shrink-0 ${selected ? "" : "text-muted-foreground hover:text-primary"}`}
        onClick={() => toggleKrav(id)}
        title={selected ? "Fjern fra dokument" : "Legg til i dokument"}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </Button>
    );
  };

  const toggleSection = (key: BrenselSectionKey) => {
    setVisibleSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Map tabs to document sections
  const TAB_SECTION_MAP: Record<string, { keys: BrenselSectionKey[]; label: string }> = {
    
    beliggenhet: { keys: ["avstander", "beliggenhet"], label: "Avstander & beliggenhet" },
    tanker: { keys: ["tankkrav"], label: "Tankkrav" },
    oppsamling: { keys: ["oppsamling"], label: "Oppsamling" },
    kontroll: { keys: ["kontroll"], label: "Kontroll" },
    dokumentasjon: { keys: ["dokumentasjon"], label: "Dokumentasjonskrav" },
    roer: { keys: ["konstruksjon"], label: "Konstruksjonskrav" },
  };

  const isTabInDocument = (tabKey: string) => {
    const mapping = TAB_SECTION_MAP[tabKey];
    if (!mapping) return false;
    return mapping.keys.every(k => visibleSections.has(k));
  };

  const toggleTabInDocument = (tabKey: string) => {
    const mapping = TAB_SECTION_MAP[tabKey];
    if (!mapping) return;
    setVisibleSections(prev => {
      const next = new Set(prev);
      const allIn = mapping.keys.every(k => next.has(k));
      mapping.keys.forEach(k => allIn ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const DocToggleButton = ({ tabKey }: { tabKey: string }) => {
    const inDoc = isTabInDocument(tabKey);
    return (
      <Button
        variant={inDoc ? "default" : "outline"}
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => toggleTabInDocument(tabKey)}
      >
        {inDoc ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
        {inDoc ? "I dokumentet" : "Legg til i dokument"}
      </Button>
    );
  };

  // Fetch projects
  useEffect(() => {
    if (user) {
      supabase
        .from('projects')
        .select('id, name, address')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setProjects(data as ProjectOption[]);
        });

      supabase
        .from('profiles')
        .select('company, full_name, email, title, logo_url')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setProfile((data as ProfileInfo | null) ?? null);
        });
    }
  }, [user]);

  useEffect(() => {
    if (!user || !conceptIdFromUrl) return;

    supabase
      .from('fire_concepts')
      .select('project_id, content')
      .eq('id', conceptIdFromUrl)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return;

        const content = (data.content as {
          bygningstype?: BygningsType;
          visibleSections?: BrenselSectionKey[];
          selectedKrav?: string[];
          salgslokaleInkludert?: boolean;
          salgslokaleKommentar?: string;
          salgslokaleTiltakTekst?: string;
          totalAmounts?: Partial<PlannedAmounts>;
          totalKommentar?: string;
          totalInkludert?: boolean;
          plannedAmounts?: Partial<PlannedAmounts>;
          plannedKommentar?: string;
          plannedInkludert?: boolean;
          overskridelseInkludert?: boolean;
          overskridelseArealgrunnlag?: string;
          overskridelseVurdertTillattMengde?: OverskridelseTillattMengde;
          overskridelseTiltak?: string;
          overskridelseVurderingstekst?: string;
          overskridelseKonklusjon?: string;
          byggDim?: { lengde?: string; bredde?: string; hoyde?: string };
          etasjer?: Etasje[];
          brannenergiInkludert?: boolean;
          brannenergiKommentar?: string;
          generellBrannenergiMJm2?: string;
          byggBrannenergiInkludert?: boolean;
          byggBrannenergiGrenseMJm2?: string;
          byggBrannenergiGulvarealM2?: string;
          byggBrannenergiOmhyllingsflateM2?: string;
          byggBrannenergiKommentar?: string;
          branntekniskeTiltakInkludert?: boolean;
          branntekniskeTiltak?: Partial<BranntekniskeTiltakData>;
          innledning?: string;
          kunde?: string;
          ksAnsvarlig?: string;
          innmeldingInkludert?: boolean;
          innmeldingKommentar?: string;
          documentType?: string;
          type?: string;
        } | null) ?? null;

        if (data.project_id) {
          setSelectedProjectId(data.project_id);
        }

        if (!content || (content.documentType !== "brensellagring" && content.type !== "brensellagring")) {
          return;
        }

        setValgtBygningstype(content.bygningstype || bygningstypeFromUrl || "");
        setVisibleSections(new Set(content.visibleSections || []));
        setSelectedKravIds(new Set(content.selectedKrav || []));
        setSalgslokaleInkludert(content.salgslokaleInkludert ?? false);
        setSalgslokaleKommentar(content.salgslokaleKommentar ?? "");
        setSalgslokaleTiltakTekst(content.salgslokaleTiltakTekst ?? getOriginalSalgslokaleTiltakTekst());
        const lagredeTotalMengder = { ...TOMME_MENGDER, ...(content.totalAmounts || {}) };
        const samletTotalKat12 = (parseFloat(lagredeTotalMengder.vaeske_kat1) || 0) + (parseFloat(lagredeTotalMengder.vaeske_kat2) || 0);
        setTotalAmounts({
          ...lagredeTotalMengder,
          vaeske_kat1: samletTotalKat12 > 0 ? String(samletTotalKat12) : "",
          vaeske_kat2: "",
        });
        setTotalKommentar(content.totalKommentar ?? "");
        setTotalInkludert(content.totalInkludert ?? false);
        const lagredeMengder = { ...TOMME_MENGDER, ...(content.plannedAmounts || {}) };
        const samletKat12 = (parseFloat(lagredeMengder.vaeske_kat1) || 0) + (parseFloat(lagredeMengder.vaeske_kat2) || 0);
        setPlannedAmounts({
          ...lagredeMengder,
          vaeske_kat1: samletKat12 > 0 ? String(samletKat12) : "",
          vaeske_kat2: "",
        });
        setPlannedKommentar(content.plannedKommentar ?? "");
        setPlannedInkludert(content.plannedInkludert ?? false);
        setOverskridelseInkludert(content.overskridelseInkludert ?? false);
        setOverskridelseArealgrunnlag(content.overskridelseArealgrunnlag ?? "");
        setOverskridelseVurdertTillattMengde(content.overskridelseVurdertTillattMengde ?? {});
        setOverskridelseTiltak(content.overskridelseTiltak ?? "");
        setOverskridelseVurderingstekst(content.overskridelseVurderingstekst ?? "");
        setOverskridelseKonklusjon(content.overskridelseKonklusjon ?? "");
        // Bakoverkompatibilitet: gammelt enkelt-byggDim → konverter til én etasje
        if (content.etasjer && Array.isArray(content.etasjer) && content.etasjer.length > 0) {
          setEtasjer(
            content.etasjer.map((e, i) => ({
              id: e.id || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
              navn: e.navn || `Etasje ${i + 1}`,
              lengde: e.lengde ?? "",
              bredde: e.bredde ?? "",
              hoyde: e.hoyde ?? "",
            }))
          );
        } else if (content.byggDim) {
          setEtasjer([{
            id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            navn: "Etasje 1",
            lengde: content.byggDim.lengde ?? "",
            bredde: content.byggDim.bredde ?? "",
            hoyde: content.byggDim.hoyde ?? "",
          }]);
        }
        setBrannenergiInkludert(content.brannenergiInkludert ?? false);
        setBrannenergiKommentar(content.brannenergiKommentar ?? "");
        setGenerellBrannenergiMJm2(content.generellBrannenergiMJm2 ?? "730");
        setByggBrannenergiInkludert(content.byggBrannenergiInkludert ?? false);
        setByggBrannenergiGrenseMJm2(content.byggBrannenergiGrenseMJm2 ?? "");
        setByggBrannenergiGulvarealM2(content.byggBrannenergiGulvarealM2 ?? "");
        setByggBrannenergiOmhyllingsflateM2(content.byggBrannenergiOmhyllingsflateM2 ?? "");
        setByggBrannenergiKommentar(content.byggBrannenergiKommentar ?? "");
        setBranntekniskeTiltakInkludert(content.branntekniskeTiltakInkludert ?? false);
        setBranntekniskeTiltak({
          ...TOMME_BRANNTEKNISKE_TILTAK,
          ...(content.branntekniskeTiltak || {}),
          brannalarm: { ...TOMME_BRANNTEKNISKE_TILTAK.brannalarm, ...(content.branntekniskeTiltak?.brannalarm || {}) },
          roykventilasjon: { ...TOMME_BRANNTEKNISKE_TILTAK.roykventilasjon, ...(content.branntekniskeTiltak?.roykventilasjon || {}) },
          slokkeanlegg: { ...TOMME_BRANNTEKNISKE_TILTAK.slokkeanlegg, ...(content.branntekniskeTiltak?.slokkeanlegg || {}) },
        });
        setInnledning(content.innledning ?? "");
        setKunde(content.kunde ?? "");
        setKsAnsvarlig(content.ksAnsvarlig ?? "");
        setInnmeldingInkludert(content.innmeldingInkludert ?? false);
        setInnmeldingKommentar(content.innmeldingKommentar ?? "");
      });
  }, [user, conceptIdFromUrl, bygningstypeFromUrl]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDocument = async () => {
    if (!user) {
      toast({ title: "Ikke innlogget", description: "Du må være innlogget for å lagre.", variant: "destructive" });
      return;
    }
    if (!selectedProjectId) {
      toast({ title: "Mangler prosjekt", description: "Dokumentet er ikke koblet til et prosjekt. Gå tilbake til forsiden og start på nytt.", variant: "destructive" });
      return;
    }
    if (!valgtBygningstype && selectedKravIds.size === 0) {
      toast({ title: "Ingen data", description: "Velg bygningstype eller krav før du kan lagre", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const docContent = {
      type: "brensellagring",
      documentType: "brensellagring",
      bygningstype: valgtBygningstype,
      visibleSections: Array.from(visibleSections),
      selectedKrav: Array.from(selectedKravIds),
      salgslokaleInkludert,
      salgslokaleKommentar,
      salgslokaleTiltakTekst,
      totalAmounts: { ...totalAmounts, vaeske_kat2: "" },
      totalKommentar,
      totalInkludert,
      plannedAmounts: { ...plannedAmounts, vaeske_kat2: "" },
      plannedKommentar,
      plannedInkludert,
      overskridelseInkludert,
      overskridelseArealgrunnlag,
      overskridelseVurdertTillattMengde,
      overskridelseTiltak,
      overskridelseVurderingstekst,
      overskridelseKonklusjon,
      etasjer,
      brannenergiInkludert,
      brannenergiKommentar,
      generellBrannenergiMJm2,
      byggBrannenergiInkludert,
      byggBrannenergiGrenseMJm2,
      byggBrannenergiGulvarealM2,
      byggBrannenergiOmhyllingsflateM2,
      byggBrannenergiKommentar,
      branntekniskeTiltakInkludert,
      branntekniskeTiltak,
      innledning,
      kunde,
      ksAnsvarlig,
      innmeldingInkludert,
      innmeldingKommentar,
    };
    const docName = `Brensellagring – ${valgtBygg?.navn || valgtBygningstype}`;
    let error;
    if (conceptIdFromUrl) {
      // Update existing document
      ({ error } = await supabase
        .from('fire_concepts')
        .update({
          name: docName,
          content: docContent,
        })
        .eq('id', conceptIdFromUrl));
    } else {
      // Create new document
      ({ error } = await supabase
        .from('fire_concepts')
        .insert({
          name: docName,
          project_id: selectedProjectId,
          user_id: user.id,
          content: docContent,
          status: 'draft',
        }));
    }
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre dokumentet", variant: "destructive" });
    } else {
      toast({ title: "Lagret", description: `"${docName}" er lagret i prosjektet` });
    }
    setIsSaving(false);
  };

  const handleDownloadWord = async () => {
    if (!valgtBygg) {
      toast({ title: "Mangler data", description: "Velg bygningstype før dokumentet lastes ned.", variant: "destructive" });
      return;
    }

    await exportBrensellagringToWord({
      valgtBygg,
      firmaNavn: firmaNavn || undefined,
      kunde: kunde || undefined,
      utarbeidetAv: utarbeidetAv || undefined,
      ksAnsvarlig: ksAnsvarlig || undefined,
      logoUrl: logoUrl || undefined,
      prosjektNavn: prosjektNavn || undefined,
      adresse: adresse || undefined,
      visibleSections,
      selectedKravIds,
      salgslokaleInkludert: salgslokaleInkludert && valgtBygningstype === "salgslokale",
      salgslokaleKommentar,
      salgslokaleTiltakTekst,
      totalInkludert,
      totalAmounts,
      totalKommentar,
      plannedInkludert,
      plannedAmounts,
      plannedKommentar,
      overskridelseInkludert,
      overskridelseRows,
      overskridelseArealgrunnlag: overskridelseArealgrunnlag || (samletGulvareal > 0 ? samletGulvareal.toFixed(1) : ""),
      overskridelseTiltak,
      overskridelseVurderingstekst,
      overskridelseKonklusjon,
      brannenergiInkludert,
      brannenergiKommentar,
      generellBrannenergiMJm2,
      byggBrannenergiInkludert,
      byggBrannenergiGrenseMJm2,
      byggBrannenergiGulvarealM2,
      byggBrannenergiOmhyllingsflateM2,
      byggBrannenergiKommentar,
      branntekniskeTiltakInkludert,
      branntekniskeTiltak,
      etasjer,
      innledning,
      energitetthet: ENERGITETTHET,
      innmeldingInkludert,
      innmeldingKommentar,
      innmeldingVurdering,
      harTankanlegg,
    });
  };

  const mengdeNum = parseFloat(mengde) || 0;
  const result = brenselType ? getBrensellagringKrav(brenselType as BrenselType, mengdeNum) : null;

  // ===== Innmeldingsvurdering basert på total mengde i virksomheten/anlegget =====
  type InnmeldingGruppeStatus = "over" | "under" | "ingen";
  type InnmeldingGruppe = {
    id: "vaeske_kat12" | "vaeske_kat3" | "diesel";
    kategori: string;
    sum: number;
    grenseLiter: number;
    grenseTekst: string;
    status: InnmeldingGruppeStatus;
    gjenstaende: number;
  };
  const evaluerInnmelding = (): { grupper: InnmeldingGruppe[]; trengerInnmelding: boolean; harMengder: boolean } => {
    const sumKat12 = parseFloat(totalAmounts.vaeske_kat1) || 0;
    const sumKat3 = parseFloat(totalAmounts.vaeske_kat3) || 0;
    const sumDiesel = parseFloat(totalAmounts.diesel_fyringsolje) || 0;

    const lagStatus = (sum: number, grense: number): InnmeldingGruppeStatus => {
      if (sum <= 0) return "ingen";
      if (sum >= grense) return "over";
      return "under";
    };

    const grupper: InnmeldingGruppe[] = [
      {
        id: "vaeske_kat12",
        kategori: INNMELDINGS_GRENSER[0].kategori,
        sum: sumKat12,
        grenseLiter: INNMELDINGS_GRENSER[0].grenseLiter,
        grenseTekst: INNMELDINGS_GRENSER[0].grenseTekst,
        status: lagStatus(sumKat12, INNMELDINGS_GRENSER[0].grenseLiter),
        gjenstaende: INNMELDINGS_GRENSER[0].grenseLiter - sumKat12,
      },
      {
        id: "vaeske_kat3",
        kategori: INNMELDINGS_GRENSER[1].kategori,
        sum: sumKat3,
        grenseLiter: INNMELDINGS_GRENSER[1].grenseLiter,
        grenseTekst: INNMELDINGS_GRENSER[1].grenseTekst,
        status: lagStatus(sumKat3, INNMELDINGS_GRENSER[1].grenseLiter),
        gjenstaende: INNMELDINGS_GRENSER[1].grenseLiter - sumKat3,
      },
      {
        id: "diesel",
        kategori: INNMELDINGS_GRENSER[2].kategori,
        sum: sumDiesel,
        grenseLiter: INNMELDINGS_GRENSER[2].grenseLiter,
        grenseTekst: INNMELDINGS_GRENSER[2].grenseTekst,
        status: lagStatus(sumDiesel, INNMELDINGS_GRENSER[2].grenseLiter),
        gjenstaende: INNMELDINGS_GRENSER[2].grenseLiter - sumDiesel,
      },
    ];
    const trengerInnmelding = grupper.some((g) => g.status === "over");
    const harMengder = grupper.some((g) => g.sum > 0);
    return { grupper, trengerInnmelding, harMengder };
  };
  const innmeldingVurdering = evaluerInnmelding();

  type OverskridelseRow = {
    id: string;
    stoffgruppe: string;
    anbefaltMengde: number;
    planlagtMengde: number;
    enhet: string;
    overskridelse: number;
    overskridelseProsent: number;
    vurdertTillattMengde: string;
  };
  const samletGulvareal = etasjer.reduce((sum, et) => {
    const lengde = parseFloat(et.lengde) || 0;
    const bredde = parseFloat(et.bredde) || 0;
    return sum + (lengde > 0 && bredde > 0 ? lengde * bredde : 0);
  }, 0);
  const overskridelseAreal = parseFloat(overskridelseArealgrunnlag) || samletGulvareal;
  const stykkgodsGrense = getStykkgodsGrense(overskridelseAreal > 0 ? overskridelseAreal : 0);
  const grenseFor = (type: BrenselType) => valgtBygg?.grenser.find((g) => g.brenselType === type);
  const overskridelseRows: OverskridelseRow[] = [
    {
      id: "gass",
      stoffgruppe: "Brannfarlig gass",
      anbefaltMengde: valgtBygningstype === "salgslokale" ? 25.2 : (grenseFor("propan")?.maksKg || 0),
      planlagtMengde: (parseFloat(plannedAmounts.gass_kat1) || 0) + (parseFloat(plannedAmounts.gass_kat2) || 0),
      enhet: "kg",
      vurdertTillattMengde: overskridelseVurdertTillattMengde.gass || "",
    },
    {
      id: "vaeske_kat12",
      stoffgruppe: "Brannfarlig væske kategori 1 og 2",
      anbefaltMengde: valgtBygningstype === "salgslokale" ? stykkgodsGrense.brannfarligVaeskeKat1og2 : (grenseFor("bensin")?.maksLiter || 0),
      planlagtMengde: parseFloat(plannedAmounts.vaeske_kat1) || 0,
      enhet: "liter",
      vurdertTillattMengde: overskridelseVurdertTillattMengde.vaeske_kat12 || "",
    },
    {
      id: "vaeske_kat3",
      stoffgruppe: "Brannfarlig væske kategori 3",
      anbefaltMengde: valgtBygningstype === "salgslokale" ? stykkgodsGrense.brannfarligVaeskeKat3 : (grenseFor("fyringsparafin")?.maksLiter || 0),
      planlagtMengde: parseFloat(plannedAmounts.vaeske_kat3) || 0,
      enhet: "liter",
      vurdertTillattMengde: overskridelseVurdertTillattMengde.vaeske_kat3 || "",
    },
    {
      id: "diesel_fyringsolje",
      stoffgruppe: "Diesel / fyringsolje",
      anbefaltMengde: grenseFor("lett_fyringsolje")?.maksLiter || 0,
      planlagtMengde: parseFloat(plannedAmounts.diesel_fyringsolje) || 0,
      enhet: "liter",
      vurdertTillattMengde: overskridelseVurdertTillattMengde.diesel_fyringsolje || "",
    },
    {
      id: "aerosoler",
      stoffgruppe: "Aerosoler",
      anbefaltMengde: valgtBygningstype === "salgslokale" ? stykkgodsGrense.aerosoler : 0,
      planlagtMengde: parseFloat(plannedAmounts.aerosoler) || 0,
      enhet: "liter",
      vurdertTillattMengde: overskridelseVurdertTillattMengde.aerosoler || "",
    },
  ].map((row) => ({
    ...row,
    overskridelse: Math.max(0, row.planlagtMengde - row.anbefaltMengde),
    overskridelseProsent: row.anbefaltMengde > 0 ? (Math.max(0, row.planlagtMengde - row.anbefaltMengde) / row.anbefaltMengde) * 100 : 0,
  })).filter((row) => row.planlagtMengde > 0 && row.anbefaltMengde > 0 && row.overskridelse > 0);
  const aktiveTiltak = [
    branntekniskeTiltak.brannalarm.status && branntekniskeTiltak.brannalarm.status !== "Ikke installert" && branntekniskeTiltak.brannalarm.status !== "Ikke aktuelt" ? "brannalarmanlegg/tidlig deteksjon" : "",
    branntekniskeTiltak.roykventilasjon.status && branntekniskeTiltak.roykventilasjon.status !== "Ikke installert" && branntekniskeTiltak.roykventilasjon.status !== "Ikke aktuelt" ? "røykventilasjon" : "",
    overskridelseTiltak.trim(),
  ].filter(Boolean);
  const harAutomatiskSlokkeanlegg = branntekniskeTiltak.slokkeanlegg.status && branntekniskeTiltak.slokkeanlegg.status !== "Ikke installert" && branntekniskeTiltak.slokkeanlegg.status !== "Ikke aktuelt";
  const harVaeskeOverskridelse = overskridelseRows.some((row) => row.id !== "gass");
  const harGassOverskridelse = overskridelseRows.some((row) => row.id === "gass");
  const foreslattOverskridelseTekst = overskridelseRows.length > 0
    ? `Planlagt lagring overstiger anbefalt mengde i DSB sin temaveiledning for ${overskridelseRows.map((r) => `${r.stoffgruppe.toLowerCase()} med ${r.overskridelse.toLocaleString("nb-NO")} ${r.enhet} (${r.overskridelseProsent.toFixed(0)} %)`).join(", ")}. Overskridelsen vurderes som begrenset.${harAutomatiskSlokkeanlegg ? " Bygget er sprinklet/har automatisk slokkeanlegg, noe som reduserer sannsynligheten for videre brannutvikling og begrenser konsekvensene av et branntilløp." : " Lagringen forutsettes gjennomført kontrollert, oversiktlig og i samsvar med beskrevne organisatoriske og branntekniske forutsetninger."}${aktiveTiltak.length > 0 ? ` Det er i tillegg lagt til grunn ${aktiveTiltak.join(", ")}.` : ""}${harVaeskeOverskridelse ? " På denne bakgrunn vurderes den angitte økte mengden brannfarlige væsker som akseptabel for dette bygget, forutsatt at lagringen skjer som beskrevet og at forutsetningene opprettholdes i driftsfasen." : ""}${harGassOverskridelse ? " Økning av brannfarlig gass omfattes ikke av denne generelle vurderingen. DSB sin anbefalte gassmengde øker ikke tilsvarende med bygningens størrelse/areal, noe som tilsier en strengere vurdering for gass. Gassmengder bør derfor ikke økes utover anbefalt mengde uten særskilt vurdering." : ""}`
    : "";
  const foreslattOverskridelseKonklusjon = overskridelseRows.length > 0
    ? "Vurderingen gjelder kun for dette bygget, de beskrevne mengdene og de angitte forutsetningene. Den innebærer ikke en generell heving av anbefalte DSB-mengder. Dersom det ønskes lagret mengder utover det som er vurdert her, må dette enten plasseres i brannsikre skap/avlukke eller underlegges en ny særskilt risikovurdering."
    : "";

  return (
<div className="min-h-screen bg-gradient-subtle">
      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 sm:mb-4"
            onClick={() => selectedProjectId ? navigate(`/prosjekt/${selectedProjectId}`) : navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Tilbake
          </Button>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Lagring av brannfarlig stoff</h2>
              <p className="text-muted-foreground mt-1">
                Basert på DSB Temaveiledning om oppbevaring av farlig stoff (Kapittel 1 – Atmosfæriske tanker) og VTEK § 11-8
              </p>
            </div>
            {selectedProject && (
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-soft">
                <Building className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedProject.name}</p>
                  {selectedProject.address && (
                    <p className="text-xs text-muted-foreground truncate">{selectedProject.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">
            {/* ===== LEFT: All content ===== */}
            <div className="min-w-0 space-y-10 lg:overflow-y-auto lg:pr-4 lg:text-base">

          {/* Bygningstype velger */}
          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Bygningstype
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Bygningstype / romtype</Label>
                <Select value={valgtBygningstype} onValueChange={(v) => { setValgtBygningstype(v as BygningsType); setExpandedBrensel(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg bygningstype..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BYGNINGSTYPER.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.navn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kunde" className="text-sm">Kunde</Label>
                <Input
                  id="kunde"
                  value={kunde}
                  onChange={(e) => setKunde(e.target.value)}
                  placeholder="Navn på kunde / oppdragsgiver"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ksAnsvarlig" className="text-sm">KS (kvalitetssikret) / Kontrollert av</Label>
                <Input
                  id="ksAnsvarlig"
                  value={ksAnsvarlig}
                  onChange={(e) => setKsAnsvarlig(e.target.value)}
                  placeholder="Navn på kvalitetssikrer"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="innledning" className="text-sm">Innledning</Label>
                <p className="text-xs text-muted-foreground">
                  Beskriv tiltaket, hva som inngår og hva som er oppdraget.
                </p>
                <Textarea
                  id="innledning"
                  value={innledning}
                  onChange={(e) => setInnledning(e.target.value)}
                  placeholder="Kort beskrivelse av tiltaket og oppdragets omfang..."
                  className="min-h-[120px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Total mengde brannfarlig stoff */}
          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-primary" />
                    Total mengde brannfarlig stoff i virksomheten/anlegget
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fyll inn samlet mengde brannfarlig stoff i virksomheten/anlegget. Mengder i salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare skal tas med. Disse mengdene brukes til vurdering av innmeldingsplikt til DSB.
                  </p>
                </div>
                <Button
                  variant={totalInkludert ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={() => setTotalInkludert((v) => !v)}
                >
                  {totalInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                  {totalInkludert ? "I dokumentet" : "Legg til i dokument"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANNED_FELT.map((felt) => (
                  <div key={felt.key} className="space-y-1">
                    <Label htmlFor={`total-${felt.key}`} className="text-xs">
                      {felt.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`total-${felt.key}`}
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="0"
                        value={totalAmounts[felt.key]}
                        onChange={(e) =>
                          setTotalAmounts((prev) => ({ ...prev, [felt.key]: e.target.value }))
                        }
                        className="h-9 pr-12 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        {felt.enhet}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      F.eks. {felt.eksempler}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="total-kommentar" className="text-xs">
                  Kommentar (valgfritt)
                </Label>
                <Textarea
                  id="total-kommentar"
                  placeholder="F.eks. fordeling mellom salgslokale, brannsikre skap, egne brannceller/lagerrom og øvrige lagringssteder."
                  value={totalKommentar}
                  onChange={(e) => setTotalKommentar(e.target.value)}
                  className="min-h-[70px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Planlagt mengde utover DSB sin veiledning */}
          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-primary" />
                    Planlagt mengde utover DSB sin veiledning i salgslokalet
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fyll inn mengder brannfarlig stoff som ønskes plassert i selve salgslokalet utover DSB sin anbefalte mengde. Mengder som oppbevares i brannsikre skap eller i egne brannceller/lagerrom beregnet for brannfarlig vare skal ikke tas med her.
                  </p>
                </div>
                <Button
                  variant={plannedInkludert ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={() => setPlannedInkludert((v) => !v)}
                >
                  {plannedInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                  {plannedInkludert ? "I dokumentet" : "Legg til i dokument"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANNED_FELT.map((felt) => (
                  <div key={felt.key} className="space-y-1">
                    <Label htmlFor={`planlagt-${felt.key}`} className="text-xs">
                      {felt.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`planlagt-${felt.key}`}
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="0"
                        value={plannedAmounts[felt.key]}
                        onChange={(e) =>
                          setPlannedAmounts((prev) => ({ ...prev, [felt.key]: e.target.value }))
                        }
                        className="h-9 pr-12 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        {felt.enhet}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      F.eks. {felt.eksempler}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="planlagt-kommentar" className="text-xs">
                  Kommentar (valgfritt)
                </Label>
                <Textarea
                  id="planlagt-kommentar"
                  placeholder="F.eks. hvor mengdene plasseres, hvorfor de ikke står i brannskap/egen branncelle, og hvilke forutsetninger som gjelder for lagringen."
                  value={plannedKommentar}
                  onChange={(e) => setPlannedKommentar(e.target.value)}
                  className="min-h-[70px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Brannenergi i hele bygget – beregning */}
          {(() => {
            const harMengder = (Object.keys(totalAmounts) as (keyof PlannedAmounts)[]).some((k) => parseFloat(totalAmounts[k]) > 0);
            if (!harMengder) return null;
            const bidrag = (Object.keys(totalAmounts) as (keyof PlannedAmounts)[])
              .map((k) => {
                const mengde = parseFloat(totalAmounts[k]) || 0;
                if (mengde <= 0) return null;
                const e = ENERGITETTHET[k];
                const felt = PLANNED_FELT.find((f) => f.key === k);
                return { key: k, label: felt?.label || k, enhetInn: felt?.enhet || "", mengde, energi: e.verdi, enhetEnergi: e.enhet, totalMJ: mengde * e.verdi };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);
            const tilleggsMJ = bidrag.reduce((sum, b) => sum + b.totalMJ, 0);
            const generellMJm2 = parseFloat(generellBrannenergiMJm2) || 0;
            const byggGulvareal = parseFloat(byggBrannenergiGulvarealM2) || 0;
            const byggOmhylling = parseFloat(byggBrannenergiOmhyllingsflateM2) || 0;
            const dimGyldig = byggGulvareal > 0 && byggOmhylling > 0;
            const generellMJ = generellMJm2 * byggGulvareal;
            const totalMedTilleggMJ = generellMJ + tilleggsMJ;
            const spesifikkGenerell = dimGyldig ? generellMJ / byggOmhylling : null;
            const spesifikkTillegg = dimGyldig ? tilleggsMJ / byggOmhylling : null;
            const spesifikkTotal = dimGyldig ? totalMedTilleggMJ / byggOmhylling : null;
            const grense = parseFloat(byggBrannenergiGrenseMJm2) || 0;
            const formatMJ = (v: number) => (v >= 10000 ? Math.round(v / 100) * 100 : Math.round(v)).toLocaleString("nb-NO");

            return (
              <Card className="shadow-soft mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-primary" />
                        Brannenergi i hele bygget
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Beregnes fra total mengde brannfarlig stoff i hele virksomheten/anlegget, inkludert salgslokale, brannskap og egne brannceller/lagerrom.
                      </p>
                    </div>
                    <Button variant={byggBrannenergiInkludert ? "default" : "outline"} size="sm" className="h-7 text-xs gap-1.5 shrink-0" onClick={() => setByggBrannenergiInkludert((v) => !v)}>
                      {byggBrannenergiInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                      {byggBrannenergiInkludert ? "I dokumentet" : "Legg til i dokument"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bygg-brannenergi-gulvareal" className="text-xs">Byggets gulvareal (m²)</Label>
                      <Input id="bygg-brannenergi-gulvareal" type="number" min="0" step="any" inputMode="decimal" placeholder="f.eks. 1200" value={byggBrannenergiGulvarealM2} onChange={(e) => setByggBrannenergiGulvarealM2(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bygg-brannenergi-omhylling" className="text-xs">Byggets omhyllingsflate (m²)</Label>
                      <Input id="bygg-brannenergi-omhylling" type="number" min="0" step="any" inputMode="decimal" placeholder="f.eks. 2600" value={byggBrannenergiOmhyllingsflateM2} onChange={(e) => setByggBrannenergiOmhyllingsflateM2(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bygg-brannenergi-grense" className="text-xs">Grense fra brannkonsept (MJ/m²)</Label>
                      <Input id="bygg-brannenergi-grense" type="number" min="0" step="any" inputMode="decimal" placeholder="F.eks. 400 eller 600" value={byggBrannenergiGrenseMJm2} onChange={(e) => setByggBrannenergiGrenseMJm2(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                  {!dimGyldig && <p className="text-[11px] text-destructive">Byggets gulvareal og omhyllingsflate må fylles inn for å kunne vurdere brannenergi for hele bygget.</p>}
                  {dimGyldig && <div className="rounded-md border overflow-hidden"><table className="w-full text-xs"><thead className="bg-muted/50"><tr><th className="text-left px-3 py-2 font-medium">Beregningsdel</th><th className="text-right px-3 py-2 font-medium">Total brannenergi</th><th className="text-right px-3 py-2 font-medium">Spesifikk brannenergi per m² omhyllingsflate</th></tr></thead><tbody><tr className="border-t"><td className="px-3 py-2">Generell brannenergi i bygget</td><td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(generellMJ)} MJ</td><td className="px-3 py-2 text-right tabular-nums">{spesifikkGenerell?.toFixed(1)} MJ/m²</td></tr><tr className="border-t"><td className="px-3 py-2">Brannfarlige stoffer i hele bygget</td><td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(tilleggsMJ)} MJ</td><td className="px-3 py-2 text-right tabular-nums">{spesifikkTillegg?.toFixed(1)} MJ/m²</td></tr><tr className="border-t bg-primary/5"><td className="px-3 py-2 font-semibold">Sum for hele bygget</td><td className="px-3 py-2 text-right tabular-nums font-semibold">{formatMJ(totalMedTilleggMJ)} MJ</td><td className="px-3 py-2 text-right tabular-nums font-semibold text-primary">{spesifikkTotal?.toFixed(1)} MJ/m²</td></tr></tbody></table></div>}
                  {grense > 0 && spesifikkTotal !== null && <div className={`rounded-md border p-3 text-sm ${spesifikkTotal <= grense ? "bg-emerald-500/10 border-emerald-500/30" : "bg-destructive/10 border-destructive/30"}`}>{spesifikkTotal <= grense ? "Beregnet brannenergi ligger innenfor angitt nivå i brannkonseptet." : "Beregnet brannenergi overstiger angitt nivå i brannkonseptet og kan kreve ny vurdering av branncellebegrensende konstruksjoner/brannvegger."}</div>}
                  <div className="rounded-md border overflow-hidden"><div className="bg-muted/50 px-3 py-2 text-xs font-semibold">Brannfarlige stoffer i hele bygget</div><table className="w-full text-xs"><thead className="bg-muted/30"><tr><th className="text-left px-3 py-2 font-medium">Kategori</th><th className="text-right px-3 py-2 font-medium">Mengde</th><th className="text-right px-3 py-2 font-medium">Energi</th><th className="text-right px-3 py-2 font-medium">Sum</th></tr></thead><tbody>{bidrag.map((b) => <tr key={b.key} className="border-t"><td className="px-3 py-2">{b.label}</td><td className="px-3 py-2 text-right tabular-nums">{b.mengde.toLocaleString("nb-NO")} {b.enhetInn}</td><td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.energi} {b.enhetEnergi}</td><td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(b.totalMJ)} MJ</td></tr>)}</tbody></table></div>
                  <div className="space-y-1.5"><Label htmlFor="bygg-brannenergi-kommentar" className="text-xs">Kommentar til samlet brannenergi / kontroll mot brannkonsept</Label><Textarea id="bygg-brannenergi-kommentar" placeholder="F.eks. brannenergi lagt til grunn i brannkonseptet, fordeling i brannceller, eller behov for revurdering." value={byggBrannenergiKommentar} onChange={(e) => setByggBrannenergiKommentar(e.target.value)} className="min-h-[70px] text-sm" /></div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Brannenergi i salgslokalet – beregning */}
          {(() => {
            const harMengder = (Object.keys(plannedAmounts) as (keyof PlannedAmounts)[]).some((k) => parseFloat(plannedAmounts[k]) > 0);
            if (!harMengder) return null;
            const bidrag = (Object.keys(plannedAmounts) as (keyof PlannedAmounts)[]).map((k) => {
              const mengde = parseFloat(plannedAmounts[k]) || 0;
              if (mengde <= 0) return null;
              const e = ENERGITETTHET[k];
              const felt = PLANNED_FELT.find((f) => f.key === k);
              return { key: k, label: felt?.label || k, enhetInn: felt?.enhet || "", mengde, energi: e.verdi, enhetEnergi: e.enhet, totalMJ: mengde * e.verdi };
            }).filter((x): x is NonNullable<typeof x> => x !== null);
            const tilleggsMJ = bidrag.reduce((sum, b) => sum + b.totalMJ, 0);
            const generellMJm2 = parseFloat(generellBrannenergiMJm2) || 0;
            const etasjerBeregnet = etasjer.map((et) => { const L = parseFloat(et.lengde); const B = parseFloat(et.bredde); const H = parseFloat(et.hoyde); const gyldig = L > 0 && B > 0 && H > 0; const gulvareal = gyldig ? L * B : 0; const omh = gyldig ? 2 * (L * B) + 2 * (L * H) + 2 * (B * H) : 0; return { ...et, L, B, H, gyldig, gulvareal, omh }; });
            const gulvareal = etasjerBeregnet.reduce((s, e) => s + e.gulvareal, 0);
            const omhylling = etasjerBeregnet.reduce((s, e) => s + e.omh, 0);
            const dimGyldig = etasjerBeregnet.some((e) => e.gyldig);
            const generellMJ = generellMJm2 * gulvareal;
            const totalMedTilleggMJ = generellMJ + tilleggsMJ;
            const spesifikkGenerell = dimGyldig && omhylling > 0 ? generellMJ / omhylling : null;
            const spesifikkTillegg = dimGyldig && omhylling > 0 ? tilleggsMJ / omhylling : null;
            const spesifikkTotal = dimGyldig && omhylling > 0 ? totalMedTilleggMJ / omhylling : null;
            const okningProsent = generellMJ > 0 ? (tilleggsMJ / generellMJ) * 100 : null;
            const formatMJ = (v: number) => (v >= 10000 ? Math.round(v / 100) * 100 : Math.round(v)).toLocaleString("nb-NO");
            return (
              <Card className="shadow-soft mb-6"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base flex items-center gap-2"><Flame className="h-4 w-4 text-primary" />Brannenergi i salgslokalet</CardTitle><p className="text-xs text-muted-foreground mt-1">Viser generell brannenergi i salgslokalet og tillegg fra brannfarlige varer som plasseres i salgslokalet utenfor brannskap/egne brannceller, omregnet til MJ/m² omhyllingsflate.</p></div><Button variant={brannenergiInkludert ? "default" : "outline"} size="sm" className="h-7 text-xs gap-1.5 shrink-0" onClick={() => setBrannenergiInkludert((v) => !v)}>{brannenergiInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}{brannenergiInkludert ? "I dokumentet" : "Legg til i dokument"}</Button></div></CardHeader><CardContent className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="generell-brannenergi" className="text-xs">Generell brannenergi i salgslokalet (MJ/m² gulvareal)</Label><Input id="generell-brannenergi" type="number" min="0" step="any" inputMode="decimal" value={generellBrannenergiMJm2} onChange={(e) => setGenerellBrannenergiMJm2(e.target.value)} className="h-9 text-sm max-w-xs" /><p className="text-[11px] text-muted-foreground">Standardverdi for salgslokale/kjøpesenter: 730 MJ/m², Byggforsk 321.051.</p></div>
                <div><div className="flex items-center justify-between mb-1.5"><Label className="text-xs">Innvendige mål for salgslokalet (for gulvareal og omhyllingsflate)</Label><Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setEtasjer((prev) => [...prev, lagEtasje(`Etasje ${prev.length + 1}`)])}><Plus className="h-3.5 w-3.5" />Legg til etasje</Button></div><div className="space-y-2">{etasjerBeregnet.map((et, idx) => <div key={et.id} className="rounded-md border bg-muted/20 p-2.5 space-y-2"><div className="flex items-center gap-2"><Input value={et.navn} onChange={(e) => setEtasjer((prev) => prev.map((p) => (p.id === et.id ? { ...p, navn: e.target.value } : p)))} placeholder={`Etasje ${idx + 1}`} className="h-8 text-sm flex-1" />{etasjer.length > 1 && <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => setEtasjer((prev) => prev.filter((p) => p.id !== et.id))} title="Fjern etasje"><Trash2 className="h-3.5 w-3.5" /></Button>}</div><div className="grid grid-cols-3 gap-2">{(["lengde", "bredde", "hoyde"] as const).map((d) => <div key={d} className="relative"><Input type="number" min="0" step="any" inputMode="decimal" placeholder={d === "lengde" ? "Lengde" : d === "bredde" ? "Bredde" : "Høyde"} value={et[d]} onChange={(e) => setEtasjer((prev) => prev.map((p) => (p.id === et.id ? { ...p, [d]: e.target.value } : p)))} className="h-8 pr-7 text-sm" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">m</span></div>)}</div>{et.gyldig && <p className="text-[11px] text-muted-foreground">Gulvareal: <span className="font-medium text-foreground">{et.gulvareal.toFixed(1)} m²</span> · Omhyllingsflate: <span className="font-medium text-foreground">{et.omh.toFixed(1)} m²</span></p>}</div>)}</div>{dimGyldig ? <p className="text-[11px] text-muted-foreground mt-2">Salgslokalets gulvareal = <span className="font-medium text-foreground">{gulvareal.toFixed(1)} m²</span>. Salgslokalets omhyllingsflate A<sub>t</sub> = <span className="font-medium text-foreground">{omhylling.toFixed(1)} m²</span>.</p> : <p className="text-[11px] text-destructive mt-2">Lengde, bredde og høyde for salgslokalet må fylles inn for å kunne vurdere brannenergi per m² omhyllingsflate.</p>}</div>
                {dimGyldig && <div className="rounded-md border overflow-hidden"><table className="w-full text-xs"><thead className="bg-muted/50"><tr><th className="text-left px-3 py-2 font-medium">Beregningsdel</th><th className="text-right px-3 py-2 font-medium">Total brannenergi</th><th className="text-right px-3 py-2 font-medium">Spesifikk brannenergi per m² omhyllingsflate</th></tr></thead><tbody><tr className="border-t"><td className="px-3 py-2">Generell brannenergi i salgslokalet</td><td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(generellMJ)} MJ</td><td className="px-3 py-2 text-right tabular-nums">{spesifikkGenerell?.toFixed(1)} MJ/m²</td></tr><tr className="border-t"><td className="px-3 py-2">Tillegg fra brannfarlige varer i salgslokalet</td><td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(tilleggsMJ)} MJ</td><td className="px-3 py-2 text-right tabular-nums">{spesifikkTillegg?.toFixed(1)} MJ/m²</td></tr><tr className="border-t bg-primary/5"><td className="px-3 py-2 font-semibold">Sum for salgslokalet</td><td className="px-3 py-2 text-right tabular-nums font-semibold">{formatMJ(totalMedTilleggMJ)} MJ</td><td className="px-3 py-2 text-right tabular-nums font-semibold text-primary">{spesifikkTotal?.toFixed(1)} MJ/m²</td></tr></tbody></table></div>}
                {okningProsent !== null && <div className="rounded-md border bg-muted/30 p-3 text-sm">Økning som følge av brannfarlige varer: <span className="font-semibold text-primary">{okningProsent.toFixed(1)} %</span></div>}
                <div className="rounded-md border overflow-hidden"><div className="bg-muted/50 px-3 py-2 text-xs font-semibold">Tillegg fra brannfarlige varer i salgslokalet</div><table className="w-full text-xs"><thead className="bg-muted/30"><tr><th className="text-left px-3 py-2 font-medium">Kategori</th><th className="text-right px-3 py-2 font-medium">Mengde</th><th className="text-right px-3 py-2 font-medium">Energi</th><th className="text-right px-3 py-2 font-medium">Sum</th></tr></thead><tbody>{bidrag.map((b) => <tr key={b.key} className="border-t"><td className="px-3 py-2">{b.label}</td><td className="px-3 py-2 text-right tabular-nums">{b.mengde.toLocaleString("nb-NO")} {b.enhetInn}</td><td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.energi} {b.enhetEnergi}</td><td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(b.totalMJ)} MJ</td></tr>)}</tbody></table></div>
                <div className="space-y-1.5"><Label htmlFor="brannenergi-kommentar" className="text-xs">Kommentar (valgfritt)</Label><Textarea id="brannenergi-kommentar" placeholder="F.eks. vurdering av om økningen er vesentlig, forutsetninger for salgslokalets areal/romstørrelse, m.m." value={brannenergiKommentar} onChange={(e) => setBrannenergiKommentar(e.target.value)} className="min-h-[60px] text-sm" /></div>
              </CardContent></Card>
            );
          })()}

          <Card className="shadow-soft mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-primary" />
                        Brannenergi i salgslokalet
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Viser generell brannenergi i salgslokalet og tillegg fra brannfarlige varer som plasseres i salgslokalet utenfor brannskap/egne brannceller, omregnet til MJ/m² omhyllingsflate.
                      </p>
                    </div>
                    <Button
                      variant={brannenergiInkludert ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1.5 shrink-0"
                      onClick={() => setBrannenergiInkludert((v) => !v)}
                    >
                      {brannenergiInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                      {brannenergiInkludert ? "I dokumentet" : "Legg til i dokument"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-md bg-accent/30 border border-accent text-xs">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">
                      For salgslokale/kjøpesenter benyttes <span className="font-medium text-foreground">730 MJ/m² gulvareal</span> som statistisk brannenergi iht. <span className="font-medium text-foreground">Byggforsk 321.051 Brannenergi i bygninger. Beregninger og statistiske verdier</span>. Brannfarlige varer i salgslokalet utenfor brannskap/egne brannceller beregnes som et tillegg til denne brannenergien.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="generell-brannenergi" className="text-xs">Generell brannenergi i salgslokalet (MJ/m² gulvareal)</Label>
                    <Input
                      id="generell-brannenergi"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={generellBrannenergiMJm2}
                      onChange={(e) => setGenerellBrannenergiMJm2(e.target.value)}
                      className="h-9 text-sm max-w-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Standardverdi for salgslokale/kjøpesenter: 730 MJ/m², Byggforsk 321.051.</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs">Innvendige mål per etasje (for gulvareal og omhyllingsflate)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() =>
                          setEtasjer((prev) => [...prev, lagEtasje(`Etasje ${prev.length + 1}`)])
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Legg til etasje
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {etasjerBeregnet.map((et, idx) => (
                        <div key={et.id} className="rounded-md border bg-muted/20 p-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={et.navn}
                              onChange={(e) =>
                                setEtasjer((prev) =>
                                  prev.map((p) => (p.id === et.id ? { ...p, navn: e.target.value } : p))
                                )
                              }
                              placeholder={`Etasje ${idx + 1}`}
                              className="h-8 text-sm flex-1"
                            />
                            {etasjer.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  setEtasjer((prev) => prev.filter((p) => p.id !== et.id))
                                }
                                title="Fjern etasje"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["lengde", "bredde", "hoyde"] as const).map((d) => (
                              <div key={d} className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  inputMode="decimal"
                                  placeholder={d === "lengde" ? "Lengde" : d === "bredde" ? "Bredde" : "Høyde"}
                                  value={et[d]}
                                  onChange={(e) =>
                                    setEtasjer((prev) =>
                                      prev.map((p) => (p.id === et.id ? { ...p, [d]: e.target.value } : p))
                                    )
                                  }
                                  className="h-8 pr-7 text-sm"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                                  m
                                </span>
                              </div>
                            ))}
                          </div>
                          {et.gyldig && (
                            <p className="text-[11px] text-muted-foreground">
                              Gulvareal: <span className="font-medium text-foreground">{et.gulvareal.toFixed(1)} m²</span> · Omhyllingsflate: <span className="font-medium text-foreground">{et.omh.toFixed(1)} m²</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {dimGyldig ? (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Samlet gulvareal = <span className="font-medium text-foreground">{gulvareal.toFixed(1)} m²</span>. Total omhyllingsflate A<sub>t</sub> = <span className="font-medium text-foreground">{omhylling.toFixed(1)} m²</span>.
                      </p>
                    ) : (
                      <p className="text-[11px] text-destructive mt-2">
                        Lengde, bredde og høyde må fylles inn for å kunne vurdere brannenergi per m² omhyllingsflate.
                      </p>
                    )}
                  </div>

                  {dimGyldig && (
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Beregningsdel</th>
                            <th className="text-right px-3 py-2 font-medium">Total brannenergi</th>
                            <th className="text-right px-3 py-2 font-medium">Spesifikk brannenergi per m² omhyllingsflate</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="px-3 py-2">Generell brannenergi i salgslokalet</td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(generellMJ)} MJ</td>
                            <td className="px-3 py-2 text-right tabular-nums">{spesifikkGenerell?.toFixed(1)} MJ/m²</td>
                          </tr>
                          <tr className="border-t">
                            <td className="px-3 py-2">Tillegg fra brannfarlige varer i salgslokalet</td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(tilleggsMJ)} MJ</td>
                            <td className="px-3 py-2 text-right tabular-nums">{spesifikkTillegg?.toFixed(1)} MJ/m²</td>
                          </tr>
                          <tr className="border-t bg-primary/5">
                            <td className="px-3 py-2 font-semibold">Sum for salgslokalet</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatMJ(totalMedTilleggMJ)} MJ</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-primary">{spesifikkTotal?.toFixed(1)} MJ/m²</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {okningProsent !== null && (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                      Økning som følge av brannfarlige varer: <span className="font-semibold text-primary">{okningProsent.toFixed(1)} %</span>
                    </div>
                  )}

                  <div className="rounded-md border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-xs font-semibold">Tillegg fra brannfarlige varer i salgslokalet</div>
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Kategori</th>
                          <th className="text-right px-3 py-2 font-medium">Mengde</th>
                          <th className="text-right px-3 py-2 font-medium">Energi</th>
                          <th className="text-right px-3 py-2 font-medium">Sum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bidrag.map((b) => (
                          <tr key={b.key} className="border-t">
                            <td className="px-3 py-2">{b.label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{b.mengde.toLocaleString("nb-NO")} {b.enhetInn}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.energi} {b.enhetEnergi}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">{formatMJ(b.totalMJ)} MJ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-md bg-accent/30 border border-accent text-xs">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">
                      Energitettheter for brannfarlige varer er sjablongverdier hentet fra <span className="font-medium text-foreground">SFPE Handbook of Fire Protection Engineering</span> og <span className="font-medium text-foreground">NS-EN 1991-1-2</span>. Beregningen ivaretar ikke fuktinnhold, sammensetning eller emballasje, og brukes kun til indikativ vurdering.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="brannenergi-kommentar" className="text-xs">Kommentar (valgfritt)</Label>
                    <Textarea
                      id="brannenergi-kommentar"
                      placeholder="F.eks. vurdering av om økningen er vesentlig, forutsetninger for areal/romstørrelse, m.m."
                      value={brannenergiKommentar}
                      onChange={(e) => setBrannenergiKommentar(e.target.value)}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Branntekniske tiltak i bygget
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dokumenter brannalarm, røykventilasjon og automatiske slokkeanlegg som forutsetninger i rapporten.
                  </p>
                </div>
                <Button
                  variant={branntekniskeTiltakInkludert ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={() => setBranntekniskeTiltakInkludert((v) => !v)}
                >
                  {branntekniskeTiltakInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                  {branntekniskeTiltakInkludert ? "I dokumentet" : "Legg til i dokument"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <h4 className="text-sm font-semibold">Brannalarmanlegg</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={branntekniskeTiltak.brannalarm.status}
                        onValueChange={(status) => updateBranntekniskTiltak("brannalarm", withRapporttekst("brannalarm", { ...branntekniskeTiltak.brannalarm, status }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Velg status" /></SelectTrigger>
                        <SelectContent>{TILTAK_STATUS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type/beskrivelse</Label>
                      <Input
                        value={branntekniskeTiltak.brannalarm.beskrivelse}
                        onChange={(e) => updateBranntekniskTiltak("brannalarm", { ...branntekniskeTiltak.brannalarm, beskrivelse: e.target.value })}
                        placeholder="F.eks. heldekkende kategori 2"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={branntekniskeTiltak.brannalarm.kommentar}
                    onChange={(e) => updateBranntekniskTiltak("brannalarm", { ...branntekniskeTiltak.brannalarm, kommentar: e.target.value })}
                    placeholder="Kommentar til deteksjon, manuelle meldere eller dekning i lagerrom..."
                    className="min-h-[60px] text-sm"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs">Rapporttekst / virkning på rømningstid</Label>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateBranntekniskTiltak("brannalarm", { ...branntekniskeTiltak.brannalarm, rapporttekst: getOriginalTiltakTekst("brannalarm") })}>
                        Original tekst
                      </Button>
                    </div>
                    <Textarea
                      value={branntekniskeTiltak.brannalarm.rapporttekst}
                      onChange={(e) => updateBranntekniskTiltak("brannalarm", { ...branntekniskeTiltak.brannalarm, rapporttekst: e.target.value })}
                      placeholder="Fagtekst om tiltakets funksjon og påvirkning på rømningstid..."
                      className="min-h-[120px] text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Røykventilasjon</h4>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/verktoy/roykventilasjon")}>
                      Åpne beregningsverktøy
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={branntekniskeTiltak.roykventilasjon.status}
                        onValueChange={(status) => updateBranntekniskTiltak("roykventilasjon", withRapporttekst("roykventilasjon", { ...branntekniskeTiltak.roykventilasjon, status }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Velg status" /></SelectTrigger>
                        <SelectContent>{TILTAK_STATUS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={branntekniskeTiltak.roykventilasjon.type}
                        onValueChange={(type) => updateBranntekniskTiltak("roykventilasjon", withRapporttekst("roykventilasjon", { ...branntekniskeTiltak.roykventilasjon, type }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Velg type" /></SelectTrigger>
                        <SelectContent>{ROYKVENTILASJON_TYPER.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    value={branntekniskeTiltak.roykventilasjon.beskrivelse}
                    onChange={(e) => updateBranntekniskTiltak("roykventilasjon", { ...branntekniskeTiltak.roykventilasjon, beskrivelse: e.target.value })}
                    placeholder="F.eks. røykventilasjon vurderes ikke nødvendig, eller dimensjoneres iht. HO-3/2000..."
                    className="min-h-[60px] text-sm"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs">Rapporttekst / virkning på rømningstid</Label>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateBranntekniskTiltak("roykventilasjon", { ...branntekniskeTiltak.roykventilasjon, rapporttekst: getOriginalTiltakTekst("roykventilasjon") })}>
                        Original tekst
                      </Button>
                    </div>
                    <Textarea
                      value={branntekniskeTiltak.roykventilasjon.rapporttekst}
                      onChange={(e) => updateBranntekniskTiltak("roykventilasjon", { ...branntekniskeTiltak.roykventilasjon, rapporttekst: e.target.value })}
                      placeholder="Fagtekst om tiltakets funksjon og påvirkning på rømningstid..."
                      className="min-h-[120px] text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <h4 className="text-sm font-semibold">Automatisk slokkeanlegg</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={branntekniskeTiltak.slokkeanlegg.status}
                        onValueChange={(status) => updateBranntekniskTiltak("slokkeanlegg", withRapporttekst("slokkeanlegg", { ...branntekniskeTiltak.slokkeanlegg, status }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Velg status" /></SelectTrigger>
                        <SelectContent>{TILTAK_STATUS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={branntekniskeTiltak.slokkeanlegg.type}
                        onValueChange={(type) => updateBranntekniskTiltak("slokkeanlegg", withRapporttekst("slokkeanlegg", { ...branntekniskeTiltak.slokkeanlegg, type }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Velg type" /></SelectTrigger>
                        <SelectContent>{SLOKKEANLEGG_TYPER.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    value={branntekniskeTiltak.slokkeanlegg.beskrivelse}
                    onChange={(e) => updateBranntekniskTiltak("slokkeanlegg", { ...branntekniskeTiltak.slokkeanlegg, beskrivelse: e.target.value })}
                    placeholder="F.eks. bygget er sprinklet, lagerrom omfattes av eksisterende sprinkleranlegg..."
                    className="min-h-[60px] text-sm"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs">Rapporttekst / virkning på rømningstid</Label>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateBranntekniskTiltak("slokkeanlegg", { ...branntekniskeTiltak.slokkeanlegg, rapporttekst: getOriginalTiltakTekst("slokkeanlegg") })}>
                        Original tekst
                      </Button>
                    </div>
                    <Textarea
                      value={branntekniskeTiltak.slokkeanlegg.rapporttekst}
                      onChange={(e) => updateBranntekniskTiltak("slokkeanlegg", { ...branntekniskeTiltak.slokkeanlegg, rapporttekst: e.target.value })}
                      placeholder="Fagtekst om tiltakets funksjon og påvirkning på rømningstid..."
                      className="min-h-[120px] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Felles kommentar / forutsetninger</Label>
                <Textarea
                  value={branntekniskeTiltak.generellKommentar}
                  onChange={(e) => updateBranntekniskTiltak("generellKommentar", e.target.value)}
                  placeholder="Prosjektspesifikke forutsetninger for branntekniske tiltak..."
                  className="min-h-[70px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* TABS – DSB Temaveiledning innhold                               */}
          {/* ============================================================== */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-6">
            {valgtBygningstype && (
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-accent/30 border border-accent text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">
                    Viser kun krav som er relevante for <span className="font-medium text-foreground">{valgtBygg?.navn}</span>.
                    Kontrollseksjonen tilpasses automatisk etter om anlegget har tanker eller gjelder butikk/småemballasje.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 h-8 text-xs">
                  <a href="/eksempelkatalog/brannfarlige-stoffer" target="_blank" rel="noopener noreferrer">
                    <Flame className="h-3.5 w-3.5 mr-1" />
                    Slå opp stoffdata
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
            <TabsList className={`grid w-full h-auto gap-1 ${
              [isTabRelevant("beliggenhet"), isTabRelevant("tanker"), isTabRelevant("oppsamling"), isTabRelevant("roer"), isTabRelevant("innmelding"), isTabRelevant("dokumentasjon")].filter(Boolean).length >= 6
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}>
              {isTabRelevant("beliggenhet") && (
                <TabsTrigger value="beliggenhet" className="text-xs py-2">
                  <Ruler className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Beliggenhet
                </TabsTrigger>
              )}
              {isTabRelevant("tanker") && (
                <TabsTrigger value="tanker" className="text-xs py-2">
                  <Cylinder className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Tanker
                </TabsTrigger>
              )}
              {isTabRelevant("oppsamling") && (
                <TabsTrigger value="oppsamling" className="text-xs py-2">
                  <Droplets className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Oppsamling
                </TabsTrigger>
              )}
              {isTabRelevant("roer") && (
                <TabsTrigger value="roer" className="text-xs py-2">
                  <PipetteIcon className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Rør & ventiler
                </TabsTrigger>
              )}
              {isTabRelevant("innmelding") && (
                <TabsTrigger value="innmelding" className="text-xs py-2">
                  <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Innmelding
                </TabsTrigger>
              )}
              {isTabRelevant("dokumentasjon") && (
                <TabsTrigger value="dokumentasjon" className="text-xs py-2">
                  <FolderOpen className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Dokumentasjon
                </TabsTrigger>
              )}
            </TabsList>

            {/* ============ TAB: Beliggenhet & utforming ============ */}
            <TabsContent value="beliggenhet" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-primary" />
                      Beliggenhet og utforming (§ 15.1)
                    </CardTitle>
                    <DocToggleButton tabKey="beliggenhet" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Krav til plassering, branngater, inngjerding og rømningsveier
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {BELIGGENHET_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`beliggenhet_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`beliggenhet_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {visTankBeliggenhet && (
              <>
              {/* Sikkerhetsavstander */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Sikkerhetsavstander – tank til objekt (§ 15.11)</CardTitle>
                  <p className="text-sm text-muted-foreground">Veiledende minsteavstander mellom tank og nærliggende objekter</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Objekt</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kat. 1 & 2</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kat. 3</th>
                          <th className="text-left py-2.5 px-3 font-medium">Diesel/fyringsolje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SIKKERHETSAVSTANDER.map((rad, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 font-medium">{rad.objekt}</td>
                            <td className="py-2 px-3">{rad.kat1og2}</td>
                            <td className="py-2 px-3">{rad.kat3}</td>
                            <td className="py-2 px-3">{rad.dieselFyringsolje}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Interne avstander */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Interne avstander – kat. 1 & 2 (meter)</CardTitle>
                  <p className="text-sm text-muted-foreground">Veiledende minsteavstander mellom anleggsdeler (f.eks. bensin)</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Fra / Til</th>
                          <th className="text-left py-2.5 px-3 font-medium">Fyrhus</th>
                          <th className="text-left py-2.5 px-3 font-medium">Fyllep. kai</th>
                          <th className="text-left py-2.5 px-3 font-medium">Fyllep. bil/tog</th>
                          <th className="text-left py-2.5 px-3 font-medium">Pumpehus</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kontor</th>
                          <th className="text-left py-2.5 px-3 font-medium">Hydrant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {INTERNE_AVSTANDER_KAT12.map((rad, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 font-medium">{rad.fra}</td>
                            <td className="py-2 px-3">{rad.fyrhus}</td>
                            <td className="py-2 px-3">{rad.fylleplassKai}</td>
                            <td className="py-2 px-3">{rad.fylleplassBilTog}</td>
                            <td className="py-2 px-3">{rad.pumpehus}</td>
                            <td className="py-2 px-3">{rad.kontor}</td>
                            <td className="py-2 px-3">{rad.hydrant}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Kilde: DSB Temaveiledning § 15.11. Avstander kan økes/reduseres basert på risikovurdering.
                  </p>
                </CardContent>
              </Card>
              </>
              )}
            </TabsContent>

            {/* ============ TAB: Tanker ============ */}
            <TabsContent value="tanker" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cylinder className="h-5 w-5 text-primary" />
                      Krav til tanker (§ 15.2)
                    </CardTitle>
                    <DocToggleButton tabKey="tanker" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Utførelse, fundament, korrosjonsbeskyttelse og flammesikring
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {TANK_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`tank_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`tank_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pumper */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Pumper og pumperom (§ 15.6)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PUMPE_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`pumpe_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`pumpe_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Oppsamling & overfylling ============ */}
            <TabsContent value="oppsamling" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      Oppsamling og overfyllingsvern (§ 15.3)
                    </CardTitle>
                    <DocToggleButton tabKey="oppsamling" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Krav til oppsamlingsbasseng, drenering, overfyllingsvarsel og oljeutskiller
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {OPPSAMLING_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`oppsamling_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`oppsamling_${i}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{krav.tittel}</h4>
                            {krav.paragraf && (
                              <Badge variant="outline" className="text-xs">{krav.paragraf}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Rør & ventiler ============ */}
            <TabsContent value="roer" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PipetteIcon className="h-5 w-5 text-primary" />
                      Rørledninger (§ 15.4)
                    </CardTitle>
                    <DocToggleButton tabKey="roer" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ROERLEDNING_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`roer_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`roer_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Ventiler (§ 15.5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {VENTIL_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`ventil_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`ventil_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Innmelding ============ */}
            <TabsContent value="innmelding" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Innmeldingsplikt til DSB (§ 12)
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vurderingen er beregnet automatisk fra «Total mengde brannfarlig stoff i virksomheten/anlegget».
                      </p>
                    </div>
                    <Button
                      variant={innmeldingInkludert ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1.5 shrink-0"
                      onClick={() => setInnmeldingInkludert((v) => !v)}
                    >
                      {innmeldingInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                      {innmeldingInkludert ? "I dokumentet" : "Legg til i dokument"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Konklusjon */}
                  {!innmeldingVurdering.harMengder ? (
                    <div className="p-4 rounded-lg bg-accent/30 border border-border flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">Ingen totalmengder registrert</p>
                        <p className="text-muted-foreground">
                          Fyll inn total mengde brannfarlig stoff i virksomheten/anlegget for å vurdere innmeldingsplikt til DSB.
                        </p>
                      </div>
                    </div>
                  ) : innmeldingVurdering.trengerInnmelding ? (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-destructive">Anlegget er innmeldingspliktig til DSB</p>
                        <p className="text-foreground/80">
                          Følgende stoffgruppe(r) overskrider innmeldingsgrensen iht. § 12:
                        </p>
                        <ul className="list-disc pl-5 text-foreground/80">
                          {innmeldingVurdering.grupper.filter((g) => g.status === "over").map((g) => (
                            <li key={g.id}>
                              {g.kategori} – total mengde {g.sum.toLocaleString("nb-NO")} L (grense {g.grenseLiter.toLocaleString("nb-NO")} L)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">Ingen innmeldingsplikt utløst</p>
                        <p className="text-muted-foreground">
                          Totalmengdene ligger under grensene i § 12. Anlegget trenger ikke meldes inn til DSB.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vurderingstabell */}
                  <div className="border rounded-lg overflow-hidden mt-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Stoffgruppe</th>
                          <th className="text-right py-2.5 px-3 font-medium">Total mengde</th>
                          <th className="text-right py-2.5 px-3 font-medium">Innmeldingsgrense</th>
                          <th className="text-left py-2.5 px-3 font-medium">Status</th>
                          <th className="text-right py-2.5 px-3 font-medium">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innmeldingVurdering.grupper.map((g) => (
                          <tr key={g.id} className="border-t">
                            <td className="py-2 px-3 font-medium">{g.kategori}</td>
                            <td className="py-2 px-3 text-right">
                              {g.sum > 0 ? `${g.sum.toLocaleString("nb-NO")} L` : "—"}
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
                              {g.grenseLiter.toLocaleString("nb-NO")} L
                            </td>
                            <td className="py-2 px-3">
                              {g.status === "over" && (
                                <Badge variant="destructive" className="text-xs">Innmeldingspliktig</Badge>
                              )}
                              {g.status === "under" && (
                                <Badge className="text-xs bg-emerald-600 hover:bg-emerald-600/90 text-white">Under grense</Badge>
                              )}
                              {g.status === "ingen" && (
                                <Badge variant="outline" className="text-xs">Ikke aktuelt</Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-xs text-muted-foreground">
                              {g.status === "under" ? `${g.gjenstaende.toLocaleString("nb-NO")} L til grensen` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Hva må gjøres ved overskridelse */}
                  {innmeldingVurdering.trengerInnmelding && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                      <p className="font-medium text-sm text-foreground">Hva må gjøres</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        <li>Innmelding sendes til DSB senest 3 måneder før idriftsettelse av anlegget.</li>
                        <li>Skjema fylles ut og sendes via Altinn (DSB sin innmeldingsløsning for farlig stoff).</li>
                        <li>
                          Innmeldingen skal inneholde opplysninger om virksomhet, beliggenhet, type og mengde stoff,
                          tankvolum/-utforming, oppsamling og sikkerhetstiltak.
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Kommentar når seksjonen skal legges i dokumentet */}
                  {innmeldingInkludert && (
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs">Kommentar (valgfri)</Label>
                      <Textarea
                        value={innmeldingKommentar}
                        onChange={(e) => setInnmeldingKommentar(e.target.value)}
                        placeholder="F.eks. forutsetninger, planlagt innmeldingsdato, ansvarlig søker …"
                        className="min-h-[70px] text-sm"
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground italic">
                    Kilde: Forskrift om håndtering av brannfarlig, reaksjonsfarlig og trykksatt stoff (FBRT) § 12.
                    Gass og aerosoler vurderes ikke mot væskegrensene over.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Dokumentasjon ============ */}
            <TabsContent value="dokumentasjon" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Dokumentasjonskrav (§ 13)
                    </CardTitle>
                    <DocToggleButton tabKey="dokumentasjon" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dokumentasjon som skal være tilgjengelig gjennom anleggets levetid
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-center py-2.5 px-2 font-medium w-10">Dok.</th>
                          <th className="text-left py-2.5 px-3 font-medium">Type dokumentasjon</th>
                          <th className="text-left py-2.5 px-3 font-medium w-32">Referanse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOKUMENTASJON_KRAV.map((dok, i) => (
                          <tr key={i} className={`border-t ${isKravSelected(`dok_${i}`) ? "bg-primary/5" : ""}`}>
                            <td className="py-2 px-2 text-center"><KravItemButton id={`dok_${i}`} /></td>
                            <td className="py-2 px-3">{dok.type}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs">{dok.referanse}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Omfanget avhenger av anleggets størrelse og kompleksitet. Dokumentasjonen skal inngå som del av internkontroll (IK-forskriften § 5).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        {/* ============================================================== */}
        {/* LAGRING I BYGNING – tillatte mengder, krav, stykkgods           */}
        {/* ============================================================== */}
        <div className="mt-10 pt-8 border-t">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-xl font-bold">Lagring i bygning</h3>
              <p className="text-sm text-muted-foreground">
                DSB Temaveiledning Kap. 3 (stykkgods) og VTEK § 11-8 (tanklagring)
              </p>
            </div>
          </div>

          <div className="space-y-6">

              {/* SALGSLOKALE: DSB-tabell – fast tabell, kan legges til i dokumentet */}
              {valgtBygningstype === "salgslokale" && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          Største tillatte mengder i salgslokaler – DSB Temaveiledning Kap. 3
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mengdegrensene avhenger av salgslokalets areal.
                        </p>
                      </div>
                      <Button
                        variant={salgslokaleInkludert ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0"
                        onClick={() => setSalgslokaleInkludert((v) => !v)}
                      >
                        {salgslokaleInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                        {salgslokaleInkludert ? "I dokumentet" : "Legg til i dokument"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2.5 px-3 font-medium">Salgslokalets areal</th>
                            <th className="text-left py-2.5 px-3 font-medium">Aerosoler</th>
                            <th className="text-left py-2.5 px-3 font-medium">Brannfarlig gass</th>
                            <th className="text-left py-2.5 px-3 font-medium">Br.f. væske kat. 1 og 2</th>
                            <th className="text-left py-2.5 px-3 font-medium">Br.f. væske kat. 3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {STYKKGODS_GRENSER.map((g, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-2 px-3">{g.arealBeskrivelse}</td>
                              <td className="py-2 px-3">{g.aerosoler} L</td>
                              <td className="py-2 px-3">{g.brannfarligGass}</td>
                              <td className="py-2 px-3">{g.brannfarligVaeskeKat1og2} L</td>
                              <td className="py-2 px-3">{g.brannfarligVaeskeKat3.toLocaleString("nb-NO")} L</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                      DSB sin temaveiledning angir anbefalte mengder for salgslokaler, men legger opp til at mengdene kan økes noe dersom det fremgår av risikovurderingen at en begrenset økning er akseptabel. En slik økning bør knyttes til konkrete forutsetninger som sprinkleranlegg, oversiktlig lagring, kontrollrutiner og begrenset økning. Gassmengder vurderes strengere og bør ikke økes uten særskilt vurdering.
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="salgslokale-tiltak" className="text-sm">
                          Vurdering av høyere mengder / kompenserende tiltak
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => setSalgslokaleTiltakTekst(getOriginalSalgslokaleTiltakTekst())}
                        >
                          Original tekst
                        </Button>
                      </div>
                      <Textarea
                        id="salgslokale-tiltak"
                        value={salgslokaleTiltakTekst}
                        onChange={(e) => setSalgslokaleTiltakTekst(e.target.value)}
                        className="min-h-[190px] text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="salgslokale-kommentar" className="text-sm">
                        Kommentar (valgfritt)
                      </Label>
                      <Textarea
                        id="salgslokale-kommentar"
                        placeholder="Legg til en prosjektspesifikk kommentar som vises under tabellen i dokumentet (f.eks. faktisk areal, tiltak, avvik …)."
                        value={salgslokaleKommentar}
                        onChange={(e) => setSalgslokaleKommentar(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                    </div>

                    {/* Vis krav-knapper per kategori */}
                    {valgtBygg && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-xs text-muted-foreground self-center mr-1">Konstruksjonskrav:</span>
                        {valgtBygg.grenser
                          .filter((g) => g.romKrav.length > 0 && (g.maksLiter !== null || g.maksKg))
                          .map((g) => (
                            <Button
                              key={g.brenselType}
                              variant={expandedBrensel === g.brenselType ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setExpandedBrensel(expandedBrensel === g.brenselType ? null : g.brenselType)}
                            >
                              {g.brenselNavn}
                            </Button>
                          ))}
                      </div>
                    )}

                    <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                      <p><strong>Kilde:</strong> DSB Temaveiledning, Kapittel 3 – Oppbevaring av brannfarlig stoff i transport- og brukeremballasje (stykkgods), § 6.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ANDRE BYGNINGSTYPER: Standard tabell over tillatte mengder */}
              {valgtBygg && valgtBygningstype !== "salgslokale" && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Tillatte mengder – {valgtBygg.navn}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{valgtBygg.beskrivelse}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 px-3 font-medium text-xs">Brenseltype</th>
                            <th className="text-left py-2 px-3 font-medium text-xs">Maks mengde</th>
                            <th className="text-left py-2 px-3 font-medium text-xs w-20">Detaljer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valgtBygg.grenser.map((g) => (
                            <tr key={g.brenselType} className="border-t">
                              <td className="py-2 px-3 font-medium text-xs">{g.brenselNavn}</td>
                              <td className="py-2 px-3">
                                {g.maksLiter === null && !g.maksKg ? (
                                  <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Ikke tillatt</Badge>
                                ) : g.maksKg ? (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {g.maksKg.toLocaleString("nb-NO")} kg
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {g.maksLiter!.toLocaleString("nb-NO")} L
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {(g.maksLiter !== null || g.maksKg) && g.romKrav.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => setExpandedBrensel(expandedBrensel === g.brenselType ? null : g.brenselType)}
                                  >
                                    {expandedBrensel === g.brenselType ? "Skjul" : "Vis krav"}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Utfyllende konstruksjonskrav (felles for begge tilfeller) */}
              {expandedBrensel && valgtBygg && (() => {
                const grense = valgtBygg.grenser.find((g) => g.brenselType === expandedBrensel);
                if (!grense || grense.romKrav.length === 0) return null;
                return (
                  <Card className="shadow-soft border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Konstruksjonskrav – {grense.brenselNavn}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Maks {grense.maksKg ? `${grense.maksKg} kg` : `${grense.maksLiter?.toLocaleString("nb-NO")} liter`} i {valgtBygg.navn.toLowerCase()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left py-2 px-3 font-medium text-xs">Kategori</th>
                              <th className="text-left py-2 px-3 font-medium text-xs">Krav</th>
                              <th className="text-left py-2 px-3 font-medium text-xs w-16">Ansvar</th>
                              <th className="text-left py-2 px-3 font-medium text-xs">Ref.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grense.romKrav.map((k, i) => (
                              <tr key={i} className="border-t">
                                <td className="py-2 px-3 font-medium text-xs">{k.kategori}</td>
                                <td className="py-2 px-3 text-xs">{k.tekst}</td>
                                <td className="py-2 px-3 text-xs text-muted-foreground">{k.ansvar}</td>
                                <td className="py-2 px-3 text-xs">
                                  {k.referanse ? (
                                    <a
                                      href={k.referanse.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                      {k.referanse.label}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : "–"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              {/* ============ Kontroll og tilstandskontroll ============ */}
              <div className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      Kontroll og tilstandskontroll (§ 9)
                    </CardTitle>
                    <DocToggleButton tabKey="kontroll" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Krav til kontrollintervaller og systematisk tilstandskontroll
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent bg-accent/30 p-3 text-sm">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">
                      {harTankanlegg === false
                        ? "Anlegget har ikke tanker. Kontrollkrav for tankanlegg (utvendig/innvendig tilstandskontroll, rørsystem og sikkerhetskritisk tankutstyr) er ikke aktuelle og er skjult. Endre bygningstype for å vise alle krav."
                        : "Vist kontrollomfang er tilpasset anlegg med tanker. Tankspesifikke krav vises sammen med generelle kontrollkrav."}
                    </p>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-center py-2.5 px-2 font-medium w-10">Dok.</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kontrolltype</th>
                          <th className="text-left py-2.5 px-3 font-medium">Beskrivelse</th>
                          <th className="text-left py-2.5 px-3 font-medium w-36">Intervall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kontrollKravVisning.map(({ krav, index }) => (
                          <tr key={index} className={`border-t ${isKravSelected(`kontroll_${index}`) ? "bg-primary/5" : ""}`}>
                            <td className="py-2 px-2 text-center"><KravItemButton id={`kontroll_${index}`} /></td>
                            <td className="py-2 px-3 font-medium">{krav.tittel}</td>
                            <td className="py-2 px-3 text-muted-foreground">{krav.beskrivelse}</td>
                            <td className="py-2 px-3">
                              {krav.intervall && <Badge variant="secondary" className="text-xs">{krav.intervall}</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm space-y-1.5">
                    <p className="font-medium">Generelt skal systematisk tilstandskontroll omfatte:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {kontrollGenerelt.map((punkt) => <li key={punkt}>{punkt}</li>)}
                    </ul>
                  </div>
                </CardContent>
          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Vurdering av mengde over anbefalt DSB-mengde
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sammenligner mengde utover DSB sin veiledning med anbefalt mengde og dokumenterer kompenserende tiltak.
                  </p>
                </div>
                <Button
                  variant={overskridelseInkludert ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={() => setOverskridelseInkludert((v) => !v)}
                >
                  {overskridelseInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                  {overskridelseInkludert ? "I dokumentet" : "Legg til i dokument"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {valgtBygningstype === "salgslokale" && (
                <div className="space-y-1.5">
                  <Label htmlFor="overskridelse-areal" className="text-xs">Arealgrunnlag for DSB-tabell</Label>
                  <Input
                    id="overskridelse-areal"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={overskridelseArealgrunnlag}
                    onChange={(e) => setOverskridelseArealgrunnlag(e.target.value)}
                    placeholder={samletGulvareal > 0 ? samletGulvareal.toFixed(1) : "m²"}
                    className="h-9 text-sm max-w-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Bruker samlet gulvareal fra brannenergidelen hvis feltet står tomt. Aktiv DSB-rad: {stykkgodsGrense.arealBeskrivelse}.
                  </p>
                </div>
              )}

              {overskridelseRows.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Stoffgruppe</th>
                        <th className="text-right px-3 py-2 font-medium">Anbefalt</th>
                        <th className="text-right px-3 py-2 font-medium">Planlagt</th>
                        <th className="text-right px-3 py-2 font-medium">Overskridelse</th>
                        <th className="text-left px-3 py-2 font-medium">Vurdert tillatt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overskridelseRows.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{row.stoffgruppe}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.anbefaltMengde.toLocaleString("nb-NO")} {row.enhet}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.planlagtMengde.toLocaleString("nb-NO")} {row.enhet}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-destructive">{row.overskridelse.toLocaleString("nb-NO")} {row.enhet} ({row.overskridelseProsent.toFixed(0)} %)</td>
                          <td className="px-3 py-2">
                            <Input
                              value={overskridelseVurdertTillattMengde[row.id] || ""}
                              onChange={(e) => setOverskridelseVurdertTillattMengde((prev) => ({ ...prev, [row.id]: e.target.value }))}
                              placeholder={`${row.planlagtMengde.toLocaleString("nb-NO")} ${row.enhet}`}
                              className="h-8 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-md bg-accent/30 border border-accent text-xs">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">
                    Ingen registrerte planlagte mengder overstiger anbefalt mengde for valgt bygningstype/arealgrunnlag.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="overskridelse-tiltak" className="text-xs">Andre prosjektspesifikke tiltak</Label>
                <Textarea
                  id="overskridelse-tiltak"
                  value={overskridelseTiltak}
                  onChange={(e) => setOverskridelseTiltak(e.target.value)}
                  placeholder="F.eks. sprinkleranlegg, oversiktlig plassering, oppsamlingskar, begrenset publikumsadgang, rutiner for kontroll og opplæring..."
                  className="min-h-[70px] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="overskridelse-vurdering" className="text-xs">Vurderingstekst</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOverskridelseVurderingstekst(foreslattOverskridelseTekst)}>
                    Generer tekst
                  </Button>
                </div>
                <Textarea
                  id="overskridelse-vurdering"
                  value={overskridelseVurderingstekst}
                  onChange={(e) => setOverskridelseVurderingstekst(e.target.value)}
                  placeholder="Beskriv hvorfor høyere mengde vurderes akseptabel basert på tiltakene..."
                  className="min-h-[130px] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="overskridelse-konklusjon" className="text-xs">Konklusjon / avgrensning</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOverskridelseKonklusjon(foreslattOverskridelseKonklusjon)}>
                    Standardtekst
                  </Button>
                </div>
                <Textarea
                  id="overskridelse-konklusjon"
                  value={overskridelseKonklusjon}
                  onChange={(e) => setOverskridelseKonklusjon(e.target.value)}
                  placeholder="Konklusjon og presisering av at vurderingen kun gjelder dette bygget..."
                  className="min-h-[80px] text-sm"
                />
              </div>
            </CardContent>
          </Card>


              </Card>
              </div>


            </div>
          </div>

          {/* Lagre-knapp – alltid synlig, plassert over inntastingskolonnen (venstre halvdel) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-[calc(50%+1rem)] z-50 hidden lg:block">
            <Button
              size="default"
              onClick={handleSaveDocument}
              disabled={isSaving || !selectedProjectId || (!valgtBygningstype && selectedKravIds.size === 0 && !salgslokaleInkludert && !totalInkludert && !plannedInkludert && !branntekniskeTiltakInkludert)}
              className="h-11 px-6 shadow-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Lagrer..." : "Lagre dokument"}
            </Button>
          </div>
          {/* Mobil: fast nede til høyre */}
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <Button
              size="default"
              onClick={handleSaveDocument}
              disabled={isSaving || !selectedProjectId || (!valgtBygningstype && selectedKravIds.size === 0 && !salgslokaleInkludert && !totalInkludert && !plannedInkludert && !branntekniskeTiltakInkludert)}
              className="h-11 px-6 shadow-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Lagrer..." : "Lagre"}
            </Button>
          </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Kilde: DSB Temaveiledning om oppbevaring av farlig stoff (Kap. 1 & 3) og VTEK § 11-8.
          <br />
          <a
            href="https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Les hele veiledningen på dsb.no
          </a>
        </p>

            </div>

            {/* ===== RIGHT: Document preview (always visible) ===== */}
            <div className="hidden lg:flex lg:flex-col lg:min-w-0 lg:h-full">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-muted-foreground">Forhåndsvisning</h4>
                </div>
                {canDownload && (
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDownloadWord} disabled={!valgtBygg}>
                    <FileDown className="h-3.5 w-3.5" />
                    Last ned Word
                  </Button>
                )}
              </div>
              <div className="flex-1 min-h-0 bg-muted/30 rounded-xl p-3 overflow-auto">
                <BrensellagringPreview
                  valgtBygg={valgtBygg}
                  firmaNavn={firmaNavn || undefined}
                  kunde={kunde || undefined}
                  utarbeidetAv={utarbeidetAv || undefined}
                  ksAnsvarlig={ksAnsvarlig || undefined}
                  logoUrl={logoUrl || undefined}
                  prosjektNavn={prosjektNavn || undefined}
                  adresse={adresse || undefined}
                  visibleSections={visibleSections}
                  selectedKravIds={selectedKravIds}
                  salgslokaleInkludert={salgslokaleInkludert && valgtBygningstype === "salgslokale"}
                  salgslokaleKommentar={salgslokaleKommentar}
                  salgslokaleTiltakTekst={salgslokaleTiltakTekst}
                  totalInkludert={totalInkludert}
                  totalAmounts={totalAmounts}
                  totalKommentar={totalKommentar}
                  plannedInkludert={plannedInkludert}
                  plannedAmounts={plannedAmounts}
                  plannedKommentar={plannedKommentar}
                  overskridelseInkludert={overskridelseInkludert}
                  overskridelseRows={overskridelseRows}
                  overskridelseArealgrunnlag={overskridelseArealgrunnlag || (samletGulvareal > 0 ? samletGulvareal.toFixed(1) : "")}
                  overskridelseTiltak={overskridelseTiltak}
                  overskridelseVurderingstekst={overskridelseVurderingstekst}
                  overskridelseKonklusjon={overskridelseKonklusjon}
                  brannenergiInkludert={brannenergiInkludert}
                  brannenergiKommentar={brannenergiKommentar}
                  generellBrannenergiMJm2={generellBrannenergiMJm2}
                  byggBrannenergiInkludert={byggBrannenergiInkludert}
                  byggBrannenergiGrenseMJm2={byggBrannenergiGrenseMJm2}
                  byggBrannenergiGulvarealM2={byggBrannenergiGulvarealM2}
                  byggBrannenergiOmhyllingsflateM2={byggBrannenergiOmhyllingsflateM2}
                  byggBrannenergiKommentar={byggBrannenergiKommentar}
                  branntekniskeTiltakInkludert={branntekniskeTiltakInkludert}
                  branntekniskeTiltak={branntekniskeTiltak}
                  etasjer={etasjer}
                  innledning={innledning}
                  energitetthet={ENERGITETTHET}
                  innmeldingInkludert={innmeldingInkludert}
                  innmeldingKommentar={innmeldingKommentar}
                  innmeldingVurdering={innmeldingVurdering}
                  harTankanlegg={harTankanlegg}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brensellagring;
