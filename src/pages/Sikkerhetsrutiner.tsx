import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Download, ShieldCheck, ClipboardList, FileText, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const rutiner = [
  {
    id: "organisering",
    icon: Users,
    title: "Organisering og ansvar",
    description: "Roller, ansvar og kompetansekrav i brannteknisk prosjektering",
    content: [
      "Ansvarlig prosjekterende (PRO) skal ha relevant kompetanse innen brannteknisk prosjektering i henhold til SAK10 § 11-4.",
      "Det skal utpekes en prosjekteringsleder som koordinerer branntekniske grensesnitt mot andre fagområder (RIV, RIE, ARK, RIB).",
      "Alle involverte skal ha kjennskap til gjeldende regelverk, herunder TEK17, VTEK og relevante standarder.",
      "Kompetansekrav skal dokumenteres og arkiveres som del av prosjektets kvalitetssystem.",
    ],
  },
  {
    id: "planlegging",
    icon: ClipboardList,
    title: "Planlegging og oppstart",
    description: "Sjekklister og rutiner ved oppstart av brannteknisk prosjektering",
    content: [
      "Ved oppstart skal det gjennomføres en risikovurdering for å identifisere kritiske branntekniske forhold.",
      "Det skal utarbeides en prosjekteringsplan som beskriver omfang, grensesnitt, milepæler og leveranser.",
      "Relevante myndighetskrav og rammebetingelser skal kartlegges og dokumenteres tidlig i prosjektet.",
      "Det skal avklares om prosjektet krever uavhengig kontroll av brannteknisk prosjektering (tiltaksklasse 2 og 3).",
      "Forutsetninger og grensesnitt mot andre fag skal dokumenteres skriftlig.",
    ],
  },
  {
    id: "gjennomforing",
    icon: ShieldCheck,
    title: "Gjennomføring",
    description: "Rutiner under prosjekteringsfasen for å sikre kvalitet",
    content: [
      "Alle branntekniske løsninger skal dokumenteres med referanse til regelverk og standarder.",
      "Fravik fra preaksepterte ytelser skal analyseres og dokumenteres i henhold til anerkjent metodikk.",
      "Det skal gjennomføres regelmessige tverrfaglige møter for å avdekke grensesnittproblematikk.",
      "Tegninger og beskrivelser skal kvalitetssikres mot brannkonseptet før utsendelse.",
      "Endringer i prosjekteringsgrunnlaget skal vurderes for branntekniske konsekvenser og dokumenteres.",
    ],
  },
  {
    id: "kvalitetssikring",
    icon: CheckCircle,
    title: "Kvalitetssikring (KS)",
    description: "Internkontroll, sidemannskontroll og uavhengig kontroll",
    content: [
      "Brannkonseptet skal gjennomgå sidemannskontroll (KS1) før utsendelse til prosjektet.",
      "For tiltaksklasse 3 skal det gjennomføres uavhengig kontroll (KS2) av brannteknisk prosjektering.",
      "Kontrollrapporter skal dokumentere hva som er kontrollert, eventuelle avvik og status på lukking av avvik.",
      "Det skal føres logg over alle avvik og merknader fra kvalitetssikring, med ansvarlig og frist for lukking.",
      "Ferdig brannkonsept skal signeres av ansvarlig prosjekterende før oversendelse.",
    ],
  },
  {
    id: "avvik",
    icon: AlertTriangle,
    title: "Avvikshåndtering",
    description: "Rutiner for håndtering av avvik og endringer",
    content: [
      "Alle avvik fra brannkonseptet som oppdages under bygging skal meldes til ansvarlig prosjekterende.",
      "Avvik skal vurderes for sikkerhetsmessige konsekvenser og eventuelt kompenserende tiltak.",
      "Avviksmeldinger skal registreres, behandles og lukkes i prosjektets avvikssystem.",
      "Ved vesentlige avvik skal det vurderes om det er behov for oppdatert fraviksanalyse.",
      "Alle avvik og tilhørende tiltak skal inkluderes i sluttdokumentasjonen.",
    ],
  },
  {
    id: "dokumentasjon",
    icon: FileText,
    title: "Dokumentasjon og overlevering",
    description: "Krav til sluttdokumentasjon og overlevering",
    content: [
      "Sluttdokumentasjon skal inneholde oppdatert brannkonsept, fraviksanalyser og kontrollrapporter.",
      "Branntekniske tegninger skal være oppdatert i henhold til as-built.",
      "Forutsetninger for drift og vedlikehold av branntekniske installasjoner skal beskrives.",
      "Dokumentasjon skal overleveres til eier/forvalter i avtalt format og struktur.",
      "Det skal utarbeides en liste over branntekniske installasjoner med krav til periodisk kontroll.",
    ],
  },
];

const maler = [
  {
    title: "Sjekkliste – Oppstart brannteknisk prosjektering",
    description: "Sjekkliste for kartlegging av rammebetingelser og krav ved prosjektoppstart.",
  },
  {
    title: "Mal – Prosjekteringsplan brann",
    description: "Mal for utarbeidelse av prosjekteringsplan med milepæler og leveranser.",
  },
  {
    title: "Sjekkliste – Sidemannskontroll (KS1)",
    description: "Sjekkliste for gjennomføring av sidemannskontroll av brannkonsept.",
  },
  {
    title: "Mal – Avviksmelding brannteknisk",
    description: "Mal for registrering og oppfølging av branntekniske avvik.",
  },
  {
    title: "Sjekkliste – Overlevering brannteknisk dokumentasjon",
    description: "Sjekkliste for kontroll av sluttdokumentasjon ved overlevering.",
  },
];

const Sikkerhetsrutiner = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Sikkerhetsrutiner ved prosjektering</h2>
          </div>
          <p className="text-muted-foreground mt-2">
            Oversikt over anbefalte rutiner og prosedyrer for å sikre kvalitet og sikkerhet i brannteknisk prosjektering.
            Basert på krav i SAK10, TEK17 og god praksis i bransjen.
          </p>
        </div>

        {/* Rutinebeskrivelser */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Rutinebeskrivelser</h3>
          <Accordion type="multiple" className="space-y-3">
            {rutiner.map((rutine) => (
              <AccordionItem key={rutine.id} value={rutine.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                      <rutine.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{rutine.title}</p>
                      <p className="text-sm text-muted-foreground font-normal">{rutine.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <ul className="space-y-2 ml-12">
                    {rutine.content.map((punkt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-semibold mt-0.5 shrink-0">{i + 1}.</span>
                        <span>{punkt}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Maler og dokumenter */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Maler og dokumenter</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {maler.map((mal, i) => (
              <Card key={i} className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{mal.title}</CardTitle>
                  <CardDescription className="text-sm">{mal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" disabled className="opacity-60">
                    <Download className="h-4 w-4 mr-2" />
                    Kommer snart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sikkerhetsrutiner;
