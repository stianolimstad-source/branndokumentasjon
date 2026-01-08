import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Funksjon for å beregne brannklasse basert på risikoklasse og antall etasjer
// Inkluderer preaksepterte ytelser/unntak fra VTEK § 11-3
const getBrannklasse = (risikoklasse: string, etasjer: string, harTerrengTilgang: string): { brannklasse: string; brannklasseUnntak: string | null } => {
  const rk = parseInt(risikoklasse.replace(/\D/g, ''), 10);
  const floors = parseInt(etasjer, 10);
  
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
  
  // Unntak 5: Byggverk i én etasje i risikoklasse 2 kan oppføres uten spesifisert brannmotstand (med A2-s1,d0)
  // Dette er det sterkeste unntaket og har prioritet over unntak 3
  if (floors === 1 && rk === 2) {
    k.hovedsystem = "Uten spesifisert brannmotstand* (A2-s1,d0 krav)";
    k.sekundaer = "Uten spesifisert brannmotstand* (A2-s1,d0 krav)";
    anvendteUnntak.push("unntak5");
  }
  // Unntak 3: Byggverk i én etasje i risikoklasse 2, 3, og 5 kan ha R 15
  // For RK2 gjelder unntak 5 i stedet (sterkere), så dette gjelder kun RK3 og RK5
  else if (floors === 1 && [3, 5].includes(rk)) {
    k.hovedsystem = "R 15";
    k.sekundaer = "R 15";
    anvendteUnntak.push("unntak3");
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
    eksplosjon: "",
    brannspredning: "",
    brannseksjoner: "",
    brannceller: "",
    materialer: "",
    installasjoner: "",
    romningSikkerhet: "",
    romningTiltak: "",
    utgangBranncelle: "",
    romningsvei: "",
    manuellSlokking: "",
    redningsmannskap: "",
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

  // Automatisk beregning av brannklasse basert på risikoklasse, etasjer og terreng-tilgang
  const beregnetBrannklasseResult = getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang);
  
  useEffect(() => {
    if (beregnetBrannklasseResult.brannklasse) {
      setFormData(prev => ({ 
        ...prev, 
        brannklasse: beregnetBrannklasseResult.brannklasse,
        brannklasseUnntak: beregnetBrannklasseResult.brannklasseUnntak || "",
        brannklasseBegrunnelse: "" // Nullstill begrunnelse når automatisk beregnet
      }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang]);

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

          <h3 className="font-semibold mb-2">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</h3>
          <p className="ml-4 mb-3">[Ansvarsrett og tiltaksklasse angis her]</p>

          <h3 className="font-semibold mb-2">1.3 Avgrensning av tiltak</h3>
          <p className="ml-4 mb-3">[Avgrensning beskrives]</p>

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
          <p className="ml-4 mb-3">[Liste over tegninger og dokumenter]</p>

          <h3 className="font-semibold mb-2">2.2 Beskrivelse av bygning og branntekniske forutsetninger</h3>
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

          <h3 className="font-semibold mb-2">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</h3>
          <p className="ml-4 mb-3">[Eventuelle tilleggskrav beskrives]</p>
        </section>

        {/* 3. Branntekniske ytelseskrav */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">3. Beskrivelse av branntekniske ytelseskrav</h2>
          
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left w-1/4">Paragraf</th>
                <th className="border border-gray-400 p-2 text-left">Beskrivelse</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.1 § 11-4 Bæreevne og stabilitet</td>
                <td className="border border-gray-400 p-2 whitespace-pre-line">
                  {formData.baereevne || `Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann i henhold til brannklasse ${formData.brannklasse || "[angis]"}.`}
                  {formData.baereevneUnntak && formData.baereevneUnntak.length > 0 && (
                    <>
                      <br /><br />
                      <span className="font-semibold">Preaksepterte ytelser / unntak:</span><br />
                      <ul className="list-disc ml-4 mt-1">
                        {formData.baereevneUnntak.map((unntakId, idx) => (
                          <li key={idx}>{baereevneUnntakTekster[unntakId]}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {formData.baereevneKommentar && (
                    <>
                      <br />
                      <span className="font-semibold">Kommentar:</span><br />
                      {formData.baereevneKommentar}
                    </>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.2 § 11-5 Sikkerhet ved eksplosjon</td>
                <td className="border border-gray-400 p-2">{formData.eksplosjon || "[Vurdering av eksplosjonsfare]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.3 § 11-6 Tiltak mot brannspredning mellom byggverk</td>
                <td className="border border-gray-400 p-2">{formData.brannspredning || "[Avstandskrav og tiltak beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.4 § 11-7 Brannseksjoner</td>
                <td className="border border-gray-400 p-2">{formData.brannseksjoner || "[Seksjonering beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.5 § 11-8 Brannceller</td>
                <td className="border border-gray-400 p-2">{formData.brannceller || "[Branncelleinndeling beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.6 § 11-9 Materialer og produkters egenskaper ved brann</td>
                <td className="border border-gray-400 p-2">{formData.materialer || "[Krav til materialer beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.7 § 11-10 Tekniske installasjoner</td>
                <td className="border border-gray-400 p-2">{formData.installasjoner || "[Installasjoner beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.8 § 11-11 Generelle krav om rømning og redning</td>
                <td className="border border-gray-400 p-2">{formData.romningSikkerhet || "[Rømningsforhold beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider</td>
                <td className="border border-gray-400 p-2">{formData.romningTiltak || "[Tiltak beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.10 § 11-13 Utgang fra branncelle</td>
                <td className="border border-gray-400 p-2">{formData.utgangBranncelle || "[Utganger beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.11 § 11-14 Rømningsvei</td>
                <td className="border border-gray-400 p-2">{formData.romningsvei || "[Rømningsveier beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.12 § 11-16 Tilrettelegging for manuell slokking</td>
                <td className="border border-gray-400 p-2">{formData.manuellSlokking || "[Slokkeutstyr beskrives]"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold align-top">3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap</td>
                <td className="border border-gray-400 p-2">{formData.redningsmannskap || "[Tilrettelegging beskrives]"}</td>
              </tr>
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
            // Tabell 2.2
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
                      (formData.brannklasseUnntak ? `\n\n${formData.brannklasseUnntak}` : "")
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
                      (formData.baereevne || `Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann i henhold til brannklasse ${formData.brannklasse || "[angis]"}.`) +
                      (formData.baereevneUnntak && formData.baereevneUnntak.length > 0 
                        ? `\n\nPreaksepterte ytelser / unntak:\n${formData.baereevneUnntak.map((id, idx) => `${idx + 1}. ${baereevneUnntakTekster[id]}`).join('\n')}`
                        : "") +
                      (formData.baereevneKommentar ? `\n\nKommentar:\n${formData.baereevneKommentar}` : "")
                    ),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.2 § 11-5 Sikkerhet ved eksplosjon", true, 30),
                    createTableCell(formData.eksplosjon || "[Vurdering av eksplosjonsfare]"),
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
                    createTableCell(formData.brannceller || "[Branncelleinndeling beskrives]"),
                  ],
                }),
                new TableRow({
                  children: [
                    createTableCell("3.6 § 11-9 Materialer og produkters egenskaper ved brann", true, 30),
                    createTableCell(formData.materialer || "[Krav til materialer beskrives]"),
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
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.2 § 11-5 Sikkerhet ved eksplosjon</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Vurdering av eksplosjonsfare</Label>
                        <Textarea 
                          value={formData.eksplosjon}
                          onChange={(e) => setFormData({...formData, eksplosjon: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.3 § 11-6 Tiltak mot brannspredning</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Avstandskrav og tiltak</Label>
                        <Textarea 
                          value={formData.brannspredning}
                          onChange={(e) => setFormData({...formData, brannspredning: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.4 § 11-7 Brannseksjoner</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Seksjonering beskrives</Label>
                        <Textarea 
                          value={formData.brannseksjoner}
                          onChange={(e) => setFormData({...formData, brannseksjoner: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.5 § 11-8 Brannceller</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Branncelleinndeling</Label>
                        <Textarea 
                          value={formData.brannceller}
                          onChange={(e) => setFormData({...formData, brannceller: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.6 § 11-9 Materialer ved brann</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Krav til materialer</Label>
                        <Textarea 
                          value={formData.materialer}
                          onChange={(e) => setFormData({...formData, materialer: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">3.7 § 11-10 Tekniske installasjoner</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Sprinkler, brannalarm, ventilasjon osv.</Label>
                        <Textarea 
                          value={formData.installasjoner}
                          onChange={(e) => setFormData({...formData, installasjoner: e.target.value})}
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
