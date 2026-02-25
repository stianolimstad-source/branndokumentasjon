import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, ArrowLeft, FileDown, Download, Save, LogIn, X, Plus, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType } from "docx";
import { saveAs } from "file-saver";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SendToKSDialog from "@/components/konsept/SendToKSDialog";
import UpdateKSButton from "@/components/konsept/UpdateKSButton";
import KonseptPreview from "@/components/konsept/KonseptPreview";
import { UploadConceptDialog } from "@/components/konsept/UploadConceptDialog";
import { buildChapter3Table } from "@/lib/word-export-chapter3";

// Mapping av bygningstype til risikoklasse basert på TEK17
const bygningsTypeRisikoklasseMap: Record<string, string> = {
  // Risikoklasse 1
  "Arbeidsbrakke": "RK1",
  "Båtnaust": "RK1",
  "Carport": "RK1",
  "Flyhangar": "RK1",
  "Fryselager": "RK1",
  "Garasje og parkeringshus med én etasje": "RK1",
  "Sagbruk": "RK1",
  "Skur": "RK1",
  "Trelastopplag": "RK1",
  // Risikoklasse 2
  "Brannstasjon uten døgnbemanning": "RK2",
  "Driftsbygning med husdyrrom": "RK2",
  "Industri": "RK2",
  "Kantine beregnet for egne ansatte til og med 150 personer": "RK2",
  "Kjemisk fabrikk og kjemikalielager": "RK2",
  "Kontor": "RK2",
  "Laboratorium": "RK2",
  "Lager": "RK2",
  "Parkeringshus og garasje med to eller flere etasjer eller plan": "RK2",
  "Parkeringskjeller og garasje under terreng": "RK2",
  "Sprengstoffindustri": "RK2",
  "Trafo eller fordelingsstasjon": "RK2",
  // Risikoklasse 3
  "Barnehage": "RK3",
  "Skole": "RK3",
  // Risikoklasse 4
  "Barnehjem": "RK4",
  "Bolig": "RK4",
  "Boligbrakke": "RK4",
  "Brannstasjon med døgnbemanning": "RK4",
  "Fritidsbolig, inkl. selvbetjente hytter, campinghytter og campingenheter": "RK4",
  "Internat": "RK4",
  "Studentbolig": "RK4",
  // Risikoklasse 5
  "Forsamlingslokale": "RK5",
  "Idrettshall": "RK5",
  "Kantine beregnet for utleie eller for mer enn 150 personer": "RK5",
  "Kinolokale": "RK5",
  "Kirke": "RK5",
  "Kongressenter": "RK5",
  "Messelokale": "RK5",
  "Museum": "RK5",
  "Salgslokale": "RK5",
  "Teaterlokale": "RK5",
  "Trafikkterminaler": "RK5",
  "Tribuneanlegg for mer enn 150 personer": "RK5",
  // Risikoklasse 6
  "Arrestlokaler og fengsel": "RK6",
  "Asylmottak og transittmottak": "RK6",
  "Bolig beregnet for personer med behov for heldøgns pleie og omsorg": "RK6",
  "Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger": "RK6",
  "Forlegning og leirskole": "RK6",
  "Overnattingssted og hotell": "RK6",
  "Pleieinstitusjon": "RK6",
  "Sykehus og sykehjem": "RK6",
  "Turisthytte og vandrerhjem": "RK6",
};

// Branncelle-typer basert på VTEK § 11-8 preaksepterte ytelser
const branncelleTyperListe = [
  { id: "romningsvei", label: "a. Rømningsvei, jf. også § 11-14" },
  { id: "trapperom", label: "b. Trapperom. Gjelder selv om trapperommet ikke er del av rømningsvei." },
  { id: "sykerom", label: "c. Hvert enkelt sykerom i sykehus og pleieinstitusjoner." },
  { id: "gjesterom", label: "d. Hvert enkelt gjesterom i overnattingsbygg." },
  { id: "forsamlingslokale", label: "e. Hvert enkelt forsamlingslokale." },
  { id: "salgslokale", label: "f. Hvert enkelt salgslokale. Når flere salgslokaler ligger med inngang fra et felles overdekket og innelukket torg, gårdsplass, korridor eller lignende, regnes de som ett salgslokale." },
  { id: "boenhet", label: "g. Boenhet. Hybelleilighet og lignende som innehar alle nødvendige funksjoner regnes som egen boenhet." },
  { id: "barnehage", label: "h. Barnehage som utgjør en avdeling." },
  { id: "undervisningsrom", label: "i. Hvert enkelt undervisningsrom med tilhørende birom." },
  { id: "kontorlandskap", label: "j. Kontorer eller kontorlandskap som utgjør en selvstendig bruksenhet." },
  { id: "storkjokken", label: "k. Storkjøkken." },
  { id: "garasje", label: "l. Garasje. Unntatt garasje med bruttoareal til og med 50 m² i enebolig (samme bruksenhet)." },
  { id: "garasje_forbinder", label: "m. Rom som forbinder garasje med andre rom. Unntak gjelder for garasje med bruttoareal til og med 50 m² i enebolig (samme bruksenhet)." },
  { id: "store_hulrom", label: "n. Store hulrom. Store hulrom må deles opp med branncellebegrensende konstruksjoner i areal på høyst 400 m². Dette gjelder for eksempel kalde, ubenyttede loftsrom og hulrom under oppforede tak og gulv. Branncelleoppdelingen må korrespondere med branncelleoppdelingen av bygget for øvrig." },
  { id: "hulrom_himling", label: "o. Hulrom over nedforet himling i rømningsvei hvor det er kabler som utgjør en brannenergi på mer enn 50 MJ per løpemeter hulrom eller korridor." },
  { id: "tekniske_rom", label: "p. Tekniske rom som betjener flere andre brannceller. Dette omfatter blant annet rom for ventilasjonsaggregat, avfallsrom, fyrrom for sentralvarmeanlegg og varmluftsovner fyrt med gass, flytende eller fast brensel. Unntak kan gjøres for ventilasjonsaggregat som er sikret på annen måte mot brannspredning. Sikring på annen måte kan utføres for eksempel ved at aggregatrommet er plassert over et yttertak som har brannmotstand minst som branncellebegrensende bygningsdel." },
  { id: "tavlerom", label: "q. Tavlerom som ligger i tilknytning til rømningsvei." },
  { id: "kulvert", label: "r. Kulvert som underjordisk transportgang, kabelkulvert og lignende." },
  { id: "heissjakt", label: "s. Heissjakter og tekniske installasjonssjakter. Unntak gjelder for heissjakt som ligger i trapperom. Heiser uten sjakt, for eksempel panoramaheiser med frittstående heismaskin, vil være del av den branncellen heisen er montert i. Heis med kabel og maskinromløs heis inngår i samme branncelle som heisjakten. Øvrige heismaskinrom må være egne brannceller." },
  { id: "husdyrrom", label: "t. Husdyrrom." },
];

// Funksjon for å beregne brannklasse basert på risikoklasse og antall etasjer
// Inkluderer preaksepterte ytelser/unntak fra VTEK § 11-3
const getBrannklasse = (risikoklasse: string, etasjer: string, harTerrengTilgang: string, areal: string): { brannklasse: string; brannklasseUnntak: string | null } => {
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);
  const arealNum = parseFloat(areal) || 0;
  
  if (isNaN(rk) || isNaN(floors) || rk < 1 || rk > 6 || floors < 1) {
    return { brannklasse: "", brannklasseUnntak: null };
  }

  // Preakseptert ytelse nr. 3: Boligbygning i risikoklasse 4 med tre etasjer, 
  // kan oppføres i brannklasse 1 når hver boenhet har utgang direkte til terreng,
  // uten å måtte rømme via trapp eller trapperom til terreng.
  if (rk === 4 && floors === 3 && harTerrengTilgang === "ja") {
    return { 
      brannklasse: "BKL1", 
      brannklasseUnntak: "Boligbygning i risikoklasse 4 med tre etasjer, kan oppføres i brannklasse 1 når hver boenhet har utgang direkte til terreng, uten å måtte rømme via trapp eller trapperom til terreng (jf. VTEK § 11-3, preakseptert ytelse nr. 3)."
    };
  }

  // Preakseptert ytelse nr. 4: Forsamlingslokale og salgslokale i risikoklasse 5 
  // med bruksareal under 800 m² i maksimalt 2 etasjer kan oppføres i brannklasse 1.
  // Unntaket vises kun ved 2 etasjer, da 1 etasje uansett gir BKL1.
  if (rk === 5 && floors === 2 && arealNum > 0 && arealNum < 800) {
    return { 
      brannklasse: "BKL1", 
      brannklasseUnntak: "Forsamlingslokale og salgslokale i risikoklasse 5 med bruksareal under 800 m² i maksimalt 2 etasjer kan oppføres i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 4)."
    };
  }

  // Preakseptert ytelse nr. 7: Boligbygning i risikoklasse 6 i to etasjer kan oppføres i brannklasse 1.
  if (rk === 6 && floors === 2) {
    return { 
      brannklasse: "BKL1", 
      brannklasseUnntak: "Boligbygning i risikoklasse 6 i to etasjer kan oppføres i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 7)."
    };
  }

  // Hovedtabell fra TEK17 § 11-3 Tabell 1: Brannklasse (BKL) for byggverk
  const brannklasseTabell: Record<number, Record<string, string>> = {
    1: { "1": "-", "2": "BKL1", "3-4": "BKL2", "5+": "BKL2" },
    2: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
    3: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
    4: { "1": "BKL1", "2": "BKL1", "3-4": "BKL2", "5+": "BKL3" },
    5: { "1": "BKL1", "2": "BKL2", "3-4": "BKL3", "5+": "BKL3" },
    6: { "1": "BKL1", "2": "BKL2", "3-4": "BKL2", "5+": "BKL3" },
  };

  let etasjeKey: string;
  if (floors === 1) {
    etasjeKey = "1";
  } else if (floors === 2) {
    etasjeKey = "2";
  } else if (floors >= 3 && floors <= 4) {
    etasjeKey = "3-4";
  } else {
    etasjeKey = "5+";
  }

  return { brannklasse: brannklasseTabell[rk]?.[etasjeKey] || "", brannklasseUnntak: null };
};

// Funksjon for å finne hvilke unntak som gjelder automatisk
const getRelevantUnntak = (risikoklasse: string, brannklasse: string, etasjer: string): string[] => {
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const bkl = parseInt(brannklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);
  
  const relevant: string[] = [];
  
  // Unntak 3: Byggverk i én etasje i risikoklasse 2, 3, og 5 kan ha R 15
  if (floors === 1 && [2, 3, 5].includes(rk)) {
    relevant.push("unntak3");
  }
  
  // Unntak 4: Byggverk i brannklasse 1 og risikoklasse 4 kan ha R 15
  if (bkl === 1 && rk === 4) {
    relevant.push("unntak4");
  }
  
  // Unntak 5: Byggverk i én etasje i risikoklasse 2 kan oppføres uten spesifisert brannmotstand
  if (floors === 1 && rk === 2) {
    relevant.push("unntak5");
  }
  
  return relevant;
};

// Grenser for brannseksjonering (VTEK § 11-7, tabell 1)
const seksjoneringsGrenser: Record<string, { normalt: number; brannalarm: number; sprinkler: number; roykventilasjon: number }> = {
  "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
  "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
  "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 },
};

// Sjekker om seksjonering er påkrevd
const isSeksjoneringRequired = (areal: string, brannenergi: string, tiltak: string): boolean => {
  const arealNum = parseFloat(areal) || 0;
  if (!brannenergi || arealNum <= 0) return false;
  const g = seksjoneringsGrenser[brannenergi];
  if (!g) return false;
  const maksAreal = g[tiltak as keyof typeof g] ?? g.normalt;
  if (maksAreal === 0) return true; // uegnet tiltak
  return arealNum > maksAreal && maksAreal !== Infinity;
};

// Preaksepterte ytelser for seksjoneringsveggen (VTEK § 11-7)
const seksjoneringPreaksepterteYtelser = [
  "Takkonstruksjonen må ikke være kontinuerlig over seksjoneringsveggen på en slik måte at en kollaps på den ene siden medfører reduksjon av konstruksjonens bæreevne og brannmotstand på den andre siden.",
  "Konstruksjoner som ligger inntil seksjoneringsveggen må kunne bevege seg fritt ved temperaturendringer, uten at veggens branntekniske egenskaper reduseres.",
  "Seksjoneringsveggens avslutning mot tak og fasade må være utformet og utført for å hindre brannspredning mellom ulike seksjoner. Størst sikkerhet mot brannspredning oppnås ved å føre seksjoneringsveggen over takflaten og utenfor vegglivet, det vil si tilsvarende som for brannvegger, jf. § 11-6.",
  "Der seksjoner ligger inntil hverandre i et innvendig hjørne, må det treffes særskilte tiltak for å hindre brannspredning, jf. figur 1a og 1b.",
  "Seksjoneringsveggen må ha brannmotstand minst som angitt i tabell 2.",
  "Seksjoneringsveggen må i sin helhet bestå av materialer som tilfredsstiller klasse A2-s1,d0 [ubrennbare] og må kunne motstå mekanisk påkjenning. Isolasjonsmateriale som ikke tilfredsstiller klasse A2-s1,d0 kan likevel benyttes når det er dokumentert ved prøvning at materialet ikke blir involvert i brannen i den forutsatte brannmotstandstiden.",
  "Dersom mekanisk motstandsevne (M) ikke er dokumentert ved prøvning, må seksjoneringsveggen utføres i tunge materialer som mur, betong eller lignende.",
  "Seksjoneringsveggen må føres minimum 0,5 meter over høyeste tilstøtende tak, med mindre taket har brannmotstand minst EI 60 A2-s1,d0 [A 60].",
  "Seksjoneringsveggen må være slik utført at den blir stående selv om byggverket på den ene eller andre siden raser sammen. Alternativt kan det bygges to uavhengige seksjoneringsvegger, eller byggverkets bæresystem kan dimensjoneres for brannmotstand tilsvarende en seksjoneringsvesgg.",
  "Seksjonering ved innvendig hjørne må utføres slik at, jf. figur 1: 1) seksjoneringsveggen føres minimum 8,0 meter fram og forbi hjørnet, eller 2) seksjoneringsveggen føres minimum 5,0 meter forbi innvendig hjørne i begge fasadene.",
];

// Funksjon for å generere bæreevne og stabilitet tekst basert på brannklasse, med unntak
const getBaereevneTekst = (brannklasse: string, risikoklasse: string, etasjer: string): { tekst: string; anvendteUnntak: string[] } => {
  const bkl = parseInt(brannklasse.replace(/\D/g, ''), 10);
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);
  
  if (isNaN(bkl) || bkl < 1 || bkl > 3) {
    return { tekst: "", anvendteUnntak: [] };
  }

  const anvendteUnntak: string[] = [];
  
  // Standard krav
  let krav = {
    1: {
      hovedsystem: "R 30 [B 30]",
      sekundaer: "R 30 [B 30]",
      trappeloep: "-",
      kjeller: "R 60 A2-s1,d0 [A 60]",
      utvendig: "-"
    },
    2: {
      hovedsystem: "R 60 [B 60]",
      sekundaer: "R 60 [B 60]",
      trappeloep: "R 30 [B 30]",
      kjeller: "R 90 A2-s1,d0 [A 90]",
      utvendig: "R 30 [B 30] eller A2-s1,d0 [ubrennbart]"
    },
    3: {
      hovedsystem: "R 90 A2-s1,d0 [A 90]",
      sekundaer: "R 60 A2-s1,d0 [A 60]",
      trappeloep: "R 30 A2-s1,d0 [A 30]",
      kjeller: "R 120 A2-s1,d0 [A 120]",
      utvendig: "A2-s1,d0 [ubrennbart]"
    }
  };

  let k = { ...krav[bkl as 1 | 2 | 3] };
  
  // Unntak 3: Byggverk i én etasje i risikoklasse 2, 3, og 5 kan ha R 15
  if (floors === 1 && [2, 3, 5].includes(rk)) {
    k.hovedsystem = "R 15";
    k.sekundaer = "R 15";
    anvendteUnntak.push("unntak3");
    
    // Unntak 5: For RK2 kan det også oppføres uten spesifisert brannmotstand (R 0) med A2-s1,d0
    if (rk === 2) {
      k.hovedsystem = "R 15 (alternativt uten spesifisert brannmotstand ved bruk av A2-s1,d0 materialer)";
      k.sekundaer = "R 15 (alternativt uten spesifisert brannmotstand ved bruk av A2-s1,d0 materialer)";
      anvendteUnntak.push("unntak5");
    }
  }
  
  // Unntak 4: Byggverk i brannklasse 1 og risikoklasse 4 kan ha R 15
  if (bkl === 1 && rk === 4) {
    k.hovedsystem = "R 15";
    k.sekundaer = "R 15";
    anvendteUnntak.push("unntak4");
  }

  const tekst = `Bærende hovedsystem: ${k.hovedsystem}
Sekundære, bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende: ${k.sekundaer}
Trappeløp: ${k.trappeloep}
Bærende bygningsdeler under øverste kjeller: ${k.kjeller}
Utvendig trappeløp, beskyttet mot flammepåvirkning og strålevarme: ${k.utvendig}`;
  
  return { tekst, anvendteUnntak };
};

// Unntak-tekster for visning i preview/eksport
const baereevneUnntakTekster: Record<string, string> = {
  unntak1: "Brannmotstand til bærende bygningsdeler i byggverk må være i samsvar med tabell 1 med unntak som angitt i nr. 2 til 7.",
  unntak2: "Branncellebegrensende konstruksjoner må understøttes av bærende konstruksjoner med tilsvarende eller høyere brannmotstand.",
  unntak3: "Byggverk i én etasje i risikoklasse 2, 3, og 5 kan ha hoved- og sekundærbæresystem med brannmotstand R 15.",
  unntak4: "Byggverk i brannklasse 1 og risikoklasse 4 kan ha hoved- og sekundærbæresystem med brannmotstand R 15.",
  unntak5: "Byggverk i én etasje i risikoklasse 2 kan oppføres uten spesifisert brannmotstand når bærekonstruksjonen tilfredsstiller klasse A2-s1,d0 [ubrennbart materiale].",
  unntak6: "I byggverk uten loft eller med loft som bare kan benyttes som lager, kan takkonstruksjon oppføres uten spesifisert brannmotstand, forutsatt at denne ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen.",
  unntak7: "Under forutsetning av at nødvendig tid til rømning og sikkerhet for slokkemannskaper er ivaretatt, kan parkeringshus med mer enn 1/3 av veggflatene åpne, oppføres med brannmotstand R 15 A2-s1,d0 [ubrennbart materiale].",
};
// Automatisk tiltaksklasse basert på SAK10 §9-4
// Tiltaksklasse 1: BKL1 + RK1/2/4, preakseptert
// Tiltaksklasse 2: BKL1 + RK3/5/6 ELLER BKL2 + RK1/2/4, preakseptert
// Tiltaksklasse 3: Alt annet (BKL2 + RK3/5/6, BKL3, eller analyse/blanding)
const getTiltaksklasse = (brannklasse: string, risikoklasse: string, prosjekteringsmetode: string): string => {
  const bkl = parseInt(brannklasse.replace(/\D/g, ''), 10);
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  if (isNaN(bkl) || isNaN(rk)) return "";

  // Ingen metode eller preakseptert = standard
  const metode = prosjekteringsmetode || "preakseptert";
  if (metode !== "preakseptert") {
    return "Tiltaksklasse 3";
  }

  // Tiltaksklasse 1: BKL1 + RK 1, 2, 4
  if (bkl === 1 && (rk === 1 || rk === 2 || rk === 4)) {
    return "Tiltaksklasse 1";
  }

  // Tiltaksklasse 2: BKL1 + RK 3, 5, 6 ELLER BKL2 + RK 1, 2, 4
  if ((bkl === 1 && (rk === 3 || rk === 5 || rk === 6)) || 
      (bkl === 2 && (rk === 1 || rk === 2 || rk === 4))) {
    return "Tiltaksklasse 2";
  }

  // Alt annet = Tiltaksklasse 3
  return "Tiltaksklasse 3";
    };


const Konsept = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isViewMode = searchParams.get('view') === 'true';
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedConcept, setGeneratedConcept] = useState<string | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get('project')
  );
  const [conceptId, setConceptId] = useState<string | null>(
    searchParams.get('concept')
  );
  const [conceptName, setConceptName] = useState("");

  // Create project dialog state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(searchParams.get("new") === "true");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", description: "", address: "" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [authorInfo, setAuthorInfo] = useState<{ name: string; company: string } | null>(null);

  // Fetch user logo and profile info
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("logo_url, full_name, company").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          setLogoUrl((data as any).logo_url || null);
          setAuthorInfo({
            name: (data as any).full_name || "",
            company: (data as any).company || "",
          });
        }
      });
    }
  }, [user]);

  const handleCreateProject = async () => {
    if (!newProjectData.name.trim()) {
      toast({ title: "Mangler navn", description: "Vennligst skriv inn et prosjektnavn", variant: "destructive" });
      return;
    }
    if (!conceptName.trim()) {
      toast({ title: "Mangler konseptnavn", description: "Vennligst skriv inn et navn for brannkonseptet", variant: "destructive" });
      return;
    }
    setIsCreatingProject(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProjectData.name,
        description: newProjectData.description || null,
        address: newProjectData.address || null,
        user_id: user!.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Feil", description: "Kunne ikke opprette prosjekt", variant: "destructive" });
    } else if (data) {
      toast({ title: "Prosjekt opprettet", description: `"${newProjectData.name}" er nå opprettet` });
      setSelectedProjectId(data.id);
      setNewProjectData({ name: "", description: "", address: "" });
      setIsCreateProjectOpen(false);
      searchParams.delete("new");
      setSearchParams({ project: data.id }, { replace: true });
    }
    setIsCreatingProject(false);
  };

  // Type for bygningsdeler med egen risikoklasse
  type Bygningsdel = {
    id: string;
    navn: string;
    bygningstype: string;
    risikoklasse: string;
    brannklasse: string;
    brannklasseUnntak: string;
    harTerrengTilgang: string;
    areal: string;
    etasjer: string;
  };

  const [formData, setFormData] = useState({
    // Sammendrag
    sammendrag: "",
    // 1. Innledning
    oppdragsgiver: "",
    prosjektnavn: "",
    adresse: "",
    gnr: "",
    bnr: "",
    kommune: "",
    tiltakstype: "",
    tiltaksbeskrivelse: "",
    saerskiltBrannobjekt: "",
    bygningstype: "",
    areal: "",
    etasjer: "",
    // SAK10 felter
    tiltakshaver: "",
    ansvarligSoker: "",
    kunde: "",
    proRibr: "",
    kprRibr: "",
    tiltaksklasse: "",
    tiltaksklasseBegrunnelse: "",
    avgrensning: "",
    // 2. Grunnlag og forutsetninger
    grunnlagsdokumenter: [] as Array<{navn: string, utarbeidetAv: string, dato: string}>,
    harFlereRisikoklasser: false, // Nytt felt for å aktivere flere risikoklasser
    bekreftetUliktEtasjeantall: false, // Bekreftelse på at ulikt etasjeantall er korrekt
    bygningsdeler: [] as Bygningsdel[], // Array med bygningsdeler med egne risikoklasser
    risikoklasse: "",
    brannklasse: "",
    brannklasseBegrunnelse: "", // Begrunnelse hvis manuelt overstyrt
    brannklasseUnntak: "", // Automatisk unntak-tekst for brannklasse
    harTerrengTilgang: "", // "ja" eller "nei" - for unntak RK4
    baeresystem: "",
    tilleggskrav: "",
    // 3. Branntekniske ytelseskrav
    baereevne: "",
    baereevneUnntak: [] as string[],
    baereevneKommentar: "",
    balkongRelevant: false,
    eksplosjonRelevant: "", // "relevant" eller "ikke_relevant"
    eksplosjonBeskrivelse: "", // Beskrivelse av rom og type eksplosjonsfare
    eksplosjon: "",
    bygningshoyde: "", // Høyde på bygget i meter
    avstandNabobygg: "", // Avstand til nabobygg i meter
    spesifikkBrannenergi: "", // For brannvegg: "inntil400", "400-600", "600-800"
    brannspredning: "",
    brannspredningKommentar: "",
    brannseksjonBrannenergi: "", // "over400", "50-400", "under50" - brukes for arealgrenser (VTEK tabell 1)
    seksjoneringsvegBrannenergi: "", // "under400", "400-600", "600-800" - brukes for brannmotstand (VTEK tabell 2)
    brannseksjonTiltak: "", // "normalt", "brannalarm", "sprinkler", "roykventilasjon"
    innvendigHjorne: "nei" as "ja" | "nei",
    innvendigHjorneAlternativ: "alt1" as "alt1" | "alt2", // alt1 = 8m, alt2 = 5m+5m
    brannseksjoner: "",
    brannseksjonerKommentar: "",
    brannceller: "",
    branncellerKommentar: "",
    fyrromRelevant: "nei" as "ja" | "nei",
    fyrromKw: "" as "" | "fast" | "under50" | "50-100" | "over100" | "ukjent",
    heismaskinromRelevant: "ja" as "ja" | "nei",
    branncelleTyper: [] as string[],
    dorPlasseringer: [] as string[],
    materialer: "",
    materialerKommentar: "",
    isolasjonSandwich: "ikke_relevant" as "relevant" | "ikke_relevant",
    isolasjonBrennbar: "ikke_relevant" as "relevant" | "ikke_relevant",
    installasjoner: "",
    installasjonerKommentar: "",
    // Ventilasjonsanlegg
    ventilasjonRelevant: true, // Hovedbryter for om ventilasjon er relevant
    ventKrav5: false, // Storkjøkken EI 30
    ventKrav6: true, // Kjøkken boenheter EI 15
    ventKrav7: false, // Småhus avtrekk
    ventKrav8: false, // Småhus kanal klasse E
    ventKrav9: true, // Brannspjeld seksjoneringsvegg
    // Vann- og avløpsrør
    vannAvlopRelevant: true, // Hovedbryter for om vann- og avløpsrør er relevant
    // Rør- og kanalisolasjon
    rorIsolasjonRelevant: true, // Hovedbryter for om rør- og kanalisolasjon er relevant
    // Elektriske installasjoner
    elektriskRelevant: true, // Hovedbryter for om elektriske installasjoner er relevant
    romningSikkerhet: "",
    romningSikkerhetKommentar: "",
    // 3.9 §11-12 Tilrettelegging for rømning og redning
    tilretteleggingLedd1a: false, // RK4 heis - automatisk brannslokkeanlegg
    tilretteleggingLedd1b: false, // RK6 - automatisk brannslokkeanlegg
    tilretteleggingLedd1c: false, // Generelt automatisk brannslokkeanlegg (andre tilfeller)
    rk6Institusjon: true as boolean, // true = institusjon, false = egeneide boenheter
    tilretteleggingLedd2a: false, // RK2-6 brannalarmanlegg
    // Brannalarm sub-checkboxer
    brannalarmBoligbygg: false, // Boligbygg med leiligheter
    brannalarmParkering: false, // Parkeringskjeller > 1200 m²
    brannalarmPublikum: false, // Ment for publikum
    brannalarmUniversell: false, // Universelt utformet
    brannalarmTalevarsling: false, // Branncelle over flere plan > 1000 personer
    brannalarmTakterrasse: false, // Takterrasse
    tilretteleggingLedd2b: false, // Få personer røykvarslere
    tilretteleggingLedd3: false, // Ledesystem
    tilretteleggingLedd4: false, // Evakueringsplaner
    tilretteleggingLedd5: false, // Merking av branntekniske installasjoner
    tilretteleggingKommentar: "",
    romningTiltak: "",
    romningTiltakKommentar: "",
    utgangBranncelle: "",
    utgangBranncelleKommentar: "",
    boenhetKunEttTrapperom: false,
    branncelleFlereEtasjer: false,
    lavtByggverkVinduerRomning: false,
    branncelleStortAntallPersoner: false,
    stortAntallUnder600: false,
    stortAntallOver600: false,
    stortAntallUnder150: false,
    stortAntallFlereEtasjer: false,
    persontallAreal: "",
    persontallKategori: "",
    dorerTilbakerømning: false,
    dorerNattlaser: false,
    dorerLiteAntallPersoner: false,
    dorerStromforsyningBKL1: false,
    dorerStromforsyningBKL2: false,
    dorerStromforsyningBKL3: false,
    romningsvinduRelevant: false, // Rømning via vindu er relevant
    romningsvinduHoyde: "", // Høyde på vindu over terreng i meter
    romningsvinduGulvAvstand: "", // Avstand fra gulv til underkant vindu i meter
    romningsvinduHarStige: false, // Stige montert til vindu
    romningsvinduHarBalkong: false, // Utgang til balkong
    // 3.11 Rømningsvei
    romningsveiRomMaks20: false, // Rom i rømningsvei maks 20 m²
    romningsveiRom50E30: false, // Oppholdsrom inntil 50 m² med E30
    romningsveiSengeliggende: false, // Transport av sengeliggende
    romningsveiSamtidigRomning: false, // Samtidig rømning fra flere etasjer
    romningsveiFlereTrapper: false, // Rømning mot flere trapperom
    romningsveiKorridorOver30m: false, // Korridor over 30 meter
    romningsveiSvalgang: false, // Svalgang relevant
    romningsveiSvalgangOver30m: false, // Svalgang over 30 meter
    romningsvei: "",
    romningsveiKommentar: "",
    // 3.12 §11-15 Tilrettelegging for redning av husdyr
    husdyrRedningRelevant: false,
    husdyrRedningKommentar: "",
    manuellSlokking: "",
    manuellSlokkingKommentar: "",
    // Brannslokkeutstyr valg
    slokkeBrannslange: false,
    slokkeHandslukker: false,
    redningsmannskap: "",
    redningsmannskapKommentar: "",
    byggOver23m: false, // Bygget er over 23 meter
    slangeutlegg50m: false, // Alle deler av etasje nås med 50m slangeutlegg
    eksplosjonKommentar: "",
    // 4. Utførelses- og driftsfasen
    utfoerelse: "",
    drift: "",
    // 5. Revisjonshistorikk
    revisjon: "",
    // 6. Litteraturhenvisninger
    litteratur: "",
    // Prosjekteringsmetode
    prosjekteringsmetode: "preakseptert" as "preakseptert" | "analyse" | "blanding",
    fravikBeskrivelse: "",
    // Fravik
    fravik: "",
  });

  // Load existing concept if conceptId is provided
  useEffect(() => {
    if (conceptId && user) {
      loadConcept(conceptId);
    }
  }, [conceptId, user]);

  // Automatisk beregning av brannklasse
  const beregnetBrannklasseResult = getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal);

  // Automatisk beregning av brannklasse – skip i view-modus (data er allerede lagret)
  useEffect(() => {
    if (isViewMode) return;
    if (beregnetBrannklasseResult.brannklasse) {
      setFormData(prev => ({
        ...prev, 
        brannklasse: beregnetBrannklasseResult.brannklasse,
        brannklasseUnntak: beregnetBrannklasseResult.brannklasseUnntak || "",
        brannklasseBegrunnelse: "",
      }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal]);

  // Automatisk generering av bæreevne tekst – skip i view-modus
  useEffect(() => {
    if (isViewMode) return;
    const result = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer);
    if (result.tekst) {
      setFormData(prev => ({ 
        ...prev, 
        baereevne: result.tekst,
        baereevneUnntak: result.anvendteUnntak
      }));
    }
  }, [formData.brannklasse, formData.risikoklasse, formData.etasjer]);


  // Beregn automatisk tiltaksklasse for visning
  const autoTiltaksklasse = (() => {
    const effBkl = beregnetBrannklasseResult.brannklasse || formData.brannklasse;
    return getTiltaksklasse(effBkl, formData.risikoklasse, formData.prosjekteringsmetode);
  })();

  // Automatisk tiltaksklasse – skip i view-modus, kun sett hvis bruker ikke har endret
  useEffect(() => {
    if (isViewMode) return;
    const nyTiltaksklasse = autoTiltaksklasse;
    if (nyTiltaksklasse && !formData.tiltaksklasse) {
      setFormData(prev => ({ ...prev, tiltaksklasse: nyTiltaksklasse }));
    }
  }, [formData.brannklasse, formData.risikoklasse, formData.prosjekteringsmetode, beregnetBrannklasseResult.brannklasse]);

  const erBrannklasseOverstyrt = beregnetBrannklasseResult.brannklasse && formData.brannklasse !== beregnetBrannklasseResult.brannklasse;

  const loadConcept = async (id: string) => {
    const { data, error } = await supabase
      .from('fire_concepts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke laste brannkonsept",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setConceptName(data.name);
      setSelectedProjectId(data.project_id);
      if (data.content && typeof data.content === 'object') {
        const loadedContent = data.content as typeof formData;
        // Konverter gammel streng-format til ny array-format for grunnlagsdokumenter
        const legacyDocs = (loadedContent as any).grunnlagsdokumenter;
        if (!Array.isArray(legacyDocs)) {
          loadedContent.grunnlagsdokumenter = typeof legacyDocs === "string" && legacyDocs.trim()
            ? legacyDocs
                .split(/\r?\n/)
                .map((l: string) => l.trim())
                .filter(Boolean)
                .map((navn: string) => ({ navn, utarbeidetAv: "", dato: "" }))
            : [];
        } else {
          // Ensure existing array items have utarbeidetAv field
          loadedContent.grunnlagsdokumenter = legacyDocs.map((doc: any) => ({
            navn: doc.navn || "",
            utarbeidetAv: doc.utarbeidetAv || "",
            dato: doc.dato || "",
          }));
        }
        setFormData({ ...formData, ...loadedContent });
      }
      setGeneratedConcept("loaded");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Ikke innlogget",
        description: "Du må logge inn for å lagre brannkonsepter",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: "Velg prosjekt",
        description: "Du må velge et prosjekt å lagre under",
        variant: "destructive",
      });
      return;
    }

    if (!conceptName.trim()) {
      toast({
        title: "Mangler navn",
        description: "Vennligst skriv inn et navn for brannkonseptet",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    if (conceptId) {
      // Update existing concept
      const { error } = await supabase
        .from('fire_concepts')
        .update({
          name: conceptName,
          content: formData,
          status: generatedConcept ? 'draft' : 'draft',
        })
        .eq('id', conceptId);

      if (error) {
        toast({
          title: "Feil",
          description: "Kunne ikke oppdatere brannkonseptet",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lagret",
          description: "Brannkonseptet er oppdatert",
        });
      }
    } else {
      // Create new concept
      const { data, error } = await supabase
        .from('fire_concepts')
        .insert({
          project_id: selectedProjectId,
          user_id: user.id,
          name: conceptName,
          content: formData,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Feil",
          description: "Kunne ikke lagre brannkonseptet",
          variant: "destructive",
        });
      } else if (data) {
        setConceptId(data.id);
        toast({
          title: "Lagret",
          description: "Brannkonseptet er lagret",
        });
        // Update URL with concept id
        navigate(`/konsept?project=${selectedProjectId}&concept=${data.id}`, { replace: true });
      }
    }

    setIsSaving(false);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Simulate generation
    setTimeout(() => {
      setGeneratedConcept("generated");
      setIsGenerating(false);
      toast({
        title: "Brannkonsept generert",
        description: "Dokumentet er klart for eksport",
      });
    }, 1500);
  };

  const renderPreview = () => <KonseptPreview formData={formData} logoUrl={logoUrl} authorInfo={authorInfo} />;

  const exportToWord = async () => {
    const tableBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    };

    const createTableCell = (text: string, bold: boolean = false, width?: number) => {
      return new TableCell({
        borders: tableBorders,
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text, bold, size: 20 })],
          }),
        ],
      });
    };

    const createTableCellShaded = (text: string, bold: boolean = false, width?: number) => {
      return new TableCell({
        borders: tableBorders,
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text, bold, size: 20 })],
          }),
        ],
      });
    };

    // Fetch logo for header
    let logoBuffer: ArrayBuffer | null = null;
    let logoDimensions = { width: 300, height: 150 };
    if (logoUrl) {
      try {
        const res = await fetch(logoUrl);
        if (res.ok) {
          logoBuffer = await res.arrayBuffer();
          // Get natural dimensions to preserve aspect ratio
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const maxWidth = 400;
              const ratio = img.naturalWidth / img.naturalHeight;
              const w = Math.min(img.naturalWidth, maxWidth);
              logoDimensions = { width: w, height: Math.round(w / ratio) };
              resolve();
            };
            img.onerror = () => resolve();
            img.src = logoUrl;
          });
        }
      } catch {}
    }

    // Build cover page elements
    const coverPageChildren: Paragraph[] = [];
    
    if (logoBuffer) {
      coverPageChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: logoBuffer, transformation: logoDimensions, type: "png" })],
        spacing: { before: 800, after: 400 },
      }));
    }

    coverPageChildren.push(new Paragraph({
      text: "BRANNKONSEPT",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: logoBuffer ? 200 : 1200, after: 200 },
    }));

    if (formData.prosjektnavn) {
      coverPageChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: formData.prosjektnavn, size: 28, color: "555555" })],
        spacing: { after: 100 },
      }));
    }
    if (formData.adresse) {
      coverPageChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: formData.adresse, size: 24, color: "777777" })],
        spacing: { after: 400 },
      }));
    }

    if (authorInfo && (authorInfo.name || authorInfo.company)) {
      coverPageChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Utarbeidet av", bold: true, size: 22 })],
        spacing: { before: 400, after: 100 },
      }));
      if (authorInfo.name) {
        coverPageChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: authorInfo.name, size: 22 })],
          spacing: { after: 50 },
        }));
      }
      if (authorInfo.company) {
        coverPageChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: authorInfo.company, size: 22 })],
          spacing: { after: 200 },
        }));
      }
    }

    const dateStr = new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" });
    coverPageChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: dateStr, size: 20, color: "999999" })],
      spacing: { before: 200 },
    }));

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Verdana", size: 20 },
          },
        },
      },
      sections: [
        {
          properties: {},
          children: coverPageChildren,
        },
        // Sammendrag (egen side)
        ...(formData.sammendrag ? [{
          properties: {},
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Sammendrag" })] }),
            new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: formData.sammendrag, size: 22 })] }),
          ],
        }] : []),
        // Innholdsfortegnelse (egen side)
        {
          properties: {},
          children: [
            new Paragraph({
              text: "BRANNKONSEPT",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Innholdsfortegnelse
            new Paragraph({
              children: [new TextRun({ text: "Innholdsfortegnelse", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({ children: [new TextRun({ text: "1. Innledning", bold: true, size: 22 })], spacing: { after: 50 } }),
            new Paragraph({ text: "    1.1 Informasjon om tiltaket", spacing: { after: 30 } }),
            new Paragraph({ text: "    1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)", spacing: { after: 30 } }),
            new Paragraph({ text: "    1.3 Prosjekteringsmetode", spacing: { after: 30 } }),
            new Paragraph({ text: "    1.4 Avgrensning av tiltak", spacing: { after: 30 } }),
            new Paragraph({ text: "    1.5 Gjeldende regelverk", spacing: { after: 50 } }),
            new Paragraph({ children: [new TextRun({ text: "2. Grunnlag og forutsetninger for brannteknisk prosjektering", bold: true, size: 22 })], spacing: { after: 50 } }),
            new Paragraph({ text: "    2.1 Grunnlagsdokumenter", spacing: { after: 30 } }),
            new Paragraph({ text: "    2.2 Beskrivelse av bygning og branntekniske forutsetninger", spacing: { after: 30 } }),
            new Paragraph({ text: "    2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker", spacing: { after: 50 } }),
            new Paragraph({ children: [new TextRun({ text: "3. Beskrivelse av branntekniske ytelseskrav", bold: true, size: 22 })], spacing: { after: 50 } }),
            new Paragraph({ text: "    3.1 § 11-4 Bæreevne og stabilitet", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.2 § 11-5 Sikkerhet ved eksplosjon", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.3 § 11-6 Tiltak mot brannspredning mellom byggverk", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.4 § 11-7 Brannseksjoner", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.5 § 11-8 Brannceller", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.6 § 11-9 Materialer og produkters egenskaper ved brann", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.7 § 11-10 Tekniske installasjoner", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.8 § 11-11 Generelle krav om rømning og redning", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.10 § 11-13 Utgang fra branncelle", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.11 § 11-14 Rømningsvei", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.12 § 11-15 Tilrettelegging for redning av husdyr", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.13 § 11-16 Tilrettelegging for manuell slokking", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.14 § 11-17 Tilrettelegging for rednings- og slokkemannskap", spacing: { after: 50 } }),
            new Paragraph({ children: [new TextRun({ text: "4. Utførelses- og driftsfasen", bold: true, size: 22 })], spacing: { after: 50 } }),
            new Paragraph({ text: "    4.1 Utførelsesfasen", spacing: { after: 30 } }),
            new Paragraph({ text: "    4.2 Driftsfasen", spacing: { after: 50 } }),
            new Paragraph({ children: [new TextRun({ text: "5. Revisjonshistorikk", bold: true, size: 22 })], spacing: { after: 50 } }),
            new Paragraph({ children: [new TextRun({ text: "6. Litteraturhenvisninger", bold: true, size: 22 })], spacing: { after: 200 } }),
          ],
        },
        {
          properties: {},
          children: [
            // 1. Innledning
            new Paragraph({
              children: [new TextRun({ text: "1. Innledning", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.1 Informasjon om tiltaket", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            // Tabell 1.1 - matching preview
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [createTableCell("Oppdragsgiver", true, 33), createTableCell(formData.oppdragsgiver || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Prosjektnavn", true, 33), createTableCell(formData.prosjektnavn || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Adresse", true, 33), createTableCell(formData.adresse || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Gnr/Bnr", true, 33), createTableCell(formData.gnr || formData.bnr ? `${formData.gnr || "—"}/${formData.bnr || "—"}` : "[Angis]")] }),
                new TableRow({ children: [createTableCell("Kommune", true, 33), createTableCell(formData.kommune || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Type tiltak", true, 33), createTableCell(formData.tiltakstype || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Beskrivelse av tiltaket", true, 33), createTableCell(formData.tiltaksbeskrivelse || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Særskilt brannobjekt", true, 33), createTableCell(formData.saerskiltBrannobjekt || "[Angis]")] }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [createTableCell("Tiltakshaver", true, 33), createTableCell(formData.tiltakshaver || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Ansvarlig søker (SØK)", true, 33), createTableCell(formData.ansvarligSoker || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Kunde", true, 33), createTableCell(formData.kunde || "[Angis]")] }),
                new TableRow({ children: [createTableCell("PRO RiBr", true, 33), createTableCell(formData.proRibr || "[Angis]")] }),
                new TableRow({ children: [createTableCell("KPR RiBr", true, 33), createTableCell(formData.kprRibr || "[Angis]")] }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.3 Prosjekteringsmetode", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.prosjekteringsmetode === "preakseptert" 
                ? "Prosjekteringen er basert på preaksepterte ytelser i henhold til VTEK17."
                : formData.prosjekteringsmetode === "analyse"
                ? "Prosjekteringen er basert på analyse (fraviksprosjektering)."
                : "Prosjekteringen er basert på en blandingsløsning med preaksepterte ytelser og analyse.",
              spacing: { after: 100 },
            }),
            ...((formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") ? [
              new Paragraph({
                children: [new TextRun({ text: "Beskrivelse av fravik:", bold: true, size: 20 })],
                spacing: { after: 50 },
              }),
              new Paragraph({
                text: formData.fravikBeskrivelse || "[Fraviksbeskrivelse angis]",
                spacing: { after: 100 },
              }),
              ...(formData.tiltaksklasse === "Tiltaksklasse 1" ? [
                new Paragraph({
                  children: [new TextRun({ text: "Merk: Prosjektet er i tiltaksklasse 1. Fravik fra preaksepterte ytelser krever normalt høyere tiltaksklasse.", bold: true, italics: true, size: 20 })],
                  spacing: { after: 100 },
                }),
              ] : []),
            ] : []),
            new Paragraph({
              children: [new TextRun({ text: "1.4 Avgrensning av tiltak", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.avgrensning || "[Avgrensning beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.5 Gjeldende regelverk", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "• TEK17 - Forskrift om tekniske krav til byggverk",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• VTEK17 - Veiledning til teknisk forskrift",
              spacing: { after: 100 },
            }),
          ],
        },
        {
          properties: {},
          children: [
            // 2. Grunnlag og forutsetninger
            new Paragraph({
              children: [new TextRun({ text: "2. Grunnlag og forutsetninger for brannteknisk prosjektering", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2.1 Grunnlagsdokumenter", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            ...(Array.isArray(formData.grunnlagsdokumenter) && formData.grunnlagsdokumenter.length > 0 ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCellShaded("Dokument", true, 40),
                      createTableCellShaded("Utarbeidet av / firma", true, 40),
                      createTableCellShaded("Datert", true, 20),
                    ],
                  }),
                  ...formData.grunnlagsdokumenter.map((doc) =>
                    new TableRow({
                      children: [
                        createTableCell(doc.navn || "-", false, 40),
                        createTableCell(doc.utarbeidetAv || "-", false, 40),
                        createTableCell(doc.dato ? doc.dato.split('-').reverse().join('.') : "-", false, 20),
                      ],
                    })
                  ),
                ],
              }),
            ] : [
              new Paragraph({
                text: "[Liste over tegninger og dokumenter]",
                spacing: { after: 100 },
              }),
            ]),
            new Paragraph({
              children: [new TextRun({ text: "2.2 Beskrivelse av bygning og branntekniske forutsetninger", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            // Bygnings- og klassifiseringstabell
            ...(formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0 ? [
              // Første tabell: Bygningstype, Areal, Etasjer
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [createTableCell("Bygningstype", true, 33), createTableCell(formData.bygningstype || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Bruttoareal", true, 33), createTableCell(`${formData.areal || "[Angis]"} m²`)] }),
                  new TableRow({ children: [createTableCell("Antall etasjer", true, 33), createTableCell(formData.etasjer || "[Angis]")] }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: "Bygget inneholder flere bygningsdeler med ulike risikoklasser:", italics: true, size: 20 })],
                spacing: { before: 100, after: 100 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCell("Bygningsdel", true, 20),
                      createTableCell("Bygningstype", true, 25),
                      createTableCell("Areal", true, 12),
                      createTableCell("Etasjer", true, 10),
                      createTableCell("Risikoklasse", true, 15),
                      createTableCell("Brannklasse", true, 18),
                    ],
                  }),
                  ...formData.bygningsdeler.map((del, index) => {
                    const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                    return new TableRow({
                      children: [
                        createTableCell(del.navn || `Del ${index + 1}`, false, 20),
                        createTableCell(del.bygningstype || "-", false, 25),
                        createTableCell(del.areal ? `${del.areal} m²` : "-", false, 12),
                        createTableCell(del.etasjer || "-", false, 10),
                        createTableCell(del.risikoklasse || "-", false, 15),
                        createTableCell(delBrannklasse || "-", false, 18),
                      ],
                    });
                  }),
                ],
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCell("Tiltaksklasse", true, 33),
                      new TableCell({
                        borders: tableBorders,
                        width: { size: 67, type: WidthType.PERCENTAGE },
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [
                          new Paragraph({
                            spacing: { before: 40, after: formData.tiltaksklasseBegrunnelse ? 40 : 40 },
                            children: [new TextRun({ text: formData.tiltaksklasse || "[Angis]", size: 20 })],
                          }),
                          ...(formData.tiltaksklasseBegrunnelse ? [
                            new Paragraph({
                              spacing: { before: 0, after: 40 },
                              children: [new TextRun({ text: `Begrunnelse: ${formData.tiltaksklasseBegrunnelse}`, italics: true, size: 20 })],
                            }),
                          ] : []),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ] : [
              // Én samlet tabell for bygningsinfo + klassifisering
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [createTableCell("Bygningstype", true, 33), createTableCell(formData.bygningstype || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Bruttoareal", true, 33), createTableCell(`${formData.areal || "[Angis]"} m²`)] }),
                  new TableRow({ children: [createTableCell("Antall etasjer", true, 33), createTableCell(formData.etasjer || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Risikoklasse", true, 33), createTableCell(formData.risikoklasse || "[Angis]")] }),
                  new TableRow({
                    children: [
                      createTableCell("Brannklasse", true, 33),
                      createTableCell(
                        (formData.brannklasse || "[Angis]") +
                        (formData.brannklasseUnntak && !formData.brannklasseUnntak.includes("preakseptert ytelse nr. 4") ? `\n\n${formData.brannklasseUnntak}` : "")
                      ),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Tiltaksklasse", true, 33),
                      new TableCell({
                        borders: tableBorders,
                        width: { size: 67, type: WidthType.PERCENTAGE },
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [
                          new Paragraph({
                            spacing: { before: 40, after: formData.tiltaksklasseBegrunnelse ? 40 : 40 },
                            children: [new TextRun({ text: formData.tiltaksklasse || "[Angis]", size: 20 })],
                          }),
                          ...(formData.tiltaksklasseBegrunnelse ? [
                            new Paragraph({
                              spacing: { before: 0, after: 40 },
                              children: [new TextRun({ text: `Begrunnelse: ${formData.tiltaksklasseBegrunnelse}`, italics: true, size: 20 })],
                            }),
                          ] : []),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ]),
            new Paragraph({
              children: [new TextRun({ text: "2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.tilleggskrav || "[Eventuelle tilleggskrav beskrives]",
              spacing: { after: 100 },
            }),
          ],
        },
        {
          properties: {},
          children: [
            // 3. Branntekniske ytelseskrav
            new Paragraph({
              children: [new TextRun({ text: "3. Beskrivelse av branntekniske ytelseskrav", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            // Tabell 3 - 3-column structure matching preview
            buildChapter3Table(formData),

            // 4. Utførelses- og driftsfasen
            new Paragraph({
              children: [new TextRun({ text: "4. Utførelses- og driftsfasen", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4.1 Utførelsesfasen", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.utfoerelse || "[Krav til utførelse beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4.2 Driftsfasen", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.drift || "[Krav til drift og vedlikehold beskrives]",
              spacing: { after: 100 },
            }),

            // 5. Revisjonshistorikk
            new Paragraph({
              children: [new TextRun({ text: "5. Revisjonshistorikk", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: formData.revisjon || "[Revisjonslogg]",
              spacing: { after: 100 },
            }),

            // 6. Litteraturhenvisninger
            new Paragraph({
              children: [new TextRun({ text: "6. Litteraturhenvisninger", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "• TEK17 - Forskrift om tekniske krav til byggverk",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• VTEK17 - Veiledning til teknisk forskrift",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• NS 3901 - Krav til risikovurdering av brann i byggverk",
              spacing: { after: 100 },
            }),

            // Fravik (if any)
            ...(formData.fravik ? [
              new Paragraph({
                children: [new TextRun({ text: "Fravik og kompenserende tiltak", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                text: formData.fravik,
                spacing: { after: 200 },
              }),
            ] : []),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "brannkonsept.docx");
    
    toast({
      title: "Dokument lastet ned",
      description: "Brannkonseptet er eksportert som Word-fil",
    });
  };

  // In view mode, show nothing until auth + data are fully ready (prevents flash of editor UI in iframes)
  if (isViewMode) {
    if (authLoading || !conceptName) {
      return null; // blank until ready – the parent (KSGjennomgang) shows its own loading spinner
    }
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="shadow-medium">
            <CardContent className="p-0">
              <div className="p-6">
                {renderPreview()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-medium">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LogIn className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl mb-2">Logg inn for å fortsette</CardTitle>
              <CardDescription className="text-center mb-6">
                Du må være innlogget for å opprette og lagre brannkonsepter.
              </CardDescription>
              <Link to="/auth">
                <Button>
                  <LogIn className="h-4 w-4 mr-2" />
                  Logg inn
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">

      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto">
          {/* Create Project Dialog - triggered by ?new=true */}
          <Dialog open={isCreateProjectOpen} onOpenChange={(open) => {
            setIsCreateProjectOpen(open);
            if (!open && searchParams.has("new")) {
              searchParams.delete("new");
              setSearchParams(searchParams, { replace: true });
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett nytt prosjekt</DialogTitle>
                <DialogDescription>
                  Fyll inn informasjon om prosjektet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-project-name">Prosjektnavn *</Label>
                  <Input
                    id="create-project-name"
                    placeholder="f.eks. Nybygg Storgata 1"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-project-address">Adresse</Label>
                  <Input
                    id="create-project-address"
                    placeholder="f.eks. Storgata 1, 0001 Oslo"
                    value={newProjectData.address}
                    onChange={(e) => setNewProjectData({ ...newProjectData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-project-desc">Beskrivelse</Label>
                  <Textarea
                    id="create-project-desc"
                    placeholder="Kort beskrivelse av prosjektet"
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-concept-name">Navn på brannkonseptet *</Label>
                  <Input
                    id="create-concept-name"
                    placeholder="f.eks. Brannkonsept rev. A"
                    value={conceptName}
                    onChange={(e) => setConceptName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateProject} disabled={isCreatingProject}>
                  {isCreatingProject ? "Oppretter..." : "Opprett og start"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">
              {/* Input Form */}
              <Card className="shadow-medium flex flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Prosjektinformasjon</CardTitle>
                  <CardDescription>
                    Fyll inn nødvendig informasjon for å generere brannkonseptet
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-6 pb-6">
                    <div className="space-y-6">
                      {/* Konseptnavn */}
                      <div className="space-y-2">
                        <Label htmlFor="concept-name" className="text-sm font-semibold">Navn på brannkonseptet *</Label>
                        <Input
                          id="concept-name"
                          placeholder="f.eks. Brannkonsept rev. A"
                          value={conceptName}
                          onChange={(e) => setConceptName(e.target.value)}
                        />
                      </div>

                      {/* Upload existing concept */}
                      {!conceptId && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
                          <UploadConceptDialog onDataExtracted={(extracted) => {
                            setFormData(prev => {
                              const updated = { ...prev };
                              // Map extracted fields to formData
                              if (extracted.oppdragsgiver) updated.oppdragsgiver = extracted.oppdragsgiver;
                              if (extracted.prosjektnavn) updated.prosjektnavn = extracted.prosjektnavn;
                              if (extracted.adresse) updated.adresse = extracted.adresse;
                              if (extracted.gnr) updated.gnr = extracted.gnr;
                              if (extracted.bnr) updated.bnr = extracted.bnr;
                              if (extracted.kommune) updated.kommune = extracted.kommune;
                              if (extracted.tiltakstype) updated.tiltakstype = extracted.tiltakstype;
                              if (extracted.tiltaksbeskrivelse) updated.tiltaksbeskrivelse = extracted.tiltaksbeskrivelse;
                              if (extracted.bygningstype) updated.bygningstype = extracted.bygningstype;
                              if (extracted.areal) updated.areal = extracted.areal;
                              if (extracted.etasjer) updated.etasjer = extracted.etasjer;
                              if (extracted.tiltakshaver) updated.tiltakshaver = extracted.tiltakshaver;
                              if (extracted.ansvarligSoker) updated.ansvarligSoker = extracted.ansvarligSoker;
                              if (extracted.risikoklasse) updated.risikoklasse = extracted.risikoklasse;
                              if (extracted.prosjekteringsmetode && ["preakseptert", "analyse", "blanding"].includes(extracted.prosjekteringsmetode)) {
                                updated.prosjekteringsmetode = extracted.prosjekteringsmetode as "preakseptert" | "analyse" | "blanding";
                              }
                              if (extracted.avgrensning) updated.avgrensning = extracted.avgrensning;
                              if (extracted.tilleggskrav) updated.tilleggskrav = extracted.tilleggskrav;
                              if (extracted.bygningshoyde) updated.bygningshoyde = extracted.bygningshoyde;
                              // Sammendrag genereres manuelt, ikke fra opplastet dokument
                              return updated;
                            });
                          }} />
                          <span className="text-xs text-muted-foreground">Har du et eksisterende konsept eller forprosjekt? Last det opp for å fylle ut automatisk.</span>
                        </div>
                      )}
              <Accordion type="multiple" defaultValue={["kap1"]} className="w-full">
                {/* Sammendrag */}
                <AccordionItem value="sammendrag" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">S</span>
                      Sammendrag
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium mb-1 block">Sammendrag av brannkonseptet</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mb-2"
                        onClick={() => {
                          const firma = authorInfo?.company || "[firma]";
                          const oppdragsgiver = formData.oppdragsgiver || "[oppdragsgiver]";
                          const prosjekt = formData.prosjektnavn || "[prosjektnavn]";
                          const bygningstype = formData.bygningstype || "[bygningstype]";
                          const etasjer = formData.etasjer || "[antall]";
                          const rk = formData.harFlereRisikoklasser
                            ? formData.bygningsdeler.map(d => d.risikoklasse).filter(Boolean).join(", ")
                            : formData.risikoklasse || "[risikoklasse]";
                          const bkl = formData.harFlereRisikoklasser
                            ? formData.bygningsdeler.map(d => d.brannklasse || getBrannklasse(d.risikoklasse, d.etasjer, d.harTerrengTilgang, d.areal).brannklasse).filter(Boolean).join(", ")
                            : formData.brannklasse || "[brannklasse]";

                          const aktiveTiltak: string[] = [];
                          if (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b || formData.tilretteleggingLedd1c) aktiveTiltak.push("automatisk slokkeanlegg");
                          if (formData.tilretteleggingLedd2a) aktiveTiltak.push("brannalarmanlegg");
                          if (formData.brannalarmTalevarsling) aktiveTiltak.push("talevarsling");
                          if (formData.tilretteleggingLedd3) aktiveTiltak.push("ledesystem");

                          const metode = formData.prosjekteringsmetode === "preakseptert"
                            ? "Prosjekteringen er basert på preaksepterte ytelser i henhold til VTEK17."
                            : formData.prosjekteringsmetode === "analyse"
                              ? "Prosjekteringen er basert på analyse (fraviksprosjektering)."
                              : "Prosjekteringen er basert på en kombinasjon av preaksepterte ytelser og analyse.";

                          let tekst = `${firma} er engasjert av ${oppdragsgiver} for brannteknisk prosjektering av ${prosjekt}. `;
                          tekst += `Bygget er et ${bygningstype.toLowerCase()} med ${etasjer} tellende etasje${etasjer === "1" ? "" : "r"}. `;
                          tekst += `Bygget er plassert i risikoklasse ${rk} og brannklasse ${bkl}. `;
                          tekst += metode;

                          if (aktiveTiltak.length > 0) {
                            tekst += `\n\nFølgende aktive branntekniske tiltak er forutsatt: ${aktiveTiltak.join(", ")}.`;
                          }

                          if (formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") {
                            tekst += `\n\nDet er gjort fravik fra preaksepterte ytelser. Se egen fraviksdokumentasjon for nærmere beskrivelse.`;
                          }

                          setFormData({ ...formData, sammendrag: tekst });
                        }}
                      >
                        Generer sammendrag automatisk
                      </Button>
                      <Textarea
                        placeholder="Kort sammendrag av brannkonseptet, inkludert hovedforutsetninger og konklusjoner..."
                        value={formData.sammendrag}
                        onChange={(e) => setFormData({...formData, sammendrag: e.target.value})}
                        className="min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground">Klikk «Generer sammendrag automatisk» for å fylle ut basert på inndata, deretter rediger etter behov.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Kapittel 1: Innledning */}
                <AccordionItem value="kap1" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                      Innledning
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.1 Informasjon om tiltaket</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Oppdragsgiver</Label>
                          <Input 
                            value={formData.oppdragsgiver}
                            onChange={(e) => setFormData({...formData, oppdragsgiver: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Prosjektnavn</Label>
                          <Input 
                            value={formData.prosjektnavn}
                            onChange={(e) => setFormData({...formData, prosjektnavn: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Adresse</Label>
                          <Input 
                            value={formData.adresse}
                            onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Gnr</Label>
                              <Input 
                                value={formData.gnr}
                                onChange={(e) => setFormData({...formData, gnr: e.target.value})}
                                placeholder="Gårdsnr"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Bnr</Label>
                              <Input 
                                value={formData.bnr}
                                onChange={(e) => setFormData({...formData, bnr: e.target.value})}
                                placeholder="Bruksnr"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Kommune</Label>
                            <Input 
                              value={formData.kommune}
                              onChange={(e) => setFormData({...formData, kommune: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Type tiltak</Label>
                          <Select 
                            value={formData.tiltakstype}
                            onValueChange={(value) => setFormData({...formData, tiltakstype: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nybygg">Nybygg</SelectItem>
                              <SelectItem value="Bruksendring">Bruksendring</SelectItem>
                              <SelectItem value="Endring i eksisterende tiltak">Endring i eksisterende tiltak</SelectItem>
                              <SelectItem value="Tilbygg">Tilbygg</SelectItem>
                              <SelectItem value="Rehabilitering">Rehabilitering</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Beskrivelse av tiltaket</Label>
                          <Textarea 
                            value={formData.tiltaksbeskrivelse}
                            onChange={(e) => setFormData({...formData, tiltaksbeskrivelse: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Særskilt brannobjekt?</Label>
                          <Select 
                            value={formData.saerskiltBrannobjekt}
                            onValueChange={(value) => setFormData({...formData, saerskiltBrannobjekt: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nei">Nei</SelectItem>
                              <SelectItem value="Ja">Ja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.2 Ansvarsoppgave (SAK 10)</Label>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Tiltakshaver</Label>
                            <Input 
                              value={formData.tiltakshaver}
                              onChange={(e) => setFormData({...formData, tiltakshaver: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Ansvarlig søker (SØK)</Label>
                            <Input 
                              value={formData.ansvarligSoker}
                              onChange={(e) => setFormData({...formData, ansvarligSoker: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Kunde</Label>
                            <Input 
                              value={formData.kunde}
                              onChange={(e) => setFormData({...formData, kunde: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Brannteknisk prosjekterende (PRO RIBR)</Label>
                            <Input 
                              value={formData.proRibr}
                              onChange={(e) => setFormData({...formData, proRibr: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Kontrollerende (KPR RiBr)</Label>
                          <Input 
                            value={formData.kprRibr}
                            onChange={(e) => setFormData({...formData, kprRibr: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.3 Prosjekteringsmetode</Label>
                      <RadioGroup
                        value={formData.prosjekteringsmetode}
                        onValueChange={(value: "preakseptert" | "analyse" | "blanding") => {
                          setFormData({...formData, prosjekteringsmetode: value});
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="preakseptert" id="metode-preakseptert" />
                          <Label htmlFor="metode-preakseptert" className="text-xs">Preaksepterte ytelser</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="analyse" id="metode-analyse" />
                          <Label htmlFor="metode-analyse" className="text-xs">Analyse</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="blanding" id="metode-blanding" />
                          <Label htmlFor="metode-blanding" className="text-xs">Blandingsløsning</Label>
                        </div>
                      </RadioGroup>
                      {(formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") && (
                        <div className="space-y-2 mt-2">
                          {formData.tiltaksklasse === "Tiltaksklasse 1" && (
                            <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-800">
                              <AlertTriangle className="h-4 w-4 !text-amber-600" />
                              <AlertTitle className="text-amber-800">Fravik i tiltaksklasse 1</AlertTitle>
                              <AlertDescription className="text-amber-700">
                                Prosjektet er i tiltaksklasse 1. Bruk av {formData.prosjekteringsmetode === "analyse" ? "analyse" : "blandingsløsning"} innebærer fravik fra preaksepterte ytelser, som normalt krever høyere tiltaksklasse.
                              </AlertDescription>
                            </Alert>
                          )}
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Beskrivelse av fravik</Label>
                            <Textarea
                              value={formData.fravikBeskrivelse}
                              onChange={(e) => setFormData({...formData, fravikBeskrivelse: e.target.value})}
                              placeholder="Beskriv fravikene fra preaksepterte ytelser..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.4 Avgrensning av tiltak</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Beskriv avgrensning av tiltaket</Label>
                        <Textarea 
                          value={formData.avgrensning}
                          onChange={(e) => setFormData({...formData, avgrensning: e.target.value})}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 2: Grunnlag og forutsetninger */}
                <AccordionItem value="kap2" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                      Grunnlag og forutsetninger
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.1 Bygningsinformasjon</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Bygningstype</Label>
                          <Select 
                            value={formData.bygningstype}
                            onValueChange={(value) => {
                              const risikoklasse = bygningsTypeRisikoklasseMap[value] || "";
                              setFormData({...formData, bygningstype: value, risikoklasse: risikoklasse});
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg bygningstype" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {/* Risikoklasse 1 */}
                              <SelectItem value="Arbeidsbrakke">Arbeidsbrakke</SelectItem>
                              <SelectItem value="Båtnaust">Båtnaust</SelectItem>
                              <SelectItem value="Carport">Carport</SelectItem>
                              <SelectItem value="Flyhangar">Flyhangar</SelectItem>
                              <SelectItem value="Fryselager">Fryselager</SelectItem>
                              <SelectItem value="Garasje og parkeringshus med én etasje">Garasje og parkeringshus med én etasje</SelectItem>
                              <SelectItem value="Sagbruk">Sagbruk</SelectItem>
                              <SelectItem value="Skur">Skur</SelectItem>
                              <SelectItem value="Trelastopplag">Trelastopplag</SelectItem>
                              {/* Risikoklasse 2 */}
                              <SelectItem value="Brannstasjon uten døgnbemanning">Brannstasjon uten døgnbemanning</SelectItem>
                              <SelectItem value="Driftsbygning med husdyrrom">Driftsbygning med husdyrrom</SelectItem>
                              <SelectItem value="Industri">Industri</SelectItem>
                              <SelectItem value="Kantine beregnet for egne ansatte til og med 150 personer">Kantine beregnet for egne ansatte til og med 150 personer</SelectItem>
                              <SelectItem value="Kjemisk fabrikk og kjemikalielager">Kjemisk fabrikk og kjemikalielager</SelectItem>
                              <SelectItem value="Kontor">Kontor</SelectItem>
                              <SelectItem value="Laboratorium">Laboratorium</SelectItem>
                              <SelectItem value="Lager">Lager</SelectItem>
                              <SelectItem value="Parkeringshus og garasje med to eller flere etasjer eller plan">Parkeringshus og garasje med to eller flere etasjer</SelectItem>
                              <SelectItem value="Parkeringskjeller og garasje under terreng">Parkeringskjeller og garasje under terreng</SelectItem>
                              <SelectItem value="Sprengstoffindustri">Sprengstoffindustri</SelectItem>
                              <SelectItem value="Trafo eller fordelingsstasjon">Trafo eller fordelingsstasjon</SelectItem>
                              {/* Risikoklasse 3 */}
                              <SelectItem value="Barnehage">Barnehage</SelectItem>
                              <SelectItem value="Skole">Skole</SelectItem>
                              {/* Risikoklasse 4 */}
                              <SelectItem value="Barnehjem">Barnehjem</SelectItem>
                              <SelectItem value="Bolig">Bolig</SelectItem>
                              <SelectItem value="Boligbrakke">Boligbrakke</SelectItem>
                              <SelectItem value="Brannstasjon med døgnbemanning">Brannstasjon med døgnbemanning</SelectItem>
                              <SelectItem value="Fritidsbolig, inkl. selvbetjente hytter, campinghytter og campingenheter">Fritidsbolig, inkl. hytter og campingenheter</SelectItem>
                              <SelectItem value="Internat">Internat</SelectItem>
                              <SelectItem value="Studentbolig">Studentbolig</SelectItem>
                              {/* Risikoklasse 5 */}
                              <SelectItem value="Forsamlingslokale">Forsamlingslokale</SelectItem>
                              <SelectItem value="Idrettshall">Idrettshall</SelectItem>
                              <SelectItem value="Kantine beregnet for utleie eller for mer enn 150 personer">Kantine for utleie/mer enn 150 personer</SelectItem>
                              <SelectItem value="Kinolokale">Kinolokale</SelectItem>
                              <SelectItem value="Kirke">Kirke</SelectItem>
                              <SelectItem value="Kongressenter">Kongressenter</SelectItem>
                              <SelectItem value="Messelokale">Messelokale</SelectItem>
                              <SelectItem value="Museum">Museum</SelectItem>
                              <SelectItem value="Salgslokale">Salgslokale</SelectItem>
                              <SelectItem value="Teaterlokale">Teaterlokale</SelectItem>
                              <SelectItem value="Trafikkterminaler">Trafikkterminaler</SelectItem>
                              <SelectItem value="Tribuneanlegg for mer enn 150 personer">Tribuneanlegg for mer enn 150 personer</SelectItem>
                              {/* Risikoklasse 6 */}
                              <SelectItem value="Arrestlokaler og fengsel">Arrestlokaler og fengsel</SelectItem>
                              <SelectItem value="Asylmottak og transittmottak">Asylmottak og transittmottak</SelectItem>
                              <SelectItem value="Bolig beregnet for personer med behov for heldøgns pleie og omsorg">Bolig for heldøgns pleie og omsorg</SelectItem>
                              <SelectItem value="Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger">Bolig for funksjonsnedsettelse/seniorboliger</SelectItem>
                              <SelectItem value="Forlegning og leirskole">Forlegning og leirskole</SelectItem>
                              <SelectItem value="Overnattingssted og hotell">Overnattingssted og hotell</SelectItem>
                              <SelectItem value="Pleieinstitusjon">Pleieinstitusjon</SelectItem>
                              <SelectItem value="Sykehus og sykehjem">Sykehus og sykehjem</SelectItem>
                              <SelectItem value="Turisthytte og vandrerhjem">Turisthytte og vandrerhjem</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Bruttoareal (m²)</Label>
                            <Input 
                              value={formData.areal}
                              onChange={(e) => {
                                const nyAreal = e.target.value;
                                setFormData({...formData, areal: nyAreal});
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Antall etasjer</Label>
                            <Input 
                              value={formData.etasjer}
                              onChange={(e) => {
                                const nyEtasjer = e.target.value;
                                setFormData({...formData, etasjer: nyEtasjer});
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Spesifikk brannenergi (MJ/m²)</Label>
                          <Select 
                            value={formData.brannseksjonBrannenergi} 
                            onValueChange={(value) => setFormData({...formData, brannseksjonBrannenergi: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg brannenergi..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="over400">Over 400 MJ/m²</SelectItem>
                              <SelectItem value="50-400">50-400 MJ/m²</SelectItem>
                              <SelectItem value="under50">Under 50 MJ/m²</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.2 Grunnlagsdokumenter</Label>
                      <div className="space-y-3">
                        {(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : []).map((doc, index) => (
                          <div key={index} className="border rounded-md p-3 space-y-2 relative">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => {
                                const updated = (Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : []).filter((_, i) => i !== index);
                                setFormData({...formData, grunnlagsdokumenter: updated});
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div>
                              <Label className="text-xs">Navn på dokument</Label>
                              <Input 
                                placeholder="F.eks. Brannteknisk notat"
                                value={doc.navn}
                                onChange={(e) => {
                                  const updated = [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [])];
                                  updated[index] = {...updated[index], navn: e.target.value};
                                  setFormData({...formData, grunnlagsdokumenter: updated});
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Utarbeidet av / firma</Label>
                                <Input 
                                  placeholder={authorInfo?.company ? `F.eks. ${authorInfo.company}` : "Firma / person"}
                                  value={doc.utarbeidetAv || ""}
                                  onChange={(e) => {
                                    const updated = [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [])];
                                    updated[index] = {...updated[index], utarbeidetAv: e.target.value};
                                    setFormData({...formData, grunnlagsdokumenter: updated});
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Datert</Label>
                                <Input 
                                  type="date"
                                  value={doc.dato}
                                  onChange={(e) => {
                                    const updated = [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [])];
                                    updated[index] = {...updated[index], dato: e.target.value};
                                    setFormData({...formData, grunnlagsdokumenter: updated});
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData, 
                              grunnlagsdokumenter: [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : []), {navn: "", utarbeidetAv: "", dato: ""}]
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Legg til dokument
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.3 Branntekniske forutsetninger</Label>
                      <div className="space-y-3">
                        {/* Toggle for flere risikoklasser */}
                        <div className="flex items-center gap-2 p-3 bg-muted/30 border rounded-md">
                          <input
                            type="checkbox"
                            id="harFlereRisikoklasser"
                            checked={formData.harFlereRisikoklasser}
                            onChange={(e) => setFormData({...formData, harFlereRisikoklasser: e.target.checked})}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="harFlereRisikoklasser" className="text-sm cursor-pointer">
                            Tiltaket/bygget har flere risikoklasser eller brannklasser
                          </Label>
                        </div>

                        {!formData.harFlereRisikoklasser ? (
                          /* Enkel visning - én risikoklasse */
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Risikoklasse</Label>
                              <Select 
                                value={formData.risikoklasse}
                                onValueChange={(value) => {
                                  setFormData({...formData, risikoklasse: value});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="RK1">RK 1</SelectItem>
                                  <SelectItem value="RK2">RK 2</SelectItem>
                                  <SelectItem value="RK3">RK 3</SelectItem>
                                  <SelectItem value="RK4">RK 4</SelectItem>
                                  <SelectItem value="RK5">RK 5</SelectItem>
                                  <SelectItem value="RK6">RK 6</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-medium mb-1 block">
                                Brannklasse
                                {beregnetBrannklasseResult.brannklasse && (
                                  <span className="text-muted-foreground ml-2">(Automatisk: {beregnetBrannklasseResult.brannklasse})</span>
                                )}
                              </Label>
                              <Select 
                                value={formData.brannklasse} 
                                onValueChange={(value) => {
                                  setFormData({...formData, brannklasse: value});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BKL1">BKL 1</SelectItem>
                                  <SelectItem value="BKL2">BKL 2</SelectItem>
                                  <SelectItem value="BKL3">BKL 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Vis spørsmål om terreng-tilgang for RK4 med nøyaktig 3 etasjer */}
                            {formData.risikoklasse === "RK4" && parseInt(formData.etasjer, 10) === 3 && (
                              <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <Label className="text-xs font-medium mb-2 block text-amber-700">
                                  Har alle boenheter utgang direkte til terreng, uten å måtte rømme via trapp eller trapperom?
                                </Label>
                                <p className="text-xs text-amber-600 mb-2">
                                  Dette er nødvendig for å kunne benytte unntak for plassering i brannklasse 1 (jf. VTEK § 11-3, preakseptert ytelse nr. 3).
                                </p>
                                <Select 
                                  value={formData.harTerrengTilgang}
                                  onValueChange={(value) => setFormData({...formData, harTerrengTilgang: value})}
                                >
                                  <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Velg svar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ja">Ja - alle boenheter har direkte terreng-tilgang</SelectItem>
                                    <SelectItem value="nei">Nei - ikke alle boenheter har direkte terreng-tilgang</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {formData.brannklasseUnntak && (
                              <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <Label className="text-xs font-medium mb-1 block text-blue-700">
                                  Unntak fra VTEK § 11-3
                                </Label>
                                <p className="text-xs text-blue-600">{formData.brannklasseUnntak}</p>
                              </div>
                            )}
                            {erBrannklasseOverstyrt && (
                              <div className="col-span-2">
                                <Label className="text-xs font-medium mb-1 block text-amber-600">
                                  Begrunnelse for avvik fra automatisk brannklasse ({beregnetBrannklasseResult.brannklasse})
                                </Label>
                                <Textarea 
                                  value={formData.brannklasseBegrunnelse}
                                  onChange={(e) => setFormData({...formData, brannklasseBegrunnelse: e.target.value})}
                                  placeholder="Forklar hvorfor brannklassen avviker fra tabellverdien (f.eks. preaksepterte ytelser punkt 3-7)"
                                  className="border-amber-300"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Avansert visning - flere risikoklasser */
                          <div className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs text-blue-700">
                                Legg til de ulike delene av bygget med hver sin risikoklasse. Eksempel: Et bygg kan ha butikk (RK5) i 1. etasje og boliger (RK4) over.
                              </p>
                            </div>
                            
                            {/* Liste over bygningsdeler */}
                            {formData.bygningsdeler.map((del, index) => {
                              const delBrannklasseResult = getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal);
                              return (
                                <div key={del.id} className="p-4 border rounded-lg bg-background space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Bygningsdel {index + 1}</Label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = formData.bygningsdeler.filter((_, i) => i !== index);
                                        setFormData({...formData, bygningsdeler: updated});
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-xs font-medium mb-1 block">Navn på bygningsdel</Label>
                                    <Input
                                      placeholder="F.eks. Butikklokale, Boligdel, Parkeringskjeller..."
                                      value={del.navn}
                                      onChange={(e) => {
                                        const updated = [...formData.bygningsdeler];
                                        updated[index] = {...updated[index], navn: e.target.value};
                                        setFormData({...formData, bygningsdeler: updated});
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs font-medium mb-1 block">Bygningstype</Label>
                                    <Select 
                                      value={del.bygningstype}
                                      onValueChange={(value) => {
                                        const risikoklasse = bygningsTypeRisikoklasseMap[value] || "";
                                        const updated = [...formData.bygningsdeler];
                                        updated[index] = {...updated[index], bygningstype: value, risikoklasse: risikoklasse};
                                        setFormData({...formData, bygningsdeler: updated});
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Velg bygningstype" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-[300px]">
                                        {/* Risikoklasse 1 */}
                                        <SelectItem value="Arbeidsbrakke">Arbeidsbrakke</SelectItem>
                                        <SelectItem value="Båtnaust">Båtnaust</SelectItem>
                                        <SelectItem value="Carport">Carport</SelectItem>
                                        <SelectItem value="Flyhangar">Flyhangar</SelectItem>
                                        <SelectItem value="Fryselager">Fryselager</SelectItem>
                                        <SelectItem value="Garasje og parkeringshus med én etasje">Garasje og parkeringshus med én etasje</SelectItem>
                                        <SelectItem value="Sagbruk">Sagbruk</SelectItem>
                                        <SelectItem value="Skur">Skur</SelectItem>
                                        <SelectItem value="Trelastopplag">Trelastopplag</SelectItem>
                                        {/* Risikoklasse 2 */}
                                        <SelectItem value="Brannstasjon uten døgnbemanning">Brannstasjon uten døgnbemanning</SelectItem>
                                        <SelectItem value="Driftsbygning med husdyrrom">Driftsbygning med husdyrrom</SelectItem>
                                        <SelectItem value="Industri">Industri</SelectItem>
                                        <SelectItem value="Kantine beregnet for egne ansatte til og med 150 personer">Kantine beregnet for egne ansatte til og med 150 personer</SelectItem>
                                        <SelectItem value="Kjemisk fabrikk og kjemikalielager">Kjemisk fabrikk og kjemikalielager</SelectItem>
                                        <SelectItem value="Kontor">Kontor</SelectItem>
                                        <SelectItem value="Laboratorium">Laboratorium</SelectItem>
                                        <SelectItem value="Lager">Lager</SelectItem>
                                        <SelectItem value="Parkeringshus og garasje med to eller flere etasjer eller plan">Parkeringshus og garasje med to eller flere etasjer</SelectItem>
                                        <SelectItem value="Parkeringskjeller og garasje under terreng">Parkeringskjeller og garasje under terreng</SelectItem>
                                        <SelectItem value="Sprengstoffindustri">Sprengstoffindustri</SelectItem>
                                        <SelectItem value="Trafo eller fordelingsstasjon">Trafo eller fordelingsstasjon</SelectItem>
                                        {/* Risikoklasse 3 */}
                                        <SelectItem value="Barnehage">Barnehage</SelectItem>
                                        <SelectItem value="Skole">Skole</SelectItem>
                                        {/* Risikoklasse 4 */}
                                        <SelectItem value="Barnehjem">Barnehjem</SelectItem>
                                        <SelectItem value="Bolig">Bolig</SelectItem>
                                        <SelectItem value="Boligbrakke">Boligbrakke</SelectItem>
                                        <SelectItem value="Brannstasjon med døgnbemanning">Brannstasjon med døgnbemanning</SelectItem>
                                        <SelectItem value="Fritidsbolig, inkl. selvbetjente hytter, campinghytter og campingenheter">Fritidsbolig, inkl. hytter og campingenheter</SelectItem>
                                        <SelectItem value="Internat">Internat</SelectItem>
                                        <SelectItem value="Studentbolig">Studentbolig</SelectItem>
                                        {/* Risikoklasse 5 */}
                                        <SelectItem value="Forsamlingslokale">Forsamlingslokale</SelectItem>
                                        <SelectItem value="Idrettshall">Idrettshall</SelectItem>
                                        <SelectItem value="Kantine beregnet for utleie eller for mer enn 150 personer">Kantine for utleie/mer enn 150 personer</SelectItem>
                                        <SelectItem value="Kinolokale">Kinolokale</SelectItem>
                                        <SelectItem value="Kirke">Kirke</SelectItem>
                                        <SelectItem value="Kongressenter">Kongressenter</SelectItem>
                                        <SelectItem value="Messelokale">Messelokale</SelectItem>
                                        <SelectItem value="Museum">Museum</SelectItem>
                                        <SelectItem value="Salgslokale">Salgslokale</SelectItem>
                                        <SelectItem value="Teaterlokale">Teaterlokale</SelectItem>
                                        <SelectItem value="Trafikkterminaler">Trafikkterminaler</SelectItem>
                                        <SelectItem value="Tribuneanlegg for mer enn 150 personer">Tribuneanlegg for mer enn 150 personer</SelectItem>
                                        {/* Risikoklasse 6 */}
                                        <SelectItem value="Arrestlokaler og fengsel">Arrestlokaler og fengsel</SelectItem>
                                        <SelectItem value="Asylmottak og transittmottak">Asylmottak og transittmottak</SelectItem>
                                        <SelectItem value="Bolig beregnet for personer med behov for heldøgns pleie og omsorg">Bolig for heldøgns pleie og omsorg</SelectItem>
                                        <SelectItem value="Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger">Bolig for funksjonsnedsettelse/seniorboliger</SelectItem>
                                        <SelectItem value="Forlegning og leirskole">Forlegning og leirskole</SelectItem>
                                        <SelectItem value="Overnattingssted og hotell">Overnattingssted og hotell</SelectItem>
                                        <SelectItem value="Pleieinstitusjon">Pleieinstitusjon</SelectItem>
                                        <SelectItem value="Sykehus og sykehjem">Sykehus og sykehjem</SelectItem>
                                        <SelectItem value="Turisthytte og vandrerhjem">Turisthytte og vandrerhjem</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Areal (m²)</Label>
                                      <Input 
                                        value={del.areal}
                                        onChange={(e) => {
                                          const updated = [...formData.bygningsdeler];
                                          updated[index] = {...updated[index], areal: e.target.value};
                                          setFormData({...formData, bygningsdeler: updated});
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">
                                        Antall etasjer
                                        <span className="text-muted-foreground font-normal ml-1">(totalt for bygget)</span>
                                      </Label>
                                      <Input 
                                        value={del.etasjer}
                                        placeholder="Oppgi totalt antall etasjer for hele bygget"
                                        onChange={(e) => {
                                          const updated = [...formData.bygningsdeler];
                                          updated[index] = {...updated[index], etasjer: e.target.value};
                                          setFormData({...formData, bygningsdeler: updated});
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Risikoklasse</Label>
                                      <Select 
                                        value={del.risikoklasse}
                                        onValueChange={(value) => {
                                          const updated = [...formData.bygningsdeler];
                                          updated[index] = {...updated[index], risikoklasse: value};
                                          setFormData({...formData, bygningsdeler: updated});
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Velg" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="RK1">RK 1</SelectItem>
                                          <SelectItem value="RK2">RK 2</SelectItem>
                                          <SelectItem value="RK3">RK 3</SelectItem>
                                          <SelectItem value="RK4">RK 4</SelectItem>
                                          <SelectItem value="RK5">RK 5</SelectItem>
                                          <SelectItem value="RK6">RK 6</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">
                                        Brannklasse
                                        {delBrannklasseResult.brannklasse && (
                                          <span className="text-muted-foreground ml-1 text-xs">(Auto: {delBrannklasseResult.brannklasse})</span>
                                        )}
                                      </Label>
                                      <Select 
                                        value={del.brannklasse || delBrannklasseResult.brannklasse}
                                        onValueChange={(value) => {
                                          const updated = [...formData.bygningsdeler];
                                          updated[index] = {...updated[index], brannklasse: value};
                                          setFormData({...formData, bygningsdeler: updated});
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Velg" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="BKL1">BKL 1</SelectItem>
                                          <SelectItem value="BKL2">BKL 2</SelectItem>
                                          <SelectItem value="BKL3">BKL 3</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Vis spørsmål om terreng-tilgang for RK4 med nøyaktig 3 etasjer */}
                                  {del.risikoklasse === "RK4" && parseInt(del.etasjer, 10) === 3 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                      <Label className="text-xs font-medium mb-2 block text-amber-700">
                                        Har alle boenheter utgang direkte til terreng?
                                      </Label>
                                      <Select 
                                        value={del.harTerrengTilgang}
                                        onValueChange={(value) => {
                                          const updated = [...formData.bygningsdeler];
                                          updated[index] = {...updated[index], harTerrengTilgang: value};
                                          setFormData({...formData, bygningsdeler: updated});
                                        }}
                                      >
                                        <SelectTrigger className="bg-white">
                                          <SelectValue placeholder="Velg svar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ja">Ja - direkte terreng-tilgang</SelectItem>
                                          <SelectItem value="nei">Nei</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {delBrannklasseResult.brannklasseUnntak && (
                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                                      <p className="text-xs text-blue-600">{delBrannklasseResult.brannklasseUnntak}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newDel = {
                                  id: crypto.randomUUID(),
                                  navn: "",
                                  bygningstype: "",
                                  risikoklasse: "",
                                  brannklasse: "",
                                  brannklasseUnntak: "",
                                  harTerrengTilgang: "",
                                  areal: "",
                                  etasjer: formData.etasjer || "", // Arv antall etasjer fra hovedskjema
                                };
                                setFormData({
                                  ...formData,
                                  bygningsdeler: [...formData.bygningsdeler, newDel]
                                });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Legg til bygningsdel
                            </Button>

                            {/* Varsel om ulikt etasjeantall */}
                            {(() => {
                              const etasjeVerdier = formData.bygningsdeler.map(d => d.etasjer).filter(Boolean);
                              const unikeEtasjer = [...new Set(etasjeVerdier)];
                              const harUliktEtasjeantall = unikeEtasjer.length > 1;
                              
                              if (harUliktEtasjeantall) {
                                return (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="text-amber-600 mt-0.5">⚠️</span>
                                      <div>
                                        <Label className="text-xs font-medium block text-amber-700">
                                          Ulikt etasjeantall registrert
                                        </Label>
                                        <p className="text-xs text-amber-600 mt-1">
                                          Bygningsdelene har ulikt etasjeantall ({unikeEtasjer.join(", ")} etasjer). 
                                          Normalt skal alle deler ha samme totale etasjeantall for bygget.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-6">
                                      <input
                                        type="checkbox"
                                        id="bekreftetUliktEtasjeantall"
                                        checked={formData.bekreftetUliktEtasjeantall || false}
                                        onChange={(e) => setFormData({...formData, bekreftetUliktEtasjeantall: e.target.checked})}
                                        className="h-4 w-4"
                                      />
                                      <Label htmlFor="bekreftetUliktEtasjeantall" className="text-xs text-amber-700 cursor-pointer">
                                        Jeg bekrefter at ulikt etasjeantall er korrekt for dette tiltaket
                                      </Label>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Oppsummering av høyeste brannklasse */}
                            {formData.bygningsdeler.length > 0 && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <Label className="text-xs font-medium mb-1 block text-green-700">
                                  Oppsummering
                                </Label>
                                <p className="text-xs text-green-700">
                                  {(() => {
                                    const risikoklasser = formData.bygningsdeler.map(d => d.risikoklasse).filter(Boolean);
                                    const brannklasser = formData.bygningsdeler.map(d => {
                                      const result = getBrannklasse(d.risikoklasse, d.etasjer, d.harTerrengTilgang, d.areal);
                                      return d.brannklasse || result.brannklasse;
                                    }).filter(Boolean);
                                    
                                    const hoyesteBrannklasse = brannklasser.reduce((max, bkl) => {
                                      const num = parseInt(bkl.replace(/\D/g, ''), 10);
                                      const maxNum = parseInt(max.replace(/\D/g, ''), 10) || 0;
                                      return num > maxNum ? bkl : max;
                                    }, "BKL1");

                                    return `Risikoklasser: ${[...new Set(risikoklasser)].join(", ") || "Ikke angitt"} | Høyeste brannklasse: ${hoyesteBrannklasse}`;
                                  })()}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiltaksklasse</Label>
                      <Select 
                        value={formData.tiltaksklasse}
                        onValueChange={(value) => setFormData({...formData, tiltaksklasse: value, tiltaksklasseBegrunnelse: value === autoTiltaksklasse ? "" : formData.tiltaksklasseBegrunnelse})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg tiltaksklasse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tiltaksklasse 1">Tiltaksklasse 1</SelectItem>
                          <SelectItem value="Tiltaksklasse 2">Tiltaksklasse 2</SelectItem>
                          <SelectItem value="Tiltaksklasse 3">Tiltaksklasse 3</SelectItem>
                        </SelectContent>
                      </Select>
                      {autoTiltaksklasse && formData.tiltaksklasse && formData.tiltaksklasse !== autoTiltaksklasse && (
                        <div className="space-y-1">
                          <p className="text-xs text-amber-600">
                            Automatisk beregnet: {autoTiltaksklasse}. Du har valgt en annen tiltaksklasse.
                          </p>
                          <Label className="text-xs">Begrunnelse for endring</Label>
                          <Textarea
                            className="min-h-[60px]"
                            placeholder="Beskriv kort hvorfor tiltaksklassen er endret..."
                            value={formData.tiltaksklasseBegrunnelse || ""}
                            onChange={(e) => setFormData({...formData, tiltaksklasseBegrunnelse: e.target.value})}
                          />
                        </div>
                      )}
                      {formData.tiltaksklasse === "Tiltaksklasse 3" && (formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") && formData.tiltaksklasse === autoTiltaksklasse && (
                        <p className="text-xs text-amber-600 mt-1">
                          Tiltaksklasse 3 er satt fordi prosjekteringsmetode er {formData.prosjekteringsmetode === "analyse" ? "analyse" : "blandingsløsning"}.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.4 Tilleggskrav</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Eventuelle tilleggskrav fra tiltakshaver, myndigheter eller bruker</Label>
                        <Textarea 
                          value={formData.tilleggskrav || ""}
                          onChange={(e) => setFormData({...formData, tilleggskrav: e.target.value})}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 3: Branntekniske ytelseskrav */}
                <AccordionItem value="kap3" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                      Branntekniske ytelseskrav
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-3">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.1 § 11-4 Bæreevne og stabilitet</Label>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Krav til bærende konstruksjoner (automatisk basert på brannklasse — kan redigeres)</Label>
                        <Textarea 
                          value={formData.baereevne}
                          onChange={(e) => setFormData({...formData, baereevne: e.target.value})}
                          className="min-h-[140px]"
                        />
                        {formData.baereevne && formData.brannklasse && (() => {
                          const auto = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer);
                          return auto.tekst && formData.baereevne !== auto.tekst;
                        })() && (
                          <div className="flex items-start gap-2 mt-2 p-2 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              Bæreevne-kravene er endret fra automatisk beregnet verdi. Beskriv begrunnelsen i kommentarfeltet under.
                            </p>
                          </div>
                        )}
                      </div>
                      {formData.baereevneUnntak.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium mb-1 block text-blue-700">Automatisk anvendte unntak (jf. VTEK § 11-4)</Label>
                          <div className="space-y-2 text-sm border border-blue-200 rounded-md p-3 bg-blue-50">
                            {formData.baereevneUnntak.map((unntakId) => (
                              <div key={unntakId} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span className="text-xs text-blue-700">{baereevneUnntakTekster[unntakId]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                       )}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="balkongRelevant"
                          checked={formData.balkongRelevant}
                          onCheckedChange={(checked) => setFormData({...formData, balkongRelevant: checked as boolean})}
                        />
                        <Label htmlFor="balkongRelevant" className="text-xs cursor-pointer">
                          Balkonger, utkragede bygningsdeler og lignende er relevant for tiltaket
                        </Label>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const commentSection = document.getElementById('baereevne-kommentar');
                            if (commentSection) {
                              commentSection.classList.toggle('hidden');
                            }
                          }}
                        >
                          + Kommentar
                        </Button>
                        <div id="baereevne-kommentar" className={formData.baereevneKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.baereevneKommentar}
                              onChange={(e) => setFormData({...formData, baereevneKommentar: e.target.value})}
                              placeholder="Legg til kommentar eller beskrivelse av løsninger som trenger forklaring..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.2 § 11-5 Sikkerhet ved eksplosjon</Label>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Er eksplosjonsfare relevant for dette tiltaket?</Label>
                        <Select 
                          value={formData.eksplosjonRelevant}
                          onValueChange={(value) => setFormData({...formData, eksplosjonRelevant: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ikke_relevant">Ikke relevant</SelectItem>
                            <SelectItem value="relevant">Relevant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.eksplosjonRelevant === "ikke_relevant" && (
                        <div className="p-3 bg-muted/50 border rounded-md space-y-2">
                          <p className="text-sm text-muted-foreground">
                            RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Krav til sikkerhet ved eksplosjon er også gitt i andre regelverk som for eksempel{' '}
                            <a href="https://lovdata.no/dokument/SF/forskrift/2009-06-08-602" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                              forskrift om håndtering av farlig stoff
                            </a>{' '}
                            og{' '}
                            <a href="https://lovdata.no/dokument/SF/forskrift/2005-12-20-1626" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                              forskrift om elektriske forsyningsanlegg
                            </a>.
                          </p>
                        </div>
                      )}
                      {formData.eksplosjonRelevant === "relevant" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-3">
                          <div>
                            <Label className="text-xs font-medium mb-1 block text-blue-700">Beskrivelse av rom og type eksplosjonsfare</Label>
                            <Textarea 
                              value={formData.eksplosjonBeskrivelse}
                              onChange={(e) => setFormData({...formData, eksplosjonBeskrivelse: e.target.value})}
                              placeholder="Beskriv rommet og typen eksplosjonsfare..."
                              className=""
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-2 block text-blue-700">Preaksepterte ytelser (jf. VTEK § 11-5)</Label>
                            <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                              <li>Rom hvor det kan forekomme fare for eksplosjon, må utgjøre en egen branncelle.</li>
                              <li>Rom hvor det kan forekomme fare for eksplosjon, må ha minst én trykkavlastningsflate for å sikre mot skader på personer og byggverket forøvrig.</li>
                              <li>Avlastet trykk må ledes bort i sikker retning.</li>
                              <li>Trykkavlastningsflater må ikke plasseres i takflater og lignende med mindre det dokumenteres at snølast ikke er til hinder for avlastningsflatens funksjon.</li>
                              <li>Bærende og branncellebegrensende bygningsdeler må om nødvendig forsterkes for å opprettholde rømningsveiers funksjon og forhindre spredning av brann til andre brannceller.</li>
                            </ol>
                          </div>
                          <p className="text-xs text-blue-700">
                            Farlige stoffer skal håndteres og lagres i henhold til relevante standarder, herunder{' '}
                            <span className="font-semibold">forskrift om håndtering av farlig stoff</span> og{' '}
                            <span className="font-semibold">forskrift om elektriske forsyningsanlegg</span>.
                          </p>
                        </div>
                      )}
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('eksplosjon-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="eksplosjon-kommentar" className={formData.eksplosjonKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.eksplosjonKommentar}
                              onChange={(e) => setFormData({...formData, eksplosjonKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.3 § 11-6 Tiltak mot brannspredning</Label>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Avstand til nabobygg (meter)</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={formData.avstandNabobygg}
                          onChange={(e) => setFormData({...formData, avstandNabobygg: e.target.value})}
                          placeholder="Angi avstand i meter..."
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Bygningshøyde (meter)</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={formData.bygningshoyde}
                          onChange={(e) => setFormData({...formData, bygningshoyde: e.target.value})}
                          placeholder="Angi høyde i meter..."
                        />
                      </div>
                      
                      {parseFloat(formData.bygningshoyde) > 9 && parseFloat(formData.avstandNabobygg || "0") < 8 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-sm font-medium text-orange-800 mb-2">Bygning over 9 meter med avstand under 8 m - krav til brannvegg</p>
                          <Label className="text-xs font-medium mb-1 block">Spesifikk brannenergi (MJ/m²)</Label>
                          <Select 
                            value={formData.spesifikkBrannenergi} 
                            onValueChange={(value) => setFormData({...formData, spesifikkBrannenergi: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg brannenergi..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inntil400">Inntil 400 MJ/m² → REI 120-M A2-s1,d0</SelectItem>
                              <SelectItem value="400-600">400-600 MJ/m² → REI 180-M A2-s1,d0</SelectItem>
                              <SelectItem value="600-800">600-800 MJ/m² → REI 240-M A2-s1,d0</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {parseFloat(formData.bygningshoyde) > 9 && parseFloat(formData.avstandNabobygg || "0") >= 8 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm font-medium text-green-800">Avstand til nabobygg er 8 meter eller mer – krav til brannvegg gjelder ikke. Branncellevegg benyttes.</p>
                        </div>
                      )}

                      {parseFloat(formData.bygningshoyde) > 0 && parseFloat(formData.bygningshoyde) <= 9 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Bygning under eller lik 9 meter - krav til branncellevegg</p>
                        </div>
                      )}
                      
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('brannspredning-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="brannspredning-kommentar" className={formData.brannspredningKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.brannspredningKommentar}
                              onChange={(e) => setFormData({...formData, brannspredningKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.4 § 11-7 Brannseksjoner</Label>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Tiltak</Label>
                        <Select 
                          value={formData.brannseksjonTiltak} 
                          onValueChange={(value) => setFormData({...formData, brannseksjonTiltak: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg tiltak..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normalt">Normalt (ingen tiltak)</SelectItem>
                            <SelectItem value="brannalarm">Med brannalarmanlegg</SelectItem>
                            <SelectItem value="sprinkler">Med sprinkleranlegg</SelectItem>
                            <SelectItem value="roykventilasjon">Med røykventilasjon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Brannenergi vises kun når seksjonering kan være påkrevd (areal overstiger laveste grense for valgt tiltak) */}
                      {formData.brannseksjonTiltak && (() => {
                        const arealNum = parseFloat(formData.areal) || 0;
                        const tiltak = formData.brannseksjonTiltak as "normalt" | "brannalarm" | "sprinkler" | "roykventilasjon";
                        const laveste = Math.min(
                          seksjoneringsGrenser["over400"]?.[tiltak] ?? Infinity,
                          seksjoneringsGrenser["50-400"]?.[tiltak] ?? Infinity,
                          seksjoneringsGrenser["under50"]?.[tiltak] ?? Infinity,
                        );
                        return arealNum > laveste;
                      })() && (
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Spesifikk brannenergi for seksjoneringsveggen (MJ/m²)</Label>
                          <Select 
                            value={formData.seksjoneringsvegBrannenergi} 
                            onValueChange={(value) => setFormData({...formData, seksjoneringsvegBrannenergi: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg brannenergi..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under400">Under 400 MJ/m²</SelectItem>
                              <SelectItem value="400-600">400–600 MJ/m²</SelectItem>
                              <SelectItem value="600-800">600–800 MJ/m²</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {formData.brannseksjonBrannenergi === "over400" && formData.brannseksjonTiltak === "roykventilasjon" && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">⚠️ Røykventilasjon er uegnet for brannenergi over 400 MJ/m²</p>
                        </div>
                      )}
                      
                      {/* Sjekk om valgt tiltak er tilstrekkelig for arealet */}
                      {formData.areal && formData.brannseksjonBrannenergi && formData.brannseksjonTiltak && (
                        (() => {
                          const arealNum = parseFloat(formData.areal) || 0;
                          const g = seksjoneringsGrenser[formData.brannseksjonBrannenergi];
                          if (!g) return null;
                          
                          const maksAreal = g[formData.brannseksjonTiltak as keyof typeof g];
                          
                          if (maksAreal === 0) {
                            return (
                              <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700">⚠️ Dette tiltaket er ikke egnet for valgt brannenergi</p>
                              </div>
                            );
                          }
                          
                          if (arealNum > maksAreal && maksAreal !== Infinity) {
                            return (
                              <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700">⚠️ Arealet ({arealNum} m²) overskrider maksimalt tillatt ({maksAreal} m²) for valgt tiltak. Brannseksjonering er påkrevd.</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm text-green-700">✅ Valgt tiltak er tilstrekkelig for arealet ({arealNum} m² ≤ {maksAreal === Infinity ? "ubegrenset" : maksAreal + " m²"})</p>
                            </div>
                          );
                        })()
                      )}
                      
                      
                      {/* Innvendig hjørne */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-medium">Brannseksjoneringsveggen plasseres i innvendig hjørne?</Label>
                          <Select
                            value={formData.innvendigHjorne}
                            onValueChange={(value: "ja" | "nei") => setFormData({...formData, innvendigHjorne: value})}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nei">Nei</SelectItem>
                              <SelectItem value="ja">Ja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.innvendigHjorne === "ja" && (
                          <div className="p-3 bg-muted rounded-md space-y-2">
                            <Label className="text-xs font-medium block">Utforming for å hindre brannsmitte i innvendig hjørne:</Label>
                            <RadioGroup
                              value={formData.innvendigHjorneAlternativ}
                              onValueChange={(value: "alt1" | "alt2") => setFormData({...formData, innvendigHjorneAlternativ: value})}
                            >
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="alt1" id="hjorne-alt1" />
                                <Label htmlFor="hjorne-alt1" className="text-xs leading-snug cursor-pointer">
                                  Alternativ 1: Seksjoneringsveggen forlenges minimum 8,0 meter forbi innvendig hjørne
                                </Label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="alt2" id="hjorne-alt2" />
                                <Label htmlFor="hjorne-alt2" className="text-xs leading-snug cursor-pointer">
                                  Alternativ 2: Seksjoneringsveggen forlenges minimum 5,0 meter på hver side av innvendig hjørne
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </div>

                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('brannseksjoner-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="brannseksjoner-kommentar" className={formData.brannseksjonerKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.brannseksjonerKommentar}
                              onChange={(e) => setFormData({...formData, brannseksjonerKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.5 § 11-8 Brannceller</Label>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Relevante branncelle-typer (preaksepterte ytelser)</Label>
                        <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2 bg-muted/30">
                          {branncelleTyperListe.map((type) => (
                            <div key={type.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`branncelle-${type.id}`}
                                checked={formData.branncelleTyper.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({...formData, branncelleTyper: [...formData.branncelleTyper, type.id]});
                                  } else {
                                    setFormData({...formData, branncelleTyper: formData.branncelleTyper.filter(t => t !== type.id)});
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`branncelle-${type.id}`} 
                                className="text-xs leading-tight cursor-pointer"
                              >
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Heismaskinrom relevant?</Label>
                        <Select 
                          value={formData.heismaskinromRelevant} 
                          onValueChange={(value: "ja" | "nei") => setFormData({...formData, heismaskinromRelevant: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ja">Ja - heismaskinrom er relevant</SelectItem>
                            <SelectItem value="nei">Nei - ikke relevant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Fyrrom relevant?</Label>
                        <Select 
                          value={formData.fyrromRelevant} 
                          onValueChange={(value: "ja" | "nei") => setFormData({...formData, fyrromRelevant: value, fyrromKw: value === "nei" ? "" : formData.fyrromKw})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nei">Nei - ikke relevant</SelectItem>
                            <SelectItem value="ja">Ja - fyrrom er relevant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.fyrromRelevant === "ja" && (
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Fyrrom effekt (kW)</Label>
                          <Select 
                            value={formData.fyrromKw} 
                            onValueChange={(value: "" | "fast" | "under50" | "50-100" | "over100" | "ukjent") => setFormData({...formData, fyrromKw: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg effekt..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fast">Fast brensel (ved, pellets, etc.)</SelectItem>
                              <SelectItem value="under50">Flytende/gassformig brensel: P &lt; 50 kW</SelectItem>
                              <SelectItem value="50-100">Flytende/gassformig brensel: 50-100 kW</SelectItem>
                              <SelectItem value="over100">Flytende/gassformig brensel: P &gt; 100 kW</SelectItem>
                              <SelectItem value="ukjent">Ukjent - vis alle krav</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Dører i branncellebegrensende konstruksjoner</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          {[
                            { id: "branncelle_trapperom_tr1", label: "Branncelle – trapperom Tr 1" },
                            { id: "korridor_trapperom_tr2", label: "Korridor – trapperom Tr 2" },
                            { id: "mellomliggende_trapperom_tr3", label: "Mellomliggende rom – trapperom Tr 3" },
                            { id: "garasje_brannsluse", label: "Garasje – brannsluse" },
                            { id: "branncelle_korridor", label: "Branncelle – korridor" },
                            { id: "korridor_det_fri_tr3", label: "Korridor – det fri (i kombinasjon med trapperom Tr 3)" },
                          ].map((dp) => (
                            <div key={dp.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`dor-${dp.id}`}
                                checked={formData.dorPlasseringer.includes(dp.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({...formData, dorPlasseringer: [...formData.dorPlasseringer, dp.id]});
                                  } else {
                                    setFormData({...formData, dorPlasseringer: formData.dorPlasseringer.filter(d => d !== dp.id)});
                                  }
                                }}
                              />
                              <label htmlFor={`dor-${dp.id}`} className="text-xs leading-tight cursor-pointer">{dp.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('brannceller-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="brannceller-kommentar" className={formData.branncellerKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.branncellerKommentar}
                              onChange={(e) => setFormData({...formData, branncellerKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.6 § 11-9 Materialer og produkters egenskaper ved brann</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Krav til overflater og kledninger genereres automatisk basert på brannklasse ({formData.brannklasse || "ikke angitt"}).</p>
                      
                      {/* Isolasjon-valg */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                        <Label className="text-xs font-medium">Isolasjon</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="isolasjonSandwich"
                            checked={formData.isolasjonSandwich === "relevant"}
                            onCheckedChange={(checked) => 
                              setFormData({...formData, isolasjonSandwich: checked ? "relevant" : "ikke_relevant"})
                            }
                          />
                          <label htmlFor="isolasjonSandwich" className="text-xs cursor-pointer">
                            Bruk av sandwichelementer
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="isolasjonBrennbar"
                            checked={formData.isolasjonBrennbar === "relevant"}
                            onCheckedChange={(checked) => 
                              setFormData({...formData, isolasjonBrennbar: checked ? "relevant" : "ikke_relevant"})
                            }
                          />
                          <label htmlFor="isolasjonBrennbar" className="text-xs cursor-pointer">
                            Bruk av brennbar isolasjon
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('materialer-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="materialer-kommentar" className={formData.materialerKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.materialerKommentar}
                              onChange={(e) => setFormData({...formData, materialerKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.7 § 11-10 Tekniske installasjoner</Label>
                      </div>
                      
                      {/* Ventilasjonsanlegg */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="ventilasjonRelevant"
                            checked={formData.ventilasjonRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, ventilasjonRelevant: !!checked})}
                          />
                          <label htmlFor="ventilasjonRelevant" className="text-xs font-medium cursor-pointer">
                            A. Ventilasjonsanlegg er relevant for tiltaket
                          </label>
                        </div>
                        
                        {formData.ventilasjonRelevant && (
                          <div className="ml-6 space-y-2 pt-2 border-t">
                            <Label className="text-xs text-muted-foreground">Tilleggskrav (krav 1-4 inkluderes alltid):</Label>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="ventKrav5"
                                checked={formData.ventKrav5}
                                onCheckedChange={(checked) => setFormData({...formData, ventKrav5: !!checked})}
                              />
                              <label htmlFor="ventKrav5" className="text-xs cursor-pointer">
                                Storkjøkken/frityr - EI 30 A2-s1,d0
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="ventKrav6"
                                checked={formData.ventKrav6}
                                onCheckedChange={(checked) => setFormData({...formData, ventKrav6: !!checked})}
                              />
                              <label htmlFor="ventKrav6" className="text-xs cursor-pointer">
                                Kjøkken boenheter - EI 15 A2-s1,d0
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="ventKrav7"
                                checked={formData.ventKrav7}
                                onCheckedChange={(checked) => setFormData({...formData, ventKrav7: !!checked})}
                              />
                              <label htmlFor="ventKrav7" className="text-xs cursor-pointer">
                                Småhus - avtrekk stål/aluminium
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="ventKrav8"
                                checked={formData.ventKrav8}
                                onCheckedChange={(checked) => setFormData({...formData, ventKrav8: !!checked})}
                              />
                              <label htmlFor="ventKrav8" className="text-xs cursor-pointer">
                                Småhus - kanal klasse E
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="ventKrav9"
                                checked={formData.ventKrav9}
                                onCheckedChange={(checked) => setFormData({...formData, ventKrav9: !!checked})}
                              />
                              <label htmlFor="ventKrav9" className="text-xs cursor-pointer">
                                Brannspjeld i seksjoneringsvegg
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Vann- og avløpsrør */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="vannAvlopRelevant"
                            checked={formData.vannAvlopRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, vannAvlopRelevant: !!checked})}
                          />
                          <label htmlFor="vannAvlopRelevant" className="text-xs font-medium cursor-pointer">
                            B. Vann- og avløpsrør, rørpostanlegg, sentralstøvsugeranlegg og lignende
                          </label>
                        </div>
                      </div>
                      
                      {/* Rør- og kanalisolasjon */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="rorIsolasjonRelevant"
                            checked={formData.rorIsolasjonRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, rorIsolasjonRelevant: !!checked})}
                          />
                          <label htmlFor="rorIsolasjonRelevant" className="text-xs font-medium cursor-pointer">
                            C. Rør- og kanalisolasjon er relevant for tiltaket
                          </label>
                        </div>
                      </div>
                      
                      {/* Elektriske installasjoner */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="elektriskRelevant"
                            checked={formData.elektriskRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, elektriskRelevant: !!checked})}
                          />
                          <label htmlFor="elektriskRelevant" className="text-xs font-medium cursor-pointer">
                            D. Elektriske installasjoner er relevant for tiltaket
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('installasjoner-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="installasjoner-kommentar" className={formData.installasjonerKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.installasjonerKommentar}
                              onChange={(e) => setFormData({...formData, installasjonerKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.8 § 11-11 Rømning og redning</Label>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Generelle krav om rømning</Label>
                        <Textarea 
                          value={formData.romningSikkerhet}
                          onChange={(e) => setFormData({...formData, romningSikkerhet: e.target.value})}
                        />
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('romning-sikkerhet-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="romning-sikkerhet-kommentar" className={formData.romningSikkerhetKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.romningSikkerhetKommentar}
                              onChange={(e) => setFormData({...formData, romningSikkerhetKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.9 § 11-12 Tilrettelegging for rømning og redning</Label>
                      </div>
                      
                      {/* Automatiske krav basert på RK */}
                      {(formData.risikoklasse === "RK4" || formData.bygningsdeler.some(b => b.risikoklasse === "RK4")) && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Automatisk krav (RK4 med heis):</strong> Byggverk i RK4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg.
                        </div>
                      )}
                      {(formData.risikoklasse === "RK6" || formData.bygningsdeler.some(b => b.risikoklasse === "RK6")) && (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            <strong>Automatisk krav (RK6):</strong> Byggverk i RK6 skal ha automatisk brannslokkeanlegg.
                          </div>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                            <Label className="text-xs font-medium mb-2 block">Type virksomhet i RK6:</Label>
                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                size="sm"
                                variant={formData.rk6Institusjon ? "default" : "outline"}
                                onClick={() => setFormData({...formData, rk6Institusjon: true})}
                                className="text-xs"
                              >
                                Institusjon
                              </Button>
                              <Button 
                                type="button"
                                size="sm"
                                variant={!formData.rk6Institusjon ? "default" : "outline"}
                                onClick={() => setFormData({...formData, rk6Institusjon: false})}
                                className="text-xs"
                              >
                                Egeneide boenheter
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formData.rk6Institusjon 
                                ? "NS-EN 12845 skal benyttes for institusjoner." 
                                : "NS-EN 16925 kan benyttes for egeneide boenheter i RK6."}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Velg relevante krav:</Label>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd1c" 
                            checked={formData.tilretteleggingLedd1c}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd1c: checked as boolean})}
                          />
                          <Label htmlFor="tilretteleggingLedd1c" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Automatisk slokkeanlegg:</strong> Der det er krav om automatisk brannslokkeanlegg, kan det benyttes andre tiltak som gir tilsvarende sikkerhet.
                          </Label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd2a" 
                            checked={formData.tilretteleggingLedd2a}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd2a: checked as boolean})}
                          />
                          <Label htmlFor="tilretteleggingLedd2a" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Brannalarmanlegg:</strong> Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.
                          </Label>
                        </div>
                        
                        {/* Sub-checkboxer for brannalarmanlegg */}
                        {formData.tilretteleggingLedd2a && (
                          <div className="ml-6 p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
                            <Label className="text-xs font-medium block mb-2">Velg relevante krav for brannalarmanlegg:</Label>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="brannalarmBoligbygg" 
                                checked={formData.brannalarmBoligbygg}
                                onCheckedChange={(checked) => setFormData({...formData, brannalarmBoligbygg: checked as boolean})}
                              />
                              <Label htmlFor="brannalarmBoligbygg" className="text-xs cursor-pointer leading-relaxed">
                                Boligbygg med leiligheter (krav til detektorer i leiligheter)
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="brannalarmParkering" 
                                checked={formData.brannalarmParkering}
                                onCheckedChange={(checked) => setFormData({...formData, brannalarmParkering: checked as boolean})}
                              />
                              <Label htmlFor="brannalarmParkering" className="text-xs cursor-pointer leading-relaxed">
                                Parkeringskjeller/garasje større enn 1 200 m²
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="brannalarmPublikum" 
                                checked={formData.brannalarmPublikum}
                                onCheckedChange={(checked) => setFormData({...formData, brannalarmPublikum: checked as boolean})}
                              />
                              <Label htmlFor="brannalarmPublikum" className="text-xs cursor-pointer leading-relaxed">
                                Byggverk for publikum og/eller arbeidsbygninger (optiske alarmorganer)
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="brannalarmUniversell" 
                                checked={formData.brannalarmUniversell}
                                onCheckedChange={(checked) => setFormData({...formData, brannalarmUniversell: checked as boolean})}
                              />
                              <Label htmlFor="brannalarmUniversell" className="text-xs cursor-pointer leading-relaxed">
                                Universelt utformet (krav om optiske alarmorganer i UU-rom)
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="brannalarmTalevarsling" 
                                checked={formData.brannalarmTalevarsling}
                                onCheckedChange={(checked) => setFormData({...formData, brannalarmTalevarsling: checked as boolean})}
                              />
                              <Label htmlFor="brannalarmTalevarsling" className="text-xs cursor-pointer leading-relaxed">
                                Branncelle over flere plan med over 1 000 personer (talevarsling)
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="brannalarmTakterrasse" 
                                checked={formData.brannalarmTakterrasse}
                                onCheckedChange={(checked) => setFormData({...formData, brannalarmTakterrasse: checked as boolean})}
                              />
                              <Label htmlFor="brannalarmTakterrasse" className="text-xs cursor-pointer leading-relaxed">
                                Takterrasse beregnet for personopphold
                              </Label>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="tilretteleggingLedd2b" 
                              checked={formData.tilretteleggingLedd2b}
                              onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd2b: checked as boolean})}
                            />
                            <Label htmlFor="tilretteleggingLedd2b" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Røykvarslere:</strong> I byggverk beregnet for få personer og byggverk av mindre størrelse kan det brukes røykvarslere (seriekoblet, tilknyttet strømforsyning med batterireserve).
                            </Label>
                          </div>
                          {formData.tilretteleggingLedd2b && (() => {
                            const rk = formData.risikoklasse;
                            const areal = parseFloat(formData.areal) || 0;
                            const bygningstype = formData.bygningstype.toLowerCase();
                            
                            // Sjekk preaksepterte ytelser for røykvarslere
                            const erRK2IndustriLager = rk === "RK2" && areal <= 1200 && 
                              (bygningstype.includes("industri") || bygningstype.includes("lager"));
                            const erRK2Kontor = rk === "RK2" && areal <= 1200 && bygningstype.includes("kontor");
                            const erRK4Bolig = rk === "RK4" && 
                              (bygningstype.includes("enebolig") || bygningstype.includes("rekkehus") || 
                               bygningstype.includes("kjedehus") || bygningstype.includes("fritidsbolig") ||
                               bygningstype.includes("bolig"));
                            const erRK5Liten = rk === "RK5" && areal <= 600;
                            
                            if (erRK2IndustriLager || erRK2Kontor || erRK4Bolig || erRK5Liten) {
                              return (
                                <div className="ml-6 p-3 bg-green-50 border border-green-200 rounded text-xs">
                                  <strong className="text-green-800">Minstekrav oppfylt:</strong>
                                  <span className="text-green-700 ml-1">
                                    Røykvarslere er preakseptert minstekrav for dette tiltaket basert på risikoklasse og areal. 
                                    Heldekkende brannalarmanlegg kan likevel velges for økt sikkerhet.
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd3" 
                            checked={formData.tilretteleggingLedd3}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd3: checked as boolean})}
                          />
                          <Label htmlFor="tilretteleggingLedd3" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Ledesystem:</strong> Store byggverk, byggverk for mange personer og RK5/RK6 skal ha ledesystem med god belysning og merking.
                          </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd4" 
                            checked={formData.tilretteleggingLedd4}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd4: checked as boolean})}
                          />
                          <Label htmlFor="tilretteleggingLedd4" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Evakueringsplaner:</strong> For RK5/RK6, publikumsbygg og arbeidsbygninger skal det foreligge evakueringsplaner før bruk.
                          </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd5" 
                            checked={formData.tilretteleggingLedd5}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd5: checked as boolean})}
                          />
                          <Label htmlFor="tilretteleggingLedd5" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Merking av installasjoner:</strong> Branntekniske installasjoner som har betydning for rømning og redning skal være tydelig merket.
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('tilrettelegging-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="tilrettelegging-kommentar" className={formData.tilretteleggingKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.tilretteleggingKommentar}
                              onChange={(e) => setFormData({...formData, tilretteleggingKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.10 § 11-13 Utgang fra branncelle</Label>
                      </div>
                      {((formData.risikoklasse === "RK4" && parseInt(formData.etasjer) >= 2) || 
                        formData.bygningsdeler.some(b => b.risikoklasse === "RK4" && parseInt(b.etasjer) >= 2)) && (
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Checkbox 
                            id="boenhetKunEttTrapperom"
                            checked={formData.boenhetKunEttTrapperom}
                            onCheckedChange={(checked) => setFormData({...formData, boenhetKunEttTrapperom: checked as boolean})}
                          />
                          <Label htmlFor="boenhetKunEttTrapperom" className="text-sm cursor-pointer">
                            Boenheter har kun tilgang til ett trapperom
                          </Label>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <Checkbox 
                          id="branncelleFlereEtasjer"
                          checked={formData.branncelleFlereEtasjer}
                          onCheckedChange={(checked) => setFormData({...formData, branncelleFlereEtasjer: checked as boolean})}
                        />
                        <Label htmlFor="branncelleFlereEtasjer" className="text-sm cursor-pointer">
                          Brannceller over flere etasjer / mellometasje
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <Checkbox 
                          id="lavtByggverkVinduerRomning"
                          checked={formData.lavtByggverkVinduerRomning}
                          onCheckedChange={(checked) => setFormData({...formData, lavtByggverkVinduerRomning: checked as boolean})}
                        />
                        <Label htmlFor="lavtByggverkVinduerRomning" className="text-sm cursor-pointer">
                          Lavt byggverk (RK 1-4) med vinduer for sikker rømning
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <Checkbox 
                          id="branncelleStortAntallPersoner"
                          checked={formData.branncelleStortAntallPersoner}
                          onCheckedChange={(checked) => setFormData({...formData, branncelleStortAntallPersoner: checked as boolean})}
                        />
                        <Label htmlFor="branncelleStortAntallPersoner" className="text-sm cursor-pointer">
                          Brannceller for stort antall personer
                        </Label>
                      </div>
                      {formData.branncelleStortAntallPersoner && (
                        <div className="ml-6 space-y-3 p-3 border-l-2 border-primary/30 bg-muted/50 rounded">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-foreground">Persontallkalkulator</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs mb-1 block">Areal (m²)</Label>
                                <Input
                                  type="number"
                                  placeholder="f.eks. 500"
                                  value={formData.persontallAreal}
                                  onChange={(e) => setFormData({...formData, persontallAreal: e.target.value})}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs mb-1 block">Kategori</Label>
                                <Select
                                  value={formData.persontallKategori}
                                  onValueChange={(value) => setFormData({...formData, persontallKategori: value})}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Velg kategori" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="salgslokaler">Salgslokaler (2 m²/pers)</SelectItem>
                                    <SelectItem value="kontor">Kontor (15 m²/pers)</SelectItem>
                                    <SelectItem value="skoler">Skoler (2 m²/pers)</SelectItem>
                                    <SelectItem value="barnehager">Barnehager/fritidshjem (4 m²/pers)</SelectItem>
                                    <SelectItem value="forsamlingslokaler">Forsamlingslokaler (0,6 m²/pers)</SelectItem>
                                    <SelectItem value="spisesaler">Spisesaler (1,4 m²/pers)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {formData.persontallAreal && formData.persontallKategori && (
                              <div className="text-sm bg-primary/10 p-2 rounded">
                                <span className="font-medium">Beregnet persontall: </span>
                                {(() => {
                                  const arealPerPerson: Record<string, number> = {
                                    salgslokaler: 2,
                                    kontor: 15,
                                    skoler: 2,
                                    barnehager: 4,
                                    forsamlingslokaler: 0.6,
                                    spisesaler: 1.4
                                  };
                                  const areal = parseFloat(formData.persontallAreal) || 0;
                                  const factor = arealPerPerson[formData.persontallKategori] || 1;
                                  return Math.floor(areal / factor);
                                })()}{" "}personer
                              </div>
                            )}
                          </div>
                          <div className="border-t pt-2">
                            <p className="text-xs text-muted-foreground mb-2">Velg relevante kategorier:</p>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="stortAntallUnder600"
                                checked={formData.stortAntallUnder600}
                                onCheckedChange={(checked) => setFormData({...formData, stortAntallUnder600: checked as boolean})}
                              />
                              <Label htmlFor="stortAntallUnder600" className="text-sm cursor-pointer">
                                Inntil 600 personer
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="stortAntallOver600"
                                checked={formData.stortAntallOver600}
                                onCheckedChange={(checked) => setFormData({...formData, stortAntallOver600: checked as boolean})}
                              />
                              <Label htmlFor="stortAntallOver600" className="text-sm cursor-pointer">
                                Mer enn 600 personer
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="stortAntallUnder150"
                                checked={formData.stortAntallUnder150}
                                onCheckedChange={(checked) => setFormData({...formData, stortAntallUnder150: checked as boolean})}
                              />
                              <Label htmlFor="stortAntallUnder150" className="text-sm cursor-pointer">
                                Mindre enn 150 personer
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="stortAntallFlereEtasjer"
                                checked={formData.stortAntallFlereEtasjer}
                                onCheckedChange={(checked) => setFormData({...formData, stortAntallFlereEtasjer: checked as boolean})}
                              />
                              <Label htmlFor="stortAntallFlereEtasjer" className="text-sm cursor-pointer">
                                Branncelle over flere etasjer
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Valgfrie dør-krav:</p>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dorerTilbakerømning"
                            checked={formData.dorerTilbakerømning}
                            onCheckedChange={(checked) => setFormData({...formData, dorerTilbakerømning: checked as boolean})}
                          />
                          <Label htmlFor="dorerTilbakerømning" className="text-sm cursor-pointer">
                            Krav til tilbakerømning (låsesystem for retur)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dorerNattlaser"
                            checked={formData.dorerNattlaser}
                            onCheckedChange={(checked) => setFormData({...formData, dorerNattlaser: checked as boolean})}
                          />
                          <Label htmlFor="dorerNattlaser" className="text-sm cursor-pointer">
                            Nattlåser er relevant
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dorerLiteAntallPersoner"
                            checked={formData.dorerLiteAntallPersoner}
                            onCheckedChange={(checked) => setFormData({...formData, dorerLiteAntallPersoner: checked as boolean})}
                          />
                          <Label htmlFor="dorerLiteAntallPersoner" className="text-sm cursor-pointer">
                            Rom med &lt;10 personer (dør kan slå mot rømningsretning)
                          </Label>
                        </div>
                        {(() => {
                          const brannklasser = formData.bygningsdeler && formData.bygningsdeler.length > 0
                            ? [...new Set(formData.bygningsdeler.map(d => d.brannklasse).filter(Boolean))]
                            : formData.brannklasse ? [formData.brannklasse] : [];
                          
                          if (brannklasser.length > 1) {
                            return (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Velg brannklasser for strømforsyningskrav:</p>
                                {brannklasser.includes("BKL1") && (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="dorerStromforsyningBKL1"
                                      checked={formData.dorerStromforsyningBKL1}
                                      onCheckedChange={(checked) => setFormData({...formData, dorerStromforsyningBKL1: checked as boolean})}
                                    />
                                    <Label htmlFor="dorerStromforsyningBKL1" className="text-sm cursor-pointer">
                                      BKL1 (30 min)
                                    </Label>
                                  </div>
                                )}
                                {(brannklasser.includes("BKL2") || brannklasser.includes("BKL3")) && (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="dorerStromforsyningBKL2"
                                      checked={formData.dorerStromforsyningBKL2 || formData.dorerStromforsyningBKL3}
                                      onCheckedChange={(checked) => setFormData({...formData, dorerStromforsyningBKL2: checked as boolean, dorerStromforsyningBKL3: checked as boolean})}
                                    />
                                    <Label htmlFor="dorerStromforsyningBKL2" className="text-sm cursor-pointer">
                                      BKL2/3 (60 min)
                                    </Label>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="romningsvinduRelevant"
                            checked={formData.romningsvinduRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, romningsvinduRelevant: checked as boolean})}
                          />
                          <Label htmlFor="romningsvinduRelevant" className="text-sm cursor-pointer font-medium">
                            Evakuering via vindu er relevant
                          </Label>
                        </div>
                        {formData.romningsvinduRelevant && (
                          <div className="mt-3 ml-6 space-y-3 p-3 bg-muted/30 rounded-md">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Høyde over terreng (meter)</Label>
                                <Input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="f.eks. 3.5"
                                  value={formData.romningsvinduHoyde}
                                  onChange={(e) => setFormData({...formData, romningsvinduHoyde: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Avstand gulv til underkant vindu (meter)</Label>
                                <Input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1.2"
                                  placeholder="maks 1.0"
                                  value={formData.romningsvinduGulvAvstand}
                                  onChange={(e) => setFormData({...formData, romningsvinduGulvAvstand: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="romningsvinduHarStige"
                                  checked={formData.romningsvinduHarStige}
                                  onCheckedChange={(checked) => setFormData({...formData, romningsvinduHarStige: checked as boolean})}
                                />
                                <Label htmlFor="romningsvinduHarStige" className="text-xs cursor-pointer">
                                  Fastmontert stige med ryggbøyler til rømningsvindu
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="romningsvinduHarBalkong"
                                  checked={formData.romningsvinduHarBalkong}
                                  onCheckedChange={(checked) => setFormData({...formData, romningsvinduHarBalkong: checked as boolean})}
                                />
                                <Label htmlFor="romningsvinduHarBalkong" className="text-xs cursor-pointer">
                                  Utgang til balkong tilgjengelig
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Utganger beskrives</Label>
                        <Textarea 
                          value={formData.utgangBranncelle}
                          onChange={(e) => setFormData({...formData, utgangBranncelle: e.target.value})}
                        />
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('utgang-branncelle-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="utgang-branncelle-kommentar" className={formData.utgangBranncelleKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.utgangBranncelleKommentar}
                              onChange={(e) => setFormData({...formData, utgangBranncelleKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.11 § 11-14 Rømningsvei</Label>
                      </div>
                      
                      {/* Rom i rømningsvei maks 20 m² */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiRomMaks20"
                          checked={formData.romningsveiRomMaks20}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiRomMaks20: checked === true})}
                        />
                        <Label htmlFor="romningsveiRomMaks20" className="text-xs cursor-pointer">
                          Rom i rømningsvei maks 20 m² (resepsjon, vaktrom o.l.)
                        </Label>
                      </div>

                      {/* Oppholdsrom inntil 50 m² med E30 */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiRom50E30"
                          checked={formData.romningsveiRom50E30}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiRom50E30: checked === true})}
                        />
                        <Label htmlFor="romningsveiRom50E30" className="text-xs cursor-pointer">
                          Oppholdsrom inntil 50 m² med sprinkler og E30
                        </Label>
                      </div>

                      {/* Rømning mot flere trapperom */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiFlereTrapper"
                          checked={formData.romningsveiFlereTrapper}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiFlereTrapper: checked === true})}
                        />
                        <Label htmlFor="romningsveiFlereTrapper" className="text-xs cursor-pointer">
                          Rømning mot flere trapperom (30 m avstandskrav)
                        </Label>
                      </div>

                      {/* Transport av sengeliggende */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiSengeliggende"
                          checked={formData.romningsveiSengeliggende}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiSengeliggende: checked === true})}
                        />
                        <Label htmlFor="romningsveiSengeliggende" className="text-xs cursor-pointer">
                          Transport av sengeliggende personer
                        </Label>
                      </div>

                      {/* Samtidig rømning fra flere etasjer */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiSamtidigRomning"
                          checked={formData.romningsveiSamtidigRomning}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiSamtidigRomning: checked === true})}
                        />
                        <Label htmlFor="romningsveiSamtidigRomning" className="text-xs cursor-pointer">
                          Samtidig rømning fra flere etasjer
                        </Label>
                      </div>

                      {/* Korridor over 30 meter */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiKorridorOver30m"
                          checked={formData.romningsveiKorridorOver30m}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiKorridorOver30m: checked === true})}
                        />
                        <Label htmlFor="romningsveiKorridorOver30m" className="text-xs cursor-pointer">
                          Korridor er lengre enn 30 meter
                        </Label>
                      </div>

                      {/* Svalgang */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiSvalgang"
                          checked={formData.romningsveiSvalgang}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiSvalgang: checked === true})}
                        />
                        <Label htmlFor="romningsveiSvalgang" className="text-xs cursor-pointer">
                          Svalgang/altangang er relevant
                        </Label>
                      </div>

                      {/* Svalgang betingede alternativer */}
                      {formData.romningsveiSvalgang && (
                        <div className="ml-4 space-y-2 border-l-2 border-muted pl-3">
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Checkbox 
                              id="romningsveiSvalgangOver30m"
                              checked={formData.romningsveiSvalgangOver30m}
                              onCheckedChange={(checked) => setFormData({...formData, romningsveiSvalgangOver30m: checked === true})}
                            />
                            <Label htmlFor="romningsveiSvalgangOver30m" className="text-xs cursor-pointer">
                              Svalgang er lengre enn 30 meter
                            </Label>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Rømningsveier beskrives</Label>
                        <Textarea 
                          value={formData.romningsvei}
                          onChange={(e) => setFormData({...formData, romningsvei: e.target.value})}
                        />
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('romningsvei-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="romningsvei-kommentar" className={formData.romningsveiKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.romningsveiKommentar}
                              onChange={(e) => setFormData({...formData, romningsveiKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.12 § 11-15 Tilrettelegging for redning av husdyr</Label>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded mb-2">
                        <Checkbox 
                          id="husdyrRedningRelevant"
                          checked={formData.husdyrRedningRelevant}
                          onCheckedChange={(checked) => setFormData({...formData, husdyrRedningRelevant: checked === true})}
                        />
                        <Label htmlFor="husdyrRedningRelevant" className="text-xs cursor-pointer">
                          Bygget er beregnet for husdyrhold (driftsbygning med husdyrrom)
                        </Label>
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('husdyr-redning-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="husdyr-redning-kommentar" className={formData.husdyrRedningKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.husdyrRedningKommentar}
                              onChange={(e) => setFormData({...formData, husdyrRedningKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.13 § 11-16 Manuell slokking</Label>
                      </div>
                      {(() => {
                        const rk = parseInt(formData.risikoklasse.replace(/\D/g, ''), 10);
                        const isRK356 = [3, 5, 6].includes(rk);
                        const isRK124 = [1, 2, 4].includes(rk);
                        
                        return (
                          <>
                            <div className="text-xs text-muted-foreground mb-2">
                              {isRK356 
                                ? "Risikoklasse 3, 5 eller 6 krever brannslange. Du kan også legge til håndslokkeapparater."
                                : isRK124
                                  ? "Risikoklasse 1, 2 eller 4 krever håndslokkeapparat eller brannslange. Du kan velge å legge til brannslange."
                                  : "Velg risikoklasse for å se automatiske krav. Du kan også manuelt velge utstyrstyper nedenfor."
                              }
                            </div>
                            <div className="flex flex-col gap-2 p-2 bg-muted/50 rounded mb-2">
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="slokkeBrannslange"
                                  checked={isRK356 || formData.slokkeBrannslange}
                                  disabled={isRK356}
                                  onCheckedChange={(checked) => setFormData({...formData, slokkeBrannslange: checked === true})}
                                />
                                <Label htmlFor="slokkeBrannslange" className={`text-xs cursor-pointer ${isRK356 ? 'text-muted-foreground' : ''}`}>
                                  Brannslange {isRK356 && "(påkrevd for RK 3, 5, 6)"}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="slokkeHandslukker"
                                  checked={formData.slokkeHandslukker}
                                  onCheckedChange={(checked) => setFormData({...formData, slokkeHandslukker: checked === true})}
                                />
                                <Label htmlFor="slokkeHandslukker" className="text-xs cursor-pointer">
                                  Håndslokkeapparat {isRK124 && !isRK356 && "(minimum for RK 1, 2, 4)"}
                                </Label>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Slokkeutstyr beskrives</Label>
                        <Textarea 
                          value={formData.manuellSlokking}
                          onChange={(e) => setFormData({...formData, manuellSlokking: e.target.value})}
                        />
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('manuell-slokking-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="manuell-slokking-kommentar" className={formData.manuellSlokkingKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.manuellSlokkingKommentar}
                              onChange={(e) => setFormData({...formData, manuellSlokkingKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.14 § 11-17 Tilrettelegging for slokkemannskap</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id="byggOver23m"
                          checked={formData.byggOver23m}
                          onCheckedChange={(checked) => setFormData({...formData, byggOver23m: checked === true})}
                        />
                        <Label htmlFor="byggOver23m" className="text-sm font-medium">Bygget er over 23 meter</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id="slangeutlegg50m"
                          checked={formData.slangeutlegg50m}
                          onCheckedChange={(checked) => setFormData({...formData, slangeutlegg50m: checked === true})}
                        />
                        <Label htmlFor="slangeutlegg50m" className="text-sm font-medium">Alle deler av en etasje kan nås med maks 50 m slangeutlegg</Label>
                        <Label className="text-xs font-medium mb-1 block">Tilrettelegging for rednings- og slokkemannskap</Label>
                        <Textarea 
                          value={formData.redningsmannskap}
                          onChange={(e) => setFormData({...formData, redningsmannskap: e.target.value})}
                        />
                      </div>
                      <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById('redningsmannskap-kommentar'); if (el) el.classList.toggle('hidden'); }}>+ Kommentar</Button>
                        <div id="redningsmannskap-kommentar" className={formData.redningsmannskapKommentar ? "" : "hidden"}>
                          <div className="mt-2">
                            <Label className="text-xs font-medium mb-1 block">Kommentar / tilleggsbeskrivelse</Label>
                            <Textarea 
                              value={formData.redningsmannskapKommentar}
                              onChange={(e) => setFormData({...formData, redningsmannskapKommentar: e.target.value})}
                              placeholder="Legg til kommentar..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 4: Utførelses- og driftsfasen */}
                <AccordionItem value="kap4" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                      Utførelses- og driftsfasen
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">4.1 Utførelsesfasen</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Krav til utførelse</Label>
                        <Textarea 
                          value={formData.utfoerelse}
                          onChange={(e) => setFormData({...formData, utfoerelse: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">4.2 Driftsfasen</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Krav til drift og vedlikehold</Label>
                        <Textarea 
                          value={formData.drift}
                          onChange={(e) => setFormData({...formData, drift: e.target.value})}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 5: Revisjonshistorikk */}
                <AccordionItem value="kap5" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
                      Revisjonshistorikk
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Revisjonslogg</Label>
                      <Textarea 
                        value={formData.revisjon}
                        onChange={(e) => setFormData({...formData, revisjon: e.target.value})}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 6: Litteraturhenvisninger */}
                <AccordionItem value="kap6" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 text-blue-800">
                    <span className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
                      Litteraturhenvisninger
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">TEK17, VTEK17, NS 3901 osv.</Label>
                      <Textarea 
                        value={formData.litteratur || "TEK17 - Forskrift om tekniske krav til byggverk\nVTEK17 - Veiledning til teknisk forskrift\nNS 3901 - Krav til risikovurdering av brann i byggverk"}
                        onChange={(e) => setFormData({...formData, litteratur: e.target.value})}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Fravik */}
                <AccordionItem value="fravik" className="border-2 border-amber-500/30 rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold bg-amber-500/10 hover:bg-amber-500/15 px-4 py-3 text-amber-700">
                    <span className="flex items-center gap-3">
                      <span className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">!</span>
                      Fravik og kompenserende tiltak
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Beskriv eventuelle fravik og kompenserende tiltak (valgfritt)</Label>
                      <Textarea 
                        value={formData.fravik}
                        onChange={(e) => setFormData({...formData, fravik: e.target.value})}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>
          </ScrollArea>
        </CardContent>
        <div className="flex-shrink-0 border-t bg-background p-4 flex flex-col gap-2">
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
            size="lg"
            onClick={handleSave}
            disabled={isSaving || !conceptName}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Lagrer..." : "Lagre endringer"}
          </Button>
          <SendToKSDialog
            conceptName={conceptName}
            projectId={selectedProjectId}
            conceptId={conceptId}
            conceptContent={formData}
            disabled={!conceptName}
          />
          <UpdateKSButton
            conceptId={conceptId}
            conceptName={conceptName}
            conceptContent={formData}
            disabled={!conceptName}
          />
        </div>
      </Card>

              {/* Generated Output */}
              <Card className="shadow-medium flex flex-col overflow-hidden lg:sticky lg:top-4">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Generert konsept</CardTitle>
                      <CardDescription>
                        Forhåndsvisning av brannkonseptet
                      </CardDescription>
                    </div>
                    {generatedConcept && (
                      <Button variant="outline" size="sm" onClick={exportToWord}>
                        <Download className="h-4 w-4 mr-2" />
                        Last ned Word
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                    <div className="px-6 pb-6">
                      {renderPreview()}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Konsept;
