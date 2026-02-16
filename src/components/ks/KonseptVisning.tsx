import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface KonseptVisningProps {
  content: Record<string, any>;
  name: string;
}

const Field = ({ label, value }: { label: string; value: any }) => {
  if (!value || (typeof value === "string" && !value.trim())) return null;
  if (typeof value === "boolean") {
    return value ? (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{label}:</span>
        <Badge variant="secondary" className="text-xs">Ja</Badge>
      </div>
    ) : null;
  }
  return (
    <div className="space-y-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm whitespace-pre-line">{String(value)}</p>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const filtered = Array.isArray(children)
    ? children.filter(Boolean)
    : children;
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">{title}</h4>
      <div className="space-y-2 pl-2 border-l-2 border-muted">{filtered}</div>
    </div>
  );
};

const KonseptVisning = ({ content, name }: KonseptVisningProps) => {
  const c = content || {};

  const grunnlagsDocs = Array.isArray(c.grunnlagsdokumenter)
    ? c.grunnlagsdokumenter.filter((d: any) => d.navn).map((d: any) => `${d.navn}${d.dato ? ` (${d.dato})` : ""}`).join(", ")
    : "";

  const bygningsdeler = Array.isArray(c.bygningsdeler) && c.bygningsdeler.length > 0
    ? c.bygningsdeler.map((b: any) => `${b.navn || "Ukjent"}: ${b.bygningstype || ""} – ${b.risikoklasse || ""} / ${b.brannklasse || ""}`).join("\n")
    : "";

  return (
    <Card className="shadow-medium">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Brannkonsept: {name}</CardTitle>
        <p className="text-xs text-muted-foreground">Fryst versjon ved utsending til KS</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[60vh] px-6 pb-4">
          <Accordion type="multiple" className="space-y-1">
            <AccordionItem value="kap1" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">1. Innledning</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                <Field label="Oppdragsgiver" value={c.oppdragsgiver} />
                <Field label="Prosjektnavn" value={c.prosjektnavn} />
                <Field label="Adresse" value={c.adresse} />
                <Field label="Gnr/Bnr" value={[c.gnr, c.bnr].filter(Boolean).join("/")} />
                <Field label="Kommune" value={c.kommune} />
                <Field label="Bygningstype" value={c.bygningstype} />
                <Field label="Areal" value={c.areal ? `${c.areal} m²` : ""} />
                <Field label="Antall etasjer" value={c.etasjer} />
                <Field label="Tiltakstype" value={c.tiltakstype} />
                <Field label="Tiltaksbeskrivelse" value={c.tiltaksbeskrivelse} />
                <Separator />
                <Field label="Tiltakshaver" value={c.tiltakshaver} />
                <Field label="Ansvarlig søker" value={c.ansvarligSoker} />
                <Field label="PRO RIBr" value={c.proRibr} />
                <Field label="KPR RIBr" value={c.kprRibr} />
                <Field label="Tiltaksklasse" value={c.tiltaksklasse} />
                <Field label="Prosjekteringsmetode" value={c.prosjekteringsmetode} />
                <Field label="Avgrensning" value={c.avgrensning} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kap2" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">2. Grunnlag og forutsetninger</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                <Field label="Grunnlagsdokumenter" value={grunnlagsDocs} />
                <Field label="Risikoklasse" value={c.risikoklasse} />
                <Field label="Brannklasse" value={c.brannklasse} />
                <Field label="Brannklasse unntak" value={c.brannklasseUnntak} />
                {bygningsdeler && <Field label="Bygningsdeler" value={bygningsdeler} />}
                <Field label="Bæresystem" value={c.baeresystem} />
                <Field label="Tilleggskrav" value={c.tilleggskrav} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kap3" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">3. Branntekniske ytelseskrav</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Section title="§ 11-4 Bæreevne og stabilitet">
                  <Field label="Bæreevne" value={c.baereevne} />
                  <Field label="Kommentar" value={c.baereevneKommentar} />
                </Section>
                <Section title="§ 11-5 Sikkerhet ved eksplosjon">
                  <Field label="Relevans" value={c.eksplosjonRelevant === "relevant" ? "Relevant" : "Ikke relevant"} />
                  <Field label="Beskrivelse" value={c.eksplosjon} />
                  <Field label="Kommentar" value={c.eksplosjonKommentar} />
                </Section>
                <Section title="§ 11-6 Brannspredning mellom byggverk">
                  <Field label="Beskrivelse" value={c.brannspredning} />
                  <Field label="Kommentar" value={c.brannspredningKommentar} />
                </Section>
                <Section title="§ 11-7 Brannseksjoner">
                  <Field label="Beskrivelse" value={c.brannseksjoner} />
                  <Field label="Kommentar" value={c.brannseksjonerKommentar} />
                </Section>
                <Section title="§ 11-8 Brannceller">
                  <Field label="Beskrivelse" value={c.brannceller} />
                  <Field label="Kommentar" value={c.branncellerKommentar} />
                </Section>
                <Section title="§ 11-9 Materialer og produkter">
                  <Field label="Beskrivelse" value={c.materialer} />
                  <Field label="Kommentar" value={c.materialerKommentar} />
                </Section>
                <Section title="§ 11-10 Tekniske installasjoner">
                  <Field label="Beskrivelse" value={c.installasjoner} />
                  <Field label="Kommentar" value={c.installasjonerKommentar} />
                </Section>
                <Section title="§ 11-11 Generelle krav om rømning">
                  <Field label="Beskrivelse" value={c.romningSikkerhet} />
                  <Field label="Kommentar" value={c.romningSikkerhetKommentar} />
                </Section>
                <Section title="§ 11-12 Tiltak for rømnings-/redningstider">
                  <Field label="Kommentar" value={c.tilretteleggingKommentar} />
                </Section>
                <Section title="§ 11-13 Utgang fra branncelle">
                  <Field label="Beskrivelse" value={c.utgangBranncelle} />
                  <Field label="Kommentar" value={c.utgangBranncelleKommentar} />
                </Section>
                <Section title="§ 11-14 Rømningsvei">
                  <Field label="Beskrivelse" value={c.romningsvei} />
                  <Field label="Kommentar" value={c.romningsveiKommentar} />
                </Section>
                <Section title="§ 11-16 Manuell slokking">
                  <Field label="Beskrivelse" value={c.manuellSlokking} />
                  <Field label="Kommentar" value={c.manuellSlokkingKommentar} />
                </Section>
                <Section title="§ 11-17 Rednings- og slokkemannskap">
                  <Field label="Beskrivelse" value={c.redningsmannskap} />
                  <Field label="Kommentar" value={c.redningsmannskapKommentar} />
                </Section>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kap4" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">4. Utførelses- og driftsfasen</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                <Field label="Utførelsesfasen" value={c.utfoerelse} />
                <Field label="Driftsfasen" value={c.drift} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kap5" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">5. Revisjonshistorikk</AccordionTrigger>
              <AccordionContent className="pt-1">
                <Field label="Revisjon" value={c.revisjon} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kap6" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">6. Litteraturhenvisninger</AccordionTrigger>
              <AccordionContent className="pt-1">
                <Field label="Litteratur" value={c.litteratur} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default KonseptVisning;
