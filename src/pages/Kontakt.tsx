import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";

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

        {/* Mer innhold (om oss / info) kan legges til her senere */}
      </div>
    </div>
  );
};

export default Kontakt;
