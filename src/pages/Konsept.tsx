import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Flame, ArrowLeft, FileDown, Download, Save, LogIn, X, Plus } from "lucide-react";
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
    gnrBnr: "",
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
    romningTiltak: "",
    romningTiltakKommentar: "",
    utgangBranncelle: "",
    utgangBranncelleKommentar: "",
    romningsvei: "",
    romningsveiKommentar: "",
    manuellSlokking: "",
    manuellSlokkingKommentar: "",
    redningsmannskap: "",
    redningsmannskapKommentar: "",
    eksplosjonKommentar: "",
    // 4. Utførelses- og driftsfasen
    utfoerelse: "",
    drift: "",
    // 5. Revisjonshistorikk
    revisjon: "",
    // 6. Litteraturhenvisninger
    litteratur: "",
    // Fravik
    fravik: "",
  });

  // Load existing concept if conceptId is provided
  useEffect(() => {
    if (conceptId && user) {
      loadConcept(conceptId);
    }
  }, [conceptId, user]);

  // Automatisk beregning av brannklasse basert på risikoklasse, etasjer, terreng-tilgang og areal
  const beregnetBrannklasseResult = getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal);
  
  useEffect(() => {
    if (beregnetBrannklasseResult.brannklasse) {
      setFormData(prev => ({ 
        ...prev, 
        brannklasse: beregnetBrannklasseResult.brannklasse,
        brannklasseUnntak: beregnetBrannklasseResult.brannklasseUnntak || "",
        brannklasseBegrunnelse: "" // Nullstill begrunnelse når automatisk beregnet
      }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal]);

  // Automatisk generering av bæreevne tekst basert på brannklasse, risikoklasse og etasjer
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
            <p className="ml-4">1.3 Avgrensning av tiltak</p>
            <p className="ml-4">1.4 Gjeldende regelverk</p>
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
                <td className="border border-gray-400 p-2">{formData.gnrBnr || "[Angis]"}</td>
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
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Tiltaksklasse</td>
                <td className="border border-gray-400 p-2">{formData.tiltaksklasse || "[Angis]"}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-semibold mb-2">1.3 Avgrensning av tiltak</h3>
          <p className="ml-4 mb-3">{formData.avgrensning || "[Avgrensning beskrives]"}</p>

          <h3 className="font-semibold mb-2">1.4 Gjeldende regelverk</h3>
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
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.9 &nbsp;&nbsp; §11-12 Rømnings- og redningstider</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Tiltak rømning</td>
                <td className="border border-gray-400 p-2">{formData.romningTiltak || "[Tiltak beskrives]"}</td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
              {formData.romningTiltakKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.romningTiltakKommentar}</td>
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

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.11 &nbsp;&nbsp; §11-14 Rømningsvei</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Rømningsveier</td>
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

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.12 &nbsp;&nbsp; §11-16 Manuell slokking</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Slokkeutstyr</td>
                <td className="border border-gray-400 p-2">{formData.manuellSlokking || "[Slokkeutstyr beskrives]"}</td>
                <td className="border border-gray-400 p-2 align-top">RIV</td>
              </tr>
              {formData.manuellSlokkingKommentar && (
                <tr>
                  <td className="border border-gray-400 p-2 align-top">Kommentar</td>
                  <td className="border border-gray-400 p-2 italic">{formData.manuellSlokkingKommentar}</td>
                  <td className="border border-gray-400 p-2 align-top">-</td>
                </tr>
              )}

              <tr className="bg-blue-100">
                <td className="border border-gray-400 p-2 font-bold" colSpan={3}>3.13 &nbsp;&nbsp; §11-17 Redningsmannskap</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left" style={{width: '25%'}}>Forhold</th>
                <th className="border border-gray-400 p-2 text-left">Løsning</th>
                <th className="border border-gray-400 p-2 text-left" style={{width: '10%'}}>Ansvar</th>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 align-top">Tilrettelegging</td>
                <td className="border border-gray-400 p-2">{formData.redningsmannskap || "[Tilrettelegging beskrives]"}</td>
                <td className="border border-gray-400 p-2 align-top">RIBr</td>
              </tr>
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
            new Paragraph({ text: "    1.3 Avgrensning av tiltak", spacing: { after: 30 } }),
            new Paragraph({ text: "    1.4 Gjeldende regelverk", spacing: { after: 50 } }),
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
            new Paragraph({ text: "    3.12 § 11-16 Tilrettelegging for manuell slokking", spacing: { after: 30 } }),
            new Paragraph({ text: "    3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap", spacing: { after: 50 } }),
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
              children: [new TextRun({ text: "1.3 Avgrensning av tiltak", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Avgrensning beskrives]",
              spacing: { after: 100 },
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Project Selector */}
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            onConceptNameChange={setConceptName}
            conceptName={conceptName}
          />

          {selectedProjectId && conceptName && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Prosjektinformasjon</CardTitle>
                  <CardDescription>
                    Fyll inn nødvendig informasjon for å generere brannkonseptet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
              <Accordion type="multiple" defaultValue={["kap1"]} className="w-full">
                {/* Kapittel 1: Innledning */}
                <AccordionItem value="kap1">
                  <AccordionTrigger className="text-base font-semibold">1. Innledning</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Gnr/Bnr</Label>
                            <Input 
                              value={formData.gnrBnr}
                              onChange={(e) => setFormData({...formData, gnrBnr: e.target.value})}
                            />
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Kontrollerende (KPR RiBr)</Label>
                            <Input 
                              value={formData.kprRibr}
                              onChange={(e) => setFormData({...formData, kprRibr: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Tiltaksklasse</Label>
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
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.3 Avgrensning av tiltak</Label>
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
                <AccordionItem value="kap2">
                  <AccordionTrigger className="text-base font-semibold">2. Grunnlag og forutsetninger</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                              onChange={(e) => setFormData({...formData, areal: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Antall etasjer</Label>
                            <Input 
                              value={formData.etasjer}
                              onChange={(e) => setFormData({...formData, etasjer: e.target.value})}
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
                                onValueChange={(value) => setFormData({...formData, risikoklasse: value})}
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
                                onValueChange={(value) => setFormData({...formData, brannklasse: value})}
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
                <AccordionItem value="kap3">
                  <AccordionTrigger className="text-base font-semibold">3. Branntekniske ytelseskrav</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground">3.1 § 11-4 Bæreevne og stabilitet</Label>
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
                      <Label className="text-xs text-muted-foreground">3.2 § 11-5 Sikkerhet ved eksplosjon</Label>
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
                      <Label className="text-xs text-muted-foreground">3.3 § 11-6 Tiltak mot brannspredning</Label>
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
                      <Label className="text-xs text-muted-foreground">3.4 § 11-7 Brannseksjoner</Label>
                      
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
                      <Label className="text-xs text-muted-foreground">3.5 § 11-8 Brannceller</Label>
                      
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
                      <Label className="text-xs text-muted-foreground">3.6 § 11-9 Materialer og produkters egenskaper ved brann</Label>
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
                      <Label className="text-xs text-muted-foreground">3.7 § 11-10 Tekniske installasjoner</Label>
                      
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
                      <Label className="text-xs text-muted-foreground">3.8 § 11-11 Rømning og redning</Label>
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
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.9 § 11-12 Rømnings- og redningstider</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Tiltak for å påvirke tider</Label>
                        <Textarea 
                          value={formData.romningTiltak}
                          onChange={(e) => setFormData({...formData, romningTiltak: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Kommentar</Label>
                        <Textarea 
                          value={formData.romningTiltakKommentar}
                          onChange={(e) => setFormData({...formData, romningTiltakKommentar: e.target.value})}
                          placeholder="Legg til kommentar..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.10 § 11-13 Utgang fra branncelle</Label>
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
                      <Label className="text-xs text-muted-foreground">3.11 § 11-14 Rømningsvei</Label>
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
                      <Label className="text-xs text-muted-foreground">3.12 § 11-16 Manuell slokking</Label>
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
                      <Label className="text-xs text-muted-foreground">3.13 § 11-17 Redningsmannskap</Label>
                      <div>
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
                <AccordionItem value="kap4">
                  <AccordionTrigger className="text-base font-semibold">4. Utførelses- og driftsfasen</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                <AccordionItem value="kap5">
                  <AccordionTrigger className="text-base font-semibold">5. Revisjonshistorikk</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                <AccordionItem value="kap6">
                  <AccordionTrigger className="text-base font-semibold">6. Litteraturhenvisninger</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                <AccordionItem value="fravik">
                  <AccordionTrigger className="text-base font-semibold">Fravik og kompenserende tiltak</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Lagrer..." : "Lagre endringer"}
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Genererer..." : "Generer brannkonsept"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Output */}
          <div className="space-y-4">
            <Card className="shadow-medium">
              <CardHeader>
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
              <CardContent>
                {generatedConcept ? (
                  renderPreview()
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Fyll ut skjemaet og klikk "Generer brannkonsept" for å se resultatet her</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Konsept;
