import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, FileCog, Handshake } from "lucide-react";

const Kontakt = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Kontakt</h1>
          <p className="text-muted-foreground">
            Ta gjerne kontakt ved spørsmål om Branndokumentasjon.no.
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Kontaktinformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="mailto:stian.olimstad@olimstadbrannrådgivning.no"
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-post</p>
                <p className="font-medium group-hover:underline break-all">
                  stian.olimstad@olimstadbrannrådgivning.no
                </p>
              </div>
            </a>

            <a href="tel:+4790701285" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium group-hover:underline">+47 90 70 12 85</p>
              </div>
            </a>
          </CardContent>
        </Card>

        <div className="space-y-6 mt-6">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileCog className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Egne maler og spesialløsninger</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Trenger bedriften din egne maler eller andre spesialløsninger for å bruke
                Branndokumentasjon.no? Ta kontakt, så finner vi en løsning som passer dere.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Samarbeid og videreutvikling</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Har du innspill, ønsker å samarbeide om videreutvikling av produktet, eller
                vurderer å investere? Vi tar gjerne en uforpliktende prat.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Kontakt;
