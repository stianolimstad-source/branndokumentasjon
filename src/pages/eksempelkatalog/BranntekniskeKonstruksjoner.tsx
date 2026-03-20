import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, Layers, ArrowLeft, Home, Building2, PipetteIcon, DoorOpen, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface KonstruksjonEksempel {
  navn: string;
  kortbeskrivelse: string;
  beskrivelse: string;
  oppbygging: string[];
  brannklasse: string;
  lydklasse?: string;
  tykkelse?: string;
  leverandor: string;
  referanse: string;
  referanseUrl: string;
  merknader?: string;
}

interface Kategori {
  navn: string;
  icon: React.ElementType;
  eksempler: KonstruksjonEksempel[];
}

const ei30Kategorier: Kategori[] = [
  {
    navn: "Innervegger",
    icon: Home,
    eksempler: [
      {
        navn: "Norgips W111 — Enkel stålstendervegg",
        kortbeskrivelse: "Enkleste EI 30-vegg. Enkel gips på stålstender.",
        beskrivelse: "Ikke-bærende branncellevegg med stålstendere og enkel gipsplatekledning på begge sider. Den enkleste og mest brukte EI 30-veggen.",
        oppbygging: [
          "1× 13 mm Norgips Standard gipsplate (hver side)",
          "Stålstender Norgips dB+ c/c 450 eller 600 mm",
          "Skinne mot gulv og tak",
          "Isolasjon ikke nødvendig for EI 30 (kan tilføres for lyd)",
        ],
        brannklasse: "EI 30",
        lydklasse: "R'w 30–48 dB",
        tykkelse: "ca. 70–95 mm",
        leverandor: "Norgips",
        referanse: "Norgips – Innervegger W111",
        referanseUrl: "https://norgips.no/prosjektering/vegger-med-st%C3%A5l/innervegger",
      },
      {
        navn: "BB Stål Skilleveggsystem — SINTEF TG",
        kortbeskrivelse: "Tynnplateprofiler med SINTEF godkjenning. For kontorbygg.",
        beskrivelse: "Ikke-bærende skilleveggsystem basert på tynnplateprofiler med SINTEF Teknisk Godkjenning. Egnet for kontorbygg og næringsbygg.",
        oppbygging: [
          "Tynnplateprofiler i stål (BB Stål)",
          "Gipsplatekledning på begge sider",
          "Mineralullisolasjon i hulrom",
        ],
        brannklasse: "EI 30",
        leverandor: "BB Stål AS",
        referanse: "SINTEF Teknisk Godkjenning – BB Stål Skilleveggsystem",
        referanseUrl: "https://www.sintefcertification.no/product/download/10305",
        merknader: "Vær oppmerksom på vegghøydebegrensninger i typegodkjenningen (normalt 3300 mm).",
      },
      {
        navn: "Norgips W111 Trestender — Enkel gips på trestender",
        kortbeskrivelse: "EI 30 med ett lag 12,5 mm gips på trestender. Enkleste trevegg.",
        beskrivelse: "Ikke-bærende innervegg med trestendere og enkel gipsplatekledning (1/1) på begge sider. Dokumentert EI 30 iht. Norgips veggtabell for trestender (TE 68 1/1 M50).",
        oppbygging: [
          "1× 12,5 mm Norgips Standard / Hard / Humidboard (hver side)",
          "Trestender C24, min. 48×68 mm, c/c 600 mm",
          "Mineralull 50 mm i hulrom (densitet 13 kg/m³)",
        ],
        brannklasse: "EI 30",
        lydklasse: "R'w 35 dB",
        tykkelse: "ca. 98 mm (med 68 mm stender)",
        leverandor: "Norgips",
        referanse: "Norgips Veggtabell – Trestender W111 (TE 68 1/1 M50)",
        referanseUrl: "https://byggeteknikk.norgips.no/prosjektering/innervegger/veggtabell/veggtabell-trestender/",
        merknader: "For bærende vegger med 98 mm stender oppnås B1=15 min, B2=15 min.",
      },
    ],
  },
  {
    navn: "Yttervegger",
    icon: Building2,
    eksempler: [
      {
        navn: "Trekonstruksjon — Yttervegg med 30 min brannmotstand",
        kortbeskrivelse: "Yttervegg i trehus. For lave bygg nær nabobygg.",
        beskrivelse: "Yttervegg i trehus med branncellebegrensende funksjon (EI 30). Typisk for lave bygninger (gesims ≤ 9 m) som ligger nærmere enn 8 m til nabobygning.",
        oppbygging: [
          "Innvendig kledning: 13 mm gipsplate",
          "Dampsperre / vindsperre",
          "Trestendere med mineralullisolasjon",
          "Utvendig vindsperre og kledning",
        ],
        brannklasse: "EI 30",
        leverandor: "Generell trekonstruksjon",
        referanse: "SINTEF Byggforsk 520.308 – Brannmotstand for tak og yttervegger i lave bygninger",
        referanseUrl: "https://www.byggforsk.no/dokument/313/yttervegger_og_tak_i_trehus_med_30_minutters_brannmotstand",
        merknader: "Se også SINTEF-artikkel om riktig brannmotstand for tak og yttervegger.",
      },
    ],
  },
  {
    navn: "Himlinger",
    icon: Layers,
    eksempler: [
      {
        navn: "Gyproc PS himling — EI 30 nedforet himling",
        kortbeskrivelse: "Nedforet himling med stålprofiler og gipsplate.",
        beskrivelse: "Nedforet himling med primær- og sekundærprofiler i stål og gipsplatekledning som gir EI 30 brannmotstand nedenfra.",
        oppbygging: [
          "1× 15 mm Gyproc brannplate (eller 2× 13 mm)",
          "Primær- og sekundærprofiler i stål (GK-system)",
          "Oppheng med pendler/fjærstreng",
        ],
        brannklasse: "EI 30",
        tykkelse: "Variabel (avhengig av opphengshøyde)",
        leverandor: "Gyproc / Glava",
        referanse: "Gyproc – Himling med primær- og sekundærprofiler EI 30",
        referanseUrl: "https://www.gyproc.no/losninger/himling-med-prim%C3%A6r-og-sekund%C3%A6rprofiler-EI-30",
      },
    ],
  },
  {
    navn: "Gjennomføringer og detaljer",
    icon: PipetteIcon,
    eksempler: [
      {
        navn: "ROCKWOOL Rørgjennomføring — EI 30 til EI 120",
        kortbeskrivelse: "Branntettet rørgjennomføring med Rørskål 800.",
        beskrivelse: "Branntettet rørgjennomføring gjennom branncellebegrensende konstruksjon med ROCKWOOL Rørskål 800. Dokumentert for EI 30 til EI 120 avhengig av dimensjonering.",
        oppbygging: [
          "ROCKWOOL Rørskål 800 (tykkelse etter tabell)",
          "Branntetting rundt gjennomføring",
          "Dimensjoneres etter rørmateriale og brannkrav",
        ],
        brannklasse: "EI 30 – EI 120",
        leverandor: "ROCKWOOL",
        referanse: "ROCKWOOL – Rørgjennomføring Rørskål 800 (monteringsanvisning 8.55)",
        referanseUrl: "https://www.rockwool.com/syssiteassets/o2-rockwool/dokumentasjon-og-sertifikater/dokumentasjon/branndokumentasjon/roergjennomfoeringer/8.55-ei-30-ei-120-roergjennomfoering-roerskaal-800.pdf",
        merknader: "KIWA Byggproduktcertifikat 1583. Ulik dimensjonering for horisontale og vertikale rør.",
      },
      {
        navn: "Gyproc Planex™ — Branngipsluke EI 30",
        kortbeskrivelse: "Inspeksjonsluke med EI 30 for gipsvegg/himling.",
        beskrivelse: "Inspeksjonsluke i gipsvegg eller himling med EI 30 brannmotstand. Monteres direkte i gipsplatekonstruksjon.",
        oppbygging: [
          "Stålramme med gipsinnlegg",
          "Monteres i utsparing i gipsvegg/himling",
          "Platekant avstives med profiler over og under",
          "50–100 mm klaring mellom stender og ramme",
        ],
        brannklasse: "EI 30",
        leverandor: "Gyproc / Saint-Gobain",
        referanse: "Gyproc Planex™ Branngipsluke EI 30 – Produktdatablad (Byggtjeneste)",
        referanseUrl: "https://cdn.byggtjeneste.no/nobb/b1e2e012-7e7f-4cb8-8552-28dea78bf176",
      },
    ],
  },
];

const ei60Kategorier: Kategori[] = [
  {
    navn: "Innervegger",
    icon: Home,
    eksempler: [
      {
        navn: "Norgips W112 — Dobbel gipsplatekledning",
        kortbeskrivelse: "Dobbel gips på stålstender. Oppnår EI 60.",
        beskrivelse: "Ikke-bærende branncellevegg med stålstendere og dobbel gipsplatekledning på begge sider. Dokumentert EI 60 iht. Norgips systemdokumentasjon.",
        oppbygging: [
          "2× 13 mm Norgips Standard gipsplate (hver side)",
          "Stålstender Norgips dB+ c/c 450 eller 600 mm",
          "Mineralull i hulrom (anbefalt for lyd)",
        ],
        brannklasse: "EI 60",
        lydklasse: "R'w 40–55 dB",
        tykkelse: "ca. 95–120 mm",
        leverandor: "Norgips",
        referanse: "Norgips – Innervegger W112",
        referanseUrl: "https://norgips.no/prosjektering/vegger-med-st%C3%A5l/innervegger",
      },
    ],
  },
];

const KonstruksjonDetalj = ({ eks }: { eks: KonstruksjonEksempel }) => (
  <div className="space-y-3 pt-1">
    <p className="text-sm text-muted-foreground leading-relaxed">{eks.beskrivelse}</p>
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Oppbygging</p>
      <ul className="text-sm space-y-1">
        {eks.oppbygging.map((lag, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground mt-1">•</span>
            <span>{lag}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
      {eks.tykkelse && <span>Tykkelse: <span className="text-foreground font-medium">{eks.tykkelse}</span></span>}
      <span>Leverandør: <span className="text-foreground font-medium">{eks.leverandor}</span></span>
    </div>
    {eks.merknader && (
      <p className="text-xs text-muted-foreground italic">ⓘ {eks.merknader}</p>
    )}
    <div className="pt-1 border-t border-border/50">
      <a
        href={eks.referanseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        {eks.referanse}
      </a>
    </div>
  </div>
);

const BranntekniskeKonstruksjoner = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Link to="/eksempelkatalog">
              <Button variant="ghost" size="sm" className="mb-4 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Eksempelkatalog
              </Button>
            </Link>
            <h2 className="text-3xl font-bold mb-2">Branntekniske konstruksjoner</h2>
            <p className="text-muted-foreground">
              Eksempler på branncellevegger, himlinger, gjennomføringer og detaljer med dokumenterte brannmotstandsklasser.
              Alle eksempler har referanse til opprinnelig kilde.
            </p>
          </div>

          {/* Brannklasse-seksjoner */}
          <Accordion type="multiple" defaultValue={["ei30"]}>
            {[
              { id: "ei30", tittel: "EI 30 konstruksjoner", beskrivelse: "30 minutters brannmotstand — integritet (E) og isolasjon (I)", kategorier: ei30Kategorier },
              { id: "ei60", tittel: "EI 60 konstruksjoner", beskrivelse: "60 minutters brannmotstand — integritet (E) og isolasjon (I)", kategorier: ei60Kategorier },
            ].map((seksjon) => (
              <AccordionItem key={seksjon.id} value={seksjon.id} className="border rounded-lg px-4 mb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Layers className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold">{seksjon.tittel}</h3>
                      <p className="text-sm text-muted-foreground">{seksjon.beskrivelse}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-2">
                    {seksjon.kategorier.map((kategori) => (
                      <div key={kategori.navn} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          <kategori.icon className="h-4 w-4" />
                          {kategori.navn}
                        </div>
                        <Accordion type="single" collapsible>
                          {kategori.eksempler.map((eks, idx) => (
                            <AccordionItem key={idx} value={`${seksjon.id}-${kategori.navn}-${idx}`} className="border rounded-lg px-4 mb-2">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex items-start justify-between gap-3 w-full pr-2">
                                  <div className="text-left">
                                    <p className="text-sm font-medium">{eks.navn}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{eks.kortbeskrivelse}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 shrink-0">
                                    <Badge variant="secondary" className="whitespace-nowrap text-xs">{eks.brannklasse}</Badge>
                                    {eks.lydklasse && <Badge variant="outline" className="whitespace-nowrap text-xs">{eks.lydklasse}</Badge>}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <KonstruksjonDetalj eks={eks} />
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Card className="shadow-soft border-dashed">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Flere brannklasser (EI 90, EI 120, REI) legges til fortløpende.
                Kun konstruksjoner med verifisert referanse til kilde blir inkludert.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BranntekniskeKonstruksjoner;
