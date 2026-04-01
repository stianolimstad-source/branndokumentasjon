import React, { useState, useEffect } from "react";
import { getGarasjeKrav } from "@/lib/garasje-krav";
import { getBrensellagringKrav, BrenselType } from "@/lib/brensellagring-krav";
import { bf85BygningstyperListe, getBygningsbrannklasse, BF85Bygningstype, getBaereevneTekstBF85, bf85BrannveggTabellSkole, getBF85BrannveggKravSkole, getBF85BrannveggKravKap34, BF85Tabell3423Tiltak } from "@/lib/bf85-constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, ArrowLeft, FileDown, Download, Save, LogIn, X, Plus, AlertTriangle, ChevronDown, ChevronRight, Eye, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCanDownload } from "@/hooks/useCanDownload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SendToKSDialog from "@/components/konsept/SendToKSDialog";
import UpdateKSButton from "@/components/konsept/UpdateKSButton";
import KonseptPreview from "@/components/konsept/KonseptPreview";
import { UploadConceptDialog } from "@/components/konsept/UploadConceptDialog";
import { buildChapter3Table } from "@/lib/word-export-chapter3";
import TilstandsvurderingPanel, { TilstandData, emptyTilstand } from "@/components/konsept/TilstandsvurderingPanel";

const SectionCollapsible = ({ label, defaultOpen = false, forceOpen, previewId, children }: { label: string; defaultOpen?: boolean; forceOpen?: boolean; previewId?: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  React.useEffect(() => {
    if (forceOpen !== undefined) setIsOpen(forceOpen);
  }, [forceOpen]);

  const scrollToPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewId) return;
    const el = document.getElementById(previewId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-border/60 rounded-lg overflow-hidden">
      <div className="flex items-center bg-muted/30">
        <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-sm font-bold px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          <span className="text-left">{label}</span>
        </CollapsibleTrigger>
        {previewId && (
          <button
            type="button"
            onClick={scrollToPreview}
            className="p-1.5 mr-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Gå til i forhåndsvisning"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <CollapsibleContent className="px-3 pb-3 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

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
  "Fritidshjem": "RK3",
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
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const canDownload = useCanDownload();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isViewMode = searchParams.get('view') === 'true';
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedConcept, setGeneratedConcept] = useState<string | null>(null);
  const isTilstandRoute = location.pathname === '/tilstandsvurdering';
  const [documentType, setDocumentType] = useState<"brannkonsept" | "tilstandsvurdering">(
    isTilstandRoute || searchParams.get('type') === 'tilstandsvurdering' ? 'tilstandsvurdering' : 'brannkonsept'
  );
  
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
      toast({ 
        title: "Mangler navn", 
        description: documentType === "tilstandsvurdering" 
          ? "Vennligst skriv inn et navn for tilstandsvurderingen" 
          : "Vennligst skriv inn et navn for brannkonseptet", 
        variant: "destructive" 
      });
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

  const [allKap3Open, setAllKap3Open] = useState<boolean | undefined>(undefined);

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
    // KS-status
    ksEgenkontrollStatus: "" as "" | "ok" | "ikke_utfort",
    ksEgenkontrollDato: "",
    ksEgenkontrollUtfortAv: "",
    ksSidemannskontrollStatus: "" as "" | "ok" | "ikke_utfort",
    ksSidemannskontrollDato: "",
    ksSidemannskontrollUtfortAv: "",
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
    // BF85 Kap 30:32 felter
    gesimshoydeEgen: "", // Gjennomsnittlig gesimshøyde egen bygning (motstående vegg)
    gesimshoydeNabo: "", // Gjennomsnittlig gesimshøyde nabobygning (motstående vegg)
    bf85SkiltMedBrannvegg: "nei" as "ja" | "nei", // Om bygningene er skilt med brannvegg
    bf85ErGruppe: "nei" as "ja" | "nei", // Om bygningene er i gruppe
    brannseksjonBrannenergi: "", // "over400", "50-400", "under50" - brukes for arealgrenser (VTEK tabell 1)
    seksjoneringsvegBrannenergi: "", // "under400", "400-600", "600-800" - brukes for brannmotstand (VTEK tabell 2)
    brannseksjonTiltak: "", // "normalt", "brannalarm", "sprinkler", "roykventilasjon"
    brukTEK17Seksjonering: false, // BF85: bruk TEK17-krav ved >400 MJ/m²
    bf85_34_brannbelastning: "", // For Tabell 34:23
    bf85_34_tiltak: "ingen" as BF85Tabell3423Tiltak, // For Tabell 34:23
    innvendigHjorne: "nei" as "ja" | "nei",
    innvendigHjorneAlternativ: "alt1" as "alt1" | "alt2", // alt1 = 8m, alt2 = 5m+5m
    seksjonDorRelevant: false,
    seksjonVinduRelevant: false,
    brannseksjoner: "",
    brannseksjonerKommentar: "",
    brannceller: "",
    branncellerKommentar: "",
    fyrromRelevant: "nei" as "ja" | "nei",
    fyrromKw: "" as "" | "fast" | "under50" | "50-100" | "over100" | "ukjent",
    heismaskinromRelevant: "ja" as "ja" | "nei",
    branncelleTyper: [] as string[],
    dorPlasseringer: [] as string[],
    vinduskravRelevant: false,
    heissjaktkrav: [] as string[],
    trapperomKrav: [] as string[],
    trapperomBeskrivelse: "",
    interntrappBeskrivelse: "",
    roykKontrollKrav: [] as string[],
    vertikalBrannspredningRelevant: false,
    vertikalBrannspredningKrav: [] as string[],
    vinduBrannspredningRelevant: false,
    vinduBrannspredningKrav: [] as string[],
    horisontaltPlasseringer: [] as string[],
    horisontaltParallelleVinduer: [] as { avstand: string }[],
    horisontaltHjorneVinduer: [] as { avstand: string }[],
    branncellerFlerePlanRelevant: false,
    branncellerFlerePlanKrav: [] as string[],
    garasjeRelevant: false,
    garasjePlassering: "" as "" | "i_tiltaket" | "utenfor_tiltaket",
    garasjeAreal: "" as "" | "under_50" | "50_400" | "over_400",
    garasjeBruksenhet: "" as "" | "samme" | "annen",
    garasjeBF85Krav: [] as string[],
    brensellagringRelevant: false,
    brenselType: "" as "" | "fyringsparafin" | "lett_fyringsolje" | "begge",
    brenselMengde: "" as string,
    oljelagringRelevant: false,
    oljelagringBF85Krav: [] as string[],
    husdyrromRelevant: false,
    husdyrromAreal: "" as "" | "under_300" | "over_300",
    materialer: "",
    materialerKommentar: "",
    matNote1: true, // Overflater og kledninger tabell 1A/1B
    matNote2: true, // Hulrom som innvendig overflate
    matNote3: false, // Rom med brannfarlig virksomhet
    matNote4: true, // Minst D-s2,d0 ved analyse
    himlingNote1: true, // Himling A2-s1,d0 eller opphengsystem
    himlingNote2: true, // Overflater over himling som rømningsvei
    isolasjonSandwich: "ikke_relevant" as "relevant" | "ikke_relevant",
    isolasjonBrennbar: "ikke_relevant" as "relevant" | "ikke_relevant",
    bf85_511: false, // :511 Generelt
    bf85_512: false, // :512 Ikke-bærende ytterveggers brannmotstand
    bf85_513: false, // :513 Yttervegger i B-konstruksjon
    bf85_514: false, // :514 Fasademateriale på vegg i A-konstruksjon
    bf85_515: false, // :515 Brennbar isolasjon
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
    tilretteleggingLedd1c: false, // Alternativt tiltak istedenfor automatisk slokkeanlegg
    tilretteleggingLedd1cBeskrivelse: "", // Beskrivelse av alternativt tiltak
    rk6Institusjon: true as boolean, // true = institusjon, false = egeneide boenheter
    tilretteleggingLedd2a: false, // RK2-6 brannalarmanlegg
    // Brannalarm sub-checkboxer
    brannalarmBoligbygg: false, // Boligbygg med leiligheter
    brannalarmParkering: false, // Parkeringskjeller > 1200 m²
    brannalarmPublikum: false, // Ment for publikum
    brannalarmUniversell: false, // Universelt utformet
    brannalarmTalevarsling: false, // Branncelle over flere plan > 1000 personer
    brannalarmTakterrasse: false, // Takterrasse
    alarmValg: "brannalarm", // "brannalarm" eller "roykvarsler"
    tilretteleggingLedd2b: false, // Få personer røykvarslere
    tilretteleggingLedd3: false, // Ledesystem
    ledesystemKrevesAutomatisk: false, // Auto-required for bolig 3+ etasjer
    ledesystemLedelinjer: false,
    ledesystemRomningsmerking: false,
    ledesystemMarkeringsskilt: false,
    ledesystemBoligRomningsveier: false,
    ledesystemForsamling: false,
    ledesystemKontorSkole: false,
    ledesystemStoreBrannceller: false,
    ledesystemStoreBranncellerBeskrivelse: "",
    ledesystemBKL1Varighet: false,
    ledesystemBKL23Varighet: false,
    tilretteleggingLedd4: false, // Evakueringsplaner
    tilretteleggingLedd5: false, // Merking av branntekniske installasjoner
    tilretteleggingLedd5EnBruksenhet: false, // Unntak for én bruksenhet
    tilretteleggingLedd5EnBruksenhetBeskrivelse: "", // Beskrivelse av unntaket
    tilretteleggingKommentar: "",
    romningTiltak: "",
    romningTiltakKommentar: "",
    utgangBranncelle: "",
    utgangBranncelleKommentar: "",
    boenhetKunEttTrapperom: false,
    branncelleFlereEtasjer: false,
    lavtByggverkVinduerRomning: false,
    lavtByggverkEnRomningsretning: false,
    sporadiskOpphold: false,
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
    romningsveiRomMaks20: false, // Rom i rømningsvei inntil 20 m²
    romningsveiRom50E30: false, // Oppholdsrom inntil 50 m²
    romningsveiTrappeValg: "", // én trapp / sammenfallende / flere trapper
    romningsveiSengeliggende: false,
    romningsveiSamtidigRomning: false,
    romningsveiIngenInnsnevring: false,
    romningsveiFriBreddeTrapp: false,
    romningsveiFlereTrapper: false,
    romningsveiKorridorOver30m: false,
    romningsveiPanikkbeslag: false,
    romningsveiSvalgang: false,
    romningsveiSvalgangOver30m: false,
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
    byggOver23m: false,
    slangeutlegg50m: true,
    harRadiokommunikasjon: false,
    harUniversalnokkel: false,
    stortAntallPersonerSlokke: false,
    eksplosjonKommentar: "",
    // 4. Utførelses- og driftsfasen
    utfoerelsInnkjop: "Materialer og produkter skal tilfredsstille dokumentasjonskrav i VTEK §2. Det henvises også til 321.028 Brannsikkerhet. Dokumentasjon av utførelse.",
    utfoerelse: "Midlertidige branntekniske tiltak i utførelsesfasen, for eksempel endringer i rømningssituasjon, og atkomst for redningsmannskap, behandles som et kapittel i en egen SHA-plan ift. krav i byggherreforskriften. Ansvar for etablering og ajourføring av SHA-planen ligger til SHA-koordinator for prosjekteringsfasen og utførelsesfasen.",
    drift: "Det henvises til Brann- og eksplosjonsvernloven og forskrift om brannforebygging for krav som gjelder under driftsfasen. Dersom forutsetninger som er lagt til grunn endres under driften av bygg, må dette tas i betraktning. Det kan være behov for ny vurdering av brannkrav.",
    // 5. Revisjonshistorikk
    revisjoner: [{ nummer: "0", dato: new Date().toISOString().split('T')[0], prosjekterende: "", ks: "", kommentar: "Første utgave" }] as { nummer: string; dato: string; prosjekterende: string; ks: string; kommentar: string }[],
    revisjon: "",
    // 6. Litteraturhenvisninger
    litteratur: "",
    // Prosjekteringsmetode
    prosjekteringsmetode: "preakseptert" as "preakseptert" | "analyse" | "blanding",
    fravikBeskrivelse: "",
    // Fravik
    fravik: "",
    // Tilstandsvurdering per seksjon (kap 3)
    tilstandsvurderinger: {} as Record<string, TilstandData>,
    // Regelverk for tilstandsvurdering
    regelverk: "" as "" | "TEK17" | "TEK10" | "TEK97" | "BF85",
    // BF85 bygningsbrannklasse (1-4) – erstatter risikoklasse og brannklasse
    bygningsbrannklasse: "" as "" | "1" | "2" | "3" | "4",
    bf85Bygningstype: "" as string, // BF85-spesifikk bygningstype for auto-beregning
    bf85Brannbelastning: "" as "" | "under50" | "50-400" | "over400", // For industri/lager
    bf85HarBrannalarm: false, // For kontor
    bf85TekniskeRomRelevant: false, // Kap. 30:33
    bf85LoftKjellerRelevant: false, // Kap. 30:64
    bf85_1332_avtrekk: false, // :1332 Avtrekk
    bf85_16_brannalarmanlegg: false, // :16 Brannalarmanlegg (skoler)
    bf85_sprinkler_installert: false, // Sprinkleranlegg installert (BF85)
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

  // Automatisk aktivering av ledesystem basert på TEK17 § 11-14
  // Boligbygg (RK4) med 3+ etasjer, skoler (RK3), RK5, RK6, og store kontorer/offentlige bygg
  const erBoligMedLedesystemkrav = formData.risikoklasse === "RK4" && (parseInt(formData.etasjer, 10) || 0) >= 3;
  const erSkoleEllerOffentlig = ["RK3", "RK5", "RK6"].includes(formData.risikoklasse);
  const erLedesystemPaakrevd = erBoligMedLedesystemkrav || erSkoleEllerOffentlig;
  
  const ledesystemFravikTekst = erBoligMedLedesystemkrav
    ? "⚠️ Fravik: Ledesystem er påkrevd for boligbygning med flere boenheter i mer enn 2 etasjer (jf. VTEK § 11-14). Ved å fjerne ledesystem må dette dokumenteres som et fravik fra preaksepterte ytelser."
    : erSkoleEllerOffentlig
    ? `⚠️ Fravik: Ledesystem er påkrevd for ${formData.risikoklasse === "RK3" ? "skoler og undervisningsbygg" : formData.risikoklasse === "RK5" ? "overnattingssteder (RK5)" : "pleie- og sykehusbygg (RK6)"} (jf. TEK17 § 11-14). Ved å fjerne ledesystem må dette dokumenteres som et fravik fra preaksepterte ytelser.`
    : "";

  useEffect(() => {
    if (isViewMode) return;
    if (erLedesystemPaakrevd && !formData.tilretteleggingLedd3) {
      const bk = formData.brannklasse || "";
      setFormData(prev => ({
        ...prev,
        tilretteleggingLedd3: true,
        ledesystemKrevesAutomatisk: true,
        ledesystemLedelinjer: true,
        ledesystemRomningsmerking: true,
        ledesystemBoligRomningsveier: erBoligMedLedesystemkrav,
        ledesystemBKL1Varighet: bk === "BKL1" || bk === "-",
        ledesystemBKL23Varighet: bk === "BKL2" || bk === "BKL3",
      }));
    }
    if (!erLedesystemPaakrevd) {
      setFormData(prev => ({ ...prev, ledesystemKrevesAutomatisk: false }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.brannklasse]);

  // Automatisk aktivering av evakueringsplaner for RK2 (kontorer), RK3 (skoler/barnehager), RK5 og RK6
  const erEvakueringsplanPaakrevd = ["RK2", "RK3", "RK5", "RK6"].includes(formData.risikoklasse);
  
  useEffect(() => {
    if (isViewMode) return;
    if (erEvakueringsplanPaakrevd && !formData.tilretteleggingLedd4) {
      setFormData(prev => ({ ...prev, tilretteleggingLedd4: true }));
    }
  }, [formData.risikoklasse]);

  // Automatisk sett slokkeutstyr basert på risikoklasse
  useEffect(() => {
    if (isViewMode) return;
    const alleRK = formData.bygningsdeler?.length
      ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
      : formData.risikoklasse ? [formData.risikoklasse] : [];
    const harRK356 = alleRK.some((rk: string) => ["RK3","RK5","RK6"].includes(rk));
    const harRK124 = alleRK.some((rk: string) => ["RK1","RK2","RK4"].includes(rk));
    
    const updates: any = {};
    if (harRK356 && !formData.slokkeBrannslange) {
      updates.slokkeBrannslange = true;
    }
    if (harRK124 && !formData.slokkeHandslukker) {
      updates.slokkeHandslukker = true;
    }
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData.risikoklasse, formData.bygningsdeler]);


  useEffect(() => {
    if (isViewMode) return;
    if (formData.regelverk !== "BF85" || !formData.bygningstype) return;
    const result = getBygningsbrannklasse(
      formData.bygningstype as BF85Bygningstype,
      parseInt(formData.etasjer, 10) || 0,
      parseFloat(formData.areal) || 0,
      { brannbelastning: formData.bf85Brannbelastning || undefined, harBrannalarm: formData.bf85HarBrannalarm }
    );
    if (result) {
      setFormData(prev => ({ ...prev, bygningsbrannklasse: result.klasse as "" | "1" | "2" | "3" | "4" }));
    }
  }, [formData.etasjer, formData.areal, formData.bygningstype, formData.bf85Brannbelastning, formData.bf85HarBrannalarm, formData.regelverk]);

  // Automatisk generering av bæreevne tekst – skip i view-modus
  useEffect(() => {
    if (isViewMode) return;
    // BF85: use bygningsbrannklasse (1-4) with Tabell 30:41
    if (formData.regelverk === "BF85") {
      if (!formData.bygningsbrannklasse) return;
      const bf85Result = getBaereevneTekstBF85(formData.bygningsbrannklasse);
      if (bf85Result.tekst) {
        setFormData(prev => ({
          ...prev,
          baereevne: bf85Result.tekst,
          baereevneUnntak: [],
        }));
      }
      return;
    }
    // TEK17 and others
    const result = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer);
    if (result.tekst) {
      setFormData(prev => ({ 
        ...prev, 
        baereevne: result.tekst,
        baereevneUnntak: result.anvendteUnntak
      }));
    }
  }, [formData.brannklasse, formData.risikoklasse, formData.etasjer, formData.regelverk, formData.bygningsbrannklasse]);

  // Automatisk BF85 røykventilasjonskrav basert på etasjer
  useEffect(() => {
    if (isViewMode || formData.regelverk !== "BF85") return;
    const etasjer = parseInt(formData.etasjer, 10) || 0;
    if (etasjer > 2) {
      // Auto-add the requirement if not already present
      if (!formData.roykKontrollKrav.includes("bf85_royk_brannventilasjon")) {
        setFormData(prev => ({ ...prev, roykKontrollKrav: [...prev.roykKontrollKrav, "bf85_royk_brannventilasjon"] }));
      }
    } else {
      // Auto-remove if floors <= 2
      if (formData.roykKontrollKrav.includes("bf85_royk_brannventilasjon")) {
        setFormData(prev => ({ ...prev, roykKontrollKrav: prev.roykKontrollKrav.filter((k: string) => k !== "bf85_royk_brannventilasjon") }));
      }
    }
  }, [formData.etasjer, formData.regelverk]);

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

  // Bygg dynamisk litteraturliste basert på konseptets innstillinger
  const genererLitteraturRefs = () => {
    const documentType = window.location.pathname.includes("tilstandsvurdering") ? "tilstandsvurdering" : "brannkonsept";
    const isBF85 = formData.regelverk === "BF85";
    const refs: string[] = [];

    if (documentType === "tilstandsvurdering") {
      if (isBF85) {
        refs.push("Byggeforskrift 1985 (BF85) – Del 3 Brannvern");
      } else {
        refs.push("TEK17 – Forskrift om tekniske krav til byggverk (Byggteknisk forskrift)");
        refs.push("VTEK17 – Veiledning om tekniske krav til byggverk");
      }
      refs.push("NS 3901:2023 – Krav til risikovurdering av brann i byggverk");
    } else {
      refs.push("TEK17 – Forskrift om tekniske krav til byggverk (Byggteknisk forskrift)");
      refs.push("VTEK17 – Veiledning om tekniske krav til byggverk");
      refs.push("NS 3901:2023 – Krav til risikovurdering av brann i byggverk");
      if (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b || formData.brannseksjonTiltak === "sprinkler") {
        refs.push("NS-EN 16925:2018+AC:2020 – Boligsprinkleranlegg – Prosjektering, installasjon og vedlikehold");
        refs.push("NS-EN 12845:2015+A1:2019 – Faste brannslokkesystemer – Automatiske sprinklersystemer");
      }
      if (formData.tilretteleggingLedd2a || formData.alarmValg === "brannalarm" || formData.brannseksjonTiltak === "brannalarm") {
        refs.push("NS 3960:2019 – Brannalarmanlegg – Prosjektering, installering, drift og vedlikehold");
        refs.push("NS-EN 54 (serien) – Brannalarmsystemer");
      }
      if (formData.tilretteleggingLedd2b || formData.alarmValg === "roykvarsler") {
        refs.push("NS 3960:2019 – Brannalarmanlegg – Prosjektering, installering, drift og vedlikehold");
      }
      if (formData.tilretteleggingLedd3) {
        refs.push("NS-EN 1838:2013 – Nødbelysning");
        refs.push("NS 3926:2022 – Visuelle ledesystemer for rømning i bygninger");
      }
      if (formData.brannseksjonTiltak === "roykventilasjon" || formData.ventilasjonRelevant) {
        refs.push("NS-EN 12101-2:2017 – Røyk- og varmeventilasjonssystemer");
      }
      refs.push("NS-EN 13501-2:2016 – Brannklassifisering av byggevarer og bygningsdeler – Del 2: Klassifisering ved brannmotstandsprøving");
      refs.push("NS-EN 13501-1:2019 – Brannklassifisering av byggevarer og bygningsdeler – Del 1: Klassifisering ved prøving av reaksjon på brann");
      refs.push("NS-EN 1125:2008 – Bygningsbeslag – Panikkbeslag for nødutganger");
      refs.push("NS-EN 179:2008 – Bygningsbeslag – Nødutgangsbeslag for rømningsveier");
      if (formData.brannseksjonBrannenergi || formData.seksjoneringsvegBrannenergi) {
        refs.push("NS-EN 1991-1-2:2002+NA:2008 – Eurokode 1: Laster på konstruksjoner – Del 1-2: Allmenne laster – Brannpåvirkning");
      }
      if (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) {
        refs.push("NS 3910:2020 – Brannvesen – Innsatsmuligheter");
      }
      if (formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") {
        refs.push("NS 3901:2023 – Krav til risikovurdering av brann i byggverk (brannteknisk analyse)");
      }
    }
    return [...new Set(refs)].join("\n");
  };

  // Sett litteratur kun ved første lasting (når feltet er tomt)
  useEffect(() => {
    if (isViewMode) return;
    if (!formData.litteratur) {
      const newLitteratur = genererLitteraturRefs();
      setFormData(prev => ({ ...prev, litteratur: newLitteratur }));
    }
  }, [isViewMode]);



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
        const loadedContent = data.content as any;
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
        // For BF85: always regenerate bæreevne from Tabell 30:41 based on bygningsbrannklasse
        if (loadedContent.regelverk === "BF85" && loadedContent.bygningsbrannklasse) {
          const bf85Result = getBaereevneTekstBF85(loadedContent.bygningsbrannklasse);
          if (bf85Result.tekst) {
            loadedContent.baereevne = bf85Result.tekst;
            loadedContent.baereevneUnntak = [];
          }
        }
        // Fyll inn standardtekster for kap 4 hvis tomme
        const kap4Defaults = {
          utfoerelsInnkjop: "Materialer og produkter skal tilfredsstille dokumentasjonskrav i VTEK §2. Det henvises også til 321.028 Brannsikkerhet. Dokumentasjon av utførelse.",
          utfoerelse: "Midlertidige branntekniske tiltak i utførelsesfasen, for eksempel endringer i rømningssituasjon, og atkomst for redningsmannskap, behandles som et kapittel i en egen SHA-plan ift. krav i byggherreforskriften. Ansvar for etablering og ajourføring av SHA-planen ligger til SHA-koordinator for prosjekteringsfasen og utførelsesfasen.",
          drift: "Det henvises til Brann- og eksplosjonsvernloven og forskrift om brannforebygging for krav som gjelder under driftsfasen. Dersom forutsetninger som er lagt til grunn endres under driften av bygg, må dette tas i betraktning. Det kan være behov for ny vurdering av brannkrav.",
        };
        for (const [key, val] of Object.entries(kap4Defaults)) {
          if (!loadedContent[key]) loadedContent[key] = val;
        }
        setFormData({ ...formData, ...loadedContent });
        // Load document type if saved
        if (loadedContent.documentType) {
          setDocumentType(loadedContent.documentType);
        }
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
          content: JSON.parse(JSON.stringify({ ...formData, documentType })),
          status: generatedConcept ? 'draft' : 'draft',
        })
        .eq('id', conceptId);

      if (error) {
        toast({
          title: "Feil",
          description: documentType === "tilstandsvurdering" 
            ? "Kunne ikke oppdatere tilstandsvurderingen" 
            : "Kunne ikke oppdatere brannkonseptet",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lagret",
          description: documentType === "tilstandsvurdering" 
            ? "Tilstandsvurderingen er oppdatert" 
            : "Brannkonseptet er oppdatert",
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
          content: JSON.parse(JSON.stringify({ ...formData, documentType })),
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Feil",
          description: documentType === "tilstandsvurdering" 
            ? "Kunne ikke lagre tilstandsvurderingen" 
            : "Kunne ikke lagre brannkonseptet",
          variant: "destructive",
        });
      } else if (data) {
        setConceptId(data.id);
        toast({
          title: "Lagret",
          description: documentType === "tilstandsvurdering" 
            ? "Tilstandsvurderingen er lagret" 
            : "Brannkonseptet er lagret",
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

  // Tilstandsvurdering sections definition – depends on regelverk
  const tilstandSectionsTEK17 = [
    { key: "3_1", label: "3.1 Bæreevne og stabilitet" },
    { key: "3_2", label: "3.2 Sikkerhet ved eksplosjon" },
    { key: "3_3", label: "3.3 Brannspredning mellom byggverk" },
    { key: "3_4", label: "3.4 Brannseksjoner" },
    { key: "3_5", label: "3.5 Brannceller" },
    { key: "3_6", label: "3.6 Materialer" },
    { key: "3_7", label: "3.7 Tekniske installasjoner" },
    { key: "3_8", label: "3.8 Rømning og redning" },
    { key: "3_9", label: "3.9 Tilrettelegging for rømning" },
    { key: "3_10", label: "3.10 Utgang fra branncelle" },
    { key: "3_11", label: "3.11 Rømningsvei" },
    { key: "3_12", label: "3.12 Redning av husdyr" },
    { key: "3_13", label: "3.13 Manuell slokking" },
    { key: "3_14", label: "3.14 Slokkemannskap" },
  ];

  // BF85 uses the same section keys and labels as TEK17
  const tilstandSections = tilstandSectionsTEK17;

  const updateTilstand = (sectionKey: string, data: TilstandData) => {
    setFormData(prev => ({
      ...prev,
      tilstandsvurderinger: {
        ...prev.tilstandsvurderinger,
        [sectionKey]: data,
      },
    }));
  };

  const getTilstand = (sectionKey: string): TilstandData => {
    return formData.tilstandsvurderinger[sectionKey] || emptyTilstand();
  };

  const renderTilstandPanel = (sectionKey: string) => {
    if (documentType !== "tilstandsvurdering") return null;
    const section = tilstandSections.find(s => s.key === sectionKey);
    if (!section) return null;
    return (
      <TilstandsvurderingPanel
        sectionKey={section.key}
        sectionLabel={section.label}
        data={getTilstand(section.key)}
        onChange={(data) => updateTilstand(section.key, data)}
      />
    );
  };

  const renderPreview = () => <KonseptPreview formData={formData} logoUrl={logoUrl} authorInfo={authorInfo} documentType={documentType} />;

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
      text: documentType === "tilstandsvurdering" ? "TILSTANDSVURDERING" : "BRANNKONSEPT",
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

    const wordFooter = { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) };

    // A4 page with narrower margins for wider content area (matching preview)
    const pageProperties = {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm margins (narrower than default ~2.5cm)
      },
    };

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
          properties: pageProperties,
          footers: wordFooter,
          children: coverPageChildren,
        },
        // Sammendrag (egen side)
        ...(formData.sammendrag ? [{
          properties: pageProperties,
          footers: wordFooter,
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Sammendrag" })] }),
            new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: formData.sammendrag, size: 22 })] }),
          ],
        }] : []),
        // Tilstandsgrader (egen side, kun for tilstandsvurdering)
        ...(documentType === "tilstandsvurdering" ? [{
          properties: pageProperties,
          footers: wordFooter,
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Tilstandsgrader", bold: true })] }),
            new Paragraph({
              spacing: { after: 200 },
              children: [new TextRun({ text: "Ved tilstandsvurdering bruker man tilstandsgrader for å prioritere mangler med tanke på oppfølging. Tabellen nedenfor gir oversikt over grader for bruk i brannteknisk tilstandsanalyse. Graderingen er tilpasset tilstandsgradering i NS 3424, slik at den branntekniske tilstandsanalysen kan integreres i flerfaglig teknisk analyse av bygningen.", size: 20 })],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: [new TextRun({ text: "Denne rapporten er basert på en NS 3424 nivå 1 tilstandsvurdering.", size: 20 })],
            }),
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: "Tilstandsgrader", bold: true, size: 20 })],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header row 1
                new TableRow({
                  children: [
                    new TableCell({ borders: tableBorders, width: { size: 14, type: WidthType.PERCENTAGE }, rowSpan: 2, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ children: [] })] }),
                    new TableCell({ borders: tableBorders, columnSpan: 5, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TILSTANDSGRADER", bold: true, size: 18 })] })] }),
                  ],
                }),
                // Header row 2
                new TableRow({
                  children: [
                    new TableCell({ borders: tableBorders, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TG 0", bold: true, size: 16 })]}), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ingen avvik", size: 16 })]})] }),
                    new TableCell({ borders: tableBorders, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TG 1", bold: true, size: 16 })]}), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mindre eller moderate avvik", size: 16 })]})] }),
                    new TableCell({ borders: tableBorders, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TG 2", bold: true, size: 16 })]}), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vesentlige avvik", size: 16 })]})] }),
                    new TableCell({ borders: tableBorders, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TG 3", bold: true, size: 16 })]}), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Store eller alvorlige avvik", size: 16 })]})] }),
                    new TableCell({ borders: tableBorders, shading: { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" }, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TG IU", bold: true, size: 16 })]}), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ikke undersøkt", size: 16 })]})] }),
                  ],
                }),
                // Teknisk tilstand
                new TableRow({
                  children: [
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ children: [new TextRun({ text: "Teknisk tilstand", bold: true, size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Samsvar med referansenivå. Ingen tiltak nødvendig", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tilstrekkelig med fortsatt normalt vedlikehold", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Behov for omfattende vedlikehold i form av reparasjon/utbedring", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bygning, bygningsdel eller tiltak har funksjonssvikt eller kan umiddelbart svikte. Behov for omfattende reparasjon eller utskifting", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vesentlige forhold som ikke er dokumentert eller som ikke kan avklares uten omfattende undersøkelser", size: 16 })] })] }),
                  ],
                }),
                // Branntekniske spesifiseringer
                new TableRow({
                  children: [
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ children: [new TextRun({ text: "Branntekniske spesifiseringer", bold: true, size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Løsning i henhold til referansesikkerhetsnivå eller brannkonsept i henhold til aktuell forskrift", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mindre avvik som ikke har stor betydning for person- og verdisikkerheten", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mangler i tekniske eller organisatoriske forhold, som gir vesentlig dårligere sikkerhet enn forutsatt i referansenivået. Manglene kan skyldes slitasje, byggefeil, ukyndig vedlikehold og dårlige organisatoriske rutiner.", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vesentlige mangler i den tekniske eller organisatoriske sikkerheten i forhold til det forutsatte referansenivået. Har uakseptabel risiko for mennesker, materiell eller miljø", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Skjult bærekonstruksjon. Manglende beregninger. Udokumentert utførelse", size: 16 })] })] }),
                  ],
                }),
                // Tiltak
                new TableRow({
                  children: [
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ children: [new TextRun({ text: "Tiltak", bold: true, size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ingen tiltak er nødvendig", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Utbedres innen 5 år", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Utbedres innen 2 år", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Må utbedres straks", size: 16 })] })] }),
                    new TableCell({ borders: tableBorders, margins: { top: 20, bottom: 20, left: 30, right: 30 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Må føyes til øvrig tilstandsanalyse når utført", size: 16 })] })] }),
                  ],
                }),
              ],
            }),
          ],
        }] : []),
        // Innholdsfortegnelse (egen side)
        {
          properties: pageProperties,
          footers: wordFooter,
          children: [
            new Paragraph({
              text: documentType === "tilstandsvurdering" ? "TILSTANDSVURDERING" : "BRANNKONSEPT",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Innholdsfortegnelse
            new Paragraph({
              children: [new TextRun({ text: "Innholdsfortegnelse", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            ...(documentType === "tilstandsvurdering" ? [
              new Paragraph({ children: [new TextRun({ text: "1. Innledning", bold: true, size: 22 })], spacing: { after: 50 } }),
              new Paragraph({ text: "    1.1 Informasjon om tiltaket", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.2 Avgrensning av vurderingen", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.3 Bygningsinformasjon", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.4 Grunnlagsdokumenter", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.5 Branntekniske forutsetninger", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.6 Tilleggskrav", spacing: { after: 50 } }),
              new Paragraph({ children: [new TextRun({ text: "2. Brannteknisk tilstandsvurdering", bold: true, size: 22 })], spacing: { after: 50 } }),
              new Paragraph({ text: "    2.1 § 11-4 Bæreevne og stabilitet", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.2 § 11-5 Sikkerhet ved eksplosjon", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.3 § 11-6 Tiltak mot brannspredning mellom byggverk", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.4 § 11-7 Brannseksjoner", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.5 § 11-8 Brannceller", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.6 § 11-9 Materialer og produkters egenskaper ved brann", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.7 § 11-10 Tekniske installasjoner", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.8 § 11-11 Generelle krav om rømning og redning", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.10 § 11-13 Utgang fra branncelle", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.11 § 11-14 Rømningsvei", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.12 § 11-16 Tilrettelegging for manuell slokking", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap", spacing: { after: 50 } }),
              new Paragraph({ children: [new TextRun({ text: "3. Revisjonshistorikk", bold: true, size: 22 })], spacing: { after: 50 } }),
              new Paragraph({ children: [new TextRun({ text: "4. Litteraturhenvisninger", bold: true, size: 22 })], spacing: { after: 200 } }),
            ] : [
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
            ]),
          ],
        },
        {
          properties: pageProperties,
          footers: wordFooter,
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
                ...(documentType !== "tilstandsvurdering" ? [
                  new TableRow({ children: [createTableCell("Type tiltak", true, 33), createTableCell(formData.tiltakstype || "[Angis]")] }),
                ] : [
                  new TableRow({ children: [createTableCell("Kunde", true, 33), createTableCell(formData.kunde || "[Angis]")] }),
                ]),
                new TableRow({ children: [createTableCell("Beskrivelse av tiltaket", true, 33), createTableCell(formData.tiltaksbeskrivelse || "[Angis]")] }),
                new TableRow({ children: [createTableCell("Særskilt brannobjekt", true, 33), createTableCell(formData.saerskiltBrannobjekt || "[Angis]")] }),
              ],
            }),
            ...(documentType !== "tilstandsvurdering" ? [
              // Brannkonsept: 1.2 SAK10, 1.3 Prosjekteringsmetode, 1.4 Avgrensning, 1.5 Regelverk
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
              new Paragraph({ text: "• TEK17 - Forskrift om tekniske krav til byggverk", spacing: { after: 50 } }),
              new Paragraph({ text: "• VTEK17 - Veiledning til teknisk forskrift", spacing: { after: 100 } }),
            ] : [
              // Tilstandsvurdering: 1.2 Avgrensning
              new Paragraph({
                children: [new TextRun({ text: "1.2 Avgrensning av vurderingen", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: formData.avgrensning || "[Avgrensning beskrives]",
                spacing: { after: 100 },
              }),
            ]),
          ],
        },
        {
          properties: pageProperties,
          footers: wordFooter,
          children: [
            ...(documentType === "tilstandsvurdering" ? [
              // Tilstandsvurdering: 1.3 Bygningsinfo, 1.4 Grunnlagsdokumenter, 1.5 Forutsetninger, 1.6 Tilleggskrav
              new Paragraph({
                children: [new TextRun({ text: "1. Innledning (forts.)", bold: true, size: 28 })],
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "1.3 Bygningsinformasjon", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [createTableCell("Bygningstype", true, 33), createTableCell(formData.bygningstype || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Bruttoareal", true, 33), createTableCell(`${formData.areal || "[Angis]"} m²`)] }),
                  new TableRow({ children: [createTableCell("Antall etasjer", true, 33), createTableCell(formData.etasjer || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Risikoklasse", true, 33), createTableCell(formData.risikoklasse || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Brannklasse", true, 33), createTableCell(formData.brannklasse || "[Angis]")] }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: "1.4 Grunnlagsdokumenter", bold: true, size: 24 })],
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
                new Paragraph({ text: "[Liste over tegninger og dokumenter]", spacing: { after: 100 } }),
              ]),
              new Paragraph({
                children: [new TextRun({ text: "1.5 Branntekniske forutsetninger", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: formData.tiltaksbeskrivelse || "[Branntekniske forutsetninger beskrives]",
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "1.6 Tilleggskrav", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: formData.tilleggskrav || "[Eventuelle tilleggskrav beskrives]",
                spacing: { after: 100 },
              }),
            ] : [
              // Brannkonsept: chapter 2
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
                new Paragraph({ text: "[Liste over tegninger og dokumenter]", spacing: { after: 100 } }),
              ]),
              new Paragraph({
                children: [new TextRun({ text: "2.2 Beskrivelse av bygning og branntekniske forutsetninger", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              ...(formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0 ? [
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
                              spacing: { before: 40, after: 40 },
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
                              spacing: { before: 40, after: 40 },
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
            ]),
          ],
        },
        {
          properties: pageProperties,
          footers: wordFooter,
          children: [
            // 3. Branntekniske ytelseskrav
            new Paragraph({
              children: [new TextRun({ text: documentType === "tilstandsvurdering" ? "2. Brannteknisk tilstandsvurdering" : "3. Beskrivelse av branntekniske ytelseskrav", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            // Tabell 3 - 3-column structure matching preview
            await buildChapter3Table(formData),
          ],
        },
        // 4. Utførelses- og driftsfasen + 5. Revisjonshistorikk - egen side
        {
          properties: pageProperties,
          footers: wordFooter,
          children: [
            // 4. Utførelses- og driftsfasen (kun for brannkonsept)
            ...(documentType !== "tilstandsvurdering" ? [
            new Paragraph({
              children: [new TextRun({ text: "4. Utførelses- og driftsfasen", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4.1 Utførelsesfasen", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Til innkjøpsfasen", bold: true, size: 20 })],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              text: formData.utfoerelsInnkjop || "Materialer og produkter skal tilfredsstille dokumentasjonskrav i VTEK §2. Det henvises også til 321.028 Brannsikkerhet. Dokumentasjon av utførelse.",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Til utførelsesfasen", bold: true, size: 20 })],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              text: formData.utfoerelse || "Midlertidige branntekniske tiltak i utførelsesfasen, for eksempel endringer i rømningssituasjon, og atkomst for redningsmannskap, behandles som et kapittel i en egen SHA-plan ift. krav i byggherreforskriften. Ansvar for etablering og ajourføring av SHA-planen ligger til SHA-koordinator for prosjekteringsfasen og utførelsesfasen.",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4.2 Driftsfasen", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.drift || "Det henvises til Brann- og eksplosjonsvernloven og forskrift om brannforebygging for krav som gjelder under driftsfasen. Dersom forutsetninger som er lagt til grunn endres under driften av bygg, må dette tas i betraktning. Det kan være behov for ny vurdering av brannkrav.",
              spacing: { after: 100 },
            }),
            ] : []),

            // Revisjonshistorikk
            new Paragraph({
              children: [new TextRun({ text: `${documentType === "tilstandsvurdering" ? "3" : "5"}. Revisjonshistorikk`, bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            ...(formData.revisjoner && formData.revisjoner.length > 0 ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCellShaded("Rev.", true, 8),
                      createTableCellShaded("Dato", true, 15),
                      createTableCellShaded("Prosjekterende", true, 25),
                      createTableCellShaded("KS", true, 25),
                      createTableCellShaded("Kommentar", true, 27),
                    ],
                  }),
                  ...formData.revisjoner.map((rev: any) =>
                    new TableRow({
                      children: [
                        createTableCell(rev.nummer || "—", false, 8),
                        createTableCell(rev.dato || "—", false, 15),
                        createTableCell(rev.prosjekterende || "—", false, 25),
                        createTableCell(rev.ks || "—", false, 25),
                        createTableCell(rev.kommentar || "—", false, 27),
                      ],
                    })
                  ),
                ],
              }),
            ] : [
              new Paragraph({
                text: formData.revisjon || "[Revisjonslogg]",
                spacing: { after: 100 },
              }),
            ]),

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
        // Litteraturhenvisninger - egen side
        {
          properties: pageProperties,
          footers: wordFooter,
          children: [
            new Paragraph({
              children: [new TextRun({ text: `${documentType === "tilstandsvurdering" ? "4" : "6"}. Litteraturhenvisninger`, bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            ...((formData.litteratur || "").split("\n").filter((r: string) => r.trim()).map((ref: string) =>
              new Paragraph({
                text: `• ${ref.replace(/^[•\-]\s*/, "")}`,
                spacing: { after: 50 },
              })
            )),
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
        <div className="max-w-[1800px] mx-auto space-y-4">
          {/* Back button to project */}
          {selectedProjectId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/prosjekt/${selectedProjectId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake til prosjekt
            </Button>
          )}
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
                  <Label htmlFor="create-concept-name">{documentType === "tilstandsvurdering" ? "Navn på tilstandsvurderingen" : "Navn på brannkonseptet"} *</Label>
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
                        <Label htmlFor="concept-name" className="text-sm font-semibold">{documentType === "tilstandsvurdering" ? "Navn på tilstandsvurderingen" : "Navn på brannkonseptet"} *</Label>
                        <Input
                          id="concept-name"
                          placeholder="f.eks. Brannkonsept rev. A"
                          value={conceptName}
                          onChange={(e) => setConceptName(e.target.value)}
                        />
                      </div>

                      {/* Regelverk-velger for tilstandsvurdering */}
                      {documentType === "tilstandsvurdering" && (
                        <div className="space-y-2 p-4 rounded-lg border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700">
                          <Label htmlFor="regelverk" className="text-sm font-semibold">Gjeldende regelverk *</Label>
                          {formData.regelverk ? (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 rounded-md border bg-muted/50 text-sm font-medium">
                                  {formData.regelverk === "TEK17" ? "TEK17 (2017–)" : 
                                   formData.regelverk === "TEK10" ? "TEK10 (2010–2017)" : 
                                   formData.regelverk === "TEK97" ? "TEK97 (1997–2010)" : 
                                   "BF85 (1985–1997)"}
                                </div>
                                <span className="text-xs text-muted-foreground italic">Låst</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Regelverket kan ikke endres etter at det er valgt. Opprett en ny tilstandsvurdering for å bruke et annet regelverk.</p>
                              {formData.regelverk !== "TEK17" && formData.regelverk !== "BF85" && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                                  ⚠ Kravene for {formData.regelverk} kan avvike fra TEK17. Tilpassede krav kommer snart.
                                </p>
                              )}
                              {formData.regelverk === "BF85" && (
                                <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-1">
                                  ✓ Kravene er tilpasset BF85 (Byggeforskrift 1985).
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground">Velg regelverket bygget er prosjektert etter. <strong>Dette valget kan ikke endres etterpå.</strong></p>
                              <Select
                                value={formData.regelverk}
                                onValueChange={(val) => {
                                  const label = val === "TEK17" ? "TEK17 (2017–)" : 
                                                val === "TEK10" ? "TEK10 (2010–2017)" : 
                                                val === "TEK97" ? "TEK97 (1997–2010)" : 
                                                "BF85 (1985–1997)";
                                  if (window.confirm(`Er du sikker på at du vil velge ${label}? Dette valget kan ikke endres etterpå.`)) {
                                    setFormData({ ...formData, regelverk: val as any });
                                  }
                                }}
                              >
                                <SelectTrigger id="regelverk" className="bg-background">
                                  <SelectValue placeholder="Velg regelverk..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TEK17">TEK17 (2017–)</SelectItem>
                                  <SelectItem value="TEK10">TEK10 (2010–2017)</SelectItem>
                                  <SelectItem value="TEK97">TEK97 (1997–2010)</SelectItem>
                                  <SelectItem value="BF85">BF85 (1985–1997)</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                        </div>
                      )}

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

              <Accordion type="multiple" defaultValue={[]} className="w-full">
                {/* Sammendrag */}
                <AccordionItem value="sammendrag" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">S</span>
                        Sammendrag
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-sammendrag')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                        Innledning
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap1')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                        {documentType !== "tilstandsvurdering" && (
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
                        )}
                        {documentType === "tilstandsvurdering" && (
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Kunde</Label>
                          <Input 
                            value={formData.kunde}
                            onChange={(e) => setFormData({...formData, kunde: e.target.value})}
                            placeholder="Navn på kunde/oppdragsgiver"
                          />
                        </div>
                        )}
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
                    {documentType !== "tilstandsvurdering" && (
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
                    )}
                    {/* Skjul 1.3 for tilstandsvurderinger */}
                    {documentType !== "tilstandsvurdering" && (
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
                    )}
                    {documentType === "tilstandsvurdering" ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.2 Avgrensning av vurderingen</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Beskriv avgrensning av vurderingen</Label>
                        <Textarea 
                          value={formData.avgrensning}
                          onChange={(e) => setFormData({...formData, avgrensning: e.target.value})}
                          placeholder="Beskriv hva som inngår i tilstandsvurderingen og eventuelle begrensninger..."
                        />
                      </div>
                    </div>
                    ) : (
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
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 2: Grunnlag og forutsetninger */}
                <AccordionItem value="kap2" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                        Grunnlag og forutsetninger
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap2')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.1 Bygningsinformasjon</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Bygningstype</Label>
                          {documentType === "tilstandsvurdering" && formData.regelverk === "BF85" ? (
                            <Select 
                              value={formData.bygningstype}
                              onValueChange={(value) => {
                                const result = getBygningsbrannklasse(
                                  value as BF85Bygningstype,
                                  parseInt(formData.etasjer, 10) || 0,
                                  parseFloat(formData.areal) || 0,
                                  { brannbelastning: formData.bf85Brannbelastning || undefined, harBrannalarm: formData.bf85HarBrannalarm }
                                );
                                setFormData({
                                  ...formData,
                                  bygningstype: value,
                                  bygningsbrannklasse: (result?.klasse || "") as "" | "1" | "2" | "3" | "4",
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Velg bygningstype (BF85)" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {bf85BygningstyperListe.map((bt) => (
                                  <SelectItem key={bt.value} value={bt.value}>
                                    {bt.label} ({bt.kap})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
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
                          )}
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
                        {/* BF85: Bygningsbrannklasse i stedet for risikoklasse + brannklasse */}
                        {documentType === "tilstandsvurdering" && formData.regelverk === "BF85" ? (
                          (() => {
                            const bf85Result = formData.bygningstype
                              ? getBygningsbrannklasse(
                                  formData.bygningstype as BF85Bygningstype,
                                  parseInt(formData.etasjer, 10) || 0,
                                  parseFloat(formData.areal) || 0,
                                  {
                                    brannbelastning: formData.bf85Brannbelastning || undefined,
                                    harBrannalarm: formData.bf85HarBrannalarm,
                                  }
                                )
                              : null;
                            return (
                          <div className="space-y-3">
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-md">
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                BF85 bruker bygningsbrannklasse (1–4) i stedet for risikoklasse og brannklasse. Bygningsbrannklassen beregnes automatisk basert på bygningstype, etasjer og areal iht. Kap. 31–39.
                              </p>
                            </div>

                            {/* Ekstra felt for industri/lager: brannbelastning */}
                            {(formData.bygningstype === "Industri" || formData.bygningstype === "Lager") && (
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Spesifikk brannbelastning (MJ/m²)</Label>
                                <Select
                                  value={formData.bf85Brannbelastning}
                                  onValueChange={(value) => {
                                    const result = getBygningsbrannklasse(
                                      formData.bygningstype as BF85Bygningstype,
                                      parseInt(formData.etasjer, 10) || 0,
                                      parseFloat(formData.areal) || 0,
                                      { brannbelastning: value as any, harBrannalarm: formData.bf85HarBrannalarm }
                                    );
                                    setFormData({
                                      ...formData,
                                      bf85Brannbelastning: value as any,
                                      bygningsbrannklasse: (result?.klasse || "") as "" | "1" | "2" | "3" | "4",
                                    });
                                  }}
                                >
                                  <SelectTrigger><SelectValue placeholder="Velg..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="under50">Under 50 MJ/m²</SelectItem>
                                    <SelectItem value="50-400">50–400 MJ/m²</SelectItem>
                                    <SelectItem value="over400">Over 400 MJ/m²</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Ekstra felt for kontor: brannalarmanlegg */}
                            {formData.bygningstype === "Kontor" && (
                              <div className="flex items-center gap-2 p-3 bg-muted/30 border rounded-md">
                                <input
                                  type="checkbox"
                                  id="bf85HarBrannalarm"
                                  checked={formData.bf85HarBrannalarm}
                                  onChange={(e) => {
                                    const result = getBygningsbrannklasse(
                                      "Kontor",
                                      parseInt(formData.etasjer, 10) || 0,
                                      parseFloat(formData.areal) || 0,
                                      { harBrannalarm: e.target.checked }
                                    );
                                    setFormData({
                                      ...formData,
                                      bf85HarBrannalarm: e.target.checked,
                                      bygningsbrannklasse: (result?.klasse || "") as "" | "1" | "2" | "3" | "4",
                                    });
                                  }}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="bf85HarBrannalarm" className="text-xs cursor-pointer">
                                  Bygningen har brannalarmanlegg basert på røykdetektor
                                </Label>
                              </div>
                            )}

                            {/* Auto-beregnet resultat */}
                            {bf85Result ? (
                              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700 rounded-md">
                                <Label className="text-xs font-medium mb-1 block text-green-700 dark:text-green-400">
                                  Beregnet bygningsbrannklasse ({bf85Result.tabell})
                                </Label>
                                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                  Bygningsbrannklasse {bf85Result.klasse}
                                </p>
                                {bf85Result.merknad && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">
                                    {bf85Result.merknad}
                                  </p>
                                )}
                              </div>
                            ) : formData.bygningstype ? (
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-md">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Fyll inn etasjer og areal for å beregne bygningsbrannklasse automatisk.
                                </p>
                              </div>
                            ) : null}

                            {/* BF85 Skole: Tabell 32:12 for å hjelpe med valg av bygningsbrannklasse */}
                            {formData.bygningstype === "Skole" && (() => {
                              const etasjer = parseInt(formData.etasjer, 10) || 0;
                              const klasse = formData.bygningsbrannklasse;
                              return etasjer > 0 ? (
                                <div className="p-3 bg-muted/50 border border-border rounded-md">
                                  <p className="text-xs font-semibold mb-2">Tabell 32:12 – Skolebygning, maks bruttoareal pr etasje uten oppdeling med brannvegg</p>
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th className="text-left py-1 px-2 font-medium">Antall etasjer</th>
                                        <th className="text-left py-1 px-2 font-medium">Største bruttoareal pr etasje</th>
                                        <th className="text-left py-1 px-2 font-medium">Bygningsbrannklasse</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {bf85BrannveggTabellSkole.map((row, idx) => {
                                        const isActive = row.bygningsbrannklasse === klasse && (() => {
                                          if (etasjer === 1) return row.etasjerLabel === "1";
                                          if (etasjer === 2) return row.etasjerLabel === "2";
                                          if (etasjer >= 3 && etasjer <= 4) return row.etasjerLabel === "3 og 4";
                                          if (etasjer > 4) return row.etasjerLabel === "over 4";
                                          return false;
                                        })();
                                        return (
                                          <tr key={idx} className={`border-b border-border/50 ${isActive ? "bg-primary/10 font-semibold" : ""}`}>
                                            <td className="py-1 px-2">{row.etasjerLabel}</td>
                                            <td className="py-1 px-2">{row.maksAreal} m²</td>
                                            <td className="py-1 px-2">{row.bygningsbrannklasse}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    <span className="font-medium">Merk:</span> Sprinkler, brannalarmanlegg eller røykluker har ikke betydning for arealgrensen i BF85, men kan benyttes som kompenserende tiltak.
                                  </p>
                                </div>
                              ) : null;
                            })()}

                            {/* Manuell overstyring */}
                            <div>
                              <Label className="text-xs font-medium mb-1 block">
                                Bygningsbrannklasse
                                {bf85Result && <span className="text-muted-foreground ml-2">(Automatisk: {bf85Result.klasse})</span>}
                              </Label>
                              <Select 
                                value={formData.bygningsbrannklasse}
                                onValueChange={(value) => setFormData({...formData, bygningsbrannklasse: value as "" | "1" | "2" | "3" | "4"})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg bygningsbrannklasse..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Bygningsbrannklasse 1</SelectItem>
                                  <SelectItem value="2">Bygningsbrannklasse 2</SelectItem>
                                  <SelectItem value="3">Bygningsbrannklasse 3</SelectItem>
                                  <SelectItem value="4">Bygningsbrannklasse 4</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                            );
                          })()
                        ) : (
                        <>
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
                        </>
                        )}
                      </div>
                    </div>
                    {documentType !== "tilstandsvurdering" && (
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
                    )}
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
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                        Branntekniske ytelseskrav
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap3')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <AccordionContent className="space-y-3 pt-4 px-4 pb-4">
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAllKap3Open(prev => prev === undefined ? true : !prev)}
                      >
                        {allKap3Open ? "Lukk alle seksjoner" : "Åpne alle seksjoner"}
                      </Button>
                    </div>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-1" label={`3.1 ${formData.regelverk === "BF85" ? "Bæreevne og stabilitet (§ 11-4)" : "§ 11-4 Bæreevne og stabilitet"}`}>
                    <div className="space-y-3">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">
                          3.1 {formData.regelverk === "BF85" ? "Kap. 30:41 Bæreevne og stabilitet (Bygningsbrannklasse)" : "§ 11-4 Bæreevne og stabilitet"}
                        </Label>
                        {formData.regelverk === "BF85" && (
                          <p className="text-xs text-muted-foreground mt-1">Bygningsdelers brannmotstand iht. BF85 Tabell 30:41</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">
                          {formData.regelverk === "BF85" 
                            ? "Krav til bærende konstruksjoner (automatisk basert på bygningsbrannklasse — kan redigeres)"
                            : "Krav til bærende konstruksjoner (automatisk basert på brannklasse — kan redigeres)"}
                        </Label>
                        <Textarea 
                          value={formData.baereevne}
                          onChange={(e) => setFormData({...formData, baereevne: e.target.value})}
                          className="min-h-[140px]"
                        />
                        {formData.regelverk !== "BF85" && formData.baereevne && formData.brannklasse && (() => {
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
                        {formData.regelverk === "BF85" && formData.baereevne && formData.bygningsbrannklasse && (() => {
                          const auto = getBaereevneTekstBF85(formData.bygningsbrannklasse);
                          return auto.tekst && formData.baereevne !== auto.tekst;
                        })() && (
                          <div className="flex items-start gap-2 mt-2 p-2 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              Bæreevne-kravene er endret fra automatisk beregnet verdi (BF85 Tabell 30:41). Beskriv begrunnelsen i kommentarfeltet under.
                            </p>
                          </div>
                        )}
                      </div>
                      {formData.regelverk !== "BF85" && formData.baereevneUnntak.length > 0 && (
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
                      {formData.regelverk === "BF85" && formData.bygningsbrannklasse && (
                        <div className="p-3 bg-muted/50 border rounded-md space-y-2">
                          <p className="text-xs font-medium">BF85 Tabell 30:41 – Bygningsbrannklasse {formData.bygningsbrannklasse}:</p>
                          <div className="text-xs space-y-1 text-muted-foreground">
                            {(() => {
                              const bf85 = getBaereevneTekstBF85(formData.bygningsbrannklasse);
                              if (!bf85.kravTabell) return null;
                              const k = bf85.kravTabell;
                              return (
                                <table className="w-full text-xs border-collapse">
                                  <tbody>
                                    <tr><td className="pr-2 py-0.5 font-medium">Bærende hovedsystem:</td><td className="text-red-600 font-semibold">{k.hovedsystem}</td></tr>
                                    <tr><td className="pr-2 py-0.5 font-medium">Sekundære bærende deler:</td><td className="text-red-600 font-semibold">{k.sekundaer}</td></tr>
                                    <tr><td className="pr-2 py-0.5 font-medium">Branncellebegrensende (ikke yttervegg):</td><td className="text-red-600 font-semibold">{k.branncellebegrensende}</td></tr>
                                    <tr><td className="pr-2 py-0.5 font-medium">Under øverste kjellergolv:</td><td className="text-red-600 font-semibold">{k.kjeller}</td></tr>
                                    <tr><td className="pr-2 py-0.5 font-medium">Trapperom og heissjakt:</td><td className="text-red-600 font-semibold">{k.trapperomOgHeissjakt}</td></tr>
                                    <tr><td className="pr-2 py-0.5 font-medium">Trappeløp:</td><td className="text-red-600 font-semibold">{k.trappeloep}</td></tr>
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground italic mt-1">
                            Noter: I bygning uten loft behøver kravene ikke oppfylles for takkonstruksjoner av ubrennbare materialer. For bygning i 1–2 etasjer gjelder lempninger for takkonstruksjoner av brennbare materialer med kledning K1.
                          </p>
                        </div>
                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Brannmotstandskrav for bærende konstruksjoner basert på {formData.regelverk === "BF85" ? `bygningsbrannklasse ${formData.bygningsbrannklasse || "(ikke angitt)"}` : `brannklasse ${formData.brannklasse || "(ikke angitt)"}`}</li>
                          <li>Krav til bærende hovedsystem, sekundære bærende deler, trapperom og heissjakt</li>
                          {formData.regelverk !== "BF85" && formData.baereevneUnntak?.length > 0 && <li>Unntak iht. VTEK § 11-4 (automatisk beregnet)</li>}
                        </ul>
                      </div>
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
                    {renderTilstandPanel("3_1")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-2" label={`3.2 ${formData.regelverk === "BF85" ? "Sikkerhet ved eksplosjon (§ 11-5)" : "§ 11-5 Sikkerhet ved eksplosjon"}`}>
                    <div className="space-y-3">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">
                          3.2 {formData.regelverk === "BF85" ? "Sikkerhet ved eksplosjon" : "§ 11-5 Sikkerhet ved eksplosjon"}
                        </Label>
                        {formData.regelverk === "BF85" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Sikkerhet ved eksplosjon er ikke spesifikt kravsatt i BF85, men må likevel vurderes i en tilstandsvurdering.
                          </p>
                        )}
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
                            {formData.regelverk === "BF85"
                              ? "Sikkerhet ved eksplosjon er ikke kravsatt i BF85. RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket."
                              : "RiBr er ikke opplyst eller kjent med at det er fare for eksplosjon i forbindelse med tiltaket."}
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
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Vurdering av eksplosjonsfare basert på valgt relevans</li>
                          {formData.eksplosjonRelevant === "relevant" && <li>Preaksepterte ytelser iht. VTEK § 11-5 (egen branncelle, trykkavlastningsflate, mm.)</li>}
                          {formData.eksplosjonRelevant === "ikke_relevant" && <li>Standardtekst om at eksplosjonsfare ikke er relevant for tiltaket</li>}
                        </ul>
                      </div>
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
                    {renderTilstandPanel("3_2")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-3" label={`3.3 ${formData.regelverk === "BF85" ? "Avstand mellom bygninger (§ 11-6)" : "§ 11-6 Tiltak mot brannspredning"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">
                          3.3 {formData.regelverk === "BF85" ? "Avstand mellom bygninger (Kap. 30:32)" : "§ 11-6 Tiltak mot brannspredning"}
                        </Label>
                        {formData.regelverk === "BF85" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Krav til avstand mellom bygninger og mellom grupper av bygninger iht. BF85 Kap. 30:32.
                          </p>
                        )}
                      </div>

                      {formData.regelverk === "BF85" ? (
                        <>
                          {/* BF85-spesifikk input */}
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Er bygningene skilt med brannvegg?</Label>
                            <Select
                              value={formData.bf85SkiltMedBrannvegg}
                              onValueChange={(value: "ja" | "nei") => setFormData({...formData, bf85SkiltMedBrannvegg: value})}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nei">Nei</SelectItem>
                                <SelectItem value="ja">Ja</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.bf85SkiltMedBrannvegg === "ja" && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                :321 – Det stilles ingen krav til avstand mellom bygninger som er skilt med brannvegg.
                              </p>
                            </div>
                          )}

                          {formData.bf85SkiltMedBrannvegg === "nei" && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs font-medium mb-1 block">Gesimshøyde egen bygning (m)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.gesimshoydeEgen}
                                    onChange={(e) => setFormData({...formData, gesimshoydeEgen: e.target.value})}
                                    placeholder="Gjennomsnittlig gesimshøyde..."
                                  />
                                  <p className="text-xs text-muted-foreground mt-0.5">Måles på motstående vegg</p>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium mb-1 block">Gesimshøyde nabobygning (m)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.gesimshoydeNabo}
                                    onChange={(e) => setFormData({...formData, gesimshoydeNabo: e.target.value})}
                                    placeholder="Gjennomsnittlig gesimshøyde..."
                                  />
                                  <p className="text-xs text-muted-foreground mt-0.5">Måles på motstående vegg</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Faktisk avstand til nabobygg (m)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={formData.avstandNabobygg}
                                  onChange={(e) => setFormData({...formData, avstandNabobygg: e.target.value})}
                                  placeholder="Angi avstand i meter..."
                                />
                              </div>

                              {/* Beregnet minsteavstand */}
                              {(() => {
                                const hEgen = parseFloat(formData.gesimshoydeEgen) || 0;
                                const hNabo = parseFloat(formData.gesimshoydeNabo) || 0;
                                const faktisk = parseFloat(formData.avstandNabobygg) || 0;
                                const gjennomsnitt = (hEgen + hNabo) / 2;
                                const beregnet = gjennomsnitt / 2;
                                const minsteAvstand = Math.max(beregnet, 8);
                                if (hEgen > 0 && hNabo > 0) {
                                  const oppfylt = faktisk >= minsteAvstand;
                                  return (
                                    <div className={`p-3 rounded-md border ${oppfylt ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"}`}>
                                      <p className="text-sm font-medium mb-1">
                                        :322 – Beregnet minsteavstand: <strong>{minsteAvstand.toFixed(1)} m</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Gjennomsnittlig gesimshøyde: ({hEgen} + {hNabo}) / 2 = {gjennomsnitt.toFixed(1)} m. Halvparten: {beregnet.toFixed(1)} m {beregnet < 8 ? "(min. 8 m)" : ""}
                                      </p>
                                      {faktisk > 0 && (
                                        <p className={`text-sm mt-1 font-medium ${oppfylt ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`}>
                                          {oppfylt ? "✓ Faktisk avstand oppfyller kravet" : "✗ Faktisk avstand er mindre enn minsteavstanden"}
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Gruppe-unntak */}
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Er bygningene i en gruppe? (:3221)</Label>
                                <Select
                                  value={formData.bf85ErGruppe}
                                  onValueChange={(value: "ja" | "nei") => setFormData({...formData, bf85ErGruppe: value})}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="nei">Nei</SelectItem>
                                    <SelectItem value="ja">Ja</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {formData.bf85ErGruppe === "ja" && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
                                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Unntak for bygninger i gruppe (:3221)</p>
                                  <ul className="text-xs text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                                    <li>Bygninger kan ha mindre innbyrdes avstand enn :322 dersom bruttoareal i en gruppe er som angitt i kap. 31–39.</li>
                                    <li>Yttervegg utsatt for strålevarme skal ha brannmotstand som branncellbegrensende bygningsdel i vedkommende bygningsbrannklasse (jf. Tabell 30:41).</li>
                                    <li>Kravet gjelder den delen av veggen som ligger nærmere nabobygningen enn minsteavstanden.</li>
                                    <li>Vegg skal være uten vindu, dør eller andre åpninger.</li>
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Eksisterende TEK17-input */}
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
                        </>
                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Avstandskrav mellom byggverk basert på bygningshøyde og avstand til nabobygg</li>
                          <li>Automatisk beregning av minsteavstand og krav til brannvegg/branncellevegg</li>
                          <li>Krav til yttervegger og vinduer/åpninger mot nabobygg</li>
                        </ul>
                      </div>
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
                    {renderTilstandPanel("3_3")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-4" label={`3.4 ${formData.regelverk === "BF85" ? "Brannteknisk oppdeling (§ 11-7)" : "§ 11-7 Brannseksjoner"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">{formData.regelverk === "BF85" ? "3.4 Brannteknisk oppdeling (Kap. 30:6)" : "3.4 § 11-7 Brannseksjoner"}</Label>
                      </div>
                      
                      {/* BF85 Skole: Forenklet brannvegg-vurdering */}
                      {formData.regelverk === "BF85" && formData.bygningstype === "Skole" && (() => {
                        const etasjer = parseInt(formData.etasjer, 10) || 0;
                        const areal = parseFloat(formData.areal) || 0;
                        const klasse = formData.bygningsbrannklasse;
                        const krav = getBF85BrannveggKravSkole(etasjer, areal, klasse);

                        return krav ? (
                          <div className="space-y-3">
                            <div className={`p-3 rounded-md border ${krav.krevBrannvegg ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"}`}>
                              <p className={`text-sm font-medium ${krav.krevBrannvegg ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}>
                                {krav.krevBrannvegg ? "⚠️" : "✅"} {krav.merknad}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">Ref. Tabell 32:12 (se kap. 2 – Bygningsbrannklasse)</p>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* BF85 Kap 34: Industri, Kontor, Garasje, Lager – Tabell 34:23 */}
                      {formData.regelverk === "BF85" && ["Industri", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype) && (() => {
                        const areal = parseFloat(formData.areal) || 0;
                        const brannbelastning = parseFloat(formData.bf85_34_brannbelastning) || 0;
                        const tiltak = formData.bf85_34_tiltak || "ingen";
                        const krav = brannbelastning > 0 ? getBF85BrannveggKravKap34(areal, brannbelastning, tiltak) : null;

                        return (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold">Tabell 34:23 – Største bruttoareal uten oppdeling med brannvegg</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Gjennomsnittlig spesifikk brannbelastning (MJ/m²)</Label>
                                <Input
                                  type="number"
                                  placeholder="f.eks. 150"
                                  value={formData.bf85_34_brannbelastning}
                                  onChange={(e) => setFormData({...formData, bf85_34_brannbelastning: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Tiltak</Label>
                                <Select
                                  value={formData.bf85_34_tiltak}
                                  onValueChange={(value) => setFormData({...formData, bf85_34_tiltak: value as BF85Tabell3423Tiltak})}
                                >
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ingen">Uten brannventilasjon og sprinkleranlegg</SelectItem>
                                    <SelectItem value="brannventilasjon">Med brannventilasjon</SelectItem>
                                    <SelectItem value="sprinkler">Med sprinkleranlegg</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {krav && (
                              <div className={`p-3 rounded-md border ${krav.krevBrannvegg ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"}`}>
                                <p className={`text-sm font-medium ${krav.krevBrannvegg ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}>
                                  {krav.krevBrannvegg ? "⚠️" : "✅"} {krav.merknad}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Ref. Tabell 34:23 – Kap. 34</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {formData.regelverk === "BF85" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="brukTEK17Seksjonering"
                              checked={formData.brukTEK17Seksjonering}
                              onCheckedChange={(checked) => setFormData({...formData, brukTEK17Seksjonering: !!checked})}
                            />
                            <label htmlFor="brukTEK17Seksjonering" className="text-xs cursor-pointer font-medium">
                              Brannbelastning over 400 MJ/m² – bruk TEK17 Tabell 2 for brannmotstand
                            </label>
                          </div>
                          {formData.brukTEK17Seksjonering && (
                            <div className="space-y-3">
                              <div className="p-3 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground">
                                <p>Iht. BF85 Kap. 30:6 skal brannvegg ved brannbelastning over 400 MJ/m² ha tilstrekkelig brannmotstand til å bibeholde sine egenskaper gjennom hele brannforløpet. TEK17 § 11-7 Tabell 2 benyttes som dimensjoneringsgrunnlag.</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Spesifikk brannenergi (MJ/m²)</Label>
                                <Select 
                                  value={formData.seksjoneringsvegBrannenergi} 
                                  onValueChange={(value) => setFormData({...formData, seksjoneringsvegBrannenergi: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Velg brannenergi..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="400-600">400–600 MJ/m²</SelectItem>
                                    <SelectItem value="600-800">600–800 MJ/m²</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {formData.seksjoneringsvegBrannenergi && (() => {
                                const klasse = formData.bygningsbrannklasse;
                                // Mapping bygningsbrannklasse til brannklasse-nivå for TEK17 tabell
                                const erBKL1 = klasse === "1" || klasse === "2";
                                const energi = formData.seksjoneringsvegBrannenergi;
                                let rei = "";
                                let bf85Ref = "";
                                if (erBKL1) {
                                  rei = energi === "400-600" ? "REI 120-M A2-s1,d0 [A 120]" : "REI 180-M A2-s1,d0 [A 180]";
                                } else {
                                  rei = energi === "400-600" ? "REI 180-M A2-s1,d0 [A 180]" : "REI 240-M A2-s1,d0 [A 240]";
                                }
                                bf85Ref = erBKL1 ? "Brannklasse 1" : "Brannklasse 2 og 3";
                                return (
                                  <div className="space-y-3">
                                    <div className="p-3 rounded-md border bg-primary/5 border-primary/30">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">{bf85Ref} · {energi} MJ/m²</p>
                                      <p className="text-sm font-bold">{rei}</p>
                                    </div>
                                    {/* Referansetabell */}
                                    <div className="text-xs">
                                      <p className="font-semibold mb-2">§ 11-7 Tabell 2: Brannmotstand for seksjoneringsvegger</p>
                                      <table className="w-full border-collapse border border-border text-xs">
                                        <thead>
                                          <tr className="bg-muted">
                                            <th className="border border-border p-1.5 text-left">Brannklasse</th>
                                            <th className="border border-border p-1.5 text-center">Under 400</th>
                                            <th className={`border border-border p-1.5 text-center ${energi === "400-600" ? "bg-primary/10 font-bold" : ""}`}>400–600</th>
                                            <th className={`border border-border p-1.5 text-center ${energi === "600-800" ? "bg-primary/10 font-bold" : ""}`}>600–800</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr className={erBKL1 ? "bg-primary/5" : ""}>
                                            <td className="border border-border p-1.5">Brannklasse 1</td>
                                            <td className="border border-border p-1.5 text-center">REI 90-M A2-s1,d0<br/>[A 90]</td>
                                            <td className={`border border-border p-1.5 text-center ${erBKL1 && energi === "400-600" ? "bg-primary/10 font-bold" : ""}`}>REI 120-M A2-s1,d0<br/>[A 120]</td>
                                            <td className={`border border-border p-1.5 text-center ${erBKL1 && energi === "600-800" ? "bg-primary/10 font-bold" : ""}`}>REI 180-M A2-s1,d0<br/>[A 180]</td>
                                          </tr>
                                          <tr className={!erBKL1 ? "bg-primary/5" : ""}>
                                            <td className="border border-border p-1.5">Brannklasse 2 og 3</td>
                                            <td className="border border-border p-1.5 text-center">REI 120-M A2-s1,d0<br/>[A 120]</td>
                                            <td className={`border border-border p-1.5 text-center ${!erBKL1 && energi === "400-600" ? "bg-primary/10 font-bold" : ""}`}>REI 180-M A2-s1,d0<br/>[A 180]</td>
                                            <td className={`border border-border p-1.5 text-center ${!erBKL1 && energi === "600-800" ? "bg-primary/10 font-bold" : ""}`}>REI 240-M A2-s1,d0<br/>[A 240]</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TEK17 tiltak-valg: vises kun for TEK17 */}
                      {formData.regelverk !== "BF85" && (
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
                      )}

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

                      {/* Innvendig hjørne - kun for TEK17, ikke BF85 */}
                      {formData.regelverk !== "BF85" && (
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
                      )}

                      {/* Dører og vinduer i seksjoneringsveggen */}
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Dører og vinduer i {formData.regelverk === "BF85" ? "brannvegg" : "seksjoneringsvegg"}</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="seksjonDorRelevant"
                              checked={formData.seksjonDorRelevant}
                              onCheckedChange={(checked) => setFormData({...formData, seksjonDorRelevant: !!checked})}
                            />
                            <label htmlFor="seksjonDorRelevant" className="text-xs cursor-pointer font-medium">Dører i {formData.regelverk === "BF85" ? "brannvegg" : "seksjoneringsvegg"} er relevant</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="seksjonVinduRelevant"
                              checked={formData.seksjonVinduRelevant}
                              onCheckedChange={(checked) => setFormData({...formData, seksjonVinduRelevant: !!checked})}
                            />
                            <label htmlFor="seksjonVinduRelevant" className="text-xs cursor-pointer font-medium">Vinduer i {formData.regelverk === "BF85" ? "brannvegg" : "seksjoneringsvegg"} er relevant</label>
                          </div>
                          {(formData.seksjonDorRelevant || formData.seksjonVinduRelevant) && (
                            <div className="space-y-1 bg-muted/50 p-2 rounded text-xs">
                              {formData.regelverk === "BF85" ? (
                                <>
                                  <p className="font-semibold text-xs">Krav iht. BF85 Kap. 30:62:</p>
                                  <div>Brannvegg skal være uten åpninger. Dersom åpning likevel er nødvendig, gjelder følgende:</div>
                                  {formData.seksjonDorRelevant && (
                                    <>
                                      <div>– Dør i brannvegg skal ha samme brannmotstand som veggen (minst A 120).</div>
                                      <div>– Dør skal være selvlukkende eller ha automatisk lukking ved brannalarm/røykdeteksjon.</div>
                                    </>
                                  )}
                                  {formData.seksjonVinduRelevant && (
                                    <>
                                      <div>– Vindu i brannvegg skal ha samme brannmotstand som veggen (minst A 120).</div>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold text-xs">Preaksepterte ytelser:</p>
                                  {formData.seksjonDorRelevant && formData.seksjonVinduRelevant && (
                                    <div>1. Vinduer og dører må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.</div>
                                  )}
                                  {formData.seksjonDorRelevant && formData.seksjonVinduRelevant && (
                                    <div>2. Vinduer og dører må ha tilsvarende brannmotstand som veggen.</div>
                                  )}
                                  {formData.seksjonDorRelevant && !formData.seksjonVinduRelevant && (
                                    <>
                                      <div>1. Dører må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.</div>
                                      <div>2. Dører må ha tilsvarende brannmotstand som veggen.</div>
                                    </>
                                  )}
                                  {!formData.seksjonDorRelevant && formData.seksjonVinduRelevant && (
                                    <>
                                      <div>1. Vinduer må plasseres, eller være beskyttet, slik at de ikke blir utsatt for mekanisk påkjenning ved nedfall av andre bygningsdeler.</div>
                                      <div>2. Vinduer må ha tilsvarende brannmotstand som veggen.</div>
                                    </>
                                  )}
                                  {formData.seksjonDorRelevant && (
                                    <>
                                      <div>{formData.seksjonVinduRelevant ? "3" : "3"}. Dør som er klassifisert etter NS 3919:1997 [A 120 osv.] må ha anslag, terskel og tettelister på alle sider for å oppnå tilstrekkelig røyktetthet. Dette gjelder ikke dører og luker som er testet og oppfyller kriteriene for Sₐ-klassifisering etter NS-EN 1634-3:2004 (inklusiv rettelsesblad AC:2006).</div>
                                      <div>{formData.seksjonVinduRelevant ? "4" : "4"}. Dører må være lukket i en brukssituasjon eller ha automatikk som lukker døren ved deteksjon av røyk.</div>
                                    </>
                                  )}
                                  {formData.seksjonVinduRelevant && (
                                    <div>{formData.seksjonDorRelevant ? "5" : "3"}. Vinduer må ikke kunne åpnes i vanlig brukstilstand.</div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Brannseksjoneringskrav basert på bygningstype og brannbelastning</li>
                          <li>Krav til seksjoneringsvegger (brannvegg) med riktig brannmotstand</li>
                          <li>Areal- og brannbelastningsgrenser for oppdeling</li>
                        </ul>
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
                    {renderTilstandPanel("3_4")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-5" label={`3.5 ${formData.regelverk === "BF85" ? "Brannceller (§ 11-8)" : "§ 11-8 Brannceller"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.5 {formData.regelverk === "BF85" ? "Brannceller (Kap. 30:33, 30:63–65)" : "§ 11-8 Brannceller"}</Label>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Relevante branncelle-typer {formData.regelverk === "BF85" ? "(Kap. 30:33, 30:63–65)" : "(preaksepterte ytelser)"}</Label>
                        <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2 bg-muted/30">
                          {branncelleTyperListe.map((type) => (
                            <div key={type.id}>
                              <div className="flex items-start space-x-2">
                                <Checkbox
                                  id={`branncelle-${type.id}`}
                                  checked={formData.branncelleTyper.includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({...formData, branncelleTyper: [...formData.branncelleTyper, type.id]});
                                    } else {
                                      setFormData({...formData, branncelleTyper: formData.branncelleTyper.filter(t => t !== type.id), ...(type.id === "husdyrrom" ? { husdyrromAreal: "" } : {})});
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
                              {type.id === "husdyrrom" && formData.branncelleTyper.includes("husdyrrom") && (
                                <div className="ml-6 mt-1 mb-1 pl-3 border-l-2 border-primary/20 space-y-2">
                                  <Label className="text-xs font-medium mb-1 block">Bruttoareal husdyrrom</Label>
                                  <div className="flex gap-4">
                                    {[
                                      { value: "under_300", label: "< 300 m²" },
                                      { value: "over_300", label: "≥ 300 m²" },
                                    ].map((opt) => (
                                      <div key={opt.value} className="flex items-center gap-1.5">
                                        <input
                                          type="radio"
                                          id={`husdyrrom-areal-${opt.value}`}
                                          name="husdyrromAreal"
                                          checked={formData.husdyrromAreal === opt.value}
                                          onChange={() => setFormData({...formData, husdyrromAreal: opt.value as any})}
                                          className="w-3 h-3"
                                        />
                                        <label htmlFor={`husdyrrom-areal-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                      </div>
                                    ))}
                                  </div>
                                  {formData.husdyrromAreal && (
                                    <div className="text-xs bg-muted/50 p-2 rounded">
                                      {formData.husdyrromAreal === "under_300"
                                        ? "Husdyrrom med bruttoareal mindre enn 300 m² må være avgrenset fra resten av byggverket med bygningsdeler med brannmotstand minst EI 30 [B 30]."
                                        : "Husdyrrom med bruttoareal større enn 300 m² må være avgrenset fra resten av byggverket med bygningsdeler med brannmotstand minst EI 60 [B 60]."}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {formData.regelverk === "BF85" && (() => {
                        const klasse = formData.bygningsbrannklasse || "";
                        const kravMap: Record<string, { tekniskeRom: string; branncellebegrensende: string; dorKrav: string }> = {
                          "1": { tekniskeRom: "A 60", branncellebegrensende: "A 60", dorKrav: "A 30" },
                          "2": { tekniskeRom: "A 60", branncellebegrensende: "B 60", dorKrav: "B 30" },
                          "3": { tekniskeRom: "A 60", branncellebegrensende: "B 30", dorKrav: "B 15" },
                          "4": { tekniskeRom: "A 60", branncellebegrensende: "B 30", dorKrav: "B 15" },
                        };
                        const krav = kravMap[klasse];

                        return (
                          <div className="space-y-3 mb-4">
                            <div className="bg-muted/50 border rounded-md p-3 space-y-3">
                              <p className="text-xs font-semibold text-foreground">BF85 branncellekrav – Bygningsbrannklasse {klasse || "(ikke angitt)"}</p>
                              
                              {/* :33 Tekniske rom – toggle */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="bf85TekniskeRomRelevant"
                                    checked={formData.bf85TekniskeRomRelevant ?? false}
                                    onCheckedChange={(checked) => setFormData({...formData, bf85TekniskeRomRelevant: !!checked})}
                                  />
                                  <label htmlFor="bf85TekniskeRomRelevant" className="text-xs font-semibold cursor-pointer">Kap. 30:33 – Tekniske rom</label>
                                </div>
                                {formData.bf85TekniskeRomRelevant && (
                                  <div className="pl-6 border-l-2 border-primary/20 ml-1">
                                    <p className="text-xs text-muted-foreground">
                                      Heismaskinrom, ventilasjonsrom, søppelrom for felles søppelnedkast og fyrrom skal være branncelle <span className="font-semibold text-foreground">A 60</span> for brann innenfra.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* :63 Branncelleinndeling – alltid synlig */}
                              <div className="space-y-1">
                                <p className="text-xs font-semibold">Kap. 30:63 – Branncelleinndeling</p>
                                <p className="text-xs text-muted-foreground">
                                  Bygning skal inndeles på hensiktsmessig måte i brannceller med konstruksjon etter Tabell 30:41.
                                  {krav && (
                                    <> Ikke-bærende branncellebegrensende bygningsdel: <span className="font-semibold text-foreground">{krav.branncellebegrensende}</span>.</>
                                  )}
                                </p>
                                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                  <li>Brannceller må ikke ha form eller innredning som gjør varsling og rømning ved brann vanskelig.</li>
                                  <li>Sjakter som ikke ligger i tilknytning til trapperom skal utføres som egne brannceller.</li>
                                  <li>Dører i branncellebegrensende vegger skal ha minst 1/2 av veggens brannmotstand{krav && <> – dvs. minst <span className="font-semibold text-foreground">{krav.dorKrav}</span></>}.</li>
                                </ul>
                              </div>

                              {/* :64 Rom på loft og i kjeller – toggle */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="bf85LoftKjellerRelevant"
                                    checked={formData.bf85LoftKjellerRelevant ?? false}
                                    onCheckedChange={(checked) => setFormData({...formData, bf85LoftKjellerRelevant: !!checked})}
                                  />
                                  <label htmlFor="bf85LoftKjellerRelevant" className="text-xs font-semibold cursor-pointer">Kap. 30:64 – Rom på loft og i kjeller</label>
                                </div>
                                {formData.bf85LoftKjellerRelevant && (
                                  <div className="pl-6 border-l-2 border-primary/20 ml-1">
                                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                      <li>På loft som ikke er innredet til oppholdsrom, skal det ikke være andre rom enn slike som er nødvendige for bygningens drift.</li>
                                      <li>Loft og kjeller innredning må bevare oversikten og spesifikk brannbelastning fra veggene ikke overstiger 10 MJ/m².</li>
                                      <li>Del av kjeller på høyst 300 m² kan atskilles fra kjelleren med vegg A 60 og dør A 30 i rom med spesifikk brannbelastning over 10 MJ/m².</li>
                                      <li>I oppforet takkonstruksjon av brennbart materiale skal hulrom oppdeles med branncellebegrensende vegg i arealer på høyst <span className="font-semibold text-foreground">400 m²</span> etter Tabell 30:4.</li>
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* :65 Brannskiller i takflater – alltid synlig */}
                              <div className="space-y-1">
                                <p className="text-xs font-semibold">Kap. 30:65 – Brannskiller i takflater</p>
                                <p className="text-xs text-muted-foreground">
                                  Takflater isolert med brennbar isolasjon skal deles med tilfredsstillende brannskiller i avsnitt på høyst <span className="font-semibold text-foreground">400 m²</span>.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {formData.regelverk !== "BF85" && (
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
                      )}
                      
                      {formData.regelverk !== "BF85" && (
                      <>
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
                      </>
                      )}
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Dører i branncellebegrensende konstruksjoner</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          {(formData.regelverk === "BF85" ? [
                            { id: "bf85_branncelle_aapent", label: "Branncelle – åpent trapperom (Tr1)" },
                            { id: "bf85_korridor_lukket", label: "Korridor – lukket trapperom (Tr2)" },
                            { id: "bf85_korridor_sluse_branntrygt", label: "Korridor/sluse – branntrygt trapperom (Tr2)" },
                            { id: "bf85_roykfritt_fri_luft", label: "Røykfritt trapperom (Tr3) – fri luft" },
                            { id: "bf85_korridor_fri_luft", label: "Korridor – fri luft (i kombinasjon med røykfritt trapperom (Tr3))" },
                            { id: "bf85_branncelle_korridor", label: "Branncelle – korridor" },
                            { id: "bf85_loft_trapperom", label: "Loft – trapperom" },
                            { id: "bf85_kjeller_trapperom", label: "Kjeller – trapperom" },
                            { id: "bf85_kjeller_under_overste", label: "Kjeller under øverste kjelleretasje – egen trapp eller annen atkomst" },
                          ] : [
                            { id: "branncelle_trapperom_tr1", label: "Branncelle – trapperom Tr 1" },
                            { id: "korridor_trapperom_tr2", label: "Korridor – trapperom Tr 2" },
                            { id: "mellomliggende_trapperom_tr3", label: "Mellomliggende rom – trapperom Tr 3" },
                            { id: "garasje_brannsluse", label: "Garasje – brannsluse" },
                            { id: "branncelle_korridor", label: "Branncelle – korridor" },
                            { id: "korridor_det_fri_tr3", label: "Korridor – det fri (i kombinasjon med trapperom Tr 3)" },
                          ]).map((dp) => (
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
                        <Label className="text-xs font-medium mb-1 block">Vinduskrav relevant?</Label>
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Checkbox 
                            id="vinduskravRelevant"
                            checked={formData.vinduskravRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, vinduskravRelevant: checked as boolean})}
                          />
                          <Label htmlFor="vinduskravRelevant" className="text-sm cursor-pointer">
                            {formData.regelverk === "BF85"
                              ? "Vindu skal ha samme brannmotstand som veggen det står i"
                              : "Vindu med brannmotstand er relevant"}
                          </Label>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Krav til heissjakt</Label>
                        {formData.regelverk === "BF85" ? (
                          <>
                            <div className="mb-2 p-2 bg-accent/50 rounded text-xs">
                              <span className="font-medium">BF85 heissjakt-krav</span>
                              <span className="text-muted-foreground ml-1">(Kap. 30:33/30:65)</span>
                            </div>
                            <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                              {[
                                { id: "bf85_heis_ventilasjon", label: "1. Heissjakt skal være ventilert med naturlig avtrekk, mekanisk avtrekk eller frisklufttilførsel." },
                                { id: "bf85_heis_dor_brannmotstand", label: "2. Dør til heis må ha samme brannmotstand som veggen den står i, eller F 90 (E 90)." },
                                { id: "bf85_heis_dor_luftsluse", label: "3. Brannmotstand for dør fra tilstøtende rom til luftsluse må minst være B 30 (EI 30 Sₐ)." },
                              ].map((krav) => (
                                <div key={krav.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`heis-${krav.id}`}
                                    checked={formData.heissjaktkrav.includes(krav.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({...formData, heissjaktkrav: [...formData.heissjaktkrav, krav.id]});
                                      } else {
                                        setFormData({...formData, heissjaktkrav: formData.heissjaktkrav.filter(k => k !== krav.id)});
                                      }
                                    }}
                                  />
                                  <label htmlFor={`heis-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                            {[
                              { id: "heis_roykventileres_8", label: "1. I byggverk med inntil 8 etasjer må heissjakten røykventileres, eller det må etableres luftsluse (mellomliggende rom) utført som egen, ventilert branncelle, mellom heissjakten og tilstøtende rom." },
                              { id: "heis_roykventileres_over8", label: "2. Heissjakt i byggverk med mer enn 8 etasjer må røykventileres og i tillegg utføres med luftsluse som beskrevet i nr. 1." },
                              { id: "heis_dor_brannmotstand", label: "3. Dør må ha samme brannmotstand som veggen den står i, med unntak som gitt i nr. 4 og 5." },
                              { id: "heis_dor_ei60", label: "4. I heissjakt med brannmotstand EI 60 kan det benyttes heisdør minst E 90 [F 90]. Heisdør kan utføres uten klasse Sₐ." },
                              { id: "heis_dor_luftsluse", label: "5. Brannmotstand for dør fra tilstøtende rom til luftsluse som beskrevet i nr. 1 og 2 må være minst EI 30-Sₐ." },
                            ].map((krav) => (
                              <div key={krav.id} className="flex items-start space-x-2">
                                <Checkbox
                                  id={`heis-${krav.id}`}
                                  checked={formData.heissjaktkrav.includes(krav.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({...formData, heissjaktkrav: [...formData.heissjaktkrav, krav.id]});
                                    } else {
                                      setFormData({...formData, heissjaktkrav: formData.heissjaktkrav.filter(k => k !== krav.id)});
                                    }
                                  }}
                                />
                                <label htmlFor={`heis-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Krav til trapperom</Label>
                        {(() => {
                          if (formData.regelverk === "BF85") {
                            const bf85TrapperomKravListe = [
                              { id: "bf85_tr_aapent", label: "Åpent trapperom (Tr1) – trapperom som har direkte forbindelse gjennom dør til bruksenheten." },
                              { id: "bf85_tr_lukket", label: "Lukket trapperom (Tr2) – trapperom som har forbindelse til bruksenhet bare gjennom lukket korridor, og som er lukket med dør B 30 eller F 30 mot korridor." },
                              { id: "bf85_tr_branntrygt", label: "Branntrygt trapperom (Tr2) – lukket trapperom utført som branntrygt rom uten forbindelse til kjeller." },
                              { id: "bf85_tr_roykfritt", label: "Røykfritt trapperom (Tr3) – branntrygt trapperom med forbindelse til bruksenheten bare gjennom rom åpent mot det fri (f.eks. balkong)." },
                            ];

                            const bf85Floors = parseInt(formData.etasjer || '0', 10);
                            const isBf85SkoleBarneHage = ["Skole", "Barnehage"].includes(formData.bygningstype);

                            if (isBf85SkoleBarneHage && bf85Floors > 0) {
                              // BF85 Kap. 30:7 – automatisk krav for skole/barnehage
                              const bkl = formData.bygningsbrannklasse;
                              let autoTrapperomType = "";
                              let autoTrapperomBeskrivelse = "";

                              if (bf85Floors <= 2) {
                                autoTrapperomType = "Åpent trapperom (Tr1)";
                                autoTrapperomBeskrivelse = "Bygning med inntil 2 etasjer: Åpent trapperom (Tr1) – trapperom som har direkte forbindelse gjennom dør til bruksenheten.";
                              } else if (bf85Floors <= 4) {
                                autoTrapperomType = "Lukket trapperom (Tr2)";
                                autoTrapperomBeskrivelse = "Bygning med 3–4 etasjer: Lukket trapperom (Tr2) – trapperom som har forbindelse til bruksenhet bare gjennom lukket korridor, og som er lukket med dør B 30 eller F 30 mot korridor.";
                              } else {
                                autoTrapperomType = "Røykfritt trapperom (Tr3)";
                                autoTrapperomBeskrivelse = "Bygning med flere enn 4 etasjer: Røykfritt trapperom (Tr3) – branntrygt trapperom med forbindelse til bruksenheten bare gjennom rom åpent mot det fri.";
                              }

                              return (
                                <>
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      Automatisk satt for {formData.bygningstype.toLowerCase()} ({bf85Floors} etasje{bf85Floors > 1 ? "r" : ""}{bkl ? `, bygningsbrannklasse ${bkl}` : ""}):
                                    </span>
                                  </div>
                                  <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                                    <p className="text-xs font-semibold text-foreground">{autoTrapperomBeskrivelse}</p>
                                    <div className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
                                      Trapperomtype: <span className="font-bold text-foreground">{autoTrapperomType}</span>
                                    </div>
                                  </div>
                                  <Collapsible className="mt-3">
                                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
                                      BF85 trapperomtyper (Kap. 30:7) – informasjon
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
                                      <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                        {bf85TrapperomKravListe.map((krav) => (
                                          <div key={krav.id} className="text-xs leading-tight text-muted-foreground py-1 border-b last:border-b-0">
                                            {krav.label}
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                  <div className="mt-3">
                                    <Label className="text-xs font-medium mb-1 block">Beskrivelse av trapperom</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming.</p>
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Bygget har ett trapperom plassert sentralt med utgang direkte til det fri i 1. etasje."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="mt-3 border-t pt-3">
                                    <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                    <Textarea
                                      value={formData.interntrappBeskrivelse}
                                      onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              );
                            }

                            // BF85 Bolig 1-8 etasjer – avkrysning for trapperomløsning
                            const isBf85Bolig = formData.bygningstype === "Bolig";
                            if (isBf85Bolig && bf85Floors >= 1 && bf85Floors <= 8) {
                              const boligTrapperomOptions = [
                                { id: "bf85_bolig_2_aapne", label: "2 åpne trapperom (Tr1)" },
                                { id: "bf85_bolig_lukket", label: "Et lukket trapperom (Tr2)" },
                                { id: "bf85_bolig_aapent_brannvesen", label: "Et åpent trapperom (Tr1) med brannvesenet som alternativ rømningsvei (maks 5 m til underkant vindu/balkong)" },
                              ];
                              return (
                                <>
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      Bolig med {bf85Floors} etasje{bf85Floors > 1 ? "r" : ""} – velg trapperomløsning (Kap. 30:7):
                                    </span>
                                  </div>
                                  <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                    {boligTrapperomOptions.map((opt) => (
                                      <div key={opt.id} className="flex items-start space-x-2">
                                        <Checkbox
                                          id={`tr-${opt.id}`}
                                          checked={formData.trapperomKrav.includes(opt.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setFormData({...formData, trapperomKrav: [...formData.trapperomKrav, opt.id]});
                                            } else {
                                              setFormData({...formData, trapperomKrav: formData.trapperomKrav.filter((k: string) => k !== opt.id)});
                                            }
                                          }}
                                        />
                                        <label htmlFor={`tr-${opt.id}`} className="text-xs leading-tight cursor-pointer">{opt.label}</label>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded text-xs space-y-1">
                                    <div className="flex items-start gap-1.5">
                                      <span className="text-amber-600 dark:text-amber-400 font-bold text-sm leading-none mt-0.5">⚠</span>
                                      <div>
                                        <p className="font-semibold text-amber-800 dark:text-amber-300">Fravik fra BF85 – krever særskilt dokumentasjon</p>
                                        <p className="text-amber-700 dark:text-amber-400 mt-1">
                                          Løsningen med ett åpent trapperom (Tr1) og brannvesenets stigemateriell som alternativ rømningsvei er en preakseptert ytelse etter TEK17, men utgjør et fravik fra BF85 Kap. 30:7. Dette er den vanligste løsningen for moderne boligbygg. Fraviket må dokumenteres særskilt, f.eks. gjennom en kvalitativ analyse iht. Byggforsk 321.026.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <Label className="text-xs font-medium mb-1 block">Beskrivelse av trapperom</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming.</p>
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Bygget har ett trapperom plassert sentralt med utgang direkte til det fri i 1. etasje."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                  <Collapsible className="mt-3">
                                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
                                      BF85 trapperomtyper (Kap. 30:7) – informasjon
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
                                      <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                        {bf85TrapperomKravListe.map((krav) => (
                                          <div key={krav.id} className="text-xs leading-tight text-muted-foreground py-1 border-b last:border-b-0">
                                            {krav.label}
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                  <div className="mt-3 border-t pt-3">
                                    <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                    <Textarea
                                      value={formData.interntrappBeskrivelse}
                                      onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              );
                            }

                            if (isBf85Bolig && bf85Floors > 8) {
                              const boligOver8Options = [
                                { id: "bf85_bolig_2_branntrygge", label: "2 branntrygge trapperom (Tr2)" },
                                { id: "bf85_bolig_roykfritt", label: "Et røykfritt trapperom (Tr3)" },
                              ];
                              return (
                                <>
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      Bolig over 8 etasjer ({bf85Floors} etasjer) – velg trapperomløsning (Kap. 30:7):
                                    </span>
                                  </div>
                                  <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                    {boligOver8Options.map((opt) => (
                                      <div key={opt.id} className="flex items-start space-x-2">
                                        <Checkbox
                                          id={`tr-${opt.id}`}
                                          checked={formData.trapperomKrav.includes(opt.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setFormData({...formData, trapperomKrav: [...formData.trapperomKrav, opt.id]});
                                            } else {
                                              setFormData({...formData, trapperomKrav: formData.trapperomKrav.filter((k: string) => k !== opt.id)});
                                            }
                                          }}
                                        />
                                        <label htmlFor={`tr-${opt.id}`} className="text-xs leading-tight cursor-pointer">{opt.label}</label>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3">
                                    <Label className="text-xs font-medium mb-1 block">Beskrivelse av trapperom</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming.</p>
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Bygget har to trapperom plassert i hver ende av bygget."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="mt-3 border-t pt-3">
                                    <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                    <Textarea
                                      value={formData.interntrappBeskrivelse}
                                      onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              );
                            }

                            // BF85 Forsamlingslokale – automatiske trapperomkrav
                            const isBf85Forsamling = formData.bygningstype === "Forsamlingslokale";
                            if (isBf85Forsamling) {
                              const kravTekst = bf85Floors > 8
                                ? "Forsamlingslokale over 8. etasje eller med gulv mer enn 22 m over terreng skal ha minst to branntrygge trapperom."
                                : "Forsamlingslokale i høyst 8. etasje og med gulv inntil 2 m over terreng skal ha minst to lukkede trapperom.";
                              return (
                                <>
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      Forsamlingslokale med {bf85Floors} etasje{bf85Floors > 1 ? "r" : ""} – krav til trapperom (Kap. 30:7):
                                    </span>
                                  </div>
                                  <div className="border rounded-md p-2 bg-muted/30 text-xs">
                                    {kravTekst}
                                  </div>
                                  <div className="mt-3">
                                    <Label className="text-xs font-medium mb-1 block">Beskrivelse av trapperom</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming.</p>
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Bygget har to trapperom plassert i hver ende av bygget med utgang direkte til det fri."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                  <Collapsible className="mt-3">
                                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
                                      BF85 trapperomtyper (Kap. 30:7) – informasjon
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
                                      <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                        {bf85TrapperomKravListe.map((krav) => (
                                          <div key={krav.id} className="text-xs leading-tight text-muted-foreground py-1 border-b last:border-b-0">
                                            {krav.label}
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                  <div className="mt-3 border-t pt-3">
                                    <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                    <Textarea
                                      value={formData.interntrappBeskrivelse}
                                      onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              );
                            }

                            // BF85 Industri, Kontor, Lager, Garasje, Skur – trapperomkrav
                            const industriTyper = ["Industri", "Kontor", "Lager", "Garasje", "Skur"];
                            if (industriTyper.includes(formData.bygningstype)) {
                              const kravTekst = bf85Floors > 8
                                ? "Bygning med flere enn 8 etasjer eller med gulv mer enn 22 m over terreng skal ha minst to branntrygge trapperom."
                                : "Bygninger med inntil 8 etasjer og med gulv inntil 22 m over terreng kan ha åpne trapperom.";
                              return (
                                <>
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      {formData.bygningstype} med {bf85Floors} etasje{bf85Floors > 1 ? "r" : ""} – krav til trapperom (Kap. 30:7):
                                    </span>
                                  </div>
                                  <div className="border rounded-md p-2 bg-muted/30 text-xs">
                                    {kravTekst}
                                  </div>
                                  <div className="mt-3">
                                    <Label className="text-xs font-medium mb-1 block">Beskrivelse av trapperom</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming.</p>
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Bygget har ett trapperom med utgang direkte til det fri."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                  <Collapsible className="mt-3">
                                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
                                      BF85 trapperomtyper (Kap. 30:7) – informasjon
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
                                      <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                        {bf85TrapperomKravListe.map((krav) => (
                                          <div key={krav.id} className="text-xs leading-tight text-muted-foreground py-1 border-b last:border-b-0">
                                            {krav.label}
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                  <div className="mt-3 border-t pt-3">
                                    <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                    <Textarea
                                      value={formData.interntrappBeskrivelse}
                                      onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              );
                            }

                            // BF85 Sykehus / pleieanstalt – trapperomkrav
                            if (formData.bygningstype === "Sykehus") {
                              const kravTekst = bf85Floors > 8
                                ? "Bygning med flere enn 8 etasjer eller med gulv mer enn 22 m over terreng skal ha minst to branntrygge trapperom."
                                : "Bygning med inntil 8 etasjer og med gulv inntil 22 m over terreng skal ha minst to lukkede trapperom.";
                              return (
                                <>
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                      {formData.bygningstype} med {bf85Floors} etasje{bf85Floors > 1 ? "r" : ""} – krav til trapperom (Kap. 30:7):
                                    </span>
                                  </div>
                                  <div className="border rounded-md p-2 bg-muted/30 text-xs space-y-1">
                                    <p>{kravTekst}</p>
                                    <p className="font-medium">Trappene skal utformes slik at båretransport kan foregå uhindret.</p>
                                  </div>
                                  <div className="mt-3">
                                    <Label className="text-xs font-medium mb-1 block">Beskrivelse av trapperom</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming.</p>
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Bygget har to trapperom plassert i hver ende av bygget, dimensjonert for båretransport."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                  <Collapsible className="mt-3">
                                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
                                      BF85 trapperomtyper (Kap. 30:7) – informasjon
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
                                      <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                        {bf85TrapperomKravListe.map((krav) => (
                                          <div key={krav.id} className="text-xs leading-tight text-muted-foreground py-1 border-b last:border-b-0">
                                            {krav.label}
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                  <div className="mt-3 border-t pt-3">
                                    <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                    <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                    <Textarea
                                      value={formData.interntrappBeskrivelse}
                                      onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                      placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              );
                            }

                            return (
                              <>
                                <div className="mb-2 p-2 bg-accent/50 rounded text-xs">
                                  <span className="font-medium">BF85 trapperomtyper</span>
                                  <span className="text-muted-foreground ml-1">(Kap. 30:7)</span>
                                </div>
                                <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                  {bf85TrapperomKravListe.map((krav) => (
                                    <div key={krav.id} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={`tr-${krav.id}`}
                                        checked={formData.trapperomKrav.includes(krav.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setFormData({...formData, trapperomKrav: [...formData.trapperomKrav, krav.id]});
                                          } else {
                                            setFormData({...formData, trapperomKrav: formData.trapperomKrav.filter((k: string) => k !== krav.id)});
                                          }
                                        }}
                                      />
                                      <label htmlFor={`tr-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 border-t pt-3">
                                  <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                  <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                  <Textarea
                                    value={formData.interntrappBeskrivelse}
                                    onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                    placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                    className="text-xs"
                                    rows={3}
                                  />
                                </div>
                              </>
                            );
                          }

                          // TEK17 logic
                          const rk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                          const floors = parseInt(formData.etasjer || '0', 10);
                          const trapperomTypeMap: Record<number, { lav: string; hoy: string }> = {
                            1: { lav: "Tr 1", hoy: "Tr 3" },
                            2: { lav: "Tr 1", hoy: "Tr 3" },
                            3: { lav: "Tr 2", hoy: "Tr 3" },
                            4: { lav: "Tr 1", hoy: "Tr 3" },
                            5: { lav: "Tr 2", hoy: "Tr 3" },
                            6: { lav: "Tr 2", hoy: "Tr 3" },
                          };
                          const trType = rk >= 1 && rk <= 6 && floors > 0
                            ? (floors <= 8 ? trapperomTypeMap[rk].lav : trapperomTypeMap[rk].hoy)
                            : null;

                          // Automatiske krav for skole, barnehage, fritidshjem
                          const isSkoleBarneHage = ["Skole", "Barnehage", "Fritidshjem"].includes(formData.bygningstype);

                          if (isSkoleBarneHage && floors > 0) {
                            const isOver8 = floors > 8;
                            return (
                              <>
                                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                  <span className="font-medium text-blue-800 dark:text-blue-300">Automatisk satt for {formData.bygningstype.toLowerCase()} ({floors} etasje{floors > 1 ? "r" : ""}):</span>
                                </div>
                                <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                                  {isOver8 ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-foreground">
                                        Bygning med flere enn 8 etasjer eller med golv mer enn 22 m over terreng, skal ha minst to branntrygge trapperom.
                                      </p>
                                      <div className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
                                        Trapperomtype: <span className="font-bold text-foreground">Tr 3</span> (branntrygge trapperom)
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-foreground">
                                        Bygning med inntil 8 etasjer og med golv inntil 22 m over terreng, skal ha lukkede trapperom.
                                      </p>
                                      <p className="text-xs text-foreground">
                                        Trapperom i kjeller skal være skilt fra denne med vegg A 60.
                                      </p>
                                      <div className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
                                        Trapperomtype: <span className="font-bold text-foreground">Tr 2</span> (lukkede trapperom)
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <Collapsible className="mt-3">
                                  <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                    <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
                                    Beskrivelse av trapperom
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="pt-2">
                                    <Textarea
                                      value={formData.trapperomBeskrivelse}
                                      onChange={(e) => setFormData({...formData, trapperomBeskrivelse: e.target.value})}
                                      placeholder="Beskriv trapperommene i bygget, f.eks. plassering, antall, utforming..."
                                      className="text-xs"
                                      rows={3}
                                    />
                                  </CollapsibleContent>
                                </Collapsible>
                                <div className="mt-3 border-t pt-3">
                                  <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                  <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt.</p>
                                  <Textarea
                                    value={formData.interntrappBeskrivelse}
                                    onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                    placeholder="F.eks. Interntrapp mellom 1. og 2. etasje benyttes kun som internkommunikasjon og er ikke del av rømningsvei."
                                    className="text-xs"
                                    rows={3}
                                  />
                                </div>
                              </>
                            );
                          }
                          
                          const trapperomKravListe = [
                            { id: "tr_forbinder_brannceller", label: "1. Trapperom som forbinder ulike brannceller, må utføres som egen branncelle selv om trapperommet ikke er en del av en rømningsvei." },
                            { id: "tr_romningsvei_videre", label: "2. Dersom trapperommet ikke leder direkte til det fri eller sikkert sted, må rømningsveien videre utføres som trapperom med hensyn til omsluttende konstruksjoner, mellomliggende rom, dører mv." },
                            { id: "tr_mellomliggende_rom", label: "3. Mellomliggende rom må ha tilstrekkelig størrelse, og må kunne passeres ved å åpne bare én dør om gangen." },
                            { id: "tr1_dor_bruksenhet", label: "4. Trapperom Tr 1 kan ha dør direkte fra trapperom til bruksenhet, for eksempel leilighet eller kontor. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 2." },
                            { id: "tr2_eget_rom", label: "5. Trapperom Tr 2 må ha et rom utført som egen branncelle mellom trapperommet og branncellen det skal rømmes fra. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 3. Trapperom Tr 2 kan gå til kjeller når det er brannsluse mellom de øvrige branncellene i kjelleren og trapperommet." },
                            { id: "tr3_mellomliggende", label: "6. Trapperom Tr 3 må ha et mellomliggende rom utført som egen branncelle mellom trapperommet og bruksenheten det skal rømmes fra. Vegger må ha brannmotstand som angitt i tabell 1. Dører må ha brannmotstand som angitt i tabell 2, jf. figur 4. Trapperom Tr 3 kan ikke ha forbindelse til kjeller. Hensikten er å hindre at personer rømmer ned til kjelleren, og å hindre blokkering av trapperommet ved brann i kjeller." },
                            { id: "tr_roykspredning", label: "7. Det må treffes tiltak for å begrense eller hindre røykspredning til trapperom Tr 2 og Tr 3 i samsvar med preaksepterte ytelser under G. Røykkontroll." },
                          ];

                          return (
                            <>
                              {trType ? (
                                <div className="mb-2 p-2 bg-accent/50 rounded text-xs">
                                  <span className="font-medium">Automatisk bestemt trapperomtype:</span>{" "}
                                  <span className="font-bold">{trType}</span>
                                  <span className="text-muted-foreground ml-1">(RK{rk}, {floors} etasje{floors > 1 ? "r" : ""})</span>
                                </div>
                              ) : (
                                <div className="mb-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                                  Angi risikoklasse og antall etasjer for å bestemme trapperomtype.
                                </div>
                              )}
                              <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                                {trapperomKravListe.map((krav) => (
                                  <div key={krav.id} className="flex items-start space-x-2">
                                    <Checkbox
                                      id={`tr-${krav.id}`}
                                      checked={formData.trapperomKrav.includes(krav.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFormData({...formData, trapperomKrav: [...formData.trapperomKrav, krav.id]});
                                        } else {
                                          setFormData({...formData, trapperomKrav: formData.trapperomKrav.filter((k: string) => k !== krav.id)});
                                        }
                                      }}
                                    />
                                    <label htmlFor={`tr-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 border-t pt-3">
                                <Label className="text-xs font-medium mb-1 block">Interntrapp (ikke del av rømningsvei)</Label>
                                <p className="text-xs text-muted-foreground mb-1">Beskriv eventuelle interntrapper som kun benyttes internt og ikke trenger å følge Tr-klassen.</p>
                                <Textarea
                                  value={formData.interntrappBeskrivelse}
                                  onChange={(e) => setFormData({...formData, interntrappBeskrivelse: e.target.value})}
                                  placeholder="F.eks. Interntrapp mellom 1. og 2. etasje i kontorlandskap benyttes kun som internkommunikasjon og er ikke del av rømningsvei. Trappen trenger ikke følge Tr-klassifisering."
                                  className="text-xs"
                                  rows={3}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">{formData.regelverk === "BF85" ? "Brannventilasjon (Røykventilasjon) (§:78)" : "Røykkontroll"}</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          {formData.regelverk === "BF85" ? (() => {
                            const etasjer = parseInt(formData.etasjer, 10) || 0;
                            const isAutoSet = etasjer > 2;
                            const isOver8 = etasjer > 8;
                            return (
                              <>
                                {isAutoSet && (
                                  <div className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2 mb-1">
                                    Automatisk satt basert på {etasjer} etasjer
                                  </div>
                                )}
                                <div className="flex items-start space-x-2">
                                  <Checkbox
                                    id="royk-bf85_royk_brannventilasjon"
                                    checked={formData.roykKontrollKrav.includes("bf85_royk_brannventilasjon")}
                                    disabled={isAutoSet}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({...formData, roykKontrollKrav: [...formData.roykKontrollKrav, "bf85_royk_brannventilasjon"]});
                                      } else {
                                        setFormData({...formData, roykKontrollKrav: formData.roykKontrollKrav.filter((k: string) => k !== "bf85_royk_brannventilasjon")});
                                      }
                                    }}
                                  />
                                  <label htmlFor="royk-bf85_royk_brannventilasjon" className="text-xs leading-tight cursor-pointer">
                                    {isOver8
                                      ? "I bygning med flere enn 2 etasjer skal trapperom ha brannventilasjon. Bygningen har over 8 etasjer og skal ha en røyksjakt som er skilt fra loft i minst A 30 og som har et tverrsnitt på minst 1 m². Sjakten skal gå 20 cm over takflaten."
                                      : "I bygning med flere enn 2 etasjer skal trapperom ha brannventilasjon. For bygninger med inntil 8 etasjer kan brannventilasjonen skje gjennom vindu i trapperom."
                                    }
                                  </label>
                                </div>
                                {!isAutoSet && (
                                  <p className="text-xs text-muted-foreground">Kravet aktiveres automatisk når bygget har mer enn 2 etasjer.</p>
                                )}
                              </>
                            );
                          })() : [
                            { id: "royk_romningsvei", label: "1. Trapperom som er rømningsvei i byggverk med flere enn to etasjer, må røykventileres." },
                            { id: "royk_luke_vindu", label: "2. I byggverk med inntil 8 etasjer med trapperom Tr 1 eller Tr 2, jf. § 11-13 Tabell 2, er det tilstrekkelig med luke eller vindu med fri åpning minimum 1,0 m² øverst i trapperommet." },
                            { id: "royk_manuell_bryter", label: "3. Luke eller vindu skal kunne åpnes manuelt med bryter fra inngangsplanet." },
                            { id: "royk_mekanisk_ventilasjon", label: "4. Mellomliggende rom knyttet til Tr 2 må ha mekanisk balansert ventilasjon." },
                            { id: "royk_tr3_trykksetting", label: "5. I byggverk med mer enn 8 etasjer med trapperom Tr 3, jf. § 11-13 Tabell 2, må det mellomliggende rommet være åpent mot det fri, eller trapperommet må trykksettes og det mellomliggende rommet må ha trykkavlastning (røykventilasjon)." },
                            { id: "royk_overbygde_garder", label: "6. Overbygde gårder og gater må ha røykventilasjon for å hindre røykspredning mellom ulike brannceller som ligger ut mot den overbygde gården." },
                          ].map((krav) => (
                            <div key={krav.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`royk-${krav.id}`}
                                checked={formData.roykKontrollKrav.includes(krav.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({...formData, roykKontrollKrav: [...formData.roykKontrollKrav, krav.id]});
                                  } else {
                                    setFormData({...formData, roykKontrollKrav: formData.roykKontrollKrav.filter((k: string) => k !== krav.id)});
                                  }
                                }}
                              />
                              <label htmlFor={`royk-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Vertikal brannspredning</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="vertikalBrannspredningRelevant"
                              checked={formData.vertikalBrannspredningRelevant}
                              onCheckedChange={(checked) => 
                                setFormData({...formData, vertikalBrannspredningRelevant: !!checked, vertikalBrannspredningKrav: !!checked ? formData.vertikalBrannspredningKrav : []})
                              }
                            />
                            <label htmlFor="vertikalBrannspredningRelevant" className="text-xs cursor-pointer font-medium">Vertikal brannspredning er relevant</label>
                          </div>
                          {formData.vertikalBrannspredningRelevant && (
                            <div className="pl-4 space-y-2 border-l-2 border-primary/20 ml-2">
                              {(formData.regelverk === "BF85" ? [
                                { id: "vb_kjolesone", label: "1. Kjølesone mellom vinduer i ulike etasjer skal være minst 1,2 meter og utført med brannmotstand minst E 30." },
                              ] : [
                                { id: "vb_kjolesone", label: "1. Kjølesone (vertikal avstand) mellom vinduer er minst lik høyden til underliggende vindu og utført med brannmotstand minst E 30." },
                                { id: "vb_fasade_e30", label: "2. Annenhver etasje er utført med fasade minst E 30." },
                                { id: "vb_inntrukne", label: "3. Inntrukne fasadepartier er på minimum 1,2 meter, eller utkragede bygningsdeler med samme brannmotstand som etasjeskiller er minimum 1,2 meter ut fra fasadelivet." },
                                { id: "vb_sprinkler", label: "4. Byggverket har automatisk sprinkleranlegg." },
                              ]).map((krav) => (
                                <div key={krav.id} className="flex items-start gap-2">
                                  <Checkbox
                                    id={`vb-${krav.id}`}
                                    checked={formData.vertikalBrannspredningKrav.includes(krav.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({...formData, vertikalBrannspredningKrav: [...formData.vertikalBrannspredningKrav, krav.id]});
                                      } else {
                                        setFormData({...formData, vertikalBrannspredningKrav: formData.vertikalBrannspredningKrav.filter((k: string) => k !== krav.id)});
                                      }
                                    }}
                                  />
                                  <label htmlFor={`vb-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                                </div>
                              ))}
                              {formData.regelverk !== "BF85" && (
                                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-muted">
                                  <Checkbox
                                    id="vb_takfot"
                                    checked={formData.vertikalBrannspredningKrav.includes("vb_takfot")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({...formData, vertikalBrannspredningKrav: [...formData.vertikalBrannspredningKrav, "vb_takfot"]});
                                      } else {
                                        setFormData({...formData, vertikalBrannspredningKrav: formData.vertikalBrannspredningKrav.filter((k: string) => k !== "vb_takfot")});
                                      }
                                    }}
                                  />
                                  <label htmlFor="vb_takfot" className="text-xs leading-tight cursor-pointer">Med mindre byggverket har automatisk sprinkleranlegg, må takfoten – i hele lengden – utføres som branncellebegrensende konstruksjon for brannpåvirkning nedenfra.</label>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Brannspredning via vinduer</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="vinduBrannspredningRelevant"
                              checked={formData.vinduBrannspredningRelevant}
                              onCheckedChange={(checked) => 
                                setFormData({...formData, vinduBrannspredningRelevant: !!checked, vinduBrannspredningKrav: !!checked ? formData.vinduBrannspredningKrav : []})
                              }
                            />
                            <label htmlFor="vinduBrannspredningRelevant" className="text-xs cursor-pointer font-medium">Horisontal brannspredning er relevant</label>
                          </div>
                          {formData.vinduBrannspredningRelevant && (
                            <div className="pl-4 space-y-3 border-l-2 border-primary/20 ml-2">
                              {(formData.regelverk === "BF85" ? [
                                { id: "vv_brannmotstand_vegg", label: "1. Vinduer skal ha samme brannklasse som veggen de står i." },
                              ] : [
                                { id: "vv_branncellebegrensende", label: "1. Branncellebegrensende konstruksjoner i et byggverk, eller mellom to lave byggverk, må utføres slik at det blir liten sannsynlighet for brannspredning via vinduer som ligger med liten innbyrdes avstand i innvendig hjørne, eller mellom vinduer i motstående fasader." },
                                { id: "vv_brannmotstand_vegg", label: "2. Vinduer må ha samme brannmotstand som veggen de står i. For motstående parallelle yttervegger gjelder dette bare når vindusarealet ikke utgjør mer enn 1/3 av veggarealet." },
                                { id: "vv_sprinkler_unntak", label: "3. Hvis byggverket eller byggverkene har automatisk sprinkleranlegg kan det benyttes vinduer uten spesifisert brannmotstand, med unntak for vinduer mot rømningsvei." },
                                { id: "vv_sprinkler_romningsvei", label: "4. Hvis byggverket eller byggverkene har automatisk sprinkleranlegg kan vindu mot utvendig rømningsvei ha brannmotstand EW 30 i brannklasse 1 og EW 60 i brannklasse 2 og 3." },
                                { id: "vv_enkeltvinduer", label: "5. Enkeltvinduer i mindre rom i bolighus (for eksempel i vaskerom, bad og soverom) opp til 0,20 m² glassflate, kan være uten spesifisert brannmotstand når avstanden til uklassifisert bygningsdel er minimum 5 meter." },
                              ]).map((krav) => (
                                <div key={krav.id} className="flex items-start gap-2">
                                  <Checkbox
                                    id={`vv-${krav.id}`}
                                    checked={formData.vinduBrannspredningKrav.includes(krav.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({...formData, vinduBrannspredningKrav: [...formData.vinduBrannspredningKrav, krav.id]});
                                      } else {
                                        setFormData({...formData, vinduBrannspredningKrav: formData.vinduBrannspredningKrav.filter((k: string) => k !== krav.id)});
                                      }
                                    }}
                                  />
                                  <label htmlFor={`vv-${krav.id}`} className="text-xs leading-tight cursor-pointer">{krav.label}</label>
                                </div>
                              ))}

                              {formData.regelverk !== "BF85" && (
                              <div className="border-t pt-2 mt-2 space-y-2">
                                <Label className="text-xs font-medium">Innbyrdes plassering av vinduer</Label>
                                <div className="space-y-3">
                                  {/* Parallelle yttervegger */}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <Checkbox
                                        id="plassering-parallelle"
                                        checked={formData.horisontaltPlasseringer.includes("parallelle")}
                                        onCheckedChange={(checked) => {
                                          const arr = checked
                                            ? [...formData.horisontaltPlasseringer, "parallelle"]
                                            : formData.horisontaltPlasseringer.filter((p: string) => p !== "parallelle");
                                          setFormData({...formData, horisontaltPlasseringer: arr, horisontaltParallelleVinduer: checked ? (formData.horisontaltParallelleVinduer.length > 0 ? formData.horisontaltParallelleVinduer : [{ avstand: "" }]) : []});
                                        }}
                                      />
                                      <label htmlFor="plassering-parallelle" className="text-xs cursor-pointer font-medium">Motstående parallelle yttervegger</label>
                                    </div>
                                    {formData.horisontaltPlasseringer.includes("parallelle") && (
                                      <div className="pl-6 space-y-2">
                                        {formData.horisontaltParallelleVinduer.map((vindu: { avstand: string }, idx: number) => {
                                          const avstand = parseFloat(vindu.avstand);
                                          const bklNum = formData.harFlereRisikoklasser
                                            ? (() => { const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)); return nums.length > 0 ? Math.max(...nums) : 0; })()
                                            : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
                                          const erBKL1 = bklNum === 1;
                                          let krav = "";
                                          if (!isNaN(avstand)) {
                                            if (avstand < 3.0) krav = erBKL1 ? "Ett vindu EI 30 eller begge EI 15" : "Ett vindu EI 60 eller begge EI 30";
                                            else if (avstand < 6.0) krav = erBKL1 ? "Ett vindu E 30 [F 30] eller begge EI 15" : "Ett vindu E 60 [F 60] eller begge E 30 [F 30]";
                                            else krav = "Uspesifisert";
                                          }
                                          return (
                                            <div key={idx} className="flex items-start gap-2">
                                              <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-xs whitespace-nowrap">Vindu {idx + 1} – L (m):</Label>
                                                  <Input
                                                    type="number" step="0.1" min="0" placeholder="f.eks. 3.5"
                                                    value={vindu.avstand}
                                                    onChange={(e) => {
                                                      const updated = [...formData.horisontaltParallelleVinduer];
                                                      updated[idx] = { avstand: e.target.value };
                                                      setFormData({...formData, horisontaltParallelleVinduer: updated});
                                                    }}
                                                    className="h-7 text-xs w-28"
                                                  />
                                                  {formData.horisontaltParallelleVinduer.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                                                      const updated = formData.horisontaltParallelleVinduer.filter((_: any, i: number) => i !== idx);
                                                      setFormData({...formData, horisontaltParallelleVinduer: updated});
                                                    }}>×</Button>
                                                  )}
                                                </div>
                                                {krav && (
                                                  <div className="bg-accent/50 rounded p-1.5 text-xs">
                                                    → <span className="font-semibold">{krav}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                        <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => setFormData({...formData, horisontaltParallelleVinduer: [...formData.horisontaltParallelleVinduer, { avstand: "" }]})}>
                                          + Legg til vindu
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  {/* Innvendige hjørner */}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <Checkbox
                                        id="plassering-hjorne"
                                        checked={formData.horisontaltPlasseringer.includes("hjorne")}
                                        onCheckedChange={(checked) => {
                                          const arr = checked
                                            ? [...formData.horisontaltPlasseringer, "hjorne"]
                                            : formData.horisontaltPlasseringer.filter((p: string) => p !== "hjorne");
                                          setFormData({...formData, horisontaltPlasseringer: arr, horisontaltHjorneVinduer: checked ? (formData.horisontaltHjorneVinduer.length > 0 ? formData.horisontaltHjorneVinduer : [{ avstand: "" }]) : []});
                                        }}
                                      />
                                      <label htmlFor="plassering-hjorne" className="text-xs cursor-pointer font-medium">Vinduer i innvendige hjørner</label>
                                    </div>
                                    {formData.horisontaltPlasseringer.includes("hjorne") && (
                                      <div className="pl-6 space-y-2">
                                        {formData.horisontaltHjorneVinduer.map((vindu: { avstand: string }, idx: number) => {
                                          const avstand = parseFloat(vindu.avstand);
                                          const bklNum = formData.harFlereRisikoklasser
                                            ? (() => { const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)); return nums.length > 0 ? Math.max(...nums) : 0; })()
                                            : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
                                          const erBKL1 = bklNum === 1;
                                          let krav = "";
                                          if (!isNaN(avstand)) {
                                            if (avstand < 2.0) krav = erBKL1 ? "Ett vindu EI 30 eller begge EI 15" : "Ett vindu EI 60 eller begge EI 30";
                                            else if (avstand < 4.0) krav = erBKL1 ? "Ett vindu E 30 [F 30] eller begge EI 15" : "Ett vindu E 60 [F 60] eller begge E 30 [F 30]";
                                            else krav = "Uspesifisert";
                                          }
                                          return (
                                            <div key={idx} className="flex items-start gap-2">
                                              <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-xs whitespace-nowrap">Vindu {idx + 1} – L (m):</Label>
                                                  <Input
                                                    type="number" step="0.1" min="0" placeholder="f.eks. 2.5"
                                                    value={vindu.avstand}
                                                    onChange={(e) => {
                                                      const updated = [...formData.horisontaltHjorneVinduer];
                                                      updated[idx] = { avstand: e.target.value };
                                                      setFormData({...formData, horisontaltHjorneVinduer: updated});
                                                    }}
                                                    className="h-7 text-xs w-28"
                                                  />
                                                  {formData.horisontaltHjorneVinduer.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                                                      const updated = formData.horisontaltHjorneVinduer.filter((_: any, i: number) => i !== idx);
                                                      setFormData({...formData, horisontaltHjorneVinduer: updated});
                                                    }}>×</Button>
                                                  )}
                                                </div>
                                                {krav && (
                                                  <div className="bg-accent/50 rounded p-1.5 text-xs">
                                                    → <span className="font-semibold">{krav}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                        <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => setFormData({...formData, horisontaltHjorneVinduer: [...formData.horisontaltHjorneVinduer, { avstand: "" }]})}>
                                          + Legg til vindu
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Brannceller over flere plan</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="branncellerFlerePlanRelevant"
                              checked={formData.branncellerFlerePlanRelevant}
                              onCheckedChange={(checked) => 
                                setFormData({...formData, branncellerFlerePlanRelevant: !!checked, branncellerFlerePlanKrav: !!checked ? formData.branncellerFlerePlanKrav : []})
                              }
                            />
                            <label htmlFor="branncellerFlerePlanRelevant" className="text-xs cursor-pointer font-medium">Brannceller over flere plan er relevant</label>
                          </div>
                          {formData.branncellerFlerePlanRelevant && (
                            <div className="pl-4 space-y-2 border-l-2 border-primary/20 ml-2">
                              {(() => {
                                const rkList = formData.harFlereRisikoklasser
                                  ? (formData.bygningsdeler || []).map((d: any) => parseInt((d.risikoklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n))
                                  : [parseInt((formData.risikoklasse || "").replace(/\D/g, ''), 10)].filter((n) => !isNaN(n));
                                const harUgyldigRK = rkList.some((rk: number) => rk === 3 || rk === 6);
                                return harUgyldigRK ? (
                                  <div className="bg-destructive/10 border border-destructive/30 rounded p-2 text-xs text-destructive font-medium">
                                    {formData.regelverk === "BF85"
                                      ? <>⚠ Obs: Krav til brannceller over flere plan gjelder ikke for {rkList.filter((rk: number) => rk === 3 || rk === 6).flatMap((rk: number) => rk === 3 ? ["skole", "barnehage"] : ["sykehjem", "sykehus", "omsorgshjem"]).join(", ")}. Dersom dette er relevant for bygget, må det behandles som et fravik som krever særskilt dokumentasjon.</>
                                      : <>⚠ Obs: Preakseptert ytelse for brannceller over flere plan gjelder kun risikoklasse 1, 2, 4 og 5. Prosjektet inneholder risikoklasse {rkList.filter((rk: number) => rk === 3 || rk === 6).map((rk: number) => `RK ${rk}`).join(" og ")}, som ikke dekkes av denne ytelsen.</>
                                    }
                                  </div>
                                ) : null;
                              })()}
                              <p className="text-xs text-muted-foreground italic">
                                {formData.regelverk === "BF85"
                                  ? "Brannceller kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte."
                                  : "Brannceller i risikoklasse 1, 2, 4 og 5 kan ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte."
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Garasje</Label>
                        <div className="border rounded-md p-2 space-y-3 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="garasjeRelevant"
                              checked={formData.garasjeRelevant}
                              onCheckedChange={(checked) => 
                                setFormData({...formData, garasjeRelevant: !!checked, garasjePlassering: "", garasjeAreal: "", garasjeBruksenhet: ""})
                              }
                            />
                            <label htmlFor="garasjeRelevant" className="text-xs cursor-pointer font-medium">Garasje er relevant for tiltaket</label>
                          </div>
                          {formData.garasjeRelevant && formData.regelverk === "BF85" && (
                            <div className="pl-4 space-y-3 border-l-2 border-primary/20 ml-2">
                              <Label className="text-xs font-medium mb-1 block">:44 Skille mot rom for annet formål</Label>
                              {[
                                { id: "bf85_garasje_eksos", label: "Garasje skal være skilt fra resten av bygningen med bygningsdeler som er så tette at eksos ikke trenger gjennom." },
                                { id: "bf85_garasje_over50", label: "Garasje over 50 m² bruttoareal skal være skilt fra resten av bygningen med brannvegg eller branndekke." },
                                { id: "bf85_garasje_under50", label: "Garasje inntil 50 m² bruttoareal skal være skilt fra resten av bygningen med bygningsdeler i B 30." },
                              ].map((opt) => (
                                <div key={opt.id} className="flex items-start gap-2">
                                  <Checkbox
                                    id={`garasje-bf85-${opt.id}`}
                                    checked={(formData.garasjeBF85Krav || []).includes(opt.id)}
                                    onCheckedChange={(checked) => {
                                      const current = formData.garasjeBF85Krav || [];
                                      setFormData({
                                        ...formData,
                                        garasjeBF85Krav: checked
                                          ? [...current, opt.id]
                                          : current.filter((k: string) => k !== opt.id),
                                      });
                                    }}
                                  />
                                  <label htmlFor={`garasje-bf85-${opt.id}`} className="text-xs cursor-pointer leading-relaxed">{opt.label}</label>
                                </div>
                              ))}
                            </div>
                          )}
                          {formData.garasjeRelevant && formData.regelverk !== "BF85" && (
                            <div className="pl-4 space-y-3 border-l-2 border-primary/20 ml-2">
                              {/* Plassering */}
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Plassering</Label>
                                <div className="flex gap-4">
                                  {[
                                    { value: "i_tiltaket", label: "Integrert i byggverket" },
                                    { value: "utenfor_tiltaket", label: "Frittstående bygg" },
                                  ].map((opt) => (
                                    <div key={opt.value} className="flex items-center gap-1.5">
                                      <input
                                        type="radio"
                                        id={`garasje-plassering-${opt.value}`}
                                        name="garasjePlassering"
                                        checked={formData.garasjePlassering === opt.value}
                                        onChange={() => setFormData({...formData, garasjePlassering: opt.value as any, garasjeBruksenhet: ""})}
                                        className="w-3 h-3"
                                      />
                                      <label htmlFor={`garasje-plassering-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Areal */}
                              {formData.garasjePlassering && (
                                <div>
                                  <Label className="text-xs font-medium mb-1 block">Bruttoareal garasje</Label>
                                  <div className="flex gap-4">
                                    {[
                                      { value: "under_50", label: "≤ 50 m²" },
                                      { value: "50_400", label: "50–400 m²" },
                                      { value: "over_400", label: "> 400 m²" },
                                    ].map((opt) => (
                                      <div key={opt.value} className="flex items-center gap-1.5">
                                        <input
                                          type="radio"
                                          id={`garasje-areal-${opt.value}`}
                                          name="garasjeAreal"
                                          checked={formData.garasjeAreal === opt.value}
                                          onChange={() => setFormData({...formData, garasjeAreal: opt.value as any, garasjeBruksenhet: ""})}
                                          className="w-3 h-3"
                                        />
                                        <label htmlFor={`garasje-areal-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Bruksenhet - kun for ≤50 m² */}
                              {formData.garasjeAreal === "under_50" && (
                                <div>
                                  <Label className="text-xs font-medium mb-1 block">Bruksenhet</Label>
                                  <div className="flex gap-4">
                                    {[
                                      { value: "samme", label: "Samme bruksenhet" },
                                      { value: "annen", label: "Annen bruksenhet" },
                                    ].map((opt) => (
                                      <div key={opt.value} className="flex items-center gap-1.5">
                                        <input
                                          type="radio"
                                          id={`garasje-bruksenhet-${opt.value}`}
                                          name="garasjeBruksenhet"
                                          checked={formData.garasjeBruksenhet === opt.value}
                                          onChange={() => setFormData({...formData, garasjeBruksenhet: opt.value as any})}
                                          className="w-3 h-3"
                                        />
                                        <label htmlFor={`garasje-bruksenhet-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Auto-genererte krav */}
                              {formData.garasjeAreal && (formData.garasjeAreal !== "under_50" || formData.garasjeBruksenhet) && (() => {
                                const krav = getGarasjeKrav(formData.garasjePlassering, formData.garasjeAreal, formData.garasjeBruksenhet, formData.brannklasse || "");
                                if (krav.length === 0) return null;
                                return (
                                  <div className="mt-2 p-2 bg-muted/50 rounded border space-y-2">
                                    <Label className="text-xs font-semibold block">Automatisk bestemte krav:</Label>
                                    {krav.map((k, i) => (
                                      <div key={i} className="text-xs leading-tight">
                                        <span className="font-medium">{k.kategori}:</span> {k.tekst}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rom for lagring av olje */}
                      <div>
                        <Label className="text-xs font-medium mb-2 block">{formData.regelverk === "BF85" ? "Lagring av olje (:34)" : "Rom for lagring av olje"}</Label>
                        <div className="border rounded-md p-2 space-y-3 bg-muted/30">
                          {formData.regelverk === "BF85" ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="oljelagringRelevant"
                                  checked={formData.oljelagringRelevant}
                                  onCheckedChange={(checked) => 
                                    setFormData({...formData, oljelagringRelevant: !!checked, oljelagringBF85Krav: []})
                                  }
                                />
                                <label htmlFor="oljelagringRelevant" className="text-xs cursor-pointer font-medium">Lagring av olje er relevant for bygget</label>
                              </div>
                              {formData.oljelagringRelevant && (
                                <div className="pl-4 space-y-3 border-l-2 border-primary/20 ml-2">
                                  {/* :341 Generelt – alltid synlig */}
                                  <div className="p-2 rounded bg-muted/50 border">
                                    <p className="text-xs leading-relaxed font-medium">:341 Generelt – Bestemmelsene gjelder lagring på tank tilknyttet oljeovn eller oljefyringsanlegg. Brenseltank skal tåle mekaniske påkjenninger og beskyttes mot korrosjon.</p>
                                  </div>

                                  {/* :342 Oljelager i jord eller fjell */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id="bf85_olje_jord_fjell_relevant"
                                        checked={formData.oljelagringBF85Krav.includes("bf85_olje_jord_fjell")}
                                        onCheckedChange={(checked) => {
                                          const current = formData.oljelagringBF85Krav || [];
                                          const jordItems = ["bf85_olje_jord_fjell"];
                                          setFormData({
                                            ...formData,
                                            oljelagringBF85Krav: checked
                                              ? [...current, ...jordItems.filter(i => !current.includes(i))]
                                              : current.filter((k: string) => !jordItems.includes(k)),
                                          });
                                        }}
                                        className="mt-0.5"
                                      />
                                      <label htmlFor="bf85_olje_jord_fjell_relevant" className="text-xs cursor-pointer font-medium">:342 Oljelager i jord eller i fjell</label>
                                    </div>
                                    {formData.oljelagringBF85Krav.includes("bf85_olje_jord_fjell") && (
                                      <div className="pl-6 text-xs leading-relaxed text-muted-foreground">
                                        Nedgravd tank skal være dekket av et minst 0,5 m tykt lag av jord eller med betryggande betongplate.
                                      </div>
                                    )}
                                  </div>

                                  {/* :343 Oljelager fri over jord */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id="bf85_olje_fri_over_jord_relevant"
                                        checked={formData.oljelagringBF85Krav.includes("bf85_olje_fri_over_jord")}
                                        onCheckedChange={(checked) => {
                                          const current = formData.oljelagringBF85Krav || [];
                                          const overJordItems = ["bf85_olje_fri_over_jord"];
                                          setFormData({
                                            ...formData,
                                            oljelagringBF85Krav: checked
                                              ? [...current, ...overJordItems.filter(i => !current.includes(i))]
                                              : current.filter((k: string) => !overJordItems.includes(k)),
                                          });
                                        }}
                                        className="mt-0.5"
                                      />
                                      <label htmlFor="bf85_olje_fri_over_jord_relevant" className="text-xs cursor-pointer font-medium">:343 Oljelager fri over jord</label>
                                    </div>
                                    {formData.oljelagringBF85Krav.includes("bf85_olje_fri_over_jord") && (
                                      <div className="pl-6 text-xs leading-relaxed text-muted-foreground">
                                        Tank skal plasseres slik i forhold til bygning og opplag at det ikke er fare for at tanken kan bli antent ved brann i disse.
                                      </div>
                                    )}
                                  </div>

                                  {/* :344 Oljelager innendørs */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id="bf85_olje_innendors_relevant"
                                        checked={formData.oljelagringBF85Krav.includes("bf85_olje_innendors")}
                                        onCheckedChange={(checked) => {
                                          const current = formData.oljelagringBF85Krav || [];
                                          const innendorsItems = ["bf85_olje_innendors"];
                                          setFormData({
                                            ...formData,
                                            oljelagringBF85Krav: checked
                                              ? [...current, ...innendorsItems.filter(i => !current.includes(i))]
                                              : current.filter((k: string) => !innendorsItems.includes(k)),
                                          });
                                        }}
                                        className="mt-0.5"
                                      />
                                      <label htmlFor="bf85_olje_innendors_relevant" className="text-xs cursor-pointer font-medium">:344 Oljelager innendørs</label>
                                    </div>
                                    {formData.oljelagringBF85Krav.includes("bf85_olje_innendors") && (
                                      <div className="pl-6 space-y-3">
                                        <div className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-md border">
                                          <p className="font-medium text-foreground mb-1">:344 Oljelager innendørs</p>
                                          <ul className="list-disc pl-4 space-y-1">
                                            <li>Olje i mengde over 20 liter må bare lagres i tankrom, fyrrom eller garasje som tilfredsstiller kravene til branncellebegrensning.</li>
                                            <li>Vegger og golv skal være tette, og rommet skal være slik innredet at olje ved lekkasje fra tanken samles opp og ikke kan trenge inn i andre rom eller i ildsted eller røykkanal.</li>
                                            <li>Rommet skal ha elektrisk belysning.</li>
                                            <li>Tank for fyringsolje må plasseres minst 1,0 m fra kjele, brenner eller røykkanal. For petroleumstank må tilsvarende avstand være 2,0 m.</li>
                                            <li>Tank på inntil 600 liter kan plasseres på brakett på vegg i A 60-konstruksjon. Tank av brennbart materiale skal plasseres i tankrom med branncellebegrensende bygningsdel minst A 60.</li>
                                          </ul>
                                        </div>

                                        {/* :345 Mengdebegrensninger */}
                                        <div className="mt-2 pt-2 border-t space-y-2">
                                          <Label className="text-xs font-medium">:345 Mengdebegrensninger</Label>
                                          {[
                                            { id: "bf85_olje_fyringsparafin_a", label: ":345a Fyringssolje – På tank som utgjør en del av typegodkjent ildsted: Høyst 20 liter." },
                                            { id: "bf85_olje_fyringsparafin_b", label: ":345a Fyringssolje – På vegg-/tankovn med forgassingsbrenner plassert minst 0,6 m fra ildsted: Høyst 20 liter." },
                                            { id: "bf85_olje_fyringsparafin_c", label: ":345a Fyringssolje – På tank i fyrrom eller garasje med grunnflate høyst 50 m² med branncellebegrensende bygningsdel minst B 30: Inntil 4 000 liter." },
                                            { id: "bf85_olje_fyringsparafin_d", label: ":345a Fyringssolje – På tank i tankrom eller i fyrrom med branncellebegrensende bygningsdel h.h.v minst B 30 og A 60: Inntil 10 000 liter." },
                                            { id: "bf85_olje_fyringsparafin_e", label: ":345a Fyringssolje – På tank i tankrom med branncellebegrensende bygningsdel minst A 60: Over 10 000 liter (avhengig av brannstyrets godkjenning)." },
                                            { id: "bf85_olje_fyringsparafin_f", label: ":345a Fyringssolje – På nedgravd tank: Ingen begrensning." },
                                            { id: "bf85_olje_petroleum", label: ":345b Petroleum – Petroleum i mengde inntil 1 650 liter kan lagres som fyringssolje. Ved fellesanlegg for rekkehus, leiegårder o.l. kan brannstyret tillate inntil 1 000 liter petroleum pr. boligenhet, dog ikke over 6 000 liter." },
                                          ].map((opt) => (
                                            <div key={opt.id} className="flex items-start gap-2">
                                              <Checkbox
                                                id={opt.id}
                                                checked={formData.oljelagringBF85Krav.includes(opt.id)}
                                                onCheckedChange={(checked) => {
                                                  const current = formData.oljelagringBF85Krav || [];
                                                  setFormData({
                                                    ...formData,
                                                    oljelagringBF85Krav: checked
                                                      ? [...current, opt.id]
                                                      : current.filter((k: string) => k !== opt.id),
                                                  });
                                                }}
                                                className="mt-0.5"
                                              />
                                              <label htmlFor={opt.id} className="text-xs cursor-pointer leading-relaxed">{opt.label}</label>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="brensellagringRelevant"
                                  checked={formData.brensellagringRelevant}
                                  onCheckedChange={(checked) => 
                                    setFormData({...formData, brensellagringRelevant: !!checked, brenselType: "", brenselMengde: ""})
                                  }
                                />
                                <label htmlFor="brensellagringRelevant" className="text-xs cursor-pointer font-medium">Lagring av olje er relevant</label>
                              </div>
                              {formData.brensellagringRelevant && (
                                <div className="pl-4 space-y-3 border-l-2 border-primary/20 ml-2">
                                  <div>
                                    <Label className="text-xs font-medium mb-1 block">Type brensel</Label>
                                    <div className="flex gap-4 flex-wrap">
                                      {[
                                        { value: "fyringsparafin", label: "Fyringsparafin" },
                                        { value: "lett_fyringsolje", label: "Lett fyringsolje" },
                                        { value: "begge", label: "Fyringsparafin + Lett fyringsolje" },
                                      ].map((opt) => (
                                        <div key={opt.value} className="flex items-center gap-1.5">
                                          <input
                                            type="radio"
                                            id={`brensel-type-${opt.value}`}
                                            name="brenselType"
                                            checked={formData.brenselType === opt.value}
                                            onChange={() => setFormData({...formData, brenselType: opt.value as any})}
                                            className="w-3 h-3"
                                          />
                                          <label htmlFor={`brensel-type-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {formData.brenselType && (
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Mengde (liter)</Label>
                                      <Input
                                        type="number"
                                        value={formData.brenselMengde}
                                        onChange={(e) => setFormData({...formData, brenselMengde: e.target.value})}
                                        placeholder="Oppgi antall liter..."
                                        className="w-40 h-7 text-xs"
                                      />
                                    </div>
                                  )}
                                  {formData.brenselType && formData.brenselMengde && (() => {
                                    const result = getBrensellagringKrav(formData.brenselType as BrenselType, parseInt(formData.brenselMengde));
                                    if (result.feilmelding) {
                                      return <p className="text-xs text-destructive font-medium">{result.feilmelding}</p>;
                                    }
                                    if (result.krav.length === 0) return null;
                                    return (
                                      <div className="space-y-1 bg-muted/50 p-2 rounded text-xs">
                                        <p className="font-semibold text-xs">Romtype: {result.romType}</p>
                                        {result.krav.map((k, i) => (
                                          <div key={i} className="text-xs">
                                            <span className="font-medium">{k.kategori}:</span> {k.tekst}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>


                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Branncellekrav basert på valgte branncelle-typer</li>
                          <li>Brannmotstand for branncellebegrensende konstruksjoner</li>
                          <li>Dørkrav i branncellebegrensende vegger</li>
                          <li>Krav til gjennomføringer og branntetting</li>
                        </ul>
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
                    {renderTilstandPanel("3_5")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-6" label={`3.6 ${formData.regelverk === "BF85" ? "Kledninger og overflater (:42)" : "§ 11-9 Materialer og produkter"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.6 {formData.regelverk === "BF85" ? "Kledninger og overflater for vegger og tak (:42)" : "§ 11-9 Materialer og produkters egenskaper ved brann"}</Label>
                      </div>

                      {formData.regelverk === "BF85" ? (
                        <>
                          {/* BF85 :42 Kledninger og overflater */}
                          <div className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-md border space-y-2">
                            <p>Kledninger og overflater for vegger og tak skal være i brannteknisk klasse som angitt i Tabell 30:42.</p>
                            <p>Brannceller inntil 200 m², unntatt bygninger etter kap. 36 og 37, kan ha kledning K2 og overflate In3, forutsatt at brannvesenet med det stigemateriell det rår over kan komme til bygningens fasader.</p>
                            <p className="text-xs italic">Kap. 36 = Overnattingssteder, Kap. 37 = Sykehus og pleieanstalter</p>
                            <p>Små atskilte rom, overstykker og brystning til vinduer, samt overstykker til dører kan ha overflate In3.</p>
                          </div>

                          {/* Tabell 30:42 */}
                          <div className="mt-3">
                            <Label className="text-xs font-bold mb-2 block">Tabell 30:42 Kledningers og overflaters branntekniske klasse</Label>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse border border-border">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="border border-border p-2 text-left font-medium" colSpan={2}>Bygningsbrannklasse</th>
                                    <th className="border border-border p-2 text-center font-medium">1</th>
                                    <th className="border border-border p-2 text-center font-medium">2</th>
                                    <th className="border border-border p-2 text-center font-medium">3</th>
                                    <th className="border border-border p-2 text-center font-medium">4</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { label: "Innvendig overflate", vals: ["In1", "In2", "In2", "In2"] },
                                    { label: "Utvendig overflate", vals: ["Ut1", "Ut1", "Ut2", "Ut2"] },
                                    { label: "Innvendig kledning", vals: ["K1", "K1", "K2", "K2"] },
                                    { label: "Utvendig kledning", vals: ["K1", "K1", "K2", "K2"] },
                                  ].map((row) => (
                                    <tr key={row.label}>
                                      <td className="border border-border p-2" colSpan={2}>{row.label}</td>
                                      {row.vals.map((v, i) => (
                                        <td key={i} className={`border border-border p-2 text-center ${formData.bygningsbrannklasse === String(i + 1) ? "bg-primary/10 font-bold" : ""}`}>{v}</td>
                                      ))}
                                    </tr>
                                  ))}
                                  <tr>
                                    <td className="border border-border p-2 italic text-muted-foreground" colSpan={6}>Særkrav for rømningsveg:</td>
                                  </tr>
                                  {[
                                    { label: "Innvendig overflate", vals: ["In1", "In1", "In1", "In1"] },
                                    { label: "Innvendig kledning", vals: ["K1-A", "K1-A", "K1", "K1"] },
                                  ].map((row) => (
                                    <tr key={`saer-${row.label}`}>
                                      <td className="border border-border p-2 pl-6" colSpan={2}>{row.label}</td>
                                      {row.vals.map((v, i) => (
                                        <td key={i} className={`border border-border p-2 text-center ${formData.bygningsbrannklasse === String(i + 1) ? "bg-primary/10 font-bold" : ""}`}>{v}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {formData.bygningsbrannklasse && (
                              <p className="text-xs text-primary font-medium mt-2">
                                Bygningsbrannklasse {formData.bygningsbrannklasse} er markert i tabellen.
                              </p>
                            )}
                            {(formData.bygningstype === "Overnattingssted" || formData.bygningstype === "Sykehus") && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded text-xs text-amber-700 dark:text-amber-400">
                                ⚠️ Bygningen er {formData.bygningstype === "Overnattingssted" ? "overnattingssted (Kap. 36)" : "sykehus/pleieanstalt (Kap. 37)"} – unntaket for brannceller inntil 200 m² (K2/In3) gjelder ikke.
                              </div>
                            )}
                          </div>

                          {/* BF85 :5 Vegger, tak og nedforet himling */}
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                            <Label className="text-xs font-medium">Vegger, tak og nedforet himling (:5)</Label>
                            {[
                              { key: "bf85_511", label: ":511 Generelt – Brannmotstand for bærende/branncellebegrensende vegger" },
                              { key: "bf85_512", label: ":512 Ikke-bærende ytterveggers brannmotstand" },
                              { key: "bf85_513", label: ":513 Yttervegger i B-konstruksjon" },
                              { key: "bf85_514", label: ":514 Fasademateriale på vegg i A-konstruksjon" },
                              { key: "bf85_515", label: ":515 Brennbar isolasjon" },
                            ].map((item) => (
                              <div key={item.key} className="flex items-center gap-2">
                                <Checkbox
                                  id={item.key}
                                  checked={!!formData[item.key]}
                                  onCheckedChange={(checked) =>
                                    setFormData({ ...formData, [item.key]: !!checked })
                                  }
                                />
                                <label htmlFor={item.key} className="text-xs cursor-pointer">
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">Krav til overflater og kledninger genereres automatisk basert på brannklasse ({formData.brannklasse || "ikke angitt"}).</p>
                      
                          {/* Innvendige overflater og kledninger - noter */}
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                            <Label className="text-xs font-medium">Innvendige overflater og kledninger – velg relevante bestemmelser</Label>
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="matNote1"
                                checked={formData.matNote1}
                                onCheckedChange={(checked) => setFormData({...formData, matNote1: !!checked})}
                              />
                              <label htmlFor="matNote1" className="text-xs cursor-pointer leading-relaxed">
                                Overflater og kledninger er tilfredsstillende når det benyttes produkter med egenskaper som angitt i tabell 1A og 1B, med unntak gitt i nr. 3 og 4.
                              </label>
                            </div>
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="matNote2"
                                checked={formData.matNote2}
                                onCheckedChange={(checked) => setFormData({...formData, matNote2: !!checked})}
                              />
                              <label htmlFor="matNote2" className="text-xs cursor-pointer leading-relaxed">
                                Overflater i hulrom betraktes på samme måte som innvendig overflate og må ha minst like gode branntekniske egenskaper.
                              </label>
                            </div>
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="matNote3"
                                checked={formData.matNote3}
                                onCheckedChange={(checked) => setFormData({...formData, matNote3: !!checked})}
                              />
                              <label htmlFor="matNote3" className="text-xs cursor-pointer leading-relaxed">
                                Rom med brannfarlig virksomhet må ha kledning som tilfredsstiller klasse K₂10 A2-s1,d0 [K1-A]. Eksempel på rom med brannfarlig virksomhet er rom hvor det oppbevares fyrverkeri, brannfarlig væske kategori 1 og 2, eller rom hvor det utføres varme arbeider som sveising, sliping samt rom hvor det arbeides med åpen varme.
                              </label>
                            </div>
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="matNote4"
                                checked={formData.matNote4}
                                onCheckedChange={(checked) => setFormData({...formData, matNote4: !!checked})}
                              />
                              <label htmlFor="matNote4" className="text-xs cursor-pointer leading-relaxed">
                                Selv om sikkerhet ved brann dokumenteres ved analyse, må innvendige overflater på vegger og i himlinger ha minst klasse D-s2,d0 [In 2]. Lavere ytelse kan gi uakseptabelt bidrag til brannutviklingen.
                              </label>
                            </div>
                          </div>

                          {/* Nedforet himling i rømningsvei */}
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                            <Label className="text-xs font-medium">Nedforet himling i rømningsvei</Label>
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="himlingNote1"
                                checked={formData.himlingNote1}
                                onCheckedChange={(checked) => setFormData({...formData, himlingNote1: !!checked})}
                              />
                              <label htmlFor="himlingNote1" className="text-xs cursor-pointer leading-relaxed">
                                Himlingen må tilfredsstille klasse A2-s1,d0 [In 1 på begrenset brennbart underlag] og ha et opphengsystem med dokumentert brannmotstand minst 10 minutter for den aktuelle eksponering, eller himlingen må bestå av kledning som tilfredsstiller klasse K₂10 A2-s1,d0 [K1-A].
                              </label>
                            </div>
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="himlingNote2"
                                checked={formData.himlingNote2}
                                onCheckedChange={(checked) => setFormData({...formData, himlingNote2: !!checked})}
                              />
                              <label htmlFor="himlingNote2" className="text-xs cursor-pointer leading-relaxed">
                                Overflater og kledninger i hulrom over himlingen må ha minst like gode branntekniske egenskaper som overflatene og kledningene i rømningsveien for øvrig.
                              </label>
                            </div>
                          </div>

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
                        </>
                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Krav til innvendige overflater og kledninger basert på brannklasse</li>
                          <li>Særkrav for rømningsveier (In1, K1-A)</li>
                          <li>Krav til isolasjon og sandwichelementer</li>
                          <li>Tabell 1A/1B for produktegenskaper</li>
                        </ul>
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
                    {renderTilstandPanel("3_6")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-7" label={`3.7 ${formData.regelverk === "BF85" ? "Tekniske installasjoner (§ 11-10)" : "§ 11-10 Tekniske installasjoner"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.7 § 11-10 Tekniske installasjoner</Label>
                      </div>
                      
                      {formData.regelverk === "BF85" ? (
                        <>
                          {/* BF85 :1332 Avtrekk */}
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="bf85_1332_avtrekk"
                                checked={!!formData.bf85_1332_avtrekk}
                                onCheckedChange={(checked) => setFormData({...formData, bf85_1332_avtrekk: !!checked})}
                              />
                              <label htmlFor="bf85_1332_avtrekk" className="text-xs font-medium cursor-pointer">
                                :1332 Avtrekk
                              </label>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.ventilasjonRelevant && <li>Ventilasjonsanlegg: brannspjeld, kanaler gjennom brannskiller, røykventilasjon</li>}
                          {formData.vannAvlopRelevant && <li>Vann- og avløpsrør: gjennomføringer og branntetting</li>}
                          {formData.rorIsolasjonRelevant && <li>Rør- og kanalisolasjon: 20%-regel og krav for rømningsveier/sjakter</li>}
                          {formData.elektriskRelevant && <li>Elektriske installasjoner: kabler i hulrom, sjakter og brannmotstand</li>}
                          {!formData.ventilasjonRelevant && !formData.vannAvlopRelevant && !formData.rorIsolasjonRelevant && !formData.elektriskRelevant && <li>Velg relevante tekniske installasjoner ovenfor</li>}
                        </ul>
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
                    {renderTilstandPanel("3_7")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-8" label={`3.8 ${formData.regelverk === "BF85" ? "Rømning og redning (§ 11-11)" : "§ 11-11 Rømning og redning"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.8 § 11-11 Rømning og redning</Label>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Generell beskrivelse av evakuering</Label>
                        <Textarea 
                          value={formData.romningSikkerhet}
                          onChange={(e) => setFormData({...formData, romningSikkerhet: e.target.value})}
                         />
                      </div>
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Generelle krav til rømning og evakuering</li>
                          <li>Krav til tidlig varsling og tilstrekkelig rømningstid</li>
                          <li>Krav til rømningsveier med tilstrekkelig kapasitet</li>
                        </ul>
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
                    {renderTilstandPanel("3_8")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-9" label={`3.9 ${formData.regelverk === "BF85" ? "Tilrettelegging for rømning (§ 11-12)" : "§ 11-12 Tilrettelegging for rømning"}`}>
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.9 § 11-12 Tilrettelegging for rømning og redning</Label>
                      </div>

                      {/* BF85-spesifikt: :16 Brannalarmanlegg for skoler */}
                      {formData.regelverk === "BF85" && formData.bygningstype.toLowerCase().includes("skole") && (
                        <div className="p-3 bg-muted/50 border border-border rounded space-y-2">
                          <Label className="text-xs font-medium block">BF85-krav for skoler:</Label>
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="bf85_16_brannalarmanlegg" 
                              checked={formData.bf85_16_brannalarmanlegg}
                              onCheckedChange={(checked) => setFormData({...formData, bf85_16_brannalarmanlegg: !!checked})}
                            />
                            <Label htmlFor="bf85_16_brannalarmanlegg" className="text-xs cursor-pointer leading-relaxed">
                              <strong>:16 Brannalarmanlegg:</strong> Bygningsrådet kan kreve Brannalarmanlegg.
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="bf85_sprinkler_installert" 
                              checked={formData.bf85_sprinkler_installert}
                              onCheckedChange={(checked) => setFormData({...formData, bf85_sprinkler_installert: !!checked})}
                            />
                            <Label htmlFor="bf85_sprinkler_installert" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Sprinkleranlegg installert:</strong> Bygget har installert sprinkleranlegg. Dette kan benyttes som kompenserende tiltak for å fravike andre krav i BF85.
                            </Label>
                          </div>
                        </div>
                      )}
                      
                      {formData.regelverk !== "BF85" && (<>
                      {/* Automatiske krav basert på RK */}
                      {(formData.risikoklasse === "RK4" || formData.bygningsdeler.some(b => b.risikoklasse === "RK4")) && (
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd1a" 
                            checked={formData.tilretteleggingLedd1a}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd1a: checked as boolean})}
                          />
                          <Label htmlFor="tilretteleggingLedd1a" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Automatisk brannslokkeanlegg (RK4):</strong> Byggverk eller del av byggverk i risikoklasse 4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg. Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner.
                          </Label>
                        </div>
                      )}
                      {formData.tilretteleggingLedd1a && (
                        <div className="ml-6 p-3 bg-muted/50 border border-border rounded space-y-2">
                          <Label className="text-xs font-medium block mb-1">Utdypende krav for RK4:</Label>
                          <ol className="text-xs space-y-1.5 list-decimal ml-4">
                            <li>Forskriftens krav til automatisk brannslokkeanlegg i byggverk i risikoklasse 4 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019. I byggverk med både næringsvirksomhet og boliger gjelder følgende:
                              <ol className="list-decimal ml-4 mt-1 space-y-1">
                                <li>NS-EN 12845:2015+A1:2019 kan benyttes i arealer avsatt for næring.</li>
                                <li>Arealer avsatt for boligformål sprinklet etter NS-EN 12845:2015 må ha hurtigutløsende (QR–quick response) sprinklere.</li>
                                <li>Arealer avsatt for boligformål og tilhørende rømningsveier definert i NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019 kan prosjekteres og utføres etter denne standarden.</li>
                              </ol>
                            </li>
                            <li>Dersom ulike deler av et byggverk ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.</li>
                          </ol>
                        </div>
                      )}
                      {(formData.risikoklasse === "RK6" || formData.bygningsdeler.some(b => b.risikoklasse === "RK6")) && (
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="tilretteleggingLedd1b" 
                              checked={formData.tilretteleggingLedd1b}
                              onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd1b: checked as boolean})}
                            />
                            <Label htmlFor="tilretteleggingLedd1b" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Automatisk brannslokkeanlegg (RK6):</strong> Byggverk i risikoklasse 6 skal ha automatisk brannslokkeanlegg.
                            </Label>
                          </div>
                          {formData.tilretteleggingLedd1b && (
                            <div className="ml-6 p-3 bg-muted/50 border border-border rounded space-y-2">
                              <Label className="text-xs font-medium block mb-1">Utdypende krav for RK6:</Label>
                              <ol className="text-xs space-y-1.5 list-decimal ml-4">
                                <li>Forskriftens krav til automatisk slokkeanlegg i byggverk i risikoklasse 6 anses oppfylt når det installeres automatisk sprinkleranlegg i samsvar med NS-EN 12845:2015+A1:2019. Boligsprinkleranlegg i samsvar med NS-EN 16925:2018+AC:2020 og NS-EN 16925:2018+NA:2019 kan benyttes der dette er angitt i tabell NA.2 i standarden.</li>
                                <li>Dersom byggverket også har virksomhet i andre risikoklasser, må deler av byggverket med og uten automatisk sprinkleranlegg være ulike brannseksjoner.</li>
                                <li>Dersom virksomhet i ulike risikoklasser ikke kan oppdeles i brannseksjoner, må hele byggverket ha automatisk sprinkleranlegg.</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      {(formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && (
                        <div className="ml-6 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded space-y-2">
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="tilretteleggingLedd1c" 
                              checked={formData.tilretteleggingLedd1c}
                              onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd1c: checked as boolean})}
                            />
                            <Label htmlFor="tilretteleggingLedd1c" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Alternativt tiltak (§ 11-12, 1. ledd bokstav c):</strong> Der det er krav om automatisk brannslokkeanlegg, kan det likevel benyttes andre tiltak som gir tilsvarende sikkerhet ved å hindre, begrense eller kontrollere en brann lokalt der den oppstår.
                            </Label>
                          </div>
                          {formData.tilretteleggingLedd1c && (
                            <div className="ml-6 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Nye teknikker eller løsninger for spesielle situasjoner kan aksepteres når de er dokumentert å ha minst tilsvarende funksjon og pålitelighet som et automatisk sprinkleranlegg. Dokumentasjonen skal foreligge i byggesaken.
                              </p>
                              <Textarea
                                placeholder="Beskriv det alternative tiltaket som benyttes..."
                                value={formData.tilretteleggingLedd1cBeskrivelse || ""}
                                onChange={(e) => setFormData({...formData, tilretteleggingLedd1cBeskrivelse: e.target.value})}
                                className="text-xs min-h-[80px]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Velg relevante krav:</Label>
                        
                        {/* Sjekk om bygget kvalifiserer for røykvarslere */}
                        {(() => {
                          const rk = formData.risikoklasse;
                          const areal = parseFloat(formData.areal) || 0;
                          const bygningstype = formData.bygningstype.toLowerCase();
                          const etasjer = parseInt(formData.etasjer) || 1;
                          
                          const erRK2IndustriLager = rk === "RK2" && areal <= 1200 && 
                            (bygningstype.includes("industri") || bygningstype.includes("lager"));
                          const erRK2Kontor = rk === "RK2" && areal <= 1200 && bygningstype.includes("kontor");
                          const erRK4Bolig = rk === "RK4" && 
                            (bygningstype.includes("enebolig") || bygningstype.includes("rekkehus") || 
                             bygningstype.includes("kjedehus") || bygningstype.includes("fritidsbolig") ||
                             bygningstype.includes("bolig"));
                          const erRK5Liten = rk === "RK5" && areal <= 600;
                          
                          const kanVelgeRoykvarsler = erRK2IndustriLager || erRK2Kontor || erRK4Bolig || erRK5Liten;
                          
                          const bt = formData.bygningstype.toLowerCase();
                          const erBolig = bt.includes("bolig") || bt.includes("enebolig") || bt.includes("rekkehus") || bt.includes("kjedehus") || bt.includes("leilighet") || formData.risikoklasse === "RK4";
                          
                          // Beregn brannalarmkategori
                          let brannalarmkategori = 1;
                          if (rk === "RK5" || rk === "RK6") {
                            brannalarmkategori = 2;
                          } else if ((rk === "RK2" || rk === "RK3" || rk === "RK4") && etasjer >= 2) {
                            brannalarmkategori = 2;
                          }
                          
                          // Alarmvalg: "brannalarm" eller "roykvarsler"
                          const alarmValg = formData.alarmValg || "brannalarm";
                          
                          return (
                            <>
                              {kanVelgeRoykvarsler && (
                                <div className="p-3 bg-muted/30 border border-border rounded space-y-2 mb-2">
                                  <Label className="text-xs font-medium block">Velg varslingsløsning:</Label>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id="alarmValg_brannalarm"
                                        name="alarmValg"
                                        value="brannalarm"
                                        checked={alarmValg === "brannalarm"}
                                        onChange={() => setFormData({...formData, alarmValg: "brannalarm", tilretteleggingLedd2a: true, tilretteleggingLedd2b: false})}
                                        className="accent-primary"
                                      />
                                      <Label htmlFor="alarmValg_brannalarm" className="text-xs cursor-pointer">
                                        <strong>Brannalarmanlegg</strong> (NS 3960 / NS-EN 54)
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id="alarmValg_roykvarsler"
                                        name="alarmValg"
                                        value="roykvarsler"
                                        checked={alarmValg === "roykvarsler"}
                                        onChange={() => setFormData({...formData, alarmValg: "roykvarsler", tilretteleggingLedd2a: false, tilretteleggingLedd2b: true})}
                                        className="accent-primary"
                                      />
                                      <Label htmlFor="alarmValg_roykvarsler" className="text-xs cursor-pointer">
                                        <strong>Røykvarslere</strong> (preakseptert alternativ for dette bygget)
                                      </Label>
                                    </div>
                                  </div>
                                  {alarmValg === "roykvarsler" && (
                                    <div className="p-2 bg-muted/30 border border-border rounded text-xs text-muted-foreground mt-2 space-y-1">
                                      <p className="font-medium text-foreground">Krav til røykvarslere:</p>
                                      <p>• Røykvarslere skal være tilknyttet strømforsyningen og ha batteri som reserveløsning.</p>
                                      <p>• I branncelle med behov for flere røykvarslere skal varslerne være seriekoblet.</p>
                                      <p>• I byggverk uten strømforsyning kan det benyttes batteridrevne røykvarslere.</p>
                                      {erRK2IndustriLager && (
                                        <p>• Industri- og lagerbygninger i RK2 med samlet bruttoareal inntil 1 200 m², og hvor rømningsforholdene er enkle og oversiktlige. Røykvarslere må plasseres i alle rømningsveier, fellesarealer og arealer med arbeidsplasser.</p>
                                      )}
                                      {erRK2Kontor && (
                                        <p>• Kontorbygninger i RK2 med samlet bruttoareal inntil 1 200 m², og hvor rømningsforholdene er enkle og oversiktlige. Røykvarslere må plasseres i alle rømningsveier, fellesarealer og arealer med arbeidsplasser.</p>
                                      )}
                                      {erRK4Bolig && (
                                        <>
                                          <p>• Eneboliger, to- til firemannsboliger, rekkehus, kjedehus og fritidsbolig med én boenhet i risikoklasse 4.</p>
                                          <p>• Røykvarslerne må dekke områdene kjøkken, stue, sone utenfor soverom og tekniske rom.</p>
                                          <p>• Det må være minst én røykvarsler per etasje.</p>
                                          <p>• Røykvarslere må plasseres slik at alarmstyrken er minst 60 desibel i oppholdsrom og soverom når mellomliggende dører er lukket.</p>
                                        </>
                                      )}
                                      {erRK5Liten && (
                                        <p>• Byggverk i RK5 med samlet bruttoareal inntil 600 m², og hvor rømningsveiene er oversiktlige og fører direkte til terreng. Røykvarslere må plasseres i alle rømningsveier og fellesarealer.</p>
                                      )}
                                      <p className="mt-1">• Røykvarslere må oppfylle kravene i NS-EN 14604:2005, eller ha detektor i samsvar med NS-EN 54-7:2018 og lydgiver i samsvar med NS-EN 14604:2005.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {!kanVelgeRoykvarsler && (
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
                              )}
                              
                              {/* Sub-checkboxer for brannalarmanlegg - vises når brannalarm er valgt */}
                              {(formData.tilretteleggingLedd2a || (kanVelgeRoykvarsler && alarmValg === "brannalarm")) && (
                                <div className="ml-6 p-3 bg-muted/50 border border-border rounded space-y-2">
                                  {/* Brannalarmkategori */}
                                  <div className="p-2 bg-muted/30 border border-border rounded space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs font-medium">Brannalarmkategori:</Label>
                                      <span className="text-xs font-bold text-primary">{brannalarmkategori}</span>
                                      <span className="text-xs text-muted-foreground ml-1">
                                        (basert på {rk}, {etasjer} {etasjer === 1 ? "etasje" : "etasjer"})
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {brannalarmkategori === 1
                                        ? "Brannalarmkategori 1: Optiske røykdetektorer i rømningsveier og fellesarealer."
                                        : "Brannalarmkategori 2: Heldekkende brannalarmanlegg med optiske røykdetektorer i alle områder."}
                                    </p>
                                  </div>

                                  <Label className="text-xs font-medium block mb-2">Krav for brannalarmanlegg:</Label>
                                  
                                  {/* Boligkrav */}
                                  {erBolig && (
                                    <div className="p-2 bg-muted/30 border border-border rounded">
                                      <div className="flex items-start space-x-2">
                                        <Checkbox 
                                          id="brannalarmBoligbygg" 
                                          checked={true}
                                          disabled
                                        />
                                        <Label htmlFor="brannalarmBoligbygg" className="text-xs cursor-pointer leading-relaxed">
                                          <strong>Detektorer i leiligheter:</strong> Må dekke kjøkken, stue og sone utenfor soverom. Minst én detektor per etasje. Akustiske alarmorganer plasseres slik at alarmstyrken er minst 60 dB. Detektorer og akustiske alarmorganer må installeres i trapperom, kjeller og loft. Manuell melder i trapperom ved hovedinngang.
                                        </Label>
                                      </div>
                                    </div>
                                  )}

                                  {/* Parkering */}
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
                                  
                                  {/* Ikke-boligkrav */}
                                  {!erBolig && (
                                    <>
                                      <div className="flex items-start space-x-2">
                                        <Checkbox 
                                          id="brannalarmPublikum" 
                                          checked={formData.brannalarmPublikum}
                                          onCheckedChange={(checked) => setFormData({...formData, brannalarmPublikum: checked as boolean})}
                                        />
                                        <Label htmlFor="brannalarmPublikum" className="text-xs cursor-pointer leading-relaxed">
                                          <strong>Publikum/arbeidsbygninger:</strong> Akustiske alarmorganer må suppleres med optiske i deler åpent for publikum og fellesarealer i arbeidsbygninger.
                                        </Label>
                                      </div>
                                      
                                      <div className="flex items-start space-x-2">
                                        <Checkbox 
                                          id="brannalarmUniversell" 
                                          checked={formData.brannalarmUniversell}
                                          onCheckedChange={(checked) => setFormData({...formData, brannalarmUniversell: checked as boolean})}
                                        />
                                        <Label htmlFor="brannalarmUniversell" className="text-xs cursor-pointer leading-relaxed">
                                          <strong>Universell utforming:</strong> Rom som er universelt utformet må ha optiske alarmorganer i tillegg til akustiske, jf. § 12-7. I bad og toalettrom som er universelt utformet, jf. § 12-9, må akustiske alarmorganer suppleres med optiske.
                                        </Label>
                                      </div>

                                      <div className="flex items-start space-x-2">
                                        <Checkbox 
                                          id="brannalarmTalevarsling" 
                                          checked={formData.brannalarmTalevarsling}
                                          onCheckedChange={(checked) => setFormData({...formData, brannalarmTalevarsling: checked as boolean})}
                                        />
                                        <Label htmlFor="brannalarmTalevarsling" className="text-xs cursor-pointer leading-relaxed">
                                          <strong>Talevarsling:</strong> Branncelle over flere plan beregnet for flere enn 1 000 personer må ha talevarslingssanlegg.
                                        </Label>
                                      </div>
                                      
                                      <div className="flex items-start space-x-2">
                                        <Checkbox 
                                          id="brannalarmTakterrasse" 
                                          checked={formData.brannalarmTakterrasse}
                                          onCheckedChange={(checked) => setFormData({...formData, brannalarmTakterrasse: checked as boolean})}
                                        />
                                        <Label htmlFor="brannalarmTakterrasse" className="text-xs cursor-pointer leading-relaxed">
                                          <strong>Takterrasse:</strong> Takterrasse beregnet for personopphold må ha utstyr for varsling av brann.
                                        </Label>
                                      </div>

                                      <div className="p-2 bg-muted/30 border border-border rounded mt-2">
                                        <p className="text-xs text-muted-foreground italic">
                                          Rømningsveier trenger ikke ha optiske alarmorganer i tillegg til akustiske. Brannalarmanlegg må ha alarmoverføring til nødmeldesentral, alarmstasjon, vaktselskap eller til sted lokalt i byggverket med personell som har ansvar for å iverksette aksjon.
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-2 rounded">
                          <strong>Markeringsskilt:</strong> Alle byggverk må ha markeringsskilt plassert over alle utganger til og i rømningsvei. Unntak kan gjøres for utgang fra boenheter og fra små rom der slike skilt åpenbart er unødvendige.
                        </p>

                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd3" 
                            checked={formData.tilretteleggingLedd3}
                            onCheckedChange={(checked) => {
                              const on = checked as boolean;
                              const bk = formData.brannklasse || "";
                              setFormData({
                                ...formData,
                                tilretteleggingLedd3: on,
                                ledesystemLedelinjer: on ? true : false,
                                ledesystemRomningsmerking: on ? true : false,
                                ledesystemBKL1Varighet: on && (bk === "BKL1" || bk === "-"),
                                ledesystemBKL23Varighet: on && (bk === "BKL2" || bk === "BKL3"),
                              });
                            }}
                          />
                          <Label htmlFor="tilretteleggingLedd3" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Ledesystem:</strong> Store byggverk, byggverk for mange personer og RK5/RK6 skal ha ledesystem med god belysning og merking.
                          </Label>
                        </div>
                        {!formData.tilretteleggingLedd3 && erLedesystemPaakrevd && (
                          <div className="ml-6 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                            <p className="text-xs font-semibold text-destructive">{ledesystemFravikTekst}</p>
                          </div>
                        )}
                        {formData.tilretteleggingLedd3 && (
                          <div className="ml-6 space-y-2 p-3 border border-border rounded-lg bg-card">
                            <p className="text-xs font-semibold text-foreground mb-2">Preaksepterte ytelser for ledesystem:</p>
                            
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Ledesystem i fluktveier og rømningsveier må omfatte ledelinjer som oppfattes kontinuerlig, i form av komponenter på gulv eller lavt plasserte på vegg.
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Rømningsmerking må være synlig og lesbar fra alle steder i fluktveien og rømningsveien.
                            </p>

                            {(() => {
                              const rk = formData.risikoklasse;
                              const erBolig = rk === "RK4";
                              const erRK5 = rk === "RK5";
                              const erRK6 = rk === "RK6";
                              const etasjer = parseInt(formData.etasjer) || 0;
                              const brannklasse = formData.brannklasse || "";

                              return (
                                <>

                                  {(erRK5 || erRK6) && (
                                    <div className="flex items-start space-x-2">
                                      <Checkbox id="ledesystemForsamling" checked={formData.ledesystemForsamling}
                                        onCheckedChange={(checked) => setFormData({...formData, ledesystemForsamling: checked as boolean})} />
                                      <Label htmlFor="ledesystemForsamling" className="text-xs cursor-pointer leading-relaxed">
                                        I byggverk der forskriften stiller krav om ledesystem vil dette gjelde rømningsveiene, samt fluktveier i større, uoversiktlige brannceller.
                                      </Label>
                                    </div>
                                  )}

                                  {(rk === "RK2" || rk === "RK3" || erRK5) && (
                                    <div className="flex items-start space-x-2">
                                      <Checkbox id="ledesystemKontorSkole" checked={formData.ledesystemKontorSkole}
                                        onCheckedChange={(checked) => setFormData({...formData, ledesystemKontorSkole: checked as boolean})} />
                                      <Label htmlFor="ledesystemKontorSkole" className="text-xs cursor-pointer leading-relaxed">
                                        Kontorbygninger med store kontorlandskap, skoler med store undervisningsbaser og byggverk eller del av byggverk som er offentlig tilgjengelig og ligger under terreng, må ha ledesystem i fluktveier og rømningsveier.
                                      </Label>
                                    </div>
                                  )}

                                  <div className="flex items-start space-x-2">
                                    <Checkbox id="ledesystemStoreBrannceller" checked={formData.ledesystemStoreBrannceller}
                                      onCheckedChange={(checked) => setFormData({...formData, ledesystemStoreBrannceller: checked as boolean})} />
                                    <Label htmlFor="ledesystemStoreBrannceller" className="text-xs cursor-pointer leading-relaxed">
                                      I store brannceller der det ikke er spesielt tilrettelagte fluktveier i branncellen fram til rømningsveiene, må det vurderes om hele branncellen må utstyres med ledesystem tilsvarende som for rømningsveiene. Det kan være nødvendig at ledesystemet omfatter automatisk taleinformasjon.
                                    </Label>
                                  </div>
                                  {formData.ledesystemStoreBrannceller && (
                                    <div className="ml-6 p-3 bg-muted/50 border border-border rounded space-y-2">
                                      <Label className="text-xs font-medium block">Beskriv hvilke brannceller det gjelder og forholdet:</Label>
                                      <Textarea
                                        value={formData.ledesystemStoreBranncellerBeskrivelse || ""}
                                        onChange={(e) => setFormData({...formData, ledesystemStoreBranncellerBeskrivelse: e.target.value})}
                                        placeholder="F.eks. branncelle for lager i 1. etasje (ca. 800 m²) uten tilrettelagte fluktveier..."
                                        className="text-xs min-h-[80px]"
                                      />
                                    </div>
                                  )}

                                  {(brannklasse === "BKL1" || brannklasse === "-") && (
                                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-2 rounded">
                                      Ledesystem i byggverk i brannklasse 1 må fungere i den tiden som er nødvendig for rømning og redning, og i minst 30 minutter etter utløst brannalarm eller bortfall av kunstig belysning (strømbrudd).
                                    </p>
                                  )}

                                  {(brannklasse === "BKL2" || brannklasse === "BKL3") && (
                                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-2 rounded">
                                      Ledesystem i byggverk i brannklasse 2 og 3 må fungere i den tiden som er nødvendig for rømning og redning, og i minst 60 minutter etter utløst brannalarm eller bortfall av kunstig belysning (strømbrudd).
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

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
                        {!formData.tilretteleggingLedd4 && erEvakueringsplanPaakrevd && (
                          <div className="ml-6 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                            <p className="text-xs font-semibold text-destructive">
                              ⚠️ Fravik: Evakueringsplaner er påkrevd for {formData.risikoklasse === "RK2" ? "arbeidsbygninger/kontorer (RK2)" : formData.risikoklasse === "RK3" ? "skoler og barnehager (RK3)" : formData.risikoklasse === "RK5" ? "overnattingssteder og publikumsbygg (RK5)" : "pleie- og sykehusbygg (RK6)"} (jf. TEK17 § 11-14, fjerde ledd). Ved å fjerne dette kravet må det dokumenteres som et fravik fra preaksepterte ytelser.
                            </p>
                          </div>
                        )}

                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="tilretteleggingLedd5" 
                            checked={formData.tilretteleggingLedd5}
                            onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd5: checked as boolean, ...(!checked ? { tilretteleggingLedd5EnBruksenhet: false, tilretteleggingLedd5EnBruksenhetBeskrivelse: "" } : {})})}
                          />
                          <Label htmlFor="tilretteleggingLedd5" className="text-xs cursor-pointer leading-relaxed">
                            <strong>Merking av installasjoner:</strong> Plasseringen av branntekniske installasjoner som har betydning for rømnings- og redningsinnsatsen skal være tydelig merket.
                          </Label>
                        </div>
                        {formData.tilretteleggingLedd5 && (
                          <div className="ml-6 space-y-2 p-3 border border-border rounded-lg bg-card">
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="tilretteleggingLedd5EnBruksenhet" 
                                checked={formData.tilretteleggingLedd5EnBruksenhet}
                                onCheckedChange={(checked) => setFormData({...formData, tilretteleggingLedd5EnBruksenhet: checked as boolean, ...(!checked ? { tilretteleggingLedd5EnBruksenhetBeskrivelse: "" } : {})})}
                              />
                              <Label htmlFor="tilretteleggingLedd5EnBruksenhet" className="text-xs cursor-pointer leading-relaxed">
                                Installasjonene er bare beregnet for personer i én bruksenhet og personene må forventes å være godt kjent med plasseringen.
                              </Label>
                            </div>
                            {formData.tilretteleggingLedd5EnBruksenhet && (
                              <div className="ml-6">
                                <Label className="text-xs font-medium mb-1 block">Beskriv forholdet</Label>
                                <Textarea 
                                  value={formData.tilretteleggingLedd5EnBruksenhetBeskrivelse}
                                  onChange={(e) => setFormData({...formData, tilretteleggingLedd5EnBruksenhetBeskrivelse: e.target.value})}
                                  placeholder="Beskriv hvilke installasjoner og bruksenheter dette gjelder..."
                                  className="text-xs min-h-[60px]"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      </>)}

                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {(formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && <li>Krav til automatisk slokkeanlegg basert på risikoklasse</li>}
                          {formData.tilretteleggingLedd2a && <li>Brannalarmanlegg med automatisk beregnet kategori</li>}
                          {formData.alarmValg === "roykvarsler" && <li>Seriekoblede røykvarslere med batteribackup</li>}
                          <li>Alarmkrav tilpasset bygningstype og risikoklasse</li>
                          <li>Ledesystem og nødlys basert på risikoklasse</li>
                        </ul>
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
                    {renderTilstandPanel("3_9")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-10" label={`3.10 ${formData.regelverk === "BF85" ? "Utgang fra branncelle (§ 11-13)" : "§ 11-13 Utgang fra branncelle"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.10 § 11-13 Utgang fra branncelle</Label>
                      </div>
                      {((formData.risikoklasse === "RK4" && parseInt(formData.etasjer) >= 2 && parseInt(formData.etasjer) <= 8) || 
                        formData.bygningsdeler.some(b => b.risikoklasse === "RK4" && parseInt(b.etasjer) >= 2 && parseInt(b.etasjer) <= 8)) && (
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Checkbox 
                            id="boenhetKunEttTrapperom"
                            checked={formData.boenhetKunEttTrapperom}
                            onCheckedChange={(checked) => setFormData({...formData, boenhetKunEttTrapperom: checked as boolean})}
                          />
                          <Label htmlFor="boenhetKunEttTrapperom" className="text-sm cursor-pointer">
                            Leiligheter har kun tilgang til ett trapperom
                          </Label>
                        </div>
                        )}

                      {/* Lavt byggverk - én rømningsretning §11-13(4) */}
                      {(() => {
                        const rks = ["RK1", "RK2", "RK3", "RK4"];
                        const isLavt = rks.includes(formData.risikoklasse) || formData.bygningsdeler.some(b => rks.includes(b.risikoklasse));
                        if (!isLavt) return null;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                              <Checkbox 
                                id="lavtByggverkEnRomningsretning"
                                checked={formData.lavtByggverkEnRomningsretning}
                                onCheckedChange={(checked) => setFormData({...formData, lavtByggverkEnRomningsretning: checked as boolean})}
                              />
                              <Label htmlFor="lavtByggverkEnRomningsretning" className="text-sm cursor-pointer">
                                Lavt byggverk (under 9 m til møne) – én rømningsretning
                              </Label>
                            </div>
                            {formData.lavtByggverkEnRomningsretning && (
                              <Alert className="ml-6 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertTitle className="text-orange-800 dark:text-orange-300 text-xs font-semibold">Krav til rømningsvindu</AlertTitle>
                                <AlertDescription className="text-orange-700 dark:text-orange-400 text-xs">
                                  Preaksepterte ytelser angitt for rømningsvindu under tredje ledd, må være oppfylt. Hver branncelle må ha vinduer som er utformet og tilrettelagt for sikker rømning.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        );
                      })()}


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
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="branncelleStortAntallPersoner"
                            checked={formData.branncelleStortAntallPersoner}
                            onCheckedChange={(checked) => setFormData({...formData, branncelleStortAntallPersoner: checked as boolean})}
                          />
                          <Label htmlFor="branncelleStortAntallPersoner" className="text-sm cursor-pointer font-medium">
                            Brannceller for stort antall personer er relevant
                          </Label>
                        </div>
                        {formData.branncelleStortAntallPersoner && (
                          <div className="mt-3 ml-6 space-y-3 p-3 border-l-2 border-primary/30 bg-muted/50 rounded">
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
                                      <SelectItem value="barnehager">Barnehager/fritidshjem (4-5 m²/pers)</SelectItem>
                                      <SelectItem value="forsamlingslokaler">Forsamlingslokaler uten faste sitteplasser (0,6 m²/pers)</SelectItem>
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
                                      barnehager: 4.5,
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
                                  Minst én utgang per 300 personer
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="stortAntallOver600"
                                  checked={formData.stortAntallOver600}
                                  onCheckedChange={(checked) => setFormData({...formData, stortAntallOver600: checked as boolean})}
                                />
                                <Label htmlFor="stortAntallOver600" className="text-sm cursor-pointer">
                                  Inntil 600 personer (minst to utganger)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="stortAntallUnder150"
                                  checked={formData.stortAntallUnder150}
                                  onCheckedChange={(checked) => setFormData({...formData, stortAntallUnder150: checked as boolean})}
                                />
                                <Label htmlFor="stortAntallUnder150" className="text-sm cursor-pointer">
                                  Mindre enn 150 personer (én utgang til sikkert sted)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="stortAntallFlereEtasjer"
                                  checked={formData.stortAntallFlereEtasjer}
                                  onCheckedChange={(checked) => setFormData({...formData, stortAntallFlereEtasjer: checked as boolean})}
                                />
                                <Label htmlFor="stortAntallFlereEtasjer" className="text-sm cursor-pointer">
                                  Åpen forbindelse over flere etasjer / mellometasje
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sporadisk personopphold */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Checkbox 
                            id="sporadiskOpphold"
                            checked={formData.sporadiskOpphold}
                            onCheckedChange={(checked) => setFormData({...formData, sporadiskOpphold: checked as boolean})}
                          />
                          <Label htmlFor="sporadiskOpphold" className="text-sm cursor-pointer">
                            Rom for sporadisk personopphold er relevant
                          </Label>
                        </div>
                      </div>

                      {/* Bekreftelse dørkrav */}
                      {(() => {
                        const rk = formData.risikoklasse || "";
                        const bk = formData.brannklasse || "";
                        const harRK5 = rk === "RK5" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK5");
                        const bredde = harRK5 ? "1,16 m (RK5)" : "0,86 m";
                        const strøm = bk === "BKL1" ? "30 min (BKL1)" : (bk === "BKL2" || bk === "BKL3") ? `60 min (${bk})` : null;
                        return (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-xs text-muted-foreground space-y-2">
                            <p className="font-medium text-foreground text-sm">✓ Dørkrav til rømningsvei inkludert i rapporten</p>
                            <p>Fri bredde: minimum {bredde}</p>
                            <p>Fri høyde: minimum 2,0 m</p>
                            <p>Åpningskraft: maks 67 N</p>
                            {strøm && <p>Avbruddsfri strømforsyning: minst {strøm}</p>}
                            <div className="pt-2 border-t border-primary/10 space-y-1">
                              <p className="font-medium text-foreground text-xs">Valgfrie krav:</p>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="dorerTilbakerømning" checked={formData.dorerTilbakerømning} onCheckedChange={(checked) => setFormData({...formData, dorerTilbakerømning: checked as boolean})} />
                                <Label htmlFor="dorerTilbakerømning" className="text-xs cursor-pointer">Låsesystem skal tillate tilbakerømning</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="dorerNattlaser" checked={formData.dorerNattlaser} onCheckedChange={(checked) => setFormData({...formData, dorerNattlaser: checked as boolean})} />
                                <Label htmlFor="dorerNattlaser" className="text-xs cursor-pointer">Nattlåser er relevant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="dorerLiteAntallPersoner" checked={formData.dorerLiteAntallPersoner} onCheckedChange={(checked) => setFormData({...formData, dorerLiteAntallPersoner: checked as boolean})} />
                                <Label htmlFor="dorerLiteAntallPersoner" className="text-xs cursor-pointer">Dør kan slå mot rømningsretning (lite antall personer)</Label>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Utganger beskrives</Label>
                        <Textarea 
                          value={formData.utgangBranncelle}
                          onChange={(e) => setFormData({...formData, utgangBranncelle: e.target.value})}
                         />
                      </div>
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Krav til utgang fra branncelle basert på risikoklasse og brannklasse</li>
                          <li>Antall utganger og avstand til utgang</li>
                          <li>Krav til dører i branncellebegrensende vegger</li>
                          <li>Vinduer som rømningsvei (der relevant)</li>
                        </ul>
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
                    {renderTilstandPanel("3_10")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-11" label={`3.11 ${formData.regelverk === "BF85" ? "Rømningsvei (§ 11-14)" : "§ 11-14 Rømningsvei"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.11 § 11-14 Rømningsvei</Label>
                      </div>

                      {/* Rom i rømningsvei inntil 20 m² */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiRomMaks20"
                          checked={formData.romningsveiRomMaks20}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiRomMaks20: checked === true})}
                        />
                        <Label htmlFor="romningsveiRomMaks20" className="text-xs cursor-pointer">
                          Rom i rømningsvei inntil 20 m² er relevant (resepsjon, vaktrom o.l.)
                        </Label>
                      </div>

                      {/* Oppholdsrom inntil 50 m² */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiRom50E30"
                          checked={formData.romningsveiRom50E30}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiRom50E30: checked === true})}
                        />
                        <Label htmlFor="romningsveiRom50E30" className="text-xs cursor-pointer">
                          Oppholdsrom inntil 50 m² i rømningsvei er relevant
                        </Label>
                      </div>

                      {/* Antall trapper og rømningsretninger */}
                      <div className="p-2 bg-muted/50 rounded space-y-2">
                        <Label className="text-xs font-medium block">Trapper og rømningsretninger</Label>
                        <select
                          className="w-full border rounded px-2 py-1 text-xs bg-background text-foreground"
                          value={formData.romningsveiTrappeValg || ""}
                          onChange={(e) => setFormData({...formData, romningsveiTrappeValg: e.target.value})}
                        >
                          <option value="">Velg...</option>
                          <option value="en_trapp">Tilstrekkelig med én trapp</option>
                          <option value="sammenfallende">Sammenfallende rømningsretning</option>
                          <option value="flere_trapper">Flere trapper og utganger</option>
                        </select>
                      </div>

                      {/* Transport av sengeliggende */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiSengeliggende"
                          checked={formData.romningsveiSengeliggende}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiSengeliggende: checked === true})}
                        />
                        <Label htmlFor="romningsveiSengeliggende" className="text-xs cursor-pointer">
                          Transport av sengeliggende personer er relevant
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

                      {/* Ingen innsnevring */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiIngenInnsnevring"
                          checked={formData.romningsveiIngenInnsnevring}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiIngenInnsnevring: checked === true})}
                        />
                        <Label htmlFor="romningsveiIngenInnsnevring" className="text-xs cursor-pointer">
                          Krav om ingen innsnevring i rømningsvei
                        </Label>
                      </div>

                      {/* Fri bredde i trapp */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiFriBreddeTrapp"
                          checked={formData.romningsveiFriBreddeTrapp}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiFriBreddeTrapp: checked === true})}
                        />
                        <Label htmlFor="romningsveiFriBreddeTrapp" className="text-xs cursor-pointer">
                          Fri bredde i trapp (§ 12-14)
                        </Label>
                      </div>

                      {/* Svalgang/altangang */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiSvalgang"
                          checked={formData.romningsveiSvalgang}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiSvalgang: checked === true})}
                        />
                        <Label htmlFor="romningsveiSvalgang" className="text-xs cursor-pointer">
                          Svalgang/altangang som rømningsvei er relevant
                        </Label>
                      </div>

                      {/* Korridor lengre enn 30 meter */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiKorridorOver30m"
                          checked={formData.romningsveiKorridorOver30m}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiKorridorOver30m: checked === true})}
                        />
                        <Label htmlFor="romningsveiKorridorOver30m" className="text-xs cursor-pointer">
                          Rømningskorridor er lengre enn 30 meter
                        </Label>
                      </div>

                      {/* Panikkbeslag */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Checkbox 
                          id="romningsveiPanikkbeslag"
                          checked={formData.romningsveiPanikkbeslag}
                          onCheckedChange={(checked) => setFormData({...formData, romningsveiPanikkbeslag: checked === true})}
                        />
                        <Label htmlFor="romningsveiPanikkbeslag" className="text-xs cursor-pointer">
                          Krav til panikkbeslag er relevant (RK5/RK6/skoler)
                        </Label>
                      </div>

                      {/* Bekreftelse på automatiske krav inkludert i rapporten */}
                      {(() => {
                        const rk = formData.risikoklasse || "";
                        const harRK3 = rk === "RK3" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK3");
                        const harRK5 = rk === "RK5" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK5");
                        const harRK6 = rk === "RK6" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK6");
                        const erBredRK = harRK3 || harRK5 || harRK6;
                        const bredde = erBredRK ? "1,16 m" : "0,86 m";
                        return (
                          <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                            <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                            <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                              <li>Generelle krav til rømningsvei</li>
                              <li>Fri bredde i rømningsvei: min. {bredde} ({erBredRK ? `RK${[harRK3 && "3", harRK5 && "5", harRK6 && "6"].filter(Boolean).join("/")}` : rk || "RK1/2/4"})</li>
                              <li>Hovedatkomst tilrettelagt for sikker rømning</li>
                              <li>Dørkrav i rømningsvei: fri bredde min. {bredde}, høyde min. 2,0 m, åpningskraft maks 67 N, UPS</li>
                            </ul>
                          </div>
                        );
                      })()}


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
                    {renderTilstandPanel("3_11")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-12" label={`3.12 ${formData.regelverk === "BF85" ? "Redning av husdyr (§ 11-15)" : "§ 11-15 Redning av husdyr"}`}>
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
                      {/* Info om automatiske krav */}
                      {formData.husdyrRedningRelevant && (
                        <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                          <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                          <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                            <li>Krav til rømningsveier for husdyr</li>
                            <li>Branncelleinndeling for husdyrrom</li>
                            <li>Varsling ved brann i driftsbygninger</li>
                          </ul>
                        </div>
                      )}
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
                    {renderTilstandPanel("3_12")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-13" label={`3.13 ${formData.regelverk === "BF85" ? "Manuell slokking (§ 11-16)" : "§ 11-16 Manuell slokking"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.13 § 11-16 Manuell slokking</Label>
                      </div>
                      {(() => {
                        const alleRK = formData.bygningsdeler?.length
                          ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                          : formData.risikoklasse ? [formData.risikoklasse] : [];
                        const isRK356 = alleRK.some((rk: string) => ["RK3","RK5","RK6"].includes(rk));
                        const isRK124 = alleRK.some((rk: string) => ["RK1","RK2","RK4"].includes(rk));
                        
                        const kravTekst = isRK356 
                          ? "Krav: Brannslange (RK 3, 5, 6). Håndslokkeapparater kan benyttes i tillegg."
                          : isRK124
                            ? "Krav: Håndslokkeapparat eller brannslange (RK 1, 2, 4). Du kan også velge brannslange."
                            : "Velg slokkeutstyr for bygget.";
                        
                        return (
                          <>
                            <div className="text-xs text-muted-foreground mb-2">{kravTekst}</div>
                            <div className="flex flex-col gap-2 p-2 bg-muted/50 rounded mb-2">
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="slokkeBrannslange"
                                  checked={formData.slokkeBrannslange}
                                  onCheckedChange={(checked) => setFormData({...formData, slokkeBrannslange: checked === true})}
                                />
                                <Label htmlFor="slokkeBrannslange" className="text-xs cursor-pointer">
                                  Brannslange {isRK356 && "(krav for RK 3, 5, 6)"}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="slokkeHandslukker"
                                  checked={formData.slokkeHandslukker}
                                  onCheckedChange={(checked) => setFormData({...formData, slokkeHandslukker: checked === true})}
                                />
                                <Label htmlFor="slokkeHandslukker" className="text-xs cursor-pointer">
                                  Håndslokkeapparat {isRK124 && "(krav for RK 1, 2, 4)"}
                                </Label>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                      {/* Bekreftelse på automatiske krav */}
                      {(() => {
                        const alleRK = formData.bygningsdeler?.length
                          ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                          : formData.risikoklasse ? [formData.risikoklasse] : [];
                        const harRK356 = alleRK.some((rk: string) => ["RK3","RK5","RK6"].includes(rk));
                        const harRK124 = alleRK.some((rk: string) => ["RK1","RK2","RK4"].includes(rk));
                        const kravListe: string[] = [];
                        
                        // Type utstyr
                        if (harRK356) kravListe.push(`Brannslange (krav for RK ${["RK3","RK5","RK6"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")})`);
                        if (harRK124) kravListe.push(`Håndslokkeapparat (krav for RK ${["RK1","RK2","RK4"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")})`);
                        
                        // Generelle krav som alltid gjelder
                        const generelleKrav: string[] = [
                          "Manuelt slokkeutstyr skal dekke alle rom i bygget",
                          "Slokkeutstyret skal være lett tilgjengelig for bruk i en tidlig fase av brannen",
                          "Plassering skal være tydelig merket med skilt",
                          "Skiltene skal være etterlysende (fotoluminiscerende) eller belyst med nødlys",
                          "Tilvisningsskilt for slokkeutstyr skal stå på tvers av ferdselsretningen",
                          "For materiell som krever bruksanvisning, skal denne finnes på eller ved materiellet"
                        ];
                        
                        // Brannslange-spesifikke krav
                        const brannslangekrav: string[] = [];
                        if (formData.slokkeBrannslange) {
                          brannslangekrav.push("Brannslange maks 30 meter ved fullt uttrekk");
                          brannslangekrav.push("Brannslangeskap skal ikke plasseres i trapperom");
                          brannslangekrav.push("Ref. NS-EN 671-1:2012 – Slangetromler med formstabil slange");
                        }
                        
                        // Håndslokker-spesifikke krav
                        const handslokkerkrav: string[] = [];
                        if (formData.slokkeHandslukker) {
                          handslokkerkrav.push("Håndslokker min. 6 kg ABC-pulver eller 9 liter skum/vann (NS-EN 3-7)");
                          handslokkerkrav.push(`Dekningsradius normalt 15 m${alleRK.includes("RK1") ? " (kan økes til 25 m for RK1)" : ""}`);
                        }

                        return (
                          <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-2">
                            <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                            
                            {kravListe.length > 0 && (
                              <div>
                                <p className="font-medium text-foreground/90 mb-0.5">Type slokkeutstyr:</p>
                                <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                  {kravListe.map((k, i) => <li key={i}>{k}</li>)}
                                </ul>
                              </div>
                            )}
                            
                            <div>
                              <p className="font-medium text-foreground/90 mb-0.5">Generelle krav:</p>
                              <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                {generelleKrav.map((k, i) => <li key={`g${i}`}>{k}</li>)}
                              </ul>
                            </div>
                            
                            {brannslangekrav.length > 0 && (
                              <div>
                                <p className="font-medium text-foreground/90 mb-0.5">Brannslange-krav:</p>
                                <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                  {brannslangekrav.map((k, i) => <li key={`b${i}`}>{k}</li>)}
                                </ul>
                              </div>
                            )}
                            
                            {handslokkerkrav.length > 0 && (
                              <div>
                                <p className="font-medium text-foreground/90 mb-0.5">Håndslokker-krav:</p>
                                <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                  {handslokkerkrav.map((k, i) => <li key={`h${i}`}>{k}</li>)}
                                </ul>
                              </div>
                            )}
                            
                            <p className="text-foreground/60 mt-1">Du kan endre valgene med knappene ovenfor.</p>
                          </div>
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
                    {renderTilstandPanel("3_13")}
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-14" label={`3.14 ${formData.regelverk === "BF85" ? "Tilrettelegging for slokkemannskap (§ 11-17)" : "§ 11-17 Tilrettelegging for slokkemannskap"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.14 § 11-17 Tilrettelegging for slokkemannskap</Label>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="byggOver23m"
                            checked={formData.byggOver23m}
                            onCheckedChange={(checked) => setFormData({...formData, byggOver23m: checked === true})}
                          />
                          <Label htmlFor="byggOver23m" className="text-sm font-medium">Øverste gulv er høyere enn 23 meter over terreng</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="slangeutlegg50m"
                            checked={formData.slangeutlegg50m}
                            onCheckedChange={(checked) => setFormData({...formData, slangeutlegg50m: checked === true})}
                          />
                          <Label htmlFor="slangeutlegg50m" className="text-sm font-medium">Alle deler av etasje kan nås med maks 50 m slangeutlegg</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="harRadiokommunikasjon"
                            checked={formData.harRadiokommunikasjon}
                            onCheckedChange={(checked) => setFormData({...formData, harRadiokommunikasjon: checked === true})}
                          />
                          <Label htmlFor="harRadiokommunikasjon" className="text-sm font-medium">Krav til radiokommunikasjon for nødetater</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="harUniversalnokkel"
                            checked={formData.harUniversalnokkel}
                            onCheckedChange={(checked) => setFormData({...formData, harUniversalnokkel: checked === true})}
                          />
                          <Label htmlFor="harUniversalnokkel" className="text-sm font-medium">Krav til universalnøkkel / nøkkelskap</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="stortAntallPersonerSlokke"
                            checked={formData.stortAntallPersonerSlokke}
                            onCheckedChange={(checked) => setFormData({...formData, stortAntallPersonerSlokke: checked === true})}
                          />
                          <Label htmlFor="stortAntallPersonerSlokke" className="text-sm font-medium">Stort antall personer – tilgjengelig atkomst for brannvesenet</Label>
                        </div>
                      </div>
                      <div className="mb-3">
                        <Label className="text-xs font-medium mb-1 block">Tilrettelegging for rednings- og slokkemannskap</Label>
                        <Textarea 
                          value={formData.redningsmannskap}
                          onChange={(e) => setFormData({...formData, redningsmannskap: e.target.value})}
                         />
                      </div>
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          <li>Generelle krav til plassering, utforming og merking</li>
                          <li>Kjørbar atkomst til hovedinngang og angrepsvei</li>
                          {formData.romningsvinduRelevant && (
                            <li>Vindu/balkong som rømningsvei – tilgjengelighet for høyderedskap (basert på valg i kap. 3.10)</li>
                          )}
                        </ul>
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
                    {renderTilstandPanel("3_14")}
                    </SectionCollapsible>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 4: Utførelses- og driftsfasen (skjult for tilstandsvurdering) */}
                {documentType !== "tilstandsvurdering" && (
                <AccordionItem value="kap4" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                        Utførelses- og driftsfasen
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap4')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                   <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                     <div className="space-y-2">
                       <Label className="text-xs text-muted-foreground">4.1 Utførelsesfasen</Label>
                       <div>
                         <Label className="text-xs font-medium mb-1 block">Til innkjøpsfasen</Label>
                         <Textarea 
                           value={formData.utfoerelsInnkjop}
                           onChange={(e) => setFormData({...formData, utfoerelsInnkjop: e.target.value})}
                           rows={3}
                         />
                       </div>
                       <div>
                         <Label className="text-xs font-medium mb-1 block">Til utførelsesfasen</Label>
                         <Textarea 
                           value={formData.utfoerelse}
                           onChange={(e) => setFormData({...formData, utfoerelse: e.target.value})}
                           rows={4}
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
                           rows={4}
                         />
                       </div>
                     </div>
                   </AccordionContent>
                </AccordionItem>
                )}

                {/* Kapittel 5: Revisjonshistorikk */}
                <AccordionItem value="kap5" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
                        Revisjonshistorikk
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap5')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                   <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <Label className="text-sm font-medium">Revisjonslogg</Label>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const revisjoner = [...(formData.revisjoner || [])];
                             const nextNum = String(revisjoner.length);
                             revisjoner.push({ nummer: nextNum, dato: new Date().toISOString().split('T')[0], prosjekterende: "", ks: "", kommentar: "" });
                             setFormData({ ...formData, revisjoner });
                           }}
                         >
                           <Plus className="h-3.5 w-3.5 mr-1" /> Legg til revisjon
                         </Button>
                       </div>
                       <div className="border rounded-lg overflow-hidden">
                         <table className="w-full text-xs">
                           <thead>
                             <tr className="bg-muted/50">
                               <th className="px-2 py-1.5 text-left font-medium w-16">Rev.</th>
                               <th className="px-2 py-1.5 text-left font-medium w-28">Dato</th>
                               <th className="px-2 py-1.5 text-left font-medium">Prosjekterende</th>
                               <th className="px-2 py-1.5 text-left font-medium">KS</th>
                               <th className="px-2 py-1.5 text-left font-medium">Kommentar</th>
                               <th className="px-2 py-1.5 w-10"></th>
                             </tr>
                           </thead>
                           <tbody>
                             {(formData.revisjoner || []).map((rev: any, idx: number) => (
                               <tr key={idx} className="border-t">
                                 <td className="px-2 py-1">
                                   <Input className="h-7 text-xs" value={rev.nummer} onChange={(e) => {
                                     const revisjoner = [...formData.revisjoner];
                                     revisjoner[idx] = { ...rev, nummer: e.target.value };
                                     setFormData({ ...formData, revisjoner });
                                   }} />
                                 </td>
                                 <td className="px-2 py-1">
                                   <Input type="date" className="h-7 text-xs" value={rev.dato} onChange={(e) => {
                                     const revisjoner = [...formData.revisjoner];
                                     revisjoner[idx] = { ...rev, dato: e.target.value };
                                     setFormData({ ...formData, revisjoner });
                                   }} />
                                 </td>
                                 <td className="px-2 py-1">
                                   <Input className="h-7 text-xs" value={rev.prosjekterende} onChange={(e) => {
                                     const revisjoner = [...formData.revisjoner];
                                     revisjoner[idx] = { ...rev, prosjekterende: e.target.value };
                                     setFormData({ ...formData, revisjoner });
                                   }} placeholder="Navn/initialer" />
                                 </td>
                                 <td className="px-2 py-1">
                                   <Input className="h-7 text-xs" value={rev.ks} onChange={(e) => {
                                     const revisjoner = [...formData.revisjoner];
                                     revisjoner[idx] = { ...rev, ks: e.target.value };
                                     setFormData({ ...formData, revisjoner });
                                   }} placeholder="Navn/initialer" />
                                 </td>
                                 <td className="px-2 py-1">
                                   <Input className="h-7 text-xs" value={rev.kommentar} onChange={(e) => {
                                     const revisjoner = [...formData.revisjoner];
                                     revisjoner[idx] = { ...rev, kommentar: e.target.value };
                                     setFormData({ ...formData, revisjoner });
                                   }} placeholder="Beskrivelse" />
                                 </td>
                                 <td className="px-2 py-1">
                                   {idx > 0 && (
                                     <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                       const revisjoner = formData.revisjoner.filter((_: any, i: number) => i !== idx);
                                       setFormData({ ...formData, revisjoner });
                                     }}>
                                       <X className="h-3.5 w-3.5" />
                                     </Button>
                                   )}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     </div>
                   </AccordionContent>
                </AccordionItem>

                {/* Kapittel 6: Litteraturhenvisninger */}
                <AccordionItem value="kap6" className="border-2 border-blue-200 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-3">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
                        Litteraturhenvisninger
                      </span>
                    </AccordionTrigger>
                    <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap6')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium">Litteraturhenvisninger (én per linje)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setFormData({...formData, litteratur: genererLitteraturRefs()})}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Oppdater fra konsept
                        </Button>
                      </div>
                      <Textarea 
                        value={formData.litteratur}
                        onChange={(e) => setFormData({...formData, litteratur: e.target.value})}
                        rows={Math.max(6, (formData.litteratur || "").split("\n").length + 1)}
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
                      <CardTitle>{documentType === "tilstandsvurdering" ? "Tilstandsvurdering" : "Generert konsept"}</CardTitle>
                      <CardDescription>
                        Forhåndsvisning av {documentType === "tilstandsvurdering" ? "tilstandsvurderingen" : "brannkonseptet"}
                      </CardDescription>
                    </div>
                    {generatedConcept && canDownload && (
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
