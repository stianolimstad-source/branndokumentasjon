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
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

  // Kun preakseptert gir tiltaksklasse 1 eller 2
  if (prosjekteringsmetode !== "preakseptert") {
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
    avgrensning: "",
    // 2. Grunnlag og forutsetninger
    grunnlagsdokumenter: [] as Array<{navn: string, dato: string}>,
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
    eksplosjonRelevant: "", // "relevant" eller "ikke_relevant"
    eksplosjon: "",
    bygningshoyde: "", // Høyde på bygget i meter
    spesifikkBrannenergi: "", // For brannvegg: "inntil400", "400-600", "600-800"
    brannspredning: "",
    brannspredningKommentar: "",
    brannseksjonBrannenergi: "", // "over400", "50-400", "under50"
    brannseksjonTiltak: "", // "normalt", "brannalarm", "sprinkler", "roykventilasjon"
    brannseksjoner: "",
    brannseksjonerKommentar: "",
    brannceller: "",
    branncellerKommentar: "",
    fyrromRelevant: "nei" as "ja" | "nei",
    fyrromKw: "" as "" | "fast" | "under50" | "50-100" | "over100" | "ukjent",
    heismaskinromRelevant: "ja" as "ja" | "nei",
    branncelleTyper: [] as string[],
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
  
  useEffect(() => {
    if (beregnetBrannklasseResult.brannklasse) {
      setFormData(prev => ({
        ...prev, 
        brannklasse: beregnetBrannklasseResult.brannklasse,
        brannklasseUnntak: beregnetBrannklasseResult.brannklasseUnntak || "",
        brannklasseBegrunnelse: "",
      }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal]);

  // Automatisk generering av bæreevne tekst
  useEffect(() => {
    const result = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer);
    if (result.tekst) {
      setFormData(prev => ({ 
        ...prev, 
        baereevne: result.tekst,
        baereevneUnntak: result.anvendteUnntak
      }));
    }
  }, [formData.brannklasse, formData.risikoklasse, formData.etasjer]);


  // Automatisk tiltaksklasse
  useEffect(() => {
    const effBkl = beregnetBrannklasseResult.brannklasse || formData.brannklasse;
    const nyTiltaksklasse = getTiltaksklasse(effBkl, formData.risikoklasse, formData.prosjekteringsmetode);
    if (nyTiltaksklasse && nyTiltaksklasse !== formData.tiltaksklasse) {
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
                .map((navn: string) => ({ navn, dato: "" }))
            : [];
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

  const renderPreview = () => {
    return (
      <div className="bg-white text-black p-8 rounded-lg shadow-inner font-serif text-sm" style={{ minHeight: '600px' }}>
        <h1 className="text-xl font-bold text-center mb-6 pb-4">
          BRANNKONSEPT
        </h1>
        
        {/* Innholdsfortegnelse */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">Innholdsfortegnelse</h2>
          <div className="space-y-1 text-xs">
            <p><span className="font-bold">1.</span> Innledning</p>
            <p className="ml-4">1.1 Informasjon om tiltaket</p>
            <p className="ml-4">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</p>
            <p className="ml-4">1.3 Prosjekteringsmetode</p>
            <p className="ml-4">1.4 Avgrensning av tiltak</p>
            <p className="ml-4">1.5 Gjeldende regelverk</p>
            <p><span className="font-bold">2.</span> Grunnlag og forutsetninger for brannteknisk prosjektering</p>
            <p className="ml-4">2.1 Grunnlagsdokumenter</p>
            <p className="ml-4">2.2 Beskrivelse av bygning og branntekniske forutsetninger</p>
            <p className="ml-4">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</p>
            <p><span className="font-bold">3.</span> Beskrivelse av branntekniske ytelseskrav</p>
            <p className="ml-4">3.1 § 11-4 Bæreevne og stabilitet</p>
            <p className="ml-4">3.2 § 11-5 Sikkerhet ved eksplosjon</p>
            <p className="ml-4">3.3 § 11-6 Tiltak mot brannspredning mellom byggverk</p>
            <p className="ml-4">3.4 § 11-7 Brannseksjoner</p>
            <p className="ml-4">3.5 § 11-8 Brannceller</p>
            <p className="ml-4">3.6 § 11-9 Materialer og produkters egenskaper ved brann</p>
            <p className="ml-4">3.7 § 11-10 Tekniske installasjoner</p>
            <p className="ml-4">3.8 § 11-11 Generelle krav om rømning og redning</p>
            <p className="ml-4">3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider</p>
            <p className="ml-4">3.10 § 11-13 Utgang fra branncelle</p>
            <p className="ml-4">3.11 § 11-14 Rømningsvei</p>
            <p className="ml-4">3.12 § 11-16 Tilrettelegging for manuell slokking</p>
            <p className="ml-4">3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap</p>
            <p><span className="font-bold">4.</span> Utførelses- og driftsfasen</p>
            <p className="ml-4">4.1 Utførelsesfasen</p>
            <p className="ml-4">4.2 Driftsfasen</p>
            <p><span className="font-bold">5.</span> Revisjonshistorikk</p>
            <p><span className="font-bold">6.</span> Litteraturhenvisninger</p>
          </div>
        </section>

        <hr className="my-6 border-gray-300" />

        {/* 1. Innledning */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">1. Innledning</h2>
          
          <h3 className="font-semibold mb-2">1.1 Informasjon om tiltaket</h3>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold w-1/3">Oppdragsgiver</td>
                <td className="border border-gray-400 p-2">{formData.oppdragsgiver || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Prosjektnavn</td>
                <td className="border border-gray-400 p-2">{formData.prosjektnavn || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Adresse</td>
                <td className="border border-gray-400 p-2">{formData.adresse || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Gnr/Bnr</td>
                <td className="border border-gray-400 p-2">{formData.gnr || formData.bnr ? `${formData.gnr || "—"}/${formData.bnr || "—"}` : "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Kommune</td>
                <td className="border border-gray-400 p-2">{formData.kommune || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Type tiltak</td>
                <td className="border border-gray-400 p-2">{formData.tiltakstype || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Beskrivelse av tiltaket</td>
                <td className="border border-gray-400 p-2">{formData.tiltaksbeskrivelse || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Særskilt brannobjekt</td>
                <td className="border border-gray-400 p-2">{formData.saerskiltBrannobjekt || "[Angis]"}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-semibold mb-2">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</h3>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold w-1/3">Tiltakshaver</td>
                <td className="border border-gray-400 p-2">{formData.tiltakshaver || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Ansvarlig søker (SØK)</td>
                <td className="border border-gray-400 p-2">{formData.ansvarligSoker || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Kunde</td>
                <td className="border border-gray-400 p-2">{formData.kunde || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">PRO RiBr</td>
                <td className="border border-gray-400 p-2">{formData.proRibr || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">KPR RiBr</td>
                <td className="border border-gray-400 p-2">{formData.kprRibr || "[Angis]"}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-semibold mb-2">1.3 Prosjekteringsmetode</h3>
          <p className="ml-4 mb-2">
            {formData.prosjekteringsmetode === "preakseptert" && "Prosjekteringen er basert på preaksepterte ytelser i henhold til VTEK17."}
            {formData.prosjekteringsmetode === "analyse" && "Prosjekteringen er basert på analyse (fraviksprosjektering)."}
            {formData.prosjekteringsmetode === "blanding" && "Prosjekteringen er basert på en blandingsløsning med preaksepterte ytelser og analyse."}
          </p>
          {(formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") && (
            <div className="ml-4 mb-3">
              <p className="font-medium text-xs mb-1">Beskrivelse av fravik:</p>
              <p className="text-xs">{formData.fravikBeskrivelse || "[Fraviksbeskrivelse angis]"}</p>
              {formData.tiltaksklasse === "Tiltaksklasse 1" && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800">
                  <strong>Merk:</strong> Prosjektet er i tiltaksklasse 1. Fravik fra preaksepterte ytelser krever normalt høyere tiltaksklasse.
                </div>
              )}
            </div>
          )}

          <h3 className="font-semibold mb-2">1.4 Avgrensning av tiltak</h3>
          <p className="ml-4 mb-3">{formData.avgrensning || "[Avgrensning beskrives]"}</p>

          <h3 className="font-semibold mb-2">1.5 Gjeldende regelverk</h3>
          <ul className="ml-4 mb-3 list-disc list-inside">
            <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
            <li>VTEK17 - Veiledning til teknisk forskrift</li>
          </ul>
        </section>

        {/* 2. Grunnlag og forutsetninger */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">2. Grunnlag og forutsetninger for brannteknisk prosjektering</h2>
          
          <h3 className="font-semibold mb-2">2.1 Grunnlagsdokumenter</h3>
          {Array.isArray(formData.grunnlagsdokumenter) && formData.grunnlagsdokumenter.length > 0 ? (
            <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Dokument</th>
                  <th className="border border-gray-400 p-2 text-left">Dato</th>
                </tr>
              </thead>
              <tbody>
                {formData.grunnlagsdokumenter.map((doc, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-2">{doc.navn || "-"}</td>
                    <td className="border border-gray-400 p-2">{doc.dato || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="ml-4 mb-3">[Liste over tegninger og dokumenter]</p>
          )}

          <h3 className="font-semibold mb-2">2.2 Beskrivelse av bygning og branntekniske forutsetninger</h3>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold w-1/3">Bygningstype</td>
                <td className="border border-gray-400 p-2">{formData.bygningstype || "[Angis]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Bruttoareal</td>
                <td className="border border-gray-400 p-2">{formData.areal || "[Angis]"} m²</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Antall etasjer</td>
                <td className="border border-gray-400 p-2">{formData.etasjer || "[Angis]"}</td>
              </tr>
            </tbody>
          </table>
          {formData.harFlereRisikoklasser && formData.bygningsdeler.length > 0 ? (
            /* Visning for flere risikoklasser */
            <>
              <p className="ml-4 mb-2 text-xs italic">Bygget inneholder flere bygningsdeler med ulike risikoklasser:</p>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left">Bygningsdel</th>
                    <th className="border border-gray-400 p-2 text-left">Bygningstype</th>
                    <th className="border border-gray-400 p-2 text-left">Areal</th>
                    <th className="border border-gray-400 p-2 text-left">Etasjer</th>
                    <th className="border border-gray-400 p-2 text-left">Risikoklasse</th>
                    <th className="border border-gray-400 p-2 text-left">Brannklasse</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.bygningsdeler.map((del, index) => {
                    const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                    return (
                      <tr key={del.id || index}>
                        <td className="border border-gray-400 p-2">{del.navn || `Del ${index + 1}`}</td>
                        <td className="border border-gray-400 p-2">{del.bygningstype || "-"}</td>
                        <td className="border border-gray-400 p-2">{del.areal ? `${del.areal} m²` : "-"}</td>
                        <td className="border border-gray-400 p-2">{del.etasjer || "-"}</td>
                        <td className="border border-gray-400 p-2">{del.risikoklasse || "-"}</td>
                        <td className="border border-gray-400 p-2">{delBrannklasse || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold w-1/3">Tiltaksklasse</td>
                    <td className="border border-gray-400 p-2">{formData.tiltaksklasse || "[Angis]"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-semibold w-1/3">Bæresystem</td>
                    <td className="border border-gray-400 p-2">{formData.baeresystem || "[Angis]"}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            /* Standard visning - én risikoklasse */
            <table className="w-full border-collapse border border-gray-400 text-xs mb-3">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold w-1/3">Risikoklasse</td>
                  <td className="border border-gray-400 p-2">{formData.risikoklasse || "[Angis]"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Brannklasse</td>
                  <td className="border border-gray-400 p-2">
                    {formData.brannklasse || "[Angis]"}
                    {formData.brannklasseUnntak && (
                      <span className="block text-blue-600 text-xs mt-1 italic">{formData.brannklasseUnntak}</span>
                    )}
                </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Tiltaksklasse</td>
                  <td className="border border-gray-400 p-2">{formData.tiltaksklasse || "[Angis]"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold">Bæresystem</td>
                  <td className="border border-gray-400 p-2">{formData.baeresystem || "[Angis]"}</td>
                </tr>
              </tbody>
            </table>
          )}

          <h3 className="font-semibold mb-2">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</h3>
          <p className="ml-4 mb-3">[Eventuelle tilleggskrav beskrives]</p>
        </section>

        {/* 3. Branntekniske ytelseskrav */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">3. Beskrivelse av branntekniske ytelseskrav</h2>
          
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <tbody>
              {/* 3.1 § 11-4 Bæreevne og stabilitet - kun når flere risikoklasser */}
              {formData.harFlereRisikoklasser && formData.bygningsdeler.length > 0 ? (
                <>
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                  3.1 &nbsp;&nbsp; §11-4 Bæreevne og stabilitet
                </td>
              </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                    <th className="border border-gray-400 p-2 text-left">Løsning</th>
                    <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2">Generelt</td>
                    <td className="border border-gray-400 p-2">
                      Balkonger og utkragede bygningsdeler o.l. må ha forsvarlig innfesting for å hindre nedfall som kan skade rednings- og slokkemannskapene og deres materiell under førsteinnsatsen.
                    </td>
                    <td className="border border-gray-400 p-2">RIB</td>
                  </tr>
                  {formData.bygningsdeler.map((del, index) => {
                    const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                    const bklNum = delBrannklasse?.replace("BKL", "") || "1";
                    
                    const krav: Record<string, { hovedsystem: string; sekundaer: string; etasjeskiller: string; trappeløp: string; utvendig: string; kjeller: string; tak: string }> = {
                      "1": { hovedsystem: "R 30", sekundaer: "R 30", etasjeskiller: "R 30", trappeløp: "-", utvendig: "-", kjeller: "R 60 A2-s1,d0", tak: "R 30" },
                      "2": { hovedsystem: "R 60", sekundaer: "R 60", etasjeskiller: "R 60", trappeløp: "R 30", utvendig: "R 30 / A2-s1,d0", kjeller: "R 90 A2-s1,d0", tak: "R 60" },
                      "3": { hovedsystem: "R 90 A2-s1,d0", sekundaer: "R 60 A2-s1,d0", etasjeskiller: "R 60 A2-s1,d0", trappeløp: "R 30 A2-s1,d0", utvendig: "A2-s1,d0", kjeller: "R 120 A2-s1,d0", tak: "R 60 A2-s1,d0" },
                      "4": { hovedsystem: "R 120 A2-s1,d0", sekundaer: "R 90 A2-s1,d0", etasjeskiller: "R 90 A2-s1,d0", trappeløp: "R 60 A2-s1,d0", utvendig: "A2-s1,d0", kjeller: "R 120 A2-s1,d0", tak: "R 90 A2-s1,d0" },
                    };
                    
                    const delKrav = krav[bklNum] || krav["1"];
                    const delNavn = del.navn || `Del ${index + 1}`;
                    
                    return (
                      <React.Fragment key={del.id || index}>
                        {index === 0 && (
                          <tr className="bg-blue-50">
                            <td className="border border-gray-400 p-2 font-semibold" colSpan={3}>
                              Krav per bygningsdel:
                            </td>
                          </tr>
                        )}
                        <tr className="bg-blue-100">
                          <td className="border border-gray-400 p-2 font-semibold" colSpan={3}>
                            {delNavn} ({delBrannklasse})
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Bærende hovedsystem</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.hovedsystem}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Sekundære, bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.sekundaer}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Etasjeskiller</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.etasjeskiller}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Trappeløp</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.trappeløp}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Utvendig trapp</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.utvendig}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Plan under øverste kjeller</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.kjeller}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">Takkonstruksjon</td>
                          <td className="border border-gray-400 p-2 text-red-600 font-medium">{delKrav.tak}</td>
                          <td className="border border-gray-400 p-2">RIB</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {formData.baereevneKommentar && (
                    <tr>
                      <td className="border border-gray-400 p-2 italic text-sm" colSpan={3}>
                        Kommentar: {formData.baereevneKommentar}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold align-top" style={{width: '25%'}}>3.1 § 11-4 Bæreevne og stabilitet</td>
                  <td className="border border-gray-400 p-2" colSpan={2}>
                    {formData.baereevne || `Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann i henhold til brannklasse ${formData.brannklasse || "[angis]"}.`}
                    {formData.baereevneKommentar && <><br/><br/><span className="italic">Kommentar: {formData.baereevneKommentar}</span></>}
                  </td>
                </tr>
              )}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>
                  3.2 &nbsp;&nbsp; §11-5 Sikkerhet ved eksplosjon
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Eksplosjonsfare</td>
                <td className="border border-gray-400 p-2">
                  {formData.eksplosjonRelevant === "ikke_relevant" ? (
                    "RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket."
                  ) : formData.eksplosjonRelevant === "relevant" ? (
                    <div className="space-y-2">
                      <p className="font-semibold">Preaksepterte ytelser (jf. VTEK § 11-5):</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Rom hvor det kan forekomme fare for eksplosjon, må utgjøre en egen branncelle.</li>
                        <li>Rom hvor det kan forekomme fare for eksplosjon, må ha minst én trykkavlastningsflate.</li>
                        <li>Avlastet trykk må ledes bort i sikker retning.</li>
                        <li>Trykkavlastningsflater må ikke plasseres i takflater med mindre snølast ikke hindrer funksjon.</li>
                        <li>Bærende og branncellebegrensende bygningsdeler må forsterkes ved behov.</li>
                      </ol>
                    </div>
                  ) : "[Vurdering av eksplosjonsfare]"}
                  {formData.eksplosjonKommentar && <><br/><br/><span className="italic">Kommentar: {formData.eksplosjonKommentar}</span></>}
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.3 &nbsp;&nbsp; §11-6 Brannspredning mellom byggverk</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Bygningshøyde</td>
                <td className="border border-gray-400 p-2">{formData.bygningshoyde ? `${formData.bygningshoyde} meter` : "[Ikke angitt]"}</td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
              {parseFloat(formData.bygningshoyde) > 9 ? (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til brannvegg</td>
                    <td className="border border-gray-400 p-2">
                      Brannvegg (bygning over 9 meter)
                      {formData.spesifikkBrannenergi && (
                        <div className="mt-2">
                          <p className="font-semibold">Brannmotstand basert på spesifikk brannenergi:</p>
                          <p className="mt-1">
                            {formData.spesifikkBrannenergi === "inntil400" && "Inntil 400 MJ/m² → REI 120-M A2-s1,d0 [A 120]"}
                            {formData.spesifikkBrannenergi === "400-600" && "400-600 MJ/m² → REI 180-M A2-s1,d0 [A 180]"}
                            {formData.spesifikkBrannenergi === "600-800" && "600-800 MJ/m² → REI 240-M A2-s1,d0 [A 240]"}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIB</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Preaksepterte ytelser</td>
                    <td className="border border-gray-400 p-2">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Takkonstruksjonen må ikke være kontinuerlig over brannveggen.</li>
                        <li>Konstruksjoner inntil brannveggen må kunne bevege seg fritt ved temperaturendringer.</li>
                        <li>Brannveggens avslutning mot tak og fasade må hindre brannspredning.</li>
                        <li>Brannveggen må ha brannmotstand minst som angitt i tabell 1.</li>
                        <li>Brannveggen må bestå av materialer i klasse A2-s1,d0 [ubrennbare].</li>
                        <li>Uten dokumentert mekanisk motstandsevne (M): tunge materialer som mur/betong.</li>
                        <li>Brannveggen må føres min. 0,5 m over høyeste tilstøtende tak.</li>
                        <li>Brannveggen må bli stående selv om byggverket på én side raser sammen.</li>
                      </ol>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIB</td>
                  </tr>
                </>
              ) : parseFloat(formData.bygningshoyde) > 0 ? (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Krav til skillevegg</td>
                    <td className="border border-gray-400 p-2">
                      Branncellevegg (bygning under eller lik 9 meter). Avstanden mellom lave byggverk kan være mindre enn 8,0 meter når byggverkene er skilt med branncellebegrensende bygningsdel.
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIB</td>
                  </tr>
                  {formData.risikoklasse === "RK1" && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Unntak RK1</td>
                      <td className="border border-gray-400 p-2">
                        Byggverk i risikoklasse 1 med bruttoareal ≤ 50 m² og liten/middels brannenergi kan plasseres nærmere uten særlige tiltak. Ved avstand &lt; 2,0 m kreves branncellebegrensende bygningsdel.
                      </td>
                      <td className="border border-gray-400 p-2 align-top">RIBr</td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Generelt</td>
                  <td className="border border-gray-400 p-2">[Krav til brannspredning vurderes etter bygningshøyde]</td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.brannspredningKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.brannspredningKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.4 &nbsp;&nbsp; §11-7 Brannseksjoner</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Generelt krav</td>
                <td className="border border-gray-400 p-2">Byggverk må oppdeles i seksjoner minst som angitt i tabell 1.</td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
              {formData.risikoklasse === "RK6" && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Krav RK6</td>
                  <td className="border border-gray-400 p-2">Byggverk i risikoklasse 6 (sykehus, sykehjem, pleieinstitusjoner) må deles vertikalt i minst to brannseksjoner.</td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.risikoklasse === "RK3" && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Krav RK3</td>
                  <td className="border border-gray-400 p-2">Største bruttoareal per etasje for barnehager uten seksjonering er 600 m².</td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.brannseksjonTiltak === "brannalarm" && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Brannalarmanlegg</td>
                  <td className="border border-gray-400 p-2">Prosjekteres og utføres etter NS 3960:2019. Kategori 2 med direkte varsling til nødmeldesentral.</td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              )}
{formData.brannseksjonTiltak === "sprinkler" && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Sprinkleranlegg</td>
                  <td className="border border-gray-400 p-2">Prosjekteres etter NS-EN 12845:2015+A1:2019. Bolig: NS-EN 16925:2018. Vannforsyning min. 30/60 min.</td>
                  <td className="border border-gray-400 p-2 align-top">RIV</td>
                </tr>
              )}
              {formData.brannseksjonTiltak === "roykventilasjon" && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Røykventilasjon</td>
                  <td className="border border-gray-400 p-2">Prosjekteres og utføres etter NS-EN 12101-serien. Røykventilasjon skal dimensjoneres for å sikre røykfritt lag i rømningsvei.</td>
                  <td className="border border-gray-400 p-2 align-top">RIV</td>
                </tr>
              )}
              {formData.brannseksjonBrannenergi && formData.brannseksjonTiltak && (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Spesifikk brannenergi</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannseksjonBrannenergi === "over400" && "Over 400 MJ/m²"}
                      {formData.brannseksjonBrannenergi === "50-400" && "50–400 MJ/m²"}
                      {formData.brannseksjonBrannenergi === "under50" && "Under 50 MJ/m²"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Tiltak</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannseksjonTiltak === "normalt" && "Normalt (ingen tiltak)"}
                      {formData.brannseksjonTiltak === "brannalarm" && "Med brannalarmanlegg"}
                      {formData.brannseksjonTiltak === "sprinkler" && "Med sprinkleranlegg"}
                      {formData.brannseksjonTiltak === "roykventilasjon" && "Med røykventilasjon"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Største bruttoareal pr. etasje</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannseksjonBrannenergi === "over400" && formData.brannseksjonTiltak === "normalt" && "800 m²"}
                      {formData.brannseksjonBrannenergi === "over400" && formData.brannseksjonTiltak === "brannalarm" && "1 200 m²"}
                      {formData.brannseksjonBrannenergi === "over400" && formData.brannseksjonTiltak === "sprinkler" && "5 000 m²"}
                      {formData.brannseksjonBrannenergi === "over400" && formData.brannseksjonTiltak === "roykventilasjon" && <span className="text-red-600">Uegnet</span>}
                      {formData.brannseksjonBrannenergi === "50-400" && formData.brannseksjonTiltak === "normalt" && "1 200 m²"}
                      {formData.brannseksjonBrannenergi === "50-400" && formData.brannseksjonTiltak === "brannalarm" && "1 800 m²"}
                      {formData.brannseksjonBrannenergi === "50-400" && formData.brannseksjonTiltak === "sprinkler" && "10 000 m²"}
                      {formData.brannseksjonBrannenergi === "50-400" && formData.brannseksjonTiltak === "roykventilasjon" && "4 000 m²"}
                      {formData.brannseksjonBrannenergi === "under50" && formData.brannseksjonTiltak === "normalt" && "1 800 m²"}
                      {formData.brannseksjonBrannenergi === "under50" && formData.brannseksjonTiltak === "brannalarm" && "2 700 m²"}
                      {formData.brannseksjonBrannenergi === "under50" && formData.brannseksjonTiltak === "sprinkler" && "Ubegrenset"}
                      {formData.brannseksjonBrannenergi === "under50" && formData.brannseksjonTiltak === "roykventilasjon" && "10 000 m²"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIBr</td>
                  </tr>
                  {formData.areal && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Prosjektert areal</td>
                      <td className="border border-gray-400 p-2">{formData.areal} m²</td>
                      <td className="border border-gray-400 p-2 align-top">-</td>
                    </tr>
                  )}
                </>
              )}
              {formData.brannseksjoner && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                  <td className="border border-gray-400 p-2">{formData.brannseksjoner}</td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.brannseksjonerKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.brannseksjonerKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.5 &nbsp;&nbsp; §11-8 Brannceller</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              {/* Generert krav basert på brannklasse - § 11-8 Tabell 1 */}
              {formData.brannklasse && (
                <>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Branncellebegrensende bygningsdel - generelt</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                      {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                      {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Bygningsdel som omslutter trapperom, heissjakt og installasjonssjakter over flere plan</td>
                    <td className="border border-gray-400 p-2 font-semibold">
                      {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                      {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                      {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                  </tr>
                  {formData.heismaskinromRelevant === "ja" && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Heismaskinrom</td>
                      <td className="border border-gray-400 p-2 font-semibold">
                        {formData.brannklasse === "BKL1" && "EI 60 [B 60]"}
                        {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                        {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                      </td>
                      <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                    </tr>
                  )}
                  {formData.fyrromRelevant === "ja" && (
                    <>
                      {(formData.fyrromKw === "fast" || formData.fyrromKw === "ukjent") && (
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Fyrrom for sentralvarmeanlegg eller varmluftsaggregat for fast brensel</td>
                          <td className="border border-gray-400 p-2 font-semibold">
                            {formData.brannklasse === "BKL1" && "EI 60 [B 60]"}
                            {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                            {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                        </tr>
                      )}
                      {(formData.fyrromKw === "under50" || formData.fyrromKw === "ukjent") && (
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Fyrrom for flytende/gassformig brensel (P &lt; 50 kW) - kun kledning/overflate</td>
                          <td className="border border-gray-400 p-2 font-semibold">
                            K₂10 A2-s1,d0 [K1-A]
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                        </tr>
                      )}
                      {(formData.fyrromKw === "50-100" || formData.fyrromKw === "ukjent") && (
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Fyrrom for flytende/gassformig brensel (50 kW ≤ P ≤ 100 kW)</td>
                          <td className="border border-gray-400 p-2 font-semibold">
                            {formData.brannklasse === "BKL1" && "EI 30 [B 30]"}
                            {formData.brannklasse === "BKL2" && "EI 60 [B 60]"}
                            {formData.brannklasse === "BKL3" && "EI 60 A2-s1,d0 [A 60]"}
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                        </tr>
                      )}
                      {(formData.fyrromKw === "over100" || formData.fyrromKw === "ukjent") && (
                        <tr>
                          <td className="border border-gray-400 p-2 align-top">Fyrrom for flytende/gassformig brensel (P &gt; 100 kW)</td>
                          <td className="border border-gray-400 p-2 font-semibold">
                            EI 60 A2-s1,d0 [A 60]
                          </td>
                          <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                        </tr>
                      )}
                    </>
                  )}
                  <tr>
                    <td className="border border-gray-400 p-2" colSpan={3}>
                      <p className="text-xs text-gray-600 italic">Jf. § 11-8 Tabell 1: Brannmotstand til branncellebegrensende bygningsdeler</p>
                    </td>
                  </tr>
                </>
              )}
              {/* Valgte branncelle-typer */}
              {formData.branncelleTyper.length > 0 && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Følgende rom/lokaler skal være egne brannceller</td>
                  <td className="border border-gray-400 p-2">
                    <ul className="list-none space-y-1">
                      {formData.branncelleTyper.map((typeId) => {
                        const type = branncelleTyperListe.find(t => t.id === typeId);
                        return type ? (
                          <li key={typeId} className="text-sm">{type.label}</li>
                        ) : null;
                      })}
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
                </tr>
              )}
              {formData.branncellerKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.branncellerKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.6 &nbsp;&nbsp; §11-9 Materialer og produkters egenskaper ved brann</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              
              {/* Overflater i brannceller som ikke er rømningsvei */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Overflater i brannceller som ikke er rømningsvei</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle inntil 200 m²</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">D-s2,d0 [In 2]</span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak i branncelle over 200 m²</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">
                    {formData.brannklasse === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]"}
                  </span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater i sjakter og hulrom</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">
                    {formData.brannklasse === "BKL1" ? "B-s1,d0 [In 1]" : "B-s1,d0 [In 1]"}
                  </span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              
              {/* Overflater i brannceller som er rømningsvei */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Overflater i brannceller som er rømningsvei</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater på vegger og i himling/tak</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">B-s1,d0 [In 1]</span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater på gulv</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">D<sub>fl</sub>-s1 [G]</span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              
              {/* Utvendige overflater */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Utvendige overflater</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater på ytterkledning</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">
                    {formData.brannklasse === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]"}
                  </span>
                  {/* Unntak for BKL2/BKL3 med RK 1, 2 eller 4 og maks 4 etasjer */}
                  {(formData.brannklasse === "BKL2" || formData.brannklasse === "BKL3") && (
                    (() => {
                      const rk = parseInt(formData.risikoklasse.replace(/\D/g, ''), 10);
                      const floors = parseInt(formData.etasjer, 10);
                      const harUnntak = [1, 2, 4].includes(rk) && floors <= 4;
                      
                      if (harUnntak) {
                        return (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Unntak:</p>
                            <p>Yttervegg i byggverk i brannklasse 2 og 3 kan ha utvendig overflate som tilfredsstiller klasse <span className="text-red-600 font-medium">D-s3,d0 [Ut 2]</span>, når byggverket er i risikoklasse 1, 2 eller 4 og har inntil fire etasjer, og det er liten fare for brannspredning til og fra nabobyggverk.</p>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              
              {/* Overflater i hulrom */}
              <tr>
                <td className="border border-gray-400 p-2 align-top">Overflater i hulrom i ytterveggkonstruksjoner</td>
                <td className="border border-gray-400 p-2">
                  <p>Overflater i hulrom i ytterveggkonstruksjoner betraktes på samme måte som utvendig overflate og må ha minst like gode branntekniske egenskaper.</p>
                  {/* Unntak for BKL1 og boliger inntil 3 etasjer */}
                  {(() => {
                    const rk = parseInt(formData.risikoklasse.replace(/\D/g, ''), 10);
                    const floors = parseInt(formData.etasjer, 10);
                    const erBolig = rk === 4;
                    const harUnntak = formData.brannklasse === "BKL1" || (erBolig && floors <= 3);
                    
                    if (harUnntak) {
                      return (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Unntak:</p>
                          <p>Byggverk i brannklasse 1 {erBolig && floors <= 3 && "og boliger inntil 3 etasjer"} kan ha uklassifiserte overflater i hulrom.</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              
              {/* Kledninger */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Kledninger</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kledning i branncelle inntil 200 m² som ikke er rømningsvei</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">K<sub>2</sub>10 D-s2,d0 [K2]</span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kledning i branncelle over 200 m² som ikke er rømningsvei</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">
                    {formData.brannklasse === "BKL1" ? "K₂10 D-s2,d0 [K2]" : "K₂10 B-s1,d0 [K1]"}
                  </span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kledning i branncelle som er rømningsvei</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">
                    {formData.brannklasse === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]"}
                  </span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Kledning i sjakter og hulrom</td>
                <td className="border border-gray-400 p-2">
                  <span className="text-red-600 font-medium">
                    {formData.brannklasse === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]"}
                  </span>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              
              {/* Taktekning */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Taktekning</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Taktekning</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Taktekning kan bidra til brannspredning i et byggverk og mellom ulike byggverk.</p>
                  <p className="font-medium mb-1">Preaksepterte ytelser</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Taktekning må tilfredsstille klasse <span className="text-red-600 font-medium">B<sub>ROOF</sub>(t2) [Ta]</span>.</li>
                    <li>Teglstein, betongtakstein, skifertak og metallplater kan uten ytterligere dokumentasjon antas å tilfredsstille klasse B<sub>ROOF</sub>(t2) [Ta].</li>
                    <li>For småhus kan taktekning være uklassifisert der avstanden mellom de enkelte byggverk er minst 8 m.</li>
                    <li>Ett-sjikts tak av duk og folie må tilfredsstille klasse <span className="text-red-600 font-medium">B-s3,d0 (Ut1)</span>.</li>
                  </ol>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>

              {formData.materialerKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.materialerKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              {/* Isolasjon */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>Isolasjon</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Isolasjon</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Isolasjonsmaterialer kan bidra til brannspredning og røykutvikling i et byggverk.</p>
                  
                  <p className="font-medium mb-1">Preaksepterte ytelser</p>
                  <ol className="list-decimal ml-4 space-y-2">
                    <li>Isolasjon må tilfredsstille klasse <span className="text-red-600 font-medium">A2-s1,d0</span> med mindre annet er angitt i nr. 2 til 9.</li>
                    
                    {/* Sandwichelementer (punkt 2-5) - kun hvis relevant */}
                    {formData.isolasjonSandwich === "relevant" && (
                      <>
                        <li>Produkter (sandwichelementer) som tilfredsstiller klasse B-s1,d0 eller Eurefic-klasse A, kan benyttes i byggverk i risikoklasse 1–4 i brannklasse 1 og i industri- og lagerbygninger i brannklasse 2. For tak gjelder nr. 6 og 7.</li>
                        <li>Produkter (sandwichelementer) som tilfredsstiller klasse D-s2,d0 eller Eurefic-klasse E, kan benyttes i industri- og lagerbygninger i brannklasse 1. For tak gjelder nr. 6 og 7.</li>
                        <li>Produkter (sandwichelementer) som ikke tilfredsstiller klasse A2-s1,d0 må være beskyttet av kledning K<sub>2</sub>10 A2-s1,d0 [K1-A] mot rømningsveier.</li>
                        <li>Produkter (sandwichelementer) for små kjøle- og fryserom i risikoklasse 4 kan ha uspesifisert ytelse.</li>
                      </>
                    )}
                    
                    {/* Brennbar isolasjon (punkt 6-9) - kun hvis relevant */}
                    {formData.isolasjonBrennbar === "relevant" && (
                      <>
                        <li>Brennbar isolasjon kan benyttes på oversiden av etasjeskiller mot oppforet tak eller loft som bare kan benyttes som lager, forutsatt at:
                          <ol className="list-decimal ml-4 mt-1">
                            <li>etasjeskilleren mot oppforet tak eller loft er branncellebegrensende bygningsdel dimensjonert for tosidig brannpåkjenning</li>
                            <li>takkonstruksjonen over etasjeskilleren ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen</li>
                          </ol>
                        </li>
                        <li>Brennbar isolasjon kan benyttes i isolerte takflater forutsatt at:
                          <ol className="list-decimal ml-4 mt-1">
                            <li>isolasjonen legges på et bærende underlag som tilfredsstiller klasse A2-s1,d0 og som har dokumentert bæreevne under brann (R-klasse i samsvar med §11-4)</li>
                            <li>det bærende underlaget beskytter isolasjonen mot varmepåkjenning fra undersiden (for eksempel betongdekke). I brannklasse 1 og 2 kan alternativt den brennbare isolasjonen beskyttes på undersiden av isolasjon av klasse A2-s1,d0 med tilstrekkelig tykkelse til å isolere mot varmepåkjenning.</li>
                            <li>den brennbare isolasjonen er beskyttet på oversiden av isolasjon med tykkelse 30 mm og som tilfredsstiller klasse A2-s1,d0. Alternativt til beskyttelse på oversiden kan den brennbare isolasjonen oppdeles i arealer på inntil 400 m².</li>
                          </ol>
                        </li>
                        <li>Brennbar isolasjon kan benyttes som utvendig tilleggsisolering av yttervegger med unntak for i byggverk i brannklasse 3 og i byggverk i risikoklasse 6 forutsatt at:
                          <ol className="list-decimal ml-4 mt-1">
                            <li>det benyttes isolasjonssystemer som er dokumentert ved prøving etter <em>SP Fire 105: Large scale testing of facade systems (1994)</em> eller tilsvarende. Med isolasjonssystemer menes systemer som består av isolasjon og fasademateriale som monteres på et eksisterende underlag.</li>
                            <li>fasademateriale og isolasjon må være prøvet som en enhet. Underlaget må ha branntekniske egenskaper som minst tilsvarer det som ble benyttet ved prøving.</li>
                          </ol>
                        </li>
                        <li>Brennbar isolasjon basert på cellulose- eller tekstilfiber og lignende kan benyttes i byggverk i brannklasse 1, og boliger inntil 3 etasjer. Isolasjonen må tilfredsstille Euroklasse E, eller være i samsvar med <em>NT Fire 035: Building products: Flammability and smouldering resistance of loose-fill thermal insulation (1988)</em>. Isolasjonen kan være utildekket i kaldt uinnredet loft og oppforet tak.</li>
                      </>
                    )}
                    
                    {/* Melding hvis ingen av delene er relevante */}
                    {formData.isolasjonSandwich === "ikke_relevant" && formData.isolasjonBrennbar === "ikke_relevant" && (
                      <li className="text-gray-600 italic">Det er ikke planlagt bruk av sandwichelementer eller brennbar isolasjon i tiltaket. Kun hovedkravet om A2-s1,d0 gjelder.</li>
                    )}
                  </ol>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.7 &nbsp;&nbsp; §11-10 Tekniske installasjoner</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              
              {/* A. Ventilasjonsanlegg - kun hvis relevant */}
              {formData.ventilasjonRelevant && (
                <>
                  <tr className="bg-blue-100">
                    <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>A. Ventilasjonsanlegg</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Ventilasjonsanlegg</td>
                    <td className="border border-gray-400 p-2">
                      <p className="font-medium mb-1">Preaksepterte ytelser</p>
                      <ol className="list-decimal ml-4 space-y-2">
                        <li>Ventilasjonskanal som føres gjennom en brannskillende bygningsdel, må utføres slik at bygningsdelens brannmotstand blir opprettholdt.</li>
                        <li>Innfesting og oppheng for kanaler og ventilasjonsutstyr må utføres slik at forutsatt funksjonstid og brannmotstand blir opprettholdt.</li>
                        <li>Avtrekk fra komfyr må føres i egen kanal på grunn av fettavsetning fra matos. Avtrekk må ha fettfilter, og avtrekkskanalene må kunne rengjøres i hele sin lengde for å redusere faren for antennelse og brann.</li>
                        <li>Ventilasjonsanlegg må utføres i materialer som tilfredsstiller klasse <span className="text-red-600 font-medium">A2-s1,d0</span> [ubrennbare materialer]. For kanaler gjelder dette hele tverrsnittet (kanalgodset). Unntak kan gjøres for små komponenter som ikke bidrar til spredning av brann. Unntak for småhus er angitt i nr. 7 og 8. For isolasjon av kanaler vises til preaksepterte ytelser under C. Rør- og kanalisolasjon.</li>
                        {formData.ventKrav5 && (
                          <li>Avtrekkskanaler fra storkjøkken, frityreanlegg og lignende må utføres med brannmotstand <span className="text-red-600 font-medium">EI 30 A2-s1,d0</span> helt til utblåsningsristen, eventuelt føres i egen sjakt med samme brannmotstand.</li>
                        )}
                        {formData.ventKrav6 && (
                          <li>Avtrekkskanaler fra kjøkken i boenheter må utføres med brannmotstand <span className="text-red-600 font-medium">EI 15 A2-s1,d0</span> hvis de ikke ligger i sjakt. I tilslutning mellom komfyrhette og avtrekkskanal kan det benyttes fleksible kanaler.</li>
                        )}
                        {formData.ventKrav7 && (
                          <li>Fra kjøkken i småhus må det benyttes avtrekkskanal av materiale som tilfredsstiller klasse A2-s1,d0 [ubrennbart materiale], og lignende stål eller aluminium. I tilslutningen mellom komfyrhette og avtrekkskanal kan det benyttes fleksible kanaler.</li>
                        )}
                        {formData.ventKrav8 && (
                          <li>For småhus kan det også benyttes kanal av materialer som tilfredsstiller klasse E, samt fleksibel kanal av spiralfalset aluminium.</li>
                        )}
                        {formData.ventKrav9 && (
                          <li>Kanal som føres gjennom seksjoneringsvægg, må ha lukkeanordning (brannspjeld) med minimum samme brannmotstand som seksjoneringsvegg.</li>
                        )}
                      </ol>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIV</td>
                  </tr>
                </>
              )}
              
              {/* B. Vann- og avløpsrør, rørpostanlegg, sentralstøvsugeranlegg og lignende */}
              {formData.vannAvlopRelevant && (
                <>
                  <tr className="bg-blue-100">
                    <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>B. Vann- og avløpsrør, rørpostanlegg, sentralstøvsugeranlegg og lignende</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Rørgjennomføringer</td>
                    <td className="border border-gray-400 p-2">
                      <p className="font-medium mb-1">Preaksepterte ytelser</p>
                      <ol className="list-decimal ml-4 space-y-2">
                        <li>Rørgjennomføringer i brannskillende konstruksjoner må ha dokumentert brannmotstand, med unntak som angitt i nr. 2 og 3.</li>
                        <li>Plastrør med ytre diameter til og med 32 mm kan føres gjennom murte eller støpte konstruksjoner med brannmotstand inntil klasse <span className="text-red-600 font-medium">EI 90 A2-s1,d0 [A 90]</span> og gjennom isolerte lettvegger med brannmotstand inntil klasse <span className="text-red-600 font-medium">EI 60 A2-s1,d0 [A 60]</span> når det tettes rundt rørene med tettemasse. Tettemassen må være klassifisert for den aktuelle bruken og ha samme brannmotstand som konstruksjonen for øvrig.</li>
                        <li>Støpejernrør med ytre diameter til og med 110 mm kan føres gjennom murte eller støpte konstruksjoner med brannmotstand inntil klasse <span className="text-red-600 font-medium">EI 60 A2-s1,d0 [A 60]</span> når det tettes rundt rørene med tettemasse, eller støpes rundt, og konstruksjonen har tykkelse minst 180 mm. Tettemassen må være klassifisert for den aktuelle bruken og ha samme brannmotstand som konstruksjonen for øvrig. Avstanden fra røret til brennbart materiale må være minst 250 mm.</li>
                      </ol>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIV</td>
                  </tr>
                </>
              )}
              
              {/* C. Rør- og kanalisolasjon */}
              {formData.rorIsolasjonRelevant && (
                <>
                  <tr className="bg-blue-100">
                    <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>C. Rør- og kanalisolasjon</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Rør- og kanalisolasjon</td>
                    <td className="border border-gray-400 p-2">
                      <p className="font-medium mb-1">Preaksepterte ytelser</p>
                      <ol className="list-decimal ml-4 space-y-2">
                        <li>Dersom den samlede eksponerte overflaten av isolasjonen på rør og kanaler utgjør mer enn 20 prosent av tilgrensende vegg- eller himlingsflate, må isolasjonen tilfredsstille klasse <span className="text-red-600 font-medium">A2<sub>L</sub>-s1,d0</span> [ubrennbar eller begrenset brennbar] eller ha minst samme klasse som de tilgrensende overflatene.</li>
                        <li>Dersom den samlede eksponerte overflaten av isolasjonen utgjør mindre enn 20 prosent av tilgrensende vegg- eller himlingsflate, gjelder følgende:
                          <ol className="list-decimal ml-4 mt-2 space-y-1">
                            <li>Isolasjon på rør og kanaler i rømningsveier må minst tilfredsstille klasse <span className="text-red-600 font-medium">B<sub>L</sub>-s1,d0 [PI]</span>. Unntak gjelder isolasjon på enkeltstående rør eller kanal med ytre diameter til og med 200 mm som minst må tilfredsstille klasse C<sub>L</sub>-s3,d0 [PII].</li>
                            <li>Isolasjon på rør og kanaler som er lagt i sjakt, i hulrom og bak nedforet himling med branncellebegrensende funksjon, må minst tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                            {/* Punkt 2.3: Gjelder RK 3, 5, 6 ELLER BKL 2, 3 */}
                            {(["RK3", "RK5", "RK6"].includes(formData.risikoklasse) || ["BKL2", "BKL3"].includes(formData.brannklasse)) && (
                              <li>Øvrig isolasjon på rør og kanaler i byggverk i risikoklasse 3, 5 og 6, og i byggverk i brannklasse 2 og 3 må minst tilfredsstille klasse <span className="text-red-600 font-medium">C<sub>L</sub>-s3,d0 [PII]</span>.</li>
                            )}
                            {/* Punkt 2.4: Gjelder RK 1, 2, 4 i BKL 1 */}
                            {(["RK1", "RK2", "RK4"].includes(formData.risikoklasse) && formData.brannklasse === "BKL1") && (
                              <li>Øvrig isolasjon på rør og kanaler i byggverk i risikoklasse 1, 2 og 4 i brannklasse 1 må minst tilfredsstille klasse <span className="text-red-600 font-medium">D<sub>L</sub>-s3,d0 [PIII]</span>.</li>
                            )}
                          </ol>
                        </li>
                      </ol>
                      <p className="mt-3 text-sm text-gray-600 italic">Den flaten der rør eller kanal er innfestet, regnes som tilgrensede vegg- eller himlingsflate. For vertikale rør og kanaler er det veggflaten som skal legges til grunn.</p>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIV</td>
                  </tr>
                </>
              )}
              
              {/* D. Elektriske installasjoner */}
              {formData.elektriskRelevant && (
                <>
                  <tr className="bg-blue-100">
                    <td className="border border-gray-400 p-2 align-top font-semibold" colSpan={3}>D. Elektriske installasjoner</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Elektriske installasjoner</td>
                    <td className="border border-gray-400 p-2">
                      <p className="text-sm text-gray-600 mb-3">Klasser for ulike bruksområder for kabler er angitt i NEK 400 Elektriske lavspenningsinstallasjoner. For installasjoner for elektronisk kommunikasjon gjelder NEK 702 Informasjonsteknologi – Installasjon. Denne henviser til NEK 400.</p>
                      <p className="font-medium mb-1">Preaksepterte ytelser</p>
                      <ol className="list-decimal ml-4 space-y-2">
                        <li>Kabler må ikke legges over nedforet himling eller i hulrom i rømningsvei med mindre ett av følgende punkter er oppfylt:
                          <ol className="list-decimal ml-4 mt-2 space-y-1">
                            <li>kablene representerer liten brannenergi, det vil si mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter hulrom</span></li>
                            <li>kablene er ført i egen sjakt med sjaktvegger som har brannmotstand tilsvarende branncellebegrensende bygningsdel</li>
                            <li>himlingen har brannmotstand tilsvarende branncellebegrensende bygningsdel</li>
                            <li>hulrommet er sprinklet.</li>
                          </ol>
                        </li>
                        <li>Kabler som utgjør liten brannenergi, det vil si mindre enn ca. <span className="text-red-600 font-medium">50 MJ/løpemeter korridor eller hulrom</span>, kan føres ubeskyttet gjennom rømningsvei. Dette er et spesifikt unntak som gjelder kabler, og kan ikke brukes som begrunnelse for andre fravik fra preaksepterte ytelser.</li>
                      </ol>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">RIE</td>
                  </tr>
                </>
              )}
              
              {formData.installasjonerKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.installasjonerKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.8 &nbsp;&nbsp; §11-11 Generelle krav om rømning og redning</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Rømning og redning</td>
                <td className="border border-gray-400 p-2">
                  <p className="font-medium mb-2">Krav fra TEK17 §11-11</p>
                  <ul className="list-disc ml-4 space-y-3">
                    <li>Byggverk skal prosjekteres og utføres for rask og sikker rømning og redning. Det skal tas hensyn til personer med funksjonsnedsettelse.</li>
                    <li>Den tiden som er tilgjengelig for rømning, skal være større enn den tiden som er nødvendig for rømning fra byggverket. Det skal legges inn en tilfredsstillende sikkerhetsmargin.</li>
                    <li>Brannceller skal utformes og innredes slik at varsling, rømning og redning kan skje på en rask og effektiv måte.</li>
                    <li>Fluktvei fra oppholdssted til utgang fra en branncelle skal være oversiktlig og tilrettelagt for rask og effektiv rømning.</li>
                    <li>I den tiden en branncelle eller rømningsvei skal benyttes til rømning av personer, skal det ikke kunne forekomme temperaturer, røykgasskonsentrasjoner eller andre forhold som hindrer rømning.</li>
                    <li>Skilt, symbol og tekst som viser rømningsveier og sikkerhetsutstyr skal kunne leses og oppfattes under rømning når det er brann- eller røykutvikling.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK/RIBr</td>
              </tr>
              {formData.romningSikkerhet && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Prosjektspesifikk beskrivelse</td>
                  <td className="border border-gray-400 p-2">{formData.romningSikkerhet}</td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}
              {formData.romningSikkerhetKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.romningSikkerhetKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.9 &nbsp;&nbsp; §11-12 Tilrettelegging for rømning og redning</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              {/* Automatisk slokkeanlegg - én samlet rad */}
              {(formData.tilretteleggingLedd1c || 
                formData.risikoklasse === "RK4" || formData.bygningsdeler.some(b => b.risikoklasse === "RK4") ||
                formData.risikoklasse === "RK6" || formData.bygningsdeler.some(b => b.risikoklasse === "RK6")) && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Automatisk slokkeanlegg</td>
                  <td className="border border-gray-400 p-2">
                    <p className="mb-2">
                      {(formData.risikoklasse === "RK4" || formData.bygningsdeler.some(b => b.risikoklasse === "RK4")) && 
                        "Byggverk eller del av byggverk i risikoklasse 4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg. "}
                      {(formData.risikoklasse === "RK6" || formData.bygningsdeler.some(b => b.risikoklasse === "RK6")) && 
                        "Byggverk i risikoklasse 6 skal ha automatisk brannslokkeanlegg. "}
                      {formData.tilretteleggingLedd1c && !(formData.risikoklasse === "RK4" || formData.bygningsdeler.some(b => b.risikoklasse === "RK4") || formData.risikoklasse === "RK6" || formData.bygningsdeler.some(b => b.risikoklasse === "RK6")) &&
                        "Det er valgt automatisk brannslokkeanlegg for tiltaket. "}
                      Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner.
                    </p>
                    {(formData.risikoklasse === "RK6" || formData.bygningsdeler.some(b => b.risikoklasse === "RK6")) ? (
                      <div className="mt-2">
                        <p className="mb-2">Automatiske slokkeanlegg skal prosjekteres og installeres etter følgende standarder:</p>
                        <ul className="list-disc ml-4">
                          {formData.rk6Institusjon ? (
                            <>
                              <li><u>NS-EN 12845:2015+A1:2019</u> - Faste brannslokkesystemer - Automatiske sprinklersystemer - Dimensjonering, installering og vedlikehold.</li>
                              <li><u>NS-EN 16925:2018+AC:2020</u> og <u>NS-EN 16925:2018+NA:2019</u> - Faste brannslokkesystemer - Automatiske boligsprinklersystemer - Dimensjonering, installering og vedlikehold. Kan benyttes i arealer avsatt for boligformål, og arealer avsatt for boligformål må ha hurtigutløsende (QR) sprinklere.</li>
                            </>
                          ) : (
                            <>
                              <li><u>NS-EN 16925:2018+AC:2020</u> og <u>NS-EN 16925:2018+NA:2019</u> - Faste brannslokkesystemer - Automatiske boligsprinklersystemer - Dimensjonering, installering og vedlikehold.</li>
                            </>
                          )}
                        </ul>
                        <p className="mt-2">Dersom byggverket også har virksomhet i andre risikoklasser, må deler av byggverket med og uten automatisk sprinkleranlegg være ulike brannseksjoner.</p>
                        <p className="mt-2">Dersom virksomhet i ulike risikoklasser ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.</p>
                      </div>
                    ) : (
                      <p className="mt-2">
                        Automatiske slokkeanlegg skal prosjekteres og installeres etter følgende standarder: NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019. 
                        I byggverk med både næringsvirksomhet og boliger gjelder følgende: NS-EN 16925 kan benyttes i arealer avsatt for boligformål, og arealer avsatt for boligformål må ha hurtigutløsende (QR) sprinklere. 
                        NS-EN 12845:2015+A1:2019 kan benyttes i arealer avsatt for næring.
                      </p>
                    )}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIV</td>
                </tr>
              )}
              {/* Ledd 2a - Brannalarmanlegg RK2-6 */}
              {formData.tilretteleggingLedd2a && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Brannalarmanlegg</td>
                  <td className="border border-gray-400 p-2">
                    <p className="mb-2">Byggverk beregnet for virksomhet i risikoklasse 2 til 6 skal ha brannalarmanlegg.</p>
                    <p className="font-semibold mb-2">Preaksepterte ytelser:</p>
                    <ol className="list-decimal ml-5 space-y-2">
                      {/* Punkt 1-3 vises alltid */}
                      <li>Brannalarmanlegg må prosjekteres i samsvar med brannalarmkategorier som er angitt i tabell 3, med unntak som angitt nedenfor.</li>
                      <li>Det kan benyttes annen detektorteknologi i driftsmiljøer hvor dette er dokumentert å være bedre egnet.</li>
                      <li>Brannalarmanlegg må prosjekteres og utføres i samsvar med <u>NS 3960:2019</u> og <u>NS-EN 54-serien</u>.</li>
                      
                      {/* Punkt 4 - Boligbygg */}
                      {formData.brannalarmBoligbygg && (
                        <li>
                          <p>Detektorer i leiligheter i boligbygninger må dekke områdene kjøkken, stue og sone utenfor soverom. Dessuten må følgende være oppfylt:</p>
                          <ol className="list-decimal ml-5 mt-1 space-y-1">
                            <li>Det må være minst én detektor per etasje.</li>
                            <li>Akustiske alarmorganer må plasseres slik at alarmstyrken er minst 60 dB i oppholdsrom og soverom når mellomliggende dører er lukket.</li>
                            <li>Detektorer og akustiske alarmorganer må installeres i trapperom, kjeller og loft.</li>
                            <li>Manuell melder må installeres i trapperom ved hovedinngang.</li>
                            <li>
                              <p>Alarmorganer både i leiligheter og i fellesarealer må aktiveres ved:</p>
                              <p className="ml-4">I. alarm utløst i leilighet som ikke er kvittert ut i løpet av 2 minutter</p>
                              <p className="ml-4">II. alarm utløst i fellesarealer</p>
                              <p className="ml-4">III. utløst slokkeanlegg</p>
                            </li>
                          </ol>
                        </li>
                      )}
                      
                      {/* Punkt 5 - Parkering */}
                      {formData.brannalarmParkering && (
                        <li>For parkeringshus, garasje og parkeringskjeller gjelder kravet om brannalarmanlegg når samlet bruttoareal er større enn 1 200 m². Alternativt kan det installeres et automatisk sprinkleranlegg. Parkeringshus med mer enn 1/3 av veggflatene på hvert plan åpne mot det fri over ferdig planert terreng, og øverste parkeringsflate mindre enn 16 meter over gjennomsnittlig planert terreng, kan likevel oppføres uten brannalarmanlegg eller automatisk sprinkleranlegg når åpningene er slik plassert at det oppnås god utlufting.</li>
                      )}
                      
                      {/* Punkt 6 - Publikum */}
                      {formData.brannalarmPublikum && (
                        <li>
                          <p>I byggverk for publikum og arbeidsbygninger må akustiske alarmorganer suppleres med optiske i:</p>
                          <ol className="list-decimal ml-5 mt-1 space-y-1">
                            <li>de deler av byggverk som er åpent for publikum og</li>
                            <li>fellesarealer i arbeidsbygninger</li>
                          </ol>
                        </li>
                      )}
                      
                      {/* Punkt 7-9 - Universell utforming */}
                      {formData.brannalarmUniversell && (
                        <>
                          <li>
                            <p>I byggverk med krav om universell utforming som har mange rom med samme funksjon, må rom som er universelt utformet, jf. § 12-7 sjuende ledd, ha optiske alarmorganer i tillegg til akustiske. Unntak gjelder:</p>
                            <ol className="list-decimal ml-5 mt-1 space-y-1">
                              <li>I rom som i hovedsak benyttes av én person om gangen, som for eksempel kontorer, kan det benyttes mobile, optiske alarmorganer.</li>
                              <li>I overnattingsrom kan det benyttes mobile løsninger som omfatter både vibrerende og optiske alarmorganer.</li>
                            </ol>
                          </li>
                          <li>I bad og toalettrom som er universelt utformet, jf. § 12-9, må akustiske alarmorganer suppleres med optiske.</li>
                          <li>Rømningsveier trenger ikke ha optiske alarmorganer i tillegg til akustiske.</li>
                        </>
                      )}
                      
                      {/* Punkt 10 - Talevarsling */}
                      {formData.brannalarmTalevarsling && (
                        <li>Branncelle over flere plan beregnet for flere enn 1 000 personer må ha talevarslingsanlegg.</li>
                      )}
                      
                      {/* Punkt 11 - Takterrasse */}
                      {formData.brannalarmTakterrasse && (
                        <li>Takterrasse beregnet for personopphold må ha utstyr for varsling av brann.</li>
                      )}
                      
                      {/* Punkt 12 vises alltid */}
                      <li>Brannalarmanlegg må ha alarmoverføring til nødmeldesentral, alarmstasjon, vaktselskap eller til sted lokalt i byggverket med personell som har ansvar for å iverksette aksjon i henhold til alarmorganisering.</li>
                    </ol>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              )}
              {/* Ledd 2b - Røykvarslere for få personer */}
              {formData.tilretteleggingLedd2b && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Røykvarslere</td>
                  <td className="border border-gray-400 p-2">
                    I byggverk beregnet for få personer og byggverk av mindre størrelse kan det brukes røykvarslere dersom rømningsforholdene er særlig enkle og oversiktlige. Røykvarslere skal være tilknyttet strømforsyningen og ha batteri som reserveløsning. I branncelle med behov for flere røykvarslere skal varslerne være seriekoblet. I byggverk uten strømforsyning kan det benyttes batteridrevne røykvarslere.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              )}
              {/* Ledd 3 - Ledesystem */}
              {formData.tilretteleggingLedd3 && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Ledesystem</td>
                  <td className="border border-gray-400 p-2">
                    I byggverk hvor flukt- og rømningsveiene er lange og har retningsendringer eller skal benyttes av mange personer, skal flukt- og rømningsveiene ha god belysning og være merket slik at rømning kan skje på en rask og effektiv måte. Store byggverk, byggverk beregnet for et stort antall personer og byggverk beregnet for virksomhet i risikoklasse 5 og 6 skal ha ledesystem.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIE</td>
                </tr>
              )}
              {/* Ledd 4 - Evakueringsplaner */}
              {formData.tilretteleggingLedd4 && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Evakueringsplaner</td>
                  <td className="border border-gray-400 p-2">
                    For byggverk i risikoklasse 5 og 6, øvrige byggverk for publikum og for arbeidsbygninger, skal det foreligge evakueringsplaner før byggverket tas i bruk.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">Byggherre</td>
                </tr>
              )}
              {/* Ledd 5 - Merking av installasjoner */}
              {formData.tilretteleggingLedd5 && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Merking av branntekniske installasjoner</td>
                  <td className="border border-gray-400 p-2">
                    Plasseringen av branntekniske installasjoner som har betydning for rømnings- og redningsinnsatsen skal være tydelig merket, med mindre installasjonene bare er beregnet for personer i én bruksenhet og personene må forventes å være godt kjent med plasseringen.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.tilretteleggingKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.tilretteleggingKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.10 &nbsp;&nbsp; §11-13 Utgang fra branncelle</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Generelt</td>
                <td className="border border-gray-400 p-2">
                  Fra en branncelle skal det minst være én utgang til sikkert sted, eller utganger til to uavhengige rømningsveier, eller én utgang til rømningsvei som har to alternative rømningsretninger som fører videre til uavhengige rømningsveier eller sikre steder.
                </td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>
              {formData.boenhetKunEttTrapperom && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Risikoklasse 4</td>
                  <td className="border border-gray-400 p-2">
                    Brannceller i byggverk i risikoklasse 4 med inntil 8 etasjer kan ha utgang til ett trapperom utført som rømningsvei. Dette forutsetter at hver boenhet har minst ett vindu eller balkong som er tilgjengelig for rednings- og slokkeinnsats, jf. § 11-17.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}
              {formData.branncelleFlereEtasjer && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Flere etasjer</td>
                  <td className="border border-gray-400 p-2">
                    Brannceller som består av flere etasjer, eller har mellometasje, skal ha minst én utgang fra hver etasje. I byggverk i risikoklasse 1, 2, 3 og 4 kan utgangen fra disse planene, utenom inngangsplanet, være vindu som er tilrettelagt for sikker rømning. I branncelle i byggverk i risikoklasse 4 uten krav om heis, kan øverste plan ha utgang via nærmeste underliggende plan dersom det installeres automatisk brannslokkeanlegg i branncellen.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}
              {formData.lavtByggverkVinduerRomning && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Lave byggverk</td>
                  <td className="border border-gray-400 p-2">
                    I lave byggverk beregnet for virksomhet i risikoklasse 1, 2, 3 og 4 kan utgangen fra branncellen enten føre til sikkert sted, eller til rømningsvei som bare har én rømningsretning, forutsatt at hver branncelle har vinduer som er utformet og tilrettelagt for sikker rømning.
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}
              {formData.branncelleStortAntallPersoner && formData.persontallAreal && formData.persontallKategori && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Beregnet persontall</td>
                  <td className="border border-gray-400 p-2">
                    <p className="text-sm">
                      {(() => {
                        const kategoriNavn: Record<string, string> = {
                          salgslokaler: "Salgslokaler",
                          kontor: "Kontor",
                          skoler: "Skoler",
                          barnehager: "Barnehager/fritidshjem",
                          forsamlingslokaler: "Forsamlingslokaler",
                          spisesaler: "Spisesaler"
                        };
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
                        const personer = Math.floor(areal / factor);
                        return `${kategoriNavn[formData.persontallKategori]}: ${areal} m² / ${factor} m²/pers = ${personer} personer`;
                      })()}
                    </p>
                  </td>
                  <td className="border border-gray-400 p-2 align-top text-sm">ARK</td>
                </tr>
              )}
              {formData.branncelleStortAntallPersoner && (formData.stortAntallUnder600 || formData.stortAntallOver600 || formData.stortAntallUnder150 || formData.stortAntallFlereEtasjer) && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Stort antall personer</td>
                  <td className="border border-gray-400 p-2">
                    <p className="mb-2">Brannceller for et stort antall personer skal ha tilstrekkelig antall, og minst to utganger til rømningsvei. Preaksepterte ytelser:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Antall personer i branncellen er beregnet ut fra brutto gulvareal per person. I salgslokale legges alle de områder som er tilgjengelig for publikum til grunn for dimensjonering av fri bredde. Det gjøres ikke fradrag for inventar.</li>
                      <li>Samlet fri bredde i utgangene bestemmes ut fra det antall personer branncellen er beregnet for. Dessuten gjelder:
                        <ol className="list-decimal list-inside ml-4 mt-1">
                          <li>Utgangene må være hensiktsmessig fordelt i lokalet.</li>
                          <li>For dimensjoneringen av fri bredde benyttes 1 cm per person.</li>
                        </ol>
                      </li>
                      <li>Brannceller må ha minst én utgang per 300 personer.</li>
                      {formData.stortAntallUnder600 && (
                        <li>Brannceller beregnet for inntil 600 personer må ha minst to utganger. Med mindre utgangene fører til sikkert sted, må de fordeles på minst to uavhengige rømningsveier eller på ulike deler av rømningsvei som er skilt med bygningsdel og dør minst klasse E 30-CS<sub>a</sub> [F 30S].</li>
                      )}
                      {formData.stortAntallOver600 && (
                        <li>Brannceller beregnet for mer enn 600 personer må ha minst tre utganger. Med mindre utgangene fører til sikkert sted, må de fordeles på minst to uavhengige rømningsveier eller på ulike deler av rømningsvei som er skilt med bygningsdel og dør minst klasse E 30-CS<sub>a</sub> [F 30S].</li>
                      )}
                      {formData.stortAntallUnder150 && (
                        <li>Brannceller beregnet for mindre enn 150 personer kan ha bare én utgang dersom denne går til sikkert sted.</li>
                      )}
                      {formData.stortAntallFlereEtasjer && (
                        <li>Branncelle som har åpen forbindelse over flere etasjer, eller har mellometasje, må ha tilsvarende antall utganger fra hver etasje. Interntrapp kan anses likeverdig med en utgang. Det skal likevel være minst én utgang til rømningsvei eller sikkert sted fra hver etasje, jf. tredje ledd.</li>
                      )}
                    </ol>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 p-2 align-top">Utganger</td>
                <td className="border border-gray-400 p-2">{formData.utgangBranncelle || "[Utganger beskrives]"}</td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              {formData.utgangBranncelleKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.utgangBranncelleKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 p-2 align-top">Dører til rømningsvei</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2 font-medium">Preaksepterte ytelser:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Åpningskraft for dører til rømningsvei må være maksimalt 67 Newton dersom det ikke følger andre krav av § 12–13.</li>
                    {(() => {
                      // Determine risk class from building parts or global setting
                      const risikoklasser = formData.bygningsdeler && formData.bygningsdeler.length > 0
                        ? [...new Set(formData.bygningsdeler.map(d => d.risikoklasse).filter(Boolean))]
                        : formData.risikoklasse ? [formData.risikoklasse] : [];
                      
                      // Check if fritidsbolig is relevant
                      const erFritidsbolig = formData.bygningstype?.toLowerCase().includes("fritidsbolig") || 
                        formData.bygningsdeler?.some(d => d.bygningstype?.toLowerCase().includes("fritidsbolig"));
                      
                      const harRK5 = risikoklasser.some(rk => rk === "RK5" || rk === "5");
                      const harAndreRK = risikoklasser.some(rk => rk !== "RK5" && rk !== "5" && rk);
                      
                      const fritidsboligUnntak = erFritidsbolig ? " Unntak gjelder for fritidsbolig med én boenhet." : "";
                      
                      if (harRK5 && harAndreRK) {
                        return (
                          <>
                            <li>Dør til rømningsvei i byggverk i risikoklasse 1, 2, 3, 4 og 6 må ha fri bredde minimum <span className="font-semibold text-red-600">0,86 meter</span>.{fritidsboligUnntak}</li>
                            <li>Dør til rømningsvei i byggverk i risikoklasse 5 må ha fri bredde minimum <span className="font-semibold text-red-600">1,16 meter</span>.</li>
                          </>
                        );
                      } else if (harRK5) {
                        return (
                          <li>Dør til rømningsvei må ha fri bredde minimum <span className="font-semibold text-red-600">1,16 meter</span>.</li>
                        );
                      } else {
                        return (
                          <li>Dør til rømningsvei må ha fri bredde minimum <span className="font-semibold text-red-600">0,86 meter</span>.{fritidsboligUnntak}</li>
                        );
                      }
                    })()}
                    <li>I byggverk hvor det er nødvendig med transport i seng, må dørbredden tilpasses dette.</li>
                    <li>Samlet fri bredde på dører fra branncelle til rømningsvei bestemmes ut fra det antall personer som branncellen er beregnet for, jf. femte ledd.</li>
                    {(() => {
                      const erFritidsbolig = formData.bygningstype?.toLowerCase().includes("fritidsbolig") || 
                        formData.bygningsdeler?.some(d => d.bygningstype?.toLowerCase().includes("fritidsbolig"));
                      const fritidsboligUnntak = erFritidsbolig ? " Unntak gjelder for fritidsbolig med én boenhet." : "";
                      return <li>Dør til rømningsvei må ha fri høyde på minimum 2,0 meter.{fritidsboligUnntak}</li>;
                    })()}
                    <li>Dør til rømningsvei må lett kunne åpnes slik at den er enkel å bruke for alle personer.</li>
                    <li>Selvlukkende dør, benevnt C [S], kan settes i åpen stilling ved hjelp av elektromagnetiske holdere som utløses og lukker døren ved brannalarm. Døren må kunne åpnes igjen med dørautomatikk eller manuelt med åpningskraft i samsvar med § 12–13.</li>
                    {formData.dorerTilbakerømning && (
                      <li>Dør til rømningsvei må ha et låsesystem som gjør det mulig å vende tilbake dersom rømningsveien skulle være blokkert, med mindre andre tiltak gir tilsvarende sikkerhet.</li>
                    )}
                    <li>Dør til rømningsvei kan være låst når byggverket har brannalarmanlegg og låsesystemet åpnes automatisk ved alarm. I tillegg må det være tydelig merket knapp for manuell åpning av døren. Det kan aksepteres inntil 10 sekunders tidsforsinkelse på den manuelle åpningsmekanismen.</li>
                    {formData.dorerNattlaser && (
                      <li>Nattlåser må utføres slik at de ikke kommer i strid med kravene til sikker rømning.</li>
                    )}
                    {formData.dorerLiteAntallPersoner && (
                      <li>Dør til rømningsvei fra branncelle beregnet for et lite antall personer kan slå mot rømningsretning. Med et lite antall personer menes inntil 10. Brannceller med et lite antall personer kan for eksempel være boenhet, sykerom, hotellrom, og mindre kontorlokaler og salgslokaler.</li>
                    )}
                    <li>Utadslående dør i yttervegg som er utgang eller rømningsvei, må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.</li>
                    {(() => {
                      // Determine fire classes from building parts or global setting
                      const brannklasser = formData.bygningsdeler && formData.bygningsdeler.length > 0
                        ? [...new Set(formData.bygningsdeler.map(d => d.brannklasse).filter(Boolean))]
                        : formData.brannklasse ? [formData.brannklasse] : [];
                      
                      const harBKL1 = brannklasser.includes("BKL1") || formData.dorerStromforsyningBKL1;
                      const harBKL2eller3 = brannklasser.includes("BKL2") || brannklasser.includes("BKL3") || formData.dorerStromforsyningBKL2 || formData.dorerStromforsyningBKL3;
                      
                      if (harBKL1 && harBKL2eller3) {
                        return (
                          <li>Avbruddsfri strømforsyning må fungere i minst 30 minutter i byggverk i brannklasse 1 og i minst 60 minutter i byggverk i brannklasse 2 og 3.</li>
                        );
                      } else if (harBKL2eller3) {
                        return (
                          <li>Avbruddsfri strømforsyning må fungere i minst 60 minutter i byggverk i brannklasse 2 og 3.</li>
                        );
                      } else if (harBKL1) {
                        return (
                          <li>Avbruddsfri strømforsyning må fungere i minst 30 minutter i byggverk i brannklasse 1.</li>
                        );
                      }
                      return null;
                    })()}
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              {formData.romningsvinduRelevant && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Rømningsvindu</td>
                  <td className="border border-gray-400 p-2">
                    <p className="mb-2">Brannceller som består av flere etasjer, eller har mellometasje, skal ha minst én utgang fra hver etasje.</p>
                    {(() => {
                      // Determine risk class from building parts or global setting
                      const risikoklasser = formData.bygningsdeler && formData.bygningsdeler.length > 0
                        ? [...new Set(formData.bygningsdeler.map(d => d.risikoklasse).filter(Boolean))]
                        : formData.risikoklasse ? [formData.risikoklasse] : [];
                      
                      const harRK124 = risikoklasser.some(rk => 
                        rk === "RK1" || rk === "RK2" || rk === "RK4" || 
                        rk === "1" || rk === "2" || rk === "4"
                      );
                      const harRK3 = risikoklasser.some(rk => rk === "RK3" || rk === "3");
                      const harRK4 = risikoklasser.some(rk => rk === "RK4" || rk === "4");
                      const harRK123 = risikoklasser.some(rk => 
                        rk === "RK1" || rk === "RK2" || rk === "RK3" || 
                        rk === "1" || rk === "2" || rk === "3"
                      );

                      const vinduHoyde = parseFloat(formData.romningsvinduHoyde) || 0;
                      const gulvAvstand = parseFloat(formData.romningsvinduGulvAvstand) || 0;
                      const harStige = formData.romningsvinduHarStige;
                      const harBalkong = formData.romningsvinduHarBalkong;
                      
                      return (
                        <>
                          <p className="font-medium mt-2 mb-2">Preaksepterte ytelser:</p>
                          <ul className="list-disc list-inside space-y-2 text-sm">
                            {/* 1. RK 1, 2, 4 - høydekrav */}
                            {harRK124 && (
                              <li>
                                I byggverk i risikoklasse 1, 2 og 4 kan utgangen være rømningsvindu som har underkant til og med <span className="font-semibold text-red-600">5,0 meter</span> over planert terreng, eller til og med <span className="font-semibold text-red-600">7,5 meter</span> over planert terreng dersom det er atkomst til fastmontert stige med ryggbøyler. Ved større høyder må det være atkomst fra rømningsvindu til utvendig trapp. Stige eller trapp må ha avstand minimum 2,0 meter fra vindu, eller være skjermet mot flammer og strålevarme.
                                {vinduHoyde > 0 && (
                                  <span className={`ml-1 font-medium ${vinduHoyde <= 5.0 || (vinduHoyde <= 7.5 && harStige) ? "text-green-600" : "text-red-600"}`}>
                                    {vinduHoyde <= 5.0 ? " ✓ Oppfylt (≤5,0 m)" : vinduHoyde <= 7.5 && harStige ? " ✓ Oppfylt med stige (≤7,5 m)" : " ✗ Krever utvendig trapp"}
                                  </span>
                                )}
                              </li>
                            )}

                            {/* 2. RK 3 - høydekrav */}
                            {harRK3 && (
                              <li>
                                I byggverk i risikoklasse 3 kan utgangen være rømningsvindu som har underkant til og med <span className="font-semibold text-red-600">2,0 meter</span> over terreng. Ved større høyder må det være atkomst fra rømningsvindu til utvendig trapp. Trappen må ha avstand minimum 2,0 meter fra vindu, eller være skjermet mot flammer og strålevarme.
                                {vinduHoyde > 0 && (
                                  <span className={`ml-1 font-medium ${vinduHoyde <= 2.0 ? "text-green-600" : "text-red-600"}`}>
                                    {vinduHoyde <= 2.0 ? " ✓ Oppfylt (≤2,0 m)" : " ✗ Krever utvendig trapp"}
                                  </span>
                                )}
                              </li>
                            )}

                            {/* 3. RK 1, 2, 3 - persontall */}
                            {harRK123 && (
                              <li>I risikoklasse 1, 2 og 3 må etasjer som er beregnet for 15 personer eller mindre, ha minst ett rømningsvindu. Etasjer som er beregnet for mer enn 15 personer, må ha ett ekstra rømningsvindu per 15 personer. Vinduene må være hensiktsmessig fordelt i etasjen. Avstanden til nærmeste rømningsvindu må ikke være større enn angitt i tabell 1.</li>
                            )}

                            {/* 4. RK 4 - varig opphold */}
                            {harRK4 && (
                              <li>I risikoklasse 4 må minst annethvert rom for varig opphold ha rømningsvindu.</li>
                            )}

                            {/* 5. Mellometasje - RK 1, 2, 3 */}
                            {harRK123 && (
                              <li>Fra mellometasje beregnet for maksimum ti personer i byggverk i risikoklasse 1, 2, og 3, kan utgangen være interntrapp til underliggende plan.</li>
                            )}

                            {/* 6. Dimensjonskrav */}
                            <li>Rømningsvindu må ha høyde minimum <span className="font-semibold text-red-600">0,6 meter</span> og bredde minimum <span className="font-semibold text-red-600">0,5 meter</span>. Summen av høyde og bredde må være minimum <span className="font-semibold text-red-600">1,5 meter</span>, jf. figur 5. Svingvinduer med dreieakse, må ha tilsvarende effektiv åpning.</li>

                            {/* 7. Avstand gulv til underkant */}
                            <li>
                              Avstanden fra gulv til underkant av vindusåpningen må være maksimalt <span className="font-semibold text-red-600">1,0 meter</span> med mindre det er truffet tiltak for å lette rømning.
                              {gulvAvstand > 0 && (
                                <span className={`ml-1 font-medium ${gulvAvstand <= 1.0 ? "text-green-600" : "text-amber-600"}`}>
                                  {gulvAvstand <= 1.0 ? " ✓ Oppfylt" : " ⚠ Krever tiltak for å lette rømning"}
                                </span>
                              )}
                            </li>

                            {/* 8. Åpning uten verktøy */}
                            <li>Rømningsvindu må være lett å åpne uten bruk av spesialverktøy og må være hengslet slik at det er lett å komme ut av vinduet.</li>

                            {/* 9. Markeringsskilt */}
                            <li>Rømningsvindu, unntatt i boenheter, må ha markeringsskilt.</li>

                            {/* 10. Brannvesenets høyderedskap */}
                            <li>Rømningsvindu må være tilgjengelig for brannvesenets høyderedskap. I etasjer beregnet for inntil 15 personer, og i boenheter, er det tilstrekkelig at ett rømningsvindu er tilgjengelig for brannvesenets høyderedskap.</li>

                            {/* 11. Balkong */}
                            <li>
                              Utgang til balkong anses likeverdig med rømningsvindu når tilhørende ytelser for å lette rømning er oppfylt.
                              {harBalkong && <span className="ml-1 font-medium text-green-600"> ✓ Balkong tilgjengelig</span>}
                            </li>

                            {/* 12. RK 4 - automatisk slokkeanlegg */}
                            {harRK4 && (
                              <li>Forskriftens krav til automatisk slokkeanlegg i byggverk i risikoklasse 4 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med § 11–12 første ledd bokstav a.</li>
                            )}
                          </ul>
                        </>
                      );
                    })()}
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.11 &nbsp;&nbsp; §11-14 Rømningsvei</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Generelt</td>
                <td className="border border-gray-400 p-2">
                  Rømningsvei skal på en oversiktlig og lettfattelig måte føre til et sikkert sted. Den skal ha tilstrekkelig bredde og høyde og være utført som egen branncelle tilrettelagt for rask og effektiv rømning.
                </td>
                <td className="border border-gray-400 p-2 align-top">-</td>
              </tr>

              {/* Preaksepterte ytelser for rømningsvei */}
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Rømningsvei</td>
                <td className="border border-gray-400 p-2">
                  <ul className="space-y-2">
                    {/* Rom i rømningsvei maks 20 m² */}
                    {formData.romningsveiRomMaks20 && (
                      <li>Rømningsvei kan inneholde mindre avgrensede rom for andre formål dersom dette nødvendig av byggverket gjør dette nødvendig og dersom disse ikke reduserer rømningsveiens funksjon. Eksempler er resepsjon og vaktrom med inntil <span className="font-bold text-red-600">20 m²</span> gulvareal som er knyttet til korridor, og som er avgrenset slik at møbleringen ikke har mulighet for å vanskeliggjøre rømningen. Dette unntaket kan ikke benyttes som grunnlag for dokumentere andre fravik i rømningsveier.</li>
                    )}

                    {/* Oppholdsrom inntil 50 m² med E30 */}
                    {formData.romningsveiRom50E30 && (
                      <li>Oppholdsrom inntil <span className="font-bold text-red-600">50 m²</span> kan være del av rømningsvei når arealet har automatisk sprinkleranlegg og er skilt fra rømningsvei med konstruksjoner med brannmotstand minst <span className="font-bold text-red-600">E 30</span>.</li>
                    )}

                    {/* Avstander - basert på ett eller flere trapperom */}
                    <li>Avstand fra dør i branncelle til nærmeste trapp eller utgang til sikkert sted (terreng eller annen brannseksjon) må være:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        {formData.romningsveiFlereTrapper ? (
                          <>
                            <li>Maksimum <span className="font-bold text-red-600">30 meter</span> der det finnes flere trapper eller utganger.</li>
                          </>
                        ) : (
                          <>
                            <li>Maksimum <span className="font-bold text-red-600">15 meter</span> der det er tilstrekkelig med én trapp.</li>
                            <li>Maksimum <span className="font-bold text-red-600">15 meter</span> der det er utgang til korridor med sammenfallende rømningsretning.</li>
                          </>
                        )}
                      </ul>
                    </li>

                    {/* Samlet fri bredde */}
                    <li>
                      Samlet fri bredde i rømningsvei må minimum være <span className="font-bold text-red-600">1 cm per person</span>, men uansett minst som angitt nedenfor. For dimensjonerende persontall vises til § 11-13 Tabell 3.
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        {(() => {
                          // Finn relevante risikoklasser for bredde-krav
                          const alleRK = formData.harFlereRisikoklasser && formData.bygningsdeler.length > 0
                            ? formData.bygningsdeler.map(b => b.risikoklasse)
                            : [formData.risikoklasse];
                          
                          const harRK124 = alleRK.some(rk => ["RK1", "RK2", "RK4"].includes(rk));
                          const harRK356 = alleRK.some(rk => ["RK3", "RK5", "RK6"].includes(rk));
                          const harRK6Bolig = alleRK.includes("RK6") && formData.bygningstype?.toLowerCase().includes("bolig");
                          
                          return (
                            <>
                              {harRK124 && (
                                <li>I byggverk i risikoklasse 1, 2, og 4 må fri bredde i rømningsvei være minimum <span className="font-bold text-red-600">0,86 meter</span>.</li>
                              )}
                              {harRK356 && (
                                <li>
                                  I byggverk i risikoklasse 3, 5 og 6 må fri bredde i rømningsvei være minimum <span className="font-bold text-red-600">1,16 meter</span>.
                                  {harRK6Bolig && (
                                    <span className="ml-1 text-muted-foreground"> Unntak gjelder boliger i risikoklasse 6 i samsvar med § 11-2 Tabell 1, hvor fri bredde kan være minimum 0,86 meter.</span>
                                  )}
                                </li>
                              )}
                            </>
                          );
                        })()}
                      </ul>
                    </li>

                    {/* Transport av sengeliggende */}
                    {formData.romningsveiSengeliggende && (
                      <li>I byggverk hvor det er nødvendig med transport av sengeliggende personer, må bredden av rømningsveien tilpasses dette.</li>
                    )}

                    {/* Samtidig rømning fra flere etasjer */}
                    {formData.romningsveiSamtidigRomning && (
                      <li>I byggverk med flere etasjer må rømningsveiene dimensjoneres for samtidig rømning fra to etasjer. Det må dimensjoneres for de to etasjene som ligger over hverandre og til sammen har det største persontallet. Persontallet settes lik det største antallet personer som branncellen er beregnet for.</li>
                    )}

                    {/* Ingen innsnevring */}
                    <li>Rømningsvei må ikke ha innsnevring. Rekkverk, håndløper mv. i rømningsvei kan stikke inntil <span className="font-bold text-red-600">10 cm</span> ut fra vegg uten at den frie bredden må økes.</li>

                    {/* Fri bredde i trapp */}
                    <li>Fri bredde i trapp må være som for rømningsvei generelt, men minimum som angitt i § 12–14.</li>

                    {/* Korridor over 30 meter */}
                    {formData.romningsveiKorridorOver30m && (
                      <li>Korridor som er lengre enn <span className="font-bold text-red-600">30 meter</span> må deles med bygningsdel og dør minst klasse <span className="font-bold text-red-600">E 30-CS<sub>a</sub></span> [F 30S] med innbyrdes avstand på høyst <span className="font-bold text-red-600">30 meter</span>.</li>
                    )}

                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>

              {/* Dør i rømningsvei - egen rad */}
              <tr>
                <td className="border border-gray-400 p-2 align-top font-medium">Dører</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">Dør i rømningsvei skal prosjekteres og utføres slik at den sikrer rask rømning og slik at det ikke oppstår fare for oppstuving. Følgende skal minst være oppfylt:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Døren skal ha tilstrekkelig bredde og høyde, og skal være lett å åpne uten bruk av nøkkel.</li>
                    <li>Døren skal slå ut i rømningsretningen. Dør i rømningsvei kan likevel slå mot rømningsretningen dersom det ikke er fare for oppstuving ved rømning.</li>
                  </ul>
                  
                  <p className="mt-4 mb-2 font-medium">Preaksepterte ytelser:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Dør i rømningsvei må ha fri bredde som minst tilsvarer den nødvendige frie bredden i rømningsveien, jf. første ledd. I byggverk hvor det er nødvendig med transport av sengeliggende personer, må dørbredden tilpasses dette.</li>
                    <li>Automatisk skyvedør, rotasjonsgrind, dør med dørautomatikk eller dør med annet elektromagnetisk åpne- og lukkesystem som ikke har brann- eller røykskillende funksjon, for eksempel dør til det fri, kan benyttes som dør i rømningsvei dersom døren har sikker funksjon ved bortfall av strøm, og
                      <ul className="list-decimal list-inside ml-4 mt-1 space-y-1">
                        <li>byggverket har brannalarmanlegg og døren ved alarm eller strømbrudd åpnes automatisk til den bredde som er nødvendig, eller</li>
                        <li>døren manuelt kan føres til åpen stilling.</li>
                      </ul>
                    </li>
                    <li>Dør i rømningsvei i byggverk i risikoklasse 5 og 6 må være utført for sikker rømning ved at døren må kunne åpnes manuelt med ett grep og uten bruk av nøkkel, jf. figur 6.</li>
                    <li>Utadslående dør i yttervegg som er utgang eller rømningsvei, må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>

              {/* Svalgang krav */}
              {formData.romningsveiSvalgang && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top font-medium">Svalgang og altangang</td>
                  <td className="border border-gray-400 p-2">
                    <ul className="space-y-2">
                      {/* Vis 60m-kravet kun dersom svalgang IKKE er over 30 meter */}
                      {!formData.romningsveiSvalgangOver30m && (
                        <li>Med mindre branncellene også har direkte utgang til sikkert sted, må svalgang og altangang utføres slik at de tilfredsstiller forutsetningene om to uavhengige rømningsveier. Svalgang og altangang må derfor ha minst to trapper til terreng, en i hver ende. Avstanden mellom trappene må ikke være over <span className="font-bold text-red-600">60 meter</span>.</li>
                      )}
                      
                      {/* Vis kun dersom svalgang er over 30 meter */}
                      {formData.romningsveiSvalgangOver30m && (
                        <li>Svalgang som er lengre enn <span className="font-bold text-red-600">30 meter</span> må oppdeles med branncellebegrensende bygningsdeler med innbyrdes avstand på maksimum 30 meter for å begrense den horisontale brannspredningen.</li>
                      )}
                      
                      {/* Vis kun dersom noen bygningsdel er i BKL1 */}
                      {formData.bygningsdeler.some(del => {
                        const rk = parseInt(del.risikoklasse) || 0;
                        const floors = parseInt(del.etasjer) || 1;
                        // BKL1 logic
                        if (rk === 1 && floors <= 2) return true;
                        if (rk === 2 && floors <= 2) return true;
                        if (rk === 4 && floors <= 3) return true;
                        if (rk === 5 && floors <= 2 && (parseFloat(del.areal) || 0) < 800) return true;
                        if (rk === 6 && floors <= 2) return true;
                        return false;
                      }) && (
                        <li>I byggverk i brannklasse 1 hvor det er tilrettelagt for bruk av vindu som rømningsvei, er det tilstrekkelig med én trapp. Dette gjelder under forutsetning av at avstanden fra dør i branncelle til trappen er maksimalt <span className="font-bold text-red-600">15 meter</span>, og at det ikke må rømmes forbi uklassifisert vindu i annen branncelle.</li>
                      )}
                      
                      <li>Svalgangen må være mest mulig åpen slik at røyk- og branngasser kan unnslippe. Om den åpne delen er <span className="font-bold text-red-600">50 prosent</span> av den totale «veggflaten», antas dette å være tilfredsstillende. Det er den øverste delen av veggflatene som må være åpen. Åpning i rekkverk er ikke å anse som åpent areal.</li>
                      
                      <li>Gulvet i svalgang og altangang må være utført som branncellebegrensende konstruksjon med overflate <span className="font-bold text-red-600">D<sub>fl</sub>-s1</span> (G). Kledning på vegg og tak må være som for rømningsvei. Overflaten kan være <span className="font-bold text-red-600">B-s3,d0</span> (Ut 1). I byggverk med mer enn to etasjer må rekkverk og øvrige konstruksjoner bestå av ubrennbare eller begrenset brennbare materialer, det vil si klasse <span className="font-bold text-red-600">A2-s1,d0</span>.</li>
                      
                      <li>Svalgang og altangang må være minimum <span className="font-bold text-red-600">1,20 meter</span> bred for at den skal fungere som flammeskjerm.</li>
                      
                      <li>Dekke og takutstikk over svalgang må utføres horisontalt og tett (mot for eksempel oppforet tak eller kaldt loft) slik at røyk- og branngasser kan slippe uhindret ut til det fri.</li>
                      
                      <li>Trappene må være beskyttet mot strålevarme fra en eventuell brann i byggverket. Derfor må enten trapperomsveggene som vender mot byggverket eller byggverkets yttervegg mot trappen og <span className="font-bold text-red-600">5,0 meter</span> til hver side for denne, være utført som branncellebegrensende konstruksjon.</li>
                    </ul>
                  </td>
                  <td className="border border-gray-400 p-2 align-top">ARK</td>
                </tr>
              )}

              <tr>
                <td className="border border-gray-400 p-2 align-top">Beskrivelse av rømningsvei</td>
                <td className="border border-gray-400 p-2">{formData.romningsvei || "[Rømningsveier beskrives]"}</td>
                <td className="border border-gray-400 p-2 align-top">ARK</td>
              </tr>
              {formData.romningsveiKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.romningsveiKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              {/* 3.12 §11-15 Tilrettelegging for redning av husdyr */}
              {formData.husdyrRedningRelevant && (
                <>
                  <tr className="bg-blue-100">
                    <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.12 &nbsp;&nbsp; §11-15 Tilrettelegging for redning av husdyr</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                    <th className="border border-gray-400 p-2 text-left">Løsning</th>
                    <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Generelt</td>
                    <td className="border border-gray-400 p-2">
                      Byggverk som er beregnet for husdyrhold, skal være prosjektert og utført for rask og sikker redning av husdyr. Driftsbygning med husdyrrom utføres i samsvar med ytelser som angitt for risikoklasse 2.
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 align-top">Preaksepterte ytelser</td>
                    <td className="border border-gray-400 p-2">
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Husdyrrom må ha minst to utganger uavhengig av størrelsen på rommet. Én av utgangene kan gå via annen branncelle eller annet rom.</li>
                        <li>Utganger eller rømningsveier må ha fri bredde på minimum <span className="font-semibold text-red-600">1,6 meter</span> fra rom for okse, ku og hest, og minimum <span className="font-semibold text-red-600">1,0 meter</span> fra rom for gris, sau og geit.</li>
                        <li>Avstand fra et hvert oppholdssted til nærmeste utgang i husdyrrom må ikke være mer enn <span className="font-semibold text-red-600">30 meter</span>.</li>
                        <li>Utadslående dør i yttervegg som er utgang eller rømningsvei må ikke kunne blokkeres av snø eller is. Takoverbygg, snøfangere på tak og lignende vil kunne forhindre dette.</li>
                      </ul>
                    </td>
                    <td className="border border-gray-400 p-2 align-top">ARK</td>
                  </tr>
                  {formData.husdyrRedningKommentar && (
                    <tr>
                      <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                      <td className="border border-gray-400 p-2 italic">{formData.husdyrRedningKommentar}</td>
                      <td className="border border-gray-400 p-2 align-top">-</td>
                    </tr>
                  )}
                </>
              )}

              {/* 3.13 §11-16 Manuell slokking */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.13 &nbsp;&nbsp; §11-16 Tilrettelegging for manuell slokking</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Generelt</td>
                <td className="border border-gray-400 p-2">
                  Byggverk skal være tilrettelagt for effektiv manuell slokking av brann.
                </td>
                <td className="border border-gray-400 p-2 align-top">RIV</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Brannslokkeutstyr</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>I eller på alle byggverk der brann kan oppstå, skal det være manuelt brannslokkeutstyr for effektiv slokkeinnsats i startfasen av brannen. Dette kommer i tillegg til et eventuelt automatisk brannslokkeanlegg.</li>
                    <li>Brannslokkeutstyret skal være plassert slik at slokkeinnsatsen blir effektiv. For mindre byggverk med virksomhet i risikoklasse 1 kan utstyret være plassert i et nærliggende byggverk.</li>
                    <li>Plasseringen av brannslokkeutstyret skal være tydelig merket med mindre det bare er beregnet for personer i én bruksenhet og personene må forventes å være godt kjent med plasseringen.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
              {/* Krav basert på risikoklasse */}
              {(() => {
                const rk = parseInt(formData.risikoklasse.replace(/\D/g, ''), 10);
                const isRK356 = [3, 5, 6].includes(rk);
                const isRK124 = [1, 2, 4].includes(rk);
                const isRK4Bolig = rk === 4;
                // For RK 3/5/6: brannslange er alltid påkrevd
                // For RK 1/2/4: håndslukker er minimum, men brannslange kan velges i tillegg
                const showBrannslange = isRK356 || formData.slokkeBrannslange;
                const showHandslukker = formData.slokkeHandslukker || isRK124;
                
                return (
                  <>
                    {(isRK356 || isRK124 || formData.slokkeBrannslange || formData.slokkeHandslukker) && (
                      <tr>
                        <td className="border border-gray-400 p-2 align-top">Preaksepterte ytelser</td>
                        <td className="border border-gray-400 p-2">
                          <ul className="list-disc ml-4 space-y-1">
                            {isRK356 && (
                              <li>Byggverk i risikoklasse 3, 5 og 6 hvor det er trykkvann, må ha brannslange. Dersom det ikke er tilgang på tilstrekkelig mengde vann, må byggverket ha håndslokkeapparater.</li>
                            )}
                            {isRK124 && !formData.slokkeBrannslange && !formData.slokkeHandslukker && (
                              <li>Byggverk i risikoklasse 1, 2 og 4 må ha enten håndslokkeapparat eller egnet brannslange som rekker inn i alle rom.</li>
                            )}
                            {isRK124 && formData.slokkeBrannslange && formData.slokkeHandslukker && (
                              <li>Byggverk i risikoklasse 1, 2 og 4 må ha enten håndslokkeapparat eller egnet brannslange som rekker inn i alle rom. <span className="font-semibold">Kombinasjonsløsning med både håndslokkeapparat og brannslange er valgt for dette tiltaket.</span></li>
                            )}
                            {isRK124 && formData.slokkeBrannslange && !formData.slokkeHandslukker && (
                              <li>Byggverk i risikoklasse 1, 2 og 4 må ha enten håndslokkeapparat eller egnet brannslange som rekker inn i alle rom. <span className="font-semibold">Brannslange er valgt for dette tiltaket.</span></li>
                            )}
                            {isRK124 && !formData.slokkeBrannslange && formData.slokkeHandslukker && (
                              <li>Byggverk i risikoklasse 1, 2 og 4 må ha enten håndslokkeapparat eller egnet brannslange som rekker inn i alle rom. <span className="font-semibold">Håndslokkeapparat er valgt for dette tiltaket.</span></li>
                            )}
                            {showHandslukker && (
                              <li>Håndslokkeapparater kan være pulverapparater på minimum <span className="font-semibold text-red-600">6 kg</span> med ABC-pulver, eller skum- og vannapparater på minimum <span className="font-semibold text-red-600">9 liter</span> eller på minimum <span className="font-semibold text-red-600">6 liter</span> og med effektivitetsklasse minst <span className="font-semibold text-red-600">21A</span> etter <span className="underline">NS-EN 3-7:2004+A1:2007</span>.</li>
                            )}
                            {showBrannslange && (
                              <li>Brannslanger må ha tilstrekkelig lengde til å nå alle deler av byggverket. Slangene skal være lett tilgjengelige og tydelig merket.</li>
                            )}
                            {showBrannslange && isRK4Bolig && (
                              <li>I bolig kan det benyttes formstabil brannslange med innvendig diameter på minimum <span className="font-semibold text-red-600">10 mm</span>.</li>
                            )}
                          </ul>
                        </td>
                        <td className="border border-gray-400 p-2 align-top">RIBr</td>
                      </tr>
                    )}
                  </>
                );
              })()}
              {formData.manuellSlokking && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                  <td className="border border-gray-400 p-2">{formData.manuellSlokking}</td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.manuellSlokkingKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.manuellSlokkingKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              {/* 3.14 §11-17 Tilrettelegging for slokkemannskap */}
              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.14 &nbsp;&nbsp; §11-17 Tilrettelegging for slokkemannskap</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Generelt</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Byggverk skal plasseres og utformes slik at rednings- og slokkemannskap, med nødvendig utstyr, har brukbar tilgjengelighet til og i byggverket for rednings- og slokkeinnsats.</li>
                    <li>Byggverk skal tilrettelegges slik at en brann lett kan lokaliseres og bekjempes.</li>
                    <li>Branntekniske installasjoner som har betydning for rednings- og slokkeinnsatsen skal være tydelig merket.</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Tilgjengelighet til byggverket</td>
                <td className="border border-gray-400 p-2">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Byggverk inntil 8 etasjer må ha tilgjengelighet for brannvesenets høyderedskap (brannbil utstyrt med maskinstige eller snorkel) slik at alle etasjer og brannseksjoner kan nås.</li>
                    {formData.byggOver23m && (
                      <li>For å oppnå tilgjengelighet må øverste gulv ikke være høyere enn <span className="font-semibold text-red-600">23 meter</span> over laveste punkt på oppstillingsplasser for brannvesenets høyderedskap. I lave byggverk kan det tilrettelegges for bruk av bærbare stiger.</li>
                    )}
                    <li>Det må være tilrettelagt for kjørbar atkomst helt fram til hovedinngangen og brannvesenets angrepsvei i byggverket. For mindre byggverk i risikoklasse 4 og brannklasse 1 kan det aksepteres avstand på inntil <span className="font-semibold text-red-600">50 meter</span>.</li>
                    <li>I byggverk hvor vindu eller balkong utgjør en av rømningsveiene, må det være tilgjengelighet for brannvesenets høyderedskap i samsvar med ytelser angitt i § 11-13.</li>
                    <li>I byggverk med et stort antall personer (vanligvis risikoklasse 5 og 6), må atkomsten som forutsettes benyttet for rednings- og slokkeinnsats, lett kunne åpnes av brannvesenet.</li>
                    <li>I byggverk hvor brannvesenet vil måtte søke gjennom et større antall rom (mer enn 50 rom), må inngangsdør og dører til de enkelte rommene lett kunne åpnes ved hjelp av universalnøkkel som plasseres slik at den er lett tilgjengelig for brannvesenet.</li>
                    <li>For å sikre radiokommunikasjon for rednings- og slokkemannskap, må det i byggverk uten tilfredsstillende innvendig radiodekning og hvor det kan bli behov for redningsinnsats, tilrettelegges med teknisk installasjon slik at rednings- og slokkemannskap kan benytte eget samband.</li>
                    {formData.slangeutlegg50m && (
                      <li>Alle deler av en etasje må kunne nås med maksimalt <span className="font-semibold text-red-600">50 m slangeutlegg</span>. Avstand regnes fra nærmeste brannskille.</li>
                    )}
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 align-top">ARK / RIBr</td>
              </tr>
              {formData.redningsmannskap && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Beskrivelse</td>
                  <td className="border border-gray-400 p-2">{formData.redningsmannskap}</td>
                  <td className="border border-gray-400 p-2 align-top">RIBr</td>
                </tr>
              )}
              {formData.redningsmannskapKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.redningsmannskapKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 4. Utførelses- og driftsfasen */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">4. Utførelses- og driftsfasen</h2>
          
          <h3 className="font-semibold mb-2">4.1 Utførelsesfasen</h3>
          <p className="ml-4 mb-3">[Krav til utførelse beskrives]</p>

          <h3 className="font-semibold mb-2">4.2 Driftsfasen</h3>
          <p className="ml-4 mb-3">[Krav til drift og vedlikehold beskrives]</p>
        </section>

        {/* 5. Revisjonshistorikk */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">5. Revisjonshistorikk</h2>
          <p className="ml-4">[Revisjonslogg]</p>
        </section>

        {/* 6. Litteraturhenvisninger */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">6. Litteraturhenvisninger</h2>
          <ul className="ml-4 list-disc list-inside">
            <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
            <li>VTEK17 - Veiledning til teknisk forskrift</li>
            <li>NS 3901 - Krav til risikovurdering av brann i byggverk</li>
          </ul>
        </section>

        {formData.fravik && (
          <section className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h2 className="font-bold mb-3">Fravik og kompenserende tiltak</h2>
            <p className="ml-4">{formData.fravik}</p>
          </section>
        )}
      </div>
    );
  };

  const exportToWord = async () => {
    const tableBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
    };

    const createTableCell = (text: string, bold: boolean = false, width?: number) => {
      return new TableCell({
        borders: tableBorders,
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold, size: 20 })],
          }),
        ],
      });
    };

    const doc = new Document({
      sections: [
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
            
            // 1. Innledning
            new Paragraph({
              children: [new TextRun({ text: "1. Innledning", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.1 Informasjon om tiltaket", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            // Tabell 1.1
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createTableCell("Bygningstype", true, 33),
                    createTableCell(formData.bygningstype || "[Angis]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("Bruttoareal", true, 33),
                    createTableCell(`${formData.areal || "[Angis]"} m²`),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("Antall etasjer", true, 33),
                    createTableCell(formData.etasjer || "[Angis]"),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Ansvarsrett og tiltaksklasse angis her]",
              spacing: { after: 100 },
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
                children: [new TextRun({ text: "Beskrivelse av fravik:", bold: true })],
                spacing: { after: 50 },
              }),
              new Paragraph({
                text: formData.fravikBeskrivelse || "[Fraviksbeskrivelse angis]",
                spacing: { after: 100 },
              }),
              ...(formData.tiltaksklasse === "Tiltaksklasse 1" ? [
                new Paragraph({
                  children: [new TextRun({ text: "Merk: Prosjektet er i tiltaksklasse 1. Fravik fra preaksepterte ytelser krever normalt høyere tiltaksklasse.", bold: true, italics: true })],
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
              children: [new TextRun({ text: "1.4 Gjeldende regelverk", bold: true, size: 24 })],
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

            // 2. Grunnlag og forutsetninger
            new Paragraph({
              children: [new TextRun({ text: "2. Grunnlag og forutsetninger for brannteknisk prosjektering", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2.1 Grunnlagsdokumenter", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Liste over tegninger og dokumenter]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2.2 Beskrivelse av bygning og branntekniske forutsetninger", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            // Tabell 2.2 - Håndter flere risikoklasser
            ...(formData.harFlereRisikoklasser && formData.bygningsdeler.length > 0 ? [
              new Paragraph({
                children: [new TextRun({ text: "Bygget inneholder flere bygningsdeler med ulike risikoklasser:", italics: true })],
                spacing: { after: 100 },
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
                      createTableCell("Bæresystem", true, 33),
                      createTableCell(formData.baeresystem || "[Angis]"),
                    ],
                  }),
                ],
              }),
            ] : [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCell("Risikoklasse", true, 33),
                      createTableCell(formData.risikoklasse || "[Angis]"),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Brannklasse", true, 33),
                      createTableCell(
                        (formData.brannklasse || "[Angis]") +
                        // Ikke inkluder unntak for RK5 (forsamlingslokale/salgslokale) i dokumentet
                        (formData.brannklasseUnntak && !formData.brannklasseUnntak.includes("preakseptert ytelse nr. 4") ? `\n\n${formData.brannklasseUnntak}` : "")
                      ),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Bæresystem", true, 33),
                      createTableCell(formData.baeresystem || "[Angis]"),
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
              text: "[Eventuelle tilleggskrav beskrives]",
              spacing: { after: 100 },
            }),

            // 3. Branntekniske ytelseskrav
            new Paragraph({
              children: [new TextRun({ text: "3. Beskrivelse av branntekniske ytelseskrav", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            // Tabell 3
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createTableCell("Paragraf", true, 30),
                    createTableCell("Beskrivelse", true),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.1 § 11-4 Bæreevne og stabilitet", true, 30),
                    createTableCell(
                      formData.harFlereRisikoklasser && formData.bygningsdeler.length > 0
                        ? "Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann. Krav til brannmotstand varierer mellom bygningsdelene:\n\n" +
                          "PREAKSEPTERTE YTELSER PER BYGNINGSDEL (jf. VTEK § 11-4):\n\n" +
                          formData.bygningsdeler.map((del, index) => {
                            const delBrannklasse = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                            const bklNum = delBrannklasse?.replace("BKL", "") || "1";
                            
                            const krav: Record<string, { hovedsystem: string; sekundaer: string; trappeløp: string; kjeller: string }> = {
                              "1": { hovedsystem: "R 30 [B 30]", sekundaer: "R 30 [B 30]", trappeløp: "-", kjeller: "R 60 A2-s1,d0 [A 60]" },
                              "2": { hovedsystem: "R 60 [B 60]", sekundaer: "R 60 [B 60]", trappeløp: "R 30 [B 30]", kjeller: "R 90 A2-s1,d0 [A 90]" },
                              "3": { hovedsystem: "R 90 A2-s1,d0 [A 90]", sekundaer: "R 60 A2-s1,d0 [A 60]", trappeløp: "R 30 A2-s1,d0 [A 30]", kjeller: "R 120 A2-s1,d0 [A 120]" },
                              "4": { hovedsystem: "R 120 A2-s1,d0 [A 120]", sekundaer: "R 90 A2-s1,d0 [A 90]", trappeløp: "R 60 A2-s1,d0 [A 60]", kjeller: "R 120 A2-s1,d0 [A 120]" },
                            };
                            
                            const delKrav = krav[bklNum] || krav["1"];
                            
                            return `${del.navn || `Del ${index + 1}`} (${delBrannklasse}):\n` +
                              `  • Hovedbæresystem: ${delKrav.hovedsystem}\n` +
                              `  • Sekundære bærende: ${delKrav.sekundaer}\n` +
                              `  • Trappeløp: ${delKrav.trappeløp}\n` +
                              `  • Under kjeller: ${delKrav.kjeller}`;
                          }).join("\n\n") +
                          "\n\nHøyeste brannklasse i tiltaket er " + (() => {
                            const brannklasser = formData.bygningsdeler.map(d => d.brannklasse || getBrannklasse(d.risikoklasse, d.etasjer, d.harTerrengTilgang, d.areal).brannklasse);
                            const sortertBrannklasser = brannklasser.sort((a, b) => {
                              const orden = ["BKL4", "BKL3", "BKL2", "BKL1"];
                              return orden.indexOf(a) - orden.indexOf(b);
                            });
                            return sortertBrannklasser[0] || "-";
                          })() + ". Krav fra høyeste brannklasse er dimensjonerende for felles bærende konstruksjoner som betjener flere bygningsdeler." +
                          (formData.baereevneKommentar ? `\n\nKommentar:\n${formData.baereevneKommentar}` : "")
                        : (formData.baereevne || `Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann i henhold til brannklasse ${formData.brannklasse || "[angis]"}.`) +
                          (formData.baereevneKommentar ? `\n\nKommentar:\n${formData.baereevneKommentar}` : "")
                    ),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.2 § 11-5 Sikkerhet ved eksplosjon", true, 30),
                    createTableCell(
                      formData.eksplosjonRelevant === "ikke_relevant"
                        ? "RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket."
                        : formData.eksplosjonRelevant === "relevant"
                        ? "Preaksepterte ytelser (jf. VTEK § 11-5):\n\n1. Rom hvor det kan forekomme fare for eksplosjon, må utgjøre en egen branncelle.\n2. Rom hvor det kan forekomme fare for eksplosjon, må ha minst én trykkavlastningsflate for å sikre mot skader på personer og byggverket forøvrig.\n3. Avlastet trykk må ledes bort i sikker retning.\n4. Trykkavlastningsflater må ikke plasseres i takflater og lignende med mindre det dokumenteres at snølast ikke er til hinder for avlastningsflatens funksjon.\n5. Bærende og branncellebegrensende bygningsdeler må om nødvendig forsterkes for å opprettholde rømningsveiers funksjon og forhindre spredning av brann til andre brannceller." +
                          (formData.eksplosjon ? `\n\nBeskrivelse:\n${formData.eksplosjon}` : "")
                        : "[Vurdering av eksplosjonsfare]"
                    ),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.3 § 11-6 Tiltak mot brannspredning mellom byggverk", true, 30),
                    createTableCell(formData.brannspredning || "[Avstandskrav og tiltak beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.4 § 11-7 Brannseksjoner", true, 30),
                    createTableCell(formData.brannseksjoner || "[Seksjonering beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.5 § 11-8 Brannceller", true, 30),
                    createTableCell(formData.branncellerKommentar || "[Branncelleinndeling beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.6 § 11-9 Materialer og produkters egenskaper ved brann", true, 30),
                    createTableCell(
                      "OVERFLATER I BRANNCELLER SOM IKKE ER RØMNINGSVEI\n\n" +
                      "• Overflater på vegger og i himling/tak i branncelle inntil 200 m²: D-s2,d0 [In 2]\n" +
                      "• Overflater på vegger og i himling/tak i branncelle over 200 m²: " + (formData.brannklasse === "BKL1" ? "D-s2,d0 [In 2]" : "B-s1,d0 [In 1]") + "\n" +
                      "• Overflater i sjakter og hulrom: B-s1,d0 [In 1]\n\n" +
                      "OVERFLATER I BRANNCELLER SOM ER RØMNINGSVEI\n\n" +
                      "• Overflater på vegger og i himling/tak: B-s1,d0 [In 1]\n" +
                      "• Overflater på gulv: Dfl-s1 [G]\n\n" +
                      "UTVENDIGE OVERFLATER\n\n" +
                      "• Overflater på ytterkledning: " + (formData.brannklasse === "BKL1" ? "D-s3,d0 [Ut 2]" : "B-s3,d0 [Ut 1]") + "\n" +
                      (() => {
                        const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                        const floors = parseInt(formData.etasjer || '0', 10);
                        if ((formData.brannklasse === "BKL2" || formData.brannklasse === "BKL3") && [1, 2, 4].includes(rk) && floors <= 4) {
                          return "  Unntak: Yttervegg i brannklasse 2 og 3 kan ha D-s3,d0 [Ut 2] når byggverket er i RK 1, 2 eller 4 med inntil 4 etasjer.\n";
                        }
                        return "";
                      })() +
                      "• Overflater i hulrom i ytterveggkonstruksjoner: Som utvendig overflate\n" +
                      (() => {
                        const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                        const floors = parseInt(formData.etasjer || '0', 10);
                        const erBolig = rk === 4;
                        if (formData.brannklasse === "BKL1" || (erBolig && floors <= 3)) {
                          return "  Unntak: " + (formData.brannklasse === "BKL1" ? "Byggverk i brannklasse 1" : "Boliger inntil 3 etasjer") + " kan ha uklassifiserte overflater i hulrom.\n";
                        }
                        return "";
                      })() +
                      "\nKLEDNINGER\n\n" +
                      "• Kledning i branncelle inntil 200 m² (ikke rømningsvei): K₂10 D-s2,d0 [K2]\n" +
                      "• Kledning i branncelle over 200 m² (ikke rømningsvei): " + (formData.brannklasse === "BKL1" ? "K₂10 D-s2,d0 [K2]" : "K₂10 B-s1,d0 [K1]") + "\n" +
                      "• Kledning i branncelle som er rømningsvei: " + (formData.brannklasse === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]") + "\n" +
                      "• Kledning i sjakter og hulrom: " + (formData.brannklasse === "BKL1" ? "K₂10 B-s1,d0 [K1]" : "K₂10 A2-s1,d0 [K1-A]") + "\n\n" +
                      "TAKTEKNING\n\n" +
                      "Taktekning kan bidra til brannspredning i et byggverk og mellom ulike byggverk.\n\n" +
                      "Preaksepterte ytelser:\n" +
                      "1. Taktekning må tilfredsstille klasse BROOF(t2) [Ta].\n" +
                      "2. Teglstein, betongtakstein, skifertak og metallplater kan uten ytterligere dokumentasjon antas å tilfredsstille klasse BROOF(t2) [Ta].\n" +
                      "3. For småhus kan taktekning være uklassifisert der avstanden mellom de enkelte byggverk er minst 8 m.\n" +
                      "4. Ett-sjikts tak av duk og folie må tilfredsstille klasse B-s3,d0 (Ut1).\n\n" +
                      "ISOLASJON\n\n" +
                      "Isolasjonsmaterialer kan bidra til brannspredning og røykutvikling i et byggverk.\n\n" +
                      "Preaksepterte ytelser:\n" +
                      "1. Isolasjon må tilfredsstille klasse A2-s1,d0 med mindre annet er angitt i nr. 2 til 9.\n" +
                      // Sandwichelementer - kun hvis relevant
                      (formData.isolasjonSandwich === "relevant" ? (
                        "2. Produkter (sandwichelementer) som tilfredsstiller klasse B-s1,d0 eller Eurefic-klasse A, kan benyttes i byggverk i risikoklasse 1–4 i brannklasse 1 og i industri- og lagerbygninger i brannklasse 2. For tak gjelder nr. 6 og 7.\n" +
                        "3. Produkter (sandwichelementer) som tilfredsstiller klasse D-s2,d0 eller Eurefic-klasse E, kan benyttes i industri- og lagerbygninger i brannklasse 1. For tak gjelder nr. 6 og 7.\n" +
                        "4. Produkter (sandwichelementer) som ikke tilfredsstiller klasse A2-s1,d0 må være beskyttet av kledning K₂10 A2-s1,d0 [K1-A] mot rømningsveier.\n" +
                        "5. Produkter (sandwichelementer) for små kjøle- og fryserom i risikoklasse 4 kan ha uspesifisert ytelse.\n"
                      ) : "") +
                      // Brennbar isolasjon - kun hvis relevant
                      (formData.isolasjonBrennbar === "relevant" ? (
                        "6. Brennbar isolasjon kan benyttes på oversiden av etasjeskiller mot oppforet tak eller loft som bare kan benyttes som lager, forutsatt at:\n" +
                        "   a) etasjeskilleren mot oppforet tak eller loft er branncellebegrensende bygningsdel dimensjonert for tosidig brannpåkjenning\n" +
                        "   b) takkonstruksjonen over etasjeskilleren ikke har avgjørende betydning for byggverkets stabilitet i rømningsfasen\n" +
                        "7. Brennbar isolasjon kan benyttes i isolerte takflater forutsatt at:\n" +
                        "   a) isolasjonen legges på et bærende underlag som tilfredsstiller klasse A2-s1,d0 og som har dokumentert bæreevne under brann (R-klasse i samsvar med §11-4)\n" +
                        "   b) det bærende underlaget beskytter isolasjonen mot varmepåkjenning fra undersiden. I brannklasse 1 og 2 kan alternativt den brennbare isolasjonen beskyttes på undersiden av isolasjon av klasse A2-s1,d0 med tilstrekkelig tykkelse.\n" +
                        "   c) den brennbare isolasjonen er beskyttet på oversiden av isolasjon med tykkelse 30 mm og som tilfredsstiller klasse A2-s1,d0. Alternativt kan den brennbare isolasjonen oppdeles i arealer på inntil 400 m².\n" +
                        "8. Brennbar isolasjon kan benyttes som utvendig tilleggsisolering av yttervegger med unntak for i byggverk i brannklasse 3 og i byggverk i risikoklasse 6 forutsatt at:\n" +
                        "   a) det benyttes isolasjonssystemer som er dokumentert ved prøving etter SP Fire 105 eller tilsvarende\n" +
                        "   b) fasademateriale og isolasjon må være prøvet som en enhet. Underlaget må ha branntekniske egenskaper som minst tilsvarer det som ble benyttet ved prøving.\n" +
                        "9. Brennbar isolasjon basert på cellulose- eller tekstilfiber og lignende kan benyttes i byggverk i brannklasse 1, og boliger inntil 3 etasjer. Isolasjonen må tilfredsstille Euroklasse E, eller være i samsvar med NT Fire 035. Isolasjonen kan være utildekket i kaldt uinnredet loft og oppforet tak.\n"
                      ) : "") +
                      // Melding hvis ingen av delene er relevante
                      (formData.isolasjonSandwich === "ikke_relevant" && formData.isolasjonBrennbar === "ikke_relevant" 
                        ? "\nDet er ikke planlagt bruk av sandwichelementer eller brennbar isolasjon i tiltaket. Kun hovedkravet om A2-s1,d0 gjelder.\n" 
                        : "") +
                      (formData.materialerKommentar ? "\n\nKommentar:\n" + formData.materialerKommentar : "")
                    ),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.7 § 11-10 Tekniske installasjoner", true, 30),
                    createTableCell(formData.installasjoner || "[Installasjoner beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.8 § 11-11 Generelle krav om rømning og redning", true, 30),
                    createTableCell(formData.romningSikkerhet || "[Rømningsforhold beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider", true, 30),
                    createTableCell(formData.romningTiltak || "[Tiltak beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.10 § 11-13 Utgang fra branncelle", true, 30),
                    createTableCell(formData.utgangBranncelle || "[Utganger beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.11 § 11-14 Rømningsvei", true, 30),
                    createTableCell(formData.romningsvei || "[Rømningsveier beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.12 § 11-16 Tilrettelegging for manuell slokking", true, 30),
                    createTableCell(formData.manuellSlokking || "[Slokkeutstyr beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap", true, 30),
                    createTableCell(formData.redningsmannskap || "[Tilrettelegging beskrives]"),
                  ],
                }),
              ],
            }),

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

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Generer Brannkonsept</h1>
              </div>
            </div>
          </div>
        </header>
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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Generer Brannkonsept</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedProjectId && conceptName && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Lagrer..." : "Lagre"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto">
          {/* Project Selector */}
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            onConceptNameChange={setConceptName}
            onConceptSelect={(cId, pId) => {
              setSelectedProjectId(pId);
              setConceptId(cId);
              loadConcept(cId);
            }}
            conceptName={conceptName}
          />

          {selectedProjectId && (
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
              <Accordion type="multiple" defaultValue={["kap1"]} className="w-full">
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
                      <div className="space-y-2">
                        {(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : []).map((doc, index) => (
                          <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                            <Input 
                              placeholder="Dokumentnavn"
                              value={doc.navn}
                              onChange={(e) => {
                                const updated = [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [])];
                                updated[index] = {...updated[index], navn: e.target.value};
                                setFormData({...formData, grunnlagsdokumenter: updated});
                              }}
                            />
                            <Input 
                              type="date"
                              className="w-36"
                              value={doc.dato}
                              onChange={(e) => {
                                const updated = [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : [])];
                                updated[index] = {...updated[index], dato: e.target.value};
                                setFormData({...formData, grunnlagsdokumenter: updated});
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = (Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : []).filter((_, i) => i !== index);
                                setFormData({...formData, grunnlagsdokumenter: updated});
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData, 
                              grunnlagsdokumenter: [...(Array.isArray(formData.grunnlagsdokumenter) ? formData.grunnlagsdokumenter : []), {navn: "", dato: ""}]
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
                        onValueChange={(value) => setFormData({...formData, tiltaksklasse: value})}
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
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.4 Tilleggskrav</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Eventuelle tilleggskrav fra tiltakshaver, myndigheter eller bruker</Label>
                        <Textarea 
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
                        <Label className="text-xs font-medium mb-1 block">Krav til bærende konstruksjoner (automatisk basert på brannklasse)</Label>
                        <Textarea 
                          value={formData.baereevne}
                          readOnly
                          className="min-h-[140px] bg-muted/50 cursor-default"
                        />
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
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <Label className="text-xs font-medium mb-2 block text-blue-700">Preaksepterte ytelser (jf. VTEK § 11-5)</Label>
                          <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                            <li>Rom hvor det kan forekomme fare for eksplosjon, må utgjøre en egen branncelle.</li>
                            <li>Rom hvor det kan forekomme fare for eksplosjon, må ha minst én trykkavlastningsflate for å sikre mot skader på personer og byggverket forøvrig.</li>
                            <li>Avlastet trykk må ledes bort i sikker retning.</li>
                            <li>Trykkavlastningsflater må ikke plasseres i takflater og lignende med mindre det dokumenteres at snølast ikke er til hinder for avlastningsflatens funksjon.</li>
                            <li>Bærende og branncellebegrensende bygningsdeler må om nødvendig forsterkes for å opprettholde rømningsveiers funksjon og forhindre spredning av brann til andre brannceller.</li>
                          </ol>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.eksplosjonKommentar}
                          onChange={(e) => setFormData({...formData, eksplosjonKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.3 § 11-6 Tiltak mot brannspredning</Label>
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
                      
                      {parseFloat(formData.bygningshoyde) > 9 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-sm font-medium text-orange-800 mb-2">Bygning over 9 meter - krav til brannvegg</p>
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
                      
                      {parseFloat(formData.bygningshoyde) > 0 && parseFloat(formData.bygningshoyde) <= 9 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Bygning under eller lik 9 meter - krav til branncellevegg</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.brannspredningKommentar}
                          onChange={(e) => setFormData({...formData, brannspredningKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.4 § 11-7 Brannseksjoner</Label>
                      </div>
                      
                      {/* Automatisk beregning basert på areal fra kap 2 */}
                      {formData.areal && formData.brannseksjonBrannenergi && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                          <p className="text-sm font-medium text-blue-800">Automatisk vurdering basert på areal ({formData.areal} m²) og brannenergi:</p>
                          {(() => {
                            const arealNum = parseFloat(formData.areal) || 0;
                            const brannenergi = formData.brannseksjonBrannenergi;
                            
                            // Finn maksimale arealer for hvert tiltak
                            const grenser = {
                              "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
                              "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
                              "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 }
                            };
                            
                            const g = grenser[brannenergi as keyof typeof grenser];
                            if (!g) return null;
                            
                            const anbefalinger: string[] = [];
                            
                            if (arealNum <= g.normalt) {
                              anbefalinger.push("✅ Ingen tiltak nødvendig (maks " + g.normalt + " m²)");
                            } else if (arealNum <= g.brannalarm) {
                              anbefalinger.push("⚠️ Brannalarmanlegg anbefales (maks " + g.brannalarm + " m²)");
                            } else if (brannenergi !== "over400" && g.roykventilasjon > 0 && arealNum <= g.roykventilasjon) {
                              anbefalinger.push("⚠️ Røykventilasjon eller sprinkler nødvendig");
                            } else if (arealNum <= g.sprinkler) {
                              anbefalinger.push("🔴 Sprinkleranlegg nødvendig (maks " + (g.sprinkler === Infinity ? "ubegrenset" : g.sprinkler + " m²") + ")");
                            } else {
                              anbefalinger.push("🔴 Arealet overskrider tillatte grenser - seksjonering nødvendig");
                            }
                            
                            return anbefalinger.map((a, i) => <p key={i} className="text-sm text-blue-700">{a}</p>);
                          })()}
                        </div>
                      )}
                      
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
                      
                      {formData.brannseksjonBrannenergi === "over400" && formData.brannseksjonTiltak === "roykventilasjon" && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">⚠️ Røykventilasjon er uegnet for brannenergi over 400 MJ/m²</p>
                        </div>
                      )}
                      
                      {/* Sjekk om valgt tiltak er tilstrekkelig for arealet */}
                      {formData.areal && formData.brannseksjonBrannenergi && formData.brannseksjonTiltak && (
                        (() => {
                          const arealNum = parseFloat(formData.areal) || 0;
                          const brannenergi = formData.brannseksjonBrannenergi;
                          const tiltak = formData.brannseksjonTiltak;
                          
                          const grenser = {
                            "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
                            "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
                            "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 }
                          };
                          
                          const g = grenser[brannenergi as keyof typeof grenser];
                          if (!g) return null;
                          
                          const maksAreal = g[tiltak as keyof typeof g];
                          
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
                                <p className="text-sm text-red-700">⚠️ Arealet ({arealNum} m²) overskrider maksimalt tillatt ({maksAreal} m²) for valgt tiltak. Velg et sterkere tiltak eller del inn i brannseksjoner.</p>
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
                      
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.brannseksjonerKommentar}
                          onChange={(e) => setFormData({...formData, brannseksjonerKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.branncellerKommentar}
                          onChange={(e) => setFormData({...formData, branncellerKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.materialerKommentar}
                          onChange={(e) => setFormData({...formData, materialerKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.installasjonerKommentar}
                          onChange={(e) => setFormData({...formData, installasjonerKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.romningSikkerhetKommentar}
                          onChange={(e) => setFormData({...formData, romningSikkerhetKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.tilretteleggingKommentar}
                          onChange={(e) => setFormData({...formData, tilretteleggingKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.utgangBranncelleKommentar}
                          onChange={(e) => setFormData({...formData, utgangBranncelleKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.romningsveiKommentar}
                          onChange={(e) => setFormData({...formData, romningsveiKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.husdyrRedningKommentar}
                          onChange={(e) => setFormData({...formData, husdyrRedningKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.manuellSlokkingKommentar}
                          onChange={(e) => setFormData({...formData, manuellSlokkingKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.redningsmannskapKommentar}
                          onChange={(e) => setFormData({...formData, redningsmannskapKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
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

              <div className="flex gap-2 mt-6">
                <Button 
                  className="flex-1" 
                  size="lg"
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || !conceptName}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Lagrer..." : "Lagre endringer"}
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating || !conceptName}
                >
                  {isGenerating ? "Genererer..." : "Generer brannkonsept"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Konsept;
