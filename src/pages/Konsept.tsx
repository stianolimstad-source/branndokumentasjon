import React, { useState, useEffect } from "react";
import { getGarasjeKrav } from "@/lib/garasje-krav";
import { getBrensellagringKrav, BrenselType } from "@/lib/brensellagring-krav";
import { bf85BygningstyperListe, getBygningsbrannklasse, BF85Bygningstype, getBaereevneTekstBF85, bf85BrannveggTabellSkole, getBF85BrannveggKravSkole, getBF85BrannveggKravKap34, BF85Tabell3423Tiltak, bf85Tabell3423, getYtterveggBrannmotstandBF85, getRelevantBF85_5xx } from "@/lib/bf85-constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getAktiveRiskKlasser, getFluktveiKrav, getStrengesteFluktvei, getFriBreddeKrav, getStrengesteFriBredde } from "@/lib/fire-concept-constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, ArrowLeft, FileDown, Download, Save, LogIn, X, Plus, AlertTriangle, ChevronDown, ChevronRight, Eye, RefreshCw, Sparkles, Upload, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCanDownload } from "@/hooks/useCanDownload";
import { useIsFullAccess } from "@/hooks/useIsFullAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SendToKSDialog from "@/components/konsept/SendToKSDialog";
import UpdateKSButton from "@/components/konsept/UpdateKSButton";
import KonseptPreview, { getKategorier } from "@/components/konsept/KonseptPreview";
import { UploadConceptDialog } from "@/components/konsept/UploadConceptDialog";
import { buildChapter3Table, setChapter3Theme } from "@/lib/word-export-chapter3";
import TilstandsvurderingPanel, { TilstandData, emptyTilstand } from "@/components/konsept/TilstandsvurderingPanel";
import KraftstasjonTilleggskravCard from "@/components/konsept/KraftstasjonTilleggskravCard";
import FravikForParagraf from "@/components/konsept/FravikForParagraf";
import { useFravikForProsjekt } from "@/hooks/useFravikForProsjekt";

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

// Stabil komponent for §11-9 underseksjoner (A–I). Må defineres på modulnivå
// for å unngå unmount/remount og scroll-hopp ved hver state-endring.
const Kap36SubSection = ({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) => (
  <Collapsible open={open} onOpenChange={onOpenChange} className="border rounded-md bg-card">
    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
      <Label className="text-xs font-semibold cursor-pointer">{title}</Label>
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="p-3 pt-0 space-y-2">{children}</div>
    </CollapsibleContent>
  </Collapsible>
);

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
  "Kraftstasjon": "RK2",
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
  "Trafikkterminal": "RK5",
  "Tribuneanlegg for mer enn 150 personer": "RK5",
  // Risikoklasse 6
  "Arrestlokaler og fengsel": "RK6",
  "Asylmottak og transittmottak": "RK6",
  "Bolig beregnet for personer med behov for heldøgns pleie og omsorg": "RK6",
  "Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger": "RK6",
  "Feriekoloni og leirskole": "RK6",
  "Overnattingssted og hotell": "RK6",
  "Pleieinstitusjon": "RK6",
  "Sykehus og sykehjem": "RK6",
  "Turisthytte og vandrerhjem": "RK6",
};

// Default-tekster for § 11-1 Overordnet brannstrategi
const DEFAULT_OVERORDNET = {
  materialer: "Materialer og produkter velges iht. § 11-9. Branncellebegrensende kledninger benyttes hvor preaksepterte ytelser krever det. Materialer med dokumentert klassifisering iht. NS-EN 13501-1 benyttes konsistent.",
  brannspredning: "Byggverket er delt inn i branncelle og brannseksjoner iht. § 11-7 og § 11-8 for å begrense brannspredning. Brannmotstand for bærende konstruksjoner og skiller er dimensjonert etter brannklasse iht. § 11-4. Brannskiller mot nabobygg er ivaretatt iht. § 11-6.",
  roemning: "Rømningsveier, ledesystem og deteksjon er utformet slik at nødvendig rømningstid er mindre enn tilgjengelig rømningstid. Aktiv brannvarsling (§ 11-12), tydelig merking (§ 11-12, § 11-14) og tilstrekkelig antall utganger (§ 11-13) er ivaretatt.",
  rednings: "Byggverket er tilrettelagt for utvendig og innvendig innsats (§ 11-17). Manuell slokkeinnsats fra personer i byggverket er ivaretatt iht. § 11-16. Tilgjengelighet for brannvesenets kjøretøy og slokkevannsforsyning er dokumentert.",
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
const getBrannklasse = (risikoklasse: string, etasjer: string, harTerrengTilgang: string, areal: string, erRKL6Boligbygning?: boolean): { brannklasse: string; brannklasseUnntak: string | null } => {
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
  if (rk === 6 && floors <= 2 && erRKL6Boligbygning) {
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
const getBaereevneTekst = (brannklasse: string, risikoklasse: string, etasjer: string, toggles?: { trappeloep: boolean; kjeller: boolean; utvendig: boolean }): { tekst: string; anvendteUnntak: string[] } => {
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

  const lines = [
    `Bærende hovedsystem: ${k.hovedsystem}`,
    `Sekundære, bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende: ${k.sekundaer}`,
  ];
  if (toggles?.trappeloep) lines.push(`Trappeløp: ${k.trappeloep}`);
  if (toggles?.kjeller) lines.push(`Bærende bygningsdeler under øverste kjeller: ${k.kjeller}`);
  if (toggles?.utvendig) lines.push(`Utvendig trappeløp, beskyttet mot flammepåvirkning og strålevarme: ${k.utvendig}`);
  const tekst = lines.join('\n');
  
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
  const isFullAccess = useIsFullAccess();
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
  const { fravikList, firstFravikConceptId, hasFravikDokument, refresh: refreshFravik } = useFravikForProsjekt(selectedProjectId);

  // Create project dialog state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", description: "", address: "" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [authorInfo, setAuthorInfo] = useState<{ name: string; company: string } | null>(null);
  const [previewTheme, setPreviewTheme] = useState<{ template: "klassisk" | "moderne" | "minimalistisk"; primaryColor: string; accentColor: string; fontFamily: string; logoUrl: string | null; companyName: string | null } | null>(null);

  // Manuell risikoklasse-dialog (§11-2)
  const [manuellRkOpen, setManuellRkOpen] = useState(false);
  const [manuellRkValg, setManuellRkValg] = useState<string>("");
  const [manuellRkBegrunnelse, setManuellRkBegrunnelse] = useState<string>("");

  // Auto-open create project dialog only for authenticated users when ?new=true
  useEffect(() => {
    if (!authLoading && user && searchParams.get("new") === "true") {
      setIsCreateProjectOpen(true);
    }
  }, [authLoading, user, searchParams]);

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

  // Resolve document theme (group template / personal default) for preview & export
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { resolveDocumentTheme } = await import("@/lib/document-templates");
        const t = await resolveDocumentTheme(selectedProjectId, logoUrl, user?.id);
        if (!cancelled) {
          setPreviewTheme({
            template: t.template,
            primaryColor: t.primaryColor,
            accentColor: t.accentColor,
            fontFamily: t.fontFamily,
            logoUrl: t.logoUrl ?? null,
            companyName: t.companyName ?? null,
          });
        }
      } catch (e) {
        if (!cancelled) setPreviewTheme(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedProjectId, user?.id, logoUrl]);

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
      // Pre-fill prosjektnavn and adresse from the newly created project
      setFormData(prev => ({
        ...prev,
        prosjektnavn: prev.prosjektnavn || newProjectData.name,
        adresse: prev.adresse || newProjectData.address || "",
        tiltaksbeskrivelse: prev.tiltaksbeskrivelse || newProjectData.description || "",
        proRibr: prev.proRibr || authorInfo?.company || "",
      }));
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
    spesifikkBrannenergi: string;
    universellUtforming?: boolean;
  };

  const [allKap3Open, setAllKap3Open] = useState<boolean | undefined>(undefined);

  // §11-9 (kap 3.6) – styrer hvilke underseksjoner A–I som er åpne
  const [kap36Open, setKap36Open] = useState<Record<string, boolean>>({
    B: true, // Innvendige overflater alltid åpen som default
    C: false,
    D: false,
    E: false,
    F: true, // Yttertak alltid åpen
    G: false,
    H: false,
    I: false,
  });

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
    etasjerUnderBakken: "",
    bygningsinfoKommentar: "",
    // SAK10 felter
    tiltakshaver: "",
    ansvarligSoker: "",
    kunde: "",
    proRibr: "",
    kprRibr: "",
    tiltaksklasse: "",
    tiltaksklasseBegrunnelse: "",
    avgrensning: "",
    avgrensningBilde: "" as string,
    avgrensningBildeBreddeProsent: 100,
    gjeldendeRegelverk: "• TEK17 - Forskrift om tekniske krav til byggverk\n• VTEK17 - Veiledning til teknisk forskrift",
    // KS-status
    ksEgenkontrollUtfortAv: "",
    ksSidemannskontrollUtfortAv: "",
    // 2. Grunnlag og forutsetninger
    grunnlagsdokumenter: [] as Array<{navn: string, utarbeidetAv: string, dato: string}>,
    harFlereRisikoklasser: false, // Nytt felt for å aktivere flere risikoklasser
    bekreftetUliktEtasjeantall: false, // Bekreftelse på at ulikt etasjeantall er korrekt
    bygningsdeler: [] as Bygningsdel[], // Array med bygningsdeler med egne risikoklasser
    risikoklasse: "",
    risikoklasseBegrunnelse: "", // Begrunnelse hvis RK er manuelt plassert (§11-2)
    brannklasse: "",
    brannklasseBegrunnelse: "", // Begrunnelse hvis manuelt overstyrt
    brannklasseUnntak: "", // Automatisk unntak-tekst for brannklasse
    brannklasseTabellReferanse: "", // Tabellberegnet BKL når BKL4 er tvunget av §11-3 nr. 8
    saerligKonsekvensBKL4: false, // §11-3 nr. 8 – særlig stor konsekvens, tvinger BKL4
    harTerrengTilgang: "", // "ja" eller "nei" - for unntak RK4
    erRKL6Boligbygning: false, // RKL6: er det boligbygning (unntak BKL1 ved ≤2 etasjer)
    universellUtforming: false, // Om bygget skal være universelt utformet
    baeresystem: "",
    tilleggskrav: "",
    // 2.3 § 11-1 Overordnet brannstrategi
    overordnetMaterialer: DEFAULT_OVERORDNET.materialer,
    overordnetBrannspredning: DEFAULT_OVERORDNET.brannspredning,
    overordnetRoemning: DEFAULT_OVERORDNET.roemning,
    overordnetRednings: DEFAULT_OVERORDNET.rednings,
    // 3. Branntekniske ytelseskrav
    baereevne: "",
    baereevneUnntak: [] as string[],
    baereevneKommentar: "",
    balkongRelevant: false,
    trappeloepRelevant: false,
    kjellerRelevant: false,
    utvendigTrapperRelevant: false,
    eksplosjonRelevant: "", // "relevant" eller "ikke_relevant"
    eksplosjonBeskrivelse: "", // Beskrivelse av rom og type eksplosjonsfare
    eksplosjon: "",
    bygningshoyde: "", // Høyde på bygget i meter
    avstandNabobygg: "", // Avstand til nabobygg i meter
    nabobyggIkkeRelevant: false, // Nabobygg ligger så langt unna at det ikke er relevant
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
    erSykehusPleieinstitusjon: false, // RKL6: krav til vertikal seksjonering for sykehus/sykehjem/pleieinstitusjoner
    manglerSeksjonering: false, // Tilstandsvurdering: brannvegg/seksjoneringsvegg ikke etablert i bygget
    manglerSeksjoneringKommentar: "",
    etablererSeksjoneringLikevel: false, // Tilstandsvurdering: dersom mangler, etableres likevel som tiltak
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
    heissjaktkravTekst: "",
    heissjaktRelevantBF85: undefined as "ja" | "nei" | undefined,
    trapperomKrav: [] as string[],
    trapperomKravTekst: "",
    trapperomIkkeDirekteTilFri: false,
    trapperomBeskrivelse: "",
    interntrappBeskrivelse: "",
    roykKontrollKrav: [] as string[],
    roykKontrollKravTekst: "",
    harOverbygdeGarder: false,
    vertikalBrannspredningRelevant: false,
    vertikalBrannspredningKrav: [] as string[],
    vinduBrannspredningRelevant: false,
    vinduBrannspredningKrav: [] as string[],
    vinduMotRomningsvei: false,
    horisontaltPlasseringer: [] as string[],
    horisontaltParallelleVinduer: [] as { avstand: string }[],
    horisontaltHjorneVinduer: [] as { avstand: string }[],
    branncellerFlerePlanRelevant: false,
    branncellerFlerePlanKrav: [] as string[],
    branncellerFlerePlanOver3: false,
    branncellerFlerePlanAreal: "" as "" | "under800" | "over800",
    garasjeRelevant: false,
    garasjePlassering: "" as "" | "i_tiltaket" | "utenfor_tiltaket",
    garasjeAreal: "" as "" | "under_50" | "50_400" | "over_400",
    garasjeBruksenhet: "" as "" | "samme" | "annen",
    garasjeBF85Krav: [] as string[],
    garasjeKravTekst: "",
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
    ytterkledningDKrav: false, // D-krav på ytterkledning (tiltak for å hindre brannspredning i fasade)
    // §11-9 D. Brennbar isolasjon – alternative måter for anvendelse (veilederen)
    isoTildekketMurStop: false, // Tildekkes/mures/støpes inn
    isoDokumentertIngenSpredning: false, // Dokumentert at den ikke bidrar til brannspredning
    isoTilbakeholdendeLag: false, // Tilstrekkelig tildekkende/branntilbakeholdende lag
    // §11-9 E. Utvendige overflater og kledning
    naboavstandUnder8m: false, // Avstand til nabobygg < 8 m
    // §11-9 F. Yttertak
    tak_broof_t2: true, // Taktekking BROOF(t2) [Ta]
    tak_underlagDokumentert: false, // Underlag for taktekking – brannmotstand dokumentert
    tak_oppbyggingDokumentert: false, // Takoppbygging dokumentert
    // §11-9 G. Brannvegg og vinduer i brannvegg
    brannvegg_vinduerSammeBrannmotstand: false, // Vinduer i brannvegg har samme brannmotstand som vegg
    brannvegg_gjennomfoeringerSikret: false, // Gjennomføringer i brannvegg er sikret
    // §11-9 H. Rør- og kanalisolasjon
    ror_bl_s1d0: false, // BL-s1,d0 i rømningsvei
    ror_a2l_s1d0_flerEtasjer: false, // A2L-s1,d0 i rømningsvei som betjener mer enn én etasje
    // §11-9 I. Småhus – lempninger
    smahus_lempningOverflater: false,
    smahus_lempningKledning: false,
    smahus_lempningTaktekning: false,
    bf85_513: false, // :513 Yttervegger i B-konstruksjon
    bf85_514: false, // :514 Fasademateriale på vegg i A-konstruksjon
    bf85_515: false, // :515 Brennbar isolasjon
    bf85_53: false,  // :53 Nedforet himling
    installasjoner: "",
    installasjonerKommentar: "",
    // Ventilasjonsanlegg
    ventilasjonRelevant: true, // Hovedbryter for om ventilasjon er relevant
    ventKrav5: false, // Storkjøkken EI 30
    ventKrav6: true, // Kjøkken boenheter EI 15
    ventKrav7: false, // Småhus avtrekk
    ventKrav8: false, // Småhus kanal klasse E
    ventKrav9: false, // Brannspjeld seksjoneringsvegg
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
    skilleSpinkletUsprinklet: false, // Skille mellom sprinklet og usprinklet areal med brannseksjonering
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
    takterrasseRelevant: false, // Takterrasse beregnet for personopphold
    tilstrekkeligeUtgangerUtenToTrapperom: false, // Bekreftelse at utganger er tilstrekkelige uten to trapperom
    brannvesenTilgangRK4: true, // For RK4: brannvesenet har tilgang til alle leiligheter
    rk4TrapperomTekst: "", // Redigerbar tekst for RK4 trapperom-krav
    trapperomGarGjennomAlleDeler: false, // Om trapperommene fysisk går gjennom flere bygningsdeler
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
    romningsveiTrappeValg: [] as string[], // én trapp / sammenfallende / flere trapper
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
    // §11-13 / §11-14 prosjektverdier (validering)
    fluktveiLengdeProsjekt: "",
    fluktveiDorTilTrappRK6: "",
    romningsveiLengdeProsjekt: "",
    friBreddeProsjekt: "",
    // Global rapportinnstilling
    inkluderReferansetabeller: false,
    // 3.12 §11-15 Tilrettelegging for redning av husdyr
    husdyrRedningRelevant: false,
    husdyrTyper: [] as string[],
    husdyrRedningKommentar: "",
    manuellSlokking: "",
    manuellSlokkingKommentar: "",
    // Brannslokkeutstyr valg
    slokkeBrannslange: false,
    slokkeHandslukker: false,
    redningsmannskap: "",
    redningsmannskapKommentar: "",
    kjoreveiKrav: "Følgende legges til grunn ved utforming av kjørevei for kjøretøy:\n- Kjørebredde, minst: 4,0 meter\n- Stigningsforhold, maksimalt: 1:8 (12,5 %)\n- Fri kjørehøyde, minst: 4 meter\n- Svingradius, ytterkant vei, minst: 12 meter\n- Akseltrykk, minst: 10 tonn\n- Boggitrykk, minst: 16 tonn",
    oppstillingsplassKrav: "Følgende legges til grunn ved utforming av oppstillingsplasser for høyderedskaper:\n- Bredde på oppstillingsplass, minst: 7 meter\n- Lengde på oppstillingsplass, minst: 12 meter\n- Stigningsforhold på oppstillingsplass, maksimalt: 3,5 %\n- Punktbelastning støtteben: Maks. jordtrykk u/markplate 11,7 kg/cm²",
    byggOver23m: false,
    hoyderedskapRelevant: false,
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
    bf85_39_kontor_brannalarm: false, // BF85 3.9: Risikobasert brannalarm i kontorbygg
    bf85_39_industri_slokkeanlegg: false, // BF85 3.9: Auto. slokkeanlegg i industribygg, åpne flere plan, > 800 m²
    // Tilstandsvurdering 3.9: faktisk installerte anlegg som kan benyttes som kompenserende tiltak
    tilstand_39_brannalarm_installert: false,
    tilstand_39_slokkeanlegg_installert: false,
    tilstand_39_roykventilasjon_installert: false,
    // BF85 §7 Rømningsveg (kap. 3.10 i BF85-tilstandsvurdering)
    bf85_romning_71_generelt: "",
    bf85_romning_72_antall: "",
    bf85_romning_73_bredde: "",
    bf85_romning_74_golvbelegg: "",
    bf85_romning_75_dor: "",
    kraftstasjonUnderFjell: false, // Kraftstasjon under fjell eller under dagen
    // NS 3424 befaringsgrunnlag (tilstandsvurdering)
    ns3424Nivaa: "1" as "1" | "2" | "3",
    befaringsdato: new Date().toISOString().slice(0, 10),
    befaringsdeltakere: "",
    befaringsmetode: "",
    gjennomgaattDokumentasjon: "",
    begrensninger: [] as string[],
    andreBegrensninger: "",
  });

  // Auto-foreslå automatisk slokkeanlegg (BF85 3.9) når branncelle over flere plan > 800 m² er valgt
  useEffect(() => {
    if (formData.regelverk === "BF85"
        && formData.branncellerFlerePlanRelevant
        && formData.branncellerFlerePlanAreal === "over800"
        && !formData.bf85_39_industri_slokkeanlegg) {
      setFormData(prev => ({ ...prev, bf85_39_industri_slokkeanlegg: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.regelverk, formData.branncellerFlerePlanRelevant, formData.branncellerFlerePlanAreal]);

  // §11-9 (kap 3.6) – auto-åpne relevante underseksjoner basert på prosjektdata
  useEffect(() => {
    if (formData.regelverk === "BF85") return;
    const bygType = (formData.bygningstype || "").toLowerCase();
    const etasjerNum = parseInt(formData.etasjer, 10) || 0;
    const erSmahus = (bygType.includes("bolig") || bygType.includes("enebolig") || bygType.includes("rekkehus") || bygType.includes("tomannsbolig")) && etasjerNum > 0 && etasjerNum <= 2;
    const aapneE = formData.brannklasse === "BKL2" || formData.brannklasse === "BKL3" || formData.risikoklasse === "RK6";
    setKap36Open(prev => ({
      ...prev,
      E: prev.E || aapneE,
      I: prev.I || erSmahus,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.regelverk, formData.risikoklasse, formData.brannklasse, formData.bygningstype, formData.etasjer]);


  // Load existing concept if conceptId is provided
  useEffect(() => {
    if (conceptId && user) {
      loadConcept(conceptId);
    }
  }, [conceptId, user]);

  // Pre-fill prosjektnavn and adresse from selected project (only for new concepts)
  useEffect(() => {
    if (selectedProjectId && !conceptId && user) {
      supabase
        .from('projects')
        .select('name, address, description')
        .eq('id', selectedProjectId)
        .single()
        .then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              prosjektnavn: prev.prosjektnavn || data.name || "",
              adresse: prev.adresse || data.address || "",
              tiltaksbeskrivelse: prev.tiltaksbeskrivelse || data.description || "",
              proRibr: prev.proRibr || authorInfo?.company || "",
            }));
          }
        });
    }
  }, [selectedProjectId, conceptId, user, authorInfo]);

  // Automatisk beregning av brannklasse
  const beregnetBrannklasseResult = getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal, formData.erRKL6Boligbygning);
  const garasjeKravErKomplett = formData.garasjeAreal && (formData.garasjeAreal !== "under_50" || formData.garasjeBruksenhet);
  const erBoligForGarasje = (() => {
    const rk = formData.risikoklasse;
    if (rk === "RK4") return true;
    if (rk === "RK6" && formData.erRKL6Boligbygning) return true;
    // Check bygningsdeler for multi-RK buildings
    const harBoligDel = formData.bygningsdeler?.some((d: any) => 
      d.risikoklasse === "RK4" || (d.risikoklasse === "RK6" && formData.erRKL6Boligbygning)
    );
    return !!harBoligDel;
  })();
  const garasjeKravListe = garasjeKravErKomplett
    ? getGarasjeKrav(formData.garasjePlassering, formData.garasjeAreal, formData.garasjeBruksenhet, formData.brannklasse || "", erBoligForGarasje)
    : [];
  const garasjeOriginalTekst = garasjeKravListe.map((k) => `${k.kategori}: ${k.tekst}`).join("\n\n");
 
  // Automatisk beregning av brannklasse – skip i view-modus (data er allerede lagret)
  useEffect(() => {
    if (isViewMode) return;
    if (formData.saerligKonsekvensBKL4) {
      // §11-3 nr. 8: tving BKL4. Behold tabellverdi som referanse.
      setFormData(prev => ({
        ...prev,
        brannklasse: "BKL4",
        brannklasseUnntak: "",
        brannklasseBegrunnelse: "",
        brannklasseTabellReferanse: beregnetBrannklasseResult.brannklasse || prev.brannklasseTabellReferanse,
      }));
      return;
    }
    if (beregnetBrannklasseResult.brannklasse) {
      setFormData(prev => ({
        ...prev, 
        brannklasse: beregnetBrannklasseResult.brannklasse,
        brannklasseUnntak: beregnetBrannklasseResult.brannklasseUnntak || "",
        brannklasseBegrunnelse: "",
        brannklasseTabellReferanse: "",
      }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal, formData.erRKL6Boligbygning, formData.saerligKonsekvensBKL4]);


  // Auto-uncheck BF85 :513/:514/:515 hvis de blir irrelevante for valgt BBK/etasjer
  useEffect(() => {
    if (isViewMode) return;
    if (formData.regelverk !== "BF85") return;
    const rel = getRelevantBF85_5xx(formData.bygningsbrannklasse, formData.etasjer);
    const updates: Record<string, boolean> = {};
    if (!rel.vis513 && formData.bf85_513) updates.bf85_513 = false;
    if (!rel.vis514 && formData.bf85_514) updates.bf85_514 = false;
    if (!rel.vis515 && formData.bf85_515) updates.bf85_515 = false;
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData.regelverk, formData.bygningsbrannklasse, formData.etasjer]);

  // Nullstill "manglerSeksjonering" hvis regelverket ikke lenger krever brannvegg/seksjonering
  useEffect(() => {
    if (isViewMode) return;
    if (documentType !== "tilstandsvurdering") return;
    if (!formData.manglerSeksjonering) return;

    const arealNum = parseFloat(formData.areal) || 0;
    let kravFinnes = false;

    if (formData.regelverk === "BF85") {
      if (formData.bygningstype === "Skole") {
        const etasjer = parseInt(formData.etasjer, 10) || 0;
        const krav = getBF85BrannveggKravSkole(etasjer, arealNum, formData.bygningsbrannklasse);
        if (krav?.krevBrannvegg) kravFinnes = true;
      }
      if (["Industri", "Kraftstasjon", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype)) {
        const brannbelastning = parseFloat(formData.bf85_34_brannbelastning) || 0;
        const tiltak = formData.bf85_34_tiltak || "ingen";
        if (brannbelastning > 0) {
          const krav = getBF85BrannveggKravKap34(arealNum, brannbelastning, tiltak);
          if (krav?.krevBrannvegg) kravFinnes = true;
        }
      }
    } else {
      if (formData.erSykehusPleieinstitusjon) kravFinnes = true;
      if (formData.brannseksjonTiltak && formData.brannseksjonBrannenergi) {
        const g = seksjoneringsGrenser[formData.brannseksjonBrannenergi];
        const maksAreal = g?.[formData.brannseksjonTiltak as keyof typeof g];
        if (maksAreal !== undefined && maksAreal !== Infinity && arealNum > maksAreal) {
          kravFinnes = true;
        }
      }
    }

    if (!kravFinnes) {
      setFormData(prev => ({ ...prev, manglerSeksjonering: false, manglerSeksjoneringKommentar: "", etablererSeksjoneringLikevel: false }));
    }
  }, [
    documentType,
    formData.manglerSeksjonering,
    formData.regelverk,
    formData.bygningstype,
    formData.bygningsbrannklasse,
    formData.etasjer,
    formData.areal,
    formData.bf85_34_brannbelastning,
    formData.bf85_34_tiltak,
    formData.erSykehusPleieinstitusjon,
    formData.brannseksjonTiltak,
    formData.brannseksjonBrannenergi,
  ]);

  // Auto-prefyll tilstandspanel 3_4 når brannvegg/seksjonering mangler og IKKE etableres som tiltak
  useEffect(() => {
    if (isViewMode) return;
    if (documentType !== "tilstandsvurdering") return;
    if (!formData.manglerSeksjonering || formData.etablererSeksjoneringLikevel) return;

    const eksisterende = formData.tilstandsvurderinger?.["3_4"];
    if (eksisterende && (eksisterende.beskrivelse?.trim() || eksisterende.grad)) return;

    const veggOrd = formData.regelverk === "BF85" ? "brannvegg" : "seksjoneringsvegg";
    const ref = formData.regelverk === "BF85" ? "BF85 Kap. 30:6" : "TEK17 § 11-7";
    const tillegg = formData.manglerSeksjoneringKommentar?.trim()
      ? ` ${formData.manglerSeksjoneringKommentar.trim()}`
      : "";
    const beskrivelse = `Bygget mangler påkrevd ${veggOrd} iht. ${ref}. Dette utgjør et fravik fra regelverket.${tillegg}`;

    setFormData(prev => ({
      ...prev,
      tilstandsvurderinger: {
        ...prev.tilstandsvurderinger,
        "3_4": {
          ...(prev.tilstandsvurderinger?.["3_4"] || emptyTilstand()),
          grad: prev.tilstandsvurderinger?.["3_4"]?.grad || "tg3",
          beskrivelse,
        },
      },
    }));
  }, [
    documentType,
    formData.manglerSeksjonering,
    formData.etablererSeksjoneringLikevel,
    formData.regelverk,
    formData.manglerSeksjoneringKommentar,
  ]);

  useEffect(() => {
    if (!formData.garasjeRelevant || !garasjeOriginalTekst) return;

    setFormData((prev) => {
      const currentText = prev.garasjeKravTekst || "";

      if (!currentText) {
        return { ...prev, garasjeKravTekst: garasjeOriginalTekst };
      }

      // Auto-upgrade: if the original text changed (e.g. bolig status, brannklasse)
      // and current text still matches a previous auto-generated version, update it
      if (currentText !== garasjeOriginalTekst) {
        // Check if current text looks like auto-generated (starts with "Brannskille:" or "Mellomrom:")
        const isAutoGenerated = currentText.startsWith("Brannskille:") || currentText.startsWith("Mellomrom:");
        const hasBoligRef = currentText.includes("enebolig") || currentText.includes("boligrom") || currentText.includes("I bolig med garasje");
        const shouldUpdate = isAutoGenerated && (hasBoligRef !== erBoligForGarasje);
        if (shouldUpdate) {
          return { ...prev, garasjeKravTekst: garasjeOriginalTekst };
        }
      }

      return prev;
    });
  }, [
    formData.garasjeRelevant,
    formData.garasjePlassering,
    formData.garasjeAreal,
    formData.garasjeBruksenhet,
    formData.brannklasse,
    garasjeOriginalTekst,
    erBoligForGarasje,
  ]);

  // Automatisk aktivering av ledesystem basert på TEK17 § 11-14
  // Sjekk alle bygningsdeler for RK3/RK5/RK6 og bolig med 3+ etasjer
  const allPartsLedesystem = (() => {
    const parts: { rk: string; etasjer: number }[] = [];
    if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
      formData.bygningsdeler.forEach((d: any) => {
        if (d.risikoklasse) parts.push({ rk: d.risikoklasse, etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer, 10) || 0 });
      });
    }
    if (parts.length === 0) parts.push({ rk: formData.risikoklasse, etasjer: parseInt(formData.etasjer, 10) || 0 });
    return parts;
  })();
  const erBoligMedLedesystemkrav = allPartsLedesystem.some(p => p.rk === "RK4" && p.etasjer >= 3);
  const erSkoleEllerOffentlig = allPartsLedesystem.some(p => ["RK3", "RK5", "RK6"].includes(p.rk));
  const erLedesystemPaakrevd = erBoligMedLedesystemkrav || erSkoleEllerOffentlig;
  
  const ledesystemFravikTekst = erBoligMedLedesystemkrav
    ? "⚠️ Fravik: Ledesystem er påkrevd for boligbygning med flere boenheter i mer enn 2 etasjer (jf. VTEK § 11-14). Ved å fjerne ledesystem må dette dokumenteres som et fravik fra preaksepterte ytelser."
    : erSkoleEllerOffentlig
    ? `⚠️ Fravik: Ledesystem er påkrevd for byggverk i ${allPartsLedesystem.filter(p => ["RK3","RK5","RK6"].includes(p.rk)).map(p => p.rk).join('/')} (jf. TEK17 § 11-14). Ved å fjerne ledesystem må dette dokumenteres som et fravik fra preaksepterte ytelser.`
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
  const erEvakueringsplanPaakrevd = (() => {
    if (["RK5", "RK6"].includes(formData.risikoklasse)) return true;
    const bygningsdeler = Array.isArray(formData.bygningsdeler) ? formData.bygningsdeler : [];
    return bygningsdeler.some((d: any) => ["RK5", "RK6"].includes(d.risikoklasse));
  })();
  
  useEffect(() => {
    if (isViewMode) return;
    if (erEvakueringsplanPaakrevd && !formData.tilretteleggingLedd4) {
      setFormData(prev => ({ ...prev, tilretteleggingLedd4: true }));
    }
  }, [formData.risikoklasse, formData.bygningsdeler]);

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

  // Automatisk aktivering av slokkeanlegg for RK6 og RK4 med heis
  useEffect(() => {
    if (isViewMode) return;
    const alleRK = formData.bygningsdeler?.length
      ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
      : formData.risikoklasse ? [formData.risikoklasse] : [];
    const etasjerNum = parseInt(formData.etasjer || '0', 10);
    const erRK4MedHeis = alleRK.includes("RK4") && etasjerNum > 3;
    const erRK6 = alleRK.includes("RK6");
    
    const updates: any = {};
    if (erRK4MedHeis && !formData.tilretteleggingLedd1a) {
      updates.tilretteleggingLedd1a = true;
    }
    if (erRK6 && !formData.tilretteleggingLedd1b) {
      updates.tilretteleggingLedd1b = true;
    }
    
    // Auto-sett brannseksjonTiltak basert på krav til sprinkler/alarm
    // Sprinkler prioriteres over brannalarm når begge er påkrevd
    const harSprinklerKrav = erRK6 || erRK4MedHeis;
    const rk = formData.risikoklasse;
    const harAlarmKrav = rk && ["RK2","RK3","RK4","RK5","RK6"].includes(rk);
    
    if (harSprinklerKrav && formData.brannseksjonTiltak !== "sprinkler") {
      updates.brannseksjonTiltak = "sprinkler";
    } else if (!harSprinklerKrav && harAlarmKrav && !formData.brannseksjonTiltak) {
      updates.brannseksjonTiltak = "brannalarm";
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData.risikoklasse, formData.etasjer, formData.bygningsdeler]);

  // Automatisk aktivering av brannspjeld i seksjoneringsvegg
  useEffect(() => {
    if (isViewMode) return;
    const seksjoneringPaakrevd = formData.erSykehusPleieinstitusjon || isSeksjoneringRequired(formData.areal, formData.brannseksjonBrannenergi, formData.brannseksjonTiltak);
    if (seksjoneringPaakrevd && !formData.ventKrav9) {
      setFormData(prev => ({ ...prev, ventKrav9: true }));
    } else if (!seksjoneringPaakrevd && formData.ventKrav9) {
      setFormData(prev => ({ ...prev, ventKrav9: false }));
    }
  }, [formData.erSykehusPleieinstitusjon, formData.areal, formData.brannseksjonBrannenergi, formData.brannseksjonTiltak]);

  // Reset trapperom kravtekst when RK or etasjer changes so it regenerates for the correct type
  useEffect(() => {
    if (isViewMode) return;
    if (formData.trapperomKravTekst) {
      setFormData(prev => ({ ...prev, trapperomKravTekst: "" }));
    }
  }, [formData.risikoklasse, formData.etasjer]);

  // Reset røykkontroll-tekst når etasjer endres (punkt 5 filtreres)
  useEffect(() => {
    if (isViewMode) return;
    if (formData.roykKontrollKravTekst && formData.regelverk !== "BF85") {
      setFormData(prev => ({ ...prev, roykKontrollKravTekst: "" }));
    }
  }, [formData.etasjer]);

  // Automatisk aktivering av høyderedskap basert på etasjeantall
  useEffect(() => {
    if (isViewMode) return;
    const etasjer = parseInt(formData.etasjer, 10) || 0;
    if (etasjer > 0 && etasjer <= 8) {
      setFormData(prev => ({ ...prev, hoyderedskapRelevant: true }));
    }
  }, [formData.etasjer]);


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
    if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
      const toggles = { trappeloep: formData.trappeloepRelevant, kjeller: formData.kjellerRelevant, utvendig: formData.utvendigTrapperRelevant };
      const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
      const del1Result = getBaereevneTekst(del1Bkl, formData.risikoklasse, formData.etasjer, toggles);
      
      const sections = [`[Bygningsdel 1 – ${formData.bygningstype || 'Bygningsdel 1'} (${del1Bkl})]\n${del1Result.tekst}`];
      const alleUnntak = [...del1Result.anvendteUnntak];
      
      formData.bygningsdeler.forEach((del: any, i: number) => {
        const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
        const delResult = getBaereevneTekst(delBkl, del.risikoklasse, del.etasjer || formData.etasjer, toggles);
        sections.push(`[Bygningsdel ${i + 2} – ${del.navn || del.bygningstype || `Bygningsdel ${i + 2}`} (${delBkl})]\n${delResult.tekst}`);
        alleUnntak.push(...delResult.anvendteUnntak);
      });
      
      const combined = sections.join('\n\n');
      setFormData(prev => ({
        ...prev,
        baereevne: combined,
        baereevneUnntak: [...new Set(alleUnntak)],
      }));
      return;
    }
    
    const toggles = { trappeloep: formData.trappeloepRelevant, kjeller: formData.kjellerRelevant, utvendig: formData.utvendigTrapperRelevant };
    const result = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer, toggles);
    if (result.tekst) {
      setFormData(prev => ({ 
        ...prev, 
        baereevne: result.tekst,
        baereevneUnntak: result.anvendteUnntak
      }));
    }
  }, [formData.brannklasse, formData.risikoklasse, formData.etasjer, formData.regelverk, formData.bygningsbrannklasse, formData.trappeloepRelevant, formData.kjellerRelevant, formData.utvendigTrapperRelevant, formData.harFlereRisikoklasser, formData.bygningsdeler]);

  // BF85 brannventilasjon: ingen auto-haking. Brukeren bestemmer selv om bygget faktisk har dette.
  // Når etasjer > 2 og kravet ikke er huket av, markeres det som avvik i preview/Word.

  // Beregn automatisk tiltaksklasse for visning – velg høyeste fra alle bygningsdeler
  const autoTiltaksklasse = (() => {
    const tiltaksklasseNum = (tk: string) => parseInt(tk.replace(/\D/g, ''), 10) || 0;
    
    if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
      // Bygningsdel 1
      const effBkl1 = beregnetBrannklasseResult.brannklasse || formData.brannklasse;
      const tk1 = getTiltaksklasse(effBkl1, formData.risikoklasse, formData.prosjekteringsmetode);
      
      // Alle bygningsdeler 2+
      const allTk = [tk1, ...formData.bygningsdeler.map((del: any) => {
        const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
        return getTiltaksklasse(delBkl, del.risikoklasse, formData.prosjekteringsmetode);
      })].filter(Boolean);
      
      // Returner høyeste
      return allTk.reduce((max, tk) => tiltaksklasseNum(tk) > tiltaksklasseNum(max) ? tk : max, allTk[0] || "");
    }
    
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
  }, [formData.brannklasse, formData.risikoklasse, formData.prosjekteringsmetode, beregnetBrannklasseResult.brannklasse, formData.harFlereRisikoklasser, formData.bygningsdeler]);

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

  // Automatisk aktivering av brannalarmanlegg (alle bygg unntatt de som kvalifiserer for røykvarslere)
  useEffect(() => {
    if (isViewMode) return;
    const rk = formData.risikoklasse;
    const areal = parseFloat(formData.areal) || 0;
    const bygningstype = (formData.bygningstype || "").toLowerCase();
    
    // Unntak: bygg som kan bruke røykvarslere i stedet
    const erRK2IndustriLager = rk === "RK2" && areal <= 1200 && 
      (bygningstype.includes("industri") || bygningstype.includes("lager") || bygningstype.includes("kraftstasjon"));
    const erRK2Kontor = rk === "RK2" && areal <= 1200 && bygningstype.includes("kontor");
    const erRK4Bolig = rk === "RK4" && 
      (bygningstype.includes("enebolig") || bygningstype.includes("rekkehus") || 
       bygningstype.includes("kjedehus") || bygningstype.includes("fritidsbolig") ||
       bygningstype.includes("bolig"));
    const erRK5Liten = rk === "RK5" && areal <= 600;
    
    const kanVelgeRoykvarsler = erRK2IndustriLager || erRK2Kontor || erRK4Bolig || erRK5Liten;
    
    // Auto-sett brannalarmanlegg for alle bygg som IKKE kvalifiserer for røykvarslere
    if (!kanVelgeRoykvarsler && rk && ["RK2","RK3","RK4","RK5","RK6"].includes(rk) && !formData.tilretteleggingLedd2a) {
      setFormData(prev => ({ ...prev, tilretteleggingLedd2a: true, alarmValg: "brannalarm" }));
    }
  }, [formData.risikoklasse, formData.areal, formData.bygningstype]);

  // Automatisk aktivering av merking av installasjoner (alltid påkrevd)
  useEffect(() => {
    if (isViewMode) return;
    if (!formData.tilretteleggingLedd5) {
      setFormData(prev => ({ ...prev, tilretteleggingLedd5: true }));
    }
  }, []);


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

  const isBF85Tilstand = documentType === "tilstandsvurdering" && formData.regelverk === "BF85";

  // BF85-tilstand merges 3.10+3.11 into "3.10 Rømningsveg (BF85 §7)" and renumbers 3.12→3.11, 3.13→3.12, 3.14→3.13
  const tilstandSectionsBF85 = [
    ...tilstandSectionsTEK17.slice(0, 9), // 3.1–3.9
    { key: "3_10", label: "3.10 Rømningsveg (BF85 §7)" },
    { key: "3_12", label: "3.11 Redning av husdyr" },
    { key: "3_13", label: "3.12 Manuell slokking" },
    { key: "3_14", label: "3.13 Slokkemannskap" },
  ];

  const tilstandSections = isBF85Tilstand ? tilstandSectionsBF85 : tilstandSectionsTEK17;

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

  const previewLogoUrl = previewTheme?.logoUrl ?? logoUrl;
  const renderPreview = () => <KonseptPreview formData={{...formData, onUpdateField: (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}))}} logoUrl={previewLogoUrl} authorInfo={authorInfo} documentType={documentType} theme={previewTheme} fravikList={fravikList} />;

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

    // Resolve document theme (group / personal default) for branding
    const { resolveDocumentTheme } = await import("@/lib/document-templates");
    const theme = await resolveDocumentTheme(selectedProjectId, logoUrl, user?.id);
    const coverLogoUrl = theme.logoUrl ?? logoUrl;
    // Apply company template accent to chapter-3 section row shading
    setChapter3Theme(theme.accentColor);

    // Fetch logo for header
    let logoBuffer: ArrayBuffer | null = null;
    let logoDimensions = { width: 300, height: 150 };
    if (coverLogoUrl) {
      try {
        const res = await fetch(coverLogoUrl);
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
            img.src = coverLogoUrl;
          });
        }
      } catch {}
    }

    // Load avgrensning image if present
    let avgrensningImageData: { buffer: ArrayBuffer; width: number; height: number } | null = null;
    if (formData.avgrensningBilde) {
      try {
        const res = await fetch(formData.avgrensningBilde);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const maxWidth = 450 * ((formData.avgrensningBildeBreddeProsent || 100) / 100);
              const ratio = img.naturalWidth / img.naturalHeight;
              const w = Math.min(img.naturalWidth, maxWidth);
              avgrensningImageData = { buffer, width: w, height: Math.round(w / ratio) };
              resolve();
            };
            img.onerror = () => resolve();
            img.src = formData.avgrensningBilde;
          });
        }
      } catch {}
    }

    // Build cover page elements
    const coverPageChildren: Paragraph[] = [];
    const tplId = theme.template ?? "klassisk";
    const titleText = documentType === "tilstandsvurdering" ? "Tilstandsvurdering" : "Brannkonsept";

    // Top accent stripe (klassisk only — visual match with preview)
    if (tplId === "klassisk") {
      coverPageChildren.push(new Paragraph({
        spacing: { before: 0, after: 400 },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: theme.primaryColor },
        children: [new TextRun({ text: "", size: 8 })],
      }));
    } else if (tplId === "moderne") {
      // Short accent bar
      coverPageChildren.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 800, after: 300 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: theme.accentColor, space: 1 } },
        children: [new TextRun({ text: "" })],
      }));
    }

    if (logoBuffer) {
      coverPageChildren.push(new Paragraph({
        alignment: tplId === "minimalistisk" ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [new ImageRun({ data: logoBuffer, transformation: logoDimensions, type: "png" })],
        spacing: { before: tplId === "klassisk" ? 400 : 200, after: 400 },
      }));
    }

    coverPageChildren.push(new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: tplId === "minimalistisk" ? AlignmentType.LEFT : (tplId === "moderne" ? AlignmentType.LEFT : AlignmentType.CENTER),
      spacing: { before: logoBuffer ? 200 : 1200, after: 120 },
      children: [new TextRun({
        text: titleText,
        bold: tplId !== "minimalistisk",
        color: theme.primaryColor,
        font: theme.fontFamily,
        size: tplId === "minimalistisk" ? 64 : 56,
      })],
    }));
    // Accent line under title
    coverPageChildren.push(new Paragraph({
      alignment: tplId === "minimalistisk" ? AlignmentType.LEFT : (tplId === "moderne" ? AlignmentType.LEFT : AlignmentType.CENTER),
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: tplId === "minimalistisk" ? 6 : 18, color: theme.accentColor, space: 1 } },
      children: [new TextRun({ text: "" })],
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
            run: { font: theme.fontFamily, size: 20 },
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
              children: [new TextRun({ text: `Denne rapporten er basert på en NS 3424 nivå ${formData.ns3424Nivaa} tilstandsvurdering – ${formData.ns3424Nivaa === "3" ? "fullstendig registrering med destruktive prøver og laboratorieanalyser" : formData.ns3424Nivaa === "2" ? "mer omfattende registrering, kan inkludere åpning av enkelte konstruksjoner" : "visuell registrering og enkel vurdering av synlige bygningsdeler"}.`, size: 20 })],
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
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [new TextRun({
                text: documentType === "tilstandsvurdering" ? "TILSTANDSVURDERING" : "BRANNKONSEPT",
                bold: true,
                color: theme.primaryColor,
                font: theme.fontFamily,
              })],
            }),

            // Innholdsfortegnelse
            new Paragraph({
              children: [new TextRun({ text: "Innholdsfortegnelse", bold: true, size: 28 })],
              spacing: { before: 200, after: 200 },
            }),
            ...(documentType === "tilstandsvurdering" ? [
              new Paragraph({ children: [new TextRun({ text: "1. Innledning", bold: true, size: 22 })], spacing: { after: 50 } }),
              new Paragraph({ text: "    1.1 Informasjon om tiltaket", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.2 Befarings- og analysegrunnlag", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.3 Avgrensning av vurderingen", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.3 Kvalitetssikring (KS)", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.3 Bygningsinformasjon", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.4 Grunnlagsdokumenter", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.5 Tilleggskrav", spacing: { after: 50 } }),
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
              new Paragraph({ text: "    1.5 Gjeldende regelverk", spacing: { after: 30 } }),
              new Paragraph({ text: "    1.6 Kvalitetssikring (KS)", spacing: { after: 50 } }),
              new Paragraph({ children: [new TextRun({ text: "2. Grunnlag og forutsetninger for brannteknisk prosjektering", bold: true, size: 22 })], spacing: { after: 50 } }),
              new Paragraph({ text: "    2.1 Grunnlagsdokumenter", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.2 Beskrivelse av bygning og branntekniske forutsetninger", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.3 § 11-1 Overordnet brannstrategi", spacing: { after: 30 } }),
              new Paragraph({ text: "    2.4 Tilleggskrav fra tiltakshaver, myndigheter eller bruker", spacing: { after: 50 } }),
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
              ...(isBF85Tilstand
                ? [
                    new Paragraph({ text: "    3.10 Rømningsveg (BF85 §7)", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.11 Tilrettelegging for redning av husdyr", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.12 Tilrettelegging for manuell slokking", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.13 Tilrettelegging for rednings- og slokkemannskap", spacing: { after: 50 } }),
                  ]
                : [
                    new Paragraph({ text: "    3.10 § 11-13 Utgang fra branncelle", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.11 § 11-14 Rømningsvei", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.12 § 11-15 Tilrettelegging for redning av husdyr", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.13 § 11-16 Tilrettelegging for manuell slokking", spacing: { after: 30 } }),
                    new Paragraph({ text: "    3.14 § 11-17 Tilrettelegging for rednings- og slokkemannskap", spacing: { after: 50 } }),
                  ]),
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
              ...(avgrensningImageData ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new ImageRun({ data: avgrensningImageData.buffer, transformation: { width: avgrensningImageData.width, height: avgrensningImageData.height }, type: "png" })],
                  spacing: { after: 50 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Figur: Tiltaksavgrensning", italics: true, size: 18 })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                }),
              ] : []),
              new Paragraph({
                children: [new TextRun({ text: "1.5 Gjeldende regelverk", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              ...(formData.gjeldendeRegelverk || "• TEK17 - Forskrift om tekniske krav til byggverk\n• VTEK17 - Veiledning til teknisk forskrift").split('\n').filter((l: string) => l.trim()).map((line: string) =>
                new Paragraph({ text: line, spacing: { after: 50 } })
              ),
              new Paragraph({
                children: [new TextRun({ text: "1.6 Kvalitetssikring (KS)", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCell("Type", true, 50),
                      createTableCell("Utført av", true, 50),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Egenkontroll", true, 50),
                      createTableCell(formData.ksEgenkontrollUtfortAv || "[Angis]"),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Sidemannskontroll", true, 50),
                      createTableCell(formData.ksSidemannskontrollUtfortAv || "[Angis]"),
                    ],
                  }),
                ],
              }),
            ] : [
              // Tilstandsvurdering: 1.2 Befarings- og analysegrunnlag
              new Paragraph({
                children: [new TextRun({ text: "1.2 Befarings- og analysegrunnlag", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [createTableCell("Befaringsdato", true, 33), createTableCell(formData.befaringsdato || "[Ikke angitt]")] }),
                  new TableRow({ children: [createTableCell("Befaringsdeltakere", true, 33), createTableCell(formData.befaringsdeltakere || "[Ikke angitt]")] }),
                  new TableRow({ children: [createTableCell("NS 3424-nivå", true, 33), createTableCell(`Nivå ${formData.ns3424Nivaa} – ${formData.ns3424Nivaa === "3" ? "Fullstendig registrering med destruktive prøver og laboratorieanalyser" : formData.ns3424Nivaa === "2" ? "Mer omfattende registrering, kan inkludere åpning av enkelte konstruksjoner" : "Visuell registrering, enkel vurdering av synlige bygningsdeler"}`)] }),
                  new TableRow({ children: [createTableCell("Befaringsmetode og omfang", true, 33), createTableCell(formData.befaringsmetode || "[Ikke angitt]")] }),
                  new TableRow({ children: [createTableCell("Dokumentasjon gjennomgått", true, 33), createTableCell(formData.gjennomgaattDokumentasjon || "[Ikke angitt]")] }),
                ],
              }),
              ...((formData.begrensninger && formData.begrensninger.length > 0) || formData.andreBegrensninger ? [
                new Paragraph({
                  children: [new TextRun({ text: "Begrensninger i vurderingen", bold: true, size: 22 })],
                  spacing: { before: 200, after: 100 },
                }),
                ...(formData.begrensninger || []).map((b: string) => new Paragraph({
                  text: b,
                  bullet: { level: 0 },
                  spacing: { after: 50 },
                })),
                ...(formData.andreBegrensninger ? [new Paragraph({
                  text: formData.andreBegrensninger,
                  bullet: { level: 0 },
                  spacing: { after: 50 },
                })] : []),
              ] : []),
              // 1.3 Avgrensning
              new Paragraph({
                children: [new TextRun({ text: "1.3 Avgrensning av vurderingen", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: formData.avgrensning || "[Avgrensning beskrives]",
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "1.3 Kvalitetssikring (KS)", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCell("Type", true, 50),
                      createTableCell("Utført av", true, 50),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Egenkontroll", true, 50),
                      createTableCell(formData.ksEgenkontrollUtfortAv || "[Angis]"),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createTableCell("Sidemannskontroll", true, 50),
                      createTableCell(formData.ksSidemannskontrollUtfortAv || "[Angis]"),
                    ],
                  }),
                ],
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
                  new TableRow({ children: [createTableCell("Antall etasjer (totalt)", true, 33), createTableCell(formData.etasjer || "[Angis]")] }),
                  ...(formData.etasjerUnderBakken && parseInt(formData.etasjerUnderBakken, 10) > 0 ? [new TableRow({ children: [createTableCell("Hvorav under bakken", true, 33), createTableCell(formData.etasjerUnderBakken)] })] : []),
                  new TableRow({ children: [createTableCell("Spesifikk brannenergi", true, 33), createTableCell(formData.brannseksjonBrannenergi === "over400" ? "Over 400 MJ/m²" : formData.brannseksjonBrannenergi === "50-400" ? "50–400 MJ/m²" : formData.brannseksjonBrannenergi === "under50" ? "Under 50 MJ/m²" : "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Risikoklasse", true, 33), createTableCell(formData.risikoklasse || "[Angis]")] }),
                  new TableRow({ children: [createTableCell("Brannklasse", true, 33), createTableCell(formData.brannklasse || "[Angis]")] }),
                ],
              }),
              ...(formData.bygningsinfoKommentar ? [new Paragraph({ children: [new TextRun({ text: formData.bygningsinfoKommentar, size: 20 })], spacing: { before: 100, after: 100 } })] : []),
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
                children: [new TextRun({ text: "1.5 Tilleggskrav", bold: true, size: 24 })],
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
                    new TableRow({ children: [createTableCell("Antall etasjer (totalt)", true, 33), createTableCell(formData.etasjer || "[Angis]")] }),
                    ...(formData.etasjerUnderBakken && parseInt(formData.etasjerUnderBakken, 10) > 0 ? [new TableRow({ children: [createTableCell("Hvorav under bakken", true, 33), createTableCell(formData.etasjerUnderBakken)] })] : []),
                    new TableRow({ children: [createTableCell("Spesifikk brannenergi", true, 33), createTableCell(formData.brannseksjonBrannenergi === "over400" ? "Over 400 MJ/m²" : formData.brannseksjonBrannenergi === "50-400" ? "50–400 MJ/m²" : formData.brannseksjonBrannenergi === "under50" ? "Under 50 MJ/m²" : "[Angis]")] }),
                  ],
                }),
                ...(formData.bygningsinfoKommentar ? [new Paragraph({ children: [new TextRun({ text: formData.bygningsinfoKommentar, size: 20 })], spacing: { before: 100, after: 100 } })] : []),
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
                    new TableRow({ children: [createTableCell("Antall etasjer (totalt)", true, 33), createTableCell(formData.etasjer || "[Angis]")] }),
                    ...(formData.etasjerUnderBakken && parseInt(formData.etasjerUnderBakken, 10) > 0 ? [new TableRow({ children: [createTableCell("Hvorav under bakken", true, 33), createTableCell(formData.etasjerUnderBakken)] })] : []),
                    new TableRow({ children: [createTableCell("Spesifikk brannenergi", true, 33), createTableCell(formData.brannseksjonBrannenergi === "over400" ? "Over 400 MJ/m²" : formData.brannseksjonBrannenergi === "50-400" ? "50–400 MJ/m²" : formData.brannseksjonBrannenergi === "under50" ? "Under 50 MJ/m²" : "[Angis]")] }),
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
                ...(formData.bygningsinfoKommentar ? [new Paragraph({ children: [new TextRun({ text: formData.bygningsinfoKommentar, size: 20 })], spacing: { before: 100, after: 100 } })] : []),
              ]),
              new Paragraph({
                children: [new TextRun({ text: "2.3 § 11-1 Overordnet brannstrategi", bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "Iht. § 11-1 skal byggverket prosjekteres slik at det oppnås tilfredsstillende sikkerhet ved brann. Følgende fire pilarer er ivaretatt på overordnet nivå:", italics: true, size: 20 })],
                spacing: { after: 100 },
              }),
              ...[
                { title: "a. Materialer og produkter", value: formData.overordnetMaterialer || DEFAULT_OVERORDNET.materialer },
                { title: "b. Bygnings- og installasjonsdeler – begrensning av brannspredning", value: formData.overordnetBrannspredning || DEFAULT_OVERORDNET.brannspredning },
                { title: "c. Rask og sikker rømning", value: formData.overordnetRoemning || DEFAULT_OVERORDNET.roemning },
                { title: "d. Rednings- og slokkeinnsats", value: formData.overordnetRednings || DEFAULT_OVERORDNET.rednings },
              ].flatMap((s) => [
                new Paragraph({
                  children: [new TextRun({ text: s.title, bold: true, size: 22 })],
                  spacing: { before: 120, after: 60 },
                }),
                new Paragraph({ text: s.value, spacing: { after: 80 } }),
              ]),
              new Paragraph({
                children: [new TextRun({ text: "2.4 Tilleggskrav fra tiltakshaver, myndigheter eller bruker", bold: true, size: 24 })],
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
            await buildChapter3Table({ ...formData, _fravikList: fravikList }),
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

            // Oppsummering av avvik (kun tilstandsvurdering)
            ...(documentType === "tilstandsvurdering" ? (() => {
              const tv = formData.tilstandsvurderinger || {};
              const norm = (b: any[]) => (b || []).map((x: any) => (typeof x === "string" ? { url: x, beskrivelse: "" } : x));
              const getKat = (d: any) => {
                if (!d) return { tiltak: { beskrivelse: "", bilder: [] }, fravik: { beskrivelse: "", bilder: [] } };
                const harNye = !!(d.tiltak || d.fravik);
                const harLegacy = !!(d.beskrivelse || (d.bilder && d.bilder.length > 0));
                if (!harNye && harLegacy) {
                  return { tiltak: { beskrivelse: d.beskrivelse || "", bilder: norm(d.bilder) }, fravik: { beskrivelse: "", bilder: [] } };
                }
                return {
                  tiltak: { beskrivelse: d.tiltak?.beskrivelse || "", bilder: norm(d.tiltak?.bilder) },
                  fravik: { beskrivelse: d.fravik?.beskrivelse || "", bilder: norm(d.fravik?.bilder) },
                };
              };
              const gradLabel = (g: string) => ({ tg0: "TG 0", tg1: "TG 1", tg2: "TG 2", tg3: "TG 3", tgiu: "TG IU" } as Record<string, string>)[g] || "—";
              const tiltakRader = tilstandSectionsTEK17
                .map(s => ({ s, k: getKat(tv[s.key]), grad: tv[s.key]?.grad || "" }))
                .filter(({ k }) => !!(k.tiltak.beskrivelse && k.tiltak.beskrivelse.trim()));
              const fravikRader = tilstandSectionsTEK17
                .map(s => ({ s, k: getKat(tv[s.key]), grad: tv[s.key]?.grad || "" }))
                .filter(({ k }) => !!(k.fravik.beskrivelse && k.fravik.beskrivelse.trim()));

              if (tiltakRader.length === 0 && fravikRader.length === 0) return [];

              const buildTabell = (rader: typeof tiltakRader, kind: "tiltak" | "fravik") => new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCellShaded("Kapittel", true, 30),
                      createTableCellShaded("TG", true, 12),
                      createTableCellShaded("Beskrivelse av avvik", true, 58),
                    ],
                  }),
                  ...rader.map(({ s, k, grad }) => new TableRow({
                    children: [
                      createTableCell(s.label, false, 30),
                      createTableCell(gradLabel(grad), false, 12),
                      createTableCell(kind === "tiltak" ? k.tiltak.beskrivelse : k.fravik.beskrivelse, false, 58),
                    ],
                  })),
                ],
              });

              const out: any[] = [
                new Paragraph({
                  children: [new TextRun({ text: "Oppsummering av avvik", bold: true, size: 28 })],
                  spacing: { before: 400, after: 100 },
                }),
                new Paragraph({
                  text: "Samlet oversikt over avvik fra tilstandsvurderingen, fordelt på avvik som krever aktive tiltak og avvik som kan fraviksbehandles.",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Avvik som krever aktive tiltak", bold: true, size: 24, color: "991B1B" })],
                  spacing: { before: 200, after: 100 },
                }),
              ];
              if (tiltakRader.length > 0) {
                out.push(buildTabell(tiltakRader, "tiltak"));
              } else {
                out.push(new Paragraph({ text: "Ingen avvik registrert som krever aktive tiltak.", spacing: { after: 100 } }));
              }
              out.push(new Paragraph({
                children: [new TextRun({ text: "Avvik som kan fraviksbehandles", bold: true, size: 24, color: "92400E" })],
                spacing: { before: 300, after: 100 },
              }));
              if (fravikRader.length > 0) {
                out.push(buildTabell(fravikRader, "fravik"));
              } else {
                out.push(new Paragraph({ text: "Ingen avvik registrert som kan fraviksbehandles.", spacing: { after: 100 } }));
              }
              return out;
            })() : []),

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
                      createTableCellShaded(documentType === "tilstandsvurdering" ? "Utførende" : "Prosjekterende", true, 25),
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

  // Demo-modus: ikke-innloggede brukere kan utforske skjemaet og forhåndsvisning
  // men kan ikke lagre, dele, sende til KS eller laste ned.
  const isDemoMode = !authLoading && !user;

  // Lås kap. 2-6 inntil regelverk er valgt (gjelder kun tilstandsvurdering)
  const regelverkLocked = documentType === "tilstandsvurdering" && !formData.regelverk;

  return (
    <div className="min-h-screen bg-gradient-subtle">

      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto space-y-4">
          {/* Demo-modus banner */}
          {isDemoMode && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
              <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-200">Demo-modus</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                Du er ikke innlogget. Du kan utforske skjemaet og se forhåndsvisning, men kan ikke lagre, dele eller laste ned dokumentet.{" "}
                <Link to="/auth" className="font-semibold underline hover:no-underline">Logg inn</Link> for full tilgang.
              </AlertDescription>
            </Alert>
          )}
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

          {/* Manuell risikoklasse-dialog (§11-2) */}
          <Dialog open={manuellRkOpen} onOpenChange={setManuellRkOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manuell plassering i risikoklasse (§11-2)</DialogTitle>
                <DialogDescription>
                  Bruk denne dialogen når byggverket ikke finnes i listen og må plasseres etter begrunnet vurdering iht. TEK17 §11-2 preakseptert ytelse nr. 2.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                  <p className="text-xs font-semibold text-blue-800">Hjelp til vurdering – §11-2 kriteriespørsmål:</p>
                  <ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
                    <li>Er personopphold i byggverket kun sporadisk?</li>
                    <li>Forutsettes det at personene kjenner rømningsforholdene?</li>
                    <li>Er byggverket beregnet for overnatting?</li>
                    <li>Er det forutsatt at byggverket har liten brannenergi eller liten brannfare?</li>
                  </ul>
                  <p className="text-xs text-blue-600 italic">
                    Svarene på disse spørsmålene styrer plasseringen i RK1–RK6. Bruk dem som støtte for begrunnelsen under.
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1 block">Velg risikoklasse</Label>
                  <Select value={manuellRkValg} onValueChange={setManuellRkValg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg RK1–RK6" />
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
                  <Label className="text-sm font-medium mb-1 block">Begrunnelse for valg</Label>
                  <Textarea
                    value={manuellRkBegrunnelse}
                    onChange={(e) => setManuellRkBegrunnelse(e.target.value)}
                    placeholder="Beskriv hvorfor byggverket plasseres i valgt risikoklasse, basert på kriteriespørsmålene over."
                    rows={5}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setManuellRkOpen(false)}>Avbryt</Button>
                <Button
                  onClick={() => {
                    if (!manuellRkValg || !manuellRkBegrunnelse.trim()) return;
                    setFormData({
                      ...formData,
                      risikoklasse: manuellRkValg,
                      risikoklasseBegrunnelse: manuellRkBegrunnelse.trim(),
                    });
                    setManuellRkOpen(false);
                  }}
                  disabled={!manuellRkValg || !manuellRkBegrunnelse.trim()}
                >
                  Lagre
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

                      {!conceptId && !isDemoMode && (
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
                          const adresse = formData.adresse ? ` (${formData.adresse})` : "";
                          const areal = formData.areal ? ` og et samlet bruksareal på ca. ${formData.areal} m²` : "";

                          const aktiveTiltak: string[] = [];
                          if (formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b || formData.tilretteleggingLedd1c) aktiveTiltak.push("automatisk slokkeanlegg");
                          if (formData.tilretteleggingLedd2a || formData.alarmValg === "brannalarm" || formData.brannseksjonTiltak === "brannalarm") aktiveTiltak.push("brannalarmanlegg");
                          if (formData.tilretteleggingLedd2b || formData.alarmValg === "roykvarsler") aktiveTiltak.push("røykvarslere");
                          if (formData.brannalarmTalevarsling) aktiveTiltak.push("talevarsling");
                          if (formData.tilretteleggingLedd3) aktiveTiltak.push("ledesystem");

                          let tekst = "";

                          if (documentType === "tilstandsvurdering") {
                            // Tilstandsvurdering – innledning
                            tekst = `${firma} er engasjert av ${oppdragsgiver} for å utføre brannteknisk tilstandsvurdering av ${prosjekt}${adresse}. `;
                            tekst += `Bygget er et ${bygningstype.toLowerCase()} med ${etasjer} tellende etasje${etasjer === "1" ? "" : "r"}${areal}. `;

                            if (formData.regelverk === "BF85") {
                              const bbk = formData.bygningsbrannklasse
                                ? `bygningsbrannklasse ${formData.bygningsbrannklasse}`
                                : "[bygningsbrannklasse ikke fastsatt]";
                              tekst += `Bygget er oppført etter Byggeforskrift 1985 (BF85) og er klassifisert som ${bbk}. `;
                              tekst += `Vurderingen er gjort opp mot kravene i BF85, da dette var gjeldende regelverk på oppføringstidspunktet.`;
                            } else {
                              const rk = formData.harFlereRisikoklasser
                                ? formData.bygningsdeler.map(d => d.risikoklasse).filter(Boolean).join(", ")
                                : formData.risikoklasse || "[risikoklasse]";
                              const bkl = formData.harFlereRisikoklasser
                                ? formData.bygningsdeler.map(d => d.brannklasse || getBrannklasse(d.risikoklasse, d.etasjer, d.harTerrengTilgang, d.areal).brannklasse).filter(Boolean).join(", ")
                                : formData.brannklasse || "[brannklasse]";
                              tekst += `Bygget er klassifisert i risikoklasse ${rk} og brannklasse ${bkl}, vurdert opp mot kravene i TEK17/VTEK.`;
                            }

                            tekst += `\n\nVurderingen er basert på befaring av bygget og gjennomgang av tilgjengelig dokumentasjon. Avvik fra gjeldende regelverk er beskrevet og tilstandsgradert i kapittel 3, og oppsummert i tabell over registrerte tiltak og fravik.`;

                            if (aktiveTiltak.length > 0) {
                              const punkter = aktiveTiltak
                                .map(t => `- ${t.charAt(0).toUpperCase()}${t.slice(1)}`)
                                .join("\n");
                              tekst += `\n\nFølgende aktive branntekniske tiltak er registrert i bygget:\n${punkter}`;
                            }

                            tekst += `\n\nRapporten gir et øyeblikksbilde av byggets branntekniske tilstand på befaringstidspunktet, og er ment som beslutningsgrunnlag for eier ved planlegging av utbedringstiltak og videre drift.`;
                          } else {
                            // Brannkonsept – uendret tekst
                            const rk = formData.harFlereRisikoklasser
                              ? formData.bygningsdeler.map(d => d.risikoklasse).filter(Boolean).join(", ")
                              : formData.risikoklasse || "[risikoklasse]";
                            const bkl = formData.harFlereRisikoklasser
                              ? formData.bygningsdeler.map(d => d.brannklasse || getBrannklasse(d.risikoklasse, d.etasjer, d.harTerrengTilgang, d.areal).brannklasse).filter(Boolean).join(", ")
                              : formData.brannklasse || "[brannklasse]";

                            const metode = formData.prosjekteringsmetode === "preakseptert"
                              ? "Prosjekteringen er basert på preaksepterte ytelser i henhold til VTEK17."
                              : formData.prosjekteringsmetode === "analyse"
                                ? "Prosjekteringen er basert på analyse (fraviksprosjektering)."
                                : "Prosjekteringen er basert på en kombinasjon av preaksepterte ytelser og analyse.";

                            tekst = `${firma} er engasjert av ${oppdragsgiver} for brannteknisk prosjektering av ${prosjekt}. `;
                            tekst += `Bygget er et ${bygningstype.toLowerCase()} med ${etasjer} tellende etasje${etasjer === "1" ? "" : "r"}. `;
                            tekst += `Bygget er plassert i risikoklasse ${rk} og brannklasse ${bkl}. `;
                            tekst += metode;

                            if (aktiveTiltak.length > 0) {
                              const punkter = aktiveTiltak
                                .map(t => `- ${t.charAt(0).toUpperCase()}${t.slice(1)}`)
                                .join("\n");
                              tekst += `\n\nFølgende aktive branntekniske tiltak er forutsatt:\n${punkter}`;
                            }

                            if (formData.prosjekteringsmetode === "analyse" || formData.prosjekteringsmetode === "blanding") {
                              tekst += `\n\nDet er gjort fravik fra preaksepterte ytelser. Se egen fraviksdokumentasjon for nærmere beskrivelse.`;
                            }
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
                    <>
                    <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30">
                      <Label className="text-xs text-muted-foreground font-semibold">1.2 Befarings- og analysegrunnlag</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">NS 3424 nivå</Label>
                        <Select
                          value={formData.ns3424Nivaa}
                          onValueChange={(value) => setFormData({ ...formData, ns3424Nivaa: value as "1" | "2" | "3" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Nivå 1 – Visuell registrering, enkel vurdering av synlige bygningsdeler</SelectItem>
                            <SelectItem value="2">Nivå 2 – Mer omfattende registrering, kan inkludere åpning av enkelte konstruksjoner</SelectItem>
                            <SelectItem value="3">Nivå 3 – Fullstendig registrering med destruktive prøver og laboratorieanalyser</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Befaringsdato</Label>
                        <Input
                          type="date"
                          value={formData.befaringsdato}
                          onChange={(e) => setFormData({ ...formData, befaringsdato: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Befaringsdeltakere</Label>
                        <Textarea
                          rows={2}
                          value={formData.befaringsdeltakere}
                          onChange={(e) => setFormData({ ...formData, befaringsdeltakere: e.target.value })}
                          placeholder="Stian Olimstad (brannrådgiver, [Firma]), N.N. (driftsoperatør)"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Befaringsmetode og omfang</Label>
                        <Textarea
                          rows={3}
                          value={formData.befaringsmetode}
                          onChange={(e) => setFormData({ ...formData, befaringsmetode: e.target.value })}
                          placeholder="Visuell befaring av tilgjengelige områder. Stikkprøver i tekniske rom. Følgende områder var ikke tilgjengelig: ..."
                        />
                        {(formData.ns3424Nivaa === "2" || formData.ns3424Nivaa === "3") && (
                          <p className="text-xs text-muted-foreground mt-1">
                            På NS 3424 nivå {formData.ns3424Nivaa} bør det også beskrives hvilke destruktive undersøkelser som er gjennomført (åpning av konstruksjoner, prøveuttak) og eventuelle laboratorieanalyser med referanse til prøverapporter.
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Dokumentasjon gjennomgått</Label>
                        <Textarea
                          rows={3}
                          value={formData.gjennomgaattDokumentasjon}
                          onChange={(e) => setFormData({ ...formData, gjennomgaattDokumentasjon: e.target.value })}
                          placeholder="Branntegninger, tidligere brannkonsept, vedlikeholdsplaner, branninstrukser, FDV-dokumentasjon..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Begrensninger i vurderingen</Label>
                        <div className="space-y-2">
                          {[
                            "Manglende tegningsgrunnlag for deler av bygget",
                            "Manglende dokumentasjon på branntekniske egenskaper for bygningsdeler",
                            "Manglende tilgang til loft, kjeller eller sjakter",
                            "Manglende dokumentasjon på utførte tiltak eller endringer",
                            "Vurdering basert på antagelser om alder, kun visuelt",
                          ].map((item) => {
                            const id = `begr-${item.slice(0, 20).replace(/\s+/g, "-")}`;
                            const checked = formData.begrensninger?.includes(item);
                            return (
                              <div key={item} className="flex items-start gap-2">
                                <Checkbox
                                  id={id}
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    const cur = formData.begrensninger || [];
                                    const next = c === true ? [...cur, item] : cur.filter((x) => x !== item);
                                    setFormData({ ...formData, begrensninger: next });
                                  }}
                                />
                                <Label htmlFor={id} className="text-xs cursor-pointer leading-tight">{item}</Label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2">
                          <Label className="text-xs font-medium mb-1 block">Andre begrensninger</Label>
                          <Textarea
                            rows={2}
                            value={formData.andreBegrensninger}
                            onChange={(e) => setFormData({ ...formData, andreBegrensninger: e.target.value })}
                            placeholder="Beskriv andre begrensninger eller forbehold..."
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.3 Avgrensning av vurderingen</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Beskriv avgrensning av vurderingen</Label>
                        <Textarea 
                          value={formData.avgrensning}
                          onChange={(e) => setFormData({...formData, avgrensning: e.target.value})}
                          placeholder="Beskriv hva som inngår i tilstandsvurderingen og eventuelle begrensninger..."
                        />
                      </div>
                    </div>
                    </>
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
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Tegning av tiltaksavgrensning (valgfritt)</Label>
                        {formData.avgrensningBilde ? (
                          <div className="relative border border-border rounded-lg overflow-hidden">
                            <img src={formData.avgrensningBilde} alt="Tiltaksavgrensning" className="max-h-64 w-auto mx-auto" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setFormData({...formData, avgrensningBilde: ""})}
                            >
                              Fjern
                            </Button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Last opp bilde</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setFormData({...formData, avgrensningBilde: ev.target?.result as string});
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    )}
                    {documentType !== "tilstandsvurdering" && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">1.5 Gjeldende regelverk</Label>
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Regelverk som gjelder for prosjektet</Label>
                        <Textarea
                          value={formData.gjeldendeRegelverk}
                          onChange={(e) => setFormData({...formData, gjeldendeRegelverk: e.target.value})}
                          placeholder="• TEK17 - Forskrift om tekniske krav til byggverk&#10;• VTEK17 - Veiledning til teknisk forskrift"
                          rows={4}
                        />
                      </div>
                    </div>
                    )}
                    {/* KS-status */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {documentType === "tilstandsvurdering" ? "1.3" : "1.6"} Kvalitetssikring (KS)
                      </Label>
                      <div className="space-y-3 p-3 border border-border/60 rounded-lg bg-muted/20">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Egenkontroll – utført av</Label>
                          <Input
                            value={formData.ksEgenkontrollUtfortAv}
                            onChange={(e) => setFormData({...formData, ksEgenkontrollUtfortAv: e.target.value})}
                            placeholder="Navn"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Sidemannskontroll – utført av</Label>
                          <Input
                            value={formData.ksSidemannskontrollUtfortAv}
                            onChange={(e) => setFormData({...formData, ksSidemannskontrollUtfortAv: e.target.value})}
                            placeholder="Navn"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Kapittel 2: Grunnlag og forutsetninger */}
                <AccordionItem value="kap2" disabled={regelverkLocked} className={`border-2 border-blue-200 rounded-lg mb-4 overflow-hidden ${regelverkLocked ? 'opacity-60' : ''}`}>
                  <div className={`flex items-center bg-blue-50 ${regelverkLocked ? 'cursor-not-allowed' : 'hover:bg-blue-100'} px-4 py-3`} title={regelverkLocked ? 'Velg regelverk i kap. 1 for å låse opp' : undefined}>
                    <AccordionTrigger disabled={regelverkLocked} className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline disabled:cursor-not-allowed">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                        Grunnlag og forutsetninger
                        {regelverkLocked && (
                          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-2">
                            <Lock className="h-3.5 w-3.5" />
                            Velg regelverk i kap. 1 for å låse opp
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <button type="button" disabled={regelverkLocked} onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap2')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.1 Bygningsinformasjon</Label>
                      <div className="space-y-3">
                        {/* Toggle for flere risikoklasser - under 2.1 */}
                        <div className="flex items-center gap-2 p-3 bg-muted/30 border rounded-md">
                          <input
                            type="checkbox"
                            id="harFlereRisikoklasser"
                            checked={formData.harFlereRisikoklasser}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked && formData.bygningsdeler.length === 0) {
                                // Forhåndsutfyll med samme risiko-/brannklasse som Bygningsdel 1 for å unngå
                                // tomme felter som kan gi krasj i preview-rendering.
                                const del2 = {
                                  id: crypto.randomUUID(),
                                  navn: "Bygningsdel 2",
                                  bygningstype: "",
                                  risikoklasse: formData.risikoklasse || "",
                                  brannklasse: formData.brannklasse || "",
                                  brannklasseUnntak: "",
                                  harTerrengTilgang: formData.harTerrengTilgang || "",
                                  areal: "",
                                  etasjer: formData.etasjer || "",
                                  spesifikkBrannenergi: ""
                                };
                                setFormData({...formData, harFlereRisikoklasser: true, bygningsdeler: [del2]});
                              } else {
                                setFormData({...formData, harFlereRisikoklasser: checked});
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="harFlereRisikoklasser" className="text-sm cursor-pointer">
                            Tiltaket/bygget har flere risikoklasser eller brannklasser
                          </Label>
                        </div>

                        {/* Bygningsdel 1 - wrapping card when multiple parts active */}
                        {formData.harFlereRisikoklasser && (
                          <Label className="text-sm font-semibold">Bygningsdel 1</Label>
                        )}
                        <div className={formData.harFlereRisikoklasser ? "p-4 border rounded-lg bg-background space-y-3" : "space-y-3"}>
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
                                <SelectItem value="Kraftstasjon">Kraftstasjon</SelectItem>
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
                                <SelectItem value="Trafikkterminal">Trafikkterminal</SelectItem>
                                <SelectItem value="Tribuneanlegg for mer enn 150 personer">Tribuneanlegg for mer enn 150 personer</SelectItem>
                                {/* Risikoklasse 6 */}
                                <SelectItem value="Arrestlokaler og fengsel">Arrestlokaler og fengsel</SelectItem>
                                <SelectItem value="Asylmottak og transittmottak">Asylmottak og transittmottak</SelectItem>
                                <SelectItem value="Bolig beregnet for personer med behov for heldøgns pleie og omsorg">Bolig for heldøgns pleie og omsorg</SelectItem>
                                <SelectItem value="Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger">Bolig for funksjonsnedsettelse/seniorboliger</SelectItem>
                                <SelectItem value="Feriekoloni og leirskole">Feriekoloni og leirskole</SelectItem>
                                <SelectItem value="Overnattingssted og hotell">Overnattingssted og hotell</SelectItem>
                                <SelectItem value="Pleieinstitusjon">Pleieinstitusjon</SelectItem>
                                <SelectItem value="Sykehus og sykehjem">Sykehus og sykehjem</SelectItem>
                                <SelectItem value="Turisthytte og vandrerhjem">Turisthytte og vandrerhjem</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        {((formData.bygningstype || "").toLowerCase().includes("kraftstasjon")) && (
                          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="kraftstasjonUnderFjell"
                                checked={!!formData.kraftstasjonUnderFjell}
                                onCheckedChange={(checked) => setFormData({...formData, kraftstasjonUnderFjell: checked as boolean})}
                              />
                              <Label htmlFor="kraftstasjonUnderFjell" className="text-xs font-medium cursor-pointer">
                                Kraftstasjon under fjell eller under dagen
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              Hukes av: Inkluderer krav om nødlysanlegg etter FEA-F § 26 i kap. 3.9, samt innledningstekst om redningsrom (jf. FEA-F § 26) – gjelder stasjoner i fjell og under dagen. Krav etter FEA-F § 25 om uavhengig nødbelysning, anbefaling om håndlykter, samt avsnittene om plassering, utforming og utstyr for redningsrom tas alltid med for kraftstasjoner.
                            </p>
                          </div>
                        )}
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
                            <Label className="text-xs font-medium mb-1 block">Antall etasjer <span className="text-muted-foreground font-normal ml-1">(totalt)</span></Label>
                            <Input 
                              value={formData.etasjer}
                              onChange={(e) => {
                                const nyEtasjer = e.target.value;
                                setFormData({...formData, etasjer: nyEtasjer});
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Hvorav under bakken <span className="text-muted-foreground font-normal ml-1">(kjeller)</span></Label>
                            <Input 
                              type="number"
                              min="0"
                              value={formData.etasjerUnderBakken}
                              onChange={(e) => setFormData({...formData, etasjerUnderBakken: e.target.value})}
                            />
                            {formData.etasjerUnderBakken && formData.etasjer &&
                              parseInt(formData.etasjerUnderBakken, 10) > parseInt(formData.etasjer, 10) && (
                              <p className="text-xs text-destructive mt-1">Antall under bakken kan ikke være større enn totalt antall etasjer.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium mb-1 block">Kommentar / utfyllende informasjon <span className="text-muted-foreground font-normal ml-1">(valgfritt)</span></Label>
                          <Textarea
                            value={formData.bygningsinfoKommentar}
                            onChange={(e) => setFormData({...formData, bygningsinfoKommentar: e.target.value})}
                            placeholder="Frivillig: kort utfyllende info om bygningen som tas med under tabellen i rapporten."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium mb-1 block">Spesifikk brannenergi (MJ/m²)</Label>
                          <Select 
                            value={formData.brannseksjonBrannenergi} 
                            onValueChange={(value) => {
                              const updates: any = { ...formData, brannseksjonBrannenergi: value };
                              // Synk til BF85 brannbelastning når relevant (industri/lager) for automatisk bygningsbrannklasse
                              if (documentType === "tilstandsvurdering" && formData.regelverk === "BF85" && (formData.bygningstype === "Industri" || formData.bygningstype === "Lager" || formData.bygningstype === "Kraftstasjon")) {
                                updates.bf85Brannbelastning = value as any;
                                const result = getBygningsbrannklasse(
                                  formData.bygningstype as BF85Bygningstype,
                                  parseInt(formData.etasjer, 10) || 0,
                                  parseFloat(formData.areal) || 0,
                                  { brannbelastning: value as any, harBrannalarm: formData.bf85HarBrannalarm }
                                );
                                updates.bygningsbrannklasse = (result?.klasse || "") as "" | "1" | "2" | "3" | "4";
                              }
                              setFormData(updates);
                            }}
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
                        {formData.harFlereRisikoklasser && (() => {
                          const del1BrannklasseResult = getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal);
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Risikoklasse</Label>
                                <Select value={formData.risikoklasse} onValueChange={(value) => setFormData({...formData, risikoklasse: value})}>
                                  <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="RK1">RK 1</SelectItem><SelectItem value="RK2">RK 2</SelectItem><SelectItem value="RK3">RK 3</SelectItem><SelectItem value="RK4">RK 4</SelectItem><SelectItem value="RK5">RK 5</SelectItem><SelectItem value="RK6">RK 6</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Brannklasse {del1BrannklasseResult.brannklasse && <span className="text-muted-foreground ml-1 text-xs">(Auto: {del1BrannklasseResult.brannklasse})</span>}</Label>
                                <Select value={formData.brannklasse || del1BrannklasseResult.brannklasse} onValueChange={(value) => setFormData({...formData, brannklasse: value})}>
                                  <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                                  <SelectContent><SelectItem value="BKL1">BKL 1</SelectItem><SelectItem value="BKL2">BKL 2</SelectItem><SelectItem value="BKL3">BKL 3</SelectItem></SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })()}
                        {formData.harFlereRisikoklasser && formData.regelverk !== "BF85" && (
                          <div className="flex items-start gap-2 mt-2">
                            <Checkbox
                              id="universellUtformingDel1"
                              checked={formData.universellUtforming}
                              onCheckedChange={(checked) => setFormData({...formData, universellUtforming: checked === true})}
                            />
                            <Label htmlFor="universellUtformingDel1" className="text-xs cursor-pointer leading-relaxed">
                              Universell utforming (åpningskraft dører maks 30 N, jf. § 12-13)
                            </Label>
                          </div>
                        )}
                        </div>
                        
                        {/* Bygningsdeler - vises under 2.1 når flere risikoklasser er valgt */}
                        {formData.harFlereRisikoklasser && (
                          <div className="space-y-4 mt-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs text-blue-700">
                                Legg til de ulike delene av bygget med hver sin risikoklasse. Eksempel: Et bygg kan ha butikk (RK5) i 1. etasje og boliger (RK4) over.
                              </p>
                            </div>
                            
                            {formData.bygningsdeler.map((del, index) => {
                              const delBrannklasseResult = getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal);
                              return (
                                <div key={del.id} className="p-4 border rounded-lg bg-background space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Bygningsdel {index + 2}</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => { const updated = formData.bygningsdeler.filter((_, i) => i !== index); setFormData({...formData, bygningsdeler: updated}); }}><X className="h-4 w-4" /></Button>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium mb-1 block">Navn på bygningsdel</Label>
                                    <Input placeholder="F.eks. Butikklokale, Boligdel..." value={del.navn} onChange={(e) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], navn: e.target.value}; setFormData({...formData, bygningsdeler: updated}); }} />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium mb-1 block">Bygningstype</Label>
                                    <Select value={del.bygningstype} onValueChange={(value) => { const risikoklasse = bygningsTypeRisikoklasseMap[value] || ""; const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], bygningstype: value, risikoklasse}; setFormData({...formData, bygningsdeler: updated}); }}>
                                      <SelectTrigger><SelectValue placeholder="Velg bygningstype" /></SelectTrigger>
                                      <SelectContent className="max-h-[300px]">
                                        <SelectItem value="Arbeidsbrakke">Arbeidsbrakke</SelectItem>
                                        <SelectItem value="Båtnaust">Båtnaust</SelectItem>
                                        <SelectItem value="Carport">Carport</SelectItem>
                                        <SelectItem value="Flyhangar">Flyhangar</SelectItem>
                                        <SelectItem value="Fryselager">Fryselager</SelectItem>
                                        <SelectItem value="Garasje og parkeringshus med én etasje">Garasje og parkeringshus med én etasje</SelectItem>
                                        <SelectItem value="Sagbruk">Sagbruk</SelectItem>
                                        <SelectItem value="Skur">Skur</SelectItem>
                                        <SelectItem value="Trelastopplag">Trelastopplag</SelectItem>
                                        <SelectItem value="Brannstasjon uten døgnbemanning">Brannstasjon uten døgnbemanning</SelectItem>
                                        <SelectItem value="Driftsbygning med husdyrrom">Driftsbygning med husdyrrom</SelectItem>
                                        <SelectItem value="Industri">Industri</SelectItem>
                                        <SelectItem value="Kraftstasjon">Kraftstasjon</SelectItem>
                                        <SelectItem value="Kantine beregnet for egne ansatte til og med 150 personer">Kantine til og med 150 personer</SelectItem>
                                        <SelectItem value="Kjemisk fabrikk og kjemikalielager">Kjemisk fabrikk og kjemikalielager</SelectItem>
                                        <SelectItem value="Kontor">Kontor</SelectItem>
                                        <SelectItem value="Laboratorium">Laboratorium</SelectItem>
                                        <SelectItem value="Lager">Lager</SelectItem>
                                        <SelectItem value="Parkeringshus og garasje med to eller flere etasjer eller plan">Parkeringshus med to eller flere etasjer</SelectItem>
                                        <SelectItem value="Parkeringskjeller og garasje under terreng">Parkeringskjeller under terreng</SelectItem>
                                        <SelectItem value="Sprengstoffindustri">Sprengstoffindustri</SelectItem>
                                        <SelectItem value="Trafo eller fordelingsstasjon">Trafo eller fordelingsstasjon</SelectItem>
                                        <SelectItem value="Barnehage">Barnehage</SelectItem>
                                        <SelectItem value="Skole">Skole</SelectItem>
                                        <SelectItem value="Barnehjem">Barnehjem</SelectItem>
                                        <SelectItem value="Bolig">Bolig</SelectItem>
                                        <SelectItem value="Boligbrakke">Boligbrakke</SelectItem>
                                        <SelectItem value="Brannstasjon med døgnbemanning">Brannstasjon med døgnbemanning</SelectItem>
                                        <SelectItem value="Fritidsbolig, inkl. selvbetjente hytter, campinghytter og campingenheter">Fritidsbolig, inkl. hytter</SelectItem>
                                        <SelectItem value="Internat">Internat</SelectItem>
                                        <SelectItem value="Studentbolig">Studentbolig</SelectItem>
                                        <SelectItem value="Forsamlingslokale">Forsamlingslokale</SelectItem>
                                        <SelectItem value="Idrettshall">Idrettshall</SelectItem>
                                        <SelectItem value="Kantine beregnet for utleie eller for mer enn 150 personer">Kantine for utleie/mer enn 150</SelectItem>
                                        <SelectItem value="Kinolokale">Kinolokale</SelectItem>
                                        <SelectItem value="Kirke">Kirke</SelectItem>
                                        <SelectItem value="Kongressenter">Kongressenter</SelectItem>
                                        <SelectItem value="Messelokale">Messelokale</SelectItem>
                                        <SelectItem value="Museum">Museum</SelectItem>
                                        <SelectItem value="Salgslokale">Salgslokale</SelectItem>
                                        <SelectItem value="Teaterlokale">Teaterlokale</SelectItem>
                                        <SelectItem value="Trafikkterminal">Trafikkterminal</SelectItem>
                                        <SelectItem value="Tribuneanlegg for mer enn 150 personer">Tribuneanlegg for mer enn 150</SelectItem>
                                        <SelectItem value="Arrestlokaler og fengsel">Arrestlokaler og fengsel</SelectItem>
                                        <SelectItem value="Asylmottak og transittmottak">Asylmottak og transittmottak</SelectItem>
                                        <SelectItem value="Bolig beregnet for personer med behov for heldøgns pleie og omsorg">Bolig for heldøgns pleie</SelectItem>
                                        <SelectItem value="Bolig spesielt tilrettelagt og beregnet for personer med funksjonsnedsettelse, inkl. alders- og seniorboliger">Bolig for funksjonsnedsettelse</SelectItem>
                                        <SelectItem value="Feriekoloni og leirskole">Feriekoloni og leirskole</SelectItem>
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
                                      <Input value={del.areal} onChange={(e) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], areal: e.target.value}; setFormData({...formData, bygningsdeler: updated}); }} />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Antall etasjer <span className="text-muted-foreground font-normal ml-1">(totalt)</span></Label>
                                      <Input value={del.etasjer} placeholder="Totalt antall etasjer" onChange={(e) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], etasjer: e.target.value}; setFormData({...formData, bygningsdeler: updated}); }} />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Risikoklasse</Label>
                                      <Select value={del.risikoklasse} onValueChange={(value) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], risikoklasse: value}; setFormData({...formData, bygningsdeler: updated}); }}>
                                        <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="RK1">RK 1</SelectItem><SelectItem value="RK2">RK 2</SelectItem><SelectItem value="RK3">RK 3</SelectItem><SelectItem value="RK4">RK 4</SelectItem><SelectItem value="RK5">RK 5</SelectItem><SelectItem value="RK6">RK 6</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Brannklasse {delBrannklasseResult.brannklasse && <span className="text-muted-foreground ml-1 text-xs">(Auto: {delBrannklasseResult.brannklasse})</span>}</Label>
                                      <Select value={del.brannklasse || delBrannklasseResult.brannklasse} onValueChange={(value) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], brannklasse: value}; setFormData({...formData, bygningsdeler: updated}); }}>
                                        <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                                        <SelectContent><SelectItem value="BKL1">BKL 1</SelectItem><SelectItem value="BKL2">BKL 2</SelectItem><SelectItem value="BKL3">BKL 3</SelectItem></SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  {del.risikoklasse === "RK4" && parseInt(del.etasjer, 10) === 3 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                      <Label className="text-xs font-medium mb-2 block text-amber-700">Har alle boenheter utgang direkte til terreng?</Label>
                                      <Select value={del.harTerrengTilgang} onValueChange={(value) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], harTerrengTilgang: value}; setFormData({...formData, bygningsdeler: updated}); }}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Velg svar" /></SelectTrigger>
                                        <SelectContent><SelectItem value="ja">Ja - direkte terreng-tilgang</SelectItem><SelectItem value="nei">Nei</SelectItem></SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  {delBrannklasseResult.brannklasseUnntak && (<div className="p-2 bg-blue-50 border border-blue-200 rounded-md"><p className="text-xs text-blue-600">{delBrannklasseResult.brannklasseUnntak}</p></div>)}
                                  <div>
                                    <Label className="text-xs font-medium mb-1 block">Spesifikk brannenergi (MJ/m²)</Label>
                                    <Select value={del.spesifikkBrannenergi || ""} onValueChange={(value) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], spesifikkBrannenergi: value}; setFormData({...formData, bygningsdeler: updated}); }}>
                                      <SelectTrigger><SelectValue placeholder="Velg brannenergi..." /></SelectTrigger>
                                      <SelectContent><SelectItem value="over400">Over 400 MJ/m²</SelectItem><SelectItem value="50-400">50-400 MJ/m²</SelectItem><SelectItem value="under50">Under 50 MJ/m²</SelectItem></SelectContent>
                                    </Select>
                                  </div>
                                  {formData.regelverk !== "BF85" && (
                                  <div className="flex items-start gap-2">
                                    <Checkbox
                                      id={`universellUtformingDel${index + 2}`}
                                      checked={del.universellUtforming || false}
                                      onCheckedChange={(checked) => { const updated = [...formData.bygningsdeler]; updated[index] = {...updated[index], universellUtforming: checked === true}; setFormData({...formData, bygningsdeler: updated}); }}
                                    />
                                    <Label htmlFor={`universellUtformingDel${index + 2}`} className="text-xs cursor-pointer leading-relaxed">
                                      Universell utforming (åpningskraft dører maks 30 N, jf. § 12-13)
                                    </Label>
                                  </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            <Button type="button" variant="outline" size="sm" onClick={() => { const newDel = { id: crypto.randomUUID(), navn: "", bygningstype: "", risikoklasse: "", brannklasse: "", brannklasseUnntak: "", harTerrengTilgang: "", areal: "", etasjer: formData.etasjer || "", spesifikkBrannenergi: "", universellUtforming: false }; setFormData({...formData, bygningsdeler: [...formData.bygningsdeler, newDel]}); }}>
                              <Plus className="h-4 w-4 mr-1" /> Legg til bygningsdel
                            </Button>

                            {(() => {
                              const etasjeVerdier = formData.bygningsdeler.map(d => d.etasjer).filter(Boolean);
                              const unikeEtasjer = [...new Set(etasjeVerdier)];
                              if (unikeEtasjer.length > 1) {
                                return (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="text-amber-600 mt-0.5">⚠️</span>
                                      <div>
                                        <Label className="text-xs font-medium block text-amber-700">Ulikt etasjeantall registrert</Label>
                                        <p className="text-xs text-amber-600 mt-1">Bygningsdelene har ulikt etasjeantall ({unikeEtasjer.join(", ")} etasjer). Normalt skal alle deler ha samme totale etasjeantall.</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-6">
                                      <input type="checkbox" id="bekreftetUliktEtasjeantall2" checked={formData.bekreftetUliktEtasjeantall || false} onChange={(e) => setFormData({...formData, bekreftetUliktEtasjeantall: e.target.checked})} className="h-4 w-4" />
                                      <Label htmlFor="bekreftetUliktEtasjeantall2" className="text-xs text-amber-700 cursor-pointer">Jeg bekrefter at ulikt etasjeantall er korrekt</Label>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {formData.bygningsdeler.length > 0 && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <Label className="text-xs font-medium mb-1 block text-green-700">Oppsummering</Label>
                                <div className="text-xs text-green-700 space-y-1">
                                  {(() => {
                                    const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                                    const lines = [
                                      `Bygningsdel 1: ${formData.bygningstype || "Ikke angitt"} – ${formData.risikoklasse || "?"} / ${del1Bkl || "?"}`,
                                      ...formData.bygningsdeler.map((d, i) => {
                                        const bkl = d.brannklasse || getBrannklasse(d.risikoklasse, d.etasjer, d.harTerrengTilgang, d.areal).brannklasse;
                                        return `Bygningsdel ${i + 2}: ${d.bygningstype || d.navn || "Ikke angitt"} – ${d.risikoklasse || "?"} / ${bkl || "?"}`;
                                      })
                                    ];
                                    return lines.map((line, i) => <p key={i}>{line}</p>);
                                  })()}
                                  <p className="font-medium mt-1">Tiltaksklasse: {autoTiltaksklasse || "Ikke beregnet"}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    {documentType !== "tilstandsvurdering" && (
                    <div className="space-y-2 mt-2">
                      <Label className="text-xs font-medium">Tiltaksklasse</Label>
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
                    {!formData.harFlereRisikoklasser && formData.regelverk !== "BF85" && (
                    <div className="space-y-2 mt-2">
                      <Label className="text-xs font-medium">Universell utforming</Label>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="universellUtforming"
                          checked={formData.universellUtforming}
                          onCheckedChange={(checked) => setFormData({...formData, universellUtforming: checked === true})}
                        />
                        <Label htmlFor="universellUtforming" className="text-xs cursor-pointer leading-relaxed">
                          Bygget skal være universelt utformet (åpningskraft dører maks 30 N, jf. § 12-13). Dersom ikke, gjelder maks 67 N.
                        </Label>
                      </div>
                    </div>
                    )}
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

                            {/* Spesifikk brannbelastning settes automatisk fra § 2.1 "Spesifikk brannenergi" */}

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
                              {formData.regelverk === "BF85" && formData.bygningsbrannklasse && (() => {
                                const bklMap: Record<string, string> = { "1": "3", "2": "2", "3": "1", "4": "" };
                                const bkl = bklMap[formData.bygningsbrannklasse];
                                const rk = bygningsTypeRisikoklasseMap[formData.bygningstype] || "";
                                return (
                                  <div className="mt-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
                                    <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Tilsvarende klassifisering etter TEK17</div>
                                    <div className="text-foreground">
                                      {formData.bygningsbrannklasse === "4"
                                        ? "Ingen direkte tilsvarende brannklasse i TEK17 (typisk mindre/uklassifiserte bygg under BKL 1)."
                                        : <>Brannklasse <strong>BKL {bkl}</strong>{rk && <>, Risikoklasse <strong>{rk}</strong> ({formData.bygningstype})</>}</>}
                                    </div>
                                    <div className="italic text-muted-foreground mt-1">Veiledende mapping – BF85 og TEK17 har ulike inndelingsprinsipper.</div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                            );
                          })()
                        ) : (
                        <>
                        

                        {!formData.harFlereRisikoklasser && (
                          /* Enkel visning - én risikoklasse */
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Risikoklasse</Label>
                              <Select 
                                value={formData.risikoklasse}
                                onValueChange={(value) => {
                                  setFormData({...formData, risikoklasse: value, risikoklasseBegrunnelse: ""});
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
                              <p className="text-xs text-muted-foreground mt-1">
                                Velg fra listen, eller bruk knappen under hvis bygget ikke er listet. Etter §11-2 må slike tilfeller plasseres etter begrunnet og dokumentert vurdering.
                              </p>
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="px-0 h-auto text-xs"
                                onClick={() => {
                                  setManuellRkValg(formData.risikoklasse || "");
                                  setManuellRkBegrunnelse(formData.risikoklasseBegrunnelse || "");
                                  setManuellRkOpen(true);
                                }}
                              >
                                Bygget mitt finnes ikke i listen
                              </Button>
                              {formData.risikoklasseBegrunnelse && (
                                <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                  <p className="text-xs text-amber-700 font-medium">Manuelt plassert (§11-2)</p>
                                  <p className="text-xs text-amber-700 mt-1 whitespace-pre-wrap">{formData.risikoklasseBegrunnelse}</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs font-medium mb-1 block">
                                Brannklasse
                                {!formData.saerligKonsekvensBKL4 && beregnetBrannklasseResult.brannklasse && (
                                  <span className="text-muted-foreground ml-2">(Automatisk: {beregnetBrannklasseResult.brannklasse})</span>
                                )}
                                {formData.saerligKonsekvensBKL4 && formData.brannklasseTabellReferanse && (
                                  <span className="text-muted-foreground ml-2">(Tabellverdi: {formData.brannklasseTabellReferanse})</span>
                                )}
                              </Label>
                              <Select 
                                value={formData.brannklasse} 
                                onValueChange={(value) => {
                                  setFormData({...formData, brannklasse: value});
                                }}
                                disabled={formData.saerligKonsekvensBKL4}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BKL1">BKL 1</SelectItem>
                                  <SelectItem value="BKL2">BKL 2</SelectItem>
                                  <SelectItem value="BKL3">BKL 3</SelectItem>
                                  <SelectItem value="BKL4">BKL 4</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-start gap-2 mt-2">
                                <Checkbox
                                  id="saerligKonsekvensBKL4"
                                  checked={formData.saerligKonsekvensBKL4}
                                  onCheckedChange={(checked) => setFormData({...formData, saerligKonsekvensBKL4: checked === true})}
                                />
                                <div className="flex-1">
                                  <Label htmlFor="saerligKonsekvensBKL4" className="text-xs cursor-pointer leading-relaxed font-medium">
                                    Brann kan medføre særlig stor konsekvens (BKL4)
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Hak av hvis byggverket er av en type hvor konsekvensen ved brann kan bli særlig stor for liv og helse, miljø eller samfunnet generelt – for eksempel mer enn 16 etasjer, kritisk infrastruktur, byggverk under terreng, kjemisk industri eller lagring av særlig brann-/helse-/miljøfarlige stoffer. Brannklasse 4 må dokumenteres ved analyse, jf. veiledningen til § 11-3.
                                  </p>
                                </div>
                              </div>
                            </div>
                            {formData.saerligKonsekvensBKL4 && (
                              <div className="col-span-2">
                                <Alert variant="warning">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>BKL4 valgt</AlertTitle>
                                  <AlertDescription>
                                    Preaksepterte ytelser dekker ikke BKL4 fullt ut – sikkerheten må dokumenteres ved analyse iht. veiledningen til § 11-3. Vurder samtidig:
                                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                                      <li>a) sannsynlige brannforløp,</li>
                                      <li>b) potensielle konsekvenser,</li>
                                      <li>c) byggverkets kompleksitet,</li>
                                      <li>d) om brannsikkerhetsstrategien er komplisert.</li>
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
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
                            {formData.risikoklasse === "RK6" && parseInt(formData.etasjer, 10) <= 2 && (
                              <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <Checkbox
                                    id="erRKL6Boligbygning"
                                    checked={formData.erRKL6Boligbygning}
                                    onCheckedChange={(checked) => setFormData({...formData, erRKL6Boligbygning: checked === true})}
                                  />
                                  <Label htmlFor="erRKL6Boligbygning" className="text-xs text-amber-700 cursor-pointer">
                                    Er dette en boligbygning? (Boligbygning i RK6 med inntil 2 etasjer kan oppføres i BKL1, jf. VTEK § 11-3, preakseptert ytelse nr. 7)
                                  </Label>
                                </div>
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
                            {erBrannklasseOverstyrt && !formData.saerligKonsekvensBKL4 && (
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
                        )}
                        </>
                        )}
                      </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">2.3 § 11-1 Overordnet brannstrategi</Label>
                      <p className="text-xs text-muted-foreground">
                        Iht. § 11-1 skal byggverket prosjekteres slik at det oppnås tilfredsstillende sikkerhet ved brann. Beskriv her hvordan de fire pilarene er ivaretatt på overordnet nivå. Detaljerte krav dokumenteres under hver enkelt paragraf i kapittel 3.
                      </p>
                      {[
                        { key: "overordnetMaterialer" as const, label: "a. Materialer og produkter", help: "Hvordan velges materialer og produkter slik at de ikke gir uakseptable bidrag til brannutvikling?", def: DEFAULT_OVERORDNET.materialer },
                        { key: "overordnetBrannspredning" as const, label: "b. Bygnings- og installasjonsdeler – begrensning av brannspredning", help: "Hvordan utformes bygningsdelene for å begrense brannspredning innenfor og mellom branncelle/seksjoner?", def: DEFAULT_OVERORDNET.brannspredning },
                        { key: "overordnetRoemning" as const, label: "c. Rask og sikker rømning", help: "Hvordan utformes byggverket for at personer skal kunne komme seg trygt ut?", def: DEFAULT_OVERORDNET.roemning },
                        { key: "overordnetRednings" as const, label: "d. Rednings- og slokkeinnsats", help: "Hvordan tilrettelegges byggverket for innsats fra rednings- og slokkemannskap?", def: DEFAULT_OVERORDNET.rednings },
                      ].map((f) => (
                        <div key={f.key} className="space-y-1 border rounded-md p-3">
                          <div className="flex items-start justify-between gap-2">
                            <Label className="text-xs font-medium block">{f.label}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setFormData({ ...formData, [f.key]: f.def })}
                            >
                              Hent default-tekst
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">{f.help}</p>
                          <Textarea
                            rows={4}
                            className="min-h-[100px]"
                            value={(formData as any)[f.key] || ""}
                            onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                          />
                        </div>
                      ))}
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
                <AccordionItem value="kap3" disabled={regelverkLocked} className={`border-2 border-blue-200 rounded-lg mb-4 overflow-hidden ${regelverkLocked ? 'opacity-60' : ''}`}>
                  <div className={`flex items-center bg-blue-50 ${regelverkLocked ? 'cursor-not-allowed' : 'hover:bg-blue-100'} px-4 py-3`} title={regelverkLocked ? 'Velg regelverk i kap. 1 for å låse opp' : undefined}>
                    <AccordionTrigger disabled={regelverkLocked} className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline disabled:cursor-not-allowed">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                        Branntekniske ytelseskrav
                        {regelverkLocked && (
                          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-2">
                            <Lock className="h-3.5 w-3.5" />
                            Velg regelverk i kap. 1 for å låse opp
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <button type="button" disabled={regelverkLocked} onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap3')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Gå til i forhåndsvisning">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <AccordionContent className="space-y-3 pt-4 px-4 pb-4">
                    {documentType === "tilstandsvurdering" && (
                      <div className="text-xs p-2 rounded-md border border-blue-200 bg-blue-50 text-blue-800">
                        ℹ︎ Befaringsgrunnlag og begrensninger dokumentert i kap 1.2
                      </div>
                    )}
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
                        {formData.regelverk !== "BF85" && (
                          <div className="flex flex-wrap gap-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="trappeloepRelevant"
                                checked={formData.trappeloepRelevant}
                                onCheckedChange={(checked) => setFormData({...formData, trappeloepRelevant: checked as boolean})}
                              />
                              <Label htmlFor="trappeloepRelevant" className="text-xs cursor-pointer">Trappeløp</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="kjellerRelevant"
                                checked={formData.kjellerRelevant}
                                onCheckedChange={(checked) => setFormData({...formData, kjellerRelevant: checked as boolean})}
                              />
                              <Label htmlFor="kjellerRelevant" className="text-xs cursor-pointer">Bærende bygningsdeler under øverste kjeller</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="utvendigTrapperRelevant"
                                checked={formData.utvendigTrapperRelevant}
                                onCheckedChange={(checked) => setFormData({...formData, utvendigTrapperRelevant: checked as boolean})}
                              />
                              <Label htmlFor="utvendigTrapperRelevant" className="text-xs cursor-pointer">Utvendige trapper</Label>
                            </div>
                          </div>
                        )}
                        <Textarea 
                          value={formData.baereevne}
                          onChange={(e) => setFormData({...formData, baereevne: e.target.value})}
                          className="min-h-[140px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 text-xs"
                          onClick={() => {
                            if (formData.regelverk === "BF85") {
                              if (!formData.bygningsbrannklasse) return;
                              const bf85Result = getBaereevneTekstBF85(formData.bygningsbrannklasse);
                              if (bf85Result.tekst) {
                                setFormData(prev => ({ ...prev, baereevne: bf85Result.tekst, baereevneUnntak: [] }));
                              }
                              return;
                            }
                            const toggles = { trappeloep: formData.trappeloepRelevant, kjeller: formData.kjellerRelevant, utvendig: formData.utvendigTrapperRelevant };
                            const harFlere = formData.bygningsdeler && formData.bygningsdeler.length > 0;
                            if (harFlere) {
                              const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                              const del1Result = getBaereevneTekst(del1Bkl, formData.risikoklasse, formData.etasjer, toggles);
                              const sections = [`[Bygningsdel 1 – ${formData.bygningstype || 'Bygningsdel 1'} (${del1Bkl})]\n${del1Result.tekst}`];
                              const alleUnntak = [...del1Result.anvendteUnntak];
                              formData.bygningsdeler.forEach((del: any, i: number) => {
                                const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                                const delResult = getBaereevneTekst(delBkl, del.risikoklasse, del.etasjer || formData.etasjer, toggles);
                                sections.push(`[Bygningsdel ${i + 2} – ${del.navn || del.bygningstype || `Bygningsdel ${i + 2}`} (${delBkl})]\n${delResult.tekst}`);
                                alleUnntak.push(...delResult.anvendteUnntak);
                              });
                              setFormData(prev => ({ ...prev, baereevne: sections.join('\n\n'), baereevneUnntak: [...new Set(alleUnntak)] }));
                            } else {
                              const result = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer, toggles);
                              if (result.tekst) {
                                setFormData(prev => ({ ...prev, baereevne: result.tekst, baereevneUnntak: result.anvendteUnntak }));
                              }
                            }
                          }}
                        >
                          Sett original tekst
                        </Button>
                        {formData.regelverk !== "BF85" && formData.baereevne && formData.brannklasse && (() => {
                          const toggles = { trappeloep: formData.trappeloepRelevant, kjeller: formData.kjellerRelevant, utvendig: formData.utvendigTrapperRelevant };
                          const harFlere = formData.bygningsdeler && formData.bygningsdeler.length > 0;
                          let autoTekst = "";
                          if (harFlere) {
                            const del1Bkl = formData.brannklasse || getBrannklasse(formData.risikoklasse, formData.etasjer, formData.harTerrengTilgang, formData.areal).brannklasse;
                            const del1Result = getBaereevneTekst(del1Bkl, formData.risikoklasse, formData.etasjer, toggles);
                            const sections = [`[Bygningsdel 1 – ${formData.bygningstype || 'Bygningsdel 1'} (${del1Bkl})]\n${del1Result.tekst}`];
                            formData.bygningsdeler.forEach((del: any, i: number) => {
                              const delBkl = del.brannklasse || getBrannklasse(del.risikoklasse, del.etasjer, del.harTerrengTilgang, del.areal).brannklasse;
                              const delResult = getBaereevneTekst(delBkl, del.risikoklasse, del.etasjer || formData.etasjer, toggles);
                              sections.push(`[Bygningsdel ${i + 2} – ${del.navn || del.bygningstype || `Bygningsdel ${i + 2}`} (${delBkl})]\n${delResult.tekst}`);
                            });
                            autoTekst = sections.join('\n\n');
                          } else {
                            const auto = getBaereevneTekst(formData.brannklasse, formData.risikoklasse, formData.etasjer, toggles);
                            autoTekst = auto.tekst;
                          }
                          return autoTekst && formData.baereevne !== autoTekst;
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
                          {formData.regelverk === "BF85" ? (
                            <li>Krav til bygningsdelers brannmotstand iht. BF85 Tabell 30:41 (bærende hovedsystem, sekundære deler, etasjeskiller, branncellebegrensende deler, kjeller, trapperom og heissjakt, trappeløp)</li>
                          ) : (
                            <li>Krav til bærende hovedsystem, sekundære bærende deler, trapperom og heissjakt</li>
                          )}
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
                    <FravikForParagraf paragrafId="11-4" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-2" label={`3.2 ${formData.regelverk === "BF85" ? "Sikkerhet ved eksplosjon (§ 11-5)" : "§ 11-5 Sikkerhet ved eksplosjon"}`}>
                    <div className="space-y-3">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">
                          3.2 {formData.regelverk === "BF85" ? "Sikkerhet ved eksplosjon" : "§ 11-5 Sikkerhet ved eksplosjon"}
                        </Label>
                        {formData.regelverk === "BF85" && (
                          <>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sikkerhet ved eksplosjon er ikke spesifikt kravsatt i BF85, men må likevel vurderes i en tilstandsvurdering.
                            </p>
                            {documentType === "tilstandsvurdering" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                BF 85 beskriver kun at bygninger skal være tilstrekkelig sikret mot eksplosjoner, her refereres det derfor videre til TEK17 sine krav for å kunne ivareta dette forholdet.
                              </p>
                            )}
                          </>
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
                          {formData.eksplosjonRelevant === "relevant" && (
                            formData.regelverk === "BF85"
                              ? <li>Krav til tekniske rom, fyrrom, ildsteder, røykpiper og fyringsanlegg iht. BF85 Kap. 30:33 og Kap. 49 (heismaskinrom, ventilasjonsrom, søppelrom og fyrrom som branncelle A 60)</li>
                              : <li>Preaksepterte ytelser iht. VTEK § 11-5 (egen branncelle, trykkavlastningsflate, mm.)</li>
                          )}
                          {formData.eksplosjonRelevant === "ikke_relevant" && (
                            formData.regelverk === "BF85"
                              ? <li>Standardtekst om at eksplosjonsfare ikke er relevant. Krav til tekniske rom, fyrrom og ildsted iht. BF85 Kap. 30:33 og Kap. 49 må likevel vurderes der relevant.</li>
                              : <li>Standardtekst om at eksplosjonsfare ikke er relevant for tiltaket</li>
                          )}
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
                    <FravikForParagraf paragrafId="11-5" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-3" label={`3.3 ${formData.regelverk === "BF85" ? "Avstand mellom bygninger (§ 11-6 Tiltak mot brannspredning mellom byggverk)" : "§ 11-6 Tiltak mot brannspredning"}`}>
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

                      <div className="p-3 rounded-md border bg-muted/30">
                        <Label className="text-xs font-medium mb-1 block">Er nabobygg relevant for vurderingen?</Label>
                        <Select
                          value={formData.nabobyggIkkeRelevant ? "nei" : "ja"}
                          onValueChange={(value) => setFormData({...formData, nabobyggIkkeRelevant: value === "nei"})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ja">Ja – nabobygg skal vurderes</SelectItem>
                            <SelectItem value="nei">Nei – ligger langt unna</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">Velg "Nei" dersom nabobygg ligger så langt unna at krav til avstand/branncellevegg mot nabo ikke er aktuelt.</p>
                      </div>

                      {formData.nabobyggIkkeRelevant ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Nabobygg er vurdert som ikke relevant pga. stor avstand. Krav til avstand og branncellevegg mot nabobygg er ikke aktuelt.
                          </p>
                        </div>
                      ) : formData.regelverk === "BF85" ? (
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

                          {parseFloat(formData.avstandNabobygg) >= 8 && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Avstand til nabobygg er 8 meter eller mer – krav til brannvegg gjelder ikke.</p>
                            </div>
                          )}

                          {parseFloat(formData.avstandNabobygg) > 0 && parseFloat(formData.avstandNabobygg) < 8 && (
                            <>
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
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md dark:bg-orange-950 dark:border-orange-800">
                                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">Bygning over 9 meter med avstand under 8 m - krav til brannvegg</p>
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
                                  {formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0 && (
                                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-2 font-medium">
                                      ⚠ Ved flere bygningsdeler skal spesifikk brannenergi velges ut ifra bygningsdelen med høyest brannenergi.
                                    </p>
                                  )}
                                </div>
                              )}

                              {parseFloat(formData.bygningshoyde) > 0 && parseFloat(formData.bygningshoyde) <= 9 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
                                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Bygning under eller lik 9 meter med avstand under 8 m - krav til branncellevegg</p>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.regelverk === "BF85" ? (
                            <>
                              <li>Avstandskrav mellom bygninger iht. BF85 Kap. 30:32 (minste avstand og krav om brannvegg)</li>
                              <li>Krav til avstand mellom grupper av bygninger og vurdering av strålevarme</li>
                              <li>Krav til yttervegger og vinduer/åpninger mot nabobygg</li>
                            </>
                          ) : (
                            <>
                              <li>Avstandskrav mellom byggverk basert på bygningshøyde og avstand til nabobygg</li>
                              <li>Automatisk beregning av minsteavstand og krav til brannvegg/branncellevegg</li>
                              <li>Krav til yttervegger og vinduer/åpninger mot nabobygg</li>
                            </>
                          )}
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
                    <FravikForParagraf paragrafId="11-6" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-4" label={`3.4 ${formData.regelverk === "BF85" ? "Brannteknisk oppdeling (§ 11-7 Brannseksjoner)" : "§ 11-7 Brannseksjoner"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">{formData.regelverk === "BF85" ? "3.4 Brannteknisk oppdeling (Kap. 30:6)" : "3.4 § 11-7 Brannseksjoner"}</Label>
                      </div>

                      {/* Tilstandsvurdering: registrer manglende brannvegg/seksjonering – vises kun når regelverket faktisk krever brannvegg/seksjonering */}
                      {documentType === "tilstandsvurdering" && (() => {
                        const arealNum = parseFloat(formData.areal) || 0;
                        let kravFinnes = false;

                        if (formData.regelverk === "BF85") {
                          if (formData.bygningstype === "Skole") {
                            const etasjer = parseInt(formData.etasjer, 10) || 0;
                            const krav = getBF85BrannveggKravSkole(etasjer, arealNum, formData.bygningsbrannklasse);
                            if (krav?.krevBrannvegg) kravFinnes = true;
                          }
                          if (["Industri", "Kraftstasjon", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype)) {
                            const brannbelastning = parseFloat(formData.bf85_34_brannbelastning) || 0;
                            const tiltak = formData.bf85_34_tiltak || "ingen";
                            if (brannbelastning > 0) {
                              const krav = getBF85BrannveggKravKap34(arealNum, brannbelastning, tiltak);
                              if (krav?.krevBrannvegg) kravFinnes = true;
                            }
                          }
                        } else {
                          // TEK17
                          if (formData.erSykehusPleieinstitusjon) kravFinnes = true;
                          if (formData.brannseksjonTiltak && formData.brannseksjonBrannenergi) {
                            const g = seksjoneringsGrenser[formData.brannseksjonBrannenergi];
                            const maksAreal = g?.[formData.brannseksjonTiltak as keyof typeof g];
                            if (maksAreal !== undefined && maksAreal !== Infinity && arealNum > maksAreal) {
                              kravFinnes = true;
                            }
                          }
                        }

                        if (!kravFinnes) return null;
                        return (
                        <div className="space-y-2 p-3 rounded-md border border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-700">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              id="manglerSeksjonering"
                              checked={formData.manglerSeksjonering}
                              onCheckedChange={(checked) => setFormData({ ...formData, manglerSeksjonering: !!checked })}
                            />
                            <label htmlFor="manglerSeksjonering" className="text-xs cursor-pointer leading-snug">
                              <span className="font-medium">
                                {formData.regelverk === "BF85"
                                  ? "Brannvegg er ikke etablert i bygget (avvik fra Kap. 30:6)"
                                  : "Seksjoneringsvegg er ikke etablert i bygget (avvik fra § 11-7)"}
                              </span>
                              <br />
                              <span className="text-muted-foreground">
                                Huk av dersom bygget mangler påkrevd brannvegg/seksjoneringsvegg. Avviket vil vises tydelig i rapporten, men kravene under dokumenteres som normalt.
                              </span>
                            </label>
                          </div>
                          {formData.manglerSeksjonering && (
                            <>
                              <div className="flex items-start gap-2 pl-6 pt-1 border-l-2 border-amber-300 dark:border-amber-700 ml-1">
                                <Checkbox
                                  id="etablererSeksjoneringLikevel"
                                  checked={formData.etablererSeksjoneringLikevel}
                                  onCheckedChange={(checked) => setFormData({ ...formData, etablererSeksjoneringLikevel: !!checked })}
                                />
                                <label htmlFor="etablererSeksjoneringLikevel" className="text-xs cursor-pointer leading-snug">
                                  <span className="font-medium">
                                    {formData.regelverk === "BF85"
                                      ? "Brannvegg etableres likevel som nytt tiltak"
                                      : "Seksjoneringsvegg etableres likevel som nytt tiltak"}
                                  </span>
                                  <br />
                                  <span className="text-muted-foreground">
                                    Huk av dersom det velges å etablere veggen som tiltak. Hvis ikke, dokumenteres fraviket i tilstandsvurderingen nederst i kapittelet.
                                  </span>
                                </label>
                              </div>
                              {!formData.etablererSeksjoneringLikevel && (
                                <div className="p-2 rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700">
                                  <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                                    ⚠ Fravik: {formData.regelverk === "BF85" ? "Brannvegg" : "Seksjoneringsvegg"} mangler – beskrives i tilstandsvurderingen nederst i kapittelet.
                                  </p>
                                </div>
                              )}
                              {formData.etablererSeksjoneringLikevel && (
                                <div className="p-2 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700">
                                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                                    ✓ Tiltak: {formData.regelverk === "BF85" ? "Brannvegg" : "Seksjoneringsvegg"} etableres som nytt tiltak iht. {formData.regelverk === "BF85" ? "BF85 Kap. 30:6" : "TEK17 § 11-7"}.
                                  </p>
                                </div>
                              )}
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Kommentar / begrunnelse</Label>
                                <Textarea
                                  value={formData.manglerSeksjoneringKommentar}
                                  onChange={(e) => setFormData({ ...formData, manglerSeksjoneringKommentar: e.target.value })}
                                  placeholder={formData.etablererSeksjoneringLikevel
                                    ? "Beskriv hvor og hvordan veggen etableres, oppfyllelse av krav osv..."
                                    : "Beskriv f.eks. hvor brannvegg burde vært, observasjoner, anbefalt tiltak..."}
                                  rows={3}
                                  className="bg-background text-xs"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        );
                      })()}

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
                      {formData.regelverk === "BF85" && ["Industri", "Kraftstasjon", "Kontor", "Garasje", "Lager"].includes(formData.bygningstype) && (() => {
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
                                <Select
                                  value={formData.bf85_34_brannbelastning}
                                  onValueChange={(value) => setFormData({...formData, bf85_34_brannbelastning: value})}
                                >
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Velg intervall..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="25">Under 50 MJ/m²</SelectItem>
                                    <SelectItem value="125">50 – 200 MJ/m²</SelectItem>
                                    <SelectItem value="300">200 – 400 MJ/m²</SelectItem>
                                    <SelectItem value="500">Over 400 MJ/m²</SelectItem>
                                  </SelectContent>
                                </Select>
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
                            {(formData.bygningstype === "Industri" || formData.bygningstype === "Kraftstasjon") && (
                              <div className="text-xs border rounded-md overflow-hidden">
                                <div className="px-2 py-1 bg-muted/50 font-semibold">Tabell 34:23 – referanse (kun aktuell rad tas med i rapporten)</div>
                                <table className="w-full">
                                  <thead className="bg-muted/30">
                                    <tr>
                                      <th className="text-left p-2 font-medium">Brannbelastning (MJ/m²)</th>
                                      <th className="text-left p-2 font-medium">Uten tiltak</th>
                                      <th className="text-left p-2 font-medium">Med brannventilasjon</th>
                                      <th className="text-left p-2 font-medium">Med sprinkleranlegg</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bf85Tabell3423.map((row) => {
                                      const bb = parseFloat(formData.bf85_34_brannbelastning) || 0;
                                      const aktiv = bb > 0 && bb >= row.brannbelastningMin && bb < row.brannbelastningMax;
                                      return (
                                        <tr key={row.brannbelastningLabel} className={aktiv ? "bg-primary/15 font-semibold" : ""}>
                                          <td className="p-2 border-t">{row.brannbelastningLabel}</td>
                                          <td className="p-2 border-t">{row.utenTiltak ? `${row.utenTiltak} m²` : "—"}</td>
                                          <td className="p-2 border-t">{row.medBrannventilasjon ? `${row.medBrannventilasjon} m²` : "—"}</td>
                                          <td className="p-2 border-t">{row.medSprinkler ? `${row.medSprinkler} m²` : "—"}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
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

                      {/* RKL6: Toggle for sykehus/pleieinstitusjon (vertikal seksjonering) */}
                      {formData.regelverk !== "BF85" && formData.risikoklasse === "RK6" && (
                        <div className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                          <Checkbox
                            id="erSykehusPleieinstitusjon"
                            checked={formData.erSykehusPleieinstitusjon}
                            onCheckedChange={(checked) => setFormData({...formData, erSykehusPleieinstitusjon: !!checked})}
                          />
                          <label htmlFor="erSykehusPleieinstitusjon" className="text-xs cursor-pointer leading-snug">
                            <span className="font-medium">Bygget er beregnet for sykehus, sykehjem eller andre pleieinstitusjoner</span>
                            <br />
                            <span className="text-muted-foreground">Dersom dette er huket av, gjelder krav om vertikal oppdeling i minst to brannseksjoner (jf. VTEK § 11-7).</span>
                          </label>
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

                      {/* Dører og vinduer i seksjoneringsveggen - kun når seksjonering er påkrevd */}
                      {(formData.erSykehusPleieinstitusjon || (formData.areal && formData.brannseksjonBrannenergi && formData.brannseksjonTiltak && (() => {
                        const arealNum = parseFloat(formData.areal) || 0;
                        const g = seksjoneringsGrenser[formData.brannseksjonBrannenergi];
                        if (!g) return false;
                        const maksAreal = g[formData.brannseksjonTiltak as keyof typeof g];
                        if (maksAreal === Infinity || maksAreal === 0) return false;
                        return arealNum > maksAreal;
                      })())) && (
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
                      )}

                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.regelverk === "BF85" ? (
                            <>
                              <li>Krav til brannteknisk oppdeling med brannvegg og branndekke iht. BF85 Kap. 30:6</li>
                              <li>Krav til utførelse av brannvegg og branndekke, samt gjennomføringer (Kap. 30:61–62)</li>
                              <li>Maks bruttoareal pr. etasje uten oppdeling iht. tabeller for aktuell bygningstype (Kap. 31–39)</li>
                            </>
                          ) : (
                            <>
                              <li>Brannseksjoneringskrav basert på bygningstype og brannbelastning</li>
                              <li>Krav til seksjoneringsvegger (brannvegg) med riktig brannmotstand</li>
                              <li>Areal- og brannbelastningsgrenser for oppdeling</li>
                            </>
                          )}
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
                    <FravikForParagraf paragrafId="11-7" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-5" label={`3.5 ${formData.regelverk === "BF85" ? "Brannceller (§ 11-8)" : "§ 11-8 Brannceller"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.5 {formData.regelverk === "BF85" ? "Brannceller (Kap. 30:33, 30:63–65)" : "§ 11-8 Brannceller"}</Label>
                      </div>
                      {formData.regelverk === "BF85" && (() => {
                        const bf85KravMap: Record<string, { branncellebegrensende: string; dorKrav: string }> = {
                          "1": { branncellebegrensende: "A 60", dorKrav: "A 30" },
                          "2": { branncellebegrensende: "B 60", dorKrav: "B 30" },
                          "3": { branncellebegrensende: "B 30", dorKrav: "B 15" },
                          "4": { branncellebegrensende: "B 30", dorKrav: "B 15" },
                        };
                        const krav = bf85KravMap[formData.bygningsbrannklasse || ""] || { branncellebegrensende: "[velg BBK]", dorKrav: "[velg BBK]" };
                        return (
                          <div className="text-xs space-y-2 mb-3">
                            <p className="font-semibold text-foreground">Kap. 30:63 – Branncelleinndeling</p>
                            <p className="text-foreground/80">Bygning skal inndeles på hensiktsmessig måte i brannceller med konstruksjon etter Tabell 30:41. Ikke-bærende branncellebegrensende bygningsdel: <span className="font-semibold">{krav.branncellebegrensende}</span>.</p>
                            <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                              <li>Brannceller må ikke ha form eller innredning som gjør varsling og rømning ved brann vanskelig.</li>
                              <li>Sjakter som ikke ligger i tilknytning til trapperom skal utføres som egne brannceller.</li>
                              <li>Dører i branncellebegrensende vegger skal ha minst 1/2 av veggens brannmotstand – dvs. minst <span className="font-semibold">{krav.dorKrav}</span>.</li>
                            </ul>
                          </div>
                        );
                      })()}
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
                                  {formData.regelverk === "BF85" && type.id === "tekniske_rom" ? "p. Tekniske rom og ventilasjonsrom" : type.label}
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
                            { id: "bf85_branncelle_branncelle", label: "Branncelle – branncelle" },
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
                        {formData.regelverk === "BF85" && (
                          <div className="mb-2">
                            <Label className="text-xs font-medium mb-1 block">Er heissjakt relevant for bygget?</Label>
                            <Select
                              value={formData.heissjaktRelevantBF85 || ""}
                              onValueChange={(value: "ja" | "nei") => setFormData({...formData, heissjaktRelevantBF85: value})}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Velg..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ja">Ja – bygget har heissjakt</SelectItem>
                                <SelectItem value="nei">Nei – bygget har ikke heis</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground mt-1">Mange eldre bygg har ikke heis. Velg "Nei" for å utelate heissjakt-kravene fra rapporten.</p>
                          </div>
                        )}
                        {(formData.regelverk !== "BF85" || formData.heissjaktRelevantBF85 === "ja") && (() => {
                          const getHeissjaktkravOriginalTekst = () => {
                            if (formData.regelverk === "BF85") {
                              return "Heissjakt skal være egen branncelle med brannmotstand minst A 60. Heisen skal ha egen krets for strømtilkobling. Det var ikke flere branntekniske krav til heisen i Byggeforskrift 1985.";
                            }
                            const etasjerNum = parseInt(formData.etasjer || '0', 10);
                            const kravListe = [
                              "1. I byggverk med inntil 8 etasjer må heissjakten røykventileres, eller det må etableres luftsluse (mellomliggende rom) utført som egen, ventilert branncelle, mellom heissjakten og tilstøtende rom.",
                            ];
                            if (etasjerNum > 8) {
                              kravListe.push("2. Heissjakt i byggverk med mer enn 8 etasjer må røykventileres og i tillegg utføres med luftsluse som beskrevet i nr. 1.");
                            }
                            const offset = kravListe.length;
                            kravListe.push(`${offset + 1}. Dør må ha samme brannmotstand som veggen den står i, med unntak som gitt i nr. ${offset + 2} og ${offset + 3}.`);
                            kravListe.push(`${offset + 2}. I heissjakt med brannmotstand EI 60 kan det benyttes heisdør minst E 90 [F 90]. Heisdør kan utføres uten klasse Sₐ.`);
                            kravListe.push(`${offset + 3}. Brannmotstand for dør fra tilstøtende rom til luftsluse som beskrevet i nr. 1${etasjerNum > 8 ? " og 2" : ""} må være minst EI 30-Sₐ.`);
                            return kravListe.join("\n\n");
                          };

                          const originalTekst = getHeissjaktkravOriginalTekst();

                          // Auto-populate if empty
                          if (!formData.heissjaktkravTekst && originalTekst) {
                            setTimeout(() => setFormData({...formData, heissjaktkravTekst: originalTekst}), 0);
                          }

                          return (
                            <div>
                              {formData.regelverk === "BF85" && (
                                <div className="mb-2 p-2 bg-accent/50 rounded text-xs">
                                  <span className="font-medium">BF85 heissjakt-krav</span>
                                  <span className="text-muted-foreground ml-1">(Kap. 30:33/30:65)</span>
                                </div>
                              )}
                              <div className="flex justify-end mb-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] h-6 px-2"
                                  onClick={() => setFormData({...formData, heissjaktkravTekst: originalTekst})}
                                >
                                  Sett original tekst
                                </Button>
                              </div>
                              <Textarea
                                value={formData.heissjaktkravTekst || ""}
                                onChange={(e) => setFormData({...formData, heissjaktkravTekst: e.target.value})}
                                className="min-h-[160px] text-xs"
                                placeholder="Krav til heissjakt..."
                              />
                            </div>
                          );
                        })()}
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
                            const industriTyper = ["Industri", "Kraftstasjon", "Kontor", "Lager", "Garasje", "Skur"];
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
                          const isSkoleBarneHage = ["Skole", "Barnehage"].includes(formData.bygningstype);

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

                          const getTrapperomKravOriginalTekst = () => {
                            // Collect all Tr types across building parts
                            const allTrTypes = new Set<string>();
                            if (trType) allTrTypes.add(trType);
                            if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                              formData.bygningsdeler.forEach((del: any) => {
                                const rkDel = parseInt(del.risikoklasse?.replace(/\D/g, '') || '0', 10);
                                const flDel = parseInt(del.etasjer || formData.etasjer, 10) || 0;
                                if (rkDel >= 1 && rkDel <= 6 && flDel > 0) {
                                  allTrTypes.add(flDel <= 8 ? trapperomTypeMap[rkDel].lav : trapperomTypeMap[rkDel].hoy);
                                }
                              });
                            }

                            const filteredKrav = trapperomKravListe.filter((krav) => {
                              if (krav.id === "tr_romningsvei_videre" || krav.id === "tr_mellomliggende_rom") {
                                return formData.trapperomIkkeDirekteTilFri;
                              }
                              if (allTrTypes.size > 0) {
                                if (krav.id === "tr1_dor_bruksenhet") return allTrTypes.has("Tr 1");
                                if (krav.id === "tr2_eget_rom") return allTrTypes.has("Tr 2");
                                if (krav.id === "tr3_mellomliggende") return allTrTypes.has("Tr 3");
                                if (krav.id === "tr_roykspredning") return allTrTypes.has("Tr 2") || allTrTypes.has("Tr 3");
                              }
                              return true;
                            });
                            return filteredKrav.map(k => k.label).join("\n\n");
                          };

                          const trapperomOriginalTekst = getTrapperomKravOriginalTekst();

                          // Auto-populate when empty, or auto-update when trapperom type changes
                          // by checking if the current text matches any previously auto-generated text
                          if (trapperomOriginalTekst && !formData.trapperomKravTekst) {
                            setTimeout(() => setFormData({...formData, trapperomKravTekst: trapperomOriginalTekst}), 0);
                          }

                          // Build per-building-part Tr types for display
                          const trapperomPerDel: { index: number; navn: string; trType: string | null; rk: number; floors: number }[] = [];
                          if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                            trapperomPerDel.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', trType: trType, rk, floors });
                            formData.bygningsdeler.forEach((del: any, i: number) => {
                              const rkDel = parseInt(del.risikoklasse?.replace(/\D/g, '') || '0', 10);
                              const flDel = parseInt(del.etasjer || formData.etasjer, 10) || 0;
                              const trDel = rkDel >= 1 && rkDel <= 6 && flDel > 0
                                ? (flDel <= 8 ? trapperomTypeMap[rkDel].lav : trapperomTypeMap[rkDel].hoy)
                                : null;
                              trapperomPerDel.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, trType: trDel, rk: rkDel, floors: flDel });
                            });
                          }
                          const showMultipleTrInput = trapperomPerDel.length > 1;

                          return (
                            <>
                              {showMultipleTrInput ? (
                                <div className="mb-2 p-2 bg-accent/50 rounded text-xs space-y-1">
                                  <span className="font-medium">Automatisk bestemte trapperomtyper:</span>
                                  {trapperomPerDel.map(d => (
                                    <div key={d.index}>
                                      <span className="font-bold">{d.navn}:</span>{" "}
                                      <span className="font-bold">{d.trType || "Ikke bestemt"}</span>
                                      <span className="text-muted-foreground ml-1">(RK{d.rk}, {d.floors} etasje{d.floors > 1 ? "r" : ""})</span>
                                    </div>
                                  ))}
                                </div>
                              ) : trType ? (
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
                              {/* Spørsmål om trapperom som ikke leder direkte til det fri */}
                              <div className="mb-2 flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded">
                                <Checkbox
                                  id="trapperom-ikke-direkte-fri"
                                  checked={formData.trapperomIkkeDirekteTilFri}
                                  onCheckedChange={(checked) => {
                                    const newFormData = {...formData, trapperomIkkeDirekteTilFri: !!checked, trapperomKravTekst: ""};
                                    if (!checked) {
                                      newFormData.trapperomKrav = formData.trapperomKrav.filter(
                                        (k: string) => k !== "tr_romningsvei_videre" && k !== "tr_mellomliggende_rom"
                                      );
                                    }
                                    setFormData(newFormData);
                                  }}
                                />
                                <label htmlFor="trapperom-ikke-direkte-fri" className="text-xs leading-tight cursor-pointer text-amber-800 dark:text-amber-300">
                                  Bygget har trapperom som ikke leder direkte til det fri
                                </label>
                              </div>
                              <div className="flex justify-end mb-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] h-6 px-2"
                                  onClick={() => setFormData({...formData, trapperomKravTekst: trapperomOriginalTekst})}
                                >
                                  Sett original tekst
                                </Button>
                              </div>
                              <Textarea
                                value={formData.trapperomKravTekst || ""}
                                onChange={(e) => setFormData({...formData, trapperomKravTekst: e.target.value})}
                                className="min-h-[200px] text-xs"
                                placeholder="Krav til trapperom..."
                              />
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
                            const krevd = etasjer > 2;
                            const isOver8 = etasjer > 8;
                            const checked = formData.roykKontrollKrav.includes("bf85_royk_brannventilasjon");
                            return (
                              <>
                                <div className="flex items-start space-x-2">
                                  <Checkbox
                                    id="royk-bf85_royk_brannventilasjon"
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                      if (c) {
                                        setFormData({...formData, roykKontrollKrav: [...formData.roykKontrollKrav, "bf85_royk_brannventilasjon"]});
                                      } else {
                                        setFormData({...formData, roykKontrollKrav: formData.roykKontrollKrav.filter((k: string) => k !== "bf85_royk_brannventilasjon")});
                                      }
                                    }}
                                  />
                                  <label htmlFor="royk-bf85_royk_brannventilasjon" className="text-xs leading-tight cursor-pointer">
                                    For bygninger med inntil 8 etasjer kan brannventilasjonen skje gjennom vindu i trapperom. Alle andre bygninger skal ha røyksjakt som er skilt fra loft i minst A 30 og som har et tverrsnitt på minst 1 m². Sjakten skal gå 20 cm over takflaten.
                                  </label>
                                </div>
                                {krevd && !checked && (
                                  <div className="text-xs text-destructive border-l-2 border-destructive pl-2 mt-1">
                                    Avvik: Bygg med flere enn 2 etasjer skal ha brannventilasjon i trapperom etter BF85 §78. Beskriv vurdering i tilstandsvurderingen nederst i kapittelet.
                                  </div>
                                )}
                              </>
                            );
                          })() : (() => {
                            const etasjerNum = parseInt(formData.etasjer, 10) || 0;
                            // Collect all Tr types and max floors across building parts
                            const roykTrapperomTypeMap: Record<number, { lav: string; hoy: string }> = {
                              1: { lav: "Tr 1", hoy: "Tr 3" }, 2: { lav: "Tr 1", hoy: "Tr 3" },
                              3: { lav: "Tr 2", hoy: "Tr 3" }, 4: { lav: "Tr 1", hoy: "Tr 3" },
                              5: { lav: "Tr 2", hoy: "Tr 3" }, 6: { lav: "Tr 2", hoy: "Tr 3" },
                            };
                            const allTrTypesRoyk = new Set<string>();
                            let maxEtasjer = etasjerNum;
                            const rkPrimary = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                            if (rkPrimary >= 1 && rkPrimary <= 6 && etasjerNum > 0) {
                              allTrTypesRoyk.add(etasjerNum <= 8 ? roykTrapperomTypeMap[rkPrimary].lav : roykTrapperomTypeMap[rkPrimary].hoy);
                            }
                            if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                              formData.bygningsdeler.forEach((del: any) => {
                                const rkDel = parseInt(del.risikoklasse?.replace(/\D/g, '') || '0', 10);
                                const flDel = parseInt(del.etasjer || formData.etasjer, 10) || 0;
                                if (flDel > maxEtasjer) maxEtasjer = flDel;
                                if (rkDel >= 1 && rkDel <= 6 && flDel > 0) {
                                  allTrTypesRoyk.add(flDel <= 8 ? roykTrapperomTypeMap[rkDel].lav : roykTrapperomTypeMap[rkDel].hoy);
                                }
                              });
                            }

                            const alleRoykKrav = [
                              { id: "royk_romningsvei", label: "Trapperom som er rømningsvei i byggverk med flere enn to etasjer, må røykventileres." },
                              { id: "royk_luke_vindu", label: "I byggverk med inntil 8 etasjer med trapperom Tr 1 eller Tr 2, jf. § 11-13 Tabell 2, er det tilstrekkelig med luke eller vindu med fri åpning minimum 1,0 m² øverst i trapperommet.", condition: () => allTrTypesRoyk.has("Tr 1") || allTrTypesRoyk.has("Tr 2") },
                              { id: "royk_manuell_bryter", label: "Luke eller vindu skal kunne åpnes manuelt med bryter fra inngangsplanet.", condition: () => allTrTypesRoyk.has("Tr 1") || allTrTypesRoyk.has("Tr 2") },
                              { id: "royk_mekanisk_ventilasjon", label: "Mellomliggende rom knyttet til Tr 2 må ha mekanisk balansert ventilasjon.", condition: () => allTrTypesRoyk.has("Tr 2") },
                              { id: "royk_tr3_trykksetting", label: "I byggverk med mer enn 8 etasjer med trapperom Tr 3, jf. § 11-13 Tabell 2, må det mellomliggende rommet være åpent mot det fri, eller trapperommet må trykksettes og det mellomliggende rommet må ha trykkavlastning (røykventilasjon).", condition: () => allTrTypesRoyk.has("Tr 3") && maxEtasjer > 8 },
                              { id: "royk_overbygde_garder", label: "Overbygde gårder og gater må ha røykventilasjon for å hindre røykspredning mellom ulike brannceller som ligger ut mot den overbygde gården.", requiresToggle: true },
                            ];
                            
                            const filtrerteKrav = alleRoykKrav.filter(k => {
                              if (k.condition && !k.condition()) return false;
                              if (k.requiresToggle && !formData.harOverbygdeGarder) return false;
                              return true;
                            });
                            
                            const roykOriginalTekst = filtrerteKrav.map((k, i) => `${i + 1}. ${k.label}`).join("\n\n");
                            
                            if (!formData.roykKontrollKravTekst && roykOriginalTekst) {
                              setTimeout(() => setFormData({...formData, roykKontrollKravTekst: roykOriginalTekst}), 0);
                            }
                            
                            return (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="har-overbygde-garder"
                                      checked={formData.harOverbygdeGarder}
                                      onCheckedChange={(checked) => {
                                        const updated = {...formData, harOverbygdeGarder: !!checked, roykKontrollKravTekst: ""};
                                        setFormData(updated);
                                      }}
                                    />
                                    <label htmlFor="har-overbygde-garder" className="text-xs cursor-pointer">Overbygde gårder/gater</label>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-6 px-2"
                                    onClick={() => setFormData({...formData, roykKontrollKravTekst: roykOriginalTekst})}
                                  >
                                    Sett original tekst
                                  </Button>
                                </div>
                                <Textarea
                                  value={formData.roykKontrollKravTekst || ""}
                                  onChange={(e) => setFormData({...formData, roykKontrollKravTekst: e.target.value})}
                                  className="min-h-[180px] text-xs"
                                  placeholder="Krav til røykkontroll..."
                                />
                              </>
                            );
                          })()}
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
                          {formData.vertikalBrannspredningRelevant && (() => {
                            // Sjekk om sprinkler er påkrevd basert på risikoklasse (alle bygningsdeler)
                            const alleRKVert = formData.harFlereRisikoklasser && formData.bygningsdeler?.length
                              ? (formData.bygningsdeler || []).map((d: any) => d.risikoklasse).filter(Boolean)
                              : formData.risikoklasse ? [formData.risikoklasse] : [];
                            const etasjerNum = parseInt(formData.etasjer, 10) || 0;
                            const erRK6 = alleRKVert.includes("RK6");
                            const erRK4MedHeis = alleRKVert.includes("RK4") && etasjerNum > 3;
                            const harSprinklerKrav = erRK6 || erRK4MedHeis || formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b;
                            // Auto-add vb_sprinkler when sprinkler is required
                            if (harSprinklerKrav && formData.regelverk !== "BF85" && !formData.vertikalBrannspredningKrav.includes("vb_sprinkler")) {
                              setTimeout(() => setFormData({...formData, vertikalBrannspredningKrav: [...formData.vertikalBrannspredningKrav, "vb_sprinkler"]}), 0);
                            }
                            return (
                            <div className="pl-4 space-y-2 border-l-2 border-primary/20 ml-2">
                              {harSprinklerKrav && formData.regelverk !== "BF85" ? (
                                <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded text-xs text-green-800 dark:text-green-200">
                                  <span className="font-medium">✓ Ivaretatt:</span> Byggverket har krav om automatisk sprinkleranlegg ({erRK6 ? "RK 6" : "RK 4 med krav om heis"}), og krav til vertikal brannspredning er dermed ivaretatt gjennom sprinkleranlegget.
                                </div>
                              ) : (
                                <>
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
                                </>
                              )}
                            </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Horisontal brannspredning</Label>
                        <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="vinduBrannspredningRelevant"
                              checked={formData.vinduBrannspredningRelevant}
                              onCheckedChange={(checked) => 
                                setFormData({...formData, vinduBrannspredningRelevant: !!checked, vinduBrannspredningKrav: !!checked ? formData.vinduBrannspredningKrav : [], vinduMotRomningsvei: false})
                              }
                            />
                            <label htmlFor="vinduBrannspredningRelevant" className="text-xs cursor-pointer font-medium">Horisontal brannspredning er relevant</label>
                          </div>
                          {formData.vinduBrannspredningRelevant && (() => {
                            const alleRKHoriz = formData.harFlereRisikoklasser && formData.bygningsdeler?.length
                              ? (formData.bygningsdeler || []).map((d: any) => d.risikoklasse).filter(Boolean)
                              : formData.risikoklasse ? [formData.risikoklasse] : [];
                            const etasjerNum = parseInt(formData.etasjer, 10) || 0;
                            const erRK6 = alleRKHoriz.includes("RK6");
                            const erRK4MedHeis = alleRKHoriz.includes("RK4") && etasjerNum > 3;
                            const harSprinklerHorisontal = erRK6 || erRK4MedHeis || formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b;
                            const bklNum = formData.harFlereRisikoklasser
                              ? (() => { const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)); return nums.length > 0 ? Math.max(...nums) : 0; })()
                              : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
                            const ewKrav = bklNum === 1 ? "EW 30" : "EW 60";

                            if (harSprinklerHorisontal && formData.regelverk !== "BF85") {
                              return (
                                <div className="pl-4 space-y-3 border-l-2 border-primary/20 ml-2">
                                  <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded text-xs text-green-800 dark:text-green-200">
                                    <span className="font-medium">✓ Ivaretatt:</span> Byggverket har krav om automatisk sprinkleranlegg ({erRK6 ? "RK 6" : "RK 4 med krav om heis"}). Horisontal brannspredning via vinduer er ivaretatt, med unntak for vinduer mot rømningsvei.
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="vinduMotRomningsvei"
                                      checked={formData.vinduMotRomningsvei}
                                      onCheckedChange={(checked) => setFormData({...formData, vinduMotRomningsvei: !!checked})}
                                    />
                                    <label htmlFor="vinduMotRomningsvei" className="text-xs cursor-pointer font-medium">Bygget har vinduer mot rømningsvei</label>
                                  </div>
                                  {formData.vinduMotRomningsvei && (
                                    <div className="p-2 bg-accent/50 rounded text-xs">
                                      → Vinduer mot utvendig rømningsvei skal ha brannmotstand <span className="font-semibold">{ewKrav}</span> (brannklasse {bklNum === 1 ? "1" : "2 og 3"}).
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
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
                                          const bklNumLocal = formData.harFlereRisikoklasser
                                            ? (() => { const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)); return nums.length > 0 ? Math.max(...nums) : 0; })()
                                            : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
                                          const erBKL1 = bklNumLocal === 1;
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
                                          const bklNumLocal = formData.harFlereRisikoklasser
                                            ? (() => { const nums = (formData.bygningsdeler || []).map((d: any) => parseInt((d.brannklasse || "").replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)); return nums.length > 0 ? Math.max(...nums) : 0; })()
                                            : parseInt((formData.brannklasse || "").replace(/\D/g, ''), 10) || 0;
                                          const erBKL1 = bklNumLocal === 1;
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
                            );
                          })()}
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
                                setFormData({...formData, branncellerFlerePlanRelevant: !!checked, branncellerFlerePlanKrav: !!checked ? formData.branncellerFlerePlanKrav : [], branncellerFlerePlanOver3: !!checked ? formData.branncellerFlerePlanOver3 : false, branncellerFlerePlanAreal: !!checked ? formData.branncellerFlerePlanAreal : ""})
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
                                      ? <>⚠ Obs: Krav til brannceller over flere plan gjelder ikke for {rkList.filter((rk: number) => rk === 3 || rk === 6).flatMap((rk: number) => rk === 3 ? ["skole", "barnehage"] : ["sykehjem", "sykehus", "omsorgshjem"]).join(", ")}. Dette er et fravik som må dokumenteres.</>
                                      : <>⚠ Obs: Preakseptert ytelse for brannceller over flere plan gjelder kun risikoklasse 1, 2, 4 og 5. Prosjektet inneholder risikoklasse {rkList.filter((rk: number) => rk === 3 || rk === 6).map((rk: number) => `RK ${rk}`).join(" og ")}, som ikke dekkes av denne ytelsen. Dette er et fravik som må dokumenteres.</>
                                    }
                                  </div>
                                ) : null;
                              })()}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="branncellerFlerePlanOver3"
                                    checked={formData.branncellerFlerePlanOver3}
                                    onCheckedChange={(checked) => setFormData({...formData, branncellerFlerePlanOver3: !!checked})}
                                  />
                                  <label htmlFor="branncellerFlerePlanOver3" className="text-xs cursor-pointer font-medium">Branncellen strekker seg over flere enn 3 plan</label>
                                </div>
                                {formData.branncellerFlerePlanOver3 && (
                                  <div className="bg-destructive/10 border border-destructive/30 rounded p-2 text-xs text-destructive font-medium">
                                    {formData.regelverk === "BF85"
                                      ? "⚠ Obs: Hovedregel etter BF85 er åpen forbindelse over inntil 3 plan. Flere plan i samme branncelle må dokumenteres som fravik."
                                      : "⚠ Obs: Preakseptert ytelse tillater åpen forbindelse over inntil 3 plan. Branncelle over flere enn 3 plan er ikke dekket av preakseptert ytelse og må dokumenteres som fravik."
                                    }
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium block">Samlet areal av branncellen over flere plan</Label>
                                <RadioGroup
                                  value={formData.branncellerFlerePlanAreal || ""}
                                  onValueChange={(val) => setFormData({...formData, branncellerFlerePlanAreal: val as "under800" | "over800"})}
                                  className="flex flex-col gap-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="under800" id="bcfp_areal_under800" />
                                    <label htmlFor="bcfp_areal_under800" className="text-xs cursor-pointer">Under 800 m²</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="over800" id="bcfp_areal_over800" />
                                    <label htmlFor="bcfp_areal_over800" className="text-xs cursor-pointer">Over 800 m²</label>
                                  </div>
                                </RadioGroup>
                                {formData.branncellerFlerePlanAreal === "over800" && formData.regelverk === "BF85" && (
                                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2 text-xs text-amber-800 dark:text-amber-300">
                                    ℹ︎ BF85 krever automatisk slokkeanlegg når branncelle over flere plan har samlet areal &gt; 800 m². Kravet legges automatisk inn i kap. 3.9.
                                  </div>
                                )}
                              </div>
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
                                  setFormData({...formData, garasjeRelevant: !!checked, garasjePlassering: "", garasjeAreal: "", garasjeBruksenhet: "", garasjeKravTekst: ""})
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
                                        onChange={() => setFormData({...formData, garasjePlassering: opt.value as any, garasjeBruksenhet: "", garasjeKravTekst: ""})}
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
                                          onChange={() => setFormData({...formData, garasjeAreal: opt.value as any, garasjeBruksenhet: "", garasjeKravTekst: ""})}
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
                                          onChange={() => setFormData({...formData, garasjeBruksenhet: opt.value as any, garasjeKravTekst: ""})}
                                          className="w-3 h-3"
                                        />
                                        <label htmlFor={`garasje-bruksenhet-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Auto-genererte krav - redigerbar */}
                              {garasjeKravErKomplett && garasjeKravListe.length > 0 && (() => {
                                return (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-semibold">Krav:</Label>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] h-6 px-2"
                                        onClick={() => setFormData({...formData, garasjeKravTekst: garasjeOriginalTekst})}
                                      >
                                        Sett original tekst
                                      </Button>
                                    </div>
                                    <Textarea
                                      value={formData.garasjeKravTekst || ""}
                                      onChange={(e) => setFormData({...formData, garasjeKravTekst: e.target.value})}
                                      className="min-h-[120px] text-xs"
                                      placeholder="Garasjekrav..."
                                    />
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
                                            onChange={() => setFormData({...formData, brenselType: opt.value as any, brenselMengde: ""})}
                                            className="w-3 h-3"
                                          />
                                          <label htmlFor={`brensel-type-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {formData.brenselType && (
                                    <div>
                                      <Label className="text-xs font-medium mb-1 block">Maksimalt antall liter</Label>
                                      <Select value={formData.brenselMengde} onValueChange={(v) => setFormData({...formData, brenselMengde: v})}>
                                        <SelectTrigger className="w-64 h-7 text-xs">
                                          <SelectValue placeholder="Velg mengde..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {formData.brenselType === "fyringsparafin" && (
                                            <>
                                              <SelectItem value="1650">Inntil 1 650 liter</SelectItem>
                                              <SelectItem value="4000">Inntil 4 000 liter</SelectItem>
                                              <SelectItem value="10000">Inntil 10 000 liter</SelectItem>
                                            </>
                                          )}
                                          {formData.brenselType === "lett_fyringsolje" && (
                                            <>
                                              <SelectItem value="4000">Inntil 4 000 liter</SelectItem>
                                              <SelectItem value="10000">Inntil 10 000 liter</SelectItem>
                                            </>
                                          )}
                                          {formData.brenselType === "begge" && (
                                            <SelectItem value="6000">Inntil 6 000 liter</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
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
                          {formData.regelverk === "BF85" ? (
                            <>
                              <li>Krav til branncelleinndeling iht. BF85 Kap. 30:63–64 (avhengig av bruk i Kap. 31–39)</li>
                              <li>Brannmotstand for branncellebegrensende konstruksjoner iht. Tabell 30:41 (bygningsbrannklasse {formData.bygningsbrannklasse || "(ikke angitt)"})</li>
                              <li>Krav til dører i branncellebegrensende vegger iht. BF85</li>
                              <li>Krav til loft og kjeller (Kap. 30:64) og branntetting av gjennomføringer</li>
                            </>
                          ) : (
                            <>
                              <li>Branncellekrav basert på valgte branncelle-typer</li>
                              <li>Brannmotstand for branncellebegrensende konstruksjoner</li>
                              <li>Dørkrav i branncellebegrensende vegger</li>
                              <li>Krav til gjennomføringer og branntetting</li>
                              {formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0 && (() => {
                                const uniqueBkls = new Set(formData.bygningsdeler.map((d: any) => d.brannklasse).filter(Boolean));
                                return uniqueBkls.size > 1 ? (
                                  <li className="font-medium text-foreground">Krav vises separat for hver brannklasse ({[...uniqueBkls].join(', ')})</li>
                                ) : null;
                              })()}
                            </>
                          )}
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
                     {(() => {
                       const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                         || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                       return (
                         <KraftstasjonTilleggskravCard kapittel="3.5" visible={erKraftstasjon}>
                           <div className="text-xs space-y-1">
                             <p className="font-medium text-foreground">Følgende tilleggskrav inkluderes automatisk i rapporten:</p>
                             <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                               <li>Dører til teknisk rom skal være utadslående for å sikre rømningsveier.</li>
                             </ul>
                           </div>
                         </KraftstasjonTilleggskravCard>
                       );
                     })()}
                     {renderTilstandPanel("3_5")}
                    <FravikForParagraf paragrafId="11-8" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-6" label={`3.6 ${formData.regelverk === "BF85" ? "Kledninger og overflater (§ 11-9 Materialer og produkters egenskaper ved brann)" : "§ 11-9 Materialer og produkter"}`}>
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
                          {(() => {
                            const rel = getRelevantBF85_5xx(formData.bygningsbrannklasse, formData.etasjer);
                            const items = [
                              { key: "bf85_513", label: ":513 Yttervegger i B-konstruksjon", show: rel.vis513 },
                              { key: "bf85_514", label: ":514 Fasademateriale på vegg i A-konstruksjon", show: rel.vis514 },
                              { key: "bf85_515", label: ":515 Brennbar isolasjon", show: rel.vis515 },
                              { key: "bf85_53",  label: ":53 Nedforet himling", show: true },
                            ].filter(i => i.show);
                            if (items.length === 0) {
                              return (
                                <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                                  <Label className="text-xs font-medium">Vegger, tak og nedforet himling (:5)</Label>
                                  <p className="text-xs text-muted-foreground">Ingen relevante krav for valgt bygningsbrannklasse og etasjer.</p>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                                <Label className="text-xs font-medium">Vegger, tak og nedforet himling (:5)</Label>
                                <p className="text-[10px] text-muted-foreground">Filtrert etter bygningsbrannklasse {rel.bklNum || "?"} og {rel.etasjerNum || "?"} etasjer.</p>
                                {items.map((item) => (
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
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          {/* §11-9 organisert etter veilederens delkapitler A-I */}
                          {(() => {
                            const rk = formData.risikoklasse;
                            const bkl = formData.brannklasse;
                            const isRK6 = rk === "RK6";
                            const isRK1to5 = ["RK1","RK2","RK3","RK4","RK5"].includes(rk);
                            return (

                              <>
                                {/* A. Generelt */}
                                <div className="p-3 bg-muted/30 rounded-md border space-y-1">
                                  <Label className="text-xs font-semibold">A. Generelt</Label>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Brannteknisk klassifisering iht. §11-9 gjelder for kombinasjonen overflate + underlag. Klasse angis etter NS-EN 13501-1, med norsk klassifisering i klammer der det er etablert (f.eks. <code>D-s2,d0 [In 2]</code>, <code>K₂10 A2-s1,d0 [K1-A]</code>). Krav nedenfor genereres automatisk basert på risikoklasse ({rk || "ikke angitt"}) og brannklasse ({bkl || "ikke angitt"}).
                                  </p>
                                </div>

                                {/* B. Innvendige overflater og kledninger */}
                                <Kap36SubSection title="B. Innvendige overflater og kledninger" open={!!kap36Open["B"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "B": o }))}>
                                  {/* Tabell 1A: RK1-RK5 */}
                                  {isRK1to5 && (
                                    <div>
                                      <Label className="text-xs font-bold mb-2 block">Tabell 1A – Ytelser til overflater og kledninger for risikoklasse 1–5</Label>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse border border-border">
                                          <thead>
                                            <tr className="bg-muted/50">
                                              <th className="border border-border p-2 text-left font-medium">Bygningsdel</th>
                                              <th className="border border-border p-2 text-center font-medium">BKL 1</th>
                                              <th className="border border-border p-2 text-center font-medium">BKL 2</th>
                                              <th className="border border-border p-2 text-center font-medium">BKL 3</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {[
                                              { label: "Overflater på vegger og i tak – branncelle ≤ 200 m²", vals: ["D-s2,d0 [In 2]", "D-s2,d0 [In 2]", "D-s2,d0 [In 2]"] },
                                              { label: "Overflater på vegger og i tak – branncelle > 200 m²", vals: ["D-s2,d0 [In 2]", "B-s1,d0 [In 1]", "B-s1,d0 [In 1]"] },
                                              { label: "Overflater på vegger og i tak – rømningsvei", vals: ["B-s1,d0 [In 1]", "B-s1,d0 [In 1]", "B-s1,d0 [In 1]"] },
                                              { label: "Overflater på gulv – branncelle", vals: ["Dfl-s1 [G]", "Dfl-s1 [G]", "Dfl-s1 [G]"] },
                                              { label: "Overflater på gulv – rømningsvei", vals: ["Dfl-s1 [G]", "Dfl-s1 [G]", "Dfl-s1 [G]"] },
                                              { label: "Kledning på vegger og i tak – branncelle", vals: ["K₂10 D-s2,d0 [K2]", "K₂10 B-s1,d0 [K1]", "K₂10 B-s1,d0 [K1]"] },
                                              { label: "Kledning på vegger og i tak – rømningsvei", vals: ["K₂10 B-s1,d0 [K1]", "K₂10 A2-s1,d0 [K1-A]", "K₂10 A2-s1,d0 [K1-A]"] },
                                            ].map((row) => (
                                              <tr key={row.label}>
                                                <td className="border border-border p-2 align-top">{row.label}</td>
                                                {row.vals.map((v, i) => {
                                                  const colBkl = `BKL${i + 1}`;
                                                  const active = bkl === colBkl;
                                                  return (
                                                    <td key={i} className={`border border-border p-2 text-center ${active ? "bg-primary/10 font-bold" : ""}`}>{v}</td>
                                                  );
                                                })}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {bkl && (
                                        <p className="text-xs text-primary font-medium mt-2">Brannklasse {bkl} er markert i tabellen.</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Tabell 1B: RK6 */}
                                  {isRK6 && (
                                    <div>
                                      <Label className="text-xs font-bold mb-2 block">Tabell 1B – Ytelser til overflater og kledninger for risikoklasse 6 (skjerpede krav)</Label>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse border border-border">
                                          <thead>
                                            <tr className="bg-muted/50">
                                              <th className="border border-border p-2 text-left font-medium">Bygningsdel</th>
                                              <th className="border border-border p-2 text-center font-medium">Krav (RK6)</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {[
                                              { label: "Overflater på vegger og i tak – branncelle ≤ 200 m²", val: "B-s1,d0 [In 1]" },
                                              { label: "Overflater på vegger og i tak – branncelle > 200 m²", val: "B-s1,d0 [In 1]" },
                                              { label: "Overflater på vegger og i tak – rømningsvei", val: "A2-s1,d0 [ubrennbart]" },
                                              { label: "Overflater på gulv – branncelle", val: "Dfl-s1 [G]" },
                                              { label: "Overflater på gulv – rømningsvei", val: "Dfl-s1 [G]" },
                                              { label: "Kledning på vegger og i tak – branncelle", val: "K₂10 B-s1,d0 [K1]" },
                                              { label: "Kledning på vegger og i tak – rømningsvei", val: "K₂10 A2-s1,d0 [K1-A]" },
                                            ].map((row) => (
                                              <tr key={row.label}>
                                                <td className="border border-border p-2 align-top">{row.label}</td>
                                                <td className="border border-border p-2 text-center bg-primary/10 font-bold">{row.val}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Eksisterende noter (matNote2/3/4) */}
                                  <div className="space-y-2 p-2 bg-muted/30 rounded border mt-2">
                                    <Label className="text-xs font-medium">Velg relevante presiseringer:</Label>
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="matNote2" checked={formData.matNote2} onCheckedChange={(c) => setFormData({...formData, matNote2: !!c})} />
                                      <label htmlFor="matNote2" className="text-xs cursor-pointer leading-relaxed">
                                        Overflater i hulrom betraktes på samme måte som innvendig overflate og må ha minst like gode branntekniske egenskaper.
                                      </label>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="matNote3" checked={formData.matNote3} onCheckedChange={(c) => setFormData({...formData, matNote3: !!c})} />
                                      <label htmlFor="matNote3" className="text-xs cursor-pointer leading-relaxed">
                                        Rom med brannfarlig virksomhet må ha kledning som tilfredsstiller klasse K₂10 A2-s1,d0 [K1-A]. Eksempel: rom hvor det oppbevares fyrverkeri, brannfarlig væske kategori 1 og 2, eller rom hvor det utføres varme arbeider (sveising, sliping, åpen varme).
                                      </label>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="matNote4" checked={formData.matNote4} onCheckedChange={(c) => setFormData({...formData, matNote4: !!c})} />
                                      <label htmlFor="matNote4" className="text-xs cursor-pointer leading-relaxed">
                                        Selv om sikkerhet ved brann dokumenteres ved analyse, må innvendige overflater på vegger og i himlinger ha minst klasse D-s2,d0 [In 2]. Lavere ytelse kan gi uakseptabelt bidrag til brannutviklingen.
                                      </label>
                                    </div>
                                  </div>
                                </Kap36SubSection>

                                {/* C. Nedforet himling i rømningsvei */}
                                <Kap36SubSection title="C. Nedforet himling i rømningsvei" open={!!kap36Open["C"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "C": o }))}>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Preakseptert ytelse: himling i klasse <code>A2-s1,d0 [In 1 på begrenset brennbart underlag]</code> med opphengsystem dokumentert til minst 10 minutter, eller kledning <code>K₂10 A2-s1,d0 [K1-A]</code>.
                                  </p>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="himlingNote1" checked={formData.himlingNote1} onCheckedChange={(c) => setFormData({...formData, himlingNote1: !!c})} />
                                    <label htmlFor="himlingNote1" className="text-xs cursor-pointer leading-relaxed">
                                      Himlingen må tilfredsstille klasse A2-s1,d0 [In 1 på begrenset brennbart underlag] og ha et opphengsystem med dokumentert brannmotstand minst 10 minutter for den aktuelle eksponering, eller bestå av kledning K₂10 A2-s1,d0 [K1-A].
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="himlingNote2" checked={formData.himlingNote2} onCheckedChange={(c) => setFormData({...formData, himlingNote2: !!c})} />
                                    <label htmlFor="himlingNote2" className="text-xs cursor-pointer leading-relaxed">
                                      Overflater og kledninger i hulrom over himlingen må ha minst like gode branntekniske egenskaper som overflatene og kledningene i rømningsveien for øvrig.
                                    </label>
                                  </div>
                                </Kap36SubSection>

                                {/* D. Isolasjon i bygningsdeler */}
                                <Kap36SubSection title="D. Isolasjon i bygningsdeler" open={!!kap36Open["D"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "D": o }))}>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Hovedregel: isolasjon må tilfredsstille klasse <code>A2-s1,d0</code>. Brennbar isolasjon kan likevel anvendes iht. en av de tre alternative måtene under veilederen:
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Checkbox id="isolasjonSandwich" checked={formData.isolasjonSandwich === "relevant"} onCheckedChange={(c) => setFormData({...formData, isolasjonSandwich: c ? "relevant" : "ikke_relevant"})} />
                                    <label htmlFor="isolasjonSandwich" className="text-xs cursor-pointer">Bruk av sandwichelementer</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox id="isolasjonBrennbar" checked={formData.isolasjonBrennbar === "relevant"} onCheckedChange={(c) => setFormData({...formData, isolasjonBrennbar: c ? "relevant" : "ikke_relevant"})} />
                                    <label htmlFor="isolasjonBrennbar" className="text-xs cursor-pointer">Bruk av brennbar isolasjon</label>
                                  </div>
                                  <div className="border-t pt-2 mt-2 space-y-1">
                                    <Label className="text-xs font-medium">Alternative måter brennbar isolasjon kan anvendes på:</Label>
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="isoTildekketMurStop" checked={formData.isoTildekketMurStop} onCheckedChange={(c) => setFormData({...formData, isoTildekketMurStop: !!c})} />
                                      <label htmlFor="isoTildekketMurStop" className="text-xs cursor-pointer leading-relaxed">Tildekkes, mures eller støpes inn slik at den ikke involveres i brann.</label>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="isoDokumentertIngenSpredning" checked={formData.isoDokumentertIngenSpredning} onCheckedChange={(c) => setFormData({...formData, isoDokumentertIngenSpredning: !!c})} />
                                      <label htmlFor="isoDokumentertIngenSpredning" className="text-xs cursor-pointer leading-relaxed">Slik utformet at det er dokumentert at den ikke bidrar til brannspredning.</label>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="isoTilbakeholdendeLag" checked={formData.isoTilbakeholdendeLag} onCheckedChange={(c) => setFormData({...formData, isoTilbakeholdendeLag: !!c})} />
                                      <label htmlFor="isoTilbakeholdendeLag" className="text-xs cursor-pointer leading-relaxed">Beskyttet med tilstrekkelig tildekkende eller branntilbakeholdende lag.</label>
                                    </div>
                                  </div>
                                </Kap36SubSection>

                                {/* E. Utvendige overflater og kledning */}
                                <Kap36SubSection title="E. Utvendige overflater og kledning" open={!!kap36Open["E"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "E": o }))}>
                                  <div className="text-xs leading-relaxed space-y-1">
                                    <p>Preaksepterte ytelser iht. veilederen:</p>
                                    <ul className="ml-4 list-disc text-muted-foreground">
                                      <li>Brannklasse 1: <code>D-s3,d0 [Ut 2]</code></li>
                                      <li>Brannklasse 2 og 3: <code>B-s3,d0 [Ut 1]</code></li>
                                      <li>Risikoklasse 6: <code>A2-s1,d0 [ubrennbart]</code> – skjerpet krav uavhengig av brannklasse</li>
                                    </ul>
                                    {isRK6 && (
                                      <p className="text-primary font-medium">Risikoklasse 6 valgt – skjerpet krav A2-s1,d0 gjelder.</p>
                                    )}
                                  </div>
                                  {(bkl === "BKL2" || bkl === "BKL3") && (
                                    <div className="flex items-start gap-2">
                                      <Checkbox id="ytterkledningDKrav" checked={formData.ytterkledningDKrav} onCheckedChange={(c) => setFormData({...formData, ytterkledningDKrav: !!c})} />
                                      <label htmlFor="ytterkledningDKrav" className="text-xs cursor-pointer leading-relaxed">
                                        Det gjøres tiltak for å ivareta D-s3,d0 [Ut 2] krav på ytterkledning (yttervegg utformet slik at den hindrer brannspredning i fasaden).
                                      </label>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="naboavstandUnder8m" checked={formData.naboavstandUnder8m} onCheckedChange={(c) => setFormData({...formData, naboavstandUnder8m: !!c})} />
                                    <label htmlFor="naboavstandUnder8m" className="text-xs cursor-pointer leading-relaxed">
                                      Avstand til nabobyggverk er mindre enn 8 m – skjerpede krav til utvendige overflater og kledning vurderes særskilt.
                                    </label>
                                  </div>
                                </Kap36SubSection>

                                {/* F. Yttertak */}
                                <Kap36SubSection title="F. Yttertak" open={!!kap36Open["F"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "F": o }))}>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Veilederen krever taktekking i klasse <code>BROOF(t2) [Ta]</code> for byggverk i brannklasse 1, 2 og 3. Underlag for taktekkingen og takoppbygging må dokumenteres.
                                  </p>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="tak_broof_t2" checked={formData.tak_broof_t2} onCheckedChange={(c) => setFormData({...formData, tak_broof_t2: !!c})} />
                                    <label htmlFor="tak_broof_t2" className="text-xs cursor-pointer leading-relaxed">
                                      Taktekkingen tilfredsstiller klasse BROOF(t2) [Ta].
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="tak_underlagDokumentert" checked={formData.tak_underlagDokumentert} onCheckedChange={(c) => setFormData({...formData, tak_underlagDokumentert: !!c})} />
                                    <label htmlFor="tak_underlagDokumentert" className="text-xs cursor-pointer leading-relaxed">
                                      Underlag for taktekkingen og dets brannmotstand er dokumentert.
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="tak_oppbyggingDokumentert" checked={formData.tak_oppbyggingDokumentert} onCheckedChange={(c) => setFormData({...formData, tak_oppbyggingDokumentert: !!c})} />
                                    <label htmlFor="tak_oppbyggingDokumentert" className="text-xs cursor-pointer leading-relaxed">
                                      Krav til takoppbygging (isolasjon, sjikt og innfesting) er dokumentert.
                                    </label>
                                  </div>
                                </Kap36SubSection>

                                {/* G. Brannvegg og vinduer i brannvegg */}
                                <Kap36SubSection title="G. Brannvegg og vinduer i brannvegg" open={!!kap36Open["G"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "G": o }))}>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Vinduer og gjennomføringer i brannvegg må ha samme brannmotstand som veggen selv: <code>EI {bkl === "BKL3" ? "120" : "90"} A2-s1,d0</code>{bkl ? ` (basert på brannklasse ${bkl})` : ""}.
                                  </p>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="brannvegg_vinduerSammeBrannmotstand" checked={formData.brannvegg_vinduerSammeBrannmotstand} onCheckedChange={(c) => setFormData({...formData, brannvegg_vinduerSammeBrannmotstand: !!c})} />
                                    <label htmlFor="brannvegg_vinduerSammeBrannmotstand" className="text-xs cursor-pointer leading-relaxed">
                                      Vinduer i brannvegg har dokumentert samme brannmotstand som veggen.
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="brannvegg_gjennomfoeringerSikret" checked={formData.brannvegg_gjennomfoeringerSikret} onCheckedChange={(c) => setFormData({...formData, brannvegg_gjennomfoeringerSikret: !!c})} />
                                    <label htmlFor="brannvegg_gjennomfoeringerSikret" className="text-xs cursor-pointer leading-relaxed">
                                      Gjennomføringer i brannvegg er tettet og dokumentert iht. samme brannmotstand som veggen.
                                    </label>
                                  </div>
                                </Kap36SubSection>

                                {/* H. Rør- og kanalisolasjon */}
                                <Kap36SubSection title="H. Rør- og kanalisolasjon" open={!!kap36Open["H"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "H": o }))}>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Isolasjon på rør og kanaler må tilfredsstille klasse <code>BL-s1,d0</code> i rømningsvei, og klasse <code>A2L-s1,d0</code> i rømningsvei som betjener mer enn én etasje.
                                  </p>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="ror_bl_s1d0" checked={formData.ror_bl_s1d0} onCheckedChange={(c) => setFormData({...formData, ror_bl_s1d0: !!c})} />
                                    <label htmlFor="ror_bl_s1d0" className="text-xs cursor-pointer leading-relaxed">
                                      Rør- og kanalisolasjon i rømningsvei tilfredsstiller BL-s1,d0.
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="ror_a2l_s1d0_flerEtasjer" checked={formData.ror_a2l_s1d0_flerEtasjer} onCheckedChange={(c) => setFormData({...formData, ror_a2l_s1d0_flerEtasjer: !!c})} />
                                    <label htmlFor="ror_a2l_s1d0_flerEtasjer" className="text-xs cursor-pointer leading-relaxed">
                                      Rør- og kanalisolasjon i rømningsvei som betjener mer enn én etasje tilfredsstiller A2L-s1,d0.
                                    </label>
                                  </div>
                                </Kap36SubSection>

                                {/* I. Småhus */}
                                <Kap36SubSection title="I. Småhus (eneboliger, rekkehus, tomannsbolig inntil 2 etasjer)" open={!!kap36Open["I"]} onOpenChange={(o) => setKap36Open(prev => ({ ...prev, "I": o }))}>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    For boligbygninger inntil 2 etasjer (småhus) gjelder lempninger i preaksepterte ytelser. Velg lempninger som anvendes:
                                  </p>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="smahus_lempningOverflater" checked={formData.smahus_lempningOverflater} onCheckedChange={(c) => setFormData({...formData, smahus_lempningOverflater: !!c})} />
                                    <label htmlFor="smahus_lempningOverflater" className="text-xs cursor-pointer leading-relaxed">
                                      Lempninger for overflater anvendes for småhus.
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="smahus_lempningKledning" checked={formData.smahus_lempningKledning} onCheckedChange={(c) => setFormData({...formData, smahus_lempningKledning: !!c})} />
                                    <label htmlFor="smahus_lempningKledning" className="text-xs cursor-pointer leading-relaxed">
                                      Lempninger for kledning anvendes for småhus.
                                    </label>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Checkbox id="smahus_lempningTaktekning" checked={formData.smahus_lempningTaktekning} onCheckedChange={(c) => setFormData({...formData, smahus_lempningTaktekning: !!c})} />
                                    <label htmlFor="smahus_lempningTaktekning" className="text-xs cursor-pointer leading-relaxed">
                                      Taktekning kan være uklassifisert når avstand mellom byggverk er minst 8 m.
                                    </label>
                                  </div>
                                </Kap36SubSection>
                              </>
                            );
                          })()}
                        </>

                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.regelverk === "BF85" ? (
                            <>
                              <li>Krav til innvendige og utvendige overflater og kledninger iht. BF85 Tabell 30:42 (bygningsbrannklasse {formData.bygningsbrannklasse || "(ikke angitt)"})</li>
                              <li>Ytterveggers brannmotstand iht. Tabell 30:512</li>
                              <li>B-konstruksjoner iht. Kap. 30:513 og krav til fasademateriale (Kap. 30:514)</li>
                              <li>Brennbar isolasjon iht. Kap. 30:515 (kun bygningsbrannklasse 3 og 4, inntil 2 etasjer)</li>
                              <li>Krav til taktekning og nedforet himling</li>
                            </>
                          ) : (
                            <>
                              <li>Generelle krav til materialer og produkters egenskaper ved brann</li>
                              <li>Krav til innvendige overflater og kledninger basert på {formData.risikoklasse === "RK6" ? "risikoklasse 6 (strengeste nivå)" : `brannklasse ${formData.brannklasse || "(ikke angitt)"}`}</li>
                              <li>Særkrav for overflater og kledninger i rømningsveier</li>
                              <li>Utvendige overflater tilpasset brannklasse og risikoklasse</li>
                              <li>Kledningskrav basert på {formData.risikoklasse === "RK6" ? "risikoklasse 6" : `brannklasse ${formData.brannklasse || "(ikke angitt)"}`}</li>
                              <li>Taktekning{(formData.risikoklasse === "RK4" || (formData.risikoklasse === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig"))) ? " inkl. småhus-unntak" : ""}</li>
                              <li>Krav til isolasjon og sandwichelementer</li>
                            </>
                          )}
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
                    <FravikForParagraf paragrafId="11-9" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-7" label={`3.7 ${formData.regelverk === "BF85" ? "Tekniske installasjoner (§ 11-10)" : "§ 11-10 Tekniske installasjoner"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.7 {formData.regelverk === "BF85" ? "Ventilasjon og installasjoner (§ 11-10 Tekniske installasjoner)" : "§ 11-10 Tekniske installasjoner"}</Label>
                      </div>
                      
                      {formData.regelverk === "BF85" ? (
                        <>
                          {/* BF85 Ventilasjonsanlegg */}
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="ventilasjonRelevant_bf85"
                                checked={!!formData.ventilasjonRelevant}
                                onCheckedChange={(checked) => setFormData({...formData, ventilasjonRelevant: !!checked})}
                              />
                              <label htmlFor="ventilasjonRelevant_bf85" className="text-xs font-medium cursor-pointer">
                                Ventilasjonsanlegg er installert / relevant
                              </label>
                            </div>
                            {!formData.ventilasjonRelevant && (
                              <p className="text-[11px] italic text-muted-foreground ml-6">
                                Rapporten vil angi at ventilasjonsanlegg ikke er installert.
                              </p>
                            )}
                            {formData.ventilasjonRelevant && (
                              <div className="ml-6 space-y-2 pt-2 border-t">
                                <Label className="text-xs text-muted-foreground">Tilleggskrav (TEK17 §11-10 brukes som vurderingsgrunnlag):</Label>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="ventKrav5_bf85"
                                    checked={formData.ventKrav5}
                                    onCheckedChange={(checked) => setFormData({...formData, ventKrav5: !!checked})}
                                  />
                                  <label htmlFor="ventKrav5_bf85" className="text-xs cursor-pointer">
                                    Storkjøkken/frityr - EI 30 A2-s1,d0
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="ventKrav6_bf85"
                                    checked={formData.ventKrav6}
                                    onCheckedChange={(checked) => setFormData({...formData, ventKrav6: !!checked})}
                                  />
                                  <label htmlFor="ventKrav6_bf85" className="text-xs cursor-pointer">
                                    Kjøkken boenheter - EI 15 A2-s1,d0
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="ventKrav9_bf85"
                                    checked={formData.ventKrav9}
                                    onCheckedChange={(checked) => setFormData({...formData, ventKrav9: !!checked})}
                                  />
                                  <label htmlFor="ventKrav9_bf85" className="text-xs cursor-pointer">
                                    Brannspjeld i seksjoneringsvegg
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* BF85 Elektriske installasjoner */}
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="elektriskRelevant_bf85"
                                checked={!!formData.elektriskRelevant}
                                onCheckedChange={(checked) => setFormData({...formData, elektriskRelevant: !!checked})}
                              />
                              <label htmlFor="elektriskRelevant_bf85" className="text-xs font-medium cursor-pointer">
                                Elektriske installasjoner er relevant
                              </label>
                            </div>
                            {formData.elektriskRelevant && (
                              <p className="text-[11px] italic text-muted-foreground ml-6">
                                BF85 viser kun til gjeldende forskrifter for elektriske anlegg. TEK17 §11-10 og preaksepterte ytelser legges til grunn som vurderingsgrunnlag.
                              </p>
                            )}
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
                                {(formData.risikoklasse === "RK4" || (formData.risikoklasse === "RK6" && (formData.bygningstype || "").toLowerCase().includes("bolig"))) && (
                                  <>
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
                                  </>
                                )}
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
                                {(formData.erSykehusPleieinstitusjon || isSeksjoneringRequired(formData.areal, formData.brannseksjonBrannenergi, formData.brannseksjonTiltak)) && (
                                  <div className="flex items-center gap-2 p-2 mt-1 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 rounded text-xs text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                                    <span>Ventilasjonskanaler gjennom seksjonering kontrollert?</span>
                                  </div>
                                )}
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
                        {formData.regelverk === "BF85" ? (
                          <>
                            <p className="italic text-foreground/70">BF85 Kap. 47 stiller kun generelle krav om at anlegg ikke skal medføre økt risiko for brann. TEK17 § 11-10 og preaksepterte ytelser legges derfor til grunn som vurderingsgrunnlag.</p>
                            <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                              {formData.ventilasjonRelevant ? (
                                <>
                                  <li>Ventilasjonskanal gjennom brannskillende bygningsdel må opprettholde brannmotstand</li>
                                  <li>Innfesting og oppheng for kanaler og ventilasjonsutstyr må opprettholde funksjonstid og brannmotstand</li>
                                  <li>Avtrekk fra komfyr må føres i egen kanal</li>
                                  <li>Ventilasjonsanlegg utføres i materialer i klasse A2-s1,d0</li>
                                  {formData.ventKrav5 && <li>Storkjøkken/frityr: avtrekkskanal med brannmotstand minst EI 30 A2-s1,d0</li>}
                                  {formData.ventKrav6 && <li>Kjøkken i boenheter: avtrekkskanal med brannmotstand minst EI 15 A2-s1,d0</li>}
                                  {formData.ventKrav7 && <li>Småhus: avtrekkskanaler i stål eller aluminium</li>}
                                  {formData.ventKrav8 && <li>Småhus: kanaler i klasse E gjennom branncellebegrensende konstruksjoner</li>}
                                  {formData.ventKrav9 && (((formData.bygningstype || "").toLowerCase().includes("kraftstasjon") || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon")))
                                    ? <li>Brannspjeld i seksjoneringsvegg – automatisk lukkende, smeltesikring ikke tillatt (kraftstasjon)</li>
                                    : <li>Brannspjeld i seksjoneringsvegg</li>)}
                                  {((formData.bygningstype || "").toLowerCase().includes("kraftstasjon") || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"))) && (
                                    <li>Steng-inne-prinsipp ventilasjon – automatiske brannspjeld kreves (kraftstasjon)</li>
                                  )}
                                </>
                              ) : (
                                <li>Ventilasjonsanlegg er ikke installert</li>
                              )}
                              {formData.elektriskRelevant && (
                                <>
                                  <li>Elektriske installasjoner – TEK17 §11-10 brukes som vurderingsgrunnlag</li>
                                  <li>Kabler over nedforet himling/hulrom i rømningsvei – krav til brannenergi, sjakt, brannmotstand eller sprinkling</li>
                                  <li>Kabler med liten brannenergi (&lt; 50 MJ/lm) kan føres ubeskyttet gjennom rømningsvei</li>
                                </>
                              )}
                            </ul>
                          </>
                        ) : (
                          <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                            {formData.ventilasjonRelevant && (
                              <>
                                <li>Ventilasjonskanaler gjennom brannskillende konstruksjoner må ha brannmotstand</li>
                                <li>Ventilasjonskanaler gjennom branncellebegrensende konstruksjoner må ha brannmotstand tilsvarende konstruksjonen</li>
                                <li>Brannspjeld i kanaler som går gjennom brannskillende konstruksjoner</li>
                                <li>Avtrekkskanal fra rom med brannfarlig virksomhet med brannmotstand EI 30 A2-s1,d0</li>
                                {formData.ventKrav5 && <li>Storkjøkken/frityr: avtrekkskanal med brannmotstand minst EI 30 A2-s1,d0</li>}
                                {formData.ventKrav6 && <li>Kjøkken i boenheter: avtrekkskanal med brannmotstand minst EI 15 A2-s1,d0</li>}
                                {formData.ventKrav7 && <li>Småhus: avtrekkskanaler i stål eller aluminium</li>}
                                {formData.ventKrav8 && <li>Småhus: kanaler i klasse E gjennom branncellebegrensende konstruksjoner</li>}
                                {formData.ventKrav9 && (((formData.bygningstype || "").toLowerCase().includes("kraftstasjon") || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon")))
                                  ? <li>Brannspjeld i seksjoneringsvegg – automatisk lukkende, smeltesikring ikke tillatt (kraftstasjon)</li>
                                  : <li>Brannspjeld i seksjoneringsvegg</li>)}
                                {((formData.bygningstype || "").toLowerCase().includes("kraftstasjon") || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"))) && (
                                  <li>Steng-inne-prinsipp ventilasjon – automatiske brannspjeld kreves (kraftstasjon)</li>
                                )}
                                {(formData.erSykehusPleieinstitusjon || isSeksjoneringRequired(formData.areal, formData.brannseksjonBrannenergi, formData.brannseksjonTiltak)) && (
                                  <li>Varsel: Ventilasjonskanaler gjennom seksjonering må kontrolleres</li>
                                )}
                              </>
                            )}
                            {formData.vannAvlopRelevant && (
                              <>
                                <li>Rørgjennomføringer i brannskillende konstruksjoner må ha dokumentert brannmotstand</li>
                                <li>Plastrør med ytre diameter ≤ 32 mm gjennom murte/støpte konstruksjoner</li>
                                <li>Støpejernrør med ytre diameter ≤ 110 mm gjennom murte/støpte konstruksjoner</li>
                              </>
                            )}
                            {formData.rorIsolasjonRelevant && (
                              <>
                                <li>Isolasjon på rør og kanaler i rømningsveier og sjakter: klasse BL-s1,d0 [PI]</li>
                                {(() => {
                                  const allParts: { label: string; rk: string; bkl: string }[] = [];
                                  if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length) {
                                    formData.bygningsdeler.forEach((d: any, i: number) => {
                                      if (d.risikoklasse) allParts.push({ label: `Bygningsdel ${i + 1}`, rk: d.risikoklasse, bkl: d.brannklasse || '' });
                                    });
                                  } else {
                                    allParts.push({ label: '', rk: formData.risikoklasse, bkl: formData.brannklasse });
                                  }
                                  const isMulti = allParts.length > 1;
                                  if (!isMulti) {
                                    const first = allParts[0];
                                    const isPII = !!first && (["RK3","RK5","RK6"].includes(first.rk) || ["BKL2","BKL3"].includes(first.bkl));
                                    return <li>Øvrig isolasjon: {isPII ? 'CL-s3,d0 [PII]' : 'DL-s3,d0 [PIII]'}</li>;
                                  }
                                  return allParts.map((p, idx) => {
                                    const isPII = ["RK3","RK5","RK6"].includes(p.rk) || ["BKL2","BKL3"].includes(p.bkl);
                                    return <li key={idx}>{p.label}: Øvrig isolasjon {isPII ? 'CL-s3,d0 [PII]' : 'DL-s3,d0 [PIII]'}</li>;
                                  });
                                })()}
                              </>
                            )}
                            {formData.elektriskRelevant && (
                              <>
                                <li>Kabler i sjakter og hulrom over nedforet himling med brannmotstand</li>
                                <li>Elektriske kabler i rømningsveier med dokumentert brannmotstand</li>
                                <li>Gjennomføringer i brannskillende konstruksjoner må tettes</li>
                              </>
                            )}
                            {!formData.ventilasjonRelevant && !formData.vannAvlopRelevant && !formData.rorIsolasjonRelevant && !formData.elektriskRelevant && <li>Velg relevante tekniske installasjoner ovenfor</li>}
                          </ul>
                        )}
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
                     {(() => {
                       const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                         || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                       return (
                         <KraftstasjonTilleggskravCard kapittel="3.7" visible={erKraftstasjon}>
                           <div className="text-xs space-y-1">
                             <p className="font-medium text-foreground">Følgende tilleggskrav inkluderes automatisk i rapporten:</p>
                             <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                               <li><span className="font-medium text-foreground">Kabler (kulverter, sjakter og kabeltunneler):</span> separasjon, brannbeskyttelse, kabelstiger, horisontale/vertikale seksjoner og brannhemmende belegg.</li>
                               <li><span className="font-medium text-foreground">Ventilasjonsanlegg:</span> ikke brannspjeld med smeltesikring – automatiske spjeld som sikrer rask avstengning og hindrer røykspredning før temperaturen er blitt høy.</li>
                             </ul>
                           </div>
                         </KraftstasjonTilleggskravCard>
                       );
                     })()}
                     {renderTilstandPanel("3_7")}
                    <FravikForParagraf paragrafId="11-10" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-8" label={`3.8 ${formData.regelverk === "BF85" ? "Rømningsvei – generelle krav (§ 11-11 Generelle krav om rømning og redning)" : "§ 11-11 Rømning og redning"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.8 {formData.regelverk === "BF85" ? "Rømningsvei – generelle krav (§ 11-11 Generelle krav om rømning og redning)" : "§ 11-11 Rømning og redning"}</Label>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-medium block">Generell beskrivelse av evakuering</Label>
                          {!isViewMode && (
                            <Button type="button" variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
                              const lines: string[] = [];
                              
                              // Build list of all building parts
                              interface PartInfo {
                                name: string;
                                label: string;
                                rk: number;
                                rkLabel: string;
                                etasjer: number;
                                erSykehus: boolean;
                              }
                              const parts: PartInfo[] = [];
                              
                              // Primary part
                              const primaryRk = parseInt(formData.risikoklasse?.replace(/\D/g, '') || '0', 10);
                              const primaryEt = parseInt(formData.etasjer || '0', 10);
                              parts.push({
                                name: formData.bygningstype || "Bygningsdel 1",
                                label: "Bygningsdel 1",
                                rk: primaryRk,
                                rkLabel: formData.risikoklasse || "",
                                etasjer: primaryEt,
                                erSykehus: !!formData.erSykehusPleieinstitusjon,
                              });
                              
                              // Additional parts from bygningsdeler
                              if (formData.bygningsdeler && formData.bygningsdeler.length > 0) {
                                formData.bygningsdeler.forEach((del: any, idx: number) => {
                                  const delRk = parseInt((del.risikoklasse || '').replace(/\D/g, '') || '0', 10);
                                  const delEt = parseInt(del.etasjer || '0', 10);
                                  parts.push({
                                    name: del.bygningstype || del.navn || `Bygningsdel ${idx + 2}`,
                                    label: `Bygningsdel ${idx + 2}`,
                                    rk: delRk,
                                    rkLabel: del.risikoklasse || "",
                                    etasjer: delEt > 0 ? delEt : primaryEt,
                                    erSykehus: del.risikoklasse === "RK6" && (del.erSykehusPleieinstitusjon || false),
                                  });
                                });
                              }
                              
                              const hasMultipleParts = parts.length > 1;
                              
                              // Introduction - describe all parts
                              if (hasMultipleParts) {
                                const partDescriptions = parts.map((p, i) => `${p.label} (${p.name}, ${p.rkLabel})`);
                                lines.push(`Bygget inneholder ${partDescriptions.join(" og ")}.`);
                                const etasjeDesc = parts.map(p => `${p.name} har ${p.etasjer} etasje${p.etasjer > 1 ? "r" : ""}`).join(". ");
                                lines.push(etasjeDesc + ".");
                              } else {
                                const type = formData.bygningstype || "bygget";
                                const etasjer = formData.etasjer || "ukjent antall";
                                lines.push(`${type} har ${etasjer} etasje${parseInt(formData.etasjer) > 1 ? "r" : ""}.`);
                              }
                              
                              // Trapperom per part
                              const trMap: Record<number, { lav: string; hoy: string }> = {
                                1: { lav: "Tr1", hoy: "Tr3" }, 2: { lav: "Tr1", hoy: "Tr3" },
                                3: { lav: "Tr2", hoy: "Tr3" }, 4: { lav: "Tr1", hoy: "Tr3" },
                                5: { lav: "Tr2", hoy: "Tr3" }, 6: { lav: "Tr2", hoy: "Tr3" },
                              };
                              
                              const allTrappeInfo: string[] = [];
                              
                              if (formData.regelverk === "BF85") {
                                if (formData.trapperomKrav.includes("bf85_tr_aapent") || formData.trapperomKrav.includes("bf85_bolig_2_aapne") || formData.trapperomKrav.includes("bf85_bolig_aapent_brannvesen")) allTrappeInfo.push("Tr1 (åpent trapperom)");
                                if (formData.trapperomKrav.includes("bf85_tr_lukket") || formData.trapperomKrav.includes("bf85_bolig_lukket") || formData.trapperomKrav.includes("bf85_bolig_2_branntrygge")) allTrappeInfo.push("Tr2 (lukket trapperom)");
                                if (formData.trapperomKrav.includes("bf85_tr_roykfritt") || formData.trapperomKrav.includes("bf85_bolig_roykfritt")) allTrappeInfo.push("Tr3 (røykfritt trapperom)");
                                if (formData.trapperomBeskrivelse) {
                                  lines.push(formData.trapperomBeskrivelse);
                                } else if (allTrappeInfo.length > 0) {
                                  lines.push(`Trapperom er utført som ${allTrappeInfo.join(" og ")}.`);
                                }
                              } else {
                                // TEK17 - calculate per part
                                const partTrappeLines: string[] = [];
                                let strengesteTr = "Tr1";
                                
                                parts.forEach(p => {
                                  if (p.rk >= 1 && p.rk <= 6 && p.etasjer > 0) {
                                    const trT = p.etasjer <= 8 ? trMap[p.rk].lav : trMap[p.rk].hoy;
                                    const trLabel = trT === "Tr1" ? "Tr1 (åpent trapperom)" : trT === "Tr2" ? "Tr2 (lukket trapperom)" : "Tr3 (røykfritt trapperom)";
                                    
                                    if (hasMultipleParts) {
                                      partTrappeLines.push(`${p.label} (${p.name}, ${p.rkLabel}): Trapperom utføres som ${trLabel}.`);
                                    }
                                    
                                    allTrappeInfo.push(trLabel);
                                    // Track strictest
                                    if (trT === "Tr3" || (trT === "Tr2" && strengesteTr !== "Tr3")) {
                                      strengesteTr = trT;
                                    }
                                  }
                                });
                                
                                if (formData.trapperomBeskrivelse) {
                                  lines.push(formData.trapperomBeskrivelse);
                                } else if (hasMultipleParts && partTrappeLines.length > 0) {
                                  lines.push(partTrappeLines.join("\n"));
                                } else if (allTrappeInfo.length > 0) {
                                  lines.push(`Trapperom er utført som ${allTrappeInfo[0]}.`);
                                }
                              }
                              
                              // Rømningsvei trappvalg
                              const trappeValgArr: string[] = Array.isArray(formData.romningsveiTrappeValg) ? formData.romningsveiTrappeValg : (formData.romningsveiTrappeValg ? [formData.romningsveiTrappeValg] : []);
                              if (trappeValgArr.includes("en_trapp")) {
                                lines.push("Bygget har én trapp. Maksimal avstand til nærmeste utgang er 15 m.");
                              }
                              if (trappeValgArr.includes("sammenfallende")) {
                                lines.push("Bygget har sammenfallende rømningsretninger. Maksimal avstand er 15 m i felles del.");
                              }
                              if (trappeValgArr.includes("flere_trapper")) {
                                lines.push("Bygget har flere trapper og utganger. Maksimal avstand til nærmeste utgang er 30 m.");
                              }
                              
                              // Seksjonering
                              const harSeksjonering = formData.erSykehusPleieinstitusjon || 
                                (formData.brannseksjonBrannenergi && formData.brannseksjonTiltak && 
                                  (() => { const a = parseFloat(formData.areal) || 0; const g = ({"over400":{normalt:800,brannalarm:1200,sprinkler:5000},"50-400":{normalt:1200,brannalarm:1800,sprinkler:10000},"under50":{normalt:1800,brannalarm:2700,sprinkler:10000}} as any)[formData.brannseksjonBrannenergi]; return g && a > (g[formData.brannseksjonTiltak] ?? g.normalt); })());
                              if (harSeksjonering) {
                                if (hasMultipleParts) {
                                  lines.push("Bygget er oppdelt med seksjoneringsvegg(er). Bygningsdeler med ulik risikoklasse er adskilt med branncelleskillende konstruksjoner. Evakuering kan foregå innenfor hver brannseksjon uavhengig av brann i tilstøtende seksjon.");
                                } else {
                                  lines.push("Bygget er oppdelt med seksjoneringsvegg(er). Evakuering kan foregå innenfor hver brannseksjon uavhengig av brann i tilstøtende seksjon.");
                                }
                              }
                              
                              // Evakueringsstrategi
                              const harSykehus = parts.some(p => p.erSykehus || p.rk === 6);
                              const uniqueTrappeInfo = [...new Set(allTrappeInfo)];
                              const trappeTypeTekst = uniqueTrappeInfo.length > 0 ? ` via ${uniqueTrappeInfo.join(" / ")}` : "";
                              
                              if (hasMultipleParts && harSykehus) {
                                const sykehusDeler = parts.filter(p => p.erSykehus || p.rk === 6);
                                const andreDeler = parts.filter(p => !p.erSykehus && p.rk !== 6);
                                const evakLines: string[] = [];
                                sykehusDeler.forEach(p => {
                                  evakLines.push(`${p.label} (${p.name}): Evakueringsstrategi er basert på horisontal forflytning til sikker sone bak seksjoneringsvegg, med mulighet for videre evakuering til det fri ved behov.`);
                                });
                                if (andreDeler.length > 0) {
                                  const andreNavn = andreDeler.map(p => `${p.label} (${p.name})`).join(" og ");
                                  evakLines.push(`${andreNavn}: Evakuering skjer${trappeTypeTekst} via rømningsveier til det fri.`);
                                }
                                lines.push(evakLines.join("\n"));
                              } else if (formData.erSykehusPleieinstitusjon || formData.risikoklasse === "RK6") {
                                lines.push(`Evakueringsstrategi er basert på horisontal forflytning til sikker sone bak seksjoneringsvegg, med mulighet for videre evakuering${trappeTypeTekst} til det fri ved behov.`);
                              } else {
                                lines.push(`Evakuering skjer${trappeTypeTekst} via rømningsveier til det fri.`);
                              }
                              
                              setFormData({...formData, romningSikkerhet: lines.join("\n\n")});
                            }}>
                              <Sparkles className="h-3 w-3" />
                              Generer tekst
                            </Button>
                          )}
                        </div>
                        <Textarea 
                          value={formData.romningSikkerhet}
                          onChange={(e) => setFormData({...formData, romningSikkerhet: e.target.value})}
                          rows={8}
                         />
                      </div>
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.regelverk === "BF85" ? (
                            <>
                              <li>Generelle krav til rømningsvei iht. BF85 Kap. 30:7 (30:71–78)</li>
                              <li>Krav til antall, bredde og dører i rømningsvei (Tabell 30:75)</li>
                              <li>Krav til vindu som rømningsvei, markering, brannventilasjon og ledelys</li>
                            </>
                          ) : (
                            <>
                              <li>Generelle krav til rømning og evakuering</li>
                              <li>Krav til tidlig varsling og tilstrekkelig rømningstid</li>
                              <li>Krav til rømningsveier med tilstrekkelig kapasitet</li>
                            </>
                          )}
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
                     {(() => {
                       const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                         || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                       return (
                         <KraftstasjonTilleggskravCard kapittel="3.8" visible={erKraftstasjon}>
                           <div className="text-xs space-y-1">
                             <p className="font-medium text-foreground">Følgende tilleggskrav gjelder for kraftstasjoner:</p>
                             <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                               <li>Alle dører til og i rømningsvei skal slå ut i rømningsretning (unntak om "lite antall personer" gjelder ikke).</li>
                               <li>Krav til panikkbeslag (NS-EN 1125) er påkrevd.</li>
                             </ul>
                           </div>
                         </KraftstasjonTilleggskravCard>
                       );
                     })()}
                     {renderTilstandPanel("3_8")}
                    <FravikForParagraf paragrafId="11-11" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-9" label={`3.9 ${formData.regelverk === "BF85" ? "Tiltak for å påvirke rømnings- og redningstider (Brannalarmanlegg og røykvarsler)" : "§ 11-12 Tilrettelegging for rømning"}`}>
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.9 {formData.regelverk === "BF85" ? "Tiltak for å påvirke rømnings- og redningstider (Brannalarmanlegg og røykvarsler)" : "§ 11-12 Tilrettelegging for rømning og redning"}</Label>
                      </div>

                      {/* Tilstandsvurdering: faktisk installerte anlegg (kompenserende tiltak) */}
                      {documentType === "tilstandsvurdering" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded space-y-2">
                          <Label className="text-xs font-semibold block text-blue-900 dark:text-blue-200">
                            Installerte anlegg (kan benyttes som kompenserende tiltak)
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Hak av for anlegg som faktisk er installert i bygget – også der regelverket ikke krever det. Disse kan benyttes som kompenserende tiltak for andre mangler.
                          </p>
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="tilstand_39_brannalarm_installert"
                              checked={formData.tilstand_39_brannalarm_installert}
                              onCheckedChange={(checked) => setFormData({ ...formData, tilstand_39_brannalarm_installert: !!checked })}
                            />
                            <Label htmlFor="tilstand_39_brannalarm_installert" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Brannalarmanlegg installert</strong> i bygget.
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="tilstand_39_slokkeanlegg_installert"
                              checked={formData.tilstand_39_slokkeanlegg_installert}
                              onCheckedChange={(checked) => setFormData({ ...formData, tilstand_39_slokkeanlegg_installert: !!checked })}
                            />
                            <Label htmlFor="tilstand_39_slokkeanlegg_installert" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Automatisk slokkeanlegg (sprinkler) installert</strong> i bygget.
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="tilstand_39_roykventilasjon_installert"
                              checked={formData.tilstand_39_roykventilasjon_installert}
                              onCheckedChange={(checked) => setFormData({ ...formData, tilstand_39_roykventilasjon_installert: !!checked })}
                            />
                            <Label htmlFor="tilstand_39_roykventilasjon_installert" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Røykventilasjon installert</strong> i bygget.
                            </Label>
                          </div>
                        </div>
                      )}

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

                      {/* BF85-spesifikt: Risikobasert brannalarm i kontorbygg */}
                      {formData.regelverk === "BF85" && (
                        (formData.bygningstype || "").toLowerCase().includes("kontor")
                        || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kontor"))
                      ) && (
                        <div className="p-3 bg-muted/50 border border-border rounded space-y-2">
                          <Label className="text-xs font-medium block">BF85-krav for kontorbygg:</Label>
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="bf85_39_kontor_brannalarm"
                              checked={formData.bf85_39_kontor_brannalarm}
                              onCheckedChange={(checked) => setFormData({...formData, bf85_39_kontor_brannalarm: !!checked})}
                            />
                            <Label htmlFor="bf85_39_kontor_brannalarm" className="text-xs cursor-pointer leading-relaxed">
                              <strong>Risikobasert brannalarm (kontor):</strong> Det er ikke generelt krav til brannalarmanlegg i kontorbygg etter BF85, men der det kreves ut fra risikovurdering skal brannalarmen varsle alle i bygget.
                            </Label>
                          </div>
                        </div>
                      )}

                      {/* BF85-spesifikt: Automatisk slokkeanlegg (industribygg eller branncelle over flere plan > 800 m²) */}
                      {formData.regelverk === "BF85" && (() => {
                        const erIndustri = (formData.bygningstype || "").toLowerCase().includes("industri")
                          || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("industri"));
                        const flerePlanOver800 = !!formData.branncellerFlerePlanRelevant && formData.branncellerFlerePlanAreal === "over800";
                        if (!erIndustri && !flerePlanOver800) return null;
                        const etasjer = parseInt(formData.etasjer || "0", 10);
                        const areal = parseFloat(String(formData.areal || "0").replace(",", ".")) || 0;
                        const oppfyllerKriterier = etasjer > 1 && areal > 800;
                        return (
                          <div className="p-3 bg-muted/50 border border-border rounded space-y-2">
                            <Label className="text-xs font-medium block">BF85-krav: Automatisk slokkeanlegg</Label>
                            {erIndustri && (
                              <p className="text-[11px] italic text-muted-foreground">
                                BF85 krever automatisk slokkeanlegg i industribygg som er åpne over flere plan med samlet areal &gt; 800 m².
                              </p>
                            )}
                            {flerePlanOver800 && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                                ℹ︎ Foreslått fordi branncelle over flere plan med samlet areal &gt; 800 m² er valgt i kap. 3.5.
                              </p>
                            )}
                            {erIndustri && oppfyllerKriterier && !formData.bf85_39_industri_slokkeanlegg && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                                ℹ︎ Bygget har {etasjer} etasjer og samlet areal {areal} m² – kravet bør avhukes dersom bygget er åpent over flere plan.
                              </p>
                            )}
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="bf85_39_industri_slokkeanlegg"
                                checked={formData.bf85_39_industri_slokkeanlegg}
                                onCheckedChange={(checked) => setFormData({...formData, bf85_39_industri_slokkeanlegg: !!checked})}
                              />
                              <Label htmlFor="bf85_39_industri_slokkeanlegg" className="text-xs cursor-pointer leading-relaxed">
                                <strong>Automatisk slokkeanlegg:</strong> {flerePlanOver800 && !erIndustri
                                  ? "Branncelle over flere plan med samlet areal > 800 m² skal ha automatisk slokkeanlegg."
                                  : "Industribygg som er åpne over flere plan med samlet areal > 800 m² skal ha automatisk slokkeanlegg."}
                              </Label>
                            </div>
                          </div>
                        );
                      })()}

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
                            <strong>Automatisk brannslokkeanlegg (RK4):</strong>{' '}
                            {formData.harFlereRisikoklasser && !formData.skilleSpinkletUsprinklet
                              ? "Hele byggverket skal ha automatisk brannslokkeanlegg da det ikke skilles mellom sprinklet og usprinklet areal med brannseksjonering. Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner."
                              : "Byggverk eller del av byggverk i risikoklasse 4 hvor det kreves heis, skal ha automatisk brannslokkeanlegg. Deler av et byggverk med og uten automatisk brannslokkeanlegg skal være ulike brannseksjoner."
                            }
                          </Label>
                        </div>
                        )}
                        {!formData.tilretteleggingLedd1a && (formData.risikoklasse === "RK4" || formData.bygningsdeler.some(b => b.risikoklasse === "RK4")) && parseInt(formData.etasjer || '0', 10) > 1 && (
                          <div className="ml-6 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                            <p className="text-xs font-semibold text-destructive">
                              ⚠️ Fravik: Automatisk brannslokkeanlegg er påkrevd for byggverk i risikoklasse 4 hvor det kreves heis (jf. TEK17 § 11-12, første ledd bokstav a). Ved å fjerne dette kravet må det dokumenteres som et fravik fra preaksepterte ytelser.
                            </p>
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
                          {!formData.tilretteleggingLedd1b && (
                            <div className="ml-6 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                              <p className="text-xs font-semibold text-destructive">
                                ⚠️ Fravik: Automatisk brannslokkeanlegg er påkrevd for alle byggverk i risikoklasse 6 (jf. TEK17 § 11-12, første ledd bokstav b). Ved å fjerne dette kravet må det dokumenteres som et fravik fra preaksepterte ytelser.
                              </p>
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

                      {/* Skille mellom sprinklet og usprinklet areal */}
                      {(() => {
                        if (!formData.harFlereRisikoklasser) return null;
                        // Bygg opp alle deler inkludert primær
                        const alleParts: { label: string; rk: string; etasjer: number }[] = [];
                        // Primær bygningsdel
                        if (formData.risikoklasse) {
                          alleParts.push({
                            label: `Bygningsdel 1 (${formData.bygningstype || ''}, ${formData.risikoklasse})`,
                            rk: formData.risikoklasse,
                            etasjer: parseInt(formData.etasjer) || 1
                          });
                        }
                        // Ekstra bygningsdeler
                        if (formData.bygningsdeler?.length > 0) {
                          formData.bygningsdeler.forEach((d: any, i: number) => {
                            if (d.risikoklasse) alleParts.push({
                              label: `Bygningsdel ${i + 2} (${d.navn || d.bygningstype || ''}, ${d.risikoklasse})`,
                              rk: d.risikoklasse,
                              etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer) || 1
                            });
                          });
                        }
                        if (alleParts.length < 2) return null;
                        const delerMedSprinklerKrav: string[] = [];
                        const delerUtenSprinklerKrav: string[] = [];
                        alleParts.forEach((p) => {
                          const krevSprinkler = p.rk === "RK6" || (p.rk === "RK4" && p.etasjer > 3);
                          if (krevSprinkler) delerMedSprinklerKrav.push(p.label);
                          else delerUtenSprinklerKrav.push(p.label);
                        });
                        // Vis kun når noen deler krever og noen ikke krever sprinkler
                        if (delerMedSprinklerKrav.length === 0 || delerUtenSprinklerKrav.length === 0) return null;
                        return (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded space-y-3">
                            <div className="text-xs space-y-1">
                              <p className="font-semibold">⚠️ Deler av byggverket har krav om automatisk slokkeanlegg:</p>
                              <ul className="ml-4 list-disc space-y-0.5">
                                {delerMedSprinklerKrav.map((d, i) => <li key={i}><span className="font-medium">{d}</span> — krav om sprinkler</li>)}
                                {delerUtenSprinklerKrav.map((d, i) => <li key={i}><span className="font-medium">{d}</span> — ikke krav om sprinkler</li>)}
                              </ul>
                              <p className="mt-2">
                                Hele byggemassen må sprinkles med mindre det skilles mellom sprinklet og usprinklet areal med brannseksjonering (jf. VTEK § 11-12).
                              </p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="skilleSpinkletUsprinklet"
                                checked={formData.skilleSpinkletUsprinklet}
                                onCheckedChange={(checked) => setFormData({...formData, skilleSpinkletUsprinklet: !!checked})}
                              />
                              <Label htmlFor="skilleSpinkletUsprinklet" className="text-xs cursor-pointer leading-relaxed">
                                <strong>Skille mellom sprinklet og usprinklet areal:</strong> Sprinklet og usprinklet areal skilles med brannseksjonering. Kun bygningsdeler med krav om sprinkler sprinkles.
                              </Label>
                            </div>
                            {!formData.skilleSpinkletUsprinklet && (
                              <div className="ml-6 p-2 bg-accent/30 rounded">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">→</span> Hele byggverket sprinkles da det ikke skilles mellom sprinklet og usprinklet areal med brannseksjonering.
                                </p>
                              </div>
                            )}
                            {formData.skilleSpinkletUsprinklet && (
                              <div className="ml-6 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded">
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  <span className="font-medium">ℹ️ Kontroller kapittel 3.4 (§ 11-7 Brannseksjonering):</span> Det må etableres brannseksjonering mellom sprinklet og usprinklet areal. Verifiser at brannseksjoneringskrav i kapittel 3.4 er oppdatert i henhold til dette skillet.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Velg relevante krav:</Label>
                        
                        {/* Sjekk om bygget kvalifiserer for røykvarslere - sjekk alle bygningsdeler */}
                        {(() => {
                          // Bygg opp allParts for å sjekke alle bygningsdeler
                          const allParts39: { label: string; rk: string; bkl: string; etasjer: number; areal: number; bygningstype: string }[] = [];
                          if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                            formData.bygningsdeler.forEach((d: any, i: number) => {
                              if (d.risikoklasse) allParts39.push({
                                label: `Bygningsdel ${i + 1} (${d.navn || d.bygningstype || ''}, ${d.risikoklasse})`,
                                rk: d.risikoklasse, bkl: d.brannklasse || '',
                                etasjer: parseInt(d.etasjer) || parseInt(formData.etasjer) || 1,
                                areal: parseFloat(d.areal) || parseFloat(formData.areal) || 0,
                                bygningstype: (d.bygningstype || d.navn || '').toLowerCase()
                              });
                            });
                          }
                          if (allParts39.length === 0) {
                            allParts39.push({
                              label: '', rk: formData.risikoklasse, bkl: formData.brannklasse || '',
                              etasjer: parseInt(formData.etasjer) || 1,
                              areal: parseFloat(formData.areal) || 0,
                              bygningstype: (formData.bygningstype || '').toLowerCase()
                            });
                          }
                          const isMulti39 = allParts39.length > 1;

                          // Funksjon for å sjekke om en del kvalifiserer for røykvarslere
                          const kanDelVelgeRoykvarsler = (p: typeof allParts39[0]) => {
                            const erRK2IL = p.rk === "RK2" && p.areal <= 1200 && (p.bygningstype.includes("industri") || p.bygningstype.includes("lager") || p.bygningstype.includes("kraftstasjon"));
                            const erRK2K = p.rk === "RK2" && p.areal <= 1200 && p.bygningstype.includes("kontor");
                            const erRK4B = p.rk === "RK4" && (p.bygningstype.includes("bolig") || p.bygningstype.includes("enebolig") || p.bygningstype.includes("rekkehus") || p.bygningstype.includes("kjedehus") || p.bygningstype.includes("fritidsbolig"));
                            const erRK5L = p.rk === "RK5" && p.areal <= 600;
                            return erRK2IL || erRK2K || erRK4B || erRK5L;
                          };

                          // Alle deler må kvalifisere for røykvarslere for at valget skal være tilgjengelig
                          const kanVelgeRoykvarsler = allParts39.every(p => kanDelVelgeRoykvarsler(p));

                          const rk = formData.risikoklasse;
                          const areal = parseFloat(formData.areal) || 0;
                          const bygningstype = formData.bygningstype.toLowerCase();
                          const etasjer = parseInt(formData.etasjer) || 1;
                          
                          const erRK2IndustriLager = rk === "RK2" && areal <= 1200 && 
                            (bygningstype.includes("industri") || bygningstype.includes("lager") || bygningstype.includes("kraftstasjon"));
                          const erRK2Kontor = rk === "RK2" && areal <= 1200 && bygningstype.includes("kontor");
                          const erRK4Bolig = rk === "RK4" && 
                            (bygningstype.includes("enebolig") || bygningstype.includes("rekkehus") || 
                             bygningstype.includes("kjedehus") || bygningstype.includes("fritidsbolig") ||
                             bygningstype.includes("bolig"));
                          const erRK5Liten = rk === "RK5" && areal <= 600;
                          
                          const bt = formData.bygningstype.toLowerCase();
                          const erBolig = bt.includes("bolig") || bt.includes("enebolig") || bt.includes("rekkehus") || bt.includes("kjedehus") || bt.includes("leilighet") || formData.risikoklasse === "RK4";
                          
                          // Beregn brannalarmkategori per del og bruk strengeste
                          const beregnKategori = (p: typeof allParts39[0]) => {
                            if (p.rk === "RK5" || p.rk === "RK6") return 2;
                            if ((p.rk === "RK2" || p.rk === "RK3" || p.rk === "RK4") && p.etasjer >= 2) return 2;
                            return 1;
                          };
                          const brannalarmkategori = Math.max(...allParts39.map(beregnKategori));
                          const harUlikeKategorier = isMulti39 && new Set(allParts39.map(beregnKategori)).size > 1;

                          // Fravikssjekk: sjekk om noen del har RK2-RK6
                          const noenDelKreverAlarm = allParts39.some(p => ["RK2","RK3","RK4","RK5","RK6"].includes(p.rk));
                          
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
                              {!kanVelgeRoykvarsler && !formData.tilretteleggingLedd2a && noenDelKreverAlarm && (
                                <div className="ml-6 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                                  <p className="text-xs font-semibold text-destructive">
                                    ⚠️ Fravik: Brannalarmanlegg er påkrevd for byggverk i risikoklasse 2 til 6 (jf. TEK17 § 11-12, første ledd bokstav c). Ved å fjerne dette kravet må det dokumenteres som et fravik fra preaksepterte ytelser.
                                  </p>
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
                                      {!isMulti39 && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          (basert på {rk}, {etasjer} {etasjer === 1 ? "etasje" : "etasjer"})
                                        </span>
                                      )}
                                    </div>
                                    {isMulti39 && harUlikeKategorier ? (
                                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                                        {allParts39.map((p, idx) => (
                                          <li key={idx}>{p.label}: Kategori {beregnKategori(p)}</li>
                                        ))}
                                        <li className="font-medium text-foreground mt-1">Strengeste krav: Kategori {brannalarmkategori}</li>
                                      </ul>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        {brannalarmkategori === 1
                                          ? "Brannalarmkategori 1: Optiske røykdetektorer i rømningsveier og fellesarealer."
                                          : "Brannalarmkategori 2: Heldekkende brannalarmanlegg med optiske røykdetektorer i alle områder."}
                                      </p>
                                    )}
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
                              const erRK5 = allPartsLedesystem.some(p => p.rk === "RK5") || rk === "RK5";
                              const erRK6 = allPartsLedesystem.some(p => p.rk === "RK6") || rk === "RK6";
                              const etasjer = parseInt(formData.etasjer) || 0;
                              const brannklasse = formData.brannklasse || "";
                              const noenRK2RK3RK5 = allPartsLedesystem.some(p => ["RK2","RK3","RK5"].includes(p.rk)) || ["RK2","RK3","RK5"].includes(rk);

                              return (
                                <>

                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    I byggverk der forskriften stiller krav om ledesystem vil dette gjelde rømningsveiene, samt fluktveier i større, uoversiktlige brannceller.
                                  </p>


                                  {noenRK2RK3RK5 && (
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
                              ⚠️ Fravik: Evakueringsplaner er påkrevd for byggverk i risikoklasse 5 og 6 (jf. TEK17 § 11-14, fjerde ledd). Ved å fjerne dette kravet må det dokumenteres som et fravik fra preaksepterte ytelser.
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
                        {!formData.tilretteleggingLedd5 && (
                          <div className="ml-6 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                            <p className="text-xs font-semibold text-destructive">
                              ⚠️ Fravik: Merking av branntekniske installasjoner er alltid påkrevd (jf. TEK17 § 11-14, femte ledd). Ved å fjerne dette kravet må det dokumenteres som et fravik fra preaksepterte ytelser.
                            </p>
                          </div>
                        )}
                      </div>
                      </>)}

                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.regelverk === "BF85" ? (
                            <>
                              {(formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && <li>Krav til sprinkleranlegg der dette er krevet iht. BF85 Kap. 31–39 (avhengig av bygningstype)</li>}
                              {formData.tilretteleggingLedd2a && <li>Krav til brannalarmanlegg iht. BF85 Kap. 31–39 (avhengig av bygningstype og størrelse)</li>}
                              {formData.alarmValg === "roykvarsler" && <li>Krav til røykvarslere i boliger iht. BF85 Kap. 31</li>}
                              <li>Alarmkrav tilpasset bygningstype og bygningsbrannklasse iht. BF85 Kap. 31–39</li>
                              <li>Krav til ledelys/nødlys der dette er krevet for bygningstype</li>
                            </>
                          ) : (
                            <>
                              {(formData.tilretteleggingLedd1a || formData.tilretteleggingLedd1b) && <li>Krav til automatisk slokkeanlegg basert på risikoklasse</li>}
                              {formData.tilretteleggingLedd2a && <li>Brannalarmanlegg med automatisk beregnet kategori</li>}
                              {formData.alarmValg === "roykvarsler" && <li>Seriekoblede røykvarslere med batteribackup</li>}
                              <li>Alarmkrav tilpasset bygningstype og risikoklasse</li>
                              <li>Ledesystem og nødlys basert på risikoklasse</li>
                            </>
                          )}
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
                     {(() => {
                       const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                         || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                       return (
                         <KraftstasjonTilleggskravCard kapittel="3.9" visible={erKraftstasjon}>
                           <div className="text-xs space-y-1">
                             <p className="font-medium text-foreground">Følgende tilleggskrav inkluderes automatisk for kraftstasjoner:</p>
                              <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                                <li>Krav etter <span className="font-medium text-foreground">FEA-F § 25</span> om uavhengig nødbelysning.</li>
                                <li>Anbefaling om håndlykter.</li>
                                <li>Avsnitt om plassering, utforming og utstyr for redningsrom.</li>
                                <li>Hvis "Kraftstasjon under fjell eller under dagen" er huket av i metadata: i tillegg krav om nødlysanlegg etter <span className="font-medium text-foreground">FEA-F § 26</span> og innledningstekst om redningsrom.</li>
                                {documentType === "tilstandsvurdering" && formData.regelverk === "BF85" && (
                                  <li>For tilstandsvurdering etter BF85: i tillegg avsnitt om <span className="font-medium text-foreground">brannalarmanlegg i kraftforsyningsanlegg i fjell og under dagen</span> (jf. FOBTOT § 2.1, FEA-F § 25.3 og Beredskapsforskriften § 6.4).</li>
                                )}
                              </ul>
                           </div>
                         </KraftstasjonTilleggskravCard>
                       );
                     })()}
                     {renderTilstandPanel("3_9")}
                    <FravikForParagraf paragrafId="11-12" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    {(() => {
                      const isBF85Tilstand = documentType === "tilstandsvurdering" && formData.regelverk === "BF85";
                      const label310 = isBF85Tilstand
                        ? "3.10 Rømningsveg (BF85 §7)"
                        : `3.10 ${formData.regelverk === "BF85" ? "Utganger og rømningsveier fra branncelle (§ 11-13 Utgang fra branncelle)" : "§ 11-13 Utgang fra branncelle"}`;
                      return (
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-10" label={label310}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">{label310}</Label>
                      </div>
                       {isBF85Tilstand ? (() => {
                         const erKraftstasjonBF75 = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                           || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                         return (
                         <div className="space-y-4">
                           <p className="text-xs text-muted-foreground italic">
                             Vurdering av rømningsveg etter Byggeforskrift 1985, §7. Skriv inn observasjoner / vurdering for hvert punkt.
                           </p>
                           {[
                             { id: "71", title: "§:71 Generelt", field: "bf85_romning_71_generelt", text: "Rømningsveg skal på en oversiktlig måte føre til det fri uten lommer, retningsforandringer e.l. som kan hindre personer fra å komme ut under brann. Rømningsveg skal være egen branncelle. Heis og rulletrapp skal ikke regnes som rømningsveg. Rullebånd for personbefordring kan inngå i rømningsveg dersom det beveger seg i rømningsretningen eller stoppes automatisk ved brannalarm." },
                             { id: "72", title: "§:72 Antall rømningsveger", field: "bf85_romning_72_antall", text: "Antall rømningsveger er avhengig av bygningens bruk, antall etasjer og antall mennesker." },
                             { id: "73", title: "§:73 Bredde i rømningsveg", field: "bf85_romning_73_bredde", text: "Fri bredde i rømningsveg skal minst være 10 mm pr. person og ikke mindre enn 900 mm." },
                             { id: "74", title: "§:74 Golvbelegg", field: "bf85_romning_74_golvbelegg", text: "Golvbelegg skal være klasse G." },
                             erKraftstasjonBF75
                               ? { id: "75", title: "§:75 Dør i rømningsveg – kraftstasjon", field: "bf85_romning_75_dor", text: "Dører til og i rømningsvei skal alltid slå ut i rømningsretning. Dette gjelder uavhengig av persontallet som skal evakuere via denne utgangen." }
                               : { id: "75", title: "§:75 Dør i rømningsveg", field: "bf85_romning_75_dor", text: "Dør i rømningsveg i bygning skal slå ut i rømningsretningen. Dette krav gjelder ikke dør til boenhet. Dør skal utføres som angitt i Tabell 30:75. Kravene gjelder ikke for utgangsdør til det fri." },
                           ].map((p) => (
                            <div key={p.id} className="border rounded p-3 space-y-2 bg-muted/20">
                              <Label className="text-sm font-semibold text-foreground">{p.title}</Label>
                              <p className="text-xs text-foreground/80 leading-relaxed">{p.text}</p>
                              <Textarea
                                value={(formData as any)[p.field] || ""}
                                onChange={(e) => setFormData({ ...formData, [p.field]: e.target.value } as any)}
                                placeholder="Vurdering / observasjoner …"
                                className="min-h-[70px]"
                              />
                            </div>
                           ))}
                         </div>
                         );
                       })() : (
                        <>

                      {/* Del A: §11-13 maksimal fluktvei */}
                      {(() => {
                        const aktiveRK = getAktiveRiskKlasser(formData);
                        if (aktiveRK.length === 0) return null;
                        const harRK12 = aktiveRK.some(r => r === "RK1" || r === "RK2");
                        const harRK35 = aktiveRK.some(r => r === "RK3" || r === "RK5");
                        const harRK4 = aktiveRK.includes("RK4");
                        const harRK6 = aktiveRK.includes("RK6");
                        const strengeste = getStrengesteFluktvei(aktiveRK);
                        const prosjektVerdi = parseFloat(formData.fluktveiLengdeProsjekt) || 0;
                        const overskredet = strengeste !== null && prosjektVerdi > 0 && prosjektVerdi > strengeste;
                        const dorVerdi = parseFloat(formData.fluktveiDorTilTrappRK6) || 0;
                        const dorOverskredet = harRK6 && dorVerdi > 0 && dorVerdi > 7.0;
                        return (
                          <div className="p-3 bg-muted/40 border rounded space-y-3">
                            <Label className="text-sm font-semibold text-foreground">Maksimal fluktvei (§ 11-13)</Label>
                            <div className="space-y-1 text-xs text-foreground/90">
                              {harRK12 && (
                                <p>Krav til maksimal fluktvei: <strong>50 m</strong> (§ 11-13 Tabell 1, RK 1 og 2).</p>
                              )}
                              {harRK35 && (
                                <p>Krav til maksimal fluktvei: <strong>30 m</strong> {aktiveRK.includes("RK3") && aktiveRK.includes("RK5") ? "(§ 11-13 Tabell 1, RK 3 og 5)." : aktiveRK.includes("RK3") ? "(§ 11-13 Tabell 1, RK 3)." : "(§ 11-13 Tabell 1, RK 5)."}</p>
                              )}
                              {harRK6 && (
                                <p>Krav til maksimal fluktvei: <strong>25 m</strong>. I tillegg: avstand fra dør i branncelle til nærmeste trapp eller utgang maksimalt <strong>7,0 m</strong> (§ 11-13 figur 4).</p>
                              )}
                            </div>
                            {harRK4 && (
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded text-xs text-blue-900 dark:text-blue-100">
                                <strong>Risikoklasse 4 (boligbygg)</strong> har ikke en eksplisitt makslengde i § 11-13 Tabell 1. Avstand til utgang dimensjoneres etter § 11-13 ledd 2 og 3, samt § 11-14 punkt 3 om avstand fra dør til trapp. For boenheter med direkte utgang til terreng gjelder § 11-3 unntak nr. 3. Vurder fluktveilengde fra hver enkelt boenhet ut fra konkret løsning.
                              </div>
                            )}

                            <div>
                              <Label className="text-xs font-medium mb-1 block">Lengste fluktvei i prosjektet (m)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.fluktveiLengdeProsjekt}
                                onChange={(e) => setFormData({ ...formData, fluktveiLengdeProsjekt: e.target.value })}
                                className="max-w-[180px]"
                                placeholder="f.eks. 22"
                              />
                              {overskredet && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Prosjektert fluktvei ({prosjektVerdi} m) overstiger strengeste krav ({strengeste} m). Dette må dokumenteres som fravik.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                            {harRK6 && (
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Maks avstand fra dør til nærmeste trapp (m) – RK6</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={formData.fluktveiDorTilTrappRK6}
                                  onChange={(e) => setFormData({ ...formData, fluktveiDorTilTrappRK6: e.target.value })}
                                  className="max-w-[180px]"
                                  placeholder="f.eks. 5"
                                />
                                {dorOverskredet && (
                                  <Alert variant="destructive" className="mt-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                      Avstanden ({dorVerdi} m) overstiger kravet på 7,0 m i § 11-13 figur 4.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            )}
                            <Collapsible>
                              <CollapsibleTrigger className="text-xs text-primary hover:underline">
                                Vis referansetabell for alle risikoklasser
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <table className="w-full text-xs border mt-2">
                                  <thead className="bg-muted">
                                    <tr><th className="border p-1 text-left">Risikoklasse</th><th className="border p-1 text-left">Maks fluktvei</th></tr>
                                  </thead>
                                  <tbody>
                                    <tr><td className="border p-1">RK 1</td><td className="border p-1">50 m</td></tr>
                                    <tr><td className="border p-1">RK 2</td><td className="border p-1">50 m</td></tr>
                                    <tr><td className="border p-1">RK 3</td><td className="border p-1">30 m</td></tr>
                                    <tr><td className="border p-1">RK 4</td><td className="border p-1">Ikke i tabellen – se § 11-13 ledd 2/3 og § 11-14</td></tr>
                                    <tr><td className="border p-1">RK 5</td><td className="border p-1">30 m</td></tr>
                                    <tr><td className="border p-1">RK 6</td><td className="border p-1">25 m (+ 7 m fra dør til trapp)</td></tr>
                                  </tbody>
                                </table>
                                <p className="text-[11px] text-muted-foreground mt-1 italic">Kilde: VTEK § 11-13 Tabell 1.</p>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        );
                      })()}



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


                       {(() => {
                        const alleRK = formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0
                          ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                          : formData.risikoklasse ? [formData.risikoklasse] : [];
                        const kunRK1234 = alleRK.length > 0 && alleRK.every((rk: string) => ["RK1","RK2","RK3","RK4"].includes(rk));
                        if (!kunRK1234) return null;
                        return (
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="romningsvinduRelevant"
                            checked={formData.romningsvinduRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, romningsvinduRelevant: checked as boolean})}
                          />
                          <Label htmlFor="romningsvinduRelevant" className="text-sm cursor-pointer font-medium">
                            Evakuering via vindu er relevant (gjelder ikke rømning via brannvesenets høydemateriell)
                          </Label>
                        </div>
                        {formData.romningsvinduRelevant && (
                           <div className="mt-3 ml-6 space-y-3 p-3 bg-muted/30 rounded-md">
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Høyde over terreng (underkant vindu)</Label>
                              <Select value={formData.romningsvinduHoyde} onValueChange={(val) => setFormData({...formData, romningsvinduHoyde: val})}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Velg høyde" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2.0">≤ 2,0 meter</SelectItem>
                                  <SelectItem value="5.0">≤ 5,0 meter</SelectItem>
                                  <SelectItem value="7.5">≤ 7,5 meter (med stige)</SelectItem>
                                  <SelectItem value="over_7.5">Over 7,5 meter (utvendig trapp)</SelectItem>
                                </SelectContent>
                              </Select>
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
                        );
                       })()}
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
                                    const kategoriLabel: Record<string, string> = {
                                      salgslokaler: "Salgslokaler", kontor: "Kontor", skoler: "Skoler", barnehager: "Barnehager/fritidshjem", forsamlingslokaler: "Forsamlingslokaler", spisesaler: "Spisesaler"
                                    };
                                    const areal = parseFloat(formData.persontallAreal) || 0;
                                    const factor = arealPerPerson[formData.persontallKategori] || 1;
                                    const persontall = Math.floor(areal / factor);
                                    return `${persontall} personer – kategori: ${kategoriLabel[formData.persontallKategori] || formData.persontallKategori} (${areal} m² / ${factor} m²/pers)`;
                                  })()}
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
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded mt-2">
                        <Checkbox 
                          id="takterrasseRelevant"
                          checked={formData.takterrasseRelevant}
                          onCheckedChange={(checked) => setFormData({...formData, takterrasseRelevant: checked as boolean})}
                        />
                        <Label htmlFor="takterrasseRelevant" className="text-sm cursor-pointer">
                          Takterrasse beregnet for personopphold er relevant
                        </Label>
                      </div>
                      {(() => {
                        // Trapperom-logikk synkronisert med 3.5 (bruker samme trapperomTypeMap)
                        const trapperomTypeMap310: Record<number, { lav: string; hoy: string }> = {
                          1: { lav: "Tr 1", hoy: "Tr 3" },
                          2: { lav: "Tr 1", hoy: "Tr 3" },
                          3: { lav: "Tr 2", hoy: "Tr 3" },
                          4: { lav: "Tr 1", hoy: "Tr 3" },
                          5: { lav: "Tr 2", hoy: "Tr 3" },
                          6: { lav: "Tr 2", hoy: "Tr 3" },
                        };
                        const getTrType310 = (rk: number, etasjer: number) => {
                          if (!trapperomTypeMap310[rk]) return "Tr 1";
                          return etasjer <= 8 ? trapperomTypeMap310[rk].lav : trapperomTypeMap310[rk].hoy;
                        };
                        const trRank: Record<string, number> = { "Tr 3": 3, "Tr 2": 2, "Tr 1": 1 };

                        // Bygg liste over alle deler
                        type TrDel = { index: number; navn: string; rk: number; etasjer: number; trType: string };
                        const trapperomDeler310: TrDel[] = [];
                        const rkPri = parseInt((formData.risikoklasse || "").replace(/\D/g, ''), 10);
                        const flPri = parseInt(formData.etasjer || "0", 10);
                        if (rkPri && flPri >= 1) {
                          trapperomDeler310.push({ index: 1, navn: formData.bygningstype || 'Bygningsdel 1', rk: rkPri, etasjer: flPri, trType: getTrType310(rkPri, flPri) });
                        }
                        if (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0) {
                          formData.bygningsdeler.forEach((del: any, i: number) => {
                            const rkDel = parseInt((del.risikoklasse || "").replace(/\D/g, ''), 10);
                            const flDel = parseInt(del.etasjer || formData.etasjer || "0", 10);
                            if (rkDel && flDel >= 1) {
                              trapperomDeler310.push({ index: i + 2, navn: del.navn || del.bygningstype || `Bygningsdel ${i + 2}`, rk: rkDel, etasjer: flDel, trType: getTrType310(rkDel, flDel) });
                            }
                          });
                        }

                        const harFlere = trapperomDeler310.length > 1;
                        const uniqueTrTypes = [...new Set(trapperomDeler310.map(d => d.trType))];
                        const harUlikeTrKrav = uniqueTrTypes.length > 1;
                        const strengesteTr = trapperomDeler310.reduce((prev, curr) => (trRank[curr.trType] || 0) > (trRank[prev] || 0) ? curr.trType : prev, "Tr 1");
                        const harRK4 = trapperomDeler310.some(d => d.rk === 4);
                        const alleErRK4 = trapperomDeler310.every(d => d.rk === 4);

                        return (
                          <>
                            {/* Vis per-del trapperom-info */}
                            {trapperomDeler310.length > 0 && (
                              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-xs text-muted-foreground space-y-1 mt-2">
                                <p className="font-medium text-foreground text-sm">Krav til trapperom (synkronisert med 3.5)</p>
                                {trapperomDeler310.map(del => (
                                  <p key={del.index}>
                                    {harFlere && <span className="font-medium">Bygningsdel {del.index} ({del.navn}, RK{del.rk}): </span>}
                                    <span className="font-bold text-foreground">{del.trType}</span>
                                    <span className="ml-1">({del.etasjer} etasjer)</span>
                                  </p>
                                ))}
                                {harFlere && harUlikeTrKrav && (
                                  <p className="text-amber-600 font-medium pt-1 border-t border-primary/10">
                                    ⚠ Bygningsdelene har ulike trapperomskrav ({uniqueTrTypes.join(" / ")})
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Spørsmål om trapperommene går gjennom flere bygningsdeler */}
                            {harFlere && harUlikeTrKrav && (
                              <div className="flex items-center space-x-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded mt-2">
                                <Checkbox 
                                  id="trapperomGarGjennomAlleDeler"
                                  checked={formData.trapperomGarGjennomAlleDeler}
                                  onCheckedChange={(checked) => setFormData({...formData, trapperomGarGjennomAlleDeler: checked as boolean})}
                                />
                                <Label htmlFor="trapperomGarGjennomAlleDeler" className="text-sm cursor-pointer">
                                  Trapperommene går gjennom flere bygningsdeler (strengeste krav gjelder: <span className="font-bold">{strengesteTr}</span>)
                                </Label>
                              </div>
                            )}

                            {/* RK4: Brannvesen-tilgang */}
                            {harRK4 && (() => {
                              const rk4Del = trapperomDeler310.find(d => d.rk === 4)!;
                              const trType = formData.trapperomGarGjennomAlleDeler && harUlikeTrKrav ? strengesteTr : rk4Del.trType;
                              const generateRK4Text = (tilgang: boolean) => {
                                const prefix = harFlere ? `Bygningsdel ${rk4Del.index} (${rk4Del.navn}): ` : "";
                                if (tilgang) {
                                  return `${prefix}For risikoklasse 4 med ${rk4Del.etasjer} etasjer kreves ${trType}. Det er tilstrekkelig med ett trapperom da brannvesenet har tilkomst til hver boenhet med høydemateriell.`;
                                } else {
                                  return `${prefix}For risikoklasse 4 med ${rk4Del.etasjer} etasjer kreves ${trType}. Brannvesenet har ikke tilkomst til alle boenheter med høydemateriell. Byggverket må derfor ha minst to trapperom med separat atkomst fra alle tilknyttede brannceller.`;
                                }
                              };
                              return (
                                <>
                                  <div className="flex items-center space-x-2 p-2 bg-muted rounded mt-2">
                                    <Checkbox 
                                      id="brannvesenTilgangRK4"
                                      checked={formData.brannvesenTilgangRK4}
                                      onCheckedChange={(checked) => {
                                        const tilgang = checked as boolean;
                                        setFormData({
                                          ...formData, 
                                          brannvesenTilgangRK4: tilgang,
                                          rk4TrapperomTekst: generateRK4Text(tilgang)
                                        });
                                      }}
                                    />
                                    <Label htmlFor="brannvesenTilgangRK4" className="text-sm cursor-pointer">
                                      Brannvesenet har tilkomst til alle boenheter med høydemateriell (gjelder risikoklasse 4)
                                    </Label>
                                  </div>
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <Label className="text-xs text-muted-foreground">Trapperom-krav RK4 (redigerbar)</Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => setFormData({...formData, rk4TrapperomTekst: generateRK4Text(formData.brannvesenTilgangRK4)})}
                                      >
                                        Sett original tekst
                                      </Button>
                                    </div>
                                    <Textarea
                                      value={formData.rk4TrapperomTekst || generateRK4Text(formData.brannvesenTilgangRK4)}
                                      onChange={(e) => setFormData({...formData, rk4TrapperomTekst: e.target.value})}
                                      rows={3}
                                      className="text-sm"
                                    />
                                  </div>
                                </>
                              );
                            })()}

                            {/* Ikke-RK4: Tilstrekkelige utganger */}
                            {!alleErRK4 && (
                              <div className="flex items-center space-x-2 p-2 bg-muted rounded mt-2">
                                <Checkbox 
                                  id="tilstrekkeligeUtgangerUtenToTrapperom"
                                  checked={formData.tilstrekkeligeUtgangerUtenToTrapperom}
                                  onCheckedChange={(checked) => setFormData({...formData, tilstrekkeligeUtgangerUtenToTrapperom: checked as boolean})}
                                />
                                <Label htmlFor="tilstrekkeligeUtgangerUtenToTrapperom" className="text-sm cursor-pointer">
                                  Utgangene er tilstrekkelige uten krav om to trapperom (f.eks. direkte tilgang til det fri i flere plan)
                                </Label>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      </div>

                      {/* Bekreftelse dørkrav */}
                      {(() => {
                        const rk = formData.risikoklasse || "";
                        const bk = formData.brannklasse || "";
                        const harRK5 = rk === "RK5" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK5");
                        const erRK6IkkeBolig = (rk === "RK6" && !formData.erRKL6Boligbygning) || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK6" && !formData.erRKL6Boligbygning);
                        const bredde = (harRK5 || erRK6IkkeBolig) ? "1,16 m" : "0,86 m";
                        const strøm = bk === "BKL1" ? "30 min (BKL1)" : (bk === "BKL2" || bk === "BKL3") ? `60 min (${bk})` : null;
                        return (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-xs text-muted-foreground space-y-2">
                            <p className="font-medium text-foreground text-sm">✓ Dørkrav til rømningsvei inkludert i rapporten</p>
                            <p>Fri bredde: minimum {bredde}</p>
                            <p>Fri høyde: minimum 2,0 m</p>
                            <p>Åpningskraft: maks {formData.universellUtforming ? "30 N (universell utforming)" : "67 N"}</p>
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
                              {(() => {
                                const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                                  || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                                return (
                                  <>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox id="dorerLiteAntallPersoner" disabled={erKraftstasjon} checked={erKraftstasjon ? false : formData.dorerLiteAntallPersoner} onCheckedChange={(checked) => setFormData({...formData, dorerLiteAntallPersoner: checked as boolean})} />
                                      <Label htmlFor="dorerLiteAntallPersoner" className="text-xs cursor-pointer">Dør kan slå mot rømningsretning (lite antall personer)</Label>
                                    </div>
                                    {erKraftstasjon && (
                                      <p className="text-[11px] text-muted-foreground italic ml-6">Gjelder ikke for kraftstasjon — alle dører til og i rømningsvei skal slå ut i rømningsretning.</p>
                                    )}
                                  </>
                                );
                              })()}
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
                          <li>Krav til utgang fra branncelle {formData.regelverk === "BF85" ? "iht. BF85 Kap. 30:71–73 (avhengig av bygningstype og bygningsbrannklasse)" : "basert på risikoklasse og brannklasse"}</li>
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
                      </>
                      )}
                    </div>
                    {renderTilstandPanel("3_10")}
                    <FravikForParagraf paragrafId="11-13" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                      );
                    })()}

                    {!(documentType === "tilstandsvurdering" && formData.regelverk === "BF85") && (
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-11" label={`3.11 ${formData.regelverk === "BF85" ? "Trapperom og heissjakt (§ 11-14 Rømningsvei)" : "§ 11-14 Rømningsvei"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">3.11 {formData.regelverk === "BF85" ? "Trapperom og heissjakt (§ 11-14 Rømningsvei)" : "§ 11-14 Rømningsvei"}</Label>
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
                        {(() => {
                          const rk = formData.risikoklasse || "";
                          const erBolig = rk === "RK4" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK4");
                          const options = [
                            ...(erBolig ? [{ value: "en_trapp", label: "Tilstrekkelig med én trapp (bolig med brannvesen som sekundær rømning)" }] : []),
                            { value: "sammenfallende", label: "Sammenfallende rømningsretning" },
                            { value: "flere_trapper", label: "Flere trapper og utganger" },
                          ];
                          return options.map((opt) => {
                            const valg: string[] = Array.isArray(formData.romningsveiTrappeValg) ? formData.romningsveiTrappeValg : (formData.romningsveiTrappeValg ? [formData.romningsveiTrappeValg] : []);
                            const checked = valg.includes(opt.value);
                            return (
                              <div key={opt.value} className="flex items-center gap-2">
                                <Checkbox
                                  id={`trappevalg-${opt.value}`}
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    const newValg = c ? [...valg, opt.value] : valg.filter(v => v !== opt.value);
                                    setFormData({...formData, romningsveiTrappeValg: newValg});
                                  }}
                                />
                                <Label htmlFor={`trappevalg-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Del B: §11-14 punkt 3 - lengde i rømningsvei */}
                      {(() => {
                        const valg: string[] = Array.isArray(formData.romningsveiTrappeValg) ? formData.romningsveiTrappeValg : [];
                        if (valg.length === 0) return null;
                        const krav: { tekst: string; verdi: number }[] = [];
                        if (valg.includes("en_trapp")) krav.push({ tekst: "Krav: maksimalt 15 m (§ 11-14 punkt 3a).", verdi: 15 });
                        if (valg.includes("sammenfallende")) krav.push({ tekst: "Krav: maksimalt 15 m (§ 11-14 punkt 3b).", verdi: 15 });
                        if (valg.includes("flere_trapper")) krav.push({ tekst: "Krav: maksimalt 30 m (§ 11-14 punkt 3c).", verdi: 30 });
                        if (krav.length === 0) return null;
                        const strengeste = Math.min(...krav.map(k => k.verdi));
                        const prosjektVerdi = parseFloat(formData.romningsveiLengdeProsjekt) || 0;
                        const overskredet = prosjektVerdi > 0 && prosjektVerdi > strengeste;
                        return (
                          <div className="p-3 bg-muted/40 border rounded space-y-2">
                            <Label className="text-xs font-semibold text-foreground">Lengde i rømningsvei (§ 11-14 punkt 3)</Label>
                            <div className="space-y-0.5 text-xs text-foreground/90">
                              {krav.map((k, i) => <p key={i}>{k.tekst}</p>)}
                            </div>
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Lengste avstand i rømningsvei i prosjektet (m)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.romningsveiLengdeProsjekt}
                                onChange={(e) => setFormData({ ...formData, romningsveiLengdeProsjekt: e.target.value })}
                                className="max-w-[180px]"
                                placeholder="f.eks. 18"
                              />
                              {overskredet && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Prosjektert avstand ({prosjektVerdi} m) overstiger strengeste krav ({strengeste} m). Må dokumenteres som fravik.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Del C: §11-14 punkt 4 - fri bredde */}
                      {(() => {
                        const aktiveRK = getAktiveRiskKlasser(formData);
                        if (aktiveRK.length === 0) return null;
                        const krav = getStrengesteFriBredde(aktiveRK, formData.bygningstype);
                        // Persontall (areal / m² per person)
                        const arealPerPerson: Record<string, number> = {
                          forsamling_staende: 0.6, forsamling_stoler: 1, undervisning: 2, kontor: 10,
                          salg: 2, restaurant: 1.5, lager: 30,
                        };
                        const arealNum = parseFloat(formData.persontallAreal) || 0;
                        const faktor = arealPerPerson[formData.persontallKategori] || 0;
                        const persontall = arealNum > 0 && faktor > 0 ? Math.floor(arealNum / faktor) : 0;
                        const breddePersoner = persontall * 0.01; // 1 cm per person
                        const strengeste = Math.max(krav.bredde, breddePersoner);
                        const prosjektVerdi = parseFloat(formData.friBreddeProsjekt) || 0;
                        const utilstrekkelig = prosjektVerdi > 0 && prosjektVerdi < strengeste;
                        return (
                          <div className="p-3 bg-muted/40 border rounded space-y-2">
                            <Label className="text-xs font-semibold text-foreground">Fri bredde i rømningsvei (§ 11-14 punkt 4)</Label>
                            <p className="text-xs text-foreground/90">
                              Minimum fri bredde: <strong>{krav.bredde.toString().replace(".", ",")} m</strong>, samt minimum 1 cm per person.
                              {krav.merknad && <span className="text-muted-foreground italic"> {krav.merknad}</span>}
                            </p>
                            {persontall > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Persontall: {persontall} → krav fra persontall: {breddePersoner.toFixed(2).replace(".", ",")} m.
                              </p>
                            )}
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Prosjektert fri bredde (m)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.friBreddeProsjekt}
                                onChange={(e) => setFormData({ ...formData, friBreddeProsjekt: e.target.value })}
                                className="max-w-[180px]"
                                placeholder="f.eks. 1,20"
                              />
                              <p className="text-xs mt-1">
                                Strengeste krav for ditt prosjekt: <strong>{strengeste.toFixed(2).replace(".", ",")} m</strong>.
                                {prosjektVerdi > 0 && <> Du har angitt <strong>{prosjektVerdi.toString().replace(".", ",")} m</strong>.</>}
                              </p>
                              {utilstrekkelig && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Prosjektert bredde ({prosjektVerdi} m) er mindre enn strengeste krav ({strengeste.toFixed(2)} m). Må dokumenteres som fravik.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        );
                      })()}



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

                      {/* Ingen innsnevring og fri bredde i trapp er alltid inkludert - ingen knapper nødvendig */}

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
                      {(() => {
                        const erKraftstasjon = (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
                          || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
                        return (
                          <div className="flex flex-col gap-1 p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="romningsveiPanikkbeslag"
                                disabled={erKraftstasjon}
                                checked={erKraftstasjon ? true : formData.romningsveiPanikkbeslag}
                                onCheckedChange={(checked) => setFormData({...formData, romningsveiPanikkbeslag: checked === true})}
                              />
                              <Label htmlFor="romningsveiPanikkbeslag" className="text-xs cursor-pointer">
                                Krav til panikkbeslag er relevant (RK5/RK6/skoler)
                              </Label>
                            </div>
                            {erKraftstasjon && (
                              <p className="text-[11px] text-muted-foreground italic ml-6">Påkrevd for kraftstasjon (NS-EN 1125).</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Bekreftelse på automatiske krav inkludert i rapporten */}
                      {(() => {
                        const rk = formData.risikoklasse || "";
                        const harRK3 = rk === "RK3" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK3");
                        const harRK5 = rk === "RK5" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK5");
                        const harRK6 = rk === "RK6" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK6");
                        const harRK4 = rk === "RK4" || formData.bygningsdeler?.some((d: any) => d.risikoklasse === "RK4");
                        const erBredRK = harRK3 || harRK5 || harRK6;
                        const bredde = erBredRK ? "1,16 m" : "0,86 m";
                        const bk = formData.brannklasse || "";
                        const bbk = formData.bygningsbrannklasse || "(ikke angitt)";
                        return (
                          <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                            <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                            <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                              {formData.regelverk === "BF85" ? (
                                <>
                                  <li>Krav til trapperom og heissjakt iht. BF85 Kap. 30:7 (åpne, lukkede, branntrygge og røykfrie trapperom)</li>
                                  <li>Bygningsdeler som omgir trapperom og heissjakt iht. Tabell 30:41 (bygningsbrannklasse {bbk})</li>
                                  <li>Krav til antall, bredde og dører i rømningsvei iht. Tabell 30:75</li>
                                  {formData.romningsveiKorridorOver30m && <li>Krav til seksjonering av lange korridorer</li>}
                                  {formData.romningsveiSvalgang && <li>Krav til svalgang/altangang som rømningsvei</li>}
                                </>
                              ) : (
                                <>
                                  <li>Generelle krav til rømningsvei</li>
                                  <li>Fri bredde i rømningsvei: min. {bredde} ({erBredRK ? `RK${[harRK3 && "3", harRK5 && "5", harRK6 && "6"].filter(Boolean).join("/")}` : rk || "RK1/2/4"})</li>
                                  <li>Hovedatkomst tilrettelagt for sikker rømning</li>
                                  <li>Dørkrav i rømningsvei: fri bredde min. {bredde}, høyde min. 2,0 m, åpningskraft maks {formData.universellUtforming ? "30 N" : "67 N"}</li>
                                  {(bk === "BKL2" || bk === "BKL3") && <li>Avbruddsfri strømforsyning (UPS) for {bk === "BKL2" ? "60 min (BKL2)" : "60 min (BKL3)"}</li>}
                                  {bk === "BKL1" && <li>Avbruddsfri strømforsyning (UPS) for 30 min (BKL1)</li>}
                                  {formData.romningsveiRomMaks20 && <li>Krav til rom i rømningsvei inntil 20 m²</li>}
                                  {formData.romningsveiRom50E30 && <li>Krav til oppholdsrom inntil 50 m² i rømningsvei</li>}
                                  {formData.romningsveiSvalgang && <li>Krav til svalgang/altangang som rømningsvei</li>}
                                  {formData.romningsveiKorridorOver30m && <li>Krav til seksjonering av korridor over 30 m (E 30-CSa)</li>}
                                  {formData.romningsveiPanikkbeslag && <li>Krav til panikkbeslag</li>}
                                  <li>Fri bredde i trapp: min. {bredde}</li>
                                   <li>Krav om ingen innsnevring i rømningsvei</li>
                                   {((formData.bygningstype || "").toLowerCase().includes("kraftstasjon") || (formData.bygningsdeler || []).some((d: any) => (d.bygningstype || "").toLowerCase().includes("kraftstasjon"))) && (
                                     <li>Dører til og i rømningsvei skal alltid slå ut i rømningsretning – kraftstasjon (uavhengig av persontall)</li>
                                   )}
                                 </>
                              )}
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
                    <FravikForParagraf paragrafId="11-14" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    )}
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-12" label={`${isBF85Tilstand ? "3.11" : "3.12"} ${formData.regelverk === "BF85" ? "Tilrettelegging for redning av husdyr (§ 11-15)" : "§ 11-15 Redning av husdyr"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">{isBF85Tilstand ? "3.11" : "3.12"} {formData.regelverk === "BF85" ? "Tilrettelegging for redning av husdyr (§ 11-15)" : "§ 11-15 Tilrettelegging for redning av husdyr"}</Label>
                      </div>
                      {isBF85Tilstand && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded text-xs text-foreground/90 mb-2">
                          Byggeforskrift 1985 hadde ingen egne krav til tilrettelegging for redning av husdyr. Dersom dette er relevant for tiltaket, brukes TEK17 § 11-15 med tilhørende preaksepterte ytelser i VTEK17 som referanse.
                        </div>
                      )}
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

                      {/* Valg av dyretyper */}
                      {formData.husdyrRedningRelevant && (
                        <div className="p-2 bg-muted/50 rounded space-y-2">
                          <Label className="text-xs font-medium block">Hvilke dyr skal det prosjekteres for?</Label>
                          {[
                            { value: "storfe_hest", label: "Storfe og hest (fri bredde min. 1,6 m)" },
                            { value: "gris_sau_geit", label: "Gris, sau og geit (fri bredde min. 1,0 m)" },
                          ].map((dyr) => {
                            const valgte: string[] = Array.isArray(formData.husdyrTyper) ? formData.husdyrTyper : [];
                            const checked = valgte.includes(dyr.value);
                            return (
                              <div key={dyr.value} className="flex items-center gap-2">
                                <Checkbox
                                  id={`husdyr-${dyr.value}`}
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    const newValg = c ? [...valgte, dyr.value] : valgte.filter(v => v !== dyr.value);
                                    setFormData({...formData, husdyrTyper: newValg});
                                  }}
                                />
                                <Label htmlFor={`husdyr-${dyr.value}`} className="text-xs cursor-pointer">{dyr.label}</Label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Info om automatiske krav */}
                      {formData.husdyrRedningRelevant && (
                        <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                          <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten{isBF85Tilstand ? " (TEK17 § 11-15 brukes som referanse)" : ""}:</p>
                          <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                            <li>Krav til rømningsveier for husdyr</li>
                            <li>Branncelleinndeling for husdyrrom</li>
                            <li>Varsling ved brann i driftsbygninger</li>
                            {(() => {
                              const typer: string[] = Array.isArray(formData.husdyrTyper) ? formData.husdyrTyper : [];
                              return (<>
                                {typer.includes("storfe_hest") && <li>Fri bredde min. 1,6 m (storfe og hest)</li>}
                                {typer.includes("gris_sau_geit") && <li>Fri bredde min. 1,0 m (gris, sau og geit)</li>}
                              </>);
                            })()}
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
                    <FravikForParagraf paragrafId="11-15" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-13" label={`${isBF85Tilstand ? "3.12" : "3.13"} ${formData.regelverk === "BF85" ? "Slokkingsredskap og slokkingsvann (§ 11-16 Tilrettelegging for manuell slokking)" : "§ 11-16 Manuell slokking"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">{isBF85Tilstand ? "3.12" : "3.13"} {formData.regelverk === "BF85" ? "Slokkingsredskap og slokkingsvann (§ 11-16 Tilrettelegging for manuell slokking)" : "§ 11-16 Manuell slokking"}</Label>
                      </div>
                      {(() => {
                        const alleRK = formData.bygningsdeler?.length
                          ? [...new Set(formData.bygningsdeler.map((d: any) => d.risikoklasse).filter(Boolean))]
                          : formData.risikoklasse ? [formData.risikoklasse] : [];
                        const isRK356 = alleRK.some((rk: string) => ["RK3","RK5","RK6"].includes(rk));
                        const isRK124 = alleRK.some((rk: string) => ["RK1","RK2","RK4"].includes(rk));
                        
                        const kravTekst = formData.regelverk === "BF85"
                          ? "BF 85 spesifiserer ikke type slokkeutstyr – velg hva som skal benyttes."
                          : isRK356 
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
                                  Brannslange {formData.regelverk !== "BF85" && isRK356 && "(krav for RK 3, 5, 6)"}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="slokkeHandslukker"
                                  checked={formData.slokkeHandslukker}
                                  onCheckedChange={(checked) => setFormData({...formData, slokkeHandslukker: checked === true})}
                                />
                                <Label htmlFor="slokkeHandslukker" className="text-xs cursor-pointer">
                                  Håndslokkeapparat {formData.regelverk !== "BF85" && isRK124 && "(krav for RK 1, 2, 4)"}
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

                        // ===== BF 85-grenen =====
                        if (formData.regelverk === "BF85") {
                          const lcBT = (formData.bygningstype || "").toLowerCase();
                          const delerBT = (formData.bygningsdeler || []).map((d: any) => (d.bygningstype || "").toLowerCase());
                          const erKraftstasjon = lcBT.includes("kraftstasjon") || delerBT.some((b: string) => b.includes("kraftstasjon"));
                          const erIndustri = lcBT.includes("industri") || delerBT.some((b: string) => b.includes("industri")) || erKraftstasjon;

                          const kildeNote = erKraftstasjon
                            ? "Vurderingen baseres på BF 85 og DSBs veiledning til kraftstasjoner."
                            : erIndustri
                              ? "Vurderingen baseres på BF 85 (industri – bygningsrådets skjønn)."
                              : "BF 85 stiller ikke spesifikke krav til manuelt slokkeutstyr for denne bygningstypen. Bygningsrådet kan likevel kreve dette.";

                          const brukerKrav: string[] = [];
                          if (formData.slokkeBrannslange) {
                            if (erKraftstasjon) {
                              brukerKrav.push("Brannslange bør være på trommel med senterinnføring av vann.");
                              brukerKrav.push("Innvendig diameter minst 19 mm.");
                              brukerKrav.push("Slangelengde maks 30 m.");
                              brukerKrav.push("Bruk kuleventil; kranene prøves jevnlig.");
                              brukerKrav.push("Kilde: DSB-veiledning om brannvern i kraftstasjoner.");
                            } else {
                              brukerKrav.push("Brannslange – plasseres slik at den dekker alle rom; maks 30 m ved fullt uttrekk; skal ikke plasseres i trapperom.");
                            }
                          }
                          if (formData.slokkeHandslukker) {
                            brukerKrav.push("Håndslokker – min. 6 kg ABC-pulver eller 9 liter skum/vann; plasseres tilgjengelig og merket.");
                          }

                          const generelleKravBF85: string[] = [
                            "Slokkeutstyr skal være lett tilgjengelig og dekke alle rom",
                            "Plassering skal være tydelig markert med skilt",
                            "Tilvisningsskilt skal stå på tvers av ferdselsretningen",
                          ];

                          return (
                            <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-2">
                              <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                              <p className="italic text-foreground/70">{kildeNote}</p>

                              {erIndustri && (
                                <div>
                                  <p className="font-medium text-foreground/90 mb-0.5">Generelt:</p>
                                  <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                    <li>Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr.</li>
                                  </ul>
                                </div>
                              )}

                              {erKraftstasjon && (
                                <div>
                                  <p className="font-medium text-foreground/90 mb-0.5">Manuelt slokkeutstyr – kraftstasjon:</p>
                                  <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                    <li>Det skal utplasseres hensiktsmessig og tilstrekkelig manuelt slokkeutstyr som skal kunne brukes i alle rom i anlegget. Med manuelt slokkeutstyr menes alt slokkeutstyr som betjenes av personell, dvs. brannslanger og transportable slokkeapparater av ulik utforming og for ulike bruksområder. Utstyret må være avpasset etter den brann som ventes å oppstå.</li>
                                  </ul>
                                </div>
                              )}

                              {brukerKrav.length > 0 && (
                                <div>
                                  <p className="font-medium text-foreground/90 mb-0.5">Valgt slokkeutstyr:</p>
                                  <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                    {brukerKrav.map((k, i) => <li key={`u${i}`}>{k}</li>)}
                                  </ul>
                                </div>
                              )}

                              <div>
                                <p className="font-medium text-foreground/90 mb-0.5">Generelle krav:</p>
                                <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                                  {generelleKravBF85.map((k, i) => <li key={`g${i}`}>{k}</li>)}
                                </ul>
                              </div>

                              <p className="text-foreground/60 mt-1">Du kan endre valgene med knappene ovenfor.</p>
                            </div>
                          );
                        }

                        // ===== TEK17-grenen (uendret) =====
                        const kravListe: string[] = [];
                        if (harRK356) kravListe.push(`Brannslange (krav for RK ${["RK3","RK5","RK6"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")})`);
                        if (harRK124) kravListe.push(`Håndslokkeapparat (krav for RK ${["RK1","RK2","RK4"].filter(rk => alleRK.includes(rk)).map(rk => rk.replace("RK","")).join(", ")})`);

                        const generelleKrav: string[] = [
                          "Manuelt slokkeutstyr skal dekke alle rom i bygget",
                          "Slokkeutstyret skal være lett tilgjengelig for bruk i en tidlig fase av brannen",
                          "Plassering skal være tydelig merket med skilt",
                          "Skiltene skal være etterlysende (fotoluminiscerende) eller belyst med nødlys",
                          "Tilvisningsskilt for slokkeutstyr skal stå på tvers av ferdselsretningen",
                          "For materiell som krever bruksanvisning, skal denne finnes på eller ved materiellet"
                        ];

                        const brannslangekrav: string[] = [];
                        if (formData.slokkeBrannslange) {
                          brannslangekrav.push("Brannslange maks 30 meter ved fullt uttrekk");
                          brannslangekrav.push("Brannslangeskap skal ikke plasseres i trapperom");
                          brannslangekrav.push("Ref. NS-EN 671-1:2012 – Slangetromler med formstabil slange");
                        }

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
                    <FravikForParagraf paragrafId="11-16" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
                    </SectionCollapsible>
                    <SectionCollapsible forceOpen={allKap3Open} previewId="preview-3-14" label={`${isBF85Tilstand ? "3.13" : "3.14"} ${formData.regelverk === "BF85" ? "Atkomst for brannvesenet (§ 11-17 Tilrettelegging for rednings- og slokkemannskap)" : "§ 11-17 Tilrettelegging for slokkemannskap"}`}>
                    <div className="space-y-2">
                      <div className="border-b-2 border-foreground/20 pb-2 mb-3">
                        <Label className="text-base font-extrabold text-foreground">{isBF85Tilstand ? "3.13" : "3.14"} {formData.regelverk === "BF85" ? "Atkomst for brannvesenet (§ 11-17 Tilrettelegging for rednings- og slokkemannskap)" : "§ 11-17 Tilrettelegging for slokkemannskap"}</Label>
                      </div>
                      {!isBF85Tilstand && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="hoyderedskapRelevant"
                            checked={formData.hoyderedskapRelevant}
                            onCheckedChange={(checked) => setFormData({...formData, hoyderedskapRelevant: checked === true})}
                          />
                          <Label htmlFor="hoyderedskapRelevant" className="text-sm font-medium">Tilgjengelighet for høyderedskap (inntil 8 etasjer)</Label>
                        </div>
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
                          <Label htmlFor="harUniversalnokkel" className="text-sm font-medium">Bygget har mer enn 50 rom (krav til universalnøkkel / nøkkelskap)</Label>
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
                      )}
                      <div className="mb-3">
                        <Label className="text-xs font-medium mb-1 block">Tilrettelegging for rednings- og slokkemannskap</Label>
                        <Textarea 
                          value={formData.redningsmannskap}
                          onChange={(e) => setFormData({...formData, redningsmannskap: e.target.value})}
                         />
                      </div>
                      {!isBF85Tilstand && (
                      <div className="mb-3">
                        <Label className="text-xs font-medium mb-1 block">Krav til utforming av kjørevei for kjøretøy</Label>
                        <Textarea
                          value={formData.kjoreveiKrav ?? "Følgende legges til grunn ved utforming av kjørevei for kjøretøy:\n- Kjørebredde, minst: 4,0 meter\n- Stigningsforhold, maksimalt: 1:8 (12,5 %)\n- Fri kjørehøyde, minst: 4 meter\n- Svingradius, ytterkant vei, minst: 12 meter\n- Akseltrykk, minst: 10 tonn\n- Boggitrykk, minst: 16 tonn"}
                          onChange={(e) => setFormData({...formData, kjoreveiKrav: e.target.value})}
                          rows={8}
                        />
                      </div>
                      )}
                      {!isBF85Tilstand && (formData.hoyderedskapRelevant || formData.byggOver23m) && (
                      <div className="mb-3">
                        <Label className="text-xs font-medium mb-1 block">Krav til utforming av oppstillingsplasser for høyderedskaper</Label>
                        <Textarea
                          value={formData.oppstillingsplassKrav ?? "Følgende legges til grunn ved utforming av oppstillingsplasser for høyderedskaper:\n- Bredde på oppstillingsplass, minst: 7 meter\n- Lengde på oppstillingsplass, minst: 12 meter\n- Stigningsforhold på oppstillingsplass, maksimalt: 3,5 %\n- Punktbelastning støtteben: Maks. jordtrykk u/markplate 11,7 kg/cm²"}
                          onChange={(e) => setFormData({...formData, oppstillingsplassKrav: e.target.value})}
                          rows={6}
                        />
                      </div>
                      )}
                      {/* Info om automatiske krav */}
                      <div className="p-3 bg-accent/30 border border-accent rounded text-xs space-y-1">
                        <p className="font-semibold text-foreground">✓ Følgende krav er automatisk inkludert i rapporten:</p>
                        <ul className="ml-4 list-disc text-foreground/80 space-y-0.5">
                          {formData.regelverk === "BF85" ? (
                            <>
                              <li>Krav til kjøreatkomst for brannvesenet iht. BF85 Kap. 30:92</li>
                              <li>Krav til atkomst til loft og yttertak iht. Kap. 30:94</li>
                              <li>Krav til atkomst til kjeller iht. Kap. 30:95</li>
                              {formData.romningsvinduRelevant && (
                                <li>Vindu/balkong som rømningsvei – tilgjengelighet for høyderedskap (basert på valg i kap. 3.10)</li>
                              )}
                            </>
                          ) : (
                            <>
                              <li>Generelle krav til plassering, utforming og merking</li>
                              <li>Kjørbar atkomst til hovedinngang og angrepsvei</li>
                              {formData.romningsvinduRelevant && (
                                <li>Vindu/balkong som rømningsvei – tilgjengelighet for høyderedskap (basert på valg i kap. 3.10)</li>
                              )}
                            </>
                          )}
                        </ul>
                      </div>
                      {formData.regelverk === "BF85" && (() => {
                        const ytter = getYtterveggBrannmotstandBF85(formData.bygningsbrannklasse || "");
                        return ytter ? (
                          <div className="p-3 bg-muted/50 border border-border rounded text-xs space-y-1 mt-2">
                            <p className="font-semibold text-foreground">Ikke-bærende ytterveggers brannmotstand (Tabell 30:512)</p>
                            <p className="text-foreground/80">{ytter.tekst}</p>
                          </div>
                        ) : null;
                      })()}
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
                    <FravikForParagraf paragrafId="11-17" projectId={selectedProjectId} konseptId={conceptId} fravikList={fravikList} firstFravikConceptId={firstFravikConceptId} hasFravikDokument={hasFravikDokument} refresh={refreshFravik} />
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
                <AccordionItem value="kap5" disabled={regelverkLocked} className={`border-2 border-blue-200 rounded-lg mb-4 overflow-hidden ${regelverkLocked ? 'opacity-60' : ''}`}>
                  <div className={`flex items-center bg-blue-50 ${regelverkLocked ? 'cursor-not-allowed' : 'hover:bg-blue-100'} px-4 py-3`} title={regelverkLocked ? 'Velg regelverk i kap. 1 for å låse opp' : undefined}>
                    <AccordionTrigger disabled={regelverkLocked} className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline disabled:cursor-not-allowed">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
                        Revisjonshistorikk
                        {regelverkLocked && (
                          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-2">
                            <Lock className="h-3.5 w-3.5" />
                            Velg regelverk i kap. 1 for å låse opp
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <button type="button" disabled={regelverkLocked} onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap5')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Gå til i forhåndsvisning">
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
                               <th className="px-2 py-1.5 text-left font-medium">{documentType === "tilstandsvurdering" ? "Utførende" : "Prosjekterende"}</th>
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
                <AccordionItem value="kap6" disabled={regelverkLocked} className={`border-2 border-blue-200 rounded-lg mb-4 overflow-hidden ${regelverkLocked ? 'opacity-60' : ''}`}>
                  <div className={`flex items-center bg-blue-50 ${regelverkLocked ? 'cursor-not-allowed' : 'hover:bg-blue-100'} px-4 py-3`} title={regelverkLocked ? 'Velg regelverk i kap. 1 for å låse opp' : undefined}>
                    <AccordionTrigger disabled={regelverkLocked} className="text-lg font-bold text-blue-800 flex-1 p-0 hover:no-underline disabled:cursor-not-allowed">
                      <span className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
                        Litteraturhenvisninger
                        {regelverkLocked && (
                          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-2">
                            <Lock className="h-3.5 w-3.5" />
                            Velg regelverk i kap. 1 for å låse opp
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <button type="button" disabled={regelverkLocked} onClick={(e) => { e.stopPropagation(); document.getElementById('preview-kap6')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="p-1.5 ml-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Gå til i forhåndsvisning">
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
                  <div className="flex items-center bg-amber-500/10">
                    <AccordionTrigger className="text-lg font-bold hover:bg-amber-500/15 px-4 py-3 text-amber-700 flex-1">
                      <span className="flex items-center gap-3">
                        <span className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">!</span>
                        Fravik og kompenserende tiltak
                      </span>
                    </AccordionTrigger>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetId = documentType === "tilstandsvurdering" ? "preview-oppsummering-avvik" : "preview-fravik";
                        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="p-1.5 mr-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Gå til i forhåndsvisning"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                    {documentType === "tilstandsvurdering" && (() => {
                      const tv = formData.tilstandsvurderinger || {};
                      const gradLabel: Record<string, string> = { tg0: "TG 0", tg1: "TG 1", tg2: "TG 2", tg3: "TG 3", tgiu: "TG IU" };

                      type AvvikRad = { sectionKey: string; sectionLabel: string; idx: number; grad: string; beskrivelse: string };
                      const samleAvvik = (kind: "tiltak" | "fravik"): AvvikRad[] => {
                        const ut: AvvikRad[] = [];
                        tilstandSectionsTEK17.forEach(s => {
                          const data: TilstandData = tv[s.key] || emptyTilstand();
                          const k = getKategorier(data);
                          const kat: any = kind === "tiltak" ? k.tiltak : k.fravik;
                          const liste: any[] = Array.isArray(kat?.avvik) && kat.avvik.length > 0
                            ? kat.avvik
                            : ((kat?.beskrivelse || (kat?.bilder && kat.bilder.length > 0))
                                ? [{ grad: data.grad, beskrivelse: kat.beskrivelse || "", bilder: kat.bilder || [] }]
                                : []);
                          liste.forEach((a, i) => {
                            ut.push({
                              sectionKey: s.key,
                              sectionLabel: s.label,
                              idx: i,
                              grad: a.grad || data.grad || "",
                              beskrivelse: a.beskrivelse || "",
                            });
                          });
                        });
                        return ut;
                      };

                      const tiltakRows = samleAvvik("tiltak");
                      const fravikRows = samleAvvik("fravik");

                      const updateAvvikBeskrivelse = (sectionKey: string, kind: "tiltak" | "fravik", idx: number, value: string) => {
                        const current: TilstandData = tv[sectionKey] || emptyTilstand();
                        const k = getKategorier(current);
                        const kat: any = kind === "tiltak" ? k.tiltak : k.fravik;
                        let avvikListe: any[] = Array.isArray(kat?.avvik) ? [...kat.avvik] : [];
                        if (avvikListe.length === 0 && (kat?.beskrivelse || (kat?.bilder && kat.bilder.length > 0))) {
                          avvikListe = [{ grad: current.grad, beskrivelse: kat.beskrivelse || "", bilder: kat.bilder || [] }];
                        }
                        if (avvikListe[idx]) {
                          avvikListe[idx] = { ...avvikListe[idx], beskrivelse: value };
                        }
                        const oppdatertKat = { ...kat, beskrivelse: "", bilder: [], avvik: avvikListe };
                        const next: TilstandData = {
                          ...current,
                          beskrivelse: "",
                          bilder: [],
                          tiltak: kind === "tiltak" ? oppdatertKat : k.tiltak,
                          fravik: kind === "fravik" ? oppdatertKat : k.fravik,
                        } as TilstandData;
                        updateTilstand(sectionKey, next);
                      };

                      const renderGroup = (
                        title: string,
                        helper: string,
                        items: AvvikRad[],
                        kind: "tiltak" | "fravik",
                        accent: { wrap: string; chip: string; title: string },
                      ) => (
                        <div className={`rounded-md border p-3 ${accent.wrap}`}>
                          <h4 className={`text-sm font-bold uppercase tracking-wide mb-1 ${accent.title}`}>{title}</h4>
                          <p className="text-[11px] text-muted-foreground mb-3">{helper}</p>
                          {items.length === 0 ? (
                            <p className="text-xs italic text-muted-foreground">Ingen avvik registrert i denne kategorien. Avvik registreres under kapittel 3.x.</p>
                          ) : (
                            <div className="space-y-3">
                              {items.map((r) => (
                                <div key={`${r.sectionKey}-${r.idx}`} className="rounded border bg-background p-2">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-xs font-semibold">{r.sectionLabel} – Avvik {r.idx + 1}</span>
                                    {r.grad && (
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accent.chip}`}>
                                        {gradLabel[r.grad] || ""}
                                      </span>
                                    )}
                                  </div>
                                  <Textarea
                                    value={r.beskrivelse}
                                    onChange={(e) => updateAvvikBeskrivelse(r.sectionKey, kind, r.idx, e.target.value)}
                                    rows={3}
                                    className="text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );

                      const ingenAvvik = tiltakRows.length === 0 && fravikRows.length === 0;

                      return (
                        <div className="space-y-4">
                          <p className="text-xs text-muted-foreground">
                            Samlet oversikt over avvik registrert i tilstandsvurderingen. Endringer her oppdaterer samme avvik som i kapittel 3.x og i rapportens oppsummering.
                          </p>
                          {ingenAvvik && (
                            <p className="text-xs italic text-muted-foreground">Ingen avvik registrert ennå. Avvik registreres under kapittel 3.x.</p>
                          )}
                          {renderGroup(
                            "Avvik som krever aktive tiltak",
                            "Avvik som må utbedres / settes tilbake til riktig stand.",
                            tiltakRows,
                            "tiltak",
                            { wrap: "border-red-300 bg-red-50/60 dark:bg-red-950/20 dark:border-red-800", chip: "bg-red-100 text-red-800 border-red-300", title: "text-red-800 dark:text-red-300" },
                          )}
                          {renderGroup(
                            "Avvik som kan fraviksbehandles",
                            "Avvik som vurderes akseptable og dokumenteres som fravik.",
                            fravikRows,
                            "fravik",
                            { wrap: "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800", chip: "bg-amber-100 text-amber-800 border-amber-300", title: "text-amber-800 dark:text-amber-300" },
                          )}
                        </div>
                      );
                    })()}
                    <div>
                      <Label className="text-xs font-medium mb-1 block">
                        {documentType === "tilstandsvurdering" ? "Generelle merknader (valgfritt)" : "Beskriv eventuelle fravik og kompenserende tiltak (valgfritt)"}
                      </Label>
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
          {isDemoMode ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 text-center">
              <p className="text-sm text-amber-900 dark:text-amber-200 mb-2">
                Lagring, deling og nedlasting krever innlogging.
              </p>
              <Link to="/auth">
                <Button size="sm" variant="outline" className="border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                  <LogIn className="h-4 w-4 mr-2" />
                  Logg inn for full tilgang
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                size="lg"
                onClick={handleSave}
                disabled={isSaving || !conceptName}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Lagrer..." : "Lagre endringer"}
              </Button>
              {isFullAccess && (
                <>
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
                </>
              )}
            </>
          )}
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
                      <div className="flex flex-col items-end gap-1">
                        <Button variant="outline" size="sm" onClick={exportToWord}>
                          <Download className="h-4 w-4 mr-2" />
                          Last ned Word
                        </Button>
                        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                          <Checkbox
                            checked={formData.inkluderReferansetabeller}
                            onCheckedChange={(c) => setFormData({ ...formData, inkluderReferansetabeller: c === true })}
                            className="h-3.5 w-3.5"
                          />
                          Inkluder referansetabeller i rapport
                        </label>
                      </div>
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
