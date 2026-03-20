import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface KonstruksjonEksempel {
  navn: string;
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

const ei30Eksempler: KonstruksjonEksempel[] = [
  {
    navn: "Norgips W111 — Enkel stålstendervegg",
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
    navn: "Norgips W112 — Dobbel gipsplatekledning",
    beskrivelse: "Ikke-bærende branncellevegg med stålstendere og dobbel gipsplatekledning. Gir bedre lyd- og brannegenskaper enn W111.",
    oppbygging: [
      "2× 13 mm Norgips Standard gipsplate (hver side)",
      "Stålstender Norgips dB+ c/c 450 eller 600 mm",
      "Mineralull i hulrom (anbefalt for lyd)",
    ],
    brannklasse: "EI 30",
    lydklasse: "R'w 40–55 dB",
    tykkelse: "ca. 95–120 mm",
    leverandor: "Norgips",
    referanse: "Norgips – Innervegger W112",
    referanseUrl: "https://norgips.no/prosjektering/vegger-med-st%C3%A5l/innervegger",
  },
  {
    navn: "Gyproc PS himling — EI 30 nedforet himling",
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
  {
    navn: "Trekonstruksjon — Yttervegg med 30 min brannmotstand",
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
  {
    navn: "ROCKWOOL Rørgjennomføring — EI 30 til EI 120",
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
  {
    navn: "BB Stål Skilleveggsystem — SINTEF TG",
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
];

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

          <Accordion type="single" collapsible defaultValue="ei30">
            <AccordionItem value="ei30" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Layers className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold">EI 30 konstruksjoner</h3>
                    <p className="text-sm text-muted-foreground">30 minutters brannmotstand — integritet (E) og isolasjon (I)</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {ei30Eksempler.map((eks, idx) => (
                    <Card key={idx} className="shadow-soft">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{eks.navn}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed">{eks.beskrivelse}</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-1.5 shrink-0">
                            <Badge variant="secondary" className="whitespace-nowrap">{eks.brannklasse}</Badge>
                            {eks.lydklasse && <Badge variant="outline" className="whitespace-nowrap">{eks.lydklasse}</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card className="shadow-soft border-dashed">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Flere brannklasser (EI 60, EI 90, EI 120, REI) legges til fortløpende.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BranntekniskeKonstruksjoner;
