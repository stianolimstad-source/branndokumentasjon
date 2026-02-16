import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KonseptPreview from "@/components/konsept/KonseptPreview";

interface KonseptVisningProps {
  content: Record<string, any>;
  name: string;
}

const KonseptVisning = ({ content, name }: KonseptVisningProps) => {
  return (
    <Card className="shadow-medium flex flex-col overflow-hidden h-full">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-base">Brannkonsept: {name}</CardTitle>
        <p className="text-xs text-muted-foreground">Fryst versjon ved utsending til KS</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0 px-4 pb-4">
        <KonseptPreview formData={content || {}} />
      </CardContent>
    </Card>
  );
};

export default KonseptVisning;
